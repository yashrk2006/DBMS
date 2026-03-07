'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Internship {
  internship_id: number;
  title: string;
  description: string | null;
  duration: string | null;
  stipend: string | null;
  location: string | null;
  company: { company_name: string } | null;
  required_skills: Array<{ skill_id: number; skill_name: string }>;
  match_percentage: number;
  applied: boolean;
}

export default function InternshipsPage() {
  const supabase = createClient();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || { id: '00000000-0000-0000-0000-000000000000', email: 'demo@student.com' };

    // Get student skills
    const { data: studentSkills } = await supabase
      .from('student_skill').select('skill_id').eq('student_id', user.id);
    const mySkillIds = new Set((studentSkills ?? []).map((s: { skill_id: number }) => s.skill_id));

    // Get all internships with company + required skills
    const { data: internshipsData } = await supabase
      .from('internship')
      .select(`internship_id, title, description, duration, stipend, location,
        company:company_id (company_name),
        required_skills:internship_requirements (skill_id, skill:skill_id (skill_name))`);

    // Get applications
    const { data: appsData } = await supabase
      .from('application').select('internship_id').eq('student_id', user.id);
    const appliedIds = new Set((appsData ?? []).map((a: { internship_id: number }) => a.internship_id));

    const mapped: Internship[] = (internshipsData ?? []).map((i: {
      internship_id: number;
      title: string;
      description: string | null;
      duration: string | null;
      stipend: string | null;
      location: string | null;
      company: { company_name: string } | null;
      required_skills: Array<{ skill_id: number; skill: { skill_name: string } | null }>;
    }) => {
      const reqSkills = (i.required_skills ?? []).map((rs) => ({
        skill_id: rs.skill_id,
        skill_name: rs.skill?.skill_name ?? '',
      }));
      const matched = reqSkills.filter((rs) => mySkillIds.has(rs.skill_id)).length;
      const match_percentage = reqSkills.length > 0 ? Math.round((matched / reqSkills.length) * 100) : 0;
      return {
        internship_id: i.internship_id,
        title: i.title,
        description: i.description,
        duration: i.duration,
        stipend: i.stipend,
        location: i.location,
        company: i.company,
        required_skills: reqSkills,
        match_percentage,
        applied: appliedIds.has(i.internship_id),
      };
    }).sort((a, b) => b.match_percentage - a.match_percentage);

    setInternships(mapped);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function handleApply(internship_id: number) {
    setApplying(internship_id);
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || { id: '00000000-0000-0000-0000-000000000000', email: 'demo@student.com' };
    await supabase.from('application').insert({ student_id: user.id, internship_id });
    await load();
    setApplying(null);
  }

  const matchColor = (pct: number) => pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

  const filtered = internships.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    (i.company?.company_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ color: 'var(--color-text-secondary)', padding: '2rem' }}>Loading internships...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>💼 Internships</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Ranked by your skill match percentage</p>
      </div>

      {/* Search */}
      <input
        id="internship-search"
        type="text"
        placeholder="Search by title or company..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', maxWidth: 480, padding: '0.75rem 1rem',
          background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
          borderRadius: '8px', color: 'var(--color-text-primary)', fontSize: '0.9rem',
          outline: 'none', marginBottom: '1.5rem',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.map((i) => (
          <div key={i.internship_id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Match Circle */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
              border: `3px solid ${matchColor(i.match_percentage)}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: matchColor(i.match_percentage), lineHeight: 1 }}>{i.match_percentage}%</span>
              <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>match</span>
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.15rem' }}>{i.title}</h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                    {i.company?.company_name} · {i.location ?? 'Remote'} · {i.duration ?? 'Flexible'}
                  </p>
                  {i.stipend && <p style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.2rem' }}>💰 {i.stipend}</p>}
                </div>
                <button
                  id={`apply-btn-${i.internship_id}`}
                  onClick={() => handleApply(i.internship_id)}
                  disabled={i.applied || applying === i.internship_id}
                  style={{
                    padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none',
                    background: i.applied ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: i.applied ? '#10b981' : '#fff',
                    fontWeight: 600, fontSize: '0.85rem', cursor: i.applied ? 'default' : 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {applying === i.internship_id ? 'Applying...' : i.applied ? '✓ Applied' : 'Apply Now'}
                </button>
              </div>

              {i.description && <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '0.75rem', lineHeight: 1.6 }}>{i.description}</p>}

              {/* Required Skills */}
              {i.required_skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                  {i.required_skills.map((rs) => (
                    <span key={rs.skill_id} style={{
                      padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem',
                      background: 'rgba(99,102,241,0.1)', color: 'var(--color-primary-light)',
                      border: '1px solid rgba(99,102,241,0.2)',
                    }}>{rs.skill_name}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>No internships found.</p>}
      </div>
    </div>
  );
}
