import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // The requesting user

    let currentUserRollNo = null;
    if (userId) {
      const { data: currentUser } = await supabase
        .from('student')
        .select('roll_no')
        .eq('student_id', userId)
        .single();
      if (currentUser?.roll_no) currentUserRollNo = currentUser.roll_no;
    }

    // 1. Fetch Students
    // We fetch basic profile info. We'll exclude the requesting user later or in DB query.
    let query = supabase
      .from('student')
      .select(`
        student_id, 
        name, 
        roll_no,
        college, 
        branch, 
        graduation_year, 
        market_reach,
        student_skill (
          proficiency_level,
          skill (skill_name)
        )
      `)
      .like('roll_no', '24/940%')
      .not('name', 'is', null)
      .neq('name', 'Student User')
      .order('market_reach', { ascending: false });

    // Note: Due to mock data and some tests not having userIds properly set up, 
    // we fetch all and filter in memory to ensure we don't accidentally exclude everything 
    // if userId formatting differs.
    
    const { data: studentsData, error } = await query;

    if (error) {
      console.error("Networking DB Error:", error);
      return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
    }

    // 2. Sanitize and Format
    const sanitizedPeers = (studentsData || [])
      .filter((s: any) => {
        if (userId && s.student_id === userId) return false;
        if (currentUserRollNo && s.roll_no === currentUserRollNo) return false;
        return true;
      })
      .map((s: any) => {
        // Map skills
        const rawSkills = s.student_skill || [];
        const skillsList = rawSkills.map((sk: any) => ({
          name: sk.skill?.skill_name || 'Unknown',
          level: sk.proficiency_level || 'Beginner'
        }));

        // sort skills descending by assumed level weight, or just take top 3
        const topSkills = skillsList.slice(0, 3).map((sk: any) => sk.name);

        return {
          id: s.student_id,
          name: s.name || 'Anonymous Peer',
          rollNo: s.roll_no || '',
          college: s.college || 'Verified Institution',
          branch: s.branch || 'General Program',
          graduationYear: s.graduation_year || 'Unknown',
          profileStrength: s.market_reach || 0,
          skills: topSkills.length > 0 ? topSkills : ['Core Fundamentals']
        };
      });

    return NextResponse.json({ success: true, peers: sanitizedPeers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Networking API Error:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
