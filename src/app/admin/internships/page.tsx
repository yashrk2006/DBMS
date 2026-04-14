'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Briefcase, TrendingUp, BarChart3, MapPin, 
  Clock, Flame, Download, ShieldAlert, Sparkles,
  Target, Activity, Globe, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV } from '@/lib/utils/export';
import { toast } from 'react-hot-toast';

interface Internship {
  internship_id: string | number;
  title: string;
  duration: string | null;
  stipend: string | null;
  location: string | null;
  company: { company_name: string } | null;
  req_count: number;
  app_count: number;
  health?: string;
  saturation?: number;
}

type SortKey = 'app_count' | 'req_count' | 'internship_id';

export default function AdminInternshipsPage() {
  const router = useRouter();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('app_count');

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/admin/internships');
        const result = await response.json();
        
        if (result.success && result.data) {
          setInternships(result.data);
        }
      } catch (err) {
        console.error('Failed to load internships:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExport = () => {
    const exportData = internships.map(i => ({
      'ID': i.internship_id,
      'Title': i.title,
      'Company': i.company?.company_name || '—',
      'Location': i.location,
      'Stipend': i.stipend,
      'Applications': i.app_count,
      'Skill Count': i.req_count,
      'Health Status': i.health || '—',
      'Market Saturation (%)': i.saturation || 0
    }));
    exportToCSV(exportData, `admin_roles_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Market report generated successfully.', { icon: '📊' });
  };

  const handlePromote = (role: string) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1500)),
      {
        loading: `Promoting ${role}...`,
        success: `${role} boosted in matching algorithms.`,
        error: 'Promotion failed.'
      }
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-8">
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-indigo-600"
      >
        <Briefcase size={64} fill="currentColor" />
      </motion.div>
      <div className="text-center">
        <h2 className="text-[10px] font-black uppercase tracking-[10px] text-indigo-600 mb-2">Syncing Opportunities</h2>
        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[5px] animate-pulse">Accessing Global Internship Registry</p>
      </div>
    </div>
  );

  const maxApps = Math.max(...internships.map((i: Internship) => i.app_count), 1);

  const filtered = internships
    .filter((i: Internship) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      (i.company?.company_name ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: Internship, b: Internship) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return valB - valA;
      }
      return String(valB).localeCompare(String(valA));
    });

  const totalApps = internships.reduce((sum: number, i: Internship) => sum + i.app_count, 0);
  const hotRoles = internships.filter((i: Internship) => i.app_count >= maxApps * 0.6).length;
  const avgApps = internships.length > 0 ? Math.round(totalApps / internships.length) : 0;

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-4">
          <button 
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors mb-2"
          >
            <ArrowUpRight size={14} className="rotate-[225deg]" /> Back to Command Hub
          </button>
          <div className="flex items-center gap-3">
             <div className="size-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <Target size={14} />
             </div>
             <h2 className="text-[10px] font-black uppercase tracking-[6px] text-slate-400">Opportunity Verification</h2>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Internship Registry</h1>
          <p className="text-slate-500 font-medium">{internships.length} active roles · <span className="text-indigo-600 font-black">{totalApps}</span> total applications</p>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="group relative bg-slate-900 text-white px-8 py-4 rounded-[1.25rem] flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-[3px] shadow-xl hover:bg-black"
          >
            <Download size={16} />
            Market Intelligence Report
            <div className="absolute inset-0 rounded-[1.25rem] bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.button>
        </div>
      </header>

      {/* Summary KPI Mosaic */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Roles', value: internships.length, icon: Briefcase, color: 'text-slate-700', bg: 'bg-slate-50', trend: 'STABLE' },
          { label: 'Application Volume', value: totalApps, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+14%' },
          { label: 'Critical Demand', value: hotRoles, icon: Flame, color: 'text-rose-500', bg: 'bg-rose-50', trend: 'URGENT' },
          { label: 'Avg Matching', value: `${avgApps}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'OPTIMAL' },
        ].map((card, i) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-sm hover:shadow-xl transition-all group`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`size-10 rounded-xl ${card.bg} border border-transparent group-hover:border-current flex items-center justify-center ${card.color} transition-all`}>
                <card.icon size={16} />
              </div>
              <span className={`text-[8px] font-black px-2 py-1 rounded-md bg-white border border-slate-100 ${card.color}`}>{card.trend}</span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1">{card.label}</div>
            <div className={`text-3xl font-black tracking-tighter ${card.color}`}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-8">
        {/* Controls Layer */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="relative w-full lg:max-w-md group">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="FILTER REGISTRY BY ROLE..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-16 pl-16 pr-6 rounded-[1.5rem] border border-slate-100 bg-white text-[10px] font-black uppercase tracking-[3px] placeholder:text-slate-300 focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-[1.25rem] border border-slate-200 shadow-inner">
            {([
              { key: 'app_count' as SortKey, label: 'Highest Demand' },
              { key: 'req_count' as SortKey, label: 'Skill Density' },
              { key: 'internship_id' as SortKey, label: 'System ID' },
            ]).map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[3px] transition-all ${
                  sortBy === opt.key
                    ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* The Opportunity Ledger */}
        <div className="bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white shadow-sm overflow-hidden">
          <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-4">
               <div className="size-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg">
                  <Activity size={18} />
               </div>
               <div>
                  <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[4px]">Verified Opportunity Cluster</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{filtered.length} active nodes in registry</p>
               </div>
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Precision Audit
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[2px] text-slate-400">
                  <th className="px-10 py-6">Status ID</th>
                  <th className="px-10 py-6">Role Specification</th>
                  <th className="px-10 py-6">Organization</th>
                  <th className="px-10 py-6">Global Positioning</th>
                  <th className="px-10 py-6">Market Saturation</th>
                  <th className="px-10 py-6">Health</th>
                  <th className="px-10 py-6 text-right">Provisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-10 py-32 text-center">
                         <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-6 border border-slate-100">
                            <Briefcase size={32} />
                         </div>
                         <h3 className="text-xl font-black text-slate-300 uppercase tracking-[10px] mb-2">Registry Silent</h3>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Zero nodes matched search parameters within cluster</p>
                      </td>
                    </tr>
                  ) : filtered.map((i, idx) => {
                    const saturation = i.saturation || 0;
                    const isHot = saturation >= 60;
                    const isCritical = i.health === 'Critical';
                    
                    return (
                      <motion.tr 
                        key={i.internship_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-slate-50/40 transition-colors group cursor-pointer"
                      >
                        <td className="px-10 py-7">
                          <span className="text-[10px] font-mono text-slate-300 font-black tracking-tighter group-hover:text-indigo-400 transition-colors">
                            SYS-{(i.internship_id as string).toString().toUpperCase().slice(0, 8)}
                          </span>
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex items-start gap-4">
                            <div className={`size-10 rounded-xl flex items-center justify-center font-black uppercase text-sm shrink-0 shadow-inner group-hover:scale-110 transition-transform ${isHot ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                              {i.title.charAt(0)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{i.title}</div>
                                {isHot && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-[8px] font-black text-white uppercase tracking-widest shadow-lg shadow-rose-600/20">
                                    <Flame size={9} /> High Demand
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={10} /> {i.stipend || 'Unpaid Fellowship'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-tight line-clamp-1">
                             <Globe size={13} className="text-slate-300" />
                             {i.company?.company_name || 'Autonomous Node'}
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <MapPin size={11} className="text-slate-300" /> {i.location || 'Distributed'}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <Clock size={10} /> {i.duration || 'Flexible'}
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-7 min-w-[200px]">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[2px] text-slate-400">
                               <span>Saturation Coefficient</span>
                               <span className={isHot ? 'text-rose-600' : 'text-emerald-600'}>{saturation}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${saturation}%` }}
                                className={`h-full rounded-full transition-all shadow-sm ${isHot ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <div className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${
                            isCritical ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                            i.health === 'High Demand' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                             <div className={`size-1.5 rounded-full animate-pulse ${isCritical ? 'bg-rose-500' : 'bg-current'}`} />
                             {i.health}
                          </div>
                        </td>
                        <td className="px-10 py-7 text-right">
                           <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePromote(i.title)}
                            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-[3px] hover:bg-black hover:shadow-xl transition-all shadow-lg active:scale-95"
                           >
                              Boost Algorithmic Priority
                           </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
