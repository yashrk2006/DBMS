'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LineChart, Sparkles, Brain, Target, 
  ChevronLeft, Award, Zap, ShieldCheck,
  TrendingUp, BarChart3, Star, Cpu
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AnimatedSection from '@/components/ui/AnimatedSection';
import PremiumCard from '@/components/ui/PremiumCard';
import { RadarChart, RoadmapTimeline, SkillGapAnalysis } from '@/components/dashboard/AnalysisMetrics';
import { toast } from 'react-hot-toast';

export default function AnalysisPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadAnalysis() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      try {
        const resp = await fetch(`/api/dashboard/analysis?userId=${session.user.id}`);
        const result = await resp.json();
        if (result.success) {
          setData(result.analysis);
        } else {
          toast.error("Failed to load deep analysis");
        }
      } catch (err) {
        toast.error("Network error during analysis");
      } finally {
        setLoading(false);
      }
    }
    loadAnalysis();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="relative">
          <div className="size-24 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
          <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={32} />
        </div>
        <div className="text-center space-y-4">
          <p className="text-xl font-bold text-slate-950 tracking-tight">Cognitive Processing.</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[5px]">Syncing with Institutional Benchmarks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-[4px]">Return to Dash</span>
          </button>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-950 tracking-tight">
              Deep <span className="text-indigo-600 underline decoration-indigo-200 decoration-8 underline-offset-4">Cognitive</span> Analysis.
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-[6px] text-[10px] mt-4">
              Platform Intelligence • Trajectory Simulation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 p-8 bg-slate-950 rounded-[2.5rem] border border-white/5 shadow-[var(--soft-shadow)]">
           <div className="text-right">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[4px] mb-2">Market Readiness</p>
              <p className="text-4xl font-bold text-white tabular-nums tracking-tight">{data?.score}%</p>
           </div>
           <div className="size-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
              <TrendingUp size={28} />
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Skill Fingerprint */}
        <AnimatedSection direction="up" className="xl:col-span-1 space-y-8">
          <PremiumCard 
            title="Skill Fingerprint" 
            subtitle=" proficiency distribution"
            icon={<Target size={28} />}
          >
            <div className="py-8">
              <RadarChart data={data?.radarData || []} />
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[4px] mb-2">Role Alignment</p>
                   <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-slate-950 tracking-tight">{data?.roleAlignment}%</span>
                      <div className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-widest border border-emerald-100">Optimal Match</div>
                   </div>
                </div>
               <div className="size-12 rounded-full border-4 border-slate-100 border-t-emerald-500" />
            </div>
          </PremiumCard>

          <PremiumCard 
            title="Gap Identifier" 
            subtitle="Critical roadblocks"
            icon={<ShieldCheck size={28} />}
            className="bg-slate-50 border-none"
          >
            <SkillGapAnalysis missing={data?.missing_skills || []} />
          </PremiumCard>
        </AnimatedSection>

        {/* Right Column: Roadmap & Intelligence */}
        <AnimatedSection direction="up" delay={0.1} className="xl:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <PremiumCard 
                title="AI Summary" 
                subtitle="Strategic Briefing"
                icon={<Brain size={28} />}
                variant="flat"
                className="bg-indigo-600 text-white"
             >
                <div className="space-y-4">
                  <p className="text-[11px] font-bold text-indigo-100 leading-relaxed uppercase tracking-tight">
                    {data?.summary}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-6">
                    {['Strategic', 'Iterative', 'Goal-Oriented'].map(tag => (
                      <span key={tag} className="px-4 py-1.5 rounded-xl bg-white/10 text-[9px] font-bold uppercase tracking-[3px] border border-white/5">{tag}</span>
                    ))}
                  </div>
                </div>
             </PremiumCard>

             <PremiumCard 
                title="Market Sentiment" 
                subtitle="Industry Pulse"
                icon={<BarChart3 size={28} />}
             >
                <div className="space-y-6">
                   <div className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4">
                         <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm"><Star size={18} /></div>
                         <span className="text-[11px] font-bold text-slate-950 uppercase tracking-[3px]">Target Market Demand</span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">+24% growth</span>
                   </div>
                   <div className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4">
                         <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm"><Zap size={18} /></div>
                         <span className="text-[11px] font-bold text-slate-950 uppercase tracking-[3px]">Institutional Velocity</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active Hiring</span>
                   </div>
                </div>
             </PremiumCard>
          </div>

          <PremiumCard 
            title="Accelerated Roadmap" 
            subtitle="2-Week Execution Plan"
            icon={<Cpu size={28} />}
          >
            <div className="max-w-2xl mx-auto py-8">
              <RoadmapTimeline roadmap={data?.roadmap || []} />
            </div>
            
            <div className="mt-8 flex justify-center">
               <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 group">
                  Add Roadmap to Calendar
                  <ChevronLeft size={16} className="rotate-180 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </PremiumCard>
        </AnimatedSection>
      </div>
    </div>
  );
}
