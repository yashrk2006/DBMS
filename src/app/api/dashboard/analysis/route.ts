import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { AI_ENGINE } from '@/lib/ai-engine';
import { skillGapAgent } from '@/lib/agents';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    // 1. Fetch Student Data & Skills
    const [studentResp, skillsResp, internshipsResp] = await Promise.all([
      supabase.from('student').select('*').eq('student_id', userId).single(),
      supabase.from('student_skill').select('proficiency_level, skill(skill_id, skill_name, category)').eq('student_id', userId),
      supabase.from('internship').select('title, internship_skill(skill(skill_name))').limit(50)
    ]);

    let studentData = studentResp.data;
    let studentSkills = (skillsResp.data || []).map((s: any) => ({
      name: s.skill?.skill_name || 'Skill',
      level: s.proficiency_level || 'Beginner',
      category: s.skill?.category || 'General'
    }));

    // AUTO-PROVISIONING: If student doesn't exist, create a skeleton profile
    if (!studentData) {
      console.log(`[PROVISIONING] Analysis request triggered creation for: ${userId}`);
      const { data: newStudent, error: createError } = await supabase
        .from('student')
        .insert({ 
          student_id: userId, 
          name: 'New Scholar', 
          college: 'Institutional Partner',
          branch: 'General Engineering',
          graduation_year: new Date().getFullYear() + 2,
          market_reach: 25
        })
        .select()
        .single();
      
      if (createError) throw createError;
      studentData = newStudent;
    }

    // 2. Identify Target Role Skills (Aggregation of common internships)
    const allRequiredSkills = (internshipsResp.data || []).flatMap((i: any) => 
      i.internship_skill?.map((is: any) => is.skill?.skill_name) || []
    );
    const uniqueRequired = [...new Set(allRequiredSkills)];
    
    // 3. Invoke Agent for Skill Gap & Roadmap
    const skillNames = studentSkills.map((s: any) => s.name);
    const analysis = await skillGapAgent(skillNames, (uniqueRequired as string[]).slice(0, 10));

    // 4. Calculate Radar Metrics (Mock calculation based on categories)
    const categories = ['Frontend', 'Backend', 'System Design', 'Soft Skills', 'DevOps'];
    const radarData = categories.map(cat => {
        const catSkills = studentSkills.filter((s: any) => s.category.toLowerCase().includes(cat.toLowerCase()));
        const score = catSkills.length > 0 
            ? Math.min(100, catSkills.reduce((acc: number, curr: any) => acc + (curr.level === 'Expert' ? 100 : curr.level === 'Advanced' ? 80 : 50), 0) / catSkills.length)
            : 20 + Math.random() * 20; // Baseline for unrated categories
        return { subject: cat, value: Math.round(score), fullMark: 100 };
    });

    return NextResponse.json({
      success: true,
      analysis: {
        score: studentData.market_reach || 65,
        radarData,
        missing_skills: analysis.missing_skills,
        roadmap: analysis.roadmap,
        summary: analysis.summary,
        roleAlignment: Math.round((studentSkills.length / Math.max(1, uniqueRequired.length / 5)) * 100)
      },
      student: {
        name: studentData.name,
        branch: studentData.branch,
        graduation_year: studentData.graduation_year
      }
    });

  } catch (error: any) {
    console.error('Analysis API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
