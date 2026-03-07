'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Internship {
  internship_id: number;
  title: string;
  duration: string | null;
  stipend: string | null;
  location: string | null;
  company: { company_name: string } | null;
  req_count: number;
  app_count: number;
}

export default function AdminInternshipsPage() {
  const supabase = createClient();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('internship')
        .select('internship_id, title, duration, stipend, location, company:company_id(company_name)')
        .order('internship_id');

      if (!data) { setLoading(false); return; }

      const enriched: Internship[] = await Promise.all(
        data.map(async (i) => {
          const [{ count: reqCount }, { count: appCount }] = await Promise.all([
            supabase.from('internship_requirements').select('*', { count: 'exact', head: true }).eq('internship_id', i.internship_id),
            supabase.from('application').select('*', { count: 'exact', head: true }).eq('internship_id', i.internship_id),
          ]);
          return { ...i, req_count: reqCount ?? 0, app_count: appCount ?? 0 };
        })
      );

      setInternships(enriched);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <div style={{ color: 'var(--color-text-secondary)', padding: '2rem' }}>Loading internships...</div>;

  const filtered = internships.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    (i.company?.company_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>💼 All Internships</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          {internships.length} internships posted in the system.
        </p>
      </div>

      <input
        type="text"
        placeholder="Search by title or company..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', maxWidth: 480, padding: '0.75rem 1rem', marginBottom: '1.5rem',
          background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
          borderRadius: '8px', color: 'var(--color-text-primary)', fontSize: '0.9rem', outline: 'none',
        }}
      />

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>#</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>Role</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>Company</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>Location</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>Duration</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>Stipend</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>Skills Req.</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>Applicants</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No internships found.
                </td>
              </tr>
            ) : filtered.map((i, idx) => (
              <tr key={i.internship_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{idx + 1}</td>
                <td style={{ padding: '1rem', fontWeight: 600, fontSize: '0.9rem' }}>{i.title}</td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  {i.company?.company_name ?? '—'}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  {i.location ?? '—'}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  {i.duration ?? '—'}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#10b981', fontWeight: 500 }}>
                  {i.stipend ?? '—'}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                    background: 'rgba(99,102,241,0.12)', color: 'var(--color-primary-light)',
                  }}>
                    {i.req_count}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                    background: i.app_count > 0 ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.04)',
                    color: i.app_count > 0 ? '#22d3ee' : 'var(--color-text-muted)',
                  }}>
                    {i.app_count}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
