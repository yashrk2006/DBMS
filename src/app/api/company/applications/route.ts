import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { AI_ENGINE } from '@/lib/ai-engine';
import { notifyStatusUpdate } from '@/lib/notifications';
import { EnrichedCompanyApplication } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'Company ID required' }, { status: 400 });
    }

    // 1. Fetch Company Internships (to filter applications)
    const { data: internships } = await supabase
      .from('internship')
      .select(`
        internship_id, 
        title, 
        internship_skill(skill(skill_name))
      `)
      .eq('company_id', companyId);

    const internIds = (internships || []).map((i: any) => i.internship_id);

    // 2. Fetch Applications for those internships
    const { data: applications, error } = await supabase
      .from('application')
      .select(`
        application_id,
        status,
        applied_date,
        internship_id,
        student(
          student_id, 
          name, 
          email, 
          college, 
          branch, 
          graduation_year, 
          roll_no,
          student_skill(skill(skill_name)),
          ai_resume_analysis,
          resume_url
        ),
        internship(title)
      `)
      .in('internship_id', internIds)
      .order('applied_date', { ascending: false });

    if (error) throw error;

    // 3. Enrich with AI matching logic
    const enriched: EnrichedCompanyApplication[] = (applications || []).map((app: any) => {
      const studentSkills = app.student?.student_skill?.map((sk: any) => sk.skill.skill_name) || [];
      const role = internships?.find((i: any) => i.internship_id === app.internship_id);
      const requiredSkills = role?.internship_skill?.map((ir: any) => ir.skill.skill_name) || [];

      const matchScore = AI_ENGINE.calculateMatchScore(studentSkills, requiredSkills);
      const aiInterviewQuestions = (app.student && role) ? AI_ENGINE.generateInterviewQuestions(studentSkills, role.title) : [];

      return {
        application_id: app.application_id.toString(),
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
        resume_analysis: app.student?.ai_resume_analysis ? {
          ...app.student.ai_resume_analysis,
          resume_url: app.student.resume_url
        } : undefined,
        interview_score: app.interview_score,
        interview_notes: app.interview_notes,
        interview_logs: app.interview_logs
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { application_id, applicationId, status, interview_score, interview_notes, interview_logs } = body;
    const id = application_id || applicationId;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });
    }

    // 1. Fetch current application state to get context for email
    const { data: application, error: fetchError } = await supabase
      .from('application')
      .select(`
        application_id,
        status,
        student(student_id, name, email),
        internship(title)
      `)
      .eq('application_id', id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json({ success: false, error: 'Application context not found' }, { status: 404 });
    }

    // 2. Update status and metrics
    
    const { data: updated, error } = await supabase
      .from('application')
      .update({ 
        status,
        ...(interview_score !== undefined && { interview_score }),
        ...(interview_notes !== undefined && { interview_notes }),
        ...(interview_logs !== undefined && { interview_logs }),
        ...(body.video_url !== undefined && { video_url: body.video_url })
      })
      .eq('application_id', id)
      .select()
      .single();

    if (error) throw error;
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    // 3. Trigger Notification
    try {
      const student = (application as any).student;
      const internship = (application as any).internship;

      if (student?.email && student?.student_id) {
          await notifyStatusUpdate(
            student.student_id,
            student.email,
            student.name,
            internship.title,
            status
          );
      }
    } catch (notifyError) {
      console.warn('⚠️ Status update notification failed:', notifyError);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

