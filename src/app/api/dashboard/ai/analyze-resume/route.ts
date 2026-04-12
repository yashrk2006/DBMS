import { NextResponse } from 'next/server';
import { analyzeResumeAgent } from '@/lib/agents';
import { supabase } from '@/lib/supabase';
import { extractText } from 'unpdf';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ success: false, error: 'Expected multipart/form-data POST' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    console.log(`[Re-Analysis] Processing document: ${file.name} for user ${userId}`);

    // Size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'PDF exceeds 10MB limit' }, { status: 400 });
    }

    let text = '';
    try {
      const arrayBuffer = await file.arrayBuffer();
      const binaryData = new Uint8Array(arrayBuffer);
      console.log(`[Re-Analysis] Initiating extraction engine (unpdf)...`);
      const data = await extractText(binaryData) as any;
      text = Array.isArray(data.text) ? data.text.join('\n') : (data.text || "");
      console.log(`[Re-Analysis] Extraction complete. Text length: ${text.length}`);
    } catch (parseError: any) {
      console.error('[Re-Analysis] PDF Parse Internal Error:', parseError);
      return NextResponse.json({ 
        success: false, 
        error: `Analysis Error: ${parseError.message || 'The PDF engine encountered a system-level conflict.'}` 
      }, { status: 500 });
    }

    if (!text || text.trim().length < 5) {
      return NextResponse.json({ 
        success: false, 
        error: 'Document sync failure: No selectable text detected. Ensure your resume is not a flat image or scanned document.' 
      }, { status: 400 });
    }

    const result = await analyzeResumeAgent(text);

    if (userId) {
      try {
        await supabase
          .from('student')
          .update({ ai_resume_analysis: result } as any)
          .eq('student_id', userId);
      } catch (dbError) {
        console.warn('⚡ Analysis persisted to runtime but database sync lagged.');
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Global Resume Analysis Crash:', error);
    // CRITICAL: Ensure NO HTML is ever returned here
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'The analysis system encountered an unexpected error. Please ensure the file is a standard PDF.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
