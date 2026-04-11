import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getFriendlyErrorMessage } from '@/lib/error-adapter';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Institutional Identity ID (userId) is required.' }, { status: 400 });
    }

    // 1. Fetch Student Profile using Admin Client (bypassing RLS)
    let { data: student, error: studentError } = await supabaseAdmin
      .from('student')
      .select('*')
      .eq('student_id', userId)
      .maybeSingle();

    // 2. Intelligent Fallback: If student doesn't exist, check Institutional Sync logs
    if (!student || studentError) {
      console.log(`📡 Profile missing for ${userId}, checking institutional logs...`);
      
      // Try to find a roll_no linked to this user in otp_logs or auth metadata
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
      const rollNo = user?.user_metadata?.roll_no;
      
      if (rollNo) {
        // Find data from college directory to pre-fill
        const { data: dirData } = await supabaseAdmin
          .from('college_directory')
          .select('*')
          .eq('roll_no', rollNo)
          .maybeSingle();

        if (dirData) {
          const { data: newUser, error: createError } = await supabaseAdmin
            .from('student')
            .insert([{ 
              student_id: userId, 
              email: user.email || '', 
              name: dirData.name || user.user_metadata?.full_name || 'Verified Student',
              roll_no: rollNo,
              college: 'Institutional Partner',
              branch: dirData.course || '',
              graduation_year: (dirData.batch_year || 2024) + 3
            }])
            .select()
            .single();
          
          if (!createError) student = newUser;
        }
      }

      // Final fallback if still missing
      if (!student) {
        const { data: newUser } = await supabaseAdmin
          .from('student')
          .insert([{ student_id: userId, email: '', name: 'Verified Student' }])
          .select()
          .single();
        student = newUser;
      }
    }

    const [appCountRes, skillsCountRes] = await Promise.all([
      supabaseAdmin.from('application').select('*', { count: 'exact', head: true }).eq('student_id', userId),
      supabaseAdmin.from('student_skill').select('*', { count: 'exact', head: true }).eq('student_id', userId)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          name: student?.name,
          roll_no: student?.roll_no || 'NOT_SYNCED',
          college: student?.college,
          branch: student?.branch,
          graduation_year: student?.graduation_year,
          resume_url: student?.resume_url,
          email: student?.email,
          cgpa: student?.cgpa
        },
        stats: {
          skills: skillsCountRes.count || 0,
          applications: appCountRes.count || 0
        }
      }
    });
  } catch (error: unknown) {
    console.error('❌ Profile Fetch Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: getFriendlyErrorMessage(error) 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, profile } = await request.json();

    if (!userId || !profile) {
      return NextResponse.json({ success: false, error: 'Identity ID and Profile payload are required.' }, { status: 400 });
    }

    // Retrieve verified email from auth system to satisfy NOT NULL db constraint during upsert
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
    const verifiedEmail = user?.email || profile.email || `${userId}@placeholder.com`;

    const { data: updated, error } = await supabaseAdmin
      .from('student')
      .upsert({
        student_id: userId,
        email: verifiedEmail,
        name: profile.name || 'Verified Student',
        college: profile.college,
        branch: profile.branch,
        roll_no: profile.roll_no,
        graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : null,
        cgpa: profile.cgpa ? parseFloat(profile.cgpa) : null,
        resume_url: profile.resume_url || null
      } as any, { onConflict: 'student_id' })
      .select()
      .single();

    if (error) {
      console.error('❌ Profile Update Error:', error.message);
      return NextResponse.json({ 
        success: false, 
        error: getFriendlyErrorMessage(error)
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error('❌ Profile Update Crash:', error);
    return NextResponse.json({ 
      success: false, 
      error: getFriendlyErrorMessage(error) 
    }, { status: 500 });
  }
}
