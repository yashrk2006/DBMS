'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, Users, Briefcase, Plus, Search, Filter, 
  CheckCircle2, XCircle, Clock, ChevronRight, MessageSquare, 
  MoreVertical, Calendar, TrendingUp, Target, Sparkles, Brain, Award, Star, Download
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
  const [loading, setLoading] = useState(true);
  const [isShortlisting, setIsShortlisting] = useState(false);
  const [aiShortlist, setAiShortlist] = useState<any>(null); // Shortlist UI is polymorphic

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
        toast.success(`Application marked as ${newStatus}`, { icon: "✅" });
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      toast.error("Network error updating status");
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
      const jd = `Looking for top candidates for the ${jobContext} role. Focus on technical maturity, skill alignment, and architectural depth.`;

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
      <span className="text-sm font-bold uppercase tracking-widest">Syndicating Company Intelligence...</span>
    </div>
  );

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-[5px] text-slate-400">Recruitment Console • Live</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Talent Pipeline</h1>
          <p className="text-slate-500 font-medium tracking-tight">Manage role matchings and AI-driven candidate assessments.</p>
        </div>
        <div className="relative group shrink-0">
          <button 
            disabled={!stats.isVerified}
            onClick={() => router.push('/company/postings')}
            className={`px-8 py-4 rounded-2xl flex items-center gap-3 transition-all font-black text-xs uppercase tracking-widest shadow-lg ${
              stats.isVerified 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:-translate-y-0.5' 
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

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Roles', value: stats.activeRoles, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Applicants', value: stats.totalApplicants, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Pending Review', value: stats.pendingReview, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Interviews Scheduled', value: stats.interviewsScheduled, icon: Calendar, color: 'text-slate-700', bg: 'bg-slate-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{stat.label}</span>
              <div className={`size-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon size={18} />
              </div>
            </div>
            <div className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Applicant Feed */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Candidates</h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleAiShortlist} 
                disabled={isShortlisting}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Sparkles size={14} className={isShortlisting ? "animate-spin" : ""} /> {isShortlisting ? "Analyzing..." : "AI Shortlist"}
              </button>
              <button onClick={handleExport} className="px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm">
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {applications.map((app) => (
              <motion.div 
                key={app.application_id}
                onClick={() => setSelectedApplication(app)}
                layoutId={app.application_id}
                className={`p-6 bg-white border rounded-[2rem] transition-all cursor-pointer group hover:border-emerald-600/50 hover:shadow-xl ${selectedApplication?.application_id === app.application_id ? 'border-emerald-600 shadow-lg' : 'border-slate-100'}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="size-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-black uppercase shadow-lg group-hover:bg-emerald-600 transition-colors">
                      {app.student_name ? app.student_name.charAt(0) : '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{app.student_name}</h4>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-widest">{app.student_roll_no}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.role_title}</span>
                        <div className="size-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Applied {new Date(app.applied_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                            <Brain size={12} className="text-indigo-500" />
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">AI Match</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tighter">{app.match_score}%</div>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl border text-[9px] font-black uppercase tracking-[2px] ${statusColors[app.status]?.bg || 'bg-slate-50'} ${statusColors[app.status]?.border || 'border-slate-100'} ${statusColors[app.status]?.color || 'text-slate-500'}`}>
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
                  <h3 className="text-xl font-black text-slate-700 uppercase tracking-tighter">No Applicants Yet</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[3px] max-w-xs">
                    Post your first role to start receiving AI-matched candidate profiles.
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


        {/* AI Workspace Panel */}
        <div className="xl:col-span-4 space-y-8">
            <AnimatePresence mode="wait">
                {selectedApplication ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="bg-slate-950 rounded-[3rem] p-10 text-white border border-white/5 relative overflow-hidden h-fit shadow-2xl"
                    >
                        <div className="relative z-10 space-y-10">
                           <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <Sparkles size={14} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[4px]">AI Guide</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Candidate Assessment</h3>
                                </div>
                                <button onClick={() => setSelectedApplication(null)} className="size-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white"><XCircle size={18} /></button>
                           </div>

                           <div className="space-y-6">
                                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4">Technical Evaluation Questions</span>
                                    <div className="space-y-5">
                                        {(selectedApplication.ai_interview_guide || ["Describe your React experience.", "How do you optimize API calls?", "Explain your CSS strategy."]).map((q: string, i: number) => (
                                            <div key={i} className="flex gap-4 group">
                                                <span className="text-emerald-500 font-black text-xs leading-none">0{i+1}.</span>
                                                <p className="text-[11px] font-medium text-slate-400 group-hover:text-white transition-colors">{q}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button 
                                      onClick={() => (selectedApplication as any).resume_analysis?.resume_url ? window.open((selectedApplication as any).resume_analysis.resume_url, '_blank') : toast.error("Resume document not found")}
                                      className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[3px] text-white/70 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                      <Download size={14} /> View Resume
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                      onClick={() => handleStatusUpdate(selectedApplication.application_id, 'Interviewing')}
                                      className="flex-1 py-4 bg-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-[3px] shadow-lg shadow-emerald-900/40 hover:bg-emerald-700 transition-all active:scale-95"
                                    >
                                      Approve
                                    </button>
                                    <button 
                                      onClick={() => handleStatusUpdate(selectedApplication.application_id, 'Rejected')}
                                      className="size-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/50 hover:bg-red-900/40 hover:text-red-400 transition-all active:scale-95"
                                    >
                                      <XCircle size={20} />
                                    </button>
                                </div>
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
                                <TrendingUp size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Discovery</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px]">AI Recommended</p>
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
                                              title: "Internship Invitation", 
                                              message: `You have been invited to apply for ${talent.top_match?.role || 'a position'}` 
                                            })
                                          }),
                                          { loading: 'Sending invite...', success: 'Candidate Invited!', error: 'Service Unavailable' }
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
