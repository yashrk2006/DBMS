'use client';

import { ReactNode, useEffect, useState } from 'react';
import { LayoutDashboard, GraduationCap, Briefcase, ArrowLeft, Crown, BarChart3, ShieldAlert, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Students', icon: GraduationCap },
  { href: '/admin/internships', label: 'Internships', icon: Briefcase },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Governance', icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const role = session.user.app_metadata?.role || session.user.user_metadata?.role;

      if (role !== 'admin') {
        router.push('/dashboard'); 
        return;
      }

      setAuthorized(true);
      setLoading(false);
    }
    
    checkAdmin();
  }, [router]);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-10 gap-8">
        <div className="size-20 rounded-3xl bg-amber-600/10 border border-amber-600/20 flex items-center justify-center text-amber-600 animate-pulse">
           <ShieldAlert size={40} />
        </div>
        <div className="text-center space-y-2">
            <h2 className="text-white text-xl font-black uppercase tracking-tighter">Signing in as Admin</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[4px]">Opening Admin Tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-white border-r border-slate-100 flex-col shadow-sm sticky top-0 h-screen overflow-y-auto z-50">
        <div className="p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="size-10 rounded-2xl bg-slate-950 flex items-center justify-center shadow-2xl shadow-slate-900/20">
            <Crown size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg uppercase tracking-tighter font-display text-slate-900 leading-none">Admin</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Platform Gov</span>
          </div>
        </div>

        <nav className="p-4 flex flex-col gap-1 pb-8 border-b border-slate-50">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest group ${
                pathname === item.href ? 'text-indigo-600 bg-indigo-50 border border-indigo-100' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <item.icon size={16} className={pathname === item.href ? 'text-indigo-600' : 'group-hover:text-indigo-600 transition-colors'} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50 space-y-2 mt-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-5 py-3 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft size={16} />
            Exit Command
          </Link>
          <LogoutButton className="hover:bg-red-50 text-red-500/60 transition-all font-black text-[10px]" />
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm px-4 py-3 bg-white/80 backdrop-blur-3xl border border-slate-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] rounded-[2.5rem] flex items-center justify-between z-[100]">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-all ${
              pathname === item.href ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-2.5 rounded-2xl transition-all ${pathname === item.href ? 'bg-indigo-100' : 'bg-transparent'}`}>
              <item.icon size={22} />
            </div>
          </Link>
        ))}
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <Link href="/dashboard" className="text-slate-400 p-2.5">
          <ArrowLeft size={22} />
        </Link>
      </div>

      <main className="flex-1 p-6 md:p-12 pb-32 lg:pb-12 overflow-y-auto">
        <DashboardHeader 
          userName="Adminstrator"
          role="admin"
          rollNo="001"
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          notifications={[]}
          onProfileClick={() => router.push('/admin/settings')}
          onLogout={() => supabase.auth.signOut()}
          onMarkRead={() => {}}
        />
        {children}
      </main>
    </div>
  );
}
