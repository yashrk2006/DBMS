'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Skill { skill_id: number; skill_name: string; category: string | null; }
interface StudentSkill { skill_id: number; proficiency_level: string; skill: Skill; }

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
const levelColors: Record<string, string> = {
  Beginner: '#6366f1', Intermediate: '#22d3ee', Advanced: '#10b981', Expert: '#f59e0b',
};

export default function SkillsPage() {
  const supabase = createClient();
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [mySkills, setMySkills] = useState<StudentSkill[]>([]);
  const [adding, setAdding] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<typeof LEVELS[number]>('Beginner');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || { id: '00000000-0000-0000-0000-000000000000', email: 'demo@student.com' };
    setUserId(user.id);

    const [{ data: skills }, { data: mySkillsData }] = await Promise.all([
      supabase.from('skill').select('*').order('skill_name'),
      supabase.from('student_skill').select('skill_id, proficiency_level, skill:skill_id (skill_id, skill_name, category)').eq('student_id', user.id),
    ]);

    setAllSkills(skills ?? []);
    const normalized = (mySkillsData ?? []).map((s: { skill_id: number; proficiency_level: string; skill: Skill | Skill[] }) => ({
      skill_id: s.skill_id,
      proficiency_level: s.proficiency_level,
      skill: Array.isArray(s.skill) ? s.skill[0] : s.skill,
    }));
    setMySkills(normalized);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function addSkill() {
    if (!selectedSkillId || !userId) return;
    setAdding(true);
    await supabase.from('student_skill').upsert({
      student_id: userId,
      skill_id: parseInt(selectedSkillId),
      proficiency_level: selectedLevel,
    });
    await load();
    setSelectedSkillId('');
    setAdding(false);
  }

  async function removeSkill(skill_id: number) {
    await supabase.from('student_skill').delete().eq('student_id', userId).eq('skill_id', skill_id);
    await load();
  }

  if (loading) return <div style={{ color: 'var(--color-text-secondary)' }}>Loading skills...</div>;

  const mySkillIds = new Set(mySkills.map(s => s.skill_id));
  const availableSkills = allSkills.filter(s => !mySkillIds.has(s.skill_id));

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>⚡ My Skills</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Add your skills to get matched with the best internships</p>
      </div>

      {/* Add Skill Form */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>➕ Add a Skill</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase' }}>Skill</label>
            <select
              id="skill-select"
              value={selectedSkillId}
              onChange={e => setSelectedSkillId(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)', fontSize: '0.9rem', outline: 'none',
              }}
            >
              <option value="">Select a skill...</option>
              {availableSkills.map(s => <option key={s.skill_id} value={s.skill_id}>{s.skill_name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase' }}>Proficiency</label>
            <select
              id="level-select"
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value as typeof LEVELS[number])}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)', fontSize: '0.9rem', outline: 'none',
              }}
            >
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <button
            id="add-skill-btn"
            onClick={addSkill}
            disabled={!selectedSkillId || adding}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            {adding ? 'Adding...' : 'Add Skill'}
          </button>
        </div>
      </div>

      {/* Skills Grid */}
      {mySkills.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>You haven&apos;t added any skills yet. Add skills above to start matching!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {mySkills.map((ms) => (
            <div key={ms.skill_id} className="glass-card" style={{ padding: '1.25rem', position: 'relative' }}>
              <div style={{
                display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '999px',
                background: `${levelColors[ms.proficiency_level]}20`,
                color: levelColors[ms.proficiency_level],
                fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.6rem',
              }}>
                {ms.proficiency_level}
              </div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{ms.skill?.skill_name}</h3>
              {ms.skill?.category && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{ms.skill.category}</p>}
              <button
                id={`remove-skill-${ms.skill_id}`}
                onClick={() => removeSkill(ms.skill_id)}
                style={{
                  position: 'absolute', top: '0.75rem', right: '0.75rem',
                  background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px',
                  color: '#f87171', cursor: 'pointer', padding: '0.25rem 0.5rem', fontSize: '0.75rem',
                }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
