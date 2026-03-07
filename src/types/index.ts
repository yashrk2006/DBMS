export type UserRole = 'student' | 'company' | 'admin';

export interface Student {
  student_id: string;
  name: string;
  email: string;
  college: string | null;
  branch: string | null;
  graduation_year: number | null;
  resume_url: string | null;
}

export interface Company {
  company_id: string;
  company_name: string;
  email: string;
  industry: string | null;
  location: string | null;
}

export interface Admin {
  admin_id: string;
  username: string;
  email: string;
}

export interface Skill {
  skill_id: number;
  skill_name: string;
  category: string | null;
}

export interface StudentSkill {
  student_id: string;
  skill_id: number;
  proficiency_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  skill?: Skill;
}

export interface Internship {
  internship_id: number;
  company_id: string;
  title: string;
  description: string | null;
  duration: string | null;
  stipend: string | null;
  location: string | null;
  company?: Company;
  required_skills?: Skill[];
  match_percentage?: number;
}

export interface Application {
  application_id: number;
  student_id: string;
  internship_id: number;
  applied_date: string;
  status: 'Pending' | 'Under Review' | 'Interviewing' | 'Accepted' | 'Rejected';
  internship?: Internship;
  student?: Student;
}
