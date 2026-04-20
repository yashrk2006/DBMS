'use client';

import { useEffect, useState } from 'react';
import { 
  Building2, Plus, Briefcase, Users, Search, 
  MapPin, Clock, Trash2, ArrowRight, Activity, 
  Sparkles, Globe, Target, Fingerprint, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useDBMS } from '@/context/DBMSContext';
import CreateInternshipModal from '@/components/company/CreateInternshipModal';

interface PostDetails {
  id: string;
  title: string;
  location: string;
  duration: string;
  stipend: string;
  created_at: string;
  application_count: number;
}

export default function PostingsPage() {
  const [posts, setPosts] = useState<PostDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cid, setCid] = useState('');
  const { addTrace } = useDBMS();

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const companyId = session?.user?.id;
    if (!companyId) return;
    setCid(companyId);

    try {
      const res = await fetch(`/api/company/postings?companyId=${companyId}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (e) {
      toast.error("Failed to sync records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to decommission this record? This action is irreversible.')) return;
    
    try {
      const res = await fetch(`/api/company/postings?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success("Record Decommissioned", { icon: '🗑️' });
        
        // DBMS TRACE: Decommission Posting
        addTrace({
          operation: 'DELETE',
          table: 'internship',
          description: `Permanent decommissioning of corporate opportunity node`,
          sql: `DELETE FROM internship \nWHERE id = '${id}';`
        });

        loadData();
      }
    } catch (e) {
      toast.error("Decommissioning failed");
    }
  };

  const filteredPosts = posts.filter(p => (p.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()));

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-8">
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-emerald-600"
      >
        <Target size={64} fill="currentColor" />
      </motion.div>
      <div className="text-center">
        <h2 className="text-[10px] font-black uppercase tracking-[10px] text-emerald-600 mb-2">Syncing Launchpad</h2>
        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[5px] animate-pulse">Accessing Secure Corporate Postings Cluster</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="size-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                <Fingerprint size={14} />
             </div>
             <h2 className="text-[10px] font-black uppercase tracking-[6px] text-slate-400">Opportunity Provisioning</h2>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-[0.8]">Opportunity<br/><span className="text-emerald-600">Launchpad.</span></h1>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
           <div className="relative group w-full md:w-[320px]">
              <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
              <input 
                type="text" placeholder="FILTER POSTINGS..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-[1.25rem] outline-none text-[10px] font-black uppercase tracking-[2px] focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all shadow-sm"
              />
           </div>
           <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto bg-slate-900 text-white px-8 h-14 rounded-[1.25rem] flex items-center justify-center gap-3 transition-all font-black text-[10px] uppercase tracking-[3px] shadow-xl hover:bg-emerald-600 shadow-slate-900/10 hover:shadow-emerald-600/20"
          >
            <Plus size={18} /> Provision New Role
          </motion.button>
        </div>
      </header>

      {/* Recruitment KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Postings', value: posts.length, icon: Briefcase, color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'Active Pipeline', value: posts.filter(p => p.application_count > 0).length, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Talent Inflow', value: posts.reduce((sum, p) => sum + p.application_count, 0), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Cluster Health', value: 'High', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-sm hover:shadow-xl transition-all group"
          >
             <div className="flex items-center justify-between mb-4">
                <div className={`size-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center border border-transparent group-hover:border-current transition-all`}>
                  <stat.icon size={16} />
                </div>
                <div className="flex items-center gap-2">
                   <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Live Metadata</span>
                </div>
             </div>
             <div className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1">{stat.label}</div>
             <div className={`text-3xl font-black tracking-tighter ${stat.color}`}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredPosts.map((post, idx) => (
            <motion.div 
              key={post.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white shadow-sm hover:shadow-2xl hover:border-emerald-200 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all pointer-events-none">
                <Plus size={160} className="text-emerald-900" />
              </div>

              <div className="relative z-10 flex flex-col h-full space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">Active Posting</span>
                     <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
                        <Clock size={10} /> {new Date(post.created_at).toLocaleDateString()}
                     </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tighter group-hover:text-emerald-600 transition-colors">
                    {post.title}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <div className="size-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                         <MapPin size={12} />
                      </div>
                      {post.location}
                   </div>
                   <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <div className="size-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                         <Activity size={12} />
                      </div>
                      {post.duration}
                   </div>
                   <div className="flex items-center gap-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      <div className="size-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-300">
                         <Sparkles size={12} />
                      </div>
                      {post.stipend}
                   </div>
                   <div className="flex items-center gap-3 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      <div className="size-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-300">
                         <Users size={12} />
                      </div>
                      {post.application_count} Applicants
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[2px] text-slate-400">
                      <span>Market Saturation</span>
                      <span className="text-emerald-600">{Math.min(100, post.application_count * 10)}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, post.application_count * 10)}%` }}
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      />
                   </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-50 mt-auto">
                   <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 h-14 rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-[3px] text-slate-900 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all shadow-sm flex items-center justify-center gap-3"
                   >
                      View Intelligence <ArrowRight size={14} />
                   </motion.button>
                   <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: '#fecaca', borderBlockColor: '#ef4444' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(post.id)}
                    className="size-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 hover:text-rose-600 transition-all shadow-sm group/del"
                   >
                      <Trash2 size={20} className="group-hover/del:scale-110 transition-transform" />
                   </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {posts.length === 0 && (
        <div className="py-40 text-center bg-white/40 backdrop-blur-md rounded-[3rem] border border-dashed border-slate-200">
           <div className="size-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-8 border border-white">
              <Briefcase size={40} />
           </div>
           <h3 className="text-2xl font-black text-slate-300 uppercase tracking-[10px] leading-none mb-4">No Active Records</h3>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Provision an opportunity to begin talent acquisition</p>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="mt-8 px-8 py-4 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[3px] hover:bg-emerald-600 transition-all shadow-xl"
           >
              Provision First Role
           </button>
        </div>
      )}

      {isModalOpen && (
        <CreateInternshipModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={async () => await loadData()}
          companyId={cid}
        />
      )}
    </div>
  );
}
