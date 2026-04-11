export interface Message {
  id: string | number;
  sender_id: string;
  receiver_id?: string;
  content: string;
  created_at: string;
}

export interface AIResumeAnalysis {
  score: number;
  summary: string;
  skills: string[];
  missing: string[];
  suggestions: string[];
  extracted_experience?: any[];
}

export interface Skill {
  skill_name: string;
  level?: string;
}

export interface Internship {
  id: string;
  internship_id: number;
  company_id: string;
  company_name: string;
  title: string;
  description: string;
  requirements: {
    role_skills: string[];
    experience_level?: string;
  };
  duration: string;
  stipend: string;
  location: string;
  status: 'Open' | 'Closed';
  min_cgpa?: number;
  // AI Match Engine Fields
  match_percentage?: number;
  success_probability?: number;
  applied?: boolean;
  required_skills?: string[];
  missing_skills?: string[];
  match_diagnosis?: any;
}

export interface Application {
  application_id: string;
  student_id: string;
  internship_id: string;
  company_id: string;
  status: 'Pending' | 'Under Review' | 'Interviewing' | 'Accepted' | 'Rejected';
  applied_date: string;
  // Enriched fields
  student_name?: string;
  role_title?: string;
  company_name?: string;
  match_score?: number;
  ai_match_score?: number;
  ai_interview_guide?: string[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  roll_no?: string;
  college: string;
  branch: string;
  graduation_year?: number;
  cgpa?: number;
  skills: Skill[];
  market_reach?: number;
  high_impact_skill?: {
    name: string;
    boost: number;
  };
  ai_resume_analysis?: AIResumeAnalysis;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  description: string;
}

export interface MarketEquilibriumItem {
  name: string;
  supply: number;
  demand: number;
  gap: number;
}

export interface EnrichedCompanyApplication extends Application {
  student_name: string;
  student_roll_no?: string;
  student_skills: string[];
  role_title: string;
  match_score: number;
  ai_interview_guide: string[];
  resume_analysis?: {
    score: number;
    summary: string;
    skills: string[];
    missing: string[];
    suggestions: string[];
    resume_url?: string;
  };
}

export interface TalentDiscoveryProfile {
  id: string;
  name: string;
  skills: string[];
  resume_score?: number;
  top_match: {
    roleId?: string;
    role: string;
    score: number;
  } | null;
}

export interface CompanyStats {
  activeRoles: number;
  totalApplicants: number;
  pendingReview: number;
  interviewsScheduled: number;
  isVerified: boolean;
}
export interface Course {
  course_id: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url?: string;
  duration?: string;
  instructor?: string;
}

export interface CalendarEvent {
  event_id?: string;
  id?: string;
  user_id?: string;
  title: string;
  description: string;
  event_type: 'Interview' | 'Workshop' | 'Webinar' | 'Community' | 'System';
  start_time: string;
  location?: string;
  recruiter_name?: string;
  recruiter_role?: string;
}

export interface Notification {
  notification_id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'system' | 'application' | 'community' | 'interview';
  is_read: boolean;
  created_at: string;
}
