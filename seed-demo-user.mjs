import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  
  // Ensure dummy auth user exists
  await client.query(`
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo@student.com', 'demo', now(), now(), now())
    ON CONFLICT DO NOTHING;
  `);

  // Ensure dummy student exists
  await client.query(`
    INSERT INTO student (student_id, name, email, college, branch, graduation_year)
    VALUES ('00000000-0000-0000-0000-000000000000', 'Demo Student', 'demo@student.com', 'Demo Tech', 'Computer Science', 2025)
    ON CONFLICT DO NOTHING;
  `);

  await client.end();
  console.log('✅ Demo user seeded');
}

run().catch(console.error);
