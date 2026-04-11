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
