import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { AI_ENGINE } from '@/lib/ai-engine';
import { Student as IStudent, Internship as IInternship, Application as IApplication, Skill as ISkill } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    // 1. Fetch Student Data - Optimized Selection
    const { data: studentData, error: studentError } = await supabase
      .from('student')
      .select('student_id, name, email, roll_no, college, cgpa, ai_resume_analysis')
      .eq('student_id', userId)
      .single();

    if (studentError || !studentData) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // 2. Fetch Student Skills
    const { data: skilledData, error: skillsError } = await supabase
      .from('student_skill')
      .select('proficiency_level, skill(skill_id, skill_name, category)')
      .eq('student_id', userId);

    const studentSkills = (skilledData || []).map((s: any) => ({
      skill_name: s.skill?.skill_name || 'Legacy Skill',
      level: s.proficiency_level || 'Beginner'
    }));

    // 3. Fetch All Internships (for AI matching) - Optimized Selection
    const { data: allInternshipsRaw, error: internError } = await supabase
      .from('internship')
      .select(`
        internship_id,
        title,
        description,
        duration,
        stipend,
        location,
        company_id,
        min_cgpa,
        company:company_id (company_name),
        internship_skill (
          skill (skill_name)
        )
      `);

    const allInternships: IInternship[] = (allInternshipsRaw || []).map((i: any) => ({
      id: i.internship_id.toString(),
      internship_id: i.internship_id,
      company_id: i.company_id,
      company_name: i.company?.company_name || 'Independent',
      title: i.title,
      description: i.description,
      duration: i.duration,
      stipend: i.stipend,
      location: i.location,
      status: 'Open',
      min_cgpa: i.min_cgpa || 0,
      requirements: {
        role_skills: i.internship_skill?.map((ir: any) => ir.skill.skill_name) || [],
        experience_level: 'Entry'
      },
      required_skills: i.internship_skill?.map((ir: any) => ir.skill.skill_name) || []
    }));

    // 4. Fetch Applications for this student - Optimized Selection
    const { data: allApplicationsRaw, error: appsError } = await supabase
      .from('application')
      .select(`
        application_id,
        student_id,
        internship_id,
        status,
        applied_date,
        ai_match_score,
        internship:internship_id (
          title,
          company:company_id (company_name)
        )
      `)
      .eq('student_id', userId);

    const allApplications: IApplication[] = (allApplicationsRaw || []).map((a: any) => ({
      application_id: a.application_id.toString(),
      student_id: a.student_id,
      internship_id: a.internship_id?.toString(),
      company_id: '', // placeholder if not directly in join
      status: a.status as any,
      applied_date: a.applied_date,
      ai_match_score: a.ai_match_score || 0,
      role_title: a.internship?.title,
      company_name: a.internship?.company?.company_name
    }));

    // AI Features: Skill Evolution Predictor
    const skillList = studentSkills.map(s => s.skill_name);
    const marketReach = AI_ENGINE.calculateMarketReach(skillList, allInternships);
    const highImpactSkill = AI_ENGINE.getHighImpactSkill(skillList, allInternships);

    // Update student's market reach in DB (Proactive Intelligence)
    try {
      await supabase
        .from('student')
        .update({ market_reach: marketReach })
        .eq('student_id', userId);
    } catch (e) {
      console.warn("Market reach persistence delay - column might be missing.");
    }

    return NextResponse.json({
      success: true,
      student: {
        id: studentData.student_id,
        name: studentData.name,
        email: studentData.email,
        roll_no: studentData.roll_no,
        college: studentData.college,
        cgpa: studentData?.cgpa || 0,
        skills: studentSkills,
        market_reach: marketReach,
        high_impact_skill: highImpactSkill,
        ai_resume_analysis: studentData.ai_resume_analysis
      },
      stats: {
        applications: allApplications.length,
        skills: studentSkills.length,
        internships: allInternships.length,
        accepted: allApplications.filter(a => a.status === 'Accepted').length
      },
      recentApplications: allApplications.slice(0, 4)
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
