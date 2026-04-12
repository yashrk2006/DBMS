import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { createClientServer } from '@/lib/supabase-server'; 
import { Notification } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    // SECURE SESSION VERIFICATION
    const supabaseServer = await createClientServer();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // PRIVACY ENFORCEMENT: Only allow users to fetch their own notifications
    if (requestedUserId && requestedUserId !== user.id) {
       console.warn(`Privacy Breach Attempt: User ${user.id} tried to fetch notifications for ${requestedUserId}`);
       return NextResponse.json({ success: false, error: 'Unauthorized: Data Privacy Violation' }, { status: 403 });
    }

    const userId = user.id; // Use verified ID from session

    const { data: rawNotifs, error } = await supabase
      .from('notification')
      .select('notification_id, user_id, title, message, type, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Notification fetch warning:', error.message);
      // Return empty array instead of failing hard to maintain UI stability
      return NextResponse.json({ success: true, data: [], notifications: [] });
    }

    const notifications: Notification[] = rawNotifs || [];
    
    // Return as 'data' and 'notifications' for frontend compatibility
    return NextResponse.json({ success: true, data: notifications, notifications });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Notification API Error:', error);
    // Silent fail on GET to keep dashboard functional
    return NextResponse.json({ success: true, data: [], notifications: [] });
  }
}

export async function POST(request: Request) {
  try {
    const { userId: bodyUserId, title, message, type = 'system' } = await request.json();

    // SECURE SESSION VERIFICATION
    const supabaseServer = await createClientServer();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // PRIVACY ENFORCEMENT: Only allow the user to send notifications to themselves
    // Exceptions should go through a specialized internal utility using supabaseAdmin
    const targetUserId = bodyUserId || user.id;
    if (targetUserId !== user.id) {
       return NextResponse.json({ success: false, error: 'Unauthorized: Cannot inject notifications for other students' }, { status: 403 });
    }

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Missing notification payload' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('notification')
      .insert({ user_id: targetUserId, title, message, type })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { notificationId, userId: bodyUserId } = await request.json();

    // SECURE SESSION VERIFICATION
    const supabaseServer = await createClientServer();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // PRIVACY ENFORCEMENT
    const targetUserId = bodyUserId || user.id;
    if (targetUserId !== user.id) {
       return NextResponse.json({ success: false, error: 'Forbidden: Privacy Violation' }, { status: 403 });
    }

    if (notificationId) {
      // Mark single notification as read
      const { error } = await supabase
        .from('notification')
        .update({ is_read: true })
        .eq('notification_id', notificationId)
        .eq('user_id', user.id); // Extra safety layer
      if (error) throw error;
    } else {
      // Mark all as read for the authenticated user
      const { error } = await supabase
        .from('notification')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
