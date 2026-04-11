import { NextResponse } from 'next/server';
import { studentAssistantAgent } from '@/lib/agents';
import { getAgentContext, applyForInternshipAgent } from '@/lib/agents/agent-context';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { message, history, userId } = await request.json();

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    if (!userId) {
       return NextResponse.json({ success: false, error: 'User identity required' }, { status: 403 });
    }

    // 1. Fetch Deep Context
    const context = await getAgentContext(userId);

    // 2. Save User Message to History (Persistence)
    const { data: userMessageRecord } = await supabaseAdmin
      .from('message')
      .insert([{
        sender_id: userId,
        receiver_id: 'pulse-agent', // Dedicated ID for system agent
        content: message,
        is_pulse_event: true
      }])
      .select()
      .single();

    // 3. Get AI Response with Context
    let aiResponse = await studentAssistantAgent(message, history || [], context);

    // 4. Handle Pulse Actions
    // Pattern: [ACTION:APPLY:123]
    const actionMatch = aiResponse.match(/\[ACTION:APPLY:(\d+)\]/);
    if (actionMatch) {
      const internshipId = parseInt(actionMatch[1]);
      const applicationResult = await applyForInternshipAgent(userId, internshipId);
      
      if (applicationResult.success) {
        aiResponse = aiResponse.replace(/\[ACTION:APPLY:\d+\]/, "✅ [Pulse Action Executed]: Application handled. ");
      } else {
        aiResponse = aiResponse.replace(/\[ACTION:APPLY:\d+\]/, `❌ [Action Failed]: ${applicationResult.error}. `);
      }
    }

    // 5. Save AI Response to History (Persistence)
    await supabaseAdmin
      .from('message')
      .insert([{
        sender_id: 'pulse-agent',
        receiver_id: userId,
        content: aiResponse,
        is_pulse_event: false
      }]);

    return NextResponse.json({ success: true, response: aiResponse });
  } catch (error: any) {
    console.error("Chat API Pulse Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
