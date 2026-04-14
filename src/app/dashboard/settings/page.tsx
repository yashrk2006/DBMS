'use client';

import { useEffect, useState } from 'react';
import { 
  Settings, Shield, Bell, Eye, EyeOff, 
  Key, Mail, User, CheckCircle2, AlertCircle,
  Smartphone, Github, Globe, Terminal, Cpu,
  ChevronRight, Lock, BellRing, UserCheck, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import AnimatedSection from '@/components/ui/AnimatedSection';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Settings State
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState({
    jobAlerts: true,
    platformUpdates: false,
    networkingRequests: true
  });

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
    toast.loading("Issuing Security Recovery Token...", { id: "reset-toast" });
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) throw error;
      
      toast.success("Security Magic Link dispatched to your inbox.", { id: "reset-toast" });
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch recovery token.", { id: "reset-toast" });
    } finally {
      setUpdating(false);
    }
  };

  const toggleVisibility = () => {
    setProfileVisibility(!profileVisibility);
    toast.success(profileVisibility ? "Ghost Protocol Activated: Profile Hidden" : "Standard Mode: Profile Visible to Talent Scouts");
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-8">
      <motion.div 
        animate={{ rotate: 360, opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-slate-900"
      >
        <Settings size={48} />
      </motion.div>
      <div className="text-center">
         <h2 className="text-[10px] font-bold uppercase tracking-[10px] text-slate-900 mb-2">Syncing Control Hub</h2>
         <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[5px] animate-pulse">Mounting System Preferences</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      
      {/* Premium Header */}
      <AnimatedSection direction="up">
        <div className="mb-6">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ChevronRight size={14} className="rotate-180" /> Back to Hub
          </button>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-slate-950 flex items-center justify-center text-white shadow-xl">
                 <Settings size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[5px] text-slate-400">Governance & Preferences</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tighter uppercase leading-[0.8]">
              Settings<span className="text-primary italic">.hub</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium italic border-l-2 border-slate-200 pl-4 max-w-lg">
              &quot;Configure your institutional presence, security protocols, and recruitment discovery heuristics.&quot;
            </p>
          </div>

          <div className="bg-white px-8 py-6 rounded-[2.5rem] border border-slate-100 shadow-sm hidden lg:block">
             <div className="flex items-center gap-4">
                <div className="text-right">
                   <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Network Status</div>
                   <div className="text-sm font-black text-emerald-600 uppercase tracking-tight">Active Node</div>
                </div>
                <div className="size-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
             </div>
          </div>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Account Module */}
        <div className="lg:col-span-12">
           <AnimatedSection direction="up" delay={0.1}>
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-premium overflow-hidden">
                 <div className="p-8 md:p-14 grid grid-cols-1 md:grid-cols-2 gap-12">
                   
                   {/* Personal Identity */}
                   <div className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                           <UserCheck size={22} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter">Core Identity</h3>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Permanent Account Metadata</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                         <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2 group hover:bg-white hover:shadow-xl transition-all">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               <Mail size={10} /> Registered Email
                            </label>
                            <div className="text-sm font-black text-slate-900">{user?.email || 'unverified@network.com'}</div>
                         </div>
                         <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               <Terminal size={10} /> Internal UUID
                            </label>
                            <div className="text-[10px] font-mono font-bold text-slate-500 break-all">{user?.id}</div>
                         </div>
                         <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
                            <Shield size={14} className="text-indigo-600" />
                            <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">Identity verified via institutional SSO</span>
                         </div>
                      </div>
                   </div>

                   {/* Security Console */}
                   <div className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                           <Lock size={22} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-slate-950 uppercase tracking-tighter">Security Console</h3>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Credential & Access Guard</p>
                        </div>
                      </div>

                      <div className="bg-slate-950 rounded-[2rem] p-8 space-y-8 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform">
                            <Key size={64} className="text-amber-500" />
                         </div>
                         <div className="relative z-10">
                            <h4 className="text-lg font-black text-white tracking-widest uppercase mb-2">Credential Refresh.</h4>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[240px]">
                               Trigger a secure cryptographic handshake to reset your authentication credentials.
                            </p>
                         </div>
                         <button 
                           onClick={handlePasswordReset}
                           disabled={updating}
                           className="w-full h-14 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[4px] relative z-10 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                         >
                            {updating ? "Dispatching..." : "Initialise Password Reset"}
                         </button>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                         <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                               <Smartphone size={20} />
                            </div>
                            <div>
                               <div className="text-[10px] font-black text-slate-900 uppercase">2FA Authentication</div>
                               <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status: Deactivated</div>
                            </div>
                         </div>
                         <button className="px-4 py-2 rounded-lg bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 hover:text-slate-900 transition-colors">Enable</button>
                      </div>
                   </div>

                 </div>
              </div>
           </AnimatedSection>
        </div>

        {/* Visibility & Discovery */}
        <div className="lg:col-span-7">
           <AnimatedSection direction="up" delay={0.2}>
              <div className="bg-white rounded-[3rem] border border-slate-100 shadow-premium p-8 md:p-12 space-y-10">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">Discovery Protocols</h3>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Talent Scout Visibility Controls</p>
                    </div>
                    {profileVisibility ? <Eye className="text-emerald-500" /> : <EyeOff className="text-red-500" />}
                 </div>

                 <div className="grid grid-cols-1 gap-6">
                    <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-primary/20 transition-all">
                       <div className="space-y-2">
                          <h4 className="text-sm font-black text-slate-900 uppercase">Public Marketplace Presence</h4>
                          <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-[320px]">
                             When enabled, your Profile DNA is visible to authenticated corporate partners for recruitment matching.
                          </p>
                       </div>
                       <button 
                         onClick={toggleVisibility}
                         className={`relative w-20 h-10 rounded-full transition-all duration-500 p-1.5 ${profileVisibility ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-300'}`}
                       >
                          <motion.div 
                            animate={{ x: profileVisibility ? 40 : 0 }}
                            className="size-7 bg-white rounded-full shadow-md flex items-center justify-center text-slate-900"
                          >
                             {profileVisibility ? <CheckCircle2 size={14} className="text-emerald-500" /> : <div className="size-2 rounded-full bg-slate-300" />}
                          </motion.div>
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-4">
                          <div className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                             <Globe size={18} />
                          </div>
                          <div className="space-y-1">
                             <h5 className="text-[11px] font-black text-slate-900 uppercase underline decoration-indigo-200 decoration-2 underline-offset-4">External Indexing</h5>
                             <p className="text-[9px] text-slate-500 font-medium leading-relaxed">Allow search engines to index your verified career scorecard.</p>
                          </div>
                       </div>
                       <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm space-y-4">
                          <div className="size-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                             <Github size={18} />
                          </div>
                          <div className="space-y-1">
                             <h5 className="text-[11px] font-black text-slate-900 uppercase underline decoration-slate-200 decoration-2 underline-offset-4">VCS Sync</h5>
                             <p className="text-[9px] text-slate-500 font-medium leading-relaxed">Auto-sync public repository metrics to your skills scorecard.</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </AnimatedSection>
        </div>

        {/* Notifications & Prefs */}
        <div className="lg:col-span-5">
           <AnimatedSection direction="up" delay={0.3}>
              <div className="bg-slate-950 rounded-[3rem] p-8 md:p-12 space-y-10 relative overflow-hidden h-full">
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                 
                 <div className="relative z-10 flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                       <BellRing size={22} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Telemetry.</h3>
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-[3px]">Notification Heuristics</p>
                    </div>
                 </div>

                 <div className="relative z-10 space-y-8">
                    {[
                      { id: 'jobAlerts', label: 'Career Opportunities', desc: 'Critical alerts for high-affinity internship openings.', icon: Zap },
                      { id: 'platformUpdates', label: 'Platform Evolution', desc: 'Synthesised updates on new system capabilities.', icon: Cpu },
                      { id: 'requests', label: 'Network Handshakes', desc: 'Institutional networking and career guidance requests.', icon: User }
                    ].map((item, i) => (
                      <div key={item.id} className="flex items-start justify-between gap-6 pb-6 border-b border-white/5 last:border-0 last:pb-0 group">
                         <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <item.icon size={11} className="text-indigo-400" />
                               <h5 className="text-[10px] font-black text-white uppercase tracking-widest">{item.label}</h5>
                            </div>
                            <p className="text-[9px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                         </div>
                         <button className="size-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all active:scale-95">
                            <CheckCircle2 size={16} />
                         </button>
                      </div>
                    ))}
                 </div>

                 <div className="relative z-10 pt-4">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[4px] leading-relaxed italic">
                       &quot;Preferences are synced across all authenticated terminal sessions.&quot;
                    </p>
                 </div>
              </div>
           </AnimatedSection>
        </div>

      </div>
      
      {/* Footer Info */}
      <footer className="pt-20 opacity-30 text-center">
         <p className="text-[8px] font-black uppercase tracking-[10px] text-slate-900">SkillSync Governance Suite v4.2.0</p>
      </footer>
    </div>
  );
}
