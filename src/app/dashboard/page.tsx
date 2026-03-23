'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  ClipboardList, 
  Zap, 
  Briefcase, 
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  UserCircle,
  Sparkles as SparklesIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Stats {
  applications: number;
  skills: number;
  matchedInternships: number;
}

const statusConfig: Record<string, { color: 'warning' | 'primary' | 'success' | 'danger' | 'secondary', icon: any }> = {
  'Pending': { color: 'warning', icon: Clock },
  'Under Review': { color: 'primary', icon: Search },
  'Interviewing': { color: 'primary', icon: TrendingUp },
  'Accepted': { color: 'success', icon: CheckCircle2 },
  'Rejected': { color: 'danger', icon: AlertCircle },
};

export default function DashboardPage() {
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState('');
  const [stats, setStats] = useState<Stats>({ applications: 0, skills: 0, matchedInternships: 0 });
  const [recentApplications, setRecentApplications] = useState<Array<{
    application_id: number;
    applied_date: string;
    status: string;
    internship: { title: string; company: { company_name: string } | null } | null;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || { id: '00000000-0000-0000-0000-000000000000', email: 'demo@student.com' };
      setUserEmail(user.email ?? '');

      const [appRes, skillRes, internRes] = await Promise.all([
        supabase.from('application').select('*', { count: 'exact', head: true }).eq('student_id', user.id),
        supabase.from('student_skill').select('*', { count: 'exact', head: true }).eq('student_id', user.id),
        supabase.from('internship').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        applications: appRes.count ?? 0,
        skills: skillRes.count ?? 0,
        matchedInternships: internRes.count ?? 0,
      });

      const { data: apps } = await supabase
        .from('application')
        .select(`application_id, applied_date, status, internship:internship_id (title, company:company_id (company_name))`)
        .eq('student_id', user.id)
        .order('applied_date', { ascending: false })
        .limit(5);

      if (apps) setRecentApplications(apps as unknown as typeof recentApplications);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="text-indigo-600"
      >
        <Zap size={40} fill="currentColor" />
      </motion.div>
      <p className="text-slate-500 font-medium animate-pulse">Customizing your experience...</p>
    </div>
  );

  const statItems = [
    { label: 'Applications', value: stats.applications, icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Skills Mastered', value: stats.skills, icon: Zap, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Open Opportunities', value: stats.matchedInternships, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
            Welcome back, <span className="text-indigo-600">Scholar!</span> 👋
          </h1>
          <div className="flex items-center gap-2 mt-1 text-slate-500">
            <UserCircle size={16} />
            <span className="text-sm font-medium">{userEmail}</span>
          </div>
        </motion.div>
        
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
        >
          <Button className="gap-2 shadow-lg shadow-indigo-100 h-12 px-6 rounded-2xl">
            <Zap size={18} fill="currentColor" />
            Launch AI Engine
          </Button>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {statItems.map((item, index) => (
          <Card key={item.label} transition={{ delay: index * 0.1 }} className="group hover:shadow-xl hover:border-indigo-100 transition-all duration-300 relative border-none shadow-md bg-white">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full opacity-50 transition-all group-hover:bg-indigo-50" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                <item.icon size={22} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-display font-black text-slate-900 mb-1">{item.value}</div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-xl font-display font-bold text-slate-800 flex items-center gap-2.5">
            <SparklesIcon size={20} className="text-amber-500" />
            Recommended Actions
          </h2>
          <div className="grid gap-4">
             <ActionCard 
               href="/dashboard/internships" 
               title="Matched Internships" 
               desc="Explore 12 new roles matching your profile." 
               icon={Briefcase} 
               color="indigo" 
               delay={0.1}
             />
             <ActionCard 
               href="/dashboard/skills" 
               title="Analyze Skills" 
               desc="Find out which skills are trending in the market." 
               icon={Zap} 
               color="cyan" 
               delay={0.2}
             />
             <ActionCard 
               href="/dashboard/profile" 
               title="Enhance Profile" 
               desc="Your profile is 85% complete. Reach 100%!" 
               icon={UserCircle} 
               color="emerald" 
               delay={0.3}
             />
          </div>
        </div>

        {/* Recent Applications */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-slate-800 flex items-center gap-2.5">
              <Clock size={20} className="text-indigo-500" />
              Application Tracker
            </h2>
            <Link href="/dashboard/applications" className="text-sm font-semibold text-indigo-600 hover:underline">View All</Link>
          </div>
          
          <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
            <CardContent className="p-0">
              {recentApplications.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <ClipboardList size={30} />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">No active applications. Start your journey today!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentApplications.map((app, index) => {
                    const config = statusConfig[app.status] || { color: 'secondary', icon: Clock };
                    return (
                      <motion.div 
                        key={app.application_id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            app.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                          }`}>
                            <Briefcase size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{app.internship?.title ?? 'Position Unavailable'}</div>
                            <div className="text-xs font-medium text-slate-500">{app.internship?.company?.company_name ?? 'Confidential'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <Badge variant={config.color} className="gap-1 px-2.5 py-1">
                             <config.icon size={12} />
                             {app.status}
                           </Badge>
                           <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ href, title, desc, icon: Icon, color, delay }: any) {
  const colors: any = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-100 hover:bg-cyan-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link href={href} className="no-underline block">
        <div className={`p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 shadow-sm hover:shadow-md ${colors[color]}`}>
          <div className="bg-white p-2.5 rounded-xl shadow-sm">
            <Icon size={20} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold tracking-tight">{title}</div>
            <p className="text-xs font-medium opacity-80">{desc}</p>
          </div>
          <ArrowRight size={16} />
        </div>
      </Link>
    </motion.div>
  );
}
