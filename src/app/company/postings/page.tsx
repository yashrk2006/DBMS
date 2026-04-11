'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Plus, X, MapPin, Calendar, IndianRupee, Users, Trash2, TrendingUp, CheckCircle2, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface Posting {
  internship_id: number;
  title: string;
  description: string;
  duration: string;
  location: string;
  stipend: string;
  min_cgpa: number;
  application: { application_id: number; status: string }[];
}

export default function JobPostings() {
  const router = useRouter();
  const [postings, setPostings] = useState<Posting[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({ title: '', description: '', duration: '', location: '', stipend: '', skills: '', min_cgpa: '0.0' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchPostings() {
      const { data: { session } } = await supabase.auth.getSession();
      const storedId = session?.user?.id;
      
      if (!storedId) {
        setLoading(false);
        router.push('/auth/login');
        return;
      }
      setCompanyId(storedId);

      try {
        const [internRes, companyRes] = await Promise.all([
          fetch(`/api/company/internships?companyId=${storedId}`),
          supabase.from('company').select('is_verified').eq('company_id', storedId).single()
        ]);
        
        const internData = await internRes.json();
        if (internData.success) {
          setPostings(internData.data || []);
        }

        if (companyRes.data) {
          setIsVerified(companyRes.data.is_verified);
        }
      } catch (e) {
        console.error('Failed to fetch data:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchPostings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    setIsSubmitting(true);

    const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s !== '');

    try {
      const res = await fetch('/api/company/internships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, ...formData, skills: skillsArray })
      });
      const data = await res.json();
      if (data.success) {
        setPostings([{ ...data.data, application: [] }, ...postings]);
        setIsModalOpen(false);
        setFormData({ title: '', description: '', duration: '', location: '', stipend: '', skills: '', min_cgpa: '0.0' });
      }
    } catch (e) {
      console.error('Insert error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (internship_id: number) => {
    if (!confirm('Delete this posting? All associated applications will also be removed.')) return;
    setDeletingId(internship_id);
    try {
      const res = await fetch(`/api/company/internships?id=${internship_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPostings(prev => prev.filter(p => (p as any).id !== internship_id && p.internship_id !== internship_id));
      }
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const totalApps = postings.reduce((sum, p) => sum + p.application.length, 0);
  const totalHired = postings.reduce((sum, p) => sum + p.application.filter(a => a.status === 'Accepted').length, 0);

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Job Postings</h1>
          <p className="text-slate-500 font-medium mt-1">Manage and publish new internship opportunities.</p>
        </div>
        <button 
          onClick={() => {
            if (!isVerified) {
              toast.error("Organization verification pending. Access restricted.", { icon: "🔒" });
              return;
            }
            setIsModalOpen(true);
          }}
          className={`${isVerified ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-slate-400 cursor-not-allowed opacity-70'} text-white px-7 py-3.5 rounded-2xl font-black text-sm tracking-[3px] uppercase shadow-lg active:scale-95 transition-all flex items-center gap-3`}
        >
          <Plus size={18} />
          New Posting
        </button>
      </header>

      {/* Summary Stats */}
      {postings.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Live Postings', value: postings.length, icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
            { label: 'Total Applicants', value: totalApps, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
            { label: 'Confirmed Hires', value: totalHired, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          ].map(stat => (
            <div key={stat.label} className={`bg-white p-6 rounded-2xl border ${stat.border} shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-black uppercase tracking-[2px] text-slate-400">{stat.label}</span>
                <div className={`size-8 rounded-lg ${stat.bg} border ${stat.border} flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={14} />
                </div>
              </div>
              <div className={`text-3xl font-black tracking-tighter ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Postings Grid */}
      {loading ? (
        <div className="flex justify-center p-20">
          <div className="size-6 rounded-full border-4 border-amber-600/30 border-t-amber-600 animate-spin" />
        </div>
      ) : postings.length === 0 ? (
        <div className="bg-white border text-center border-dashed border-slate-200 rounded-[2rem] p-20 flex flex-col items-center justify-center">
          <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
            <Briefcase size={32} />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-2">No Active Postings</h3>
          <p className="text-slate-400 max-w-sm text-sm">You haven&apos;t published any internships yet. Create your first posting to start attracting top talent.</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {postings.map((job) => {
              const appCount = job.application?.length || 0;
              const accepted = (job.application || []).filter(a => a.status === 'Accepted').length;
              const pending = (job.application || []).filter(a => a.status === 'Pending' || a.status === 'Under Review').length;
              const rejected = (job.application || []).filter(a => a.status === 'Rejected').length;
              const acceptRate = appCount > 0 ? Math.round((accepted / appCount) * 100) : 0;

              return (
                <motion.div
                  key={job.internship_id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-amber-200 transition-all group flex flex-col overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-6 pb-0">
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div className="size-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <Briefcase size={20} />
                      </div>
                      <button
                        onClick={() => handleDelete(job.internship_id)}
                        disabled={deletingId === job.internship_id}
                        className="size-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        {deletingId === job.internship_id ? (
                          <div className="size-3 rounded-full border border-red-400 border-t-transparent animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1 line-clamp-1 group-hover:text-amber-600 transition-colors">{job.title}</h3>
                    <p className="text-slate-400 text-xs line-clamp-2 mb-5 leading-relaxed">{job.description}</p>

                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                        <MapPin size={13} className="text-slate-300 shrink-0" /> {job.location || 'Remote'}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                        <Calendar size={13} className="text-slate-300 shrink-0" /> {job.duration || 'Flexible'}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-amber-600 font-black">
                        <IndianRupee size={13} className="shrink-0" /> {job.stipend || 'Unpaid'}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-indigo-600 font-black">
                        <TrendingUp size={13} className="shrink-0" /> Min {job.min_cgpa || '0.0'} CGPA
                      </div>
                    </div>
                  </div>

                  {/* Per-Posting Analytics Section */}
                  <div className="mt-auto border-t border-slate-100 bg-slate-50/50 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[3px]">
                      <BarChart3 size={11} className="text-amber-600" /> Posting Analytics
                    </div>

                    {/* Applicant breakdown */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Applied', value: appCount, color: 'text-slate-700' },
                        { label: 'Active', value: pending, color: 'text-amber-600' },
                        { label: 'Hired', value: accepted, color: 'text-emerald-600' },
                      ].map(m => (
                        <div key={m.label} className="bg-white rounded-xl border border-slate-100 p-2.5 text-center">
                          <div className={`text-lg font-black tracking-tighter ${m.color}`}>{m.value}</div>
                          <div className="text-[8px] font-black uppercase tracking-[2px] text-slate-400">{m.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Acceptance rate bar */}
                    {appCount > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[2px] text-slate-400 mb-1.5">
                          <span>Acceptance Rate</span>
                          <span className="text-emerald-600">{acceptRate}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${acceptRate}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Status badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg uppercase tracking-widest">
                        ● Active
                      </span>
                      {rejected > 0 && (
                        <span className="text-[9px] font-bold text-slate-400">{rejected} declined</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Create Posting Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-7 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">New Posting</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Publish a new internship role</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="size-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400">Job Title *</label>
                  <input required placeholder="e.g. Frontend React Engineer"
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full h-13 px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all font-bold text-slate-900 text-sm" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400">Description *</label>
                  <textarea required rows={3} placeholder="Describe the responsibilities, tech stack, and ideal candidate..."
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all font-medium text-slate-900 text-sm resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400">Location *</label>
                    <input required placeholder="e.g. Bengaluru, Remote"
                      value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                      className="w-full h-13 px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all font-bold text-slate-900 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400">Duration *</label>
                    <input required placeholder="e.g. 6 Months"
                      value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})}
                      className="w-full h-13 px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all font-bold text-slate-900 text-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400">Technical Skills Required (Comma separated) *</label>
                  <input required placeholder="e.g. Next.js, Python, AWS, Docker"
                    value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})}
                    className="w-full h-13 px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all font-bold text-slate-900 text-sm" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400">Stipend / Compensation *</label>
                    <input required placeholder="e.g. ₹30,000 / month"
                      value={formData.stipend} onChange={e => setFormData({...formData, stipend: e.target.value})}
                      className="w-full h-13 px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all font-bold text-slate-900 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400">Min CGPA Required *</label>
                    <input required type="number" step="0.01" min="0" max="10" placeholder="e.g. 8.5"
                      value={formData.min_cgpa} onChange={e => setFormData({...formData, min_cgpa: e.target.value})}
                      className="w-full h-13 px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-600 transition-all font-bold text-slate-900 text-sm" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-8 py-3 rounded-xl font-black text-sm tracking-[3px] uppercase shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2 min-w-[140px]">
                    {isSubmitting ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={16} /> Publish Role</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
