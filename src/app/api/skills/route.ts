import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { AI_ENGINE } from '@/lib/ai-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Security Gate: Ensure users are provided in the request context
    if (!userId) {
      console.warn(`[Security Gate] 400 Bad Request: userId missing.`);
      return NextResponse.json({ success: false, error: 'User Context Missing' }, { status: 400 });
    }

    // 1. Fetch Student Skills & Profile Data (use admin client to bypass any RLS)
    const [
      { data: studentData, error: studentError },
      { data: skilledData, error: skillsError }
    ] = await Promise.all([
      supabaseAdmin.from('student').select('ai_resume_analysis').eq('student_id', userId).single(),
      supabaseAdmin
        .from('student_skill')
        .select('proficiency_level, skill(skill_id, skill_name, category)')
        .eq('student_id', userId)
    ]);

    if (skillsError) throw skillsError;

    const studentSkills = (skilledData || []).map((s: any) => ({
      skill_id: s.skill?.skill_id,
      skill_name: s.skill?.skill_name || 'Legacy Skill',
      proficiency_level: s.proficiency_level
    })).filter((s: any) => s.skill_id);

    // 2. Fetch All Internships for AI Insights
    const { data: allInternshipsRaw } = await supabase
      .from('internship')
      .select(`
        *,
        internship_skill(skill(skill_name))
      `);

    const allInternships = (allInternshipsRaw || []).map((i: any) => ({
      requirements: {
        role_skills: i.internship_skill?.map((ir: any) => ir.skill.skill_name) || []
      }
    }));

    // 3. Fetch All Available Skills (for the dropdown/selection)
    const { data: allAvailableSkills } = await supabase
      .from('skill')
      .select('*');

    // Platform Insights: Skill Alignment Analyzer
    const studentSkillsNames = studentSkills.map((s: any) => s.skill_name);
    const marketReach = AI_ENGINE.calculateMarketReach(studentSkillsNames, allInternships as any);
    const nextBestSkill = AI_ENGINE.getHighImpactSkill(studentSkillsNames, allInternships as any);

    return NextResponse.json({ 
      success: true, 
      studentSkills,
      allSkills: allAvailableSkills || [],
      aiResumeAnalysis: studentData?.ai_resume_analysis,
      careerInsights: {
        marketReach,
        nextBestSkill
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, skillName, proficiencyLevel, action } = await request.json();

    if (!userId || !skillName) {
      return NextResponse.json({ success: false, error: 'User mapping or session data incomplete.' }, { status: 400 });
    }

    if (!userId || !skillName) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Find the skill_id for the given skillName case-insensitively
    let { data: skillItem } = await supabaseAdmin
      .from('skill')
      .select('skill_id')
      .ilike('skill_name', skillName.trim())
      .single();

    if (!skillItem) {
      // Auto-expand the repository if the skill does not exist
      const { data: newSkill, error: insertError } = await supabaseAdmin
        .from('skill')
        .insert({ skill_name: skillName.trim(), category: 'General' })
        .select()
        .single();
        
      if (insertError) {
        return NextResponse.json({ success: false, error: 'Could not auto-create skill in repository.' }, { status: 500 });
      }
      skillItem = newSkill;
    }

    if (!skillItem) {
      return NextResponse.json({ success: false, error: 'Skill initialization failed.' }, { status: 500 });
    }

    if (action === 'delete') {
      const { error } = await supabaseAdmin
        .from('student_skill')
        .delete()
        .eq('student_id', userId)
        .eq('skill_id', skillItem.skill_id);
      
      if (error) throw error;
    } else {
      // Upsert skill in student_skill
      const { error } = await supabaseAdmin
        .from('student_skill')
        .upsert({
          student_id: userId,
          skill_id: skillItem.skill_id,
          proficiency_level: proficiencyLevel
        }, { onConflict: 'student_id, skill_id' });
      
      if (error) throw error;
    }

    // Return the updated skill list
    const { data: updatedSkillsRaw } = await supabaseAdmin
      .from('student_skill')
      .select('proficiency_level, skill(skill_id, skill_name, category)')
      .eq('student_id', userId);

    const updatedSkills = (updatedSkillsRaw || []).map((s: any) => ({
      skill_id: s.skill?.skill_id,
      skill_name: s.skill?.skill_name || 'Legacy Skill',
      proficiency_level: s.proficiency_level
    })).filter((s: any) => s.skill_id);

    return NextResponse.json({ 
      success: true, 
      data: updatedSkills
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
