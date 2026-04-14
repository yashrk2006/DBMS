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
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden flex flex-col">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0" />
      
      <div className="relative z-10 flex-1 p-6 md:p-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <motion.div 
                 animate={{ 
                   boxShadow: ["0 0 0px rgba(99,102,241,0)", "0 0 20px rgba(99,102,241,0.3)", "0 0 0px rgba(99,102,241,0)"] 
                 }}
                 transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                 className="size-10 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-lg relative overflow-hidden"
               >
                  <Brain size={20} className="relative z-10" />
                  <motion.div 
                    animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl"
                  />
               </motion.div>
               <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Professional Assessment Suite</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">
              Strategic <span className="text-indigo-600">Assessment.</span>
            </h1>
            <p className="text-lg font-medium text-slate-500 max-w-xl">
              Elevate your interview performance through high-precision AI simulations tailored to industry standards.
            </p>
          </div>
          
          <div className="flex gap-4">
             <div className="bg-white px-8 py-5 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center min-w-[150px]">
                <span className="text-3xl font-black text-slate-900">{applications.length}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Channels</span>
             </div>
             <div className="bg-[#0F172A] px-8 py-5 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center min-w-[150px] text-white border border-white/5">
                <span className="text-3xl font-black text-indigo-400">99.8%</span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Precision Index</span>
             </div>
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex justify-between items-center">
             <h2 className="text-[12px] font-bold uppercase tracking-[3px] text-slate-400">Recruitment-Specific Assessments</h2>
             <div className="h-px flex-1 mx-8 bg-slate-200" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-3xl border border-slate-100 animate-pulse" />)}
            </div>
          ) : applications.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center text-center space-y-6 shadow-xl">
                  <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 shadow-inner">
                    <AlertCircle size={32} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-tighter">No Active Channels</h3>
                    <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto">Apply to roles to unlock specialized simulation modules for specific companies.</p>
                  </div>
                  <button 
                  onClick={() => router.push('/dashboard/internships')}
                  className="px-10 py-4 bg-[#0F172A] text-white rounded-xl font-black uppercase text-[10px] tracking-[4px] hover:bg-black transition-all shadow-xl active:scale-95"
                  >
                    Browse Internships
                  </button>
               </div>

               <div className="bg-indigo-600 p-12 rounded-[2.5rem] text-white flex flex-col items-center justify-center text-center space-y-8 shadow-2xl relative overflow-hidden group border border-white/10">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                     <Sparkles size={120} />
                  </div>
                  <div className="size-16 bg-white/10 rounded-2xl flex items-center justify-center shadow-lg border border-white/5">
                    <Zap size={32} className="text-indigo-200" />
                  </div>
                  <div className="space-y-4 relative z-10">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">General Training</h3>
                    <p className="text-indigo-100/70 text-sm font-medium max-w-xs mx-auto">Ready to sharpen your edge? Start an institutional-grade technical assessment right now.</p>
                  </div>
                  <button 
                    onClick={() => router.push('/dashboard/interview/general')}
                    className="px-12 py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-[5px] hover:scale-105 transition-all shadow-2xl shadow-indigo-900/50"
                  >
                    Start Training
                  </button>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {applications.map((app, i) => (
                  <motion.div 
                    key={app.application_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative"
                  >
                     <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                         <Sparkles size={80} className="text-indigo-500" />
                     </div>
                     
                     <div className="flex justify-between items-start mb-6">
                        <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                           <MessageSquare size={20} />
                        </div>
                        <div className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                           {app.ai_match_score}% Match
                        </div>
                     </div>
 
                     <div className="space-y-1 mb-8">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">{app.internship?.company?.company_name || 'Partner Company'}</h3>
                        <h4 className="text-xl font-bold text-slate-900 tracking-tight leading-none">{app.internship?.title}</h4>
                     </div>
 
                     <div className="flex flex-col gap-3">
                        <button 
                         onClick={() => router.push(`/dashboard/interview/${app.application_id}`)}
                         className="w-full py-5 bg-[#0F172A] text-white rounded-2xl font-black uppercase text-[10px] tracking-[4px] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95"
                        >
                          Begin Session <Play size={14} className="fill-white" />
                        </button>
                     </div>
                  </motion.div>
                ))}
            </div>
          )}
        </section>

        <section className="bg-[#0F172A] p-12 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 p-20 opacity-[0.05]">
              <Cpu size={250} />
           </div>
           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                 <div className="flex items-center gap-2">
                    <Zap className="text-indigo-400" size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-[3px] text-indigo-400">Elite Career Preparation</span>
                 </div>
                 <h2 className="text-4xl font-black uppercase tracking-tight leading-none">
                    Excellence is a <span className="text-indigo-400 italic underline decoration-white/10 underline-offset-8">Standard.</span>
                  </h2>
                 <p className="text-slate-400 font-medium leading-relaxed">
                    Our AI assessment platform leverages real-world industry benchmarks and your unique competency profile to deliver high-fidelity technical scenarios. Every session is designed to sharpen your edge.
                 </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { icon: ShieldCheck, title: 'Industry Benchmarks' },
                   { icon: Clock, title: 'Real-time feedback' },
                   { icon: CheckCircle2, title: 'Verified Skills' },
                   { icon: Sparkles, title: 'AI Support' }
                 ].map(i => (
                   <div key={i.title} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-3 text-center hover:bg-white/10 transition-colors">
                      <i.icon size={20} className="text-indigo-400" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">{i.title}</span>
                   </div>
                 ))}
              </div>
           </div>
        </section>
      </div>
    </div>
  </div>
  );
}
