import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 });
    }

    // Fetch company internships with application counts and requirements (singular join)
    const { data: internships, error } = await supabase
      .from('internship')
      .select(`
        *,
        application(status),
        internship_skill(skill(skill_id, skill_name))
      `)
      .eq('company_id', companyId)
      .order('internship_id', { ascending: false });

    if (error) throw error;

    const enriched = (internships || []).map((job: any) => ({
      ...job,
      id: job.internship_id.toString(),
      application: job.application || [],
      min_cgpa: job.min_cgpa || 0,
      requirements: {
          role_skills: job.internship_skill?.map((ir: any) => ir.skill.skill_name) || []
      }
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company_id, title, description, duration, location, stipend, skills, min_cgpa } = body;

    if (!company_id || !title) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Insert Internship
    const { data: internship, error: internError } = await supabase
      .from('internship')
      .insert({
        company_id,
        title,
        description,
        duration,
        location,
        stipend,
        min_cgpa: min_cgpa || 0
      } as any)
      .select()
      .single();

    if (internError) throw internError;

    // 2. Insert Skills into internship_skill (with Auto-Discovery)
    if (skills && Array.isArray(skills) && skills.length > 0) {
      const skillsToLink = [];

      for (const skillName of skills) {
        // Find or create the skill
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
          skillsToLink.push({
            internship_id: internship.internship_id,
            skill_id: skillObj.skill_id
          });
        }
      }

      if (skillsToLink.length > 0) {
        await supabase.from('internship_skill').insert(skillsToLink);
      }
    }

    return NextResponse.json({ success: true, data: internship });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    // Delete from internship table (Cascades to applications and requirements)
    const { error } = await supabase
      .from('internship')
      .delete()
      .eq('internship_id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
