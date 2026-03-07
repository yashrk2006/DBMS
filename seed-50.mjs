// Usage: node seed-50.mjs
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
  console.log('✅ Connected to database');

  // 1. Create 5 dummy companies mapping to auth.users
  const companyEmails = ['google@test.com', 'microsoft@test.com', 'amazon@test.com', 'meta@test.com', 'apple@test.com'];
  const companyNames = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'];
  const locations = ['Mountain View, CA', 'Redmond, WA', 'Seattle, WA', 'Menlo Park, CA', 'Cupertino, CA'];
  const companyIds = [];

  for (let i = 0; i < 5; i++) {
    let companyId;
    const existing = await client.query('SELECT id FROM auth.users WHERE email = $1', [companyEmails[i]]);
    if (existing.rows.length > 0) {
      companyId = existing.rows[0].id;
    } else {
      const res = await client.query(`
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
        VALUES (
          '00000000-0000-0000-0000-000000000000',
          gen_random_uuid(),
          'authenticated',
          'authenticated',
          $1,
          'crypt_pass',
          now(),
          now(),
          now()
        )
        RETURNING id;
      `, [companyEmails[i]]);
      companyId = res.rows[0].id;
    }
    companyIds.push(companyId);

    // Insert into company table if not exists
    await client.query(`
      INSERT INTO company (company_id, company_name, email, industry, location)
      VALUES ($1, $2, $3, 'Technology', $4)
      ON CONFLICT (company_id) DO NOTHING;
    `, [companyId, companyNames[i], companyEmails[i], locations[i]]);
  }

  console.log('✅ Ensured 5 dummy companies exist');

  // 2. Clear existing dummy internships (optional but good for a clean 50 count)
  await client.query('DELETE FROM internship');

  // 3. Get all valid skill IDs to randomly assign
  const skillsRes = await client.query('SELECT skill_id FROM skill');
  const skillIds = skillsRes.rows.map(r => r.skill_id);

  if (skillIds.length === 0) {
    console.error('❌ No skills found in the database. Run setup-db.mjs first.');
    process.exit(1);
  }

  // 4. Generate 50 internships
  const jobRoles = ['Software Engineer Intern', 'Data Science Intern', 'Frontend Developer Intern', 'Backend Developer Intern', 'Product Manager Intern', 'UI/UX Design Intern', 'Machine Learning Intern', 'DevOps Intern', 'Cloud Computing Intern', 'Full Stack Developer Intern'];
  const durations = ['3 Months', '6 Months', '2 Months', '4 Months'];
  const stipends = ['$2000/mo', '$3000/mo', 'Unpaid', '$1500/mo', '$4000/mo', '$5000/mo'];
  
  for (let i = 0; i < 50; i++) {
    const title = jobRoles[Math.floor(Math.random() * jobRoles.length)];
    const companyIndex = Math.floor(Math.random() * companyIds.length);
    const companyId = companyIds[companyIndex];
    const duration = durations[Math.floor(Math.random() * durations.length)];
    const stipend = stipends[Math.floor(Math.random() * stipends.length)];
    const location = locations[companyIndex]; // matching company location
    
    const res = await client.query(`
      INSERT INTO internship (company_id, title, description, duration, stipend, location)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING internship_id;
    `, [
      companyId,
      title,
      `We are looking for a motivated ${title} to join our fast-paced team at ${companyNames[companyIndex]}. You will be working on exciting projects and learning from industry experts.`,
      duration,
      stipend,
      location
    ]);

    const internshipId = res.rows[0].internship_id;

    // Pick 2-4 random skills based on available skill IDs
    const numSkills = Math.floor(Math.random() * 3) + 2; 
    const shuffledSkills = [...skillIds].sort(() => 0.5 - Math.random());
    const selectedSkills = shuffledSkills.slice(0, numSkills);

    for (const skillId of selectedSkills) {
      await client.query(`
        INSERT INTO internship_requirements (internship_id, skill_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING;
      `, [internshipId, skillId]);
    }
  }

  console.log('✅ Generated 50 sample internships with skill requirements');
  console.log('🎉 Done! Check the /dashboard/internships page.');
  await client.end();
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  client.end();
});
