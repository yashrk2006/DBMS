'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, Search, Filter, MapPin, Clock, DollarSign, 
  ChevronRight, Star, Globe, Target, Zap, Activity, 
  Sparkles, Brain, Cpu, ShieldCheck, Terminal, GraduationCap, X, 
  Calendar, FileText, Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Internship, Application } from '@/types';
import PremiumCard from '@/components/ui/PremiumCard';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { AI_ENGINE } from '@/lib/ai-engine';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useDBMS } from '@/context/DBMSContext';

export default function InternshipsPage() {
  const router = useRouter();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [now, setNow] = useState(Date.now());
  const [aiInterviewModal, setAiInterviewModal] = useState({
    open: false,
    title: '',
    questions: [] as string[],
    isLoading: false
  });
  const [cgpa, setCgpa] = useState<number>(0);
  const { addTrace } = useDBMS();

  const load = useCallback(async () => {
    setLoading(true);
    setNow(Date.now());
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      router.push('/auth/login');
      return;
    }
    
    try {
      const respStats = await fetch(`/api/dashboard/stats?userId=${userId}&t=${Date.now()}`, { cache: 'no-store' });
      const statsResult = await respStats.json();
      const currentSkills = statsResult.success ? statsResult.student.skills.map((s: any) => s.skill_name) : [];
      setMySkills(currentSkills);
      if (statsResult.student?.cgpa) {
        setCgpa(Number(statsResult.student.cgpa));
      }

      const respInternships = await fetch(`/api/internships?userId=${userId}&t=${Date.now()}`, { cache: 'no-store' });
      const internshipsResult = await respInternships.json();
      
      if (internshipsResult.success) {
        const mapped: Internship[] = internshipsResult.data.map((i: any) => {
          const requirements = i.requirements?.role_skills || [];
          const matched = requirements.filter((s: string) => currentSkills.includes(s)).length;
          const matchPercent = requirements.length > 0 ? Math.round((matched / requirements.length) * 100) : 0;
          
          const diagnosis = AI_ENGINE.getMatchDiagnosis(currentSkills, requirements);
          const probability = AI_ENGINE.calculateSuccessProbability(matchPercent, i.application?.[0]?.count || 0);

          return {
            id: i.id,
            internship_id: i.internship_id,
            title: i.title,
            company_name: i.company_name,
            description: i.description,
            duration: i.duration,
            stipend: i.stipend,
            location: i.location,
            company_id: i.company_id,
            required_skills: requirements,
            missing_skills: diagnosis.missing,
            match_percentage: matchPercent,
            applied: i.applied,
            min_cgpa: i.min_cgpa || 0,
            success_probability: probability,
            match_diagnosis: diagnosis
          };
        }).sort((a: Internship, b: Internship) => {
          const scoreA = a.match_percentage || 0;
          const scoreB = b.match_percentage || 0;
          return scoreB - scoreA;
        });
        
        setInternships(mapped);
      }
    } catch (err) {
      console.error('Failed to load internships:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const handleInterviewPrep = async (internship: Internship) => {
    setAiInterviewModal({ open: true, title: internship.title, questions: [], isLoading: true });
    
    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: mySkills, title: internship.title })
      });
      const data = await res.json();
      
      if (data.success) {
        setAiInterviewModal(prev => ({ ...prev, questions: data.questions, isLoading: false }));
        toast.success('AI Interview Generated.', { icon: '🤖' });
      } else {
        toast.error('AI Simulator Error: ' + data.error);
        setAiInterviewModal(prev => ({ ...prev, open: false, isLoading: false }));
      }
    } catch (e) {
      toast.error('Network error during AI Generation');
      setAiInterviewModal(prev => ({ ...prev, open: false, isLoading: false }));
    }
  };

  const evolutionData = useMemo(() => {
    if (internships.length === 0) return [];
    const skillMarketPresence: Record<string, number> = {};
    internships.forEach(i => {
      if (i.missing_skills) {
        i.missing_skills.forEach(skill => {
          skillMarketPresence[skill] = (skillMarketPresence[skill] || 0) + 1;
        });
      }
    });

    return Object.entries(skillMarketPresence)
      .map(([name, count]) => ({
        name,
        impact: Math.round((count / internships.length) * 100),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [internships]);

  async function handleApply(internship: Internship) {
    if (applying || internship.applied) return;

    // Eligibility Check
    const minRequired = internship.min_cgpa || 0;
    if (cgpa < minRequired) {
      toast.error(`Eligibility Error: This role requires a minimum CGPA of ${minRequired}. Your CGPA is ${cgpa}.`, { 
        icon: "🚫" 
      });
      return;
    }
    
    setApplying(internship.id);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      toast.error("Authentication required for application.");
      router.push('/auth/login');
      setApplying(null);
      return;
    }

    const toastId = toast.loading(`Syndicating application for ${internship.title}...`);

    try {
      const response = await fetch('/api/application-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: userId,
          internship_id: internship.internship_id
        })
      });
      const result = await response.json();
      
      if (result.success) {
        const pitch = result.data.ai_pitch ? `AI Pitch: "${result.data.ai_pitch.substring(0, 50)}..."` : `Match Score: ${internship.match_percentage}%`;
        toast.success(`Application Syndicated! ${pitch}`, { id: toastId, duration: 5000 });
        
        // DBMS TRACE: Job Application
        addTrace({
          operation: 'INSERT',
          table: 'application',
          description: `Create new application node for student internship request`,
          sql: `INSERT INTO application (student_id, internship_id, status, applied_at) \nVALUES ('${userId}', '${internship.internship_id}', 'pending', NOW());`
        });

        await load();
      } else {
        toast.error(result.error || 'Failed to syndicate application.', { id: toastId });
      }
    } catch (e) {
      console.error('Apply error:', e);
      toast.error('Intelligence sync failed. Please try again.', { id: toastId });
    } finally {
      setApplying(null);
    }
  }

  const filtered = internships.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    (i.company_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-10">
      <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="text-amber-600">
        <Globe size={80} className="fill-amber-600/10" />
      </motion.div>
      <div className="text-center">
         <h2 className="text-xs font-black uppercase tracking-[12px] text-amber-600 mb-4">Exploring Opportunities</h2>
         <p className="text-slate-500 text-[10px] font-black uppercase tracking-[6px] animate-pulse">Analyzing Skill Match & Market Compatibility</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-24">
      {/* 1. Header Section */}
      <div className="pb-8 border-b border-slate-200">
        <AnimatedSection direction="up" distance={40}>
          <div className="flex items-center gap-4 mb-4 md:mb-6">
             <div className="size-8 md:size-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                <Target size={16}  className="animate-pulse" />
             </div>
             <h2 className="text-[8px] md:text-[10px] font-black uppercase tracking-[4px] md:tracking-[8px] text-slate-500">Career Portal — Internship Search</h2>
          </div>
          <h1 className="text-3xl md:text-7xl font-black text-slate-950 tracking-tight uppercase leading-[1.1] md:leading-[0.9] mb-4 md:mb-6">
            Internship<br />
            <span className="text-amber-600">Listings.</span>
          </h1>
          <div className="flex items-center gap-3 text-slate-400">
             <div className="size-1.5 rounded-full bg-amber-500/30" />
             <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[2px] md:tracking-[3px]">Real-time synchronization with active career opportunities</span>
          </div>
        </AnimatedSection>
      </div>

      {/* 2. Predictive Analytics */}
      {evolutionData.length > 0 && (
        <AnimatedSection direction="up" delay={0.2}>
          <div className="bg-slate-950 rounded-[2rem] md:rounded-[2.5rem] p-6 lg:p-8 relative overflow-hidden group/evolution border border-white/5 shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/evolution:scale-110 transition-transform duration-700">
              <Activity size={80} className="text-amber-500" />
            </div>
            <div className="relative z-10 flex flex-col lg:flex-row gap-6 md:gap-8 items-center justify-between">
              <div className="w-full lg:max-w-md space-y-2 md:space-y-3">
                <div className="flex items-center gap-3">
                  <Zap size={14} className="text-amber-500 fill-amber-500" />
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-[4px]">Predictive Analytics</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">Skill Evolution Predictor.</h3>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[1.5px] leading-relaxed">
                  Market trend analysis: acquiring these skills will maximize your matching probability.
                </p>
              </div>
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {evolutionData.map((skill, idx) => (
                  <div key={skill.name} className="bg-white/5 border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all group/item">
                    <div className="flex justify-between items-center mb-2 md:mb-3">
                      <span className="text-[10px] md:text-[12px] font-black text-white uppercase tracking-tight">{skill.name}</span>
                      <span className="text-[8px] md:text-[9px] font-black text-amber-500/60">+{skill.impact}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${skill.impact}%` }} transition={{ duration: 1, delay: 0.4 + (idx * 0.1) }} className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* 3. Isolated Search Bar */}
      <AnimatedSection direction="up" className="relative w-full group z-20" delay={0.3}>
        <div className="absolute inset-0 bg-amber-500/5 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <div className="relative">
          <input
            id="internship-search"
            type="text"
            placeholder="SEARCH BY ROLE OR COMPANY..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-14 md:h-20 pl-14 md:pl-16 pr-6 md:pr-8 rounded-xl md:rounded-[2rem] border border-slate-200 bg-white text-[9px] md:text-[12px] font-black uppercase tracking-[2px] md:tracking-[3px] text-slate-900 placeholder:text-slate-300 transition-all focus:border-amber-500/30 focus:shadow-2xl focus:shadow-amber-500/5 shadow-sm active:scale-[0.99] relative z-20"
          />
          <Search size={18}  className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors z-30" />
        </div>
      </AnimatedSection>

      {filtered.length === 0 ? (
        <AnimatedSection direction="up" className="flex flex-col items-center justify-center py-24 gap-8">
           <div className="size-24 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
              <Search size={40} />
           </div>
           <div className="text-center space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">No Opportunities Found</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px]">We couldn't find matches for &quot;{search}&quot;</p>
           </div>
           <button 
             onClick={() => { setSearch(''); load(); }}
             className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[4px] hover:bg-amber-600 transition-all shadow-xl active:scale-95"
           >
              Reset Search Grid
           </button>
        </AnimatedSection>
      ) : (
          <div className="space-y-12">
            <AnimatePresence mode="popLayout">
              {filtered.map((i, index) => (
                <AnimatedSection key={i.id} delay={index * 0.05} direction="up">
                  <div className="group relative bg-white rounded-[2.5rem] border border-slate-100 hover:border-amber-200 transition-all duration-700 overflow-hidden flex flex-col lg:flex-row shadow-sm hover:shadow-xl">
                    <div className={`p-5 md:p-12 lg:w-72 flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-4 md:gap-8 text-center transition-all duration-700 relative border-b lg:border-b-0 lg:border-r border-slate-100 ${
                      (i.match_percentage || 0) >= 80 ? "bg-amber-600/[0.03]" : (i.match_percentage || 0) >= 50 ? "bg-amber-500/[0.03]" : "bg-slate-50"
                    }`}>
                      <div className="relative group/score scale-[0.6] sm:scale-75 md:scale-100 lg:scale-110 -my-4 sm:my-0 shrink-0">
                         <div className="absolute -inset-4 bg-amber-600/5 blur-2xl rounded-full opacity-0 group-hover/score:opacity-100 transition-opacity duration-700" />
                         <svg className="size-24 md:size-32 transform -rotate-90 relative z-10">
                           <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-slate-100" />
                           <motion.circle
                             cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent"
                             strokeDasharray={364.4}
                             initial={{ strokeDashoffset: 364.4 }}
                             whileInView={{ strokeDashoffset: 364.4 - (364.4 * (i.match_percentage || 0)) / 100 }}
                             transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                             className={(i.match_percentage || 0) >= 80 ? "text-amber-600" : (i.match_percentage || 0) >= 50 ? "text-amber-500" : "text-slate-300"}
                           />
                         </svg>
                         <div className="absolute inset-0 flex flex-col items-center justify-center group-hover/score:scale-110 transition-transform duration-500 z-20">
                           <span className="text-4xl font-black text-slate-900 tracking-tighter">{i.match_percentage}<span className="text-lg opacity-30">%</span></span>
                           <span className="text-[8px] font-black uppercase tracking-[3px] text-slate-400">Match</span>
                         </div>
                      </div>
                      <div className="space-y-2 md:space-y-4 text-right lg:text-center">
                         <div className="flex flex-col items-end lg:items-center gap-0.5 md:gap-1">
                            <span className="text-[7px] md:text-[10px] font-black uppercase tracking-[2px] md:tracking-[5px] text-slate-400">Selection Chance</span>
                            <div className={`px-3 md:px-4 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[2px] md:tracking-[3px] border ${
                               (i.success_probability || 0) >= 70 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : (i.success_probability || 0) >= 40 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100"
                            }`}>
                               {i.success_probability || 0}% Probability
                            </div>
                         </div>
                         <div className={`text-[8px] md:text-[10px] font-black uppercase tracking-[2px] md:tracking-[3px] px-3 md:px-5 py-1.5 md:py-2 rounded-xl md:rounded-2xl border border-slate-100 bg-white shadow-sm inline-block ${
                           (i.match_percentage || 0) >= 80 ? "text-amber-600" : (i.match_percentage || 0) >= 50 ? "text-amber-500" : "text-slate-400"
                         }`}>
                           {(i.match_percentage || 0) >= 80 ? 'Perfect Match' : (i.match_percentage || 0) >= 50 ? 'High Alignment' : 'Profile Review'}
                         </div>
                      </div>
                    </div>

                    <div className="flex-1 p-5 md:p-12 flex flex-col justify-between relative">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-12 mb-6 md:mb-12">
                         <div className="space-y-4 md:space-y-6">
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-amber-600 transition-colors leading-[0.8]">
                                      {i.title}
                                  </h3>
                                  {i.applied && (
                                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 shadow-sm w-fit">
                                          <ShieldCheck size={12} className="animate-pulse" />
                                          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[2px]">Applied</span>
                                      </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="size-1 rounded-full bg-amber-500/30" />
                                    <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[2px] md:tracking-[3px] text-slate-400">{i.company_name}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:flex md:flex-wrap gap-x-6 md:gap-x-10 gap-y-4 md:gap-y-6">
                               <div className="flex items-center gap-3 group/item">
                                  <div className="size-8 md:size-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:text-amber-600 shadow-inner group-hover/item:border-amber-200 transition-all duration-500"><Globe size={14}  /></div>
                                  <div className="flex flex-col">
                                     <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[2px] text-slate-300">Location</span>
                                     <span className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-[1px] md:tracking-[2px] truncate max-w-[80px] md:max-w-none">{i.location}</span>
                                  </div>
                               </div>
                               <div className="flex items-center gap-3 group/item">
                                  <div className="size-8 md:size-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:text-amber-600 shadow-inner group-hover/item:border-amber-200 transition-all duration-500"><Calendar size={14}  /></div>
                                  <div className="flex flex-col">
                                     <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[2px] text-slate-300">Duration</span>
                                     <span className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-[1px] md:tracking-[2px]">{i.duration}</span>
                                  </div>
                               </div>
                               <div className="flex items-center gap-3 group/item">
                                  <div className="size-8 md:size-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:text-amber-600 shadow-inner group-hover/item:border-amber-200 transition-all duration-500"><DollarSign size={14}  /></div>
                                  <div className="flex flex-col">
                                     <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[2px] text-slate-300">Stipend</span>
                                     <span className="text-[9px] md:text-[11px] font-black text-amber-600 uppercase tracking-[1px] md:tracking-[2px]">{i.stipend}</span>
                                  </div>
                               </div>
                               <div className="flex items-center gap-3 group/item">
                                  <div className="size-8 md:size-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:text-indigo-600 shadow-inner group-hover/item:border-indigo-200 transition-all duration-500"><GraduationCap size={14}  /></div>
                                  <div className="flex flex-col">
                                     <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[2px] text-slate-300">Requirement</span>
                                     <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-[1px] md:tracking-[2px] ${cgpa < (i.min_cgpa || 0) ? 'text-rose-600' : 'text-indigo-600'}`}>{i.min_cgpa || '0.0'}+ CGPA</span>
                                  </div>
                               </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                  onClick={() => handleInterviewPrep(i)}
                                  className="px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-[8px] md:text-[9px] font-black uppercase tracking-[2px] md:tracking-[3px] flex items-center gap-2 hover:bg-indigo-100 transition-all shadow-sm"
                                >
                                  <Sparkles size={12}  />
                                  Interview Prep
                                </button>
                             </div>
                         </div>
                         <motion.button
                           whileHover={i.applied || cgpa < (i.min_cgpa || 0) ? {} : { scale: 1.05, boxShadow: "0 20px 40px rgba(217,119,6,0.15)" }} whileTap={i.applied || cgpa < (i.min_cgpa || 0) ? {} : { scale: 0.95 }}
                           onClick={() => handleApply(i)}
                           disabled={i.applied || applying === i.id || cgpa < (i.min_cgpa || 0)}
                           className={`w-full md:w-auto px-8 md:px-12 py-4 md:py-6 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-[3px] md:tracking-[5px] shadow-lg transition-all relative overflow-hidden group/btn border border-slate-200 flex items-center justify-center gap-3 md:gap-5 ${
                             i.applied ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : 
                             cgpa < (i.min_cgpa || 0) ? "bg-slate-900 text-slate-400 border-slate-800 cursor-not-allowed" :
                             "bg-amber-600 text-white hover:bg-amber-500 border-amber-500"
                           }`}
                         >
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            {applying === i.id ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}><Cpu size={16}  /></motion.div> : i.applied ? <ShieldCheck size={16}  /> : cgpa < (i.min_cgpa || 0) ? <ShieldCheck size={16}  className="opacity-20" /> : <Zap size={16}  className="fill-white" />}
                            <span className="relative z-10">{applying === i.id ? 'Processing...' : i.applied ? 'Applied' : cgpa < (i.min_cgpa || 0) ? 'Low CGPA' : 'Apply Now'}</span>
                         </motion.button>
                      </div>

                      <div className="relative group/desc mb-6 md:mb-12">
                          <p className="text-[10px] md:text-[12px] font-medium text-slate-500 uppercase tracking-[1px] md:tracking-[2px] leading-relaxed border-l-2 border-amber-500/10 pl-6 md:pl-8 max-w-2xl transition-all duration-500">&quot;{i.description}&quot;</p>
                      </div>

                      <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-4">
                         <div className="flex items-center gap-3 pr-8 md:border-r border-slate-100 shrink-0">
                            <Terminal size={12}  className="text-amber-600/40" />
                            <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[3px] md:tracking-[5px]">Core Skills</span>
                         </div>
                         <div className="flex flex-wrap gap-1.5 md:gap-3">
                           {(i.required_skills || []).map((rs) => (
                             <span key={rs} className={`px-3 md:px-5 py-1 md:py-2.5 rounded-lg md:rounded-2xl text-[7px] md:text-[10px] font-black uppercase tracking-[2px] md:tracking-[4px] border transition-all antialiased ${
                                mySkills.includes(rs) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-100'
                             }`}>{mySkills.includes(rs) ? '✓ ' : ''}{rs}</span>
                           ))}
                         </div>
                      </div>
                    </div>
                  </div>

                  {i.missing_skills && i.missing_skills.length > 0 && (
                    <div className="mt-6 p-5 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-start gap-4">
                      <div className="size-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5"><Activity size={15} className="text-amber-600" /></div>
                      <div className="flex-1">
                        <div className="text-[10px] font-black text-amber-700 uppercase tracking-[4px] mb-1">Career Gap Analysis</div>
                        <p className="text-[11px] font-medium text-amber-800/70 mb-3">Add <span className="font-black text-amber-700">{i.missing_skills.length} skill{i.missing_skills.length > 1 ? 's' : ''}</span> to your profile.</p>
                        <div className="flex flex-wrap gap-2">
                          {i.missing_skills.map(skill => <span key={skill} className="px-3 py-1 rounded-lg bg-white border border-amber-200 text-[10px] font-black text-amber-700 uppercase tracking-[3px] shadow-sm">+ {skill}</span>)}
                        </div>
                      </div>
                    </div>
                  )}
                </AnimatedSection>
              ))}
            </AnimatePresence>
          </div>
      )}

      {/* Interview Prep Modal */}
      <AnimatePresence>
        {aiInterviewModal.open && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl"
           >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-[1.5rem] md:rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100"
              >
                  <div className="bg-slate-950 p-6 md:p-10 text-white relative">
                      <div className="absolute top-0 right-0 p-8 opacity-10"><Brain size={120} /></div>
                      <div className="relative z-10 space-y-4">
                          <div className="flex items-center gap-3">
                              <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[3px] md:tracking-[5px] text-emerald-500">AI Interview Simulator</span>
                          </div>
                          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-none">{aiInterviewModal.title}</h2>
                          <p className="text-[9px] md:text-xs font-medium text-slate-400 uppercase tracking-[1px] md:tracking-[2px]">Analyzing opportunities based on your professional profile.</p>
                      </div>
                      <button 
                        onClick={() => setAiInterviewModal(prev => ({ ...prev, open: false }))}
                        className="absolute top-6 right-6 md:top-10 md:right-10 size-10 md:size-12 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                      >
                        <X size={18}  />
                      </button>
                  </div>
                  
                  <div className="p-6 md:p-10 space-y-6 md:space-y-8">
                      {aiInterviewModal.isLoading ? (
                        <div className="py-12 md:py-20 flex flex-col items-center justify-center gap-4 md:gap-6">
                           <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="text-amber-600">
                              <Cpu size={32} /> // Refined Size Protocol
                           </motion.div>
                           <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[3px] md:tracking-[4px] text-slate-400 animate-pulse">Generating Behavioral Scenarios...</span>
                        </div>
                      ) : (
                        <div className="space-y-4 md:space-y-6">
                           {aiInterviewModal.questions.map((q, i) => (
                             <motion.div 
                               initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                               key={i} className="flex gap-4 md:gap-6 group"
                             >
                                <span className="text-lg md:text-xl font-black text-amber-600/30 group-hover:text-amber-600 transition-colors shrink-0">0{i+1}</span>
                                <p className="text-[12px] md:text-sm font-bold text-slate-600 leading-relaxed pt-1">{q}</p>
                             </motion.div>
                           ))}
                        </div>
                      )}
                      
                      <button 
                        onClick={() => setAiInterviewModal(prev => ({ ...prev, open: false }))}
                        className="w-full py-4 md:py-6 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[3px] md:tracking-[4px] hover:bg-emerald-600 transition-all shadow-xl"
                      >
                        Acknowledge Protocol
                      </button>
                  </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
