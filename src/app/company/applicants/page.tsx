'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, CheckCircle2, XCircle, FileText, ChevronRight, MessageSquare, 
  Clock, Search, AlertCircle, BarChart3, Cpu, Sparkles, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AI_ENGINE } from '@/lib/ai-engine';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

type Status = 'All' | 'Pending' | 'Under Review' | 'Interviewing' | 'Accepted' | 'Rejected';

const statusStyles: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  'Pending':      { color: 'text-slate-500',   bg: 'bg-slate-50',    border: 'border-slate-100',   icon: Clock         },
  'Under Review': { color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-100',   icon: Search        },
  'Interviewing': { color: 'text-indigo-600',  bg: 'bg-indigo-50',   border: 'border-indigo-100',  icon: MessageSquare },
  'Accepted':     { color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-100', icon: CheckCircle2  },
  'Rejected':     { color: 'text-red-500',     bg: 'bg-red-50',      border: 'border-red-100',     icon: AlertCircle   },
};

const TABS: Status[] = ['All', 'Pending', 'Under Review', 'Interviewing', 'Accepted', 'Rejected'];

interface Candidate {
  application_id: string;
  status: Status;
  applied_date: string;
  match_score?: number;
  ai_interview_questions?: string[];
  student: {
    name: string;
    email: string;
    college: string;
    branch: string;
    graduation_year: number | string;
    roll_no?: string;
    skills?: { skill_name: string; proficiency: string }[];
  } | null;
  internship: {
    title: string;
    company_id: string;
    requirements?: { role_skills: string[] };
  } | null;
  simulation_result?: {
    score: number;
    notes: string;
    timestamp: number;
  };
}

export default function ReviewCandidates() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Status>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState<number>(0);
  const [aiAssessments, setAiAssessments] = useState<Record<string, string[]>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleGenerateAssessment = async (candidate: Candidate) => {
    setGeneratingId(candidate.application_id);
    const candidateSkills = candidate.student?.skills?.map(s => s.skill_name) || [];
    const roleTitle = candidate.internship?.title || 'this position';
    
    try {
      const response = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: candidateSkills,
          title: roleTitle,
          scope: 'COMPANY_ASSESSMENT'
        })
      });

      const result = await response.json();
      if (result.success && result.questions) {
        const challenges = result.questions;
        setAiAssessments(prev => ({
          ...prev,
          [candidate.application_id]: challenges
        }));
        
        setCandidates(prev => prev.map(c => 
          c.application_id === candidate.application_id 
            ? { ...c, ai_interview_questions: challenges } 
            : c
        ));
        toast.success('Technical Assessment Generated', { icon: '⚙️' });
      } else {
        throw new Error(result.error || 'Failed to generate assessment');
      }
    } catch (err) {
      console.error('AI Assessment failed:', err);
      toast.error('Failed to connect to Intelligence Engine');
    } finally {
      setGeneratingId(null);
    }
  };

  useEffect(() => {
    setNow(Date.now());
    async function fetchCandidates() {
      const { data: { session } } = await supabase.auth.getSession();
      const storedId = session?.user?.id;
      
      if (!storedId) {
        setLoading(false);
        router.push('/auth/login');
        return;
      }

      try {
        const response = await fetch(`/api/company/applications?company_id=${storedId}`);
        const result = await response.json();
        if (result.success && result.data) {
          // Merge simulation results from localStorage
          const augmented = result.data.map((c: Candidate) => {
            const stored = localStorage.getItem(`interview_results_${c.application_id}`);
            if (stored) {
              return { ...c, simulation_result: JSON.parse(stored) };
            }
            return c;
          });
          setCandidates(augmented);
        }
      } catch (err) {
        console.error('Failed to load candidates:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCandidates();
  }, [router]);

  const updateStatus = async (applicationId: string, newStatus: string) => {
    setUpdatingId(applicationId);
    try {
      const response = await fetch('/api/company/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, status: newStatus })
      });
      const result = await response.json();
      
      if (result.success) {
        setCandidates(prev => prev.map(c =>
          c.application_id === applicationId ? { ...c, status: newStatus as Status } : c
        ));
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = {
    All: candidates.length,
    'Pending': candidates.filter(c => c.status === 'Pending').length,
    'Under Review': candidates.filter(c => c.status === 'Under Review').length,
    'Interviewing': candidates.filter(c => c.status === 'Interviewing').length,
    'Accepted': candidates.filter(c => c.status === 'Accepted').length,
    'Rejected': candidates.filter(c => c.status === 'Rejected').length,
  };

  const filtered = candidates.filter(c => {
    const statusMatch = activeTab === 'All' || c.status === activeTab;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return statusMatch;

    const nameMatch = c.student?.name?.toLowerCase().includes(query);
    const emailMatch = c.student?.email?.toLowerCase().includes(query);
    const rollMatch = c.student?.roll_no?.toLowerCase().includes(query);
    const titleMatch = c.internship?.title?.toLowerCase().includes(query);
    const skillMatch = c.student?.skills?.some(s => s.skill_name.toLowerCase().includes(query));

    return statusMatch && (nameMatch || emailMatch || rollMatch || titleMatch || skillMatch);
  });
  const acceptRate = candidates.length > 0 ? Math.round((counts['Accepted'] / candidates.length) * 100) : 0;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Candidate Pipeline</h1>
          <p className="text-slate-500 font-medium mt-1">
            {candidates.length} total applicants · <span className="text-emerald-600 font-black">{acceptRate}%</span> acceptance rate
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative group w-full md:w-80">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
            <input 
              type="text"
              placeholder="SEARCH CANDIDATES OR SKILLS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 transition-all outline-none placeholder:text-slate-300 shadow-sm"
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-white border border-slate-100 text-slate-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[2px] shadow-sm">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            Live Pipeline
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
        {(['Pending', 'Under Review', 'Interviewing', 'Accepted', 'Rejected'] as Status[]).map(s => {
          const style = statusStyles[s] || statusStyles['Pending'];
          const Icon = style.icon;
          return (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`p-4 rounded-2xl border text-left transition-all hover:shadow-md ${
                activeTab === s ? `${style.bg} ${style.border} shadow-sm` : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className={`size-7 rounded-lg mb-3 flex items-center justify-center ${style.bg} border ${style.border} ${style.color}`}>
                <Icon size={13} />
              </div>
              <div className={`text-2xl font-black tracking-tighter ${activeTab === s ? style.color : 'text-slate-700'}`}>{counts[s]}</div>
              <div className="text-[9px] font-black uppercase tracking-[2px] text-slate-400 mt-0.5">{s}</div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[3px] border transition-all ${
              activeTab === tab
                ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                : 'bg-white text-slate-500 border-slate-200 hover:border-amber-200'
            }`}
          >
            {tab} {tab !== 'All' && counts[tab] > 0 && <span className="ml-1 opacity-70">({counts[tab]})</span>}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="size-6 rounded-full border-4 border-amber-600/30 border-t-amber-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-20 flex flex-col items-center gap-4">
            <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 border border-slate-100">
              <Users size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-700 uppercase tracking-tight mb-1">No {activeTab} Candidates</h3>
              <p className="text-slate-400 text-sm">Try switching to a different status tab.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/60 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                  <th className="px-7 py-5">Candidate</th>
                  <th className="px-7 py-5">Applied For</th>
                  <th className="px-7 py-5">AI Match</th>
                  <th className="px-7 py-5">Simulation</th>
                  <th className="px-7 py-5">Status</th>
                  <th className="px-7 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {filtered.map((c) => {
                    const matchScore = c.match_score || 0;
                    const isTopMatch = matchScore >= 85;
                    const isExpanded = expandedId === c.application_id;
                    const status = statusStyles[c.status] || statusStyles['Pending'];
                    const StatusIcon = status.icon;
                    const daysAgo = now ? Math.floor((now - new Date(c.applied_date).getTime()) / 86400000) : 0;

                    return (
                      <motion.tr
                        key={c.application_id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={`group transition-colors cursor-pointer ${
                          isTopMatch ? 'bg-amber-50/20 hover:bg-amber-50/50' : 'hover:bg-slate-50/30'
                        }`}
                        onClick={() => setExpandedId(isExpanded ? null : c.application_id)}
                      >
                        <td className="px-7 py-5 align-middle">
                          <div className="flex items-center gap-4">
                            <div className={`size-10 rounded-xl flex items-center justify-center font-black uppercase text-sm shrink-0 ${
                              isTopMatch ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-200' : 'bg-indigo-50 text-indigo-600'
                            }`}>
                              {c.student?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 text-sm">{c.student?.name || 'Unknown'}</span>
                                {isTopMatch && (
                                  <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-black uppercase tracking-widest">
                                    ⭐ Top Pick
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">{c.student?.email}</div>
                              <div className="text-[10px] text-slate-400">ID: {c.student?.roll_no || 'N/A'} · {c.student?.college}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-7 py-5 align-middle">
                          <div className="font-bold text-slate-900 text-sm line-clamp-1 mb-0.5">{c.internship?.title}</div>
                          <div className="text-[10px] text-slate-400">{daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`}</div>
                        </td>

                        <td className="px-7 py-5 align-middle">
                          <div className="flex items-center gap-3 w-28">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${matchScore >= 85 ? 'bg-emerald-500' : matchScore > 70 ? 'bg-amber-400' : 'bg-slate-300'}`}
                                style={{ width: `${matchScore}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-black w-10 text-right ${matchScore >= 85 ? 'text-emerald-600' : matchScore > 70 ? 'text-amber-600' : 'text-slate-400'}`}>
                              {matchScore}%
                            </span>
                          </div>
                        </td>

                        <td className="px-7 py-5 align-middle">
                          {c.simulation_result ? (
                             <div className="flex items-center gap-2 group/sim">
                                <div className="size-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover/sim:bg-indigo-600 group-hover/sim:text-white transition-colors">
                                   <Zap size={10} fill="currentColor" />
                                </div>
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{c.simulation_result.score}% Ready</span>
                             </div>
                          ) : (
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Pending Practice</span>
                          )}
                        </td>

                        <td className="px-7 py-5 align-middle">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${status.bg} ${status.border} ${status.color}`}>
                            <StatusIcon size={10} />
                            {c.status}
                          </span>
                        </td>

                        <td className="px-7 py-5 align-middle" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            {updatingId === c.application_id ? (
                              <div className="size-8 rounded-full border-2 border-amber-600/30 border-t-amber-600 animate-spin" />
                            ) : (
                              <>
                                {!['Interviewing', 'Accepted', 'Rejected'].includes(c.status) && (
                                  <button
                                    onClick={() => updateStatus(c.application_id, 'Interviewing')}
                                    title="Move to Interview"
                                    className="size-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 active:scale-95 transition-all shadow-sm"
                                  >
                                    <MessageSquare size={15} />
                                  </button>
                                )}
                                <button
                                  onClick={() => updateStatus(c.application_id, 'Accepted')}
                                  title="Accept Candidate"
                                  className="size-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 active:scale-95 transition-all shadow-sm"
                                >
                                  <CheckCircle2 size={15} />
                                </button>
                                <button
                                  onClick={() => updateStatus(c.application_id, 'Rejected')}
                                  title="Reject Candidate"
                                  className="size-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-red-600 hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all shadow-sm"
                                >
                                  <XCircle size={15} />
                                </button>
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : c.application_id)}
                                  title="View Profile Details"
                                  className="size-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 active:scale-95 transition-all shadow-sm"
                                >
                                  <ChevronRight size={15} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {filtered.map(c => {
              const matchScore = c.match_score || 0;
              return expandedId === c.application_id && (
                <motion.div
                  key={`detail-${c.application_id}`}
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="border-t border-amber-100 bg-amber-50/30 px-8 py-10"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left: Basic Info */}
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black uppercase tracking-[4px] text-amber-600">Candidate Profile</h4>
                       <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-black uppercase tracking-[3px] text-slate-400">Branch & College</span>
                            <span className="font-bold text-slate-700 text-sm">{c.student?.branch || '—'} · {c.student?.college || '—'}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-black uppercase tracking-[3px] text-slate-400">Email Address</span>
                            <a href={`mailto:${c.student?.email}`} className="font-bold text-amber-600 text-sm hover:underline">{c.student?.email || '—'}</a>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[8px] font-black uppercase tracking-[3px] text-slate-400">Applied For</span>
                            <span className="font-bold text-slate-700 text-sm">{c.internship?.title || '—'}</span>
                          </div>
                       </div>

                       <div className="pt-4">
                          <h5 className="text-[8px] font-black uppercase tracking-[3px] text-slate-400 mb-3">Professional Skills</h5>
                          <div className="flex flex-wrap gap-2">
                             {c.student?.skills?.map((s, idx) => (
                               <span key={idx} className="px-3 py-1 rounded-lg bg-white border border-slate-100 text-[10px] font-bold text-slate-600">
                                 {s.skill_name}
                               </span>
                             ))}
                          </div>
                       </div>
                    </div>

                    {/* Middle & Right: AI Interview Engine */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-slate-900 rounded-[2rem] p-8 border border-white/5 relative overflow-hidden group/assessment shadow-2xl">
                           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/assessment:scale-110 transition-transform duration-700">
                              <Cpu size={100} className="text-amber-500" />
                           </div>
                           
                           <div className="relative z-10 space-y-8">
                              <div className="flex items-center justify-between">
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                       <Sparkles size={12} className="text-amber-500" />
                                       <span className="text-[9px] font-black text-amber-500 uppercase tracking-[4px]">AI Match Intelligence</span>
                                    </div>
                                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Competency Matrix</h4>
                                 </div>
                                 <div className="text-right">
                                    <div className="text-3xl font-black text-white tracking-tighter">{matchScore}%</div>
                                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-[2px]">Industrial Alignment</div>
                                 </div>
                              </div>

                              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                 <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${matchScore}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                    className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200"
                                 />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[2px]">Core Strengths</span>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[1px] leading-relaxed italic">
                                       Demonstrates high proficiency in {c.student?.skills?.slice(0, 2).map((s: any) => s.skill_name).join(', ') || 'technical fundamentals'}.
                                    </p>
                                 </div>
                                 <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-[2px]">Growth Vector</span>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[1px] leading-relaxed">
                                       Optimized for active integration into {c.internship?.title || 'this role'}.
                                    </p>
                                 </div>
                              </div>
                           </div>
                                       <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
                               <div className="flex items-center justify-between mb-8">
                                  <div className="flex items-center gap-3">
                                     <div className="size-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                                        <MessageSquare size={14} />
                                     </div>
                                     <h4 className="text-[11px] font-black uppercase tracking-[3px] text-slate-900">Targeted Technical Interrogation</h4>
                                  </div>
                                  <button 
                                    onClick={() => handleGenerateAssessment(c)}
                                    disabled={generatingId === c.application_id}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[2px] shadow-lg transition-all flex items-center gap-2 ${
                                      generatingId === c.application_id 
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                        : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-amber-600'
                                    }`}
                                  >
                                     {generatingId === c.application_id ? (
                                        <>
                                          <div className="size-3 rounded-full border-2 border-amber-600/30 border-t-amber-600 animate-spin" />
                                          Scanning Core...
                                        </>
                                     ) : (
                                        <>
                                          <Sparkles size={10} />
                                          Refresh AI Queries
                                        </>
                                     )}
                                  </button>
                               </div>

                           <div className="space-y-4">
                              {c.ai_interview_questions?.map((q: string, idx: number) => (
                                <div key={idx} className="flex gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-all group/q">
                                   <div className="text-amber-600 font-black text-xs pt-0.5">0{idx + 1}</div>
                                   <p className="text-slate-700 text-[13px] font-bold uppercase tracking-tight leading-relaxed">{q}</p>
                                 </div>
                              ))}
                              {(!c.ai_interview_questions || c.ai_interview_questions.length === 0) && (
                                <div className="text-center py-10 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                   Intelligence Engine identifying strategic screening queries...
                                </div>
                              )}
                           </div>
                        </div>

                        {/* --- NEW: SIMULATION PERFORMANCE REPORT --- */}
                        {c.simulation_result && (
                           <motion.div 
                             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                             className="p-8 rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20 relative overflow-hidden"
                           >
                              <div className="absolute top-0 right-0 p-8 opacity-10">
                                 <Zap size={80} />
                              </div>
                              <div className="relative z-10 space-y-6">
                                 <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                       <BarChart3 size={18} />
                                    </div>
                                    <div>
                                       <h4 className="text-[11px] font-black uppercase tracking-[3px]">AI Simulation Performance Ready</h4>
                                       <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Verified {new Date(c.simulation_result.timestamp).toLocaleDateString()}</p>
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div className="space-y-4">
                                       <div className="flex items-end gap-2">
                                          <div className="text-6xl font-black tracking-tighter leading-none">{c.simulation_result.score}%</div>
                                          <div className="text-[10px] font-black uppercase tracking-[2px] mb-2 text-white/70">Readiness Score</div>
                                       </div>
                                       <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                          <div className="h-full bg-white rounded-full" style={{ width: `${c.simulation_result.score}%` }} />
                                       </div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-white/10 border border-white/5 backdrop-blur-sm">
                                       <h5 className="text-[9px] font-black uppercase tracking-[2px] mb-3 text-amber-400">AI Growth Vector Transcript</h5>
                                       <p className="text-xs font-bold leading-relaxed tracking-tight italic opacity-90">
                                          &quot;{c.simulation_result.notes}&quot;
                                       </p>
                                    </div>
                                 </div>
                              </div>
                           </motion.div>
                        )}
          </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
