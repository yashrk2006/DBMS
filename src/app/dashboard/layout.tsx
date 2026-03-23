'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Zap, 
  User, 
  LogOut,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/internships', label: 'Internships', icon: Briefcase },
  { href: '/dashboard/applications', label: 'Applications', icon: FileText },
  { href: '/dashboard/skills', label: 'My Skills', icon: Zap },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div className="flex min-height-screen bg-slate-50/50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 fixed top-0 left-0 h-screen z-40">
        <div className="p-6 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-slate-900 tracking-tight">SkillSync</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg no-underline transition-all duration-200 group",
                  active 
                    ? "bg-indigo-50 text-indigo-700 font-semibold" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 transition-colors",
                  active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                )} />
                <span className="text-sm">{item.label}</span>
                {active && (
                  <motion.div 
                    layoutId="active-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Button 
            variant="danger" 
            className="w-full justify-start gap-3 px-3.5 border-transparent bg-transparent hover:bg-red-50 text-red-500"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-slate-900">SkillSync</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="md:hidden fixed inset-0 top-16 bg-white z-40 p-6 flex flex-col gap-4"
          >
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-4 text-lg font-medium text-slate-700 no-underline p-2"
              >
                <item.icon className="w-6 h-6 text-slate-400" />
                {item.label}
              </Link>
            ))}
            <div className="mt-auto pt-6 border-t border-slate-100">
              <Button variant="danger" className="w-full gap-3 py-6" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
                Sign Out
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 pt-24 md:pt-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
