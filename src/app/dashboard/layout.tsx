'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Toaster, toast } from 'react-hot-toast';

import { motion, AnimatePresence } from 'framer-motion';
import PulseAgent from '@/components/dashboard/PulseAgent';
import Link from 'next/link';

// Helper component for Material Symbols Icons
const Icon = ({ name, className = "", style = {} }: { name: string, className?: string, style?: any }) => (
  <span className={`material-symbols-outlined ${className}`} style={style}>{name}</span>
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      setLoading(false);
    }
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    toast.loading("Signing you out...", { id: "logout-toast" });
    try {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }
      toast.success("Goodbye!", { id: "logout-toast" });
      router.push('/auth/login');
    } catch (error) {
      toast.error("Logout failed", { id: "logout-toast" });
    }
  };

  if (loading) return null;

  return (
    <div className="flex min-h-screen text-[#2d3335] bg-[#F4F7FF] selection:bg-primary/20">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex w-[260px] bg-white flex-col p-6 fixed h-full z-50 overflow-y-auto overflow-x-hidden">
        <div className="flex items-center gap-3 mb-10 px-4 shrink-0">
          <Icon name="menu_book" className="text-2xl font-bold" />
          <span className="text-xl font-extrabold tracking-[-0.04em]">SkillSync</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1 px-2 shrink-0">
          {[
            { name: 'Dashboard', icon: 'grid_view', path: '/dashboard' },
            { name: 'Explore Careers', icon: 'explore', path: '/dashboard/internships' },
            { name: 'My Skills', icon: 'psychology', path: '/dashboard/skills' },
            { name: 'Job Board', icon: 'work', path: '/dashboard/applications' },
            { name: 'Learning', icon: 'school', path: '/dashboard/learning' },
            { name: 'Networking', icon: 'group', path: '/dashboard/networking' },
            { name: 'Chat', icon: 'chat', path: '/dashboard/chat' },
            { name: 'My Profile', icon: 'account_circle', path: '/dashboard/profile' },
          ].map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.name}
                href={item.path} 
                className={`flex items-center gap-4 px-4 py-3.5 transition-colors ${
                  isActive 
                    ? 'bg-white rounded-[1rem] shadow-[0_4px_15px_rgba(147,149,211,0.1)] text-black' 
                    : 'text-[#717171] hover:text-black'
                }`}
              >
                <Icon 
                  name={item.icon} 
                  className="text-xl" 
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }} 
                />
                <span className={`text-[15px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 space-y-4 px-2 shrink-0 pb-4">
          {/* Removed Upgrade to Pro section */}

          <div className="flex flex-col gap-1 pb-4">
            <button onClick={() => router.push('/dashboard/profile')} className="flex items-center gap-4 px-4 py-3 text-[#717171] hover:text-[#2d3335] transition-colors w-full text-left font-sans">
              <Icon name="support" className="text-xl" />
              <span className="text-[15px] font-bold tracking-tight">Help & Support</span>
            </button>
            <button onClick={() => router.push('/dashboard/profile')} className="flex items-center gap-4 px-4 py-3 text-[#717171] hover:text-[#2d3335] transition-colors w-full text-left font-sans">
              <Icon name="settings" className="text-xl" />
              <span className="text-[15px] font-bold tracking-tight">Profile Settings</span>
            </button>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-4 px-4 py-3 text-rose-500 hover:text-rose-600 transition-colors w-full text-left group"
            >
              <Icon name="logout" className="text-xl group-hover:translate-x-1 transition-transform" />
              <span className="text-[15px] font-bold tracking-tight">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* --- MOBILE TOP BAR --- */}
      <header className="lg:hidden fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="text-[#575a93] cursor-pointer p-2 -ml-2" onClick={() => setIsMobileMenuOpen(true)}>
            <Icon name="menu" className="text-2xl" />
          </div>
          <h1 className="text-[#575a93] font-black text-xl tracking-tighter">SkillSync</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[#575a93] cursor-pointer" onClick={() => router.push('/dashboard/notifications')}>
            <Icon name="notifications" />
          </div>
          <button onClick={handleLogout} className="text-rose-500">
            <Icon name="logout" />
          </button>
        </div>
      </header>

      {/* --- MOBILE DRAWER --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white z-[70] lg:hidden flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10 px-2">
                <div className="flex items-center gap-3">
                  <Icon name="menu_book" className="text-2xl font-bold text-[#575a93]" />
                  <span className="text-xl font-black tracking-tighter text-slate-900">SkillSync</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 p-2"><Icon name="close" /></button>
              </div>

              <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
                {[
                  { name: 'Dashboard', icon: 'grid_view', path: '/dashboard' },
                  { name: 'Explore Careers', icon: 'explore', path: '/dashboard/internships' },
                  { name: 'My Skills', icon: 'psychology', path: '/dashboard/skills' },
                  { name: 'Job Board', icon: 'work', path: '/dashboard/applications' },
                  { name: 'Learning', icon: 'school', path: '/dashboard/learning' },
                  { name: 'Chat', icon: 'chat', path: '/dashboard/chat' },
                  { name: 'My Profile', icon: 'account_circle', path: '/dashboard/profile' },
                ].map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link 
                      key={item.name}
                      href={item.path} 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                        isActive 
                          ? 'bg-[#575a93]/10 text-[#575a93] font-bold' 
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Icon 
                        name={item.icon} 
                        className="text-xl" 
                        style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }} 
                      />
                      <span className="text-[15px] tracking-tight">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-2">
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-4 px-4 py-4 text-rose-500 font-bold tracking-tight rounded-2xl hover:bg-rose-50 transition-colors"
                >
                  <Icon name="logout" className="text-xl" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 backdrop-blur-xl rounded-t-[2rem] z-50 shadow-[0px_-10px_40px_rgba(45,51,53,0.06)] border-none">
        {[
          { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
          { name: 'Explore', icon: 'explore', path: '/dashboard/internships' },
          { name: 'Skills', icon: 'military_tech', path: '/dashboard/skills' },
          { name: 'Learning', icon: 'school', path: '/dashboard/learning' },
          { name: 'Profile', icon: 'account_circle', path: '/dashboard/profile' },
        ].map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.name}
              href={item.path} 
              className={`flex flex-col items-center justify-center rounded-full px-5 py-2 transition-all duration-300 ${
                isActive 
                  ? 'bg-[#575a93]/10 text-[#575a93]' 
                  : 'text-slate-400'
              }`}
            >
              <Icon 
                name={item.icon} 
                className="text-2xl" 
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }} 
              />
              <span className="text-[11px] font-medium tracking-wide uppercase mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="lg:ml-[260px] flex-1 min-h-screen">
        <div className="max-w-[1600px] mx-auto min-h-screen p-4 md:p-6 lg:p-8">
          <Toaster position="top-right" />
          {children}
        </div>
      </main>

      {/* Global Career Assistant Companion */}
      <PulseAgent />
    </div>
  );
}
