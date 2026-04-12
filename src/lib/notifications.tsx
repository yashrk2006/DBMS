import { Resend } from 'resend';
import * as React from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { ApplicationReceivedEmail } from '@/components/emails/ApplicationReceived';
import { StatusUpdateEmail } from '@/components/emails/StatusUpdateEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Persist notification to the SkillSync repository for in-app visibility.
 */
export async function persistNotification({
  userId,
  title,
  message,
  type = 'system'
}: {
  userId: string;
  title: string;
  message: string;
  type?: string;
}) {
  try {
    const { error } = await supabaseAdmin
      .from('notification')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        is_read: false
      });
    
    if (error) {
      console.error('❌ Database notification failed:', error);
      return { success: false, error };
    }
    return { success: true };
  } catch (error) {
    console.error('❌ Notification persistence crash:', error);
    return { success: false, error };
  }
}

/**
 * Send a professional email notification via Resend.
 */
export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string | string[];
  subject: string;
  react: React.ReactNode;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY is missing. Notification skipped:', { to, subject });
    return { success: false, error: 'Missing API Key' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'SkillSync <recruitment@skillsync.com>', 
      to,
      subject,
      react: react as any,
    });

    if (error) {
      console.error('❌ Resend Error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ Notification service crash:', error);
    return { success: false, error };
  }
}

/**
 * Notify student that their application was successfully received.
 */
export async function notifyApplicationReceived(studentId: string, studentEmail: string, studentName: string, internshipTitle: string) {
  await persistNotification({
    userId: studentId,
    title: 'Application Received',
    message: `Your application for "${internshipTitle}" has been logged in the Career Hub.`,
    type: 'application'
  });

  return sendEmail({
    to: studentEmail,
    subject: `[SkillSync] Application Received: ${internshipTitle}`,
    react: <ApplicationReceivedEmail studentName={studentName} internshipTitle={internshipTitle} />,
  });
}

/**
 * Notify company about a high-potential new applicant.
 */
export async function notifyCompanyNewApplicant(companyEmail: string, studentName: string, internshipTitle: string) {
  return sendEmail({
    to: companyEmail,
    subject: `[New Applicant] ${studentName} applied for ${internshipTitle}`,
    react: (
      <div style={{ fontFamily: 'Inter, sans-serif' }}>
        <h3>New Applicant Found</h3>
        <p>Candidate <strong>{studentName}</strong> has just applied for <strong>{internshipTitle}</strong>.</p>
        <p>Visit your dashboard to view their profile and match details.</p>
      </div>
    ),
  });
}

/**
 * Notify student of a progression in their application journey.
 */
export async function notifyStatusUpdate(studentId: string, studentEmail: string, studentName: string, internshipTitle: string, newStatus: string) {
  await persistNotification({
    userId: studentId,
    title: 'Application Status Updated',
    message: `Your application for "${internshipTitle}" has been updated to: ${newStatus}`,
    type: 'status'
  });

  return sendEmail({
    to: studentEmail,
    subject: `[Update] Application status for ${internshipTitle}`,
    react: <StatusUpdateEmail studentName={studentName} internshipTitle={internshipTitle} newStatus={newStatus} />,
  });
}

/**
 * Notify student that they have been invited to apply or interview.
 */
export async function notifyInvitation(studentId: string, studentEmail: string, studentName: string, internshipTitle: string, companyName: string) {
  await persistNotification({
    userId: studentId,
    title: 'Recruitment Invitation',
    message: `${companyName} has invited you to apply for their "${internshipTitle}" program!`,
    type: 'invitation'
  });

  return sendEmail({
    to: studentEmail,
    subject: `[Exclusive] ${companyName} Invitation: ${internshipTitle}`,
    react: (
      <div style={{ fontFamily: 'Inter, sans-serif' }}>
        <h1>Application Invitation</h1>
        <p>Hello {studentName},</p>
        <p>You have been identified as a high-potential candidate by <strong>{companyName}</strong>.</p>
        <p>They would like to invite you to apply for their <strong>{internshipTitle}</strong> program.</p>
        <p>Check your SkillSync dashboard for more details and to accept this invitation.</p>
      </div>
    ),
  });
}

/**
 * Send a free-form custom message to a student.
 */
export async function sendCustomNotification(email: string, subject: string, message: string) {
  return sendEmail({
    to: email,
    subject: subject,
    react: (
      <div style={{ fontFamily: 'Inter, sans-serif' }}>
        <h3>SkillSync Administrative Update</h3>
        <p>{message}</p>
      </div>
    ),
  });
}

// No legacy object export - Use named imports for better stability and tree-shaking.
