'use client';

import { ReactNode, useState, useEffect } from 'react';
import { LayoutDashboard, Users, Briefcase, ArrowLeft, Building2, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { NeuralParticleField } from '@/components/ui/NeuralParticleField';
import { LiquidProgressBar } from '@/components/ui/LiquidProgressBar';
import GsapMagnetic from '@/components/ui/GsapMagnetic';
import { supabase } from '@/lib/supabase';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

const navItems = [
  { href: '/company', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/company/postings', label: 'Jobs', icon: Briefcase },
  { href: '/company/applicants', label: 'Candidates', icon: Users },
  { href: '/company/profile', label: 'Organization', icon: Building2 },
  { href: '/company/settings', label: 'Settings', icon: Settings },
];

export default function CompanyLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [companyName, setCompanyName] = useState<string>("Loading...");
  const [authorized, setAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function initSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }
      
      const role = session.user.app_metadata?.role || session.user.user_metadata?.role;
      if (role !== 'company') {
        router.push('/dashboard');
        return;
      }

      const userId = session.user.id;
      setAuthorized(true);
      
      try {
        const res = await fetch(`/api/company/profile?companyId=${userId}`);
        const data = await res.json();
        if (data.success) {
          setCompanyName(data.company.name);
        } else {
          setCompanyName("Hiring Partner");
        }
      } catch (e) {
        setCompanyName("Hiring Partner");
      }
    }
    initSession();
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 gap-8">
        <div className="size-20 rounded-3xl bg-amber-600/10 border border-amber-600/20 flex items-center justify-center text-amber-600 animate-bounce">
           <Building2 size={40} />
        </div>
        <div className="text-center space-y-2">
            <h2 className="text-slate-900 text-xl font-black uppercase tracking-tighter">Loading Company Portal</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[4px]">Preparing Hiring Tools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
      <LiquidProgressBar />
      <NeuralParticleField />
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-white border-r border-slate-100 flex-col shadow-sm sticky top-0 h-screen overflow-y-auto z-50">
        <div className="p-8 border-b border-slate-50">
          <GsapMagnetic>
            <Link href="/company" className="flex items-center gap-4 no-underline group text-left">
              <div className="size-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20 shrink-0 group-hover:scale-110 transition-transform duration-500">
                <Building2 size={20} className="text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-black text-lg uppercase tracking-tighter font-display text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors" title={companyName}>
                  Partner
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-tight truncate">{companyName}</span>
              </div>
            </Link>
          </GsapMagnetic>
        </div>

        <nav className="p-4 flex flex-col gap-1 pb-8 border-b border-slate-50 flex-1">
          {navItems.map(item => (
            <GsapMagnetic key={item.href} strength={0.2}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest group w-full ${
                  pathname === item.href ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <item.icon size={16} className={pathname === item.href ? 'text-emerald-600' : 'group-hover:text-emerald-600 transition-colors'} />
                {item.label}
              </Link>
            </GsapMagnetic>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50 space-y-2 bg-slate-50/50 mt-auto">
          <GsapMagnetic>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-5 py-3 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest w-full"
            >
              <ArrowLeft size={16} />
              Exit Portal
            </Link>
          </GsapMagnetic>
          <GsapMagnetic>
            <div className="w-full">
               <LogoutButton className="font-black text-[10px] uppercase tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-50 py-3" />
            </div>
          </GsapMagnetic>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-sm:w-[94%] px-4 py-3 bg-white/80 backdrop-blur-3xl border border-slate-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] rounded-[2.5rem] flex items-center justify-between z-[100]">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-all ${
              pathname === item.href ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-2.5 rounded-2xl transition-all ${pathname === item.href ? 'bg-emerald-100' : 'bg-transparent'}`}>
              <item.icon size={22} />
            </div>
          </Link>
        ))}
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <Link href="/dashboard" className="text-slate-400 p-2.5">
           <ArrowLeft size={22} />
        </Link>
      </div>

      <main className="flex-1 p-6 md:p-12 pb-32 lg:pb-12 overflow-y-auto z-10 relative">
        <DashboardHeader 
          userName={companyName}
          role="company"
          rollNo="PARTNER-HQ"
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          notifications={[]}
          onProfileClick={() => router.push('/company/settings')}
          onLogout={() => supabase.auth.signOut()}
          onMarkRead={() => {}}
        />
        {children}
      </main>
    </div>
  );
}
