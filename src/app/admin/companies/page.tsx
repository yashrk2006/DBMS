'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, ShieldCheck, ShieldAlert, Search, 
  ExternalLink, Mail, MapPin, ArrowLeft, ArrowUpRight,
  Globe, Fingerprint, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface Company {
  company_id: string;
  name: string;
  email: string;
  industry: string;
  location: string;
  website: string;
  is_verified: boolean;
  created_at: string;
}

export default function AdminCompanies() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      try {
        const res = await fetch('/api/admin/companies');
        const data = await res.json();
        if (data.success) {
          setCompanies(data.data);
        }
      } catch (e) {
        toast.error("Failed to fetch organizations");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const toggleVerification = async (companyId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, is_verified: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setCompanies(prev => prev.map(c => c.company_id === companyId ? { ...c, is_verified: newStatus } : c));
        toast.success(newStatus ? "Organization Verified" : "Verification Revoked", {
          icon: newStatus ? "🛡️" : "⚠️"
        });
      }
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const filteredCompanies = companies.filter(c => 
    (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-8">
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-indigo-600"
      >
        <Building2 size={64} fill="currentColor" />
      </motion.div>
      <div className="text-center">
        <h2 className="text-[10px] font-black uppercase tracking-[10px] text-indigo-600 mb-2">Syncing Entities</h2>
        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[5px] animate-pulse">Accessing Secure Corporate Registry</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-100">
        <div className="space-y-4">
          <button 
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Back to Command Hub
          </button>
          <div className="flex items-center gap-3">
             <div className="size-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                <Fingerprint size={14} />
             </div>
             <h2 className="text-[10px] font-black uppercase tracking-[6px] text-slate-400">Governance & Provisions</h2>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Corporate Registry</h1>
        </div>
        
        <div className="relative group w-full md:w-[450px]">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text"
            placeholder="FILTER BY ENTITY OR ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 md:h-16 pl-16 pr-8 bg-white border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none text-[10px] font-black uppercase tracking-[2px] shadow-sm transition-all shadow-indigo-600/5 placeholder:text-slate-300"
          />
        </div>
      </header>

      {/* Corporate KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Entities', value: companies.length, icon: Building2, color: 'text-slate-700', bg: 'bg-slate-50' },
          { label: 'Verified Cluster', value: companies.filter(c => c.is_verified).length, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Pending Audit', value: companies.filter(c => !c.is_verified).length, icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Cloud Activity', value: 'High', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
          >
             <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <stat.icon size={80} />
             </div>
             <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`size-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center border border-transparent group-hover:border-current transition-all shadow-inner`}>
                  <stat.icon size={16} />
                </div>
                {stat.label === 'Cloud Activity' && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                     <div className="size-1 rounded-full bg-emerald-500 animate-ping" />
                     <span className="text-[8px] font-black uppercase tracking-widest">Active Sync</span>
                  </div>
                )}
             </div>
             <div className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-1 relative z-10">{stat.label}</div>
             <div className={`text-3xl font-black tracking-tighter ${stat.color} relative z-10`}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredCompanies.map((company, idx) => (
            <motion.div 
              key={company.company_id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all pointer-events-none">
                <Building2 size={160} />
              </div>

              <div className="relative z-10 space-y-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    <div className="size-16 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center text-2xl font-black shadow-xl ring-4 ring-slate-900/10 group-hover:scale-110 transition-transform duration-500">
                      {company.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">{company.name}</h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{company.industry || 'Technology Cluster'}</span>
                        <div className="size-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">EST. {new Date(company.created_at).getFullYear()}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-[3px] shadow-sm transition-all ${
                    company.is_verified 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                      : 'bg-amber-50 border-amber-100 text-amber-600'
                  }`}>
                    {company.is_verified ? '● Verified' : '○ Pending'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-white/50 p-6 rounded-[2rem] border border-white/50">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer">
                      <div className="size-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                        <Mail size={12} className="text-slate-300" /> 
                      </div>
                      <span className="truncate max-w-[120px]">{company.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                      <div className="size-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                        <MapPin size={12} className="text-slate-300" />
                      </div>
                      {company.location || 'Distributed'}
                    </div>
                  </div>
                  <div className="flex justify-end items-end">
                    <motion.a 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="size-12 bg-white border border-slate-100 rounded-[1.25rem] flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <Globe size={18} />
                    </motion.a>
                  </div>
                </div>

                <div className="pt-2 flex gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleVerification(company.company_id, company.is_verified)}
                    className={`flex-1 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[4px] transition-all flex items-center justify-center gap-3 shadow-xl ${
                      company.is_verified 
                        ? 'bg-slate-900 text-white hover:bg-rose-600 shadow-slate-950/20' 
                        : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
                    }`}
                  >
                    {company.is_verified ? (
                      <><ShieldAlert size={15} /> Revoke Cluster Access</>
                    ) : (
                      <><ShieldCheck size={15} /> Provision Infrastructure</>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredCompanies.length === 0 && (
        <div className="py-40 text-center bg-white/40 backdrop-blur-md rounded-[3rem] border border-dashed border-slate-200">
           <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-6">
              <Building2 size={32} />
           </div>
           <h3 className="text-xl font-black text-slate-300 uppercase tracking-[10px] leading-none mb-4">Registry Empty</h3>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Audit parameters returned zero entities</p>
        </div>
      )}
    </div>
  );
}
