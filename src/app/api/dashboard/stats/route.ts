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

    // Parallel execution pipeline for high-performance retrieval
    const [studentResponse, skillsResponse, internsResponse, appsResponse] = await Promise.all([
      supabase.from('student').select('student_id, name, email, roll_no, college, cgpa, ai_resume_analysis').eq('student_id', userId).single(),
      supabase.from('student_skill').select('proficiency_level, skill(skill_id, skill_name, category)').eq('student_id', userId),
      supabase.from('internship').select('internship_id, title, description, duration, stipend, location, company_id, min_cgpa, company:company_id (company_name), internship_skill (skill (skill_name))'),
      supabase.from('application').select('application_id, student_id, internship_id, status, applied_date, ai_match_score, interview_score, interview_notes, interview_logs, internship:internship_id (title, company:company_id (company_name))').eq('student_id', userId)
    ]);

    let studentData = studentResponse.data;

    // Auto-provisioning for New Students (First Login Flow)
    if (studentResponse.error || !studentData) {
      console.log(`🎓 Auto-provisioning student record for user: ${userId}`);
      
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
      const email = authUser?.email || `student_${userId.slice(0, 8)}@university.edu`;
      const displayName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || email.split('@')[0];

      const { data: newStudent, error: createError } = await supabase
        .from('student')
        .upsert({
          student_id: userId,
          email,
          name: displayName,
          roll_no: authUser?.user_metadata?.roll_no || `R-${userId.slice(0, 6).toUpperCase()}`,
          college: 'Institutional Partner',
          cgpa: 0
        }, { onConflict: 'student_id' })
        .select('student_id, name, email, roll_no, college, cgpa, ai_resume_analysis')
        .single();

      if (createError) {
        console.error('❌ Student auto-provision failed:', createError.message);
        return NextResponse.json({ success: false, error: 'Student provisioning failed.' }, { status: 500 });
      }
      studentData = newStudent;
    }
    const studentSkills = (skillsResponse.data || []).map((s: any) => ({
      skill_name: s.skill?.skill_name || 'Legacy Skill',
      level: s.proficiency_level || 'Beginner'
    }));

    const allInternships: IInternship[] = (internsResponse.data || []).map((i: any) => ({
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

    const allApplications: IApplication[] = (appsResponse.data || []).map((a: any) => ({
      application_id: a.application_id.toString(),
      student_id: a.student_id,
      internship_id: a.internship_id?.toString(),
      company_id: '',
      status: a.status as any,
      applied_date: a.applied_date,
      ai_match_score: a.ai_match_score || 0,
      role_title: a.internship?.title,
      company_name: a.internship?.company?.company_name,
      interview_score: a.interview_score,
      interview_notes: a.interview_notes,
      interview_logs: a.interview_logs
    }));

    // Post-processing
    const skillList = studentSkills.map((s: any) => s.skill_name);
    const marketReach = AI_ENGINE.calculateMarketReach(skillList, allInternships);
    const highImpactSkill = AI_ENGINE.getHighImpactSkill(skillList, allInternships);

    // Non-blocking background sync
    supabase.from('student').update({ market_reach: marketReach }).eq('student_id', userId).then(({ error }: { error: any }) => {
      if (error) console.warn("Background market reach sync failed:", error.message);
    });

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
