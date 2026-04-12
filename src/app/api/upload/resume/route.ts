import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { analyzeResumeAgent } from '@/lib/agents';
import { extractText } from 'unpdf';

// BUILD_STABILIZATION_ID: REF_VER_005_UNPDF
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
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
      console.log(`[Resume Pipeline] Initiating extraction engine (unpdf)...`);
      const data = await extractText(buffer) as any;
      extractedText = Array.isArray(data.text) ? data.text.join('\n') : (data.text || "");
      console.log(`[Resume Pipeline] Extraction complete. Raw length: ${extractedText.length}`);
    } catch (parseErr: any) {
      console.error("[Resume Pipeline] PDF Engine Crash:", parseErr);
      return NextResponse.json({ 
        success: false, 
        error: `System Error: ${parseErr.message || "The PDF parser encountered a system-level conflict."}` 
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
