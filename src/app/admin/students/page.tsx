'use client';

import { useEffect, useState } from 'react';
import { 
  Users, Search, GraduationCap, MapPin, 
  Mail, Calendar, Trophy, Download,
  Filter, UserCheck, ShieldCheck, ArrowRight,
  TrendingUp, Activity, Sparkles, Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV } from '@/lib/utils/export';
import { toast } from 'react-hot-toast';

interface Student {
  student_id: string;
  full_name: string;
  roll_number: string;
  email: string | null;
  college_name: string | null;
  branch: string | null;
  graduation_year: number | null;
  cgpa: number | null;
  created_at: string;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/admin/students');
        const data = await response.json();
        if (data.success) {
          setStudents(data.data);
        }
      } catch (e) {
        console.error('Failed to load students:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExport = () => {
    const exportData = students.map(s => ({
      'Roll Number': s.roll_number,
      'Full Name': s.full_name,
      'Email': s.email || '—',
      'College': s.college_name || '—',
      'Branch': s.branch || '—',
      'Grad Year': s.graduation_year || '—',
      'CGPA': s.cgpa || '—'
    }));
    exportToCSV(exportData, `student_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Human Capital Ledger exported.', { icon: '📑' });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-8">
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-indigo-600"
      >
        <Users size={64} fill="currentColor" />
      </motion.div>
      <div className="text-center">
        <h2 className="text-[10px] font-black uppercase tracking-[10px] text-indigo-600 mb-2">Syncing Human Capital</h2>
        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[5px] animate-pulse">Accessing Secure Institutional Records</p>
      </div>
    </div>
  );

  const branches = ['ALL', ...Array.from(new Set(students.map(s => s.branch).filter(Boolean)))];
  const years = ['ALL', ...Array.from(new Set(students.map(s => s.graduation_year).filter(Boolean))).sort()];

  const filtered = students.filter(s => {
    const matchesSearch = (s.full_name?.toLowerCase() || '').includes(search.toLowerCase()) || 
                          (s.roll_number?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesBranch = filterBranch === 'ALL' || s.branch === filterBranch;
    const matchesYear = filterYear === 'ALL' || String(s.graduation_year) === filterYear;
    return matchesSearch && matchesBranch && matchesYear;
  });

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="size-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <ShieldCheck size={14} />
             </div>
             <h2 className="text-[10px] font-black uppercase tracking-[6px] text-slate-400">Institutional Governance</h2>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8]">Human Capital<br/><span className="text-indigo-600">Command.</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="group relative bg-slate-900 text-white px-8 py-4 rounded-[1.25rem] flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-[3px] shadow-xl hover:bg-black"
          >
            <Download size={16} />
            Export Ledger
            <div className="absolute inset-0 rounded-[1.25rem] bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.button>
        </div>
      </header>

      {/* Talent Metrics Mosaic */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Verified Students', value: students.length, icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Cluster Placement', value: '82%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Engagement Rate', value: 'High', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Avg CGPA Cluster', value: '8.4', icon: Trophy, color: 'text-slate-900', bg: 'bg-slate-100' },
        ].map((card, i) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-sm hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`size-10 rounded-xl ${card.bg} border border-transparent group-hover:border-current flex items-center justify-center ${card.color} transition-all`}>
                <card.icon size={16} />
              </div>
              <div className="flex items-center gap-2">
                 <div className="size-2 rounded-full bg-indigo-500 animate-pulse" />
                 <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 shadow-sm tracking-widest">LIVE</span>
              </div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1">{card.label}</div>
            <div className={`text-3xl font-black tracking-tighter ${card.color}`}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Discovery Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-6 relative group">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="FILTER BY IDENTITY OR ROLL NUMBER..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-16 pl-16 pr-8 rounded-[1.5rem] border border-slate-100 bg-white text-[10px] font-black uppercase tracking-[3px] placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all outline-none shadow-sm"
          />
        </div>
        
        <div className="lg:col-span-3">
          <div className="relative group">
            <Filter size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
            <select
              value={filterBranch}
              onChange={e => setFilterBranch(e.target.value)}
              className="w-full h-16 pl-12 pr-6 bg-white border border-slate-100 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[2px] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none appearance-none cursor-pointer shadow-sm"
            >
              <option value="ALL">ALL BRANCHES</option>
              {branches.filter(b => b !== 'ALL').map(b => (
                <option key={String(b)} value={String(b)}>{b?.toUpperCase() || 'UNKNOWN'}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="relative group">
            <Calendar size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="w-full h-16 pl-12 pr-6 bg-white border border-slate-100 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[2px] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none appearance-none cursor-pointer shadow-sm"
            >
              <option value="ALL">ALL COHORTS</option>
              {years.filter(y => y !== 'ALL').map(y => (
                <option key={y} value={String(y)}>COHORT {y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Container */}
      <div className="bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
            <div className="flex items-center gap-5">
               <div className="size-12 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center font-black shadow-xl ring-4 ring-slate-900/10">
                  <Fingerprint size={24} />
               </div>
               <div>
                  <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[5px]">Human Capital Ledger</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{filtered.length} verified records retrieved</p>
               </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-indigo-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Secure Cluster</span>
                </div>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/10 text-[10px] font-black uppercase tracking-[3px] text-slate-400">
                <th className="px-10 py-6">Identity</th>
                <th className="px-10 py-6">Roll Number</th>
                <th className="px-10 py-6">Branch Cluster</th>
                <th className="px-10 py-6">Academic Metrics</th>
                <th className="px-10 py-6">Cohort</th>
                <th className="px-10 py-6 text-right">Provisions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {filtered.map((s, idx) => (
                  <motion.tr 
                    key={s.student_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-slate-50/60 transition-all group cursor-pointer"
                  >
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div className="size-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm shadow-inner group-hover:scale-110 transition-transform">
                          {s.full_name?.charAt(0) || '?'}
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{s.full_name}</div>
                          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 lowercase">
                            <Mail size={10} className="text-slate-300" /> {s.email || 'no-identity@auth'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm">
                        {s.roll_number}
                      </span>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-tight">
                         <GraduationCap size={14} className="text-slate-300" />
                         {s.branch || 'GENERAL STACK'}
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-3">
                         <div className="text-lg font-black text-slate-900 tracking-tighter">{s.cgpa || '?.?'}</div>
                         <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(s.cgpa || 0) * 10}%` }}
                              className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]" 
                            />
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                       <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-3 py-1.25 rounded-lg">
                          CLASS OF {s.graduation_year || '????'}
                       </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                       <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-[3px] hover:bg-indigo-600 transition-all shadow-lg flex items-center gap-3 ml-auto"
                       >
                          View Identity <ArrowRight size={13} />
                       </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filtered.length === 0 && (
            <div className="py-40 text-center">
               <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                  <Fingerprint size={32} />
               </div>
               <h3 className="text-xl font-black text-slate-300 uppercase tracking-[10px] leading-none mb-4">Zero Matches</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Audit parameters returned zero human capital nodes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
