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
        <div className="text-center space-y-2">
          <p className="text-lg font-black text-slate-900 uppercase tracking-widest">Cognitive Processing...</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[4px]">Syncing with Institutional Benchmarks</p>
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
            className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Return to Dashboard</span>
          </button>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">
              Deep <span className="text-indigo-600">Cognitive</span> Analysis
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-[4px] text-[10px]">
              Platform Intelligence • Career Trajectory Simulation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-6 bg-slate-900 rounded-[2rem] border border-white/10 shadow-2xl">
           <div className="text-right">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Market Readiness</p>
              <p className="text-3xl font-black text-white tabular-nums">{data?.score}%</p>
           </div>
           <div className="size-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <TrendingUp size={24} />
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
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Role Alignment</p>
                  <div className="flex items-center gap-3">
                     <span className="text-2xl font-black text-slate-900">{data?.roleAlignment}%</span>
                     <div className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase">High Match</div>
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
                  <div className="flex flex-wrap gap-2 pt-4">
                    {['Strategic', 'Iterative', 'Goal-Oriented'].map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-white/10 text-[8px] font-black uppercase tracking-widest">{tag}</span>
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
                   <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                         <div className="size-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600"><Star size={16} /></div>
                         <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">High Demand</span>
                      </div>
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">+24% growth</span>
                   </div>
                   <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                         <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><Zap size={16} /></div>
                         <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Fast Track</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Hiring</span>
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
