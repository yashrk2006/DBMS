// SkillSync RLS Policy Setup Script
// Run with: node setup-rls.mjs
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SQL = `
-- Enable RLS on all tables
ALTER TABLE student ENABLE ROW LEVEL SECURITY;
ALTER TABLE company ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_skill ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE application ENABLE ROW LEVEL SECURITY;

-- SKILLS: Anyone authenticated can read
DROP POLICY IF EXISTS "Skills are viewable by all" ON skill;
CREATE POLICY "Skills are viewable by all" ON skill
  FOR SELECT USING (auth.role() = 'authenticated');

-- INTERNSHIP: Anyone authenticated can read
DROP POLICY IF EXISTS "Internships viewable by all" ON internship;
CREATE POLICY "Internships viewable by all" ON internship
  FOR SELECT USING (auth.role() = 'authenticated');

-- INTERNSHIP REQUIREMENTS: Anyone authenticated can read
DROP POLICY IF EXISTS "Requirements viewable by all" ON internship_requirements;
CREATE POLICY "Requirements viewable by all" ON internship_requirements
  FOR SELECT USING (auth.role() = 'authenticated');

-- STUDENT: Users can read/update their own profile
DROP POLICY IF EXISTS "Students can view own profile" ON student;
CREATE POLICY "Students can view own profile" ON student
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can insert own profile" ON student;
CREATE POLICY "Students can insert own profile" ON student
  FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own profile" ON student;
CREATE POLICY "Students can update own profile" ON student
  FOR UPDATE USING (auth.uid() = student_id);

-- COMPANY: Users can read/update their own profile
DROP POLICY IF EXISTS "Companies can view own profile" ON company;
CREATE POLICY "Companies can view own profile" ON company
  FOR SELECT USING (auth.uid() = company_id);

DROP POLICY IF EXISTS "Companies can insert own profile" ON company;
CREATE POLICY "Companies can insert own profile" ON company
  FOR INSERT WITH CHECK (auth.uid() = company_id);

DROP POLICY IF EXISTS "Companies can update own profile" ON company;
CREATE POLICY "Companies can update own profile" ON company
  FOR UPDATE USING (auth.uid() = company_id);

-- Company read for internship joins
DROP POLICY IF EXISTS "Company names visible to all authenticated" ON company;
CREATE POLICY "Company names visible to all authenticated" ON company
  FOR SELECT USING (auth.role() = 'authenticated');

-- STUDENT_SKILL: Students manage their own skills
DROP POLICY IF EXISTS "Students manage their skills" ON student_skill;
CREATE POLICY "Students manage their skills" ON student_skill
  FOR ALL USING (auth.uid() = student_id);

-- APPLICATION: Students manage their own applications
DROP POLICY IF EXISTS "Students manage own applications" ON application;
CREATE POLICY "Students manage own applications" ON application
  FOR ALL USING (auth.uid() = student_id);

-- ADMIN READ (admins can read everything) 
DROP POLICY IF EXISTS "Admins can do anything on student" ON student;
CREATE POLICY "Admins can do anything on student" ON student
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin WHERE admin_id = auth.uid())
  );
`;

async function run() {
  await client.connect();
  console.log('✅  Connected to Supabase');
  await client.query(SQL);
  console.log('✅  RLS enabled on all tables');
  console.log('✅  All policies created');
  console.log('\n🎉  Security policies are set up! Your app should now work fully.');
  await client.end();
}

run().catch(err => {
  console.error('❌  Error:', err.message);
  client.end();
});
