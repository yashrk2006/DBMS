import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getFriendlyErrorMessage } from '@/lib/error-adapter';

/**
 * Institutional Identity Lookup
 * Accepts a Roll Number or Enrollment ID and verifies membership in the batch.
 */
export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json({ error: 'Institutional Roll Number or Enrollment ID is required for access.' }, { status: 400 });
    }

    // Query the Institutional Directory (bypassing RLS with Admin client)
    const { data, error } = await supabaseAdmin
      .from('college_directory')
      .select('name, roll_no, enrollment_no, course, branch, batch_year')
      .or(`roll_no.eq.${identifier},enrollment_no.eq.${identifier}`)
      .single();

    if (error || !data) {
      console.warn('❌ Institutional lookup sync failure for:', identifier);
      
      // Standardize the not-found error
      const errorMessage = (error && error.code !== 'PGRST116') 
        ? getFriendlyErrorMessage(error)
        : 'Record not found in the verified institutional batch directory.';

      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      student: {
        name: data.name,
        roll_no: data.roll_no,
        enrollment_no: data.enrollment_no,
        course: data.course,
        branch: data.branch,
        batch_year: data.batch_year
      }
    });

  } catch (error: any) {
    console.error('❌ Lookup Critical Crash:', error.message || error);
    return NextResponse.json({ 
        error: getFriendlyErrorMessage(error)
    }, { status: 500 });
  }
}
