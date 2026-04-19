import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getFriendlyErrorMessage } from '@/lib/error-adapter';
import { Resend } from 'resend';

// Initialize Resend if API key is present
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * DBMS Project OTP Dispatch Service
 * Generates a 6-digit verification code and stores it in the database.
 * Attempts to send via Resend email service, falls back to local auto-verify.
 */
export async function POST(request: Request) {
  try {
    const { roll_no, email } = await request.json();

    if (!roll_no || !email) {
      return NextResponse.json({ 
        success: false,
        error: "Roll Number and Institutional Email are required." 
      }, { status: 400 });
    }

    // Double check the roll_no exists in the directory to prevent ghost OTPs
    const { data: directory, error: dirError } = await supabaseAdmin
      .from('college_directory')
      .select('name')
      .eq('roll_no', roll_no)
      .single();

    if (dirError || !directory) {
      return NextResponse.json({ 
        success: false, 
        error: 'Record not found in the verified institutional batch directory.' 
      }, { status: 404 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour expiration

    // 1. Clear any previous unverified OTPs for this roll number to avoid conflicts
    await supabaseAdmin
      .from('otp_logs')
      .delete()
      .eq('roll_no', roll_no)
      .eq('is_verified', false);

    // 2. Store OTP in database for verification step
    const { error: dbError } = await supabaseAdmin
      .from('otp_logs')
      .insert([{
        email,
        roll_no,
        otp_code: otp,
        expires_at: expiresAt,
        is_verified: false
      }]);

    if (dbError) {
      console.error('❌ OTP Log Error:', dbError.message);
      return NextResponse.json({ 
        success: false,
        error: "Failed to generate verification session. Please try again."
      }, { status: 500 });
    }

    console.log(`✅ OTP Generated for [${roll_no}]: ${otp}`);

    // 3. Attempt Production Email Dispatch with Resend
    let emailSent = false;
    if (resend) {
      try {
        const data = await resend.emails.send({
          from: 'DBMS Security <security@dbms.project>', // Needs verified domain in production
          to: [email],
          subject: 'DBMS Project - Institutional Verification Code',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
              <h2 style="color: #0f172a; text-transform: uppercase; letter-spacing: 2px;">DBMS Intelligence Portal</h2>
              <p>Hello ${directory.name},</p>
              <p>Your institutional verification code is:</p>
              <h1 style="font-size: 32px; letter-spacing: 5px; color: #10b981; background: #ecfdf5; padding: 10px 20px; display: inline-block; border-radius: 8px;">${otp}</h1>
              <p>This code will expire in 60 minutes.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
              <p style="font-size: 12px; color: #64748b;">If you did not request this, please notify the Placement Cell immediately.</p>
            </div>
          `
        });
        
        if (data.error) {
           console.error('❌ Resend API Error:', data.error);
        } else {
           emailSent = true;
           console.log(`✉️ Email dispatched to ${email}`);
        }
      } catch (err) {
        console.error('❌ Resend Exception:', err);
      }
    }

    if (emailSent) {
       // Production flow: Do not leak OTP to UI
       return NextResponse.json({ 
         success: true, 
         message: 'Verification code sent securely to your institutional email.'
       });
    }

    // 4. Fallback: Return OTP in response (Local/Dev/Auto-Verification mode)
    return NextResponse.json({ 
      success: true, 
      message: 'Verification cycle initiated. Dev Mode Auto-Fill active.',
      otp_code: otp 
    });

  } catch (error: any) {
    console.error('❌ Sync Dispatch Error:', error);
    return NextResponse.json({ 
      success: false,
      error: getFriendlyErrorMessage(error)
    }, { status: 500 });
  }
}
