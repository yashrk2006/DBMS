'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Users, Briefcase, Plus, Search, Filter, 
  CheckCircle2, XCircle, Clock, ChevronRight, MessageSquare, 
  MoreVertical, Calendar, TrendingUp, Target, Sparkles, Brain, Award, Star, Download, ShieldCheck
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

const HiringAnalytics = {
  generateResponseDraft: (name: string, score: number, role: string) => {
    return `Hi ${name},\n\nThank you for applying for the ${role} position. We were impressed by your profile and your match score of ${score}%. We would like to move forward with your application.\n\nBest regards,\nSkillSync Recruitment Team`;
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
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-[5px] text-slate-400">Dashboard • Active</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">Applicants</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Review applicants and identify top talent.</p>
        </div>
        <div className="relative group w-full md:w-auto shrink-0">
          <button 
            disabled={!stats.isVerified}
            onClick={() => router.push('/company/postings')}
            className={`w-full md:w-auto px-8 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg ${
              stats.isVerified 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed grayscale'
            }`}
          >
            <Plus size={18} />
            Post New Role
          </button>
          {!stats.isVerified && (
            <div className="absolute top-full right-0 mt-3 p-3 bg-slate-900 text-white text-[10px] font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-slate-800 shadow-2xl">
              Verification Required
            </div>
          )}
        </div>
      </header>

      {/* Recommended Candidates */}
      <AnimatePresence>
        {applications.filter(a => (a as any).interview_score).length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
               <Star size={14} md:size={16} className="text-amber-500 fill-amber-500" />
               <h3 className="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-[4px]">Top Recommendations</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
               {applications
                 .filter(a => (a as any).interview_score)
                 .sort((a, b) => ((b as any).interview_score || 0) - ((a as any).interview_score || 0))
                 .slice(0, 3)
                 .map((app, idx) => (
                   <motion.div 
                     key={app.application_id}
                     whileHover={{ y: -5 }}
                     onClick={() => setSelectedApplication(app)}
                     className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-[2rem] text-white shadow-xl shadow-indigo-600/20 cursor-pointer relative overflow-hidden"
                   >
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Award size={64} />
                     </div>
                     <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="size-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-sm">
                              {app.student_name.charAt(0)}
                           </div>
                           <div>
                              <div className="text-sm font-black uppercase tracking-tight">{app.student_name}</div>
                              <div className="text-[8px] font-bold text-white/60 uppercase tracking-widest leading-none">{app.role_title}</div>
                           </div>
                        </div>
                        <div className="flex items-end justify-between">
                           <div>
                              <div className="text-[7px] font-black text-indigo-200 uppercase tracking-[3px]">Match Score</div>
                              <div className="text-2xl md:text-3xl font-black">{(app as any).interview_score}%</div>
                           </div>
                           <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest">
                              Member #{idx + 1}
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

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Active Roles', value: stats.activeRoles, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Applicants', value: stats.totalApplicants, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Pending', value: stats.pendingReview, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Schedule', value: stats.interviewsScheduled, icon: Calendar, color: 'text-slate-700', bg: 'bg-slate-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{stat.label}</span>
              <div className={`size-8 md:size-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon size={16} md:size={18} />
              </div>
            </div>
            <div className={`text-2xl md:text-4xl font-black ${stat.color} tracking-tighter`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Applicant Feed */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-widest text-center sm:text-left">Candidate Feed</h3>
              <div className="flex items-center justify-center gap-3">
                <button 
                  onClick={handleAiShortlist} 
                  disabled={isShortlisting}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 text-white flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <Sparkles size={14} className={isShortlisting ? "animate-spin" : ""} /> {isShortlisting ? "Analyzing..." : "AI Match"}
                </button>
                <button onClick={handleExport} className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-100 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm">
                  <Download size={14} /> Export
                </button>
              </div>
            </div>

            {/* Granular Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Seach and set live query run (E.g. Student Name, ID...)"
                  className="w-full h-12 pl-12 pr-4 bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <div className="h-10 px-4 rounded-xl border border-slate-100 bg-white flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  <Filter size={10} /> 
                  Match > 80%
                </div>
                <div className="h-10 px-4 rounded-xl border border-slate-100 bg-white flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  <Clock size={10} /> 
                  This Week
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary Chips */}
          <div className="flex flex-wrap gap-3 md:gap-4">
             {[
               { icon: Target, label: 'Highest Match', val: applications.length > 0 ? `${Math.max(...applications.map(a => a.match_score))}%` : '0%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
               { icon: Brain, label: 'Priority List', val: aiShortlist?.length || 0, color: 'text-indigo-600', bg: 'bg-indigo-50' }
             ].map(chip => (
               <div key={chip.label} className="flex-1 min-w-[140px] px-5 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-[1.5rem] bg-white border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4">
                  <div className={`size-8 rounded-xl ${chip.bg} ${chip.color} flex items-center justify-center shadow-inner shrink-0`}><chip.icon size={14} /></div>
                  <div className="min-w-0">
                    <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest truncate">{chip.label}</div>
                    <div className="text-sm font-black text-slate-900 tracking-tighter truncate">{chip.val}</div>
                  </div>
               </div>
             ))}
          </div>

          <div className="space-y-4">
            {applications.map((app) => (
              <motion.div 
                key={app.application_id}
                onClick={() => setSelectedApplication(app)}
                layoutId={app.application_id}
                className={`p-6 bg-white border rounded-[2rem] transition-all cursor-pointer group hover:border-emerald-600/50 hover:shadow-xl ${selectedApplication?.application_id === app.application_id ? 'border-emerald-600 shadow-lg' : 'border-slate-100'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6">
                  <div className="flex items-center gap-4 md:gap-5">
                    <div className="size-12 md:size-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-lg font-black uppercase shadow-lg group-hover:bg-emerald-600 transition-colors shrink-0">
                      {app.student_name ? app.student_name.charAt(0) : '?'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight">{app.student_name}</h4>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[7px] font-black text-slate-500 uppercase tracking-widest">{app.student_roll_no}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.role_title}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-50 pt-4 sm:pt-0">
                    <div className="text-left sm:text-right">
                        <div className="flex items-center gap-2 sm:justify-end">
                            <Brain size={12} className="text-indigo-500" />
                            <span className="text-[8px] md:text-[10px] font-black text-indigo-500 uppercase tracking-widest">Fit Score</span>
                        </div>
                        <div className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter">{app.match_score}%</div>
                    </div>
                    <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl border text-[8px] md:text-[9px] font-black uppercase tracking-[2px] ${statusColors[app.status]?.bg || 'bg-slate-50'} ${statusColors[app.status]?.border || 'border-slate-100'} ${statusColors[app.status]?.color || 'text-slate-500'}`}>
                      {app.status}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {applications.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-8 border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50"
              >
                <div className="size-20 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-200">
                  <Users size={40} />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black text-slate-700 uppercase tracking-tighter">No Applicants</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[3px] max-w-xs">
                    Post your first role to start receiving matched candidates.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/company/postings')}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[4px] hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
                >
                  + Post a Role
                </button>
              </motion.div>
            )}
          </div>
        </div>


        {/* Profile Decision Panel */}
        <div className="xl:col-span-4 space-y-8">
            <AnimatePresence mode="wait">
                {selectedApplication ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="bg-slate-950 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 text-white border border-white/5 relative overflow-hidden h-fit shadow-2xl"
                    >
                        <AnimatePresence>
                            {activeDraft && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute inset-4 z-20 bg-slate-900/90 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 border border-white/10 flex flex-col gap-4 md:gap-6"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={14} className="text-indigo-400" />
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[4px]">Suggested Reply</span>
                                        </div>
                                        <button onClick={() => setActiveDraft(null)} className="text-slate-500 hover:text-white"><XCircle size={18} /></button>
                                    </div>
                                    <textarea 
                                        readOnly
                                        value={activeDraft}
                                        className="flex-1 bg-white/5 rounded-2xl p-4 md:p-6 text-[11px] font-medium text-slate-300 border border-white/5 resize-none font-mono leading-relaxed"
                                    />
                                    <div className="flex flex-col gap-2">
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(activeDraft);
                                                toast.success("Saved to clipboard");
                                            }}
                                            className="w-full py-3 bg-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-[3px] hover:bg-indigo-700 active:scale-95 transition-all"
                                        >
                                            Copy to clipboard
                                        </button>
                                        <button 
                                            onClick={() => setActiveDraft(null)}
                                            className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-black text-[9px] uppercase tracking-[3px] hover:bg-white/10"
                                        >
                                            Discard
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative z-10 space-y-8 md:space-y-10">
                           <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <Sparkles size={12} md:size={14} className="text-emerald-500" />
                                        <span className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-[3px] md:tracking-[4px]">Review Center</span>
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-none">Evaluation.</h3>
                                </div>
                                <button onClick={() => setSelectedApplication(null)} className="size-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white"><XCircle size={18} /></button>
                           </div>

                           <div className="space-y-6">
                                <div className="p-5 md:p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4 md:space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">Growth Metrics</span>
                                        {(selectedApplication as any).interview_score && (
                                            <div className="flex items-center gap-2">
                                                <div className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest">Complete</span>
                                            </div>
                                        )}
                                    </div>

                                    {(selectedApplication as any).interview_score ? (
                                        <div className="space-y-4 md:space-y-6">
                                            <div className="flex items-end gap-3">
                                                <h4 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{(selectedApplication as any).interview_score}%</h4>
                                                <div className="pb-1">
                                                    <div className="text-[7px] font-black text-indigo-400 uppercase tracking-[2px]">Match Score</div>
                                                    <div className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Recommended</div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Brain size={12} className="text-indigo-400" />
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recruitment Notes</span>
                                                </div>
                                                <p className="text-[10px] md:text-[11px] font-medium text-slate-300 leading-relaxed italic">&quot;{(selectedApplication as any).interview_notes}&quot;</p>
                                            </div>

                                            {(selectedApplication as any).interview_logs && (selectedApplication as any).interview_logs.length > 0 && (
                                                <div className="pt-4 border-t border-white/5 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                                            <ShieldCheck size={12} /> Verification Log
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{(selectedApplication as any).interview_logs.length} Note(s)</span>
                                                    </div>
                                                    <div className="max-h-24 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                                                        {(selectedApplication as any).interview_logs.map((log: string, i: number) => (
                                                            <div key={i} className="text-[8px] font-mono text-slate-500 p-2 bg-white/5 rounded-lg border-l border-emerald-500/30">
                                                                {`> ${log}`}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {(selectedApplication.ai_interview_guide || ["Describe your experience.", "How do you solve problems?", "Technical expertise summary."]).map((q: string, i: number) => (
                                                <div key={i} className="flex gap-3 group">
                                                    <span className="text-indigo-500 font-black text-[10px] leading-none">0{i+1}.</span>
                                                    <p className="text-[10px] md:text-[11px] font-medium text-slate-400 group-hover:text-white transition-colors">{q}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>


                                <div className="flex gap-2">
                                    <button 
                                      onClick={() => (selectedApplication as any).resume_analysis?.resume_url ? window.open((selectedApplication as any).resume_analysis.resume_url, '_blank') : toast.error("Document not found")}
                                      className="flex-1 py-3.5 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[3px] text-white/70 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                      <Download size={12} md:size={14} /> Resume
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                      onClick={() => handleStatusUpdate(selectedApplication.application_id, 'Interviewing')}
                                      className="flex-1 py-4 bg-emerald-600 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-[3px] shadow-lg shadow-emerald-900/40 hover:bg-emerald-700 transition-all active:scale-95"
                                    >
                                      Accept
                                    </button>
                                    <button 
                                      onClick={() => handleStatusUpdate(selectedApplication.application_id, 'Rejected')}
                                      className="size-12 md:size-14 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl flex items-center justify-center text-white/50 hover:bg-red-900/40 hover:text-red-400 transition-all active:scale-95"
                                    >
                                      <XCircle size={18} md:size={20} />
                                    </button>
                                </div>
                           </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-white rounded-[3rem] border border-slate-100 p-10 h-fit"
                    >
                         <div className="flex items-center gap-3 mb-10">
                            <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Search size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Talent Search</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px]">SkillSync Discovery</p>
                            </div>
                         </div>

                         <div className="space-y-6">
                            {talentDiscovery.map((talent) => (
                                <div key={talent.id} className="p-5 border border-slate-50 bg-slate-50/50 rounded-2xl group hover:bg-white hover:border-emerald-600/30 hover:shadow-xl transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{talent.name}</h4>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match: <span className="text-emerald-600">{talent.top_match?.role || 'N/A'}</span></span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg">
                                            <Star size={10} className="fill-emerald-600" />
                                            <span className="text-[10px] font-black">{talent.top_match?.score || 0}%</span>
                                        </div>
                                    </div>
                                    <button 
                                      onClick={async () => {
                                        toast.promise(
                                          fetch('/api/notifications', {
                                            method: 'POST',
                                            body: JSON.stringify({ 
                                              userId: talent.id, 
                                              title: "Career Invitation", 
                                              message: `You have been invited to apply for ${talent.top_match?.role || 'a position'}` 
                                            })
                                          }),
                                          { loading: 'Sending...', success: 'Invited!', error: 'Error' }
                                        );
                                      }}
                                      className="w-full mt-4 py-2 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-black"
                                    >
                                      Invite
                                    </button>
                                </div>
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
