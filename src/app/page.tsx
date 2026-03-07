'use client';

import Link from 'next/link';

const features = [
  {
    icon: '🎯',
    title: 'Smart Skill Matching',
    description: 'Our algorithm matches your skills to internship requirements and shows you a compatibility score.',
  },
  {
    icon: '🏢',
    title: 'Top Companies',
    description: 'Browse internships from industry-leading companies across tech, finance, and more.',
  },
  {
    icon: '📊',
    title: 'Analytics Dashboard',
    description: 'Track your applications, improve your profile, and see where you stand in real time.',
  },
];

const steps = [
  { num: '01', title: 'Create Your Profile', desc: 'Sign up and add your skills with proficiency levels.' },
  { num: '02', title: 'Browse Matches', desc: 'See internships ranked by your skill match percentage.' },
  { num: '03', title: 'Apply in One Click', desc: 'Apply directly and track your application status live.' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.25rem 5%', borderBottom: '1px solid var(--color-border)',
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(3,7,18,0.8)', backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
          }}>⚡</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>
            SkillSync
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/admin" style={{
            color: 'var(--color-text-secondary)', textDecoration: 'none',
            fontSize: '0.9rem', transition: 'color 0.2s', fontWeight: 500,
          }}>👑 Admin Panel</Link>
          <Link href="/dashboard" style={{
            color: 'var(--color-text-secondary)', textDecoration: 'none',
            fontSize: '0.9rem', transition: 'color 0.2s',
          }}>Student App</Link>
          <Link href="/dashboard" style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff', textDecoration: 'none', padding: '0.5rem 1.25rem',
            borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600,
            transition: 'opacity 0.2s',
          }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '7rem 5% 5rem', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow blobs */}
        <div style={{
          position: 'absolute', top: '10%', left: '20%', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '20%', right: '15%', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(34,211,238,0.08), transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div className="animate-fade-in-up" style={{ position: 'relative' }}>
          <span style={{
            display: 'inline-block', background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.3)', color: 'var(--color-primary-light)',
            padding: '0.35rem 1rem', borderRadius: '999px', fontSize: '0.8rem',
            fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1.75rem',
          }}>
            🚀 Student Skill & Internship Matching System
          </span>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: '1.5rem',
            lineHeight: 1.1,
          }}>
            Find Internships That<br />
            <span className="gradient-text">Match Your Skills</span>
          </h1>

          <p style={{
            fontSize: '1.15rem', color: 'var(--color-text-secondary)',
            maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.7,
          }}>
            SkillSync intelligently matches your skill profile to companies looking for exactly what you offer. Apply smarter, not harder.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff', textDecoration: 'none',
              padding: '0.85rem 2rem', borderRadius: '10px',
              fontWeight: 600, fontSize: '1rem',
              boxShadow: '0 0 30px rgba(99,102,241,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}>
              I&apos;m a Student →
            </Link>
            <Link href="/dashboard" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)', textDecoration: 'none',
              padding: '0.85rem 2rem', borderRadius: '10px',
              fontWeight: 600, fontSize: '1rem',
              transition: 'background 0.2s',
            }}>
              Post Internships 🏢
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '3rem',
          marginTop: '4rem', flexWrap: 'wrap',
        }}>
          {[['500+', 'Internships'], ['2K+', 'Students'], ['98%', 'Match Accuracy']].map(([num, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{num}</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 5%' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '3rem' }}>
          Everything You Need to <span className="gradient-text">Land Your Dream Role</span>
        </h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem', maxWidth: 1100, margin: '0 auto',
        }}>
          {features.map((f) => (
            <div key={f.title} className="glass-card" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '5rem 5%', background: 'rgba(15,23,42,0.4)' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '3rem' }}>
          How It <span className="gradient-text">Works</span>
        </h2>
        <div style={{
          display: 'flex', gap: '2rem', maxWidth: 900,
          margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {steps.map((s) => (
            <div key={s.num} style={{ textAlign: 'center', maxWidth: 240 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', fontWeight: 800, margin: '0 auto 1rem',
                fontFamily: 'var(--font-display)',
              }}>{s.num}</div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '6rem 5%', textAlign: 'center' }}>
        <div className="glass-card animate-pulse-glow" style={{
          maxWidth: 700, margin: '0 auto', padding: '3.5rem 2rem',
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            Ready to Find Your <span className="gradient-text">Perfect Match?</span>
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            Join thousands of students who have already found their dream internships.
          </p>
          <Link href="/dashboard" style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff', textDecoration: 'none',
            padding: '0.85rem 2.5rem', borderRadius: '10px',
            fontWeight: 700, fontSize: '1rem',
          }}>
            Start for Free — No Credit Card Needed
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '2rem 5%', textAlign: 'center',
        color: 'var(--color-text-muted)', fontSize: '0.875rem',
      }}>
        © 2025 SkillSync · Built with ❤️ for DBMS Project
      </footer>
    </div>
  );
}
