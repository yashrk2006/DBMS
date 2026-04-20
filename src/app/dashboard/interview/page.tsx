'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Sparkles, MessageSquare, Play, 
  ShieldCheck, Zap, Brain, Clock, 
  CheckCircle2, AlertCircle, Activity, Target
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useDBMS } from '@/context/DBMSContext';

// High-fidelity spring physics from taste-design skill
const premiumSpring = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20
};

export default function InterviewHub() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addTrace } = useDBMS();

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
          
          // DBMS TRACE: Load Applications for Interview Hub
          addTrace({
            operation: 'SELECT',
            table: 'application',
            description: 'Synchronize interview-ready application nodes for tactical assessment.',
            sql: `SELECT a.*, i.title \nFROM application a \nJOIN internship i ON a.internship_id = i.internship_id \nWHERE a.student_id = '${userId}';`
          });
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
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Institutional Carbon Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0" />
      
      <div className="relative z-10 flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-16">
          
          {/* Asymmetric Header */}
          <header className="flex flex-col lg:grid lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center gap-4">
                 <motion.div 
                   whileHover={{ scale: 1.05 }}
                   transition={premiumSpring}
                   className="size-12 rounded-2xl bg-[#09090B] text-white flex items-center justify-center shadow-2xl relative overflow-hidden border border-white/10"
                 >
                    <Brain size={22} className="relative z-10" />
                    <motion.div 
                      animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.3, 1] }}
                      transition={{ duration: 5, repeat: Infinity }}
                      className="absolute inset-0 bg-indigo-500/30 rounded-full blur-2xl"
                    />
                 </motion.div>
                 <div className="h-px w-12 bg-slate-200" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Institutional assessment suite</span>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-black text-[#09090B] uppercase tracking-[-0.04em] leading-[0.9] flex flex-col">
                  <span>Strategic</span>
                  <span className="text-indigo-600 flex items-center gap-4">
                    Assessment<span className="h-4 w-24 bg-indigo-600 rounded-full inline-block" />
                  </span>
                </h1>
                <p className="text-xl font-medium text-slate-500 max-w-xl leading-snug">
                  High-precision AI simulations mapped to institutional benchmarks. Analyze competency patterns through neural telemetry.
                </p>
              </div>
            </div>
            
            <div className="lg:col-span-4 w-full flex flex-col gap-4">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 flex items-center justify-between group overflow-hidden relative">
                  <div className="relative z-10">
                    <span className="text-5xl font-black text-[#09090B] font-mono tracking-tighter tabular-nums">{applications.length}</span>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Active channels</p>
                  </div>
                  <Target size={40} className="text-slate-100 absolute -right-2 -bottom-2 group-hover:text-indigo-50 transition-colors" />
               </div>
               
               <div className="bg-[#09090B] p-8 rounded-[2.5rem] shadow-2xl flex items-center justify-between text-white border border-white/5 group overflow-hidden relative">
                  <div className="relative z-10">
                    <span className="text-5xl font-black text-indigo-400 font-mono tracking-tighter tabular-nums">99.8</span>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Precision index</p>
                  </div>
                  <Activity size={40} className="text-white/5 absolute -right-2 -bottom-2 group-hover:text-indigo-500/20 transition-colors" />
               </div>
            </div>
          </header>

          {/* Assessment Grid - Asymmetric Layout */}
          <section className="space-y-8">
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-100/50">
               <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 ml-4">Recruitment telemetry streams</h2>
               <div className="flex gap-2 mr-2">
                 {[1,2,3].map(i => <div key={i} className="size-1.5 rounded-full bg-slate-200" />)}
               </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {[1,2,3].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] border border-zinc-100 animate-pulse" />)}
              </div>
            ) : applications.length === 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 <div className="lg:col-span-7 bg-white p-12 rounded-[3rem] border border-slate-100 flex flex-col items-start justify-center text-left space-y-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                      <Brain size={250} />
                    </div>
                    <div className="size-20 bg-[#09090B] rounded-3xl flex items-center justify-center text-white shadow-2xl relative z-10">
                      <AlertCircle size={32} />
                    </div>
                    <div className="space-y-4 relative z-10">
                      <h3 className="text-3xl font-black uppercase tracking-tighter leading-none text-[#09090B]">No active<br/>channels detected.</h3>
                      <p className="text-slate-500 text-lg font-medium max-w-sm">
                        Synchronize with available industry roles to initialize specialized assessment modules.
                      </p>
                    </div>
                    <button 
                      onClick={() => router.push('/dashboard/internships')}
                      className="group relative px-10 py-5 bg-[#09090B] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 z-10"
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        Initialize Discovery <Play size={14} className="fill-white" />
                      </span>
                    </button>
                 </div>

                 <div className="lg:col-span-5 bg-indigo-600 p-12 rounded-[3rem] text-white flex flex-col items-start justify-between min-h-[400px] shadow-2xl relative overflow-hidden group border border-white/20">
                    <motion.div 
                      animate={{ 
                        opacity: [0.1, 0.3, 0.1],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 8, repeat: Infinity }}
                      className="absolute -top-20 -right-20 size-80 bg-white/20 rounded-full blur-[100px]"
                    />
                    <div className="size-16 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner border border-white/20 relative z-10">
                      <Zap size={32} className="text-indigo-200" />
                    </div>
                    <div className="space-y-6 relative z-10">
                      <h3 className="text-4xl font-black uppercase tracking-tighter leading-[0.9]">General<br/>Tactical<br/>Training</h3>
                      <p className="text-indigo-100/80 text-lg font-medium max-w-xs leading-snug">
                        Immediate access to institutional-grade technical scenarios.
                      </p>
                      <button 
                        onClick={() => router.push('/dashboard/interview/general')}
                        className="w-full py-6 bg-white text-indigo-600 rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] hover:scale-[1.02] transition-all shadow-2xl"
                      >
                        Start Session
                      </button>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
                <AnimatePresence mode="popLayout">
                  {applications.map((app, i) => {
                    // Create an asymmetric spanning pattern
                    const isLarge = i % 5 === 0;
                    const colSpan = isLarge ? "lg:col-span-8" : "lg:col-span-4";
                    
                    return (
                      <motion.div 
                        key={app.application_id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...premiumSpring, delay: i * 0.05 }}
                        className={`${colSpan} bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative flex flex-col justify-between`}
                      >
                         <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                             <Sparkles size={isLarge ? 160 : 100} className="text-indigo-600" />
                         </div>
                         
                         <div>
                           <div className="flex justify-between items-start mb-10">
                              <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all duration-500">
                                 <MessageSquare size={24} />
                              </div>
                              <div className="px-5 py-2 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2">
                                 <span className="size-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                 <span className="font-mono tabular-nums">{app.ai_match_score}</span>% match
                              </div>
                           </div>
    
                           <div className="space-y-2 mb-12">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Channel // {i.toString().padStart(2, '0')}</span>
                                <div className="h-px w-8 bg-indigo-100" />
                              </div>
                              <h3 className="text-base font-bold text-slate-400 uppercase tracking-tight truncate">{app.internship?.company?.company_name || 'Partner Company'}</h3>
                              <h4 className={`${isLarge ? 'text-4xl' : 'text-2xl'} font-black text-[#050505] tracking-tight leading-none uppercase`}>
                                {app.internship?.title}
                              </h4>
                           </div>
                         </div>
    
                         <div className="relative z-10">
                            <button 
                             onClick={() => router.push(`/dashboard/interview/${app.application_id}`)}
                             className="w-full py-6 bg-[#09090B] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all shadow-2xl active:scale-95"
                            >
                              Initialize Session <Play size={14} className="fill-white" />
                            </button>
                         </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* Footer Branding - Industrial Command Center Style */}
          <section className="bg-[#09090B] p-16 rounded-[4rem] text-white relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] border border-white/5">
             <div className="absolute top-0 right-0 p-24 opacity-[0.03] scale-125">
                <Cpu size={350} />
             </div>
             
             <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-8">
                   <div className="flex items-center gap-3">
                      <div className="size-2 rounded-full bg-indigo-500 animate-ping" />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400">System architecture: Assessment v3.0</span>
                   </div>
                   <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85]">
                      Precision is<br/>a <span className="text-indigo-400 italic">Mandate.</span>
                    </h2>
                   <p className="text-slate-400 text-xl font-medium leading-tight max-w-lg">
                      Industry benchmarks mapped to real-world competency. Every tactical session is engineered to validate professional capability.
                   </p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   {[
                     { icon: ShieldCheck, title: 'Institutional Benchmark' },
                     { icon: Clock, title: 'Neural Latency Trace' },
                     { icon: CheckCircle2, title: 'Capability Validation' },
                     { icon: Sparkles, title: 'Heuristic Synthesis' }
                   ].map(i => (
                     <div key={i.title} className="p-8 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-4 text-center hover:bg-white/10 transition-all duration-500 group">
                        <i.icon size={24} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 leading-tight">{i.title}</span>
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
