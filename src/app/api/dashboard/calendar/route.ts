import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { CalendarEvent } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const { data: events, error } = await supabase
      .from('event')
      .select('event_id, user_id, title, description, event_type, start_time, location')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('start_time', { ascending: true });

    if (error) {
       console.error("Calendar GET error:", error.message);
       throw error;
    }

    const typedEvents: CalendarEvent[] = events || [];

    return NextResponse.json({ success: true, events: typedEvents });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, title, description, event_type, start_time, location } = body;

    if (!user_id || !title || !start_time) {
      return NextResponse.json({ success: false, error: 'user_id, title, and start_time are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('event')
      .insert({
        user_id,
        title,
        description: description || null,
        event_type: event_type || 'Interview',
        start_time: new Date(start_time).toISOString(),
        location: location || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Calendar POST error:", error.message);
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
