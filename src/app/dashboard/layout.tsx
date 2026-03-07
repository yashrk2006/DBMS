'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: '🏠' },
  { href: '/dashboard/internships', label: 'Internships', icon: '💼' },
  { href: '/dashboard/applications', label: 'Applications', icon: '📋' },
  { href: '/dashboard/skills', label: 'My Skills', icon: '⚡' },
  { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'var(--color-bg-card)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        zIndex: 40,
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>⚡</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-primary)' }}>SkillSync</span>
          </Link>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.7rem 0.875rem', borderRadius: '8px', textDecoration: 'none',
                background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: active ? 'var(--color-primary-light)' : 'var(--color-text-secondary)',
                fontWeight: active ? 600 : 400, fontSize: '0.875rem',
                transition: 'all 0.15s',
                borderLeft: active ? '2px solid var(--color-primary)' : '2px solid transparent',
              }}>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <button id="signout-btn" onClick={handleSignOut} style={{
            width: '100%', padding: '0.7rem', borderRadius: '8px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
          }}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 240, padding: '2rem', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
