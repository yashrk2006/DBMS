import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { Course } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Define selecting only necessary fields
    const targetedSelect = 'course_id, title, description, category, thumbnail_url, duration, instructor';

    let query = supabase.from('course').select(targetedSelect);

    // Personalized Filtering: If we have a userId, fetch their branch
    if (userId) {
      const { data: student } = await supabase
        .from('student')
        .select('branch')
        .eq('student_id', userId)
        .maybeSingle();

      if (student?.branch) {
        // Map common branch names to course categories
        const branchMap: Record<string, string[]> = {
          'Computer Science': ['AI', 'Development', 'Cloud', 'Data Science'],
          'Information Technology': ['Network', 'Security', 'Web', 'DevOps'],
          'Electronics': ['Embedded', 'IoT', 'VLSI', 'Signal Processing'],
          'Mechanical': ['CAD', 'Robotics', 'Manufacturing', 'Automotive'],
          'Civil': ['Structural', 'Architecture', 'Urban Planning'],
          'Electrical': ['Power', 'Control Systems', 'Renewables']
        };

        const categories = branchMap[student.branch] || [student.branch];
        query = query.in('category', categories);
      }
    }

    const { data: coursesRaw, error } = await query
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
       console.error("Database query failed:", error.message);
       throw error;
    }

    let courses: Course[] = coursesRaw || [];

    // If filtered results are empty, return all courses as fallback
    if (courses.length === 0) {
      const { data: fallbackRaw } = await supabase
        .from('course')
        .select(targetedSelect)
        .order('created_at', { ascending: false })
        .limit(6);
      courses = fallbackRaw || [];
    }

    return NextResponse.json({ success: true, courses });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
