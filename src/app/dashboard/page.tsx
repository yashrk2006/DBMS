'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Stats {
  applications: number;
  skills: number;
  matchedInternships: number;
}

export default function DashboardPage() {
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState('');
  const [stats, setStats] = useState<Stats>({ applications: 0, skills: 0, matchedInternships: 0 });
  const [recentApplications, setRecentApplications] = useState<Array<{
    application_id: number;
    applied_date: string;
    status: string;
    internship: { title: string; company: { company_name: string } | null } | null;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || { id: '00000000-0000-0000-0000-000000000000', email: 'demo@student.com' };
      setUserEmail(user.email ?? '');

      const [appRes, skillRes, internRes] = await Promise.all([
        supabase.from('application').select('*', { count: 'exact', head: true }).eq('student_id', user.id),
        supabase.from('student_skill').select('*', { count: 'exact', head: true }).eq('student_id', user.id),
        supabase.from('internship').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        applications: appRes.count ?? 0,
        skills: skillRes.count ?? 0,
        matchedInternships: internRes.count ?? 0,
      });

      const { data: apps } = await supabase
        .from('application')
        .select(`application_id, applied_date, status, internship:internship_id (title, company:company_id (company_name))`)
        .eq('student_id', user.id)
        .order('applied_date', { ascending: false })
        .limit(5);

      if (apps) setRecentApplications(apps as typeof recentApplications);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const statCards = [
    { label: 'Applications Sent', value: stats.applications, icon: '📋', color: '#6366f1' },
    { label: 'Skills Added', value: stats.skills, icon: '⚡', color: '#22d3ee' },
    { label: 'Open Internships', value: stats.matchedInternships, icon: '💼', color: '#10b981' },
  ];

  const statusColors: Record<string, string> = {
    Pending: '#f59e0b', 'Under Review': '#6366f1', Interviewing: '#22d3ee',
    Accepted: '#10b981', Rejected: '#ef4444',
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚡</div>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
          Welcome back! 👋
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{userEmail}</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map((card) => (
          <div key={card.label} className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: '12px', background: `${card.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: card.color }}>{card.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚀 Quick Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <Link href="/dashboard/internships" style={{ display: 'block', padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', color: 'var(--color-primary-light)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
              💼 Browse Matched Internships
            </Link>
            <Link href="/dashboard/skills" style={{ display: 'block', padding: '0.75rem 1rem', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '8px', color: '#22d3ee', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
              ⚡ Update My Skills
            </Link>
            <Link href="/dashboard/profile" style={{ display: 'block', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', color: '#10b981', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
              👤 Complete Your Profile
            </Link>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>📋 Recent Applications</h2>
          {recentApplications.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No applications yet. Browse internships to get started!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentApplications.map((app) => (
                <div key={app.application_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{app.internship?.title ?? 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{app.internship?.company?.company_name ?? 'N/A'}</div>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.6rem', borderRadius: '999px',
                    background: `${statusColors[app.status] ?? '#6366f1'}20`,
                    color: statusColors[app.status] ?? '#6366f1',
                    fontSize: '0.7rem', fontWeight: 700,
                  }}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
