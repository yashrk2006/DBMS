import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { studentId, internshipId, companyId, status = 'Pending' } = await request.json();

    if (!studentId || !internshipId) {
      return NextResponse.json({ success: false, error: 'Student ID and Internship ID required' }, { status: 400 });
    }

    // 1. Check for existing application
    const { data: existing, error: checkError } = await supabase
      .from('application')
      .select('application_id')
      .eq('student_id', studentId)
      .eq('internship_id', internshipId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: false, error: 'You have already applied for this position.' }, { status: 400 });
    }

    // 2. Insert Application
    const { data: application, error: insertError } = await supabase
      .from('application')
      .insert([{
        student_id: studentId,
        internship_id: internshipId,
        company_id: companyId,
        status,
        applied_date: new Date().toISOString()
      }])
      .select(`
        application_id,
        internship:internship_id (
          title,
          company:company_id (company_name)
        )
      `)
      .single();

    if (insertError) throw insertError;

    // 3. Trigger Notification
    try {
      const appData = application as any;
      const internship = appData.internship;
      const title = internship?.title || 'the position';
      const companyName = internship?.company?.company_name || 'the company';

      await supabase.from('notification').insert({
        user_id: studentId,
        title: 'Application Deployed',
        message: `Your application for ${title} at ${companyName} has been successfully registered.`,
        type: 'success'
      });
    } catch (notifErr) {
      console.warn("Notification trigger failed:", notifErr);
    }

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    console.error('Application API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
