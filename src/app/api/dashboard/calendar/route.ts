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

    // Broaden search to include Institutional Signals (null user_id) OR user-specific events
    // Fetch a larger window to ensure symmetry in the dashboard UI
    const { data: events, error } = await supabase
      .from('event')
      .select('event_id, user_id, title, description, event_type, start_time, location')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(10);

    if (error) {
       console.error("Calendar GET error:", error.message);
       throw error;
    }

    let typedEvents: CalendarEvent[] = events || [];

    // Fallback if no upcoming events are discovered
    if (typedEvents.length === 0) {
      typedEvents = [
        {
          event_id: 'fallback-1',
          title: 'Microsoft Early Career Summit',
          description: 'Strategic roadmap for engineering roles.',
          event_type: 'Workshop',
          start_time: new Date(Date.now() + 86400000).toISOString(),
          location: 'Virtual Terminal'
        },
        {
          event_id: 'fallback-2',
          title: 'Google Step Program Briefing',
          description: 'Internal insights for Step program applications.',
          event_type: 'Info Session',
          start_time: new Date(Date.now() + 172800000).toISOString(),
          location: 'Main Hall A'
        }
      ] as any[];
    }

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
