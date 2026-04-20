import { supabaseAdmin } from '@/lib/supabase-server';

export async function getAgentContext(userId: string) {
  try {
    // 1. Fetch Student Profile & Resume Analysis
    const { data: student } = await supabaseAdmin
      .from('student')
      .select('*')
      .eq('student_id', userId)
      .single();

    // 2. Fetch Student Skills
    const { data: skills } = await supabaseAdmin
      .from('student_skill')
      .select('proficiency_level, skill:skill_id (skill_name)')
      .eq('student_id', userId);

    // 3. Fetch Recent Notifications (Increased to 15)
    const { data: notifications } = await supabaseAdmin
      .from('notification')
      .select('title, message, created_at, type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15);

    // 4. Fetch Available Internships (Increased to 15)
    const { data: internships } = await supabaseAdmin
      .from('internship')
      .select(`
        internship_id,
        title,
        description,
        location,
        stipend,
        deadline,
        company:company_id (company_name)
      `)
      .order('deadline', { ascending: true })
      .limit(15);

    // 5. Fetch ALL Existing Applications
    const { data: applications } = await supabaseAdmin
      .from('application')
      .select('internship_id, status, applied_date')
      .eq('student_id', userId);

    return {
      student,
      skills: skills || [],
      notifications: notifications || [],
      internships: internships || [],
      applications: applications || [],
      success: true
    };
  } catch (error: any) {
    console.error("Agent Context Error:", error);
    return { success: false, error: error.message };
  }
}

export async function applyForInternshipAgent(userId: string, internshipId: number) {
  try {
    const { data, error } = await supabaseAdmin
      .from('application')
      .insert([
        { 
          student_id: userId, 
          internship_id: internshipId,
          status: 'Pending',
          ai_match_score: 85 // Default for agent-triggered applications
        }
      ])
      .select()
      .single();

    if (error) throw error;
    
    // Create a notification for the application
    await supabaseAdmin.from('notification').insert([{
        user_id: userId,
        title: "Application Submitted via Pulse",
        message: `Your application for Internship #${internshipId} has been successfully submitted by DBMS Sync Skills Hub.`,
        type: 'system'
    }]);

    return { success: true, application: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
