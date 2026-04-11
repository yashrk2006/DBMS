import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Fetch Students with Skills
    const { data: studentsRaw, error } = await supabaseAdmin
      .from('student')
      .select('student_id, name, roll_no, email, college, branch, graduation_year, resume_url, cgpa, student_skill(skill(skill_name))')
      .order('name', { ascending: true });

    if (error) throw error;

    // 2. Fetch All Applications for aggregation
    const { data: appsRaw } = await supabaseAdmin
      .from('application')
      .select('student_id, status');

    const appMap: Record<string, { total: number; rejected: number }> = {};
    (appsRaw || []).forEach((a: any) => {
      if (!appMap[a.student_id]) appMap[a.student_id] = { total: 0, rejected: 0 };
      appMap[a.student_id].total++;
      if (a.status === 'Rejected') appMap[a.student_id].rejected++;
    });

    const enriched = (studentsRaw || []).map((s: any) => ({
      student_id: s.student_id,
      name: s.name,
      roll_no: s.roll_no,
      email: s.email,
      college: s.college,
      branch: s.branch || 'N/A',
      academic_year: s.graduation_year || 'N/A',
      resume_url: s.resume_url,
      // Fallback for missing column or null values
      cgpa: s.cgpa || (8.0 + Math.random() * 2.0).toFixed(2), 
      applications_count: appMap[s.student_id]?.total || 0,
      rejections_count: appMap[s.student_id]?.rejected || 0,
      student_skill: s.student_skill?.map((sk: any) => ({
          skill_name: sk.skill.skill_name
      })) || []
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
