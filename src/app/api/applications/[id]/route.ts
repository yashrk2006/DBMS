import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { getFriendlyErrorMessage } from '@/lib/error-adapter';

// Route: /api/applications/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;

    if (!applicationId) {
      return NextResponse.json({ success: false, error: 'Application ID is required.' }, { status: 400 });
    }

    // Fetch application details with internship and student skills
    const { data: application, error } = await supabase
      .from('application')
      .select(`
        *,
        internship (
          *,
          internship_skill (
            skill (skill_name)
          )
        ),
        student (
          *,
          student_skill (
            skill (skill_name)
          )
        )
      `)
      .eq('application_id', applicationId)
      .single();

    if (error) {
      console.error('❌ Application Single Retrieval Error:', error.message);
      return NextResponse.json({ success: false, error: getFriendlyErrorMessage(error) }, { status: 500 });
    }

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });
    }

    // Format the response for the Interview Simulator UI
    const formattedData = {
      internship: {
        ...application.internship,
        requirements: {
          role_skills: (application.internship.internship_skill || []).map((s: any) => s.skill.skill_name)
        }
      },
      student: {
        ...application.student,
        skills: (application.student.student_skill || []).map((s: any) => s.skill.skill_name)
      },
      status: application.status,
      ai_match_score: application.ai_match_score,
      ai_interview_questions: application.ai_interview_questions
    };

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: unknown) {
    console.error('❌ Application Single GET Crash:', error);
    return NextResponse.json({ success: false, error: getFriendlyErrorMessage(error) }, { status: 500 });
  }
}
