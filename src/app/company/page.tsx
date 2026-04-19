'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Users, Briefcase, Plus, Search, Filter, 
  CheckCircle2, XCircle, Clock, ChevronRight, MessageSquare, 
  MoreVertical, Calendar, TrendingUp, Target, Sparkles, Brain, Award, Star, Download, ShieldCheck, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EnrichedCompanyApplication, 
  TalentDiscoveryProfile, 
  CompanyStats 
} from '@/types';
import { exportToCSV } from '@/lib/utils/export';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useDBMS } from '@/context/DBMSContext';

const HiringAnalytics = {
  generateResponseDraft: (name: string, score: number, role: string) => {
    const time = new Date().getHours();
    const greeting = time < 12 ? "Good morning" : time < 17 ? "Good afternoon" : "Good evening";
    
    if (score >= 90) {
      return `${greeting} ${name},\n\nI just reviewed your application for the ${role} position. Your Technical Maturity score of ${score}% is among the highest in our current recruitment cluster. We'd like to fast-track your profile for an engineering sync.\n\nPlease let us know your availability for a technical architecture discussion.\n\nBest regards,\nTalent Acquisition Engineering`;
    }
    
    return `${greeting} ${name},\n\nThank you for synchronizing your profile for the ${role} position. We've analyzed your skill DNA and found strong alignment with our core requirements. We'd like to move forward with a preliminary interview.\n\nRegards,\nDBMS Project Platform Hub`;
  }
};

