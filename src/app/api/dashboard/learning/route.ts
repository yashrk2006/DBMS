import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { Course } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Using only columns that are confirmed to exist in the schema
    const targetedSelect = 'course_id, title, description, category, color, icon';

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

    // FINAL FAIL-SAFE: If still empty, provide high-fidelity hardcoded paths
    if (courses.length === 0) {
      courses = [
        {
          course_id: 101,
          title: 'Generative AI Strategy',
          description: 'Master LLM deployment and agentic workflows in enterprise.',
          category: 'AI',
          icon: 'AutoAwesome',
          color: 'bg-emerald-50'
        },
        {
          course_id: 102,
          title: 'Fullstack Foundry',
          description: 'The definitive path from frontend to distributed backend systems.',
          category: 'Development',
          icon: 'Code',
          color: 'bg-purple-50'
        },
        {
          course_id: 103,
          title: 'Cloud Architecture Mastery',
          description: 'Scale applications globally using Kubernetes and Cloud protocols.',
          category: 'Cloud',
          icon: 'CloudSync',
          color: 'bg-cyan-50'
        }
      ] as any[];
    }

    // Dynamic URL Injection for SkillSync Paths
    const urlMap: Record<string, string> = {
      'Generative AI Strategy': 'https://www.coursera.org/specializations/generative-ai-for-everyone',
      'Fullstack Foundry': 'https://fullstackopen.com/en/',
      'Cloud Architecture Mastery': 'https://aws.amazon.com/training/digital/sa-learning-plan/',
      'Figma Pro': 'https://www.youtube.com/playlist?list=PLB-8T2r3YVvF4V6OqZpxHEni34fF2B9D-',
      'Neural Networks': 'https://www.deeplearning.ai/courses/neural-networks-deep-learning/'
    };

    courses = courses.map(c => ({
      ...c,
      url: urlMap[c.title] || '/dashboard/learning'
    }));

    return NextResponse.json({ success: true, courses });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
