'use client';

import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Users, Briefcase, 
  Target, Globe, Zap, Sparkles,
  ArrowUpRight, BarChart3, AlertCircle,
  Activity, Fingerprint, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for Analytics
interface PlacementData {
  month: string;
  applications: number;
  placements: number;
}

interface SkillDemand {
  name: string;
  demand: number;
  supply: number;
}

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    totalInternships: 0,
    activePlacements: 0
  });

  const [placementData, setPlacementData] = useState<PlacementData[]>([]);
  const [skillDemand, setSkillDemand] = useState<SkillDemand[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<PieDataItem[]>([]);
  const [forecast, setForecast] = useState({
    quarterlyPlacement: 0,
    confidenceIndex: 0,
    marketSaturation: 0,
    reliability: 0,
    sentiment: ''
  });

  useEffect(() => {
    setMounted(true);
    async function loadAnalytics() {
      try {
        const response = await fetch('/api/admin/analytics');
        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
          setPlacementData(data.placementData);
          setSkillDemand(data.skillDemand);
          setStatusDistribution(data.statusDistribution);
          setForecast(data.forecast);
        }
        setLoading(false);
      } catch (e) {
        console.error('Failed to load analytics:', e);
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading || !mounted) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-8">
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-indigo-600"
      >
        <BarChart3 size={64} fill="currentColor" />
      </motion.div>
      <div className="text-center">
        <h2 className="text-[10px] font-black uppercase tracking-[10px] text-indigo-600 mb-2">Processing Intelligence</h2>
        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[5px] animate-pulse">Syncing Big Data Cluster Records</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                    <TrendingUp size={14} />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[6px] text-slate-400">Intelligence Hub</h2>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8]">Strategic<br/><span className="text-indigo-600">Intelligence.</span></h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md p-2 rounded-2xl border border-white shadow-sm">
            <div className="px-5 py-3 bg-indigo-600 rounded-xl border border-indigo-700 flex items-center gap-3 shadow-lg shadow-indigo-600/20">
                <div className="size-2 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[3px] text-white">Live Telemetry</span>
            </div>
            <div className="px-5 py-3 text-[10px] font-black uppercase tracking-[3px] text-slate-400">
                Data Precision: 99.9%
            </div>
        </div>
      </div>

      {/* KPI Cards Layer */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: stats.totalStudents, icon: Users, trend: '+12%', color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'Growth Scale', value: stats.activePlacements, icon: Briefcase, trend: '+28%', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Partner Access', value: stats.totalCompanies, icon: Globe, trend: '+5%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Market Demand', value: stats.totalInternships, icon: Zap, trend: '+15%', color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
                <div className={`size-12 rounded-2xl ${kpi.bg} flex items-center justify-center ${kpi.color} border border-transparent group-hover:border-current transition-all shadow-inner`}>
                    <kpi.icon size={20} />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                    <ArrowUpRight size={12} />
                    <span className="text-[10px] font-black">{kpi.trend}</span>
                </div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 mb-2">{kpi.label}</div>
            <div className={`text-4xl font-black tracking-tighter ${kpi.color}`}>{kpi.value.toLocaleString()}</div>
          </motion.div>
        ))}
      </div>

      {/* Primary Analytics Cluster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Placement Velocity - Glassmorphic Container */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 p-10 bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white shadow-sm"
        >
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[4px]">Placement Velocity</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[3px] mt-1">Hiring funnel efficiency metrics</p>
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/50 border border-white shadow-sm text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <div className="size-2 rounded-full bg-indigo-500" />
                    Applications
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/50 border border-white shadow-sm text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <div className="size-2 rounded-full bg-amber-500" />
                    Placements
                </div>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={placementData}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPlacements" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#64748B', letterSpacing: '1px' }} 
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#64748B' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px', 
                    border: '1px solid white', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.05)', 
                    padding: '16px' 
                  }}
                  itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}
                />
                <Area type="monotone" dataKey="applications" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorApps)" />
                <Area type="monotone" dataKey="placements" stroke="#D97706" strokeWidth={4} fillOpacity={1} fill="url(#colorPlacements)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution - Glassmorphic Donut */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-10 bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white shadow-sm"
        >
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[4px] mb-2">Student States</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[3px] mb-12">Current workforce allocation</p>
            
            <div className="h-[300px] w-full relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Active</span>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">1,240</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={statusDistribution}
                            cx="50%" cy="50%"
                            innerRadius={90}
                            outerRadius={115}
                            paddingAngle={10}
                            dataKey="value"
                            stroke="none"
                        >
                            {statusDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
                {statusDistribution.map((item) => (
                    <div key={item.name} className="p-4 rounded-[1.5rem] border border-white bg-white/30 backdrop-blur-sm group hover:bg-white/50 transition-all">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                            <span className="text-[9px] font-black uppercase tracking-[2px] text-slate-400">{item.name}</span>
                        </div>
                        <span className="text-xl font-black text-slate-900 tracking-tighter">{((item.value / 1240) * 100).toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </motion.div>
      </div>

      {/* Secondary Insights Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Labor Market Gap - Glassmorphic Bars */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-10 bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white shadow-sm"
        >
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[4px]">Labor Market Gap</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[3px] mt-1">Skill demand vs available talent</p>
                </div>
                <div className="size-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                    <Target size={22} />
                </div>
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillDemand} layout="vertical" barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.5} />
                        <XAxis type="number" hide />
                        <YAxis 
                            type="category" 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fontWeight: 900, fill: '#64748B', letterSpacing: '1px' }} 
                            width={120}
                        />
                        <Tooltip cursor={{ fill: 'rgba(226, 232, 240, 0.2)' }} contentStyle={{ borderRadius: '24px', border: 'none' }} />
                        <Bar dataKey="demand" fill="#D97706" radius={[0, 8, 8, 0]} barSize={16} name="Required Nodes" />
                        <Bar dataKey="supply" fill="#94A3B8" radius={[0, 8, 8, 0]} barSize={16} name="Available Nodes" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>

        {/* Predictive Outlook - Dark Command Deck */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-10 bg-slate-950 rounded-[3rem] relative overflow-hidden group shadow-2xl ring-1 ring-white/10"
        >
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-1000" />
            
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-5 mb-12">
                    <div className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-500 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                        <Sparkles size={28} />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[5px]">Predictive Outlook</h3>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[3px] mt-1">AI-driven quarterly forecast cluster</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 flex-1">
                    {[
                        { label: 'Q3 Placement Forecast', value: `${forecast.quarterlyPlacement} Units`, confidence: `${forecast.confidenceIndex}%`, progress: 85, icon: TrendingUp },
                        { label: 'Market Saturation Index', value: forecast.marketSaturation < 40 ? 'Low Risk' : 'Review Required', confidence: '89%', progress: forecast.marketSaturation, icon: Activity },
                        { label: 'Skill Match Reliability', value: 'High Accuracy', confidence: `${forecast.reliability}%`, progress: forecast.reliability, icon: Fingerprint },
                    ].map((item, i) => (
                        <div key={item.label} className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all group/item shadow-inner">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex gap-4">
                                   <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover/item:text-indigo-400 transition-colors">
                                      <item.icon size={18} />
                                   </div>
                                   <div>
                                       <div className="text-[10px] font-black text-white/30 uppercase tracking-[4px] mb-1">{item.label}</div>
                                       <div className="text-2xl font-black text-white tracking-tighter">{item.value}</div>
                                   </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] font-black text-white/30 uppercase tracking-[4px] mb-1">Confidence</div>
                                    <div className="text-sm font-black text-amber-500 shadow-amber-500/20">{item.confidence}</div>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${item.progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.5)] rounded-full"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 flex items-center gap-5 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl">
                    <div className="size-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-relaxed">
                          Intelligence Dashboard: <span className="text-white">{forecast.sentiment}</span>
                       </p>
                       <p className="text-[9px] font-bold text-amber-500/60 uppercase tracking-widest mt-1">Recommended Action: Verify skill alignment via DBMS Console.</p>
                    </div>
                </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
}
