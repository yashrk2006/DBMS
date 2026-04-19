'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Database, Menu, X, Globe, ShieldCheck, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    
    // Real-time Authentication Sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (session) {
        // Fetch User Classification from Database
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setSession({ user: { ...session.user, role: profile?.role || 'student' } });
      } else {
        setSession(null);
      }
    });

    return () => {
      window.removeEventListener("scroll", handler);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      setSession(null);
      router.push('/auth/login');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/#${id}`);
    }
  };

  const navLinks = [
    { label: "Features", target: "features" },
    { label: "Process", target: "how-it-works" },
    { label: "Analytics", target: "stats" },
  ];

  return (
    <motion.nav
      className={`fixed top-0 z-[100] w-full transition-all duration-700 ${
        scrolled
          ? "py-4 bg-white/80 backdrop-blur-3xl border-b border-slate-200 shadow-sm"
          : "py-8 bg-transparent border-b border-transparent"
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
        {/* Logo / Identity */}
        <Link href="/">
          <motion.div
            className="flex items-center gap-4 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`size-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                scrolled ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" : "bg-white text-amber-600 border border-slate-200 shadow-sm"
            } group-hover:bg-amber-600 group-hover:text-white transition-all`}>
              <Database size={20} className={scrolled ? "" : "animate-pulse"} />
            </div>
            <div className="flex flex-col">
              <h2 className={`text-xl font-black leading-none tracking-tighter transition-colors uppercase ${
                  scrolled ? "text-slate-900" : "text-slate-950"
              } group-hover:text-amber-600`}>
                DBMS
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                 <div className="size-1 rounded-full bg-amber-600" />
                 <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em]">
                   Recruitment Protocol
                 </span>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-12">
          {navLinks.map((item) => (
            <button
              key={item.label}
              onClick={() => scrollTo(item.target)}
              className={`text-[10px] font-black uppercase tracking-[3px] transition-all duration-300 relative group ${
                pathname === `/#${item.target}` ? "text-amber-600" : "text-slate-500 hover:text-amber-600"
              }`}
            >
              {item.label}
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-amber-600 transition-all duration-300 ${
                pathname === `/#${item.target}` ? "w-full" : "w-0 group-hover:w-full"
              }`} />
            </button>
          ))}
          <div className="w-px h-4 bg-slate-200 mx-2" />
            <Link
              href={mounted && session?.user?.role === 'company' ? '/company' : mounted && session?.user?.role === 'admin' ? '/admin' : '/dashboard'}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[3px] transition-all group ${
                pathname.startsWith('/dashboard') || pathname.startsWith('/company') || pathname.startsWith('/admin') ? "text-amber-600" : "text-slate-500 hover:text-amber-600"
              }`}
              suppressHydrationWarning
            >
              <ShieldCheck size={14} className={pathname.startsWith('/dashboard') || pathname.startsWith('/company') || pathname.startsWith('/admin') ? "" : "group-hover:scale-110 transition-transform"} />
              Review Hub
            </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6" suppressHydrationWarning>
          {mounted && session ? (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[3px] border border-slate-200 hover:bg-slate-100 hover:text-red-500 hover:border-red-200 transition-all group hidden sm:flex disabled:opacity-50"
            >
              <LogOut size={16} className={loggingOut ? "animate-spin" : "group-hover:-translate-x-1 transition-transform"} />
              {loggingOut ? "Exiting..." : "Logout"}
            </button>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hidden md:block text-[10px] font-black uppercase tracking-[3px] text-slate-600 hover:text-amber-600 transition-colors"
                suppressHydrationWarning
              >
                Sign In
              </Link>
              
              <Link
                href="/auth/login"
                className="px-8 py-3.5 rounded-xl bg-amber-600 text-white text-[10px] font-black uppercase tracking-[3px] shadow-lg shadow-amber-600/10 transition-all relative overflow-hidden group border border-amber-500 hidden sm:block hover:bg-amber-500 hover:shadow-xl active:scale-95"
                suppressHydrationWarning
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 font-bold">Get Started</span>
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-slate-950 hover:text-amber-600 transition-colors relative z-[110]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-[100]"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="lg:hidden absolute inset-x-0 top-full bg-white border-b border-slate-200 shadow-2xl overflow-hidden z-[101]"
            >
              <div className="px-8 py-10 flex flex-col gap-6">
                 {navLinks.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      scrollTo(item.target);
                      setMobileMenuOpen(false);
                    }}
                    className="text-[11px] font-black uppercase tracking-[3px] text-slate-500 hover:text-amber-600 text-left border-l-2 border-slate-100 pl-4 hover:border-amber-600 transition-all py-2"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="h-px bg-slate-100 w-full" />
                {session ? (
                  <div className="flex flex-col gap-4">
                    <Link
                      href={session.user.role === 'company' ? '/company' : session.user.role === 'admin' ? '/admin' : '/dashboard'}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[3px] text-amber-600 border-l-2 border-amber-600 pl-4 py-2"
                    >
                      <Globe size={18} />
                      Access Hub
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[3px] text-red-500 border-l-2 border-slate-100 pl-4 py-2"
                    >
                      <LogOut size={18} />
                      Log Out
                    </button>
                  </div>
                ) : (
                  <Link 
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-3 py-4 rounded-xl bg-amber-600 text-white text-[11px] font-black uppercase tracking-[3px]"
                  >
                    Get Started Now
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
