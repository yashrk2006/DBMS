import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SQL = `
-- Drop old authenticated-only policies
DROP POLICY IF EXISTS "Skills are viewable by all" ON skill;
DROP POLICY IF EXISTS "Internships viewable by all" ON internship;
DROP POLICY IF EXISTS "Requirements viewable by all" ON internship_requirements;
DROP POLICY IF EXISTS "Company names visible to all authenticated" ON company;
DROP POLICY IF EXISTS "Students manage their skills" ON student_skill;
DROP POLICY IF EXISTS "Students manage own applications" ON application;
DROP POLICY IF EXISTS "Students can view own profile" ON student;

-- Create fully public READ policies for everyone (including anon visitors)
CREATE POLICY "Public read skill" ON skill FOR SELECT USING (true);
CREATE POLICY "Public read internship" ON internship FOR SELECT USING (true);
CREATE POLICY "Public read reqs" ON internship_requirements FOR SELECT USING (true);
CREATE POLICY "Public read company" ON company FOR SELECT USING (true);
CREATE POLICY "Public read student_skill" ON student_skill FOR SELECT USING (true);
CREATE POLICY "Public read application" ON application FOR SELECT USING (true);
CREATE POLICY "Public read student" ON student FOR SELECT USING (true);

-- Allow public inserts for testing auth-less applying
CREATE POLICY "Public insert app" ON application FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert skill" ON student_skill FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete skill" ON student_skill FOR DELETE USING (true);
`;

async function run() {
  await client.connect();
  await client.query(SQL);
  console.log('✅ Updated RLS to allow public/anonymous access for the demo.');
  await client.end();
}

run().catch(console.error);
