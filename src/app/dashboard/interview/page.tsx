'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Sparkles, MessageSquare, Play, 
  ShieldCheck, Zap, ArrowRight, Brain, Clock, 
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function InterviewHub() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApplications() {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        router.push('/auth/login');
        return;
      }

      try {
        const res = await fetch(`/api/application-submit?userId=${userId}`);
        const result = await res.json();
        if (result.success) {
          setApplications(result.data);
        }
      } catch (err) {
        console.error("Failed to load applications for interview hub:", err);
      } finally {
        setLoading(false);
      }
    }
    loadApplications();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="size-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-lg">
                  <Brain size={20} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[5px] text-slate-400">SkillSync Simulation Environment</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              Interview <span className="text-amber-600">Core.</span>
            </h1>
            <p className="text-lg font-medium text-slate-500 max-w-xl">
              Validate your competency against real industrial requirements using our high-fidelity AI Interrogator.
            </p>
          </div>
          
          <div className="flex gap-4">
             <div className="bg-white px-8 py-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center min-w-[140px]">
                <span className="text-3xl font-black text-slate-900">{applications.length}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available Vectors</span>
             </div>
             <div className="bg-slate-950 px-8 py-5 rounded-[2rem] shadow-xl flex flex-col items-center justify-center min-w-[140px] text-white">
                <span className="text-3xl font-black text-emerald-400">98%</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Uptime Index</span>
             </div>
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex justify-between items-center">
             <h2 className="text-[12px] font-black uppercase tracking-[4px] text-slate-400">Active Recruitment Channels</h2>
             <div className="h-px flex-1 mx-8 bg-slate-200" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[1,2,3].map(i => <div key={i} className="h-48 bg-white/50 rounded-[2.5rem] border border-slate-100 animate-pulse" />)}
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white p-20 rounded-[3rem] border border-slate-200 text-center space-y-6">
               <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                 <Cpu size={40} className="text-slate-300" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-xl font-black uppercase">No Active Channels Found</h3>
                 <p className="text-slate-400 font-medium max-w-sm mx-auto">You need to apply for internships first to unlock targeted simulation modules.</p>
               </div>
               <button 
                onClick={() => router.push('/dashboard/internships')}
                className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-[4px] hover:scale-105 transition-all shadow-xl"
               >
                 Go to Internship Feed
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {applications.map((app, i) => (
                 <motion.div 
                   key={app.application_id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.1 }}
                   className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-soft hover:shadow-premium hover:-translate-y-2 transition-all group overflow-hidden relative"
                 >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <Sparkles size={100} className="text-amber-500" />
                    </div>
                    
                    <div className="flex justify-between items-start mb-6">
                       <div className="size-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors shadow-inner">
                          <MessageSquare size={20} />
                       </div>
                       <div className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-[2px] border border-emerald-100">
                          Match Score: {app.ai_match_score}%
                       </div>
                    </div>

                    <div className="space-y-1 mb-8">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] truncate">{app.internship?.company?.company_name || 'Innovate AI'}</h3>
                       <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">{app.internship?.title}</h4>
                    </div>

                    <div className="flex flex-col gap-3">
                       <button 
                        onClick={() => router.push(`/dashboard/interview/${app.application_id}`)}
                        className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-[4px] flex items-center justify-center gap-3 hover:bg-amber-600 transition-colors shadow-lg"
                       >
                         Start Simulation <Play size={14} className="fill-white" />
                       </button>
                       <p className="text-[9px] font-bold text-center text-slate-400 uppercase tracking-widest">Simulates standard industrial screening</p>
                    </div>
                 </motion.div>
               ))}
            </div>
          )}
        </section>

        <section className="bg-slate-950 p-12 rounded-[3.5rem] text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-20 opacity-[0.03]">
              <Cpu size={300} />
           </div>
           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                 <div className="flex items-center gap-2">
                    <Zap className="text-amber-500" size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[4px] text-amber-500">Heuristic Integration</span>
                 </div>
                 <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">
                    Practice Makes <span className="text-amber-500 italic underline decoration-white/20 underline-offset-8">Production.</span>
                 </h2>
                 <p className="text-slate-400 font-medium leading-relaxed">
                    Our AI interrogator uses real job descriptions and your specific skill vectors to generate unique behavioral and technical scenarios. Every simulation is data-driven.
                 </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { icon: ShieldCheck, title: 'Safe Zone' },
                   { icon: Clock, title: 'Real-time' },
                   { icon: CheckCircle2, title: 'Feedback' },
                   { icon: Sparkles, title: 'AI-Guided' }
                 ].map(i => (
                   <div key={i.title} className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center gap-3 text-center">
                      <i.icon size={20} className="text-slate-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{i.title}</span>
                   </div>
                 ))}
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}
