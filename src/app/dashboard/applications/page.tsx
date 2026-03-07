'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Application {
  application_id: number;
  applied_date: string;
  status: 'Pending' | 'Under Review' | 'Interviewing' | 'Accepted' | 'Rejected';
  internship: {
    title: string;
    duration: string | null;
    stipend: string | null;
    location: string | null;
    company: { company_name: string } | null;
  } | null;
}

const statusColors: Record<string, string> = {
  Pending: '#f59e0b', 'Under Review': '#6366f1', Interviewing: '#22d3ee',
  Accepted: '#10b981', Rejected: '#ef4444',
};

export default function ApplicationsPage() {
  const supabase = createClient();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || { id: '00000000-0000-0000-0000-000000000000', email: 'demo@student.com' };

      const { data } = await supabase
        .from('application')
        .select(`application_id, applied_date, status,
          internship:internship_id (title, duration, stipend, location,
            company:company_id (company_name))`)
        .eq('student_id', user.id)
        .order('applied_date', { ascending: false });

      setApps((data ?? []) as Application[]);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <div style={{ color: 'var(--color-text-secondary)' }}>Loading applications...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>📋 My Applications</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Track the status of all your internship applications</p>
      </div>

      {apps.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No applications yet</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Browse internships to apply and track your progress here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {apps.map((app) => (
            <div key={app.application_id} className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{app.internship?.title ?? 'Internship'}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  {app.internship?.company?.company_name ?? 'N/A'}
                  {app.internship?.location ? ` · ${app.internship.location}` : ''}
                  {app.internship?.duration ? ` · ${app.internship.duration}` : ''}
                </p>
                {app.internship?.stipend && <p style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.15rem' }}>💰 {app.internship.stipend}</p>}
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                  Applied: {new Date(app.applied_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div style={{
                padding: '0.4rem 1.1rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.8rem',
                background: `${statusColors[app.status]}18`,
                color: statusColors[app.status],
                border: `1px solid ${statusColors[app.status]}40`,
              }}>
                {app.status}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {apps.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          {Object.entries(statusColors).map(([status, color]) => {
            const count = apps.filter(a => a.status === status).length;
            return count > 0 ? (
              <div key={status} className="glass-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{status}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{count}</span>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
