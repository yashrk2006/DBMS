'use client';

import { useEffect, useState } from 'react';
import { 
  Settings, Shield, Lock, BellRing, UserCheck, 
  Zap, Crown, Database, Globe, Users,
  Activity, Terminal, Cpu, ChevronRight, Key,
  ShieldAlert, Radio, Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useDBMS } from '@/context/DBMSContext';
import { toast } from 'react-hot-toast';
import AnimatedSection from '@/components/ui/AnimatedSection';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { addTrace } = useDBMS();
  
  // Governance State
  const [recruitmentOpen, setRecruitmentOpen] = useState(true);
  const [platformMode, setPlatformMode] = useState<'standard' | 'maintenance' | 'audit'>('standard');

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
    toast.loading("Issuing Administrative Recovery Token...", { id: "admin-reset" });
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) throw error;
      
      toast.success("Security Magic Link dispatched to Admin Inbox.", { id: "admin-reset" });
    } catch (err: any) {
      toast.error(err.message || "Security dispatch failed.", { id: "admin-reset" });
    } finally {
      setUpdating(false);
    }
  };

  const toggleRecruitment = () => {
    setRecruitmentOpen(!recruitmentOpen);
    
    // DBMS TRACE: Governance Mutation
    addTrace({
      operation: 'UPDATE',
      table: 'platform_config',
      description: `Atomic update to global platform config for recruitment window orchestration`,
      sql: `UPDATE platform_config \nSET recruitment_active = ${!recruitmentOpen}, \n    updated_at = NOW() \nWHERE id = 'global_settings';`
    });

    toast(recruitmentOpen ? "Cluster Lockdown: Recruitment Window Closed" : "Open Market: Recruitment Window Active", {
      icon: recruitmentOpen ? '🔒' : '🔓',
      style: { borderRadius: '15px', background: '#0f172a', color: '#fff', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }
    });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-8">
      <motion.div 
        animate={{ rotate: 360, opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-slate-900"
      >
        <Crown size={48} />
      </motion.div>
      <div className="text-center">
         <h2 className="text-[10px] font-bold uppercase tracking-[10px] text-slate-900 mb-2">Master Governance Hub</h2>
         <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[5px] animate-pulse">Synchronizing Authority Nodes</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      
      {/* Admin Hero */}
      <AnimatedSection direction="up">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                 <Crown size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[5px] text-slate-400">Institutional Authority</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tighter uppercase leading-[0.8]">
              Governance<span className="text-indigo-600">.hq</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium italic border-l-2 border-slate-200 pl-4 max-w-lg">
              &quot;Platform-wide policy enforcement, security orchestration, and relational database monitoring.&quot;
            </p>
          </div>

          <div className="bg-white px-8 py-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <div className="flex items-center gap-6">
                <div>
                   <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">System Load</div>
                   <div className="text-sm font-black text-slate-900 text-right uppercase">Stable 14%</div>
                </div>
                <div className="size-12 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
             </div>
          </div>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Recruitment Status Control */}
        <div className="lg:col-span-8">
           <AnimatedSection direction="right">
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-premium overflow-hidden h-full">
                 <div className="p-10 md:p-14 space-y-12">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">Market Connectivity</h3>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Recruitment Window Controls</p>
                      </div>
                      <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${recruitmentOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                         {recruitmentOpen ? 'Window Active' : 'Window Locked'}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className={`p-10 rounded-[2.5rem] border transition-all duration-500 flex flex-col justify-between gap-10 cursor-pointer ${recruitmentOpen ? 'bg-slate-900 text-white border-slate-800 shadow-2xl' : 'bg-white text-slate-900 border-slate-100 hover:border-indigo-600/30'}`} onClick={toggleRecruitment}>
                         <div className="space-y-4">
                            <div className={`size-12 rounded-2xl flex items-center justify-center ${recruitmentOpen ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-100 text-slate-400'}`}>
                               <Radio size={24} className={recruitmentOpen ? 'animate-pulse' : ''} />
                            </div>
                            <h4 className="text-lg font-black uppercase tracking-tight">Placement Window</h4>
                            <p className="text-[10px] opacity-60 leading-relaxed">Toggle institutional internship applications for the entire student directory.</p>
                         </div>
                         <div className="flex items-center gap-2">
                             <div className={`size-2 rounded-full ${recruitmentOpen ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                             <span className="text-[8px] font-black uppercase tracking-[3px]">{recruitmentOpen ? 'Live' : 'Standby'}</span>
                         </div>
                      </div>

                      <div className="space-y-6">
                         {[
                           { label: 'Platform Mode', value: platformMode.toUpperCase(), icon: Server, color: 'text-indigo-600' },
                           { label: 'Relational Integrity', value: 'Verified', icon: Database, color: 'text-emerald-600' },
                           { label: 'Security Handshakes', value: '42,912', icon: Shield, color: 'text-amber-600' }
                         ].map(item => (
                           <div key={item.label} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                              <div className="flex items-center gap-4">
                                 <div className={`size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center ${item.color}`}>
                                    <item.icon size={18} />
                                 </div>
                                 <div className="space-y-0.5">
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.label}</div>
                                    <div className="text-sm font-black text-slate-900">{item.value}</div>
                                 </div>
                              </div>
                              <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-4">
                      <ShieldAlert size={20} className="text-indigo-600 mt-0.5 shrink-0" />
                      <p className="text-[10px] font-bold text-indigo-900 uppercase leading-relaxed">
                         Governance policies are applied globally across all student and corporate nodes. Changes are logged in the <span className="underline cursor-pointer hover:text-indigo-600" onClick={() => router.push('/admin/db-audit')}>DBMS Inspector</span> for audit compliance.
                      </p>
                   </div>
                 </div>
              </div>
           </AnimatedSection>
        </div>

        {/* Security & Multi-Factor */}
        <div className="lg:col-span-4 space-y-10">
           <AnimatedSection direction="up" delay={0.1}>
              <div className="bg-slate-950 rounded-[3rem] p-10 text-white space-y-10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Key size={120} className="text-indigo-500" />
                 </div>
                 
                 <div className="relative z-10 space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Security.</h3>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[4px]">Authority Credential Guard</p>
                 </div>

                 <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                       <label className="text-[8px] font-black text-slate-500 uppercase tracking-[3px] ml-1">Administrative Email</label>
                       <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-slate-300 truncate">
                          {user?.email || 'admin@institutional.gov'}
                       </div>
                    </div>
                    
                    <button 
                      onClick={handlePasswordReset}
                      disabled={updating}
                      className="w-full h-14 bg-indigo-600 hover:bg-slate-100 hover:text-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-[4px] transition-all disabled:opacity-50 shadow-xl shadow-indigo-900/40"
                    >
                       {updating ? 'Initialising...' : 'Commit Credential Cycle'}
                    </button>
                 </div>

                 <div className="relative z-10 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[9px] font-black uppercase text-slate-400">2FA Status</span>
                       <span className="text-[8px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black uppercase">Active</span>
                    </div>
                    <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">Biometric and hardware key handshakes are enforced for all administrative mutations.</p>
                 </div>
              </div>
           </AnimatedSection>

           <AnimatedSection direction="up" delay={0.2}>
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                       <Users size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Platform Meta</h4>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Global Telemetry</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px]">
                       <span className="font-bold text-slate-500 uppercase">Active Students</span>
                       <span className="font-black text-slate-900">1,602</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                       <span className="font-bold text-slate-500 uppercase">Registered Corps</span>
                       <span className="font-black text-slate-900">42</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                       <span className="font-bold text-slate-500 uppercase">System Uptime</span>
                       <span className="font-black text-emerald-600 uppercase">99.98%</span>
                    </div>
                 </div>
              </div>
           </AnimatedSection>
        </div>

      </div>
      
      <footer className="pt-20 opacity-20 text-center">
         <p className="text-[8px] font-black uppercase tracking-[15px] text-slate-900 italic">Institutional Governance Cluster • Node Admin-01</p>
      </footer>
    </div>
  );
}
