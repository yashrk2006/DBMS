'use client';

import { useState } from 'react';
import { 
  X, Plus, Target, Clock, MapPin, 
  DollarSign, FileText, Sparkles, Activity,
  Database, Zap, Brain, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useDBMS } from '@/context/DBMSContext';

interface CreateInternshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  companyId: string;
}

export default function CreateInternshipModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  companyId 
}: CreateInternshipModalProps) {
  const { addTrace } = useDBMS();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    stipend: '',
    location: '',
    min_cgpa: '',
    required_skills: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const skillsArray = formData.required_skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s !== '');

      const res = await fetch('/api/internships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company_id: companyId,
          min_cgpa: parseFloat(formData.min_cgpa) || 0,
          required_skills: skillsArray
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Internship synchronized to cluster.");
        
        // DBMS TRACE: Internship Deployment
        addTrace({
          operation: 'INSERT',
          table: 'internship',
          description: `Deploy new talent requirement node for ${formData.title}`,
          sql: `BEGIN;\nINSERT INTO internship (title, description, duration, stipend, location, company_id)\nVALUES ('${formData.title}', '${formData.description.slice(0, 30)}...', '${formData.duration}', '${formData.stipend}', '${formData.location}', '${companyId}');\n-- Mapping ${skillsArray.length} skill constraints\nINSERT INTO internship_skill (internship_id, skill_id)\nSELECT ${data.data.internship_id}, skill_id FROM skill WHERE skill_name = ANY(ARRAY${JSON.stringify(skillsArray)});\nCOMMIT;`
        });

        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(data.error || "Deployment failed.");
      }
    } catch (err) {
      toast.error("Cluster connection failure.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Database size={120} />
            </div>
            
            <div className="relative flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                    <Plus size={20} className="text-white" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Requirement Deployment</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Post New Internship</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Position Title</label>
                <div className="relative group">
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Full Stack Developer (Next.js)"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300 group-focus-within:text-purple-600 transition-colors" />
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Remote / Bangalore"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stipend (Monthly)</label>
                <div className="relative group">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                  <input 
                    required
                    type="text"
                    placeholder="e.g. ₹25,000 / $500"
                    value={formData.stipend}
                    onChange={e => setFormData({ ...formData, stipend: e.target.value })}
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration</label>
                <div className="relative group">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300 group-focus-within:text-amber-600 transition-colors" />
                  <input 
                    required
                    type="text"
                    placeholder="e.g. 6 Months"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min. CGPA Audit</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300 group-focus-within:text-rose-600 transition-colors" />
                  <input 
                    type="number"
                    step="0.1"
                    placeholder="e.g. 8.5"
                    value={formData.min_cgpa}
                    onChange={e => setFormData({ ...formData, min_cgpa: e.target.value })}
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description & Role Impact</label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-4 size-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                  <textarea 
                    required
                    rows={4}
                    placeholder="Describe the technical challenges and growth opportunities..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 resize-none"
                  />
                </div>
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Required Skill Clusters (Comma Separated)</label>
                <div className="relative group">
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    type="text"
                    placeholder="e.g. React, Node.js, TypeScript, PostgreSQL"
                    value={formData.required_skills}
                    onChange={e => setFormData({ ...formData, required_skills: e.target.value })}
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
                <p className="text-[9px] text-slate-400 flex items-center gap-1 mt-1 font-medium">
                  <Sparkles size={10} className="text-indigo-400" />
                  Skills will be automatically mapped to the institutional graph for talent discovery.
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 h-12 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all font-sans"
              >
                Sync Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-10 h-12 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-500/20 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group font-sans"
              >
                {loading ? (
                  <Activity size={16} className="animate-spin" />
                ) : (
                  <Zap size={16} className="group-hover:scale-110 transition-transform" />
                )}
                Initialize Deployment
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
