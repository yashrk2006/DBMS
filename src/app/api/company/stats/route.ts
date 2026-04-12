import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { AI_ENGINE } from '@/lib/ai-engine';
import { 
  Application as IApplication, 
  Student as IStudent, 
  Internship as IInternship, 
  Skill, 
  EnrichedCompanyApplication, 
  TalentDiscoveryProfile, 
  CompanyStats 
} from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'Company ID required' }, { status: 400 });
    }

    // 1. Fetch Company Data — auto-provision if not found (first login flow)
    let { data: company, error: companyError } = await supabase
      .from('company')
      .select('company_id, company_name, is_verified, email')
      .eq('company_id', companyId)
      .single();

    if (!company || companyError) {
      console.log(`🏢 Auto-provisioning company record for auth user: ${companyId}`);
      
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(companyId);
      const email = authUser?.email || `company_${companyId.slice(0, 8)}@platform.com`;
      const displayName = authUser?.user_metadata?.company_name 
        || authUser?.user_metadata?.full_name 
        || email.split('@')[0];

      const { data: newCompany, error: createError } = await supabase
        .from('company')
        .upsert({
          company_id: companyId,
          email,
          company_name: displayName,
          is_verified: true,
          industry: 'Technology',
          location: 'India'
        }, { onConflict: 'company_id' })
        .select('company_id, company_name, is_verified, email')
        .single();

      if (createError) {
        console.error('❌ Company auto-provision failed:', createError.message);
        return NextResponse.json({ success: false, error: 'Company provisioning failed.' }, { status: 500 });
      }
      company = newCompany;
    }

    // 2. Fetch Company Internships with Requirements
    const { data: internshipsRaw } = await supabase
      .from('internship')
      .select(`
        internship_id,
        title,
        internship_type,
        openings,
        deadline,
        perks,
        company_id,
        internship_skill(skill(skill_name))
      `)
      .eq('company_id', companyId);

    const internships: IInternship[] = (internshipsRaw || []).map((i: any) => ({
      id: i.internship_id.toString(),
      internship_id: i.internship_id,
      company_id: i.company_id,
      company_name: company.company_name, // Company name already known
      title: i.title,
      description: '', // Description not needed for stats comparison
      type: i.internship_type || 'Remote',
      openings: i.openings || 1,
      deadline: i.deadline,
      perks: i.perks,
      status: 'Open',
      requirements: {
          role_skills: i.internship_skill?.map((ir: any) => ir.skill.skill_name) || []
      }
    } as any));

    // 3. Fetch Applications for the company with student info
    const internshipIds = internships.map((i: any) => i.internship_id);
    const { data: filteredAppsRaw } = await supabase
      .from('application')
      .select(`
        application_id,
        status,
        applied_date,
        internship_id,
        student(
          student_id, 
          name, 
          roll_no, 
          student_skill(skill(skill_name)), 
          ai_resume_analysis, 
          resume_url
        ),
        internship(title, internship_type)
      `)
      .in('internship_id', internshipIds);

    const enrichedApplications: EnrichedCompanyApplication[] = (filteredAppsRaw || []).map((app: any) => {
      const studentSkills = app.student?.student_skill?.map((sk: any) => sk.skill.skill_name) || [];
      const role = internships.find(i => i.internship_id === app.internship_id);
      const requiredSkills = role?.requirements.role_skills || [];
      
      const matchScore = AI_ENGINE.calculateMatchScore(studentSkills, requiredSkills);
      const interviewQuestions = (app.student && role) ? AI_ENGINE.generateInterviewQuestions(studentSkills, role.title) : [];

      return {
        application_id: app.application_id,
        student_id: app.student?.student_id || '',
        internship_id: app.internship_id.toString(),
        company_id: companyId,
        status: app.status,
        applied_date: app.applied_date,
        student_name: app.student?.name || 'Unknown',
        student_roll_no: app.student?.roll_no || 'N/A',
        student_skills: studentSkills,
        role_title: app.internship?.title || 'Unknown Role',
        match_score: matchScore,
        ai_interview_guide: interviewQuestions,
        resume_analysis: app.student?.ai_resume_analysis ? {
          ...app.student.ai_resume_analysis,
          resume_url: app.student.resume_url
        } : undefined
      };
    });

    // 4. Talent Discovery: Find top students not yet applied
    const { data: allStudentsRaw } = await supabase
      .from('student')
      .select('student_id, name, student_skill(skill(skill_name)), ai_resume_analysis');

    const appliedStudentIds = new Set(enrichedApplications.map((a) => a.student_id));
    
    const talentPool: TalentDiscoveryProfile[] = (allStudentsRaw || [])
      .filter((s: any) => !appliedStudentIds.has(s.student_id))
      .map((s: any) => {
        const studentSkills = s.student_skill?.map((sk: any) => sk.skill.skill_name) || [];
        
        const matches = internships.map((intern) => ({
          roleId: intern.id,
          title: intern.title,
          score: AI_ENGINE.calculateMatchScore(studentSkills, intern.requirements.role_skills)
        })).sort((a, b) => b.score - a.score);

        const bestMatch = matches[0] || null;

        return {
          id: s.student_id,
          name: s.name || 'Anonymous Student',
          skills: studentSkills,
          resume_score: s.ai_resume_analysis?.score || 0,
          top_match: bestMatch ? {
            roleId: bestMatch.roleId,
            role: bestMatch.title,
            score: bestMatch.score
          } : null
        };
      })
      .filter((s: TalentDiscoveryProfile) => s.top_match !== null && s.top_match.score > 60)
      .sort((a: TalentDiscoveryProfile, b: TalentDiscoveryProfile) => (b.top_match?.score || 0) - (a.top_match?.score || 0))
      .slice(0, 5);

    const stats: CompanyStats = {
      activeRoles: internships.length,
      totalApplicants: enrichedApplications.length,
      pendingReview: enrichedApplications.filter((a) => a.status === 'Pending').length,
      interviewsScheduled: enrichedApplications.filter((a) => a.status === 'Interviewing').length,
      isVerified: company.is_verified
    };

    return NextResponse.json({
      success: true,
      stats,
      internships,
      applications: enrichedApplications,
      talentDiscovery: talentPool
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Company Stats Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
