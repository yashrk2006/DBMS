'use client';

import { useEffect, useState } from 'react';
import { 
  Users, Search, Download, Filter, 
  ArrowRight, Mail, Phone, MapPin, 
  FileText, CheckCircle2, XCircle, 
  Clock, Sparkles, Brain, Cpu, 
  Fingerprint, Activity, BarChart3,
  TrendingUp, Globe, Briefcase, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useDBMS } from '@/context/DBMSContext';
import ApplicantDetailModal from '@/components/company/ApplicantDetailModal';
import { EnrichedCompanyApplication } from '@/types';

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<EnrichedCompanyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedApplicant, setSelectedApplicant] = useState<EnrichedCompanyApplication | null>(null);
  const { addTrace } = useDBMS();

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const companyId = session?.user?.id;
    if (!companyId) return;

    try {
      // Corrected API endpoint to match folder structure
      const res = await fetch(`/api/company/applications?company_id=${companyId}`);
      const data = await res.json();
      if (data.success) {
        setApplicants(data.data);
      }
    } catch (e) {
      toast.error("Failed to sync pipeline data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/company/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Candidate transition: ${newStatus}`, { icon: '🚀' });
        
        // DBMS TRACE
        addTrace({
          operation: 'UPDATE',
          table: 'application',
          description: `Strategic status transition for candidate dossier`,
          sql: `UPDATE application SET status = '${newStatus}' WHERE application_id = '${id}';`
        });

        loadData();
      }
    } catch (e) {
      toast.error("Transition failed");
    }
  };

  const filtered = applicants.filter(a => {
    const matchesSearch = a.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.student_roll_no?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-8">
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-emerald-600"
      >
        <Brain size={64} fill="currentColor" />
      </motion.div>
      <div className="text-center">
        <h2 className="text-[10px] font-black uppercase tracking-[10px] text-emerald-600 mb-2">Syncing Pipeline</h2>
        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[5px] animate-pulse">Accessing Secure Recruitment Intelligence Cluster</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="size-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                <Cpu size={14} />
             </div>
             <h2 className="text-[10px] font-black uppercase tracking-[6px] text-slate-400">Pipeline Intelligence</h2>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8]">Talent<br/><span className="text-emerald-600">Hub.</span></h1>
          <p className="text-slate-500 font-medium">{applicants.length} verified candidates · <span className="text-emerald-600 font-black">{applicants.filter(a => a.status === 'Pending').length}</span> awaiting audit</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
           <div className="relative group w-full md:w-[320px]">
              <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
              <input 
                type="text" placeholder="FILTER BY IDENTITY..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-[1.25rem] outline-none text-[10px] font-black uppercase tracking-[2px] focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all shadow-sm"
              />
           </div>
           <div className="relative group w-full md:w-[200px]">
              <Filter size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
              <select 
                value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-14 pl-12 pr-6 bg-white border border-slate-100 rounded-[1.25rem] text-[9px] font-black uppercase tracking-[2px] focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 outline-none appearance-none cursor-pointer shadow-sm"
              >
                <option value="ALL">ALL STATES</option>
                <option value="APPLIED">APPLIED</option>
                <option value="INTERVIEWING">INTERVIEWING</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {filtered.map((applicant, idx) => (
            <motion.div
              key={applicant.application_id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-sm hover:shadow-2xl transition-all"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                   <div className="size-14 rounded-2xl bg-slate-900 border-4 border-white shadow-xl flex items-center justify-center text-white text-xl font-black group-hover:bg-emerald-600 transition-colors">
                      {applicant.student_name.charAt(0)}
                   </div>
                   <div>
                      <h3 className="font-black text-slate-900 tracking-tight text-lg uppercase leading-none mb-1 group-hover:text-emerald-600 transition-colors">
                        {applicant.student_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 tracking-widest">{applicant.student_roll_no}</span>
                      </div>
                   </div>
                </div>
                <div className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[2px] border ${
                  applicant.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  applicant.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                  applicant.status === 'Interviewing' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                  'bg-slate-50 text-slate-400 border-slate-100'
                }`}>
                  {applicant.status}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                   <div className="flex justify-between items-end mb-2">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">AI Match Score</span>
                     <span className="text-lg font-black text-emerald-600">{applicant.match_score}%</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${applicant.match_score}%` }}
                        className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      />
                   </div>
                </div>

                <div className="flex items-center gap-3">
                   <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <Target size={14} className="text-slate-400" />
                   </div>
                   <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                      {applicant.role_title}
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between gap-4">
                  <button 
                    onClick={() => setSelectedApplicant(applicant)}
                    className="flex-1 h-12 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[3px] flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg"
                  >
                    View Dossier <ArrowRight size={14} />
                  </button>
                  
                  {(applicant.status === 'Pending' || applicant.status === 'Under Review') && (
                    <div className="flex gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStatusUpdate(applicant.application_id, 'ACCEPTED')}
                        className="size-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm"
                      >
                         <CheckCircle2 size={18} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStatusUpdate(applicant.application_id, 'REJECTED')}
                        className="size-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm"
                      >
                         <XCircle size={18} />
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="py-40 text-center bg-white/40 backdrop-blur-md rounded-[3rem] border border-dashed border-slate-200">
           <div className="size-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-8 border border-white">
              <Users size={40} />
           </div>
           <h3 className="text-2xl font-black text-slate-300 uppercase tracking-[10px] leading-none mb-4">Pipeline Dry</h3>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Filter parameters returned zero candidate clusters</p>
        </div>
      )}

      {selectedApplicant && (
        <ApplicantDetailModal 
          applicant={selectedApplicant} 
          isOpen={!!selectedApplicant}
          onClose={() => setSelectedApplicant(null)} 
          onStatusUpdate={() => loadData()}
        />
      )}
    </div>
  );
}
