'use client';

import { 
  X, User, Mail, GraduationCap, Award, 
  Target, Sparkles, Brain, Cpu, Fingerprint,
  CheckCircle2, XCircle, Clock, FileText, Send,
  Activity, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useDBMS } from '@/context/DBMSContext';
import { EnrichedCompanyApplication } from '@/types';
import { useState } from 'react';

interface ApplicantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: EnrichedCompanyApplication | null;
  onStatusUpdate?: (newStatus: string) => void;
}

export default function ApplicantDetailModal({ 
  isOpen, 
  onClose, 
  applicant,
  onStatusUpdate
}: ApplicantDetailModalProps) {
  const { addTrace } = useDBMS();
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !applicant) return null;

  const handleStatusChange = async (status: string) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: applicant.application_id,
          status
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Application status synchronized to: ${status}`);
        
        // DBMS TRACE: Status Mutation
        addTrace({
          operation: 'UPDATE',
          table: 'application',
          description: `Transition application state to ${status} for ${applicant.student_name}`,
          sql: `UPDATE application \nSET status = '${status}' \nWHERE application_id = '${applicant.application_id}';`
        });

        if (onStatusUpdate) onStatusUpdate(status);
        onClose();
      } else {
        toast.error(data.error || "Update failed.");
      }
    } catch (err) {
      toast.error("Cluster transition failure.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-8 bg-slate-900 text-white relative flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="size-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-3xl font-black shadow-xl ring-4 ring-indigo-600/20">
                {applicant.student_name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-black tracking-tight uppercase">{applicant.student_name}</h2>
                  <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest">
                    ID: {applicant.application_id.slice(0, 8)}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5"><Fingerprint size={12} /> {applicant.student_roll_no}</span>
                  <span className="flex items-center gap-1.5"><Target size={12} /> {applicant.role_title}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-2xl transition-all"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Col: Dossier Details */}
            <div className="lg:col-span-7 space-y-8">
              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 mb-4 flex items-center gap-2">
                  <Cpu size={14} className="text-indigo-600" />
                  AI Intelligence Diagnostic
                </h3>
                <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <Brain size={120} />
                  </div>
                  
                  <div className="flex items-center gap-8 mb-8">
                    <div className="relative size-24">
                       <svg className="size-full" viewBox="0 0 36 36">
                         <path className="text-slate-200 stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                         <motion.path 
                           initial={{ pathLength: 0 }}
                           animate={{ pathLength: applicant.match_score / 100 }}
                           className="text-indigo-600 stroke-current" 
                           strokeWidth="3" 
                           strokeDasharray="100, 100" 
                           fill="none" 
                           d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                         />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-slate-900">{applicant.match_score}%</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Match</span>
                       </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 mb-1 uppercase">Strategic Alignment Score</h4>
                      <p className="text-xs font-bold text-slate-500 leading-relaxed">
                        Precision-mapped against role requirements and technical benchmarks.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                         <Sparkles size={12} className="text-amber-500" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">AI Summary</span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                        "{applicant.resume_analysis?.summary || 'No summary generated for this node.'}"
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 mb-4 flex items-center gap-2">
                  <Target size={14} className="text-purple-600" />
                  Skill Cluster Analysis
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(applicant.student_skills || []).map(skill => (
                    <div key={skill} className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-widest shadow-sm">
                      {skill}
                    </div>
                  ))}
                  {(!applicant.student_skills || applicant.student_skills.length === 0) && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No skill nodes detected.</span>
                  )}
                </div>
              </section>
            </div>

            {/* Right Col: Actions & Metadata */}
            <div className="lg:col-span-5 space-y-8">
              <section className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-900/20">
                 <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-500 mb-6 font-sans">Decision Console</h3>
                 
                 <div className="space-y-4">
                    <button 
                      onClick={() => handleStatusChange('Accepted')}
                      disabled={updating}
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 rounded-2xl flex items-center justify-between px-6 transition-all group shadow-lg shadow-emerald-900/20"
                    >
                      <span className="text-xs font-black uppercase tracking-widest">Approve Candidate</span>
                      <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                    </button>

                    <button 
                      onClick={() => handleStatusChange('Interviewing')}
                      disabled={updating}
                      className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl flex items-center justify-between px-6 transition-all group shadow-lg shadow-indigo-900/20"
                    >
                      <span className="text-xs font-black uppercase tracking-widest">Request Interview</span>
                      <Activity size={20} className="group-hover:rotate-12 transition-transform" />
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleStatusChange('Rejected')}
                        disabled={updating}
                        className="h-14 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center gap-3 transition-all"
                      >
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Decline</span>
                         <XCircle size={16} className="text-slate-500" />
                      </button>
                      <button 
                        disabled
                        className="h-14 bg-white/5 opacity-50 rounded-2xl border border-white/10 flex items-center justify-center gap-3 cursor-not-allowed"
                      >
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verify</span>
                         <ShieldCheck size={16} className="text-slate-500" />
                      </button>
                    </div>
                 </div>

                 <p className="mt-8 text-[9px] font-bold text-slate-500 text-center uppercase tracking-widest leading-relaxed">
                   Decision will be recorded in the DBMS audit log and notified to the student dashboard immediately.
                 </p>
              </section>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 ml-4">Communication</h3>
                <div className="flex gap-4">
                  <a href={`mailto:${applicant.student_email}`} className="flex-1 h-14 bg-slate-50 hover:bg-indigo-50 rounded-2xl border border-slate-100 flex items-center justify-center gap-3 transition-all group">
                    <Mail size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-600">Email</span>
                  </a>
                  <button className="flex-1 h-14 bg-slate-50 hover:bg-indigo-50 rounded-2xl border border-slate-100 flex items-center justify-center gap-3 transition-all group">
                    <Send size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-600">Message</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
