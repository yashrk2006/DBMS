'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, Users, Building2, Briefcase, ClipboardList, 
  TrendingDown, BarChart3, Trophy, ArrowUpRight, Cpu, ShieldCheck 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MarketEquilibriumItem, Skill } from '@/types';
import { ThreeDCard } from '@/components/ui/ThreeDCard';
import { AI_ENGINE } from '@/lib/ai-engine';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface AtRiskStudent {
  student_id: string;
  name: string;
  reason: string;
}

export default function AdminOverview() {
  const router = useRouter();
  const [stats, setStats] = useState({ students: 0, companies: 0, internships: 0, applications: 0 });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [marketIntelligence, setMarketIntelligence] = useState<MarketEquilibriumItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionData, setPredictionData] = useState<any>(null);
  const [riskSearch, setRiskSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  
  // New Platform Health Metrics
  const healthMetrics = AI_ENGINE.analyzeCompanyHealth(recentActivity);

  const handleAiPrediction = async () => {
    setIsPredicting(true);
    try {
      const res = await fetch('/api/admin/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats })
      });
      const data = await res.json();
      if (data.success) {
        setPredictionData(data.data);
        toast.success("Platform Analysis Complete", { icon: "📊" });
      }
    } catch (e) { console.error(e); }
    setIsPredicting(false);
  };

  const handleMentorAssignment = async (studentId: string, studentName: string) => {
    try {
      const res = await fetch('/api/admin/intervene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, action: 'assign_mentor' })
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`Counselor Assigned to ${studentName}`, { icon: '🎓' });
        setAtRiskStudents(prev => prev.filter(s => s.student_id !== studentId));
      } else {
        toast.error("Support update failed.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error during assignment.");
    }
  };

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const storedId = session?.user?.id;
      
      if (!storedId) {
        router.push('/auth/login');
        return;
      }

      try {
        const response = await fetch('/api/admin/stats');
        const result = await response.json();

        if (result.success && result.data) {
          const { stats, skills, atRisk, marketEquilibrium, recentActivity } = result.data;
          setStats(stats);
          setSkills(skills);
          setAtRiskStudents(atRisk);
          setMarketIntelligence(marketEquilibrium || []);
          setRecentActivity(recentActivity || []);
        }
        setLoading(false);
      } catch (e) {
        console.error('Failed to load admin stats:', e);
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-8">
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-amber-600"
      >
        <BarChart3 size={64} fill="currentColor" />
      </motion.div>
      <div className="text-center">
        <h2 className="text-[10px] font-black uppercase tracking-[10px] text-amber-600 mb-2">Loading Admin Hub</h2>
        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[5px] animate-pulse">Platform Overview Hub</p>
      </div>
    </div>
  );

  const impactCards = [
    { label: 'Total Enrolled', value: stats.students, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Corporate Partners', value: stats.companies, icon: Building2, color: 'text-slate-700', bg: 'bg-slate-300', border: 'border-slate-100' },
    { label: 'Active Opportunities', value: stats.internships, icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Total Submissions', value: stats.applications, icon: ClipboardList, color: 'text-slate-700', bg: 'bg-slate-300', border: 'border-slate-100' },
  ];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">Platform Hub</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Overview of SkillSync student progress and employment trends.</p>
        </div>
        <button 
          onClick={handleAiPrediction}
          disabled={isPredicting}
          className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          <BarChart3 size={18} className={isPredicting ? "animate-spin" : ""} />
          {isPredicting ? "Analyzing..." : "Trend Analysis"}
        </button>
      </header>

      {predictionData && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="p-12 rounded-[3.5rem] bg-slate-950 text-white border border-white/5 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-transparent to-indigo-600/10 opacity-50 transition-opacity group-hover:opacity-100" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-[5px] text-white/50">Placement Velocity</span>
              </div>
              <div className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">
                {predictionData.predicted_success_rate}%
              </div>
              <p className="text-[8px] md:text-[10px] font-bold opacity-40 leading-relaxed uppercase tracking-[3px]">Matched against industry benchmarks & skill requirements.</p>
            </div>
            
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <span className="text-[10px] font-black uppercase tracking-[5px] text-amber-500">Key Focus Areas</span>
                <ul className="space-y-4">
                  {(predictionData.recommendations || []).map((r: string, i: number) => (
                    <li key={i} className="flex gap-4 text-[11px] font-medium leading-relaxed text-white/70 group/item">
                      <span className="text-amber-600 font-black">0{i+1}</span>
                      <span className="group-hover/item:text-white transition-colors">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-6">
                <span className="text-[10px] font-black uppercase tracking-[5px] text-rose-500">Support Priority</span>
                <ul className="space-y-4">
                  {(predictionData.risk_factors || []).map((rk: string, i: number) => (
                    <li key={i} className="flex gap-3 text-[11px] font-medium leading-relaxed text-rose-200/60 group/risk">
                      <AlertTriangle size={14} className="shrink-0 text-rose-500" />
                      <span className="group-hover/risk:text-rose-200 transition-colors">{rk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Impact Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {impactCards.map(stat => (
          <ThreeDCard key={stat.label} className="h-full">
            <div 
              onClick={() => stat.label === 'Corporate Partners' ? router.push('/admin/companies') : null}
              className={`bg-white h-full p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border ${stat.border} shadow-sm group hover:shadow-md transition-all cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{stat.label}</div>
                <div className={`size-8 md:size-9 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={16} />
                </div>
              </div>
              <div className={`text-3xl md:text-4xl font-black ${stat.color} tracking-tighter`}>
                {stat.value.toLocaleString('en-IN')}
              </div>
            </div>
          </ThreeDCard>
        ))}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Career Trends Panel */}
        <div className="lg:col-span-8 bg-slate-950 rounded-[3rem] p-10 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <BarChart3 size={120} className="text-emerald-500" />
            </div>

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 md:mb-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="size-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                                <Trophy size={14} />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[4px]">Career Analytics</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">Skill Adoption Growth</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-8">
                         {marketIntelligence.slice(0, 3).map((item, idx) => (
                            <div key={item.name} className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-white uppercase tracking-widest">{item.name}</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[2px]">
                                        Market Gap: {item.gap > 0 ? `${item.gap} Roles Available` : `Balance Achieved`}
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.supply / (item.supply + item.demand + 1)) * 100}%` }}
                                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                    />
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.demand / (item.supply + item.demand + 1)) * 100}%` }}
                                        className="h-full bg-slate-800"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Engagement Overview */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-8 space-y-6">
                         <div className="flex items-center gap-2">
                             <Cpu size={14} className="text-amber-500" />
                             <span className="text-[10px] font-black text-amber-500 uppercase tracking-[3px]">Activity Summary</span>
                         </div>
                         
                         <div className="space-y-4">
                             <div>
                                 <div className="flex justify-between mb-2">
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Industry Engagement</span>
                                     <span className="text-xs font-black text-white">{healthMetrics.responsiveness}%</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500" style={{ width: `${healthMetrics.responsiveness}%` }} />
                                 </div>
                             </div>
                             <div>
                                 <div className="flex justify-between mb-2">
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Successful Connections</span>
                                     <span className="text-xs font-black text-white">{healthMetrics.accuracy}%</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: `${healthMetrics.accuracy}%` }} />
                                 </div>
                             </div>
                         </div>
                         
                         <p className="text-[9px] font-medium text-slate-500 leading-relaxed uppercase tracking-widest italic">
                            Status: <span className="text-emerald-500 font-black">Optimal</span>. High recruitment activity detected in technology sectors.
                         </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Support Alerts Panel */}
        <div className="lg:col-span-4 bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-white/5 flex flex-col relative overflow-hidden group/radar">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/radar:rotate-12 transition-transform">
            <TrendingDown size={100} className="text-rose-500" />
          </div>
          <div className="flex flex-col gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
                <AlertTriangle size={18} />
              </div>
              <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter">Support Pipeline</h3>
            </div>
            <div className="relative group">
              <input 
                type="text"
                placeholder="SEARCH NEEDS AND STATUS..."
                value={riskSearch}
                onChange={(e) => setRiskSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white outline-none focus:border-rose-500/50 transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {atRiskStudents
              .filter(s => !riskSearch || s.name.toLowerCase().includes(riskSearch.toLowerCase()) || s.reason.toLowerCase().includes(riskSearch.toLowerCase()))
              .map((student, i) => (
              <div key={student.student_id} className="p-5 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-black text-white text-sm uppercase tracking-tight">{student.name}</h4>
                  <span className="text-[8px] font-black bg-rose-500/20 text-rose-500 px-2 py-1 rounded-md border border-rose-500/20 uppercase tracking-widest">Needs Focus</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 italic">&quot;{student.reason}&quot;</p>
                <button 
                  onClick={() => handleMentorAssignment(student.student_id, student.name)}
                  className="w-full py-2.5 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2"
                >
                  Assign Counselor <ArrowUpRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm p-6 md:p-10 overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 md:mb-10">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Live Updates Feed</h2>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Platform Event Log</p>
          </div>
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="relative group w-full md:w-64">
              <input 
                type="text"
                placeholder="SEARCH ACTIVITY..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest focus:bg-white focus:border-amber-500/30 outline-none transition-all"
              />
            </div>
            <button className="hidden md:block text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline whitespace-nowrap">View Full Logs</button>
          </div>
        </div>

        <div className="space-y-1">
          {recentActivity
            .filter(a => {
              const query = activitySearch.toLowerCase();
              return !query || 
                a.title.toLowerCase().includes(query) || 
                a.type.toLowerCase().includes(query) || 
                a.status.toLowerCase().includes(query);
            })
            .length === 0 ? (
            <div className="py-20 text-center border border-dashed rounded-[2rem] border-slate-200">
              <div className="text-slate-300 font-black uppercase tracking-widest text-xs">No Recent Updates</div>
            </div>
          ) : (
            recentActivity
              .filter(a => {
                const query = activitySearch.toLowerCase();
                return !query || 
                  a.title.toLowerCase().includes(query) || 
                  a.type.toLowerCase().includes(query) || 
                  a.status.toLowerCase().includes(query);
              })
              .map((activity, idx) => (
              <div key={activity.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 rounded-2xl transition-all hover:bg-slate-50 group gap-4 ${idx !== recentActivity.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-slate-900/20 group-hover:bg-amber-600 group-hover:shadow-amber-600/20 transition-all shrink-0">
                    {activity.type.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-2">{activity.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-[2px]">{new Date(activity.timestamp).toLocaleString()}</span>
                      <div className="size-1 rounded-full bg-slate-200" />
                      <span className="text-[8px] md:text-[9px] font-black text-amber-600 uppercase tracking-widest">{activity.type}</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-1.5 rounded-lg bg-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-widest group-hover:bg-white group-hover:shadow-sm transition-all">
                  {activity.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Skill Inventory */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8">Career Skill Tracking</h2>
        <div className="flex flex-wrap gap-2">
          {skills.map(s => (
            <span key={s.skill_name} className="px-5 py-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-black text-slate-600 uppercase tracking-wider hover:border-amber-600/30 hover:bg-amber-50/30 transition-colors cursor-default">
              {s.skill_name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
