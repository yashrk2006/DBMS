'use client';

import { useEffect, useState } from 'react';
import { 
  Settings, Shield, Lock, BellRing, UserCheck, 
  Zap, Building2, Globe, Users,
  Activity, Terminal, Cpu, ChevronRight, Key,
  Briefcase, BarChart, Eye, EyeOff, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useDBMS } from '@/context/DBMSContext';
import { toast } from 'react-hot-toast';
import AnimatedSection from '@/components/ui/AnimatedSection';

export default function CompanySettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { addTrace } = useDBMS();
  
  // Settings State
  const [autoMatching, setAutoMatching] = useState(true);
  const [visibility, setVisibility] = useState(true);

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      setUser(session.user);
      setLoading(false);
    }
    getSession();
  }, [router]);

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    setUpdating(true);
    toast.loading("Initiating Corporate Security Protocol...", { id: "corp-reset" });
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) throw error;
      
      toast.success("Security Handshake DISPATCHED to your official inbox.", { id: "corp-reset" });
    } catch (err: any) {
      toast.error(err.message || "Security handshake failed.", { id: "corp-reset" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-8">
      <motion.div 
        animate={{ rotate: 360, opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-emerald-600"
      >
        <Building2 size={48} />
      </motion.div>
      <div className="text-center">
         <h2 className="text-[10px] font-bold uppercase tracking-[10px] text-emerald-600 mb-2">Partner Command Hub</h2>
         <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[5px] animate-pulse">Mounting Recruiter Preferences</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      
      {/* Company Settings Hero */}
      <AnimatedSection direction="up">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 text-center md:text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="size-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-600/20">
                 <Settings size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[5px] text-slate-400">Recruiter Preferences</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tighter uppercase leading-[0.8]">
              System<span className="text-emerald-600">.cfg</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium italic border-l-2 border-slate-200 pl-4 max-w-lg mx-auto md:mx-0">
              &quot;Manage organizational security, recruitment intelligence settings, and notification heuristics.&quot;
            </p>
          </div>

          <div className="bg-white px-8 py-6 rounded-[2.5rem] border border-slate-100 shadow-sm hidden md:block">
             <div className="flex items-center gap-6">
                <div>
                   <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Match Throughput</div>
                   <div className="text-sm font-black text-emerald-600 text-right uppercase">Optimized</div>
                </div>
                <div className="size-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                   <Activity size={24} className="animate-pulse" />
                </div>
             </div>
          </div>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Recruitment Intelligence */}
        <div className="lg:col-span-8">
           <AnimatedSection direction="right">
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-premium p-8 md:p-14 space-y-12">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                       <Zap size={22} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">Hiring Intelligence</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recruitment Logic & Automation</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-6">
                    <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-emerald-600/30 transition-all">
                       <div className="text-center md:text-left space-y-2">
                          <h4 className="text-sm font-black text-slate-900 uppercase">AI-Candidate Matching</h4>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-[320px]">
                             Automated affinity scoring based on organizational DNA and student skills scorecard.
                          </p>
                       </div>
                       <button 
                         onClick={() => {
                           setAutoMatching(!autoMatching);
                           // DBMS TRACE: AI Logic Mutation
                           addTrace({
                             operation: 'UPDATE',
                             table: 'company',
                             description: `Modify corporate recruitment intelligence weighting`,
                             sql: `UPDATE company \nSET ai_matching_enabled = ${!autoMatching} \nWHERE user_id = '${user?.id}';`
                           });
                         }}
                         className={`relative w-24 h-11 rounded-full px-2 flex items-center transition-all duration-500 shadow-lg ${autoMatching ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-slate-300'}`}
                       >
                          <motion.div 
                            animate={{ x: autoMatching ? 48 : 0 }}
                            className="size-8 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-md"
                          >
                             {autoMatching ? <Zap size={14} fill="currentColor" /> : <div className="size-2 rounded-full bg-slate-300" />}
                          </motion.div>
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm space-y-5">
                          <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                             <BarChart size={20} />
                          </div>
                          <div className="space-y-1">
                             <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Market Analytics</h4>
                             <p className="text-[9px] text-slate-400 font-medium leading-relaxed">Share anonymized placement metrics with institutional research labs.</p>
                          </div>
                          <div className="pt-2">
                             <span className="text-[8px] px-2 py-1 rounded bg-indigo-50 text-indigo-600 font-black uppercase">Enabled</span>
                          </div>
                       </div>

                       <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm space-y-5">
                          <div className="size-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
                             {visibility ? <Eye size={20} className="text-emerald-600" /> : <EyeOff size={20} />}
                          </div>
                          <div className="space-y-1">
                             <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Partner Visibility</h4>
                             <p className="text-[9px] text-slate-400 font-medium leading-relaxed">Visibility of your detailed organizational profile in the Student Marketplace.</p>
                          </div>
                          <div className="pt-2">
                             <button onClick={() => {
                               setVisibility(!visibility);
                               // DBMS TRACE: Visibility Sharding
                               addTrace({
                                 operation: 'UPDATE',
                                 table: 'company',
                                 description: `Dynamically toggle organizational visibility in the marketplace cache`,
                                 sql: `UPDATE company \nSET is_visible = ${!visibility} \nWHERE user_id = '${user?.id}';`
                               });
                             }} className="text-[8px] font-black uppercase text-emerald-600 underline underline-offset-4 decoration-emerald-200 decoration-2">Toggle Status</button>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-4">
                    <ShieldCheck size={20} className="text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-bold text-emerald-800 uppercase leading-relaxed">
                       Hiring preferences directly influence student recommendation weights in the <span className="underline cursor-pointer">Intelligence Dashboard</span>.
                    </p>
                 </div>
              </div>
           </AnimatedSection>
        </div>

        {/* Security & Support */}
        <div className="lg:col-span-4 space-y-10">
           <AnimatedSection direction="up" delay={0.1}>
              <div className="bg-slate-950 rounded-[3rem] p-10 text-white space-y-10 shadow-2xl relative overflow-hidden group h-full flex flex-col justify-between">
                 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                    <Lock size={140} className="text-emerald-500" />
                 </div>
                 
                 <div className="space-y-8 relative z-10">
                    <div className="space-y-2">
                       <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                          <Key size={22} />
                       </div>
                       <h3 className="text-2xl font-black uppercase tracking-tighter">Security.</h3>
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-[4px]">Verified Corporate Session</p>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-[3px] ml-1">Account Custodian</label>
                          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-slate-300 truncate">
                             {user?.email || 'recruiter@corporation.com'}
                          </div>
                       </div>
                       
                       <button 
                         onClick={handlePasswordReset}
                         disabled={updating}
                         className="w-full h-14 bg-emerald-600 hover:bg-white hover:text-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-[4px] transition-all disabled:opacity-50 shadow-xl shadow-emerald-900/20"
                       >
                          {updating ? 'Initialising Reset...' : 'Rotate Security Key'}
                       </button>
                    </div>
                 </div>

                 <div className="relative z-10 pt-8 border-t border-white/5">
                    <p className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed italic">
                       &quot;Multi-factor authentication is recommended for all regional recruitment heads.&quot;
                    </p>
                 </div>
              </div>
           </AnimatedSection>
        </div>

      </div>
      
      <footer className="pt-20 opacity-30 text-center">
         <p className="text-[8px] font-black uppercase tracking-[15px] text-slate-900">Partner Governance Terminal • Node Corp-01</p>
      </footer>
    </div>
  );
}
