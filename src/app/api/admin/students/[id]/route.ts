import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    // 1. Fetch Student Details
    const { data: student, error: studentError } = await supabaseAdmin
      .from('student')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (studentError) throw studentError;

    // 2. Fetch Applications with Internship details
    const { data: applications, error: appsError } = await supabaseAdmin
      .from('application')
      .select('*, internship:internship_id(title, company:company_id(company_name))')
      .eq('student_id', studentId)
      .order('applied_date', { ascending: false });

    if (appsError) throw appsError;

    // 3. Fetch Notifications (Things student does/sees)
    const { data: notifications, error: notifError } = await supabaseAdmin
      .from('notification')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        student,
        applications,
        notifications
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
