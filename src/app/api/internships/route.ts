import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // 1. Fetch Internships with Company and Requirements
    const { data: internships, error } = await supabaseAdmin
      .from('internship')
      .select(`
        *,
        company:company_id (
          company_name
        ),
        internship_skill (
          skill:skill_id (
            skill_name
          )
        )
      `)
      .order('internship_id', { ascending: false });

    if (error) throw error;

    // 2. Fetch User's Applications (to mark as applied)
    let appliedIds: Set<number> = new Set();
    if (userId) {
      const { data: userApps } = await supabaseAdmin
        .from('application')
        .select('internship_id')
        .eq('student_id', userId);
      
      if (userApps) {
        appliedIds = new Set(userApps.map((a: any) => a.internship_id));
      }
    }

    // 3. Enrich and Format
    const enriched = (internships || []).map((i: any) => ({
      ...i,
      id: i.internship_id.toString(),
      company_name: i.company?.company_name || 'Independent',
      requirements: {
          role_skills: i.internship_skill?.map((ir: any) => ir.skill.skill_name) || []
      },
      required_skills: i.internship_skill?.map((ir: any) => ir.skill.skill_name) || [],
      applied: appliedIds.has(i.internship_id)
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { 
      company_id, title, description, duration, 
      stipend, location, min_cgpa, required_skills 
    } = await request.json();

    if (!company_id || !title) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Insert Internship
    const { data: internship, error: internError } = await supabaseAdmin
      .from('internship')
      .insert({
        company_id,
        title,
        description,
        duration,
        stipend,
        location,
        min_cgpa: min_cgpa || 0,
        status: 'Open'
      })
      .select('internship_id')
      .single();

    if (internError) throw internError;

    // 2. Insert Skills if provided
    if (required_skills && required_skills.length > 0) {
      // First, ensure skills exist and get their IDs
      const skillInsertions = required_skills.map(async (skillName: string) => {
        const { data: skillData } = await supabaseAdmin
          .from('skill')
          .upsert({ skill_name: skillName }, { onConflict: 'skill_name' })
          .select('skill_id')
          .single();
        return skillData?.skill_id;
      });

      const skillIds = (await Promise.all(skillInsertions)).filter(id => id);

      if (skillIds.length > 0) {
        const { error: skillError } = await supabaseAdmin
          .from('internship_skill')
          .insert(
            skillIds.map(id => ({
              internship_id: internship.internship_id,
              skill_id: id
            }))
          );
        if (skillError) console.error("Skill mapping error:", skillError.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: { internship_id: internship.internship_id },
      message: 'Internship deployment synchronized' 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Submission Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
