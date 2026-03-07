'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AdminOverview() {
  const supabase = createClient();
  const [stats, setStats] = useState({ students: 0, companies: 0, internships: 0, applications: 0 });
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { count: sCount }, { count: cCount }, { count: iCount }, { count: aCount },
        { data: apps }, { data: skillData }
      ] = await Promise.all([
        supabase.from('student').select('*', { count: 'exact', head: true }),
        supabase.from('company').select('*', { count: 'exact', head: true }),
        supabase.from('internship').select('*', { count: 'exact', head: true }),
        supabase.from('application').select('*', { count: 'exact', head: true }),
        supabase.from('application')
          .select('application_id, applied_date, status, student:student_id(name, email), internship:internship_id(title, company:company_id(company_name))')
          .order('applied_date', { ascending: false }).limit(10),
        supabase.from('skill').select('skill_name, category').order('skill_name')
      ]);

      setStats({
        students: sCount ?? 0,
        companies: cCount ?? 0,
        internships: iCount ?? 0,
        applications: aCount ?? 0,
      });
      setRecentApps(apps ?? []);
      setSkills(skillData ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <div style={{ color: 'var(--color-text-secondary)', padding: '2rem' }}>Loading admin data...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>System Overview</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Global analytics and recent activity across SkillSync.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { label: 'Total Students', value: stats.students, color: '#6366f1' },
          { label: 'Partner Companies', value: stats.companies, color: '#f59e0b' },
          { label: 'Active Internships', value: stats.internships, color: '#10b981' },
          { label: 'Total Applications', value: stats.applications, color: '#22d3ee' },
        ].map(stat => (
          <div key={stat.label} className="glass-card" style={{ padding: '1.5rem', borderTop: '4px solid ' + stat.color }}>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'revert', gap: '2rem' }}>
        {/* Recent Applications Table */}
        <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Recent Applications</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <th style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.85rem' }}>Student</th>
                <th style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.85rem' }}>Internship</th>
                <th style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.85rem' }}>Company</th>
                <th style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
                <th style={{ padding: '0.75rem', fontWeight: 600, fontSize: '0.85rem' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentApps.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No applications yet.</td>
                </tr>
              ) : recentApps.map(app => (
                <tr key={app.application_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem' }}>
                    <div style={{ fontWeight: 500 }}>{app.student?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{app.student?.email}</div>
                  </td>
                  <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem', fontWeight: 500 }}>{app.internship?.title}</td>
                  <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{app.internship?.company?.company_name}</td>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                      background: app.status === 'Accepted' ? 'rgba(16,185,129,0.1)' : app.status === 'Rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                      color: app.status === 'Accepted' ? '#10b981' : app.status === 'Rejected' ? '#f87171' : 'var(--color-primary-light)'
                    }}>
                      {app.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {new Date(app.applied_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Global Skills List */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Global Skill Library</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {skills.map(s => (
              <span key={s.skill_name} style={{
                padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.85rem',
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)'
              }}>
                {s.skill_name} <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>({s.category})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
