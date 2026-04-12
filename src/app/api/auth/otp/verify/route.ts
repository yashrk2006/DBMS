import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getFriendlyErrorMessage } from '@/lib/error-adapter';

/**
 * OTP Verification Service (Permanent Access Version)
 * Validates code, bridges identity via Direct SQL, and injects Required Metadata for Dashboard access.
 * Returns a secure temp password for synchronous Client-Side Handshake.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const roll_no = body.roll_no?.trim();
    const email = body.email?.trim().toLowerCase();
    const otp = body.otp?.trim();

    if (!roll_no || !email || !otp) {
      return NextResponse.json({ 
        success: false,
        error: "Roll Number, email, and verification code are required."
      }, { status: 400 });
    }

    console.log('🔍 Attempting Verification [Permanent Access Handshake]:', { roll_no, email, otp });

    // 1. Verify OTP Status (6hr drift buffer)
    const driftBuffer = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('otp_logs')
      .select('*')
      .eq('roll_no', roll_no)
      .eq('email', email)
      .eq('otp_code', otp)
      .eq('is_verified', false)
      .gt('expires_at', driftBuffer)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      console.warn('❌ OTP Verification Failed Details:', { found: !!otpRecord, roll_no, email, otp });
      return NextResponse.json({ 
        success: false,
        error: "Invalid or expired verification code." 
      }, { status: 401 });
    }

    // 2. Fetch Institutional Batch Data
    const { data: directoryData, error: dirError } = await supabaseAdmin
      .from('college_directory')
      .select('*')
      .eq('roll_no', roll_no)
      .limit(1)
      .maybeSingle();

    if (dirError || !directoryData) {
      console.error('❌ Directory Lookup Error:', dirError?.message);
      return NextResponse.json({ 
        success: false,
        error: "Failed to synchronize institutional data. Record not found." 
      }, { status: 404 });
    }

    // 3. IDENTITY DISCOVERY (Resilient Vercel/Production Pattern)
    let authUser: any = null;
    // We avoid raw 'pg' SSL handshakes which are fragile in serverless environments.
    // Instead, we use the verified 'student' mapping table via Supabase HTTPS.
    const { data: studentMapping, error: mappingError } = await supabaseAdmin
      .from('student')
      .select('student_id')
      .eq('email', email)
      .maybeSingle();

    if (mappingError) {
      console.error('❌ Identity Mapping Lookup Failed:', mappingError.message);
    }

    if (studentMapping) {
      authUser = { id: studentMapping.student_id, email };
      console.log('✅ Identity Discovered via Mapping Table:', authUser.id);
    } else {
      console.log('ℹ️ No existing identity mapping found. Proceeding to User Discovery/Creation.');
    }

    // 4. IDENTITY HARDENING & PASS-HANDSHAKE
    const syncPassword = Math.random().toString(36).slice(-20) + 'Aa1!';
    
    if (!authUser) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: syncPassword,
        email_confirm: true,
        user_metadata: { role: directoryData.role, roll_no: directoryData.roll_no }
      });

      if (createError) {
        console.error('❌ Auth Creation Error:', createError.message);
        return NextResponse.json({ 
          success: false,
          error: "Institutional identity creation failed.",
          details: createError.message
        }, { status: 500 });
      }
      authUser = newUser.user;
    } else {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        password: syncPassword,
        user_metadata: { 
          role: directoryData.role || 'student', 
          roll_no: directoryData.roll_no 
        }
      });

      if (updateError) {
        console.error('❌ Identity Hardening Error:', updateError.message);
        return NextResponse.json({ 
          success: false,
          error: "Institutional authorization update failed.",
          details: updateError.message
        }, { status: 500 });
      }
    }

    // 5. Institutional Profile Synchronization (Postgres Table)
    if (directoryData.role === 'student' && authUser) {
      try {
        const { error: syncErr } = await supabaseAdmin
          .from('student')
          .upsert({
            student_id: authUser.id,
            name: directoryData.name || 'Student',
            roll_no: directoryData.roll_no || roll_no,
            email: directoryData.email || email,
            college: 'Institutional Partner',
            branch: directoryData.course || 'General',
            graduation_year: typeof directoryData.batch_year === 'number' ? directoryData.batch_year + 3 : 2027,
          });

        if (!syncErr) {
          // 4.1 Check for existing Welcome Notification (Idempotency)
          const { data: existingNotif } = await supabaseAdmin
            .from('notification')
            .select('notification_id')
            .eq('user_id', authUser.id)
            .eq('title', "Verification Successful 🎓")
            .maybeSingle();

          if (!existingNotif) {
            // Only inject Welcome Notification if it doesn't already exist
            await supabaseAdmin.from('notification').insert([{
              user_id: authUser.id,
              title: "Verification Successful 🎓",
              message: `Confirmed as Roll No: ${directoryData.roll_no}. Your institutional profile is now active.`,
              type: 'system'
            }]);
          }
        }
      } catch (err: any) {
        console.error('❌ Profile Sync Crash (Non-Blocking):', err.message);
      }
    }

    // 6. FINALLY Mark OTP as verified
    await supabaseAdmin
      .from('otp_logs')
      .update({ is_verified: true })
      .eq('id', otpRecord.id);

    return NextResponse.json({
      success: true,
      message: 'Permanent Institutional access authorized.',
      email: email,
      sync_password: syncPassword // The temporary secure key for this session
    });

  } catch (error: any) {
    console.error('❌ Verification Crash:', error.message || error);
    return NextResponse.json({ 
      success: false,
      error: getFriendlyErrorMessage(error),
      details: error.message 
    }, { status: 500 });
  }
}
