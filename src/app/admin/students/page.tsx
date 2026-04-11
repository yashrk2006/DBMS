'use client';

import { useEffect, useState } from 'react';
import { 
  Users, GraduationCap, Search, Filter, 
  MoreVertical, Mail, BookOpen, Target,
  TrendingUp, Award, AlertCircle, CheckCircle2,
  ChevronRight, ArrowUpRight, LayoutGrid, List,
  Database, Activity, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Student {
  student_id: string;
  name: string;
  roll_no?: string;
  email: string;
  college: string;
  branch: string;
  academic_year: string;
  resume_url?: string;
  cgpa: number;
  applications_count: number;
  rejections_count: number;
  student_skill?: { skill_name: string; level: string }[];
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'cgpa' | 'roll_no'>('name');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/admin/students');
        const result = await response.json();
        if (result.success && result.data) {
          setStudents(result.data);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleOpenDetails = async (student: Student) => {
    setSelectedStudent(student);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/admin/students/${student.student_id}`);
      const data = await res.json();
      if (data.success) {
        setStudentDetails(data.data);
      }
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filtered = students.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.college?.toLowerCase().includes(search.toLowerCase()) ||
    s.branch?.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_no?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    if (sortBy === 'cgpa') return (Number(b.cgpa) || 0) - (Number(a.cgpa) || 0);
    if (sortBy === 'roll_no') return (a.roll_no || '').localeCompare(b.roll_no || '');
    return (a.name || '').localeCompare(b.name || '');
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-8">
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-amber-600"
      >
        <Users size={64} fill="currentColor" />
      </motion.div>
      <div className="text-center">
        <h2 className="text-[10px] font-black uppercase tracking-[10px] text-amber-600 mb-2">Syncing Directory</h2>
        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[5px] animate-pulse">Accessing Human Capital Registry</p>
      </div>
    </div>
  );

  return (
    <>
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="size-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                <Users size={14} />
             </div>
             <h2 className="text-[10px] font-black uppercase tracking-[6px] text-slate-400">Human Capital Management</h2>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Student Directory</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
           <div className="relative flex-1 sm:w-80 group">
              <input 
                type="text" 
                placeholder="SEARCH REGISTRY..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-14 pl-12 pr-6 rounded-2xl border border-slate-100 bg-white text-[10px] font-black uppercase tracking-[3px] focus:border-amber-500/30 transition-all shadow-sm" 
              />
              <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
           </div>

           <select 
             value={sortBy} 
             onChange={(e) => setSortBy(e.target.value as any)}
             className="h-14 px-6 rounded-2xl border border-slate-100 bg-white text-[10px] font-black uppercase tracking-[3px] focus:border-amber-500/30 transition-all shadow-sm outline-none appearance-none cursor-pointer pr-12 min-w-[160px]"
           >
             <option value="name">Sort by Name</option>
             <option value="cgpa">Sort by CGPA</option>
             <option value="roll_no">Sort by Roll No</option>
           </select>
           
           <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={16} />
              </button>
           </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Verified Students', value: students.length, icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Placement Ready', value: students.filter(s => (s.student_skill?.length ?? 0) > 4).length, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Seekers', value: Math.round(students.length * 0.85), icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'At Risk', value: students.filter(s => (s.student_skill?.length ?? 0) < 2).length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map(stat => (
          <div key={stat.label} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
             <div className="flex items-center justify-between mb-4">
                <div className={`size-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center border border-transparent group-hover:border-current transition-all`}>
                  <stat.icon size={16} />
                </div>
                <ArrowUpRight size={14} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
             </div>
             <div className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1">{stat.label}</div>
             <div className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] text-center">
            <Search size={48} className="text-slate-200 mx-auto mb-6 animate-pulse" />
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Results Found</h3>
            <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mt-2">Try adjusting your search parameters.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((s, idx) => (
              <motion.div
                key={s.student_id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                  <GraduationCap size={100} className="text-amber-600" />
                </div>

                <div className="flex items-start justify-between mb-8">
                  <div className="size-16 rounded-2xl bg-amber-600/10 flex items-center justify-center text-amber-600 border border-amber-600/20 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-inner">
                    <span className="text-xl font-black">{s.name?.charAt(0) || 'S'}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[3px] mb-1">Institutional ID</span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">{s.roll_no || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter line-clamp-1 mb-1 group-hover:text-amber-600 transition-colors">{s.name}</h3>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Mail size={12} className="text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-400 line-clamp-1">{s.email}</span>
                       </div>
                       <div className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-black border border-amber-100">
                          {s.cgpa} CGPA
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                    <div>
                      <div className="text-[8px] font-black text-slate-300 uppercase tracking-[3px] mb-1">Branch Focus</div>
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-[2px] line-clamp-1">{s.branch || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-black text-slate-300 uppercase tracking-[3px] mb-1">Applications</div>
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-[2px] flex items-center gap-1">
                        {s.applications_count} Total · <span className="text-rose-500">{s.rejections_count} R</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-amber-50 group-hover:border-amber-100 transition-all cursor-pointer" onClick={() => handleOpenDetails(s)}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[3px]">Institutional Readiness</span>
                      <span className="text-[9px] font-black text-amber-600">{(s.student_skill?.length ?? 0) * 20}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(s.student_skill?.length ?? 0) * 20}%` }}
                        className="h-full bg-amber-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-amber-600/40" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px] line-clamp-1">{s.college || 'Career Institute'}</span>
                   </div>
                   {s.resume_url ? (
                     <button 
                       onClick={() => window.open(s.resume_url, '_blank')}
                       className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors text-[9px] font-black uppercase tracking-widest border border-emerald-100"
                     >
                       <FileText size={12} /> Resume
                     </button>
                   ) : (
                     <ChevronRight size={16} className="text-slate-200 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                   )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Student</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Academic Details</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Skills Portfolio</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[3px] text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filtered.map((s) => (
                   <tr key={s.student_id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-amber-600/10 flex items-center justify-center text-amber-600 font-black text-xs border border-amber-600/20 group-hover:bg-amber-600 group-hover:text-white transition-all">
                               {s.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                               <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{s.name}</div>
                               <div className="text-[10px] font-bold text-slate-400">{s.roll_no || 'No ID'} • {s.email}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="text-[10px] font-black text-slate-600 uppercase tracking-[2px] mb-1">{s.branch}</div>
                         <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.college}</div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-4">
                            <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                               <div className="h-full bg-amber-500" style={{ width: `${(s.student_skill?.length ?? 0) * 20}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase">{(s.student_skill?.length ?? 0)} Skills</span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          (s.student_skill?.length ?? 0) > 4 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {(s.student_skill?.length ?? 0) > 4 ? 'Elite Ready' : 'Active'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         {s.resume_url && (
                           <button 
                             onClick={() => window.open(s.resume_url, '_blank')}
                             className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors mr-2 inline-flex"
                             title="View Resume"
                           >
                              <FileText size={18} />
                           </button>
                         )}
                         <button className="p-2 rounded-lg text-slate-300 hover:text-slate-900 transition-colors inline-flex">
                            <MoreVertical size={18} />
                         </button>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}
    </div>

    {/* Detail Modal Overlay */}
    <AnimatePresence>
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={() => setSelectedStudent(null)}
             className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl"
           />
           
           <motion.div 
             initial={{ opacity: 0, scale: 0.9, y: 40 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.9, y: 40 }}
             className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
           >
              <div className="p-8 lg:p-12 border-b border-slate-50 flex items-start justify-between">
                 <div className="flex gap-6 items-center">
                    <div className="size-20 rounded-[2rem] bg-amber-600 text-white flex items-center justify-center text-3xl font-black shadow-xl">
                       {selectedStudent.name.charAt(0)}
                    </div>
                    <div className="space-y-1">
                       <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{selectedStudent.name}</h2>
                       <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <span>{selectedStudent.roll_no}</span>
                          <span className="opacity-20">|</span>
                          <span>{selectedStudent.cgpa} CGPA</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setSelectedStudent(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                    <AlertCircle size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 bg-slate-50/30">
                 {loadingDetails ? (
                   <div className="py-20 flex flex-col items-center justify-center gap-4">
                      <Activity className="text-amber-600 animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-[5px] text-slate-400">Synchronizing Activity Data...</span>
                   </div>
                 ) : studentDetails && (
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-8">
                         <div className="space-y-4">
                           <h3 className="text-[10px] font-black uppercase tracking-[5px] text-slate-400">Live Application Stream</h3>
                           <div className="space-y-3">
                              {(studentDetails.applications || []).map((app: any) => (
                                <div key={app.application_id} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
                                   <div>
                                      <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{app.internship?.title}</div>
                                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{app.internship?.company?.company_name}</div>
                                   </div>
                                   <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                                      app.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                      app.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                      'bg-amber-50 text-amber-600 border-amber-100'
                                   }`}>
                                      {app.status}
                                   </div>
                                </div>
                              ))}
                              {(!studentDetails.applications || studentDetails.applications.length === 0) && (
                                <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-[10px] font-black uppercase tracking-widest">No Active Applications Found</div>
                              )}
                           </div>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div className="space-y-4">
                           <h3 className="text-[10px] font-black uppercase tracking-[5px] text-slate-400">Institutional Signals</h3>
                           <div className="space-y-3">
                              {(studentDetails.notifications || []).slice(0, 5).map((n: any) => (
                                <div key={n.notification_id} className="p-5 bg-white/60 rounded-2xl border border-slate-50 flex gap-4">
                                   <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                      <Activity size={14} className="text-slate-400" />
                                   </div>
                                   <div>
                                      <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight mb-1">{n.title}</div>
                                      <p className="text-[10px] font-medium text-slate-500 leading-relaxed">{n.message}</p>
                                   </div>
                                </div>
                              ))}
                           </div>
                         </div>
                      </div>
                   </div>
                 )}
              </div>
              
              <div className="p-8 lg:p-12 border-t border-slate-50 bg-slate-50/50 flex justify-end">
                 <button 
                   onClick={() => setSelectedStudent(null)}
                   className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[3px] rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95"
                 >
                    Dismiss Intelligence
                 </button>
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
