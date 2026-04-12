/**
 * PRODUCTION DATA SEEDER — BoothIQ
 * =========================================
 * Inserts 20+ Tier-1 & Tier-2 Companies
 * Inserts 50+ Diverse Internships
 * Randomizes student data for diversity
 *
 * RUN: node src/scripts/SEED_PRODUCTION_DATA.mjs
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !SK) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'apikey': SK,
  'Authorization': `Bearer ${SK}`,
};

async function rest(method, path, body) {
  console.log(`\x1b[90m[REST]\x1b[0m \x1b[36m${method}\x1b[0m ${path}`);
  const res = await fetch(`${URL_BASE}${path}`, {
    method,
    headers: { ...headers, 'Prefer': 'return=representation,resolution=ignore-duplicates' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { ok: res.ok, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, data: text }; }
}

async function adminAuth(method, path, body) {
  console.log(`\x1b[90m[AUTH]\x1b[0m \x1b[35m${method}\x1b[0m /auth/v1${path}`);
  const res = await fetch(`${URL_BASE}/auth/v1${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  return { ok: res.ok, data };
}

// ── DATA DEFINITIONS ─────────────────────────────────────────────────────────

const companies = [
  { name: 'Google', industry: 'Cloud & AI', email: 'hiring@google.com', website: 'https://google.com', description: 'Global leader in search, cloud, and artificial intelligence.' },
  { name: 'Stripe', industry: 'FinTech', email: 'careers@stripe.com', website: 'https://stripe.com', description: 'Financial infrastructure for the internet.' },
  { name: 'Microsoft', industry: 'Software', email: 'talent@microsoft.com', website: 'https://microsoft.com', description: 'Empowering every person and every organization on the planet to achieve more.' },
  { name: 'Tesla', industry: 'Automotive & Energy', email: 'jobs@tesla.com', website: 'https://tesla.com', description: 'Accelerating the world\'s transition to sustainable energy.' },
  { name: 'SpaceX', industry: 'Aerospace', email: 'hiring@spacex.com', website: 'https://spacex.com', description: 'Revolutionizing space technology to enable people to live on other planets.' },
  { name: 'Amazon', industry: 'E-commerce & Cloud', email: 'recruiting@amazon.com', website: 'https://amazon.com', description: 'Earth\'s most customer-centric company.' },
  { name: 'Meta', industry: 'Social Media & VR', email: 'careers@meta.com', website: 'https://meta.com', description: 'Giving people the power to build community and bring the world closer together.' },
  { name: 'Netflix', industry: 'Entertainment', email: 'jobs@netflix.com', website: 'https://netflix.com', description: 'The world\'s leading streaming entertainment service.' },
  { name: 'Reddit', industry: 'Social Media', email: 'hiring@reddit.com', website: 'https://reddit.com', description: 'The front page of the internet.' },
  { name: 'OpenAI', industry: 'Artificial Intelligence', email: 'talent@openai.com', website: 'https://openai.com', description: 'Ensuring that artificial general intelligence benefits all of humanity.' },
  { name: 'Airbnb', industry: 'Hospitality', email: 'careers@airbnb.com', website: 'https://airbnb.com', description: 'Belong anywhere.' },
  { name: 'Uber', industry: 'Transportation', email: 'jobs@uber.com', website: 'https://uber.com', description: 'Igniting opportunity by setting the world in motion.' },
  { name: 'Lyft', industry: 'Transportation', email: 'careers@lyft.com', website: 'https://lyft.com', description: 'Driven by purpose.' },
  { name: 'Spotify', industry: 'Audio Streaming', email: 'jobs@spotify.com', website: 'https://spotify.com', description: 'Unlock the potential of human creativity.' },
  { name: 'Coinbase', industry: 'Blockchain', email: 'talent@coinbase.com', website: 'https://coinbase.com', description: 'Creating an open financial system for the world.' },
  { name: 'Slack', industry: 'Communication', email: 'hiring@slack.com', website: 'https://slack.com', description: 'Where work happens.' },
  { name: 'GitHub', industry: 'DevTools', email: 'careers@github.com', website: 'https://github.com', description: 'The complete developer platform.' },
  { name: 'Nvidia', industry: 'Hardware & AI', email: 'jobs@nvidia.com', website: 'https://nvidia.com', description: 'The engine of modern AI.' },
  { name: 'AMD', industry: 'Hardware', email: 'talent@amd.com', website: 'https://amd.com', description: 'Together we advance.' },
  { name: 'Intel', industry: 'Hardware', email: 'hiring@intel.com', website: 'https://intel.com', description: 'Shaping the future of technology.' },
];

const internshipRoles = [
  'Frontend Engineer Intern', 'Backend Developer Intern', 'Full Stack Engineer Intern', 
  'Data Science Intern', 'AI/ML Research Intern', 'Cloud Architect Intern', 
  'Cybersecurity Analyst Intern', 'Product Management Intern', 'UI/UX Design Intern',
  'Software Engineer Intern (SDE-1)', 'Mobile App Developer Intern', 'DevOps Engineer Intern'
];

// ── SEEDING LOGIC ────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting Production Seeding...');

  for (const corp of companies) {
    console.log(`\n🏢 Seeding Company: ${corp.name}`);
    
    // 1. Upsert Auth User
    const listRes = await adminAuth('GET', `/admin/users?email=${encodeURIComponent(corp.email)}`);
    let userId = listRes.data?.users?.find(u => u.email === corp.email)?.id;
    
    if (!userId) {
      const createRes = await adminAuth('POST', '/admin/users', {
        email: corp.email,
        password: 'company123456',
        email_confirm: true,
        user_metadata: { full_name: corp.name, role: 'company' },
        app_metadata: { role: 'company' }
      });
      if (!createRes.ok) { console.error(`   ❌ Auth failed for ${corp.name}:`, createRes.data); continue; }
      userId = createRes.data.id;
      console.log(`   ✔ Auth User Created: ${userId}`);
    } else {
      console.log(`   ✔ Auth User Exists: ${userId}`);
    }

    // 2. Upsert Company Profile
    await rest('POST', '/rest/v1/company', {
      company_id: userId,
      company_name: corp.name,
      email: corp.email,
      industry: corp.industry,
      website: corp.website,
      description: corp.description,
      is_verified: true
    });
    console.log(`   ✔ Company Profile Ready`);

    // 3. Insert Internships
    const numInternships = Math.floor(Math.random() * 3) + 2; // 2-4 internships per company
    for (let i = 0; i < numInternships; i++) {
      const role = internshipRoles[Math.floor(Math.random() * internshipRoles.length)];
      const res = await rest('POST', '/rest/v1/internship', {
        company_id: userId,
        title: role,
        description: `High-impact internship at ${corp.name} focused on ${corp.industry}. Join our elite team.`,
        requirements: ['GPA > 3.5', 'Proficient in Python/React', 'Strong Problem Solving'],
        location: ['San Francisco, CA', 'New York, NY', 'Remote', 'London, UK', 'Bangalore, IN'][Math.floor(Math.random() * 5)],
        stipend: `$${Math.floor(Math.random() * 5000) + 3000}/mo`,
        start_date: '2025-06-01',
        duration: '3 Months',
        posted_at: new Date(Date.now() - Math.random() * 10 * 86400000).toISOString()
      });
      if (res.ok) console.log(`      ✔ Posted: ${role}`);
    }
  }

  // 4. Randomize Student Data (Diversity)
  console.log('\n👤 Randomizing Student Activity...');
  const studentsRes = await rest('GET', '/rest/v1/student?select=student_id,name');
  if (studentsRes.ok && Array.isArray(studentsRes.data)) {
    const internshipsRes = await rest('GET', '/rest/v1/internship?select=internship_id');
    const internshipIds = internshipsRes.data.map(i => i.internship_id);
    
    for (const student of studentsRes.data) {
      if (student.name.includes('Demo')) {
        await rest('PATCH', `/rest/v1/student?student_id=eq.${student.student_id}`, { name: student.name.replace('Demo ', 'Professional ') });
      }
      
      // Random applications
      if (internshipIds.length > 0) {
        const applyTo = internshipIds.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 4) + 1);
        for (const id of applyTo) {
          await rest('POST', '/rest/v1/application', {
            student_id: student.student_id,
            internship_id: id,
            status: ['Pending', 'Under Review', 'Interviewing'][Math.floor(Math.random() * 3)],
            ai_match_score: Math.floor(Math.random() * 30) + 65
          });
        }
      }
    }
    console.log(`   ✔ Randomized ${studentsRes.data.length} students`);
  }

  console.log('\n✅ SEEDING COMPLETE');
}

main().catch(console.error);
