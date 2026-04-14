'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, Users, Building2, Briefcase, ClipboardList, 
  TrendingDown, BarChart3, Trophy, ArrowUpRight, Cpu, ShieldCheck, Database, Search
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
  riskScore: number;
  intensity: 'HIGH' | 'MEDIUM' | 'LOW';
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
    { label: 'Corporate Partners', value: stats.companies, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: 'Active Opportunities', value: stats.internships, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Total Submissions', value: stats.applications, icon: BarChart3, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  ];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-1.5 rounded-full bg-slate-900 shadow-[0_0_10px_rgba(15,23,42,0.4)]" />
            <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Institutional Governance Console</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-950 tracking-tight">Governance.</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight mt-2 max-w-lg">Orchestrate institutional progress, identify risk profiles, and monitor corporate engagement telemetry.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 grow-0">
          {/* Governance Health Index */}
          <div className="flex items-center gap-6 px-8 py-4 bg-white border border-slate-200 rounded-3xl shadow-xl mr-4 hidden xl:flex">
             <div className="space-y-1">
                <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Platform Health</div>
                <div className="text-xl font-black text-emerald-600 tracking-tighter">98.4%</div>
             </div>
             <div className="size-10 rounded-full border-4 border-slate-50 border-t-emerald-500 animate-[spin_3s_linear_infinite]" />
          </div>

          <button 
            onClick={() => router.push('/admin/db-audit')}
            className="w-full md:w-auto px-8 py-5 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[3px] hover:bg-slate-50 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 group"
          >
            <Database size={18} className="text-amber-600 group-hover:scale-110 transition-transform" />
            DBMS Inspector
          </button>
          
          <button 
            onClick={handleAiPrediction}
            disabled={isPredicting}
            className="w-full md:w-auto px-10 py-5 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-[3px] hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 group"
          >
            <Cpu size={18} className={`${isPredicting ? "animate-spin" : "group-hover:rotate-12 transition-transform"}`} />
            {isPredicting ? "Running Core Analysis..." : "Execute Pulse Prediction"}
          </button>
        </div>
      </header>

      {predictionData && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="p-1 md:p-1.5 rounded-[3.5rem] bg-gradient-to-br from-indigo-500/20 via-slate-950 to-amber-500/20 shadow-2xl"
        >
          <div className="bg-slate-950 rounded-[3.1rem] p-10 md:p-14 text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-amber-600/10 opacity-50" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-4 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                  <span className="text-[10px] font-black uppercase tracking-[5px] text-white/50">Performance Forecast</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-8xl md:text-9xl font-black tracking-tighter text-white">
                    {predictionData.predicted_success_rate}%
                  </h4>
                  <div className="pb-4">
                    <ArrowUpRight className="text-emerald-500 size-12" />
                  </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-[3px]">Institutional benchmark success probability for current session.</p>
                </div>
              </div>
              
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-12 border-l border-white/5 pl-0 lg:pl-12">
                <div className="space-y-8">
                  <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-amber-500">Core Strategies</span>
                  </div>
                  <ul className="space-y-5">
                    {(predictionData.recommendations || []).map((r: string, i: number) => (
                      <li key={i} className="flex gap-5 text-[12px] font-medium leading-relaxed text-white/70 group/item items-start">
                        <span className="text-amber-600 font-black text-xs">0{i+1}</span>
                        <span className="group-hover/item:text-white transition-colors">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-8">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-rose-500" />
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-rose-500">Critical Risks</span>
                  </div>
                  <ul className="space-y-5">
                    {(predictionData.risk_factors || []).map((rk: string, i: number) => (
                      <li key={i} className="flex gap-4 text-[12px] font-medium leading-relaxed text-rose-200/60 group/risk items-start">
                        <div className="size-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span className="group-hover/risk:text-rose-200 transition-colors">{rk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Impact Metrics - High Fidelity Glassmorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {impactCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`group relative p-8 md:p-10 rounded-[2.5rem] bg-white border ${stat.border} shadow-[var(--soft-shadow)] hover:shadow-2xl transition-all cursor-pointer overflow-hidden active:scale-95`}
            onClick={() => stat.label === 'Corporate Partners' ? router.push('/admin/companies') : null}
          >
            <div className={`absolute -right-6 -bottom-6 size-32 opacity-5 scale-150 transition-transform group-hover:rotate-12 duration-700 ${stat.color}`}>
              <stat.icon size={128} />
            </div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className={`size-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center border border-black/5 shadow-inner`}>
                  <stat.icon size={22} />
                </div>
                <div className="h-0.5 w-12 bg-slate-100 rounded-full" />
              </div>
              
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-1">{stat.label}</div>
                <div className={`text-4xl md:text-5xl font-black ${stat.color} tracking-tighter`}>
                  {stat.value.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <div className="size-1 rounded-full bg-emerald-500" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Healthy Metadata</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* Career Trends Panel - Premium Dark Center */}
        <div className="lg:col-span-8 bg-slate-950 rounded-[3.5rem] p-10 md:p-14 border border-white/5 relative overflow-hidden group shadow-2xl shadow-indigo-950/20">
            <div className="absolute top-0 right-0 p-16 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                <BarChart3 size={150} className="text-indigo-500" />
            </div>

            <div className="relative z-10 flex flex-col h-full gap-12">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="size-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[5px]">Core Analytics Engine</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mt-2">Skill Trajectories.</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    <div className="space-y-10">
                         {marketIntelligence.slice(0, 3).map((item, idx) => (
                            <div key={item.name} className="space-y-5">
                                <div className="flex justify-between items-end">
                                    <span className="text-[11px] font-black text-white uppercase tracking-[4px]">{item.name}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="size-1 rounded-full bg-indigo-500" />
                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[2px]">
                                            {item.gap > 0 ? `${item.gap} GAP` : `SATURATED`}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden flex shadow-inner border border-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.supply / (item.supply + item.demand + 1)) * 100}%` }}
                                        className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
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

                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 space-y-10 shadow-2xl">
                         <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <Cpu size={16} className="text-amber-500" />
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[4px]">System Integrity</span>
                             </div>
                             <ShieldCheck size={18} className="text-emerald-500" />
                         </div>
                         
                         <div className="space-y-8">
                             <div>
                                 <div className="flex justify-between mb-3 items-end">
                                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-[3px]">Corporate Flux</span>
                                     <span className="text-xl font-black text-white tracking-tighter">{healthMetrics.responsiveness}%</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${healthMetrics.responsiveness}%` }}
                                      className="h-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" 
                                    />
                                 </div>
                             </div>
                             <div>
                                 <div className="flex justify-between mb-3 items-end">
                                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-[3px]">Placement Accuracy</span>
                                     <span className="text-xl font-black text-white tracking-tighter">{healthMetrics.accuracy}%</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${healthMetrics.accuracy}%` }}
                                      className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" 
                                    />
                                 </div>
                             </div>
                         </div>
                         
                         <div className="pt-4 border-t border-white/5">
                            <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-[3px] italic">
                                Status Monitor: <span className="text-emerald-500">Optimum Intelligence</span>. Data clusters indicate 14% growth in AI-centric roles.
                            </p>
                         </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Support Pipeline Panel - High fidelity risk monitor */}
        <div className="lg:col-span-4 bg-slate-900 rounded-[3.5rem] p-10 border border-white/5 flex flex-col relative overflow-hidden group/radar shadow-2xl">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover/radar:rotate-45 transition-transform duration-1000">
            <TrendingDown size={140} className="text-rose-500" />
          </div>
          <div className="relative z-10 flex flex-col gap-8 mb-10">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]" />
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-[5px]">Critical Interventions</span>
                </div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter mt-2">At Risk.</h3>
            </div>
            <div className="relative">
              <input 
                type="text"
                placeholder="GLOBAL ID SEARCH..."
                value={riskSearch}
                onChange={(e) => setRiskSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-rose-500/50 focus:bg-white/10 transition-all placeholder:text-slate-700"
              />
            </div>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
            {atRiskStudents
              .filter(s => !riskSearch || s.name.toLowerCase().includes(riskSearch.toLowerCase()) || s.reason.toLowerCase().includes(riskSearch.toLowerCase()))
              .map((student, i) => (
              <motion.div 
                key={student.student_id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-6 md:p-8 bg-white/5 rounded-3xl border border-white/10 group/card hover:bg-white/10 hover:border-rose-500/30 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <h4 className="font-black text-white text-base uppercase tracking-tight">{student.name}</h4>
                    <div className="flex items-center gap-2">
                       <span className={`text-[7px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest ${
                         student.intensity === 'HIGH' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                         student.intensity === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                         'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                       }`}>
                          {student.intensity} RISK
                       </span>
                    </div>
                  </div>
                  <div className="relative size-10 flex items-center justify-center">
                    <svg className="size-full -rotate-90">
                      <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
                      <motion.circle 
                        cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" 
                        strokeDasharray={113}
                        initial={{ strokeDashoffset: 113 }}
                        animate={{ strokeDashoffset: 113 - (113 * student.riskScore) / 100 }}
                        className={student.intensity === 'HIGH' ? 'text-rose-500' : 'text-amber-500'}
                      />
                    </svg>
                    <span className="absolute text-[8px] font-black text-white">{student.riskScore}%</span>
                  </div>
                </div>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-[2px] mb-8 leading-relaxed italic">&quot;{student.reason}&quot;</p>
                <button 
                  onClick={() => handleMentorAssignment(student.student_id, student.name)}
                  className="w-full py-4 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-[3px] shadow-xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  Initiate Support <ArrowUpRight size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed - Premium Telemetry List */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-[var(--soft-shadow)] p-10 md:p-14 overflow-hidden relative group">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-14">
            <div className="space-y-1">
                <div className="flex items-center gap-3 mb-2">
                    <div className="size-1.5 rounded-full bg-slate-900 shadow-[0_0_10px_rgba(0,0,0,0.2)]" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[5px]">Network Telemetry</span>
                </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter">Heartbeat.</h2>
            </div>
          <div className="flex items-center gap-6 w-full md:w-auto">
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
              <input 
                type="text"
                placeholder="SCAN SYSTEM LOGS..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:bg-white focus:border-slate-900 outline-none transition-all placeholder:text-slate-300"
              />
            </div>
            <button className="hidden md:flex h-12 items-center px-6 rounded-2xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg">Full Archive</button>
          </div>
        </div>

        <div className="space-y-1 border-t border-slate-50 pt-8">
          {recentActivity
            .filter(a => {
              const query = activitySearch.toLowerCase();
              return !query || 
                a.title.toLowerCase().includes(query) || 
                a.type.toLowerCase().includes(query) || 
                a.status.toLowerCase().includes(query);
            })
            .length === 0 ? (
            <div className="py-32 text-center border-2 border-dashed rounded-[3rem] border-slate-100 bg-slate-50/30">
              <div className="size-16 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-slate-200 mx-auto mb-6">
                <ClipboardList size={32} />
              </div>
              <div className="text-slate-400 font-black uppercase tracking-[5px] text-[10px]">No Real-time Updates Detected</div>
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
              <motion.div 
                key={activity.id} 
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 md:p-8 rounded-[2rem] transition-all hover:bg-slate-50 group gap-6 ${idx !== recentActivity.length - 1 ? 'border-b border-slate-50' : ''}`}
              >
                <div className="flex items-center gap-6 md:gap-8">
                  <div className="size-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center text-base font-black shadow-xl shadow-slate-900/10 group-hover:bg-indigo-600 group-hover:shadow-indigo-600/30 transition-all shrink-0">
                    {activity.type.charAt(0)}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{activity.title}</h4>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 size={12} className="text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(activity.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="size-1 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[2px]">{activity.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Status Vector</span>
                        <div className="px-5 py-2 rounded-xl bg-slate-100 text-[10px] font-black text-slate-900 uppercase tracking-[2px] group-hover:bg-white group-hover:shadow-md transition-all border border-slate-100 ring-4 ring-slate-50/50">
                        {activity.status}
                        </div>
                    </div>
                    <button className="size-12 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-950 hover:bg-white transition-all active:scale-95 shadow-sm">
                        <ArrowUpRight size={18} />
                    </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Skill Inventory - Visual Cloud */}
      <div className="bg-slate-50 rounded-[3.5rem] border border-slate-200 p-10 md:p-14 mb-10 overflow-hidden relative group shadow-inner">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-slate-900" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[5px]">Market Readiness</span>
                </div>
                <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter mt-2">Inventory.</h2>
            </div>
            <div className="px-6 py-2 bg-white rounded-full border border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                Tracking {skills.length} Competencies
            </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {skills.map((s, i) => (
            <motion.span 
              key={s.skill_name} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-[11px] font-black text-slate-600 uppercase tracking-[2px] hover:border-indigo-600/30 hover:text-indigo-600 hover:shadow-xl transition-all cursor-default active:scale-95"
            >
              {s.skill_name}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}
