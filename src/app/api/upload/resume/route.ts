import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

import { analyzeResumeAgent } from '@/lib/agents';

// BUILD_STABILIZATION_ID: REF_VER_005
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
      
      console.log(`[Resume Pipeline] Web Primitives established. DOMMatrix: ${typeof global.DOMMatrix}`);

      const parserModule = require('pdf-parse');
      PDFParse = parserModule.PDFParse;
      if (!PDFParse) throw new Error("Parser class not found in module exports.");
    } catch (loadErr: any) {
      console.error("[Resume Pipeline] Primary Engine Initialization failure:", loadErr);
      return NextResponse.json({ 
        success: false, 
        error: `Neural Engine Offline: ${loadErr.message || "Failed to initialize native PDF components."}` 
      }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const studentId = formData.get('studentId') as string;

    if (!file || !studentId) {
      return NextResponse.json({ success: false, error: 'File and Student ID are required' }, { status: 400 });
    }

    console.log(`[Resume Pipeline] Syncing document: ${file.name} (${file.size} bytes) for student ${studentId}`);

    // 1. Initial Storage Sync
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`[Resume Pipeline] Buffer generated. Length: ${buffer.length}`);

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('resumes')
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // 2. Intelligence Layer: PDF Extraction
    let extractedText = "";
    try {
      console.log(`[Resume Pipeline] Initiating PDFParse engine...`);
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      extractedText = data.text || "";
      await parser.destroy();
      console.log(`[Resume Pipeline] Extraction complete. Raw length: ${extractedText.length}`);
    } catch (parseErr: any) {
      console.error("[Resume Pipeline] PDF Engine Crash:", parseErr);
      return NextResponse.json({ 
        success: false, 
        error: `Neural Engine Exception: ${parseErr.message || "The PDF parser encountered a system-level conflict."}` 
      }, { status: 500 });
    }

    if (!extractedText || extractedText.trim().length < 5) {
      return NextResponse.json({ 
        success: false, 
        error: "Document sync failure: No selectable text detected. Ensure your resume is not a flat image or scanned document." 
      }, { status: 400 });
    }

    // 3. AI Intelligence Hub Integration
    console.log(`[Resume Pipeline] Calling Intelligence Agent with ${extractedText.length} characters...`);
    let aiAnalysisResult = await analyzeResumeAgent(extractedText);
    
    // 4. Persistence: Deep Sync
    await supabase
      .from('student')
      .update({ 
        resume_url: publicUrl,
        ai_resume_analysis: aiAnalysisResult
      })
      .eq('student_id', studentId);

    // Auto-populate detected skills into profile
    const extractedSkills = aiAnalysisResult.skills || [];
    if (extractedSkills.length > 0) {
      for (const skillName of extractedSkills) {
        let { data: skillObj } = await supabase
          .from('skill')
          .select('skill_id')
          .ilike('skill_name', skillName)
          .single();
        
        if (!skillObj) {
          const { data: newSkill } = await supabase
            .from('skill')
            .insert({ skill_name: skillName })
            .select('skill_id')
            .single();
          
          if (newSkill) skillObj = newSkill;
        }

        if (skillObj) {
          await supabase
            .from('student_skill')
            .upsert({
              student_id: studentId,
              skill_id: skillObj.skill_id,
              proficiency_level: 'Intermediate'
            }, { onConflict: 'student_id, skill_id' });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      analysis: aiAnalysisResult,
      skills_extracted: extractedSkills.length
    });
  } catch (error: any) {
    console.error('Final Pipeline Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