const statusColors: Record<string, { color: string; bg: string; border: string }> = {
  'Pending':      { color: 'text-slate-500',  bg: 'bg-slate-50',   border: 'border-slate-100'  },
  'Under Review': { color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-100'  },
  'Interviewing': { color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-100' },
  'Accepted':     { color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-100'},
  'Rejected':     { color: 'text-red-500',    bg: 'bg-red-50',     border: 'border-red-100'    },
};

export default function CompanyDashboard() {
  const router = useRouter();
  const { addTrace } = useDBMS();
  const [stats, setStats] = useState<CompanyStats>({ 
    activeRoles: 0, 
    totalApplicants: 0, 
    pendingReview: 0, 
    interviewsScheduled: 0, 
    isVerified: false 
  });
  const [applications, setApplications] = useState<EnrichedCompanyApplication[]>([]);
  const [talentDiscovery, setTalentDiscovery] = useState<TalentDiscoveryProfile[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<EnrichedCompanyApplication | null>(null);
  const [isShortlisting, setIsShortlisting] = useState(false);
  const [aiShortlist, setAiShortlist] = useState<any>(null); 
  const [activeDraft, setActiveDraft] = useState<string | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const generateDraft = (app: EnrichedCompanyApplication) => {
    setIsDrafting(true);
    setTimeout(() => {
        const score = (app as any).interview_score || 0;
        const draft = HiringAnalytics.generateResponseDraft(app.student_name, score, app.role_title);
        setActiveDraft(draft);
        setIsDrafting(false);
        toast.success("Response Draft Ready", { icon: "✍️" });
    }, 1000);
  };

  useEffect(() => {
    const controller = new AbortController();
    
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const storedId = session?.user?.id;
      
      if (!storedId) {
        window.location.href = '/auth/login';
        return;
      }

      try {
        const response = await fetch(`/api/company/stats?companyId=${storedId}`, {
          signal: controller.signal
        });
        const result = await response.json();

        if (result.success) {
          setStats(result.stats);
          setApplications(result.applications);
          setTalentDiscovery(result.talentDiscovery);
          
          addTrace({
             operation: 'SELECT',
             table: 'application',
             description: 'Synchronize relational applicant buffers for corporate assessment.',
             sql: `SELECT a.*, s.name, s.email, i.title \nFROM application a \nJOIN student s ON a.student_id = s.id \nJOIN internship i ON a.internship_id = i.id \nWHERE a.company_id = '${storedId}';`
          });
        }
        setLoading(false);
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Failed to load company dashboard:', e);
          setLoading(false);
        }
      }
    }
    load();

    return () => controller.abort();
  }, [router]);

  const handleStatusUpdate = async (appId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/company/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: appId, status: newStatus })
      });
      const result = await res.json();
      if (result.success) {
        setApplications(apps => apps.map(a => a.application_id === appId ? { ...a, status: newStatus as any } : a));
        
        addTrace({
          operation: 'UPDATE',
          table: 'application',
          description: 'Authenticate institutional status shift for recruitment candidate.',
          sql: `UPDATE application SET status = '${newStatus}' \nWHERE application_id = '${appId}';`
        });
        if (selectedApplication?.application_id === appId) {
          setSelectedApplication(prev => prev ? { ...prev, status: newStatus as any } : null);
        }
        toast.success(`Marked as ${newStatus}`, { icon: "✅" });
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      toast.error("Error updating status");
    }
  };

  const handleAiShortlist = async () => {
    if (applications.length === 0) return;
    setIsShortlisting(true);
    try {
      const candidates = applications.map(app => ({ 
        name: app.student_name, 
        skills: app.student_skills || [] 
      }));

      const jobContext = applications[0]?.role_title || "Technical Position";
      const jd = `Looking for top candidates for the ${jobContext} role. Focus on technical maturity and skill alignment.`;

      const res = await fetch('/api/recruiter/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobDescription: jd,
          candidates 
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiShortlist(data.data);
      }
    } catch (e) { console.error(e); }
    setIsShortlisting(false);
  };

  const handleExport = () => {
    const exportData = applications.map(app => ({
      'Application ID': app.application_id,
      'Student Name': app.student_name,
      'Role': app.role_title,
      'Match Score (%)': app.match_score,
      'Applied Date': new Date(app.applied_date).toLocaleDateString(),
      'Status': app.status
    }));
    exportToCSV(exportData, `applicants_${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20 text-slate-400 gap-3">
      <div className="size-4 rounded-full border-2 border-emerald-600/30 border-t-emerald-600 animate-spin" />
      <span className="text-sm font-bold uppercase tracking-widest">Loading Dashboard...</span>
    </div>
  );

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
            <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Strategic Recruitment Hub</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-950 tracking-tighter">Acquisition.</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight mt-2 max-w-lg">Identify, evaluate, and acquire high-performance talent clusters through real-time matching intelligence.</p>
        </div>
        <div className="relative group w-full md:w-auto shrink-0">
          <button 
            disabled={!stats.isVerified}
            onClick={() => router.push('/company/postings')}
            className={`w-full md:w-auto px-10 py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all font-black text-[11px] uppercase tracking-[3px] shadow-2xl active:scale-95 ${
              stats.isVerified 
                ? 'bg-slate-950 hover:bg-slate-800 text-white' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed grayscale'
            }`}
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            Launch Opportunity
          </button>
          {!stats.isVerified && (
            <div className="absolute top-full right-0 mt-3 p-4 bg-slate-950 text-white text-[9px] font-black rounded-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10 shadow-2xl uppercase tracking-widest">
              Awaiting Verification Access
            </div>
          )}
        </div>
      </header>

      {/* Recommended Candidates - High Fidelity Highlight */}
      <AnimatePresence>
        {applications.filter(a => (a as any).interview_score).length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
               <Star size={14} className="text-amber-500 fill-amber-500/20" />
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[5px]">Prime Talent Clusters</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
               {applications
                 .filter(a => (a as any).interview_score)
                 .sort((a, b) => ((b as any).interview_score || 0) - ((a as any).interview_score || 0))
                 .slice(0, 3)
                 .map((app, idx) => (
                   <motion.div 
                     key={app.application_id}
                     whileHover={{ y: -8, scale: 1.02 }}
                     onClick={() => setSelectedApplication(app)}
                     className="p-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-950 rounded-[3rem] text-white shadow-2xl shadow-indigo-600/20 cursor-pointer relative overflow-hidden group/prime"
                   >
                     <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/prime:scale-125 transition-transform duration-1000">
                        <Award size={100} />
                     </div>
                     <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="size-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center font-black text-lg border border-white/20 shadow-inner">
                              {app.student_name.charAt(0)}
                           </div>
                           <div className="space-y-1">
                              <div className="text-base font-black uppercase tracking-tight leading-none group-hover/prime:text-amber-500 transition-colors">{app.student_name}</div>
                              <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">Global ID: {app.student_roll_no}</div>
                           </div>
                        </div>
                        <div className="flex items-end justify-between pt-2">
                           <div>
                              <div className="text-[8px] font-black text-indigo-300 uppercase tracking-[4px] mb-1">Match Potential</div>
                              <div className="text-4xl md:text-5xl font-black tracking-tighter">{(app as any).interview_score}%</div>
                           </div>
                           <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md rounded-xl text-[9px] font-black uppercase tracking-[2px] text-emerald-400">
                              Top {idx + 1}
                           </div>
                        </div>
                     </div>
                   </motion.div>
                 ))
               }
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Overview - Refined Tiling */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Pipeline', value: stats.activeRoles, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Growth Pool', value: stats.totalApplicants, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Decision Buffer', value: stats.pendingReview, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Events Sync', value: stats.interviewsScheduled, icon: Calendar, color: 'text-slate-900', bg: 'bg-slate-50', border: 'border-slate-200' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-white p-8 md:p-10 rounded-[2.5rem] border ${stat.border} shadow-[var(--soft-shadow)] hover:shadow-2xl transition-all group cursor-default relative overflow-hidden`}
          >
            <div className={`absolute -right-4 -bottom-4 size-24 opacity-5 scale-150 transition-transform group-hover:rotate-12 duration-700 ${stat.color}`}>
              <stat.icon size={96} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">{stat.label}</span>
                <div className={`size-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} border border-black/5`}>
                    <stat.icon size={20}  />
                </div>
                </div>
                <div className={`text-4xl md:text-5xl font-black ${stat.color} tracking-tighter`}>{stat.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Applicant Feed - Intelligence Profiles */}
        <div className="xl:col-span-8 space-y-8">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="size-1.5 rounded-full bg-emerald-500" />
                    <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[5px]">Talent Discovery Channel</h3>
                </div>
                <h2 className="text-3xl font-black text-slate-950 tracking-tighter">Heartbeat.</h2>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button 
                  onClick={handleAiShortlist} 
                  disabled={isShortlisting}
                  className="px-6 py-4 rounded-2xl bg-indigo-600 text-white flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[3px] hover:bg-indigo-700 transition-all shadow-xl active:scale-95 disabled:opacity-50 group grow sm:grow-0"
                >
                  <Sparkles size={16} className={isShortlisting ? "animate-spin" : "group-hover:rotate-12 transition-transform"} /> 
                  {isShortlisting ? "Running Sync..." : "AI Intelligence Match"}
                </button>
                <button onClick={handleExport} className="px-6 py-4 rounded-2xl border border-slate-100 bg-white flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[3px] text-slate-900 hover:bg-slate-50 transition-all shadow-sm group active:scale-95">
                  <Download size={16} className="group-hover:-translate-y-1 transition-transform" /> Export Vectors
                </button>
              </div>
            </div>

            {/* Granular Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                  type="text"
                  placeholder="Seach and set live query run (E.g. Student Name, Roll No...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-14 pr-6 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all shadow-inner"
                />
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
                <button className="h-14 px-6 rounded-2xl border border-slate-100 bg-white flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 hover:border-emerald-500/30 transition-all whitespace-nowrap shadow-sm group">
                  <Target size={14} className="group-hover:scale-110 transition-transform" /> 
                  Match {'>'} 85%
                </button>
                <button className="h-14 px-6 rounded-2xl border border-slate-100 bg-white flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-500/30 transition-all whitespace-nowrap shadow-sm group">
                  <Brain size={14} className="group-hover:scale-110 transition-transform" /> 
                  Skill Alignment
                </button>
              </div>
            </div>
          </div>

          {/* Performance Summary Chips */}
          <div className="flex flex-wrap gap-4 md:gap-6">
             {[
               { icon: Target, label: 'Highest Affinity', val: applications.length > 0 ? `${Math.max(...applications.map(a => a.match_score))}%` : '0%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
               { icon: Brain, label: 'High Priority Count', val: aiShortlist?.length || 0, color: 'text-indigo-600', bg: 'bg-indigo-50' }
             ].map(chip => (
               <div key={chip.label} className="flex-1 min-w-[200px] px-8 py-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-[var(--soft-shadow)] flex items-center gap-6 group hover:shadow-xl transition-all">
                  <div className={`size-12 rounded-2xl ${chip.bg} ${chip.color} flex items-center justify-center shadow-inner shrink-0 group-hover:rotate-12 transition-transform`}><chip.icon size={20} /></div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-1 truncate">{chip.label}</div>
                    <div className="text-2xl font-black text-slate-900 tracking-tighter truncate">{chip.val}</div>
                  </div>
               </div>
             ))}
          </div>

          <div className="space-y-6">
            {applications
              .filter(app => {
                const q = searchQuery.toLowerCase().trim();
                if (!q) return true;
                return app.student_name.toLowerCase().includes(q) || 
                       app.student_roll_no.toLowerCase().includes(q) ||
                       app.role_title.toLowerCase().includes(q);
              })
              .map((app, i) => (
              <motion.div 
                key={app.application_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedApplication(app)}
                className={`p-8 bg-white border rounded-[3rem] transition-all cursor-pointer group hover:border-emerald-600/50 hover:shadow-2xl active:scale-[0.99] ${selectedApplication?.application_id === app.application_id ? 'border-emerald-600 shadow-xl ring-4 ring-emerald-500/5' : 'border-slate-100'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 md:gap-8">
                  <div className="flex items-center gap-6 md:gap-8">
                    <div className="size-16 md:size-20 rounded-[1.8rem] bg-slate-950 text-white flex items-center justify-center text-2xl font-black uppercase shadow-2xl group-hover:bg-emerald-600 group-hover:shadow-emerald-600/40 transition-all shrink-0">
                      {app.student_name ? app.student_name.charAt(0) : '?'}
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-xl font-black text-slate-950 uppercase tracking-tighter group-hover:text-emerald-600 transition-colors">{app.student_name}</h4>
                        <span className="px-3 py-1 rounded-lg bg-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">{app.student_roll_no}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Briefcase size={12} className="text-slate-300" />
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[2px]">{app.role_title}</span>
                        </div>
                        <div className="size-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{new Date(app.applied_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-10 border-t sm:border-t-0 border-slate-50 pt-6 sm:pt-0">
                    <div className="text-left sm:text-right space-y-1">
                        <div className="flex items-center gap-2 sm:justify-end">
                            <Brain size={14} className="text-indigo-500 animate-pulse" />
                            <span className="text-[9px] md:text-[10px] font-black text-indigo-500 uppercase tracking-[4px]">Affinity Vector</span>
                        </div>
                        <div className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter">{app.match_score}%</div>
                    </div>
                    <div className={`px-6 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-[3px] shadow-sm transform group-hover:scale-105 transition-transform ${statusColors[app.status]?.bg || 'bg-slate-50'} ${statusColors[app.status]?.border || 'border-slate-100'} ${statusColors[app.status]?.color || 'text-slate-500'}`}>
                      {app.status}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {applications.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 gap-10 border-2 border-dashed border-slate-100 rounded-[4rem] bg-slate-50/50"
              >
                <div className="size-24 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl flex items-center justify-center text-slate-200 relative">
                  <Users size={48} />
                  <div className="absolute -bottom-2 -right-2 size-8 rounded-full bg-emerald-500 flex items-center justify-center text-white border-4 border-white shadow-lg">
                    <Plus size={16} />
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Zero Candidates Detected</h3>
                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-[4px] max-w-sm leading-relaxed">
                    Launch a recruitment campaign to begin populating your global candidate feed.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/company/postings')}
                  className="px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[4px] hover:bg-emerald-600 transition-all shadow-2xl active:scale-95 group"
                >
                  <Plus size={18} className="inline mr-3 group-hover:rotate-90 transition-transform" /> Post Campaign
                </button>
              </motion.div>
            )}
          </div>
        </div>


        {/* Profile Decision Panel - Premium Hiring Engine */}
        <div className="xl:col-span-4 space-y-10">
            <AnimatePresence mode="wait">
                {selectedApplication ? (
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
                        className="bg-slate-950 rounded-[3.5rem] p-10 md:p-14 text-white border border-white/5 relative overflow-hidden h-fit shadow-2xl shadow-emerald-950/20"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-emerald-600/10 opacity-50" />
                        
                        <AnimatePresence>
                            {activeDraft && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute inset-4 z-20 bg-slate-900/95 backdrop-blur-3xl rounded-[3rem] p-8 md:p-12 border border-white/10 flex flex-col gap-8"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Sparkles size={20} className="text-indigo-400 animate-pulse" />
                                            <span className="text-[12px] font-black text-indigo-400 uppercase tracking-[6px]">AI Response Draft</span>
                                        </div>
                                        <button onClick={() => setActiveDraft(null)} className="size-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors"><XCircle size={22} /></button>
                                    </div>
                                    <textarea 
                                        readOnly
                                        value={activeDraft}
                                        className="flex-1 bg-white/5 rounded-[2rem] p-8 text-[13px] font-medium text-slate-300 border border-white/5 resize-none font-mono leading-relaxed shadow-inner"
                                    />
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(activeDraft);
                                                toast.success("Saved to terminal clipboard");
                                            }}
                                            className="w-full py-5 bg-indigo-600 rounded-2xl font-black text-[11px] uppercase tracking-[4px] hover:bg-indigo-700 active:scale-95 transition-all shadow-xl"
                                        >
                                            Copy to clipboard
                                        </button>
                                        <button 
                                            onClick={() => setActiveDraft(null)}
                                            className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-[11px] uppercase tracking-[4px] hover:bg-white/10 transition-colors"
                                        >
                                            Discard Generation
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative z-10 space-y-12">
                           <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                                        <span className="text-[10px] md:text-[11px] font-black text-emerald-500 uppercase tracking-[5px]">Acquisition Desk</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Decision.</h3>
                                </div>
                                <button onClick={() => setSelectedApplication(null)} className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95"><XCircle size={24} /></button>
                           </div>

                           <div className="space-y-10">
                                <div className="p-8 md:p-10 bg-white/5 rounded-[3rem] border border-white/10 space-y-8 shadow-inner">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[4px]">Sync Maturity</span>
                                        {(selectedApplication as any).interview_score && (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[3px]">Verified</span>
                                            </div>
                                        )}
                                    </div>

                                    {(selectedApplication as any).interview_score ? (
                                        <div className="space-y-8">
                                            <div className="flex items-baseline gap-4">
                                                <h4 className="text-7xl md:text-8xl font-black text-white tracking-tighter">{(selectedApplication as any).interview_score}%</h4>
                                                <div className="pb-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <TrendingUp size={14} className="text-indigo-400" />
                                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[3px]">Affinity</span>
                                                    </div>
                                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[2px]">Cluster Leader</div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                                                        <Brain size={16} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Recruitment Intel</span>
                                                </div>
                                                <p className="text-[12px] md:text-[13px] font-medium text-slate-300 leading-relaxed italic border-l-2 border-indigo-600/50 pl-6 py-2 bg-indigo-600/5">&quot;{(selectedApplication as any).interview_notes}&quot;</p>
                                            </div>

                                            {/* Skill DNA Visualization */}
                                            <div className="pt-8 border-t border-white/5 space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                                        <Cpu size={16} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Skill Matrix DNA</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                   {(selectedApplication.student_skills || ['AI/ML', 'System Architecture', 'UI/UX Design']).map((skill: string, i: number) => (
                                                       <motion.div 
                                                           key={i} 
                                                           initial={{ opacity: 0, scale: 0.9 }}
                                                           animate={{ opacity: 1, scale: 1 }}
                                                           transition={{ delay: i * 0.05 }}
                                                           className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:border-amber-500/40 hover:text-amber-400 transition-all cursor-default"
                                                       >
                                                           {skill}
                                                       </motion.div>
                                                   ))}
                                                </div>
                                            </div>

                                            {(selectedApplication as any).interview_logs && (selectedApplication as any).interview_logs.length > 0 && (
                                                <div className="pt-8 border-t border-white/5 space-y-5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[5px] flex items-center gap-3">
                                                            <ShieldCheck size={14} /> Telemetry Log
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-none">{(selectedApplication as any).interview_logs.length} Vectors Captured</span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {(selectedApplication as any).interview_logs.map((log: string, i: number) => (
                                                            <motion.div 
                                                                key={i} 
                                                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                                                className="text-[9px] font-mono text-slate-500 p-4 bg-white/[0.02] rounded-2xl border border-white/5 leading-relaxed"
                                                            >
                                                                {`> ANALYSIS: ${log}`}
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="text-[10px] font-black text-amber-500 uppercase tracking-[5px] mb-4">Awaiting Analysis Parameters</div>
                                            {(selectedApplication.ai_interview_guide || ["Technical Competency Scan", "Architecture Knowledge Check", "Communication Maturity Audit"]).map((q: string, i: number) => (
                                                <div key={i} className="flex gap-4 group/q">
                                                    <span className="text-emerald-500 font-black text-xs leading-none">0{i+1}.</span>
                                                    <p className="text-[11px] md:text-[12px] font-medium text-slate-500 group-hover/q:text-white transition-colors">{q}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>


                                <div className="flex gap-4">
                                    <button 
                                      onClick={() => (selectedApplication as any).resume_analysis?.resume_url ? window.open((selectedApplication as any).resume_analysis.resume_url, '_blank') : toast.error("Asset not found")}
                                      className="flex-1 py-5 bg-white/5 border border-white/10 rounded-[2rem] font-black text-[11px] uppercase tracking-[4px] text-white/50 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3 shadow-xl group/res"
                                    >
                                      <Download size={16} className="group-hover/res:-translate-y-1 transition-transform" /> Candidate Assets
                                    </button>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                      onClick={() => handleStatusUpdate(selectedApplication.application_id, 'Interviewing')}
                                      className="flex-1 py-6 bg-emerald-600 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[5px] shadow-2xl shadow-emerald-900/50 hover:bg-emerald-500 transition-all active:scale-95 group/acc"
                                    >
                                      Execute Acquisition <ChevronRight size={18} className="inline ml-1 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button 
                                      onClick={() => handleStatusUpdate(selectedApplication.application_id, 'Rejected')}
                                      className="size-20 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center text-white/20 hover:bg-rose-900/40 hover:text-rose-400 hover:border-rose-500/30 transition-all active:scale-95"
                                    >
                                      <XCircle size={28}  />
                                    </button>
                                </div>
                           </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-white rounded-[4rem] border border-slate-100 p-12 h-fit shadow-[var(--soft-shadow)] hover:shadow-2xl transition-all"
                    >
                         <div className="flex items-center gap-6 mb-12">
                            <div className="size-16 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-inner">
                                <Target size={32} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">Sync Mode.</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Talent Discovery Radar</p>
                            </div>
                         </div>

                         <div className="space-y-8">
                            {talentDiscovery.map((talent, i) => (
                                <motion.div 
                                  key={talent.id} 
                                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                  className="p-8 border border-slate-50 bg-slate-50/50 rounded-[2.5rem] group hover:bg-white hover:border-emerald-600/40 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute -right-4 -top-4 size-20 opacity-0 group-hover:opacity-5 transition-opacity duration-500">
                                        <Award size={80} className="text-emerald-500" />
                                    </div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="space-y-1">
                                            <h4 className="font-black text-slate-950 text-base uppercase tracking-tight">{talent.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="size-1 rounded-full bg-emerald-500" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[3px]">Matched: <span className="text-emerald-600">{talent.top_match?.role || 'N/A'}</span></span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950 text-white rounded-xl shadow-lg">
                                            <Sparkles size={12} className="text-amber-400 animate-pulse" />
                                            <span className="text-[11px] font-black">{talent.top_match?.score || 0}%</span>
                                        </div>
                                    </div>
                                    <button 
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        toast.promise(
                                          fetch('/api/notifications', {
                                            method: 'POST',
                                            body: JSON.stringify({ 
                                              userId: talent.id, 
                                              title: "Elite Career Sync Invitation", 
                                              message: `Your profile has been identified as a high-affinity match for ${talent.top_match?.role || 'a leadership position'}. Synchronize your interests now.` 
                                            })
                                          }),
                                          { loading: 'Synchronizing...', success: 'Invitation Sent', error: 'Sync Failed' }
                                        );
                                      }}
                                      className="w-full mt-4 py-4 rounded-xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-[4px] opacity-0 group-hover:opacity-100 transition-all shadow-2xl hover:bg-emerald-600 transform scale-95 group-hover:scale-100"
                                    >
                                      Initiate Sync Request
                                    </button>
                                </motion.div>
                            ))}
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
