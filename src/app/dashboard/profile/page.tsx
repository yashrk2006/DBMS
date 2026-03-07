'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState({ name: '', college: '', branch: '', graduation_year: '', resume_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || { id: '00000000-0000-0000-0000-000000000000', email: 'demo@student.com' };
      setUserId(user.id);
      const { data } = await supabase.from('student').select('*').eq('student_id', user.id).single();
      if (data) {
        setProfile({
          name: data.name ?? '',
          college: data.college ?? '',
          branch: data.branch ?? '',
          graduation_year: data.graduation_year?.toString() ?? '',
          resume_url: data.resume_url ?? '',
        });
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('student').update({
      name: profile.name,
      college: profile.college,
      branch: profile.branch,
      graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : null,
      resume_url: profile.resume_url || null,
    }).eq('student_id', userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.8rem 1rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px', color: 'var(--color-text-primary)',
    fontSize: '0.9rem', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.8rem', fontWeight: 600,
    marginBottom: '0.5rem', color: 'var(--color-text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  if (loading) return <div style={{ color: 'var(--color-text-secondary)' }}>Loading profile...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>👤 My Profile</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Keep your profile up-to-date for better matches</p>
      </div>

      <div className="glass-card" style={{ padding: '2rem', maxWidth: 600 }}>
        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input id="profile-name" type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Rahul Sharma" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>College</label>
              <input id="profile-college" type="text" value={profile.college} onChange={e => setProfile(p => ({ ...p, college: e.target.value }))} placeholder="e.g. IIT Delhi" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Branch</label>
              <input id="profile-branch" type="text" value={profile.branch} onChange={e => setProfile(p => ({ ...p, branch: e.target.value }))} placeholder="e.g. Computer Science" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Graduation Year</label>
            <input id="profile-grad-year" type="number" value={profile.graduation_year} onChange={e => setProfile(p => ({ ...p, graduation_year: e.target.value }))} placeholder="e.g. 2026" min="2020" max="2035" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Resume URL</label>
            <input id="profile-resume" type="url" value={profile.resume_url} onChange={e => setProfile(p => ({ ...p, resume_url: e.target.value }))} placeholder="https://drive.google.com/..." style={inputStyle} />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>Paste a Google Drive or Notion link to your resume PDF</p>
          </div>

          <button id="save-profile-btn" type="submit" disabled={saving} style={{
            padding: '0.85rem', borderRadius: '8px', border: 'none',
            background: saved ? '#10b981' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
            transition: 'background 0.3s',
          }}>
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
