import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { AI_ENGINE } from '@/lib/ai-engine';

export async function GET() {
  try {
    // 1. Unified High-Performance Fetch Pipeline
    const [
      counts,
      dataRaw,
      recentAppsRawData
    ] = await Promise.all([
      // Basic Counts
      Promise.all([
        supabaseAdmin.from('student').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('college_directory').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('internship').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('application').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('company').select('*', { count: 'exact', head: true })
      ]),
      // Raw Data for AI
      Promise.all([
        supabaseAdmin.from('student').select('student_id, name, student_skill(skill(skill_name))'),
        supabaseAdmin.from('internship').select('internship_id, title, internship_skill(skill(skill_name))'),
        supabaseAdmin.from('application').select('*').limit(20).order('applied_date', { ascending: false }),
        supabaseAdmin.from('skill').select('skill_name')
      ]),
      // Recent Activity
      supabaseAdmin.from('application').select('application_id, applied_date, status, student(name), internship(title)').order('applied_date', { ascending: false }).limit(10)
    ]);

    const [studentCount, directoryCount, internshipCount, applicationCount, companyCount] = counts.map(c => c.count || 0);
    const [studentsRaw, internshipsRaw, applicationsRaw, allSkills] = dataRaw.map(r => r.data);
    const recentAppsRaw = recentAppsRawData.data;

    const internships = (internshipsRaw || []).map((i: any) => ({
        id: i.internship_id.toString(),
        title: i.title,
        requirements: {
            role_skills: i.internship_skill?.map((ir: any) => ir.skill.skill_name) || []
        }
    }));

    const students = (studentsRaw || []).map((s: any) => ({
        id: s.student_id,
        name: s.name,
        skills: s.student_skill?.map((sk: any) => ({ skill_name: sk.skill.skill_name })) || []
    }));

    // Placement Support: At-Risk Students with Intensity Scoring
    const atRisk = students.map((s: any) => {
        const studentAppsCount = (applicationsRaw || []).filter((a: any) => a.student_id === s.id).length;
        const studentSkillsNames = s.skills.map((sk: any) => sk.skill_name);
        const marketReach = AI_ENGINE.calculateMarketReach(studentSkillsNames, internships as any);
        
        // Intensity Mapping
        let riskReason = '';
        let riskScore = 0;
        
        if (studentAppsCount === 0) {
            riskReason = 'Zero Applications (Inactive)';
            riskScore = 85;
        } else if (marketReach < 20) {
            riskReason = 'Critical Skill Gap';
            riskScore = 95;
        } else if (marketReach < 40) {
            riskReason = 'Low Market Alignment';
            riskScore = 60;
        }

        const intensity = riskScore > 80 ? 'HIGH' : riskScore > 50 ? 'MEDIUM' : 'LOW';

        return {
            student_id: s.id,
            name: s.name,
            reason: riskReason,
            marketReach,
            riskScore,
            intensity
        };
    })
    .filter((s: any) => s.reason !== '')
    .sort((a: any, b: any) => b.riskScore - a.riskScore)
    .slice(0, 6);

    // Platform Insights: Skill Alignment
    const marketEquilibrium = AI_ENGINE.getMarketEquilibrium(students as any, internships as any);

    const recentActivity = (recentAppsRaw || []).map((app: any) => ({
      id: app.application_id,
      type: 'APPLICATION',
      title: `${app.student?.name} applied for ${app.internship?.title}`,
      timestamp: app.applied_date,
      status: app.status
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
            students: (studentCount || 0) + (directoryCount || 0),
            companies: companyCount || 0,
            internships: internshipCount || 0,
            applications: applicationCount || 0
        },
        recentApplications: applicationsRaw || [],
        recentActivity,
        skills: allSkills || [],
        atRisk,
        marketEquilibrium
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Admin Stats Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
