'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Award, Brain, Activity, TrendingUp, Cpu, Gauge, Rocket, Briefcase, Zap } from 'lucide-react';

interface AIReadinessWidgetProps {
  score: number; // 0-100
  recentScores?: number[];
  topSkills?: string[];
  lastUpdate?: string;
  applicationStatus?: { active: number, total: number };
  latestOpportunity?: { title: string, company: string };
  onViewDetail?: () => void;
}

export function CareerSummaryWidget({ 
  score = 0, 
  recentScores = [65, 78, 85, 92], 
  topSkills = ['Project Design', 'Technical Writing', 'Team Collaboration'],
  lastUpdate = 'Just Now',
  applicationStatus = { active: 3, total: 5 },
  latestOpportunity = { title: 'Junior Software Engineer', company: 'SkillSync Partner' },
  onViewDetail
}: AIReadinessWidgetProps) {
  
  const getStatusColor = (s: number) => {
    if (s >= 90) return 'text-emerald-500';
    if (s >= 75) return 'text-indigo-500';
    return 'text-amber-500';
  };

  const getStatusBg = (s: number) => {
    if (s >= 90) return 'bg-emerald-500/10 border-emerald-500/20';
    if (s >= 75) return 'bg-indigo-500/10 border-indigo-500/20';
    return 'bg-amber-500/10 border-amber-500/20';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }} animate={{ opacity: 1, scale: 1 }}
      onClick={onViewDetail}
      className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden group h-full cursor-pointer transition-all active:scale-[0.98]"
    >
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(#575a93_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
        <Award size={120} className="text-indigo-600" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                 <Brain size={20} />
              </div>
              <div className="space-y-0.5">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Career Summary</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Career Readiness Score</p>
              </div>
           </div>
           <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusBg(score)} ${getStatusColor(score)}`}>
              {score >= 90 ? 'Excellent' : score >= 75 ? 'Career Ready' : 'Processing'}
           </div>
        </div>

        {/* Middle Layout for Application Status & Latest Job */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-2">
            <div className="flex flex-col justify-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group/item hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                    <div className="size-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                        <Rocket size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Active Applications</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time Status</p>
                    </div>
                </div>
                <div className="flex items-end justify-between">
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{applicationStatus.active}<span className="text-lg text-slate-300 ml-1">/ {applicationStatus.total}</span></span>
                    <div className="text-[9px] font-black text-indigo-600 bg-white px-3 py-1.5 rounded-xl border border-indigo-50 shadow-sm">
                        {Math.round((applicationStatus.active / Math.max(1, applicationStatus.total)) * 100)}% Progress
                    </div>
                </div>
            </div>

            <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden group/opportunity flex flex-col justify-center">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/opportunity:scale-125 transition-transform">
                    <Briefcase size={60} className="text-white" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap size={14} className="text-amber-400 fill-amber-400" />
                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-[3px]">Latest Posting</span>
                    </div>
                    <h4 className="text-sm font-black text-white leading-tight mb-1">{latestOpportunity.title}</h4>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{latestOpportunity.company}</p>
                    
                    <div className="mt-4 flex justify-between items-center">
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">In Review</span>
                        <div className="flex gap-1">
                             <div className="w-2.5 h-0.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                             <div className="w-2.5 h-0.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                             <div className="w-2.5 h-0.5 bg-amber-400 rounded-full animate-bounce" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Central Progress Gauge & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center pt-4 border-t border-slate-50">
           {/* Gauge */}
           <div className="flex flex-col items-center">
              <div className="relative">
                 <svg className="size-36 transform -rotate-90 relative z-10">
                   <circle
                      cx="72" cy="72" r="64"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-slate-50"
                   />
                   <motion.circle
                      cx="72" cy="72" r="64"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="402.12"
                      initial={{ strokeDashoffset: 402 }}
                      animate={{ strokeDashoffset: 402 - (402 * score) / 100 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={getStatusColor(score)}
                      strokeLinecap="round"
                   />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <motion.span className="text-2xl font-black text-slate-900 tracking-tighter">{score}%</motion.span>
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-[2px]">Readiness</span>
                 </div>
              </div>
           </div>

           {/* Skill History & Board */}
           <div className="md:col-span-2 space-y-6">
              <div className="space-y-3">
                 <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={12} className="text-emerald-500" />
                    Skill Analysis Progress
                 </h4>
                 <div className="space-y-3">
                    {recentScores.slice(0, 2).map((s, i) => (
                      <div key={i} className="flex items-center gap-4">
                         <span className="text-[9px] font-black text-slate-800 w-12">Eval 0{2-i}</span>
                         <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${s}%` }} className={`h-full rounded-full ${s >= 80 ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                         </div>
                         <span className="text-[10px] font-black text-slate-900">{s}%</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="flex gap-2 pt-2">
                 {topSkills.map((skill, i) => (
                   <div key={i} className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-600 text-center uppercase tracking-widest group-hover:bg-white transition-colors">
                      {skill}
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-8 mt-auto">
           <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Verified Profile • <span className="opacity-60">{lastUpdate}</span></p>
           </div>
           <button className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View Deep Analysis</button>
        </div>
      </div>
    </motion.div>
  );
}
