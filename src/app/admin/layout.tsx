import Link from 'next/link';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Admin Sidebar */}
      <aside style={{
        width: 260, background: 'var(--color-bg-surface)', borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '8px',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
            }}>👑</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' }}>Admin Panel</span>
          </div>
        </div>
        
        <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <Link href="/admin" style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            borderRadius: '8px', color: 'var(--color-text-primary)', textDecoration: 'none',
            background: 'var(--color-border)', fontWeight: 500,
          }}>
            <span>📊</span> System Overview
          </Link>
          <Link href="/admin/students" style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            borderRadius: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 500,
          }}>
            <span>👩‍🎓</span> All Students
          </Link>
          <Link href="/admin/internships" style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
            borderRadius: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 500,
          }}>
            <span>💼</span> All Internships
          </Link>
          <Link href="/dashboard" style={{
             display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
             borderRadius: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none',
             fontWeight: 500, marginTop: 'auto'
          }}>
            <span>⬅️</span> Back to App
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2.5rem 3rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
