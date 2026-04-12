import { NextResponse } from 'next/server';
import { analyzeResumeAgent } from '@/lib/agents';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Safety Vault: Deferred parser loading & Web Primitives Polyfill
    let PDFParse: any;
    try {
      const canvas = require('@napi-rs/canvas');
      
      // Inject Web Primitives missing in Node.js but required by modern PDF engines
      // @ts-ignore
      if (typeof global.DOMMatrix === 'undefined') global.DOMMatrix = canvas.DOMMatrix;
      // @ts-ignore
      if (typeof global.Path2D === 'undefined') global.Path2D = canvas.Path2D;
      // @ts-ignore
      if (typeof global.DOMPoint === 'undefined') global.DOMPoint = canvas.DOMPoint;
      // @ts-ignore
      if (typeof global.DOMRect === 'undefined') global.DOMRect = canvas.DOMRect;
      
      console.log(`[Re-Analysis] Web Primitives established. DOMMatrix: ${typeof global.DOMMatrix}`);

      const parserModule = require('pdf-parse');
      PDFParse = parserModule.PDFParse;
      if (!PDFParse) throw new Error("Parser class not found in module exports.");
    } catch (loadErr: any) {
      console.error("[Re-Analysis] Library Load failure:", loadErr);
      return NextResponse.json({ 
        success: false, 
        error: `Analysis Service Error: ${loadErr.message || "Failed to initialize native PDF components."}` 
      }, { status: 500 });
    }

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
      const buffer = Buffer.from(await file.arrayBuffer());
      console.log(`[Re-Analysis] Initiating PDFParse engine...`);
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      text = data.text || "";
      await parser.destroy();
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
