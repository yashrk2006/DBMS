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

const navItems = [
  { href: '/company', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/company/postings', label: 'Jobs', icon: Briefcase },
  { href: '/company/applicants', label: 'Candidates', icon: Users },
  { href: '/company/profile', label: 'Profile', icon: Settings },
];

export default function CompanyLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [companyName, setCompanyName] = useState<string>("Loading...");
  const [authorized, setAuthorized] = useState(false);

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
        <div className="p-6 border-b border-slate-50">
          <GsapMagnetic>
            <Link href="/company" className="flex items-center gap-3 no-underline group text-left">
              <div className="size-9 rounded-xl bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-600/10 shrink-0 group-hover:scale-110 transition-transform duration-500">
                <Building2 size={18} className="text-white" />
              </div>
              <span className="font-black text-lg uppercase tracking-tighter font-display text-slate-900 line-clamp-1 group-hover:text-amber-600 transition-colors" title={companyName}>
                {companyName}
              </span>
            </Link>
          </GsapMagnetic>
        </div>

        <nav className="p-4 flex flex-col gap-1 pb-8 border-b border-slate-50 flex-1">
          {navItems.map(item => (
            <GsapMagnetic key={item.href} strength={0.2}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold group w-full ${
                  pathname === item.href ? 'text-amber-600 bg-amber-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <item.icon size={18} className={pathname === item.href ? 'text-amber-600' : 'group-hover:text-amber-600 transition-colors'} />
                {item.label}
              </Link>
            </GsapMagnetic>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50 space-y-2 bg-slate-50/50 mt-auto">
          <GsapMagnetic>
            <Link
              href="/auth/login"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all text-sm font-semibold w-full"
            >
              <ArrowLeft size={18} />
              Change Role
            </Link>
          </GsapMagnetic>
          <GsapMagnetic>
            <div className="w-full">
               <LogoutButton className="font-semibold text-red-500/60 hover:text-red-500 hover:bg-red-50" />
            </div>
          </GsapMagnetic>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm px-4 py-3 bg-white/80 backdrop-blur-3xl border border-slate-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] rounded-[2.5rem] flex items-center justify-between z-[100]">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-all ${
              pathname === item.href ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-2 rounded-2xl transition-all ${pathname === item.href ? 'bg-amber-100' : 'bg-transparent'}`}>
              <item.icon size={20} />
            </div>
          </Link>
        ))}
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <Link href="/dashboard" className="text-slate-400 p-2">
           <ArrowLeft size={20} />
        </Link>
        <div className="text-red-400">
           <LogoutButton className="p-2" hideText />
        </div>
      </div>

      <main className="flex-1 p-4 md:p-10 pb-32 lg:pb-10 overflow-y-auto z-10">
        <header className="lg:hidden flex items-center justify-between mb-8 pt-4">
           <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-amber-600 flex items-center justify-center">
                <Building2 size={18} className="text-white" />
              </div>
              <span className="font-black text-lg uppercase tracking-tighter text-slate-900 truncate max-w-[150px]">
                {companyName}
              </span>
           </div>
        </header>
        {children}
      </main>
    </div>
  );
}
