'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Student {
  student_id: string;
  name: string;
  email: string;
  college: string | null;
  branch: string | null;
  graduation_year: number | null;
  resume_url: string | null;
  skill_count: number;
  application_count: number;
}

export default function AdminStudentsPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data: studentData } = await supabase
        .from('student')
        .select('student_id, name, email, college, branch, graduation_year, resume_url')
        .order('name');

      if (!studentData) { setLoading(false); return; }

      // Enrich with skill & application counts
      const enriched: Student[] = await Promise.all(
        studentData.map(async (s) => {
          const [{ count: skillCount }, { count: appCount }] = await Promise.all([
            supabase.from('student_skill').select('*', { count: 'exact', head: true }).eq('student_id', s.student_id),
            supabase.from('application').select('*', { count: 'exact', head: true }).eq('student_id', s.student_id),
          ]);
          return { ...s, skill_count: skillCount ?? 0, application_count: appCount ?? 0 };
        })
      );

      setStudents(enriched);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <div style={{ color: 'var(--color-text-secondary)', padding: '2rem' }}>Loading students...</div>;

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.college?.toLowerCase().includes(search.toLowerCase()) || ''
  );

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>👩‍🎓 All Students</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          {students.length} registered students in the system.
        </p>
      </div>

      <input
        type="text"
        placeholder="Search by name, email, or college..."
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
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>Student</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>College</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>Branch</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>Grad Year</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>Skills</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>Applications</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>Resume</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No students found.
                </td>
              </tr>
            ) : filtered.map((s, i) => (
              <tr key={s.student_id} style={{
                borderBottom: '1px solid var(--color-border)',
                transition: 'background 0.15s',
              }}>
                <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{i + 1}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{s.name || '—'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>{s.email}</div>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  {s.college || '—'}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  {s.branch || '—'}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  {s.graduation_year || '—'}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                    background: s.skill_count > 0 ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                    color: s.skill_count > 0 ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                  }}>
                    {s.skill_count} skill{s.skill_count !== 1 ? 's' : ''}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600,
                    background: s.application_count > 0 ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.04)',
                    color: s.application_count > 0 ? '#22d3ee' : 'var(--color-text-muted)',
                  }}>
                    {s.application_count} app{s.application_count !== 1 ? 's' : ''}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  {s.resume_url ? (
                    <a href={s.resume_url} target="_blank" rel="noreferrer" style={{
                      color: 'var(--color-primary-light)', fontSize: '0.85rem', textDecoration: 'none',
                    }}>📄 View</a>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
