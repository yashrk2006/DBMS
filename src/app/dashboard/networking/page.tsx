'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useDBMS } from '@/context/DBMSContext';
import { Users, Search, Globe, ShieldCheck, MailPlus, Loader2, ArrowUpRight, GraduationCap } from 'lucide-react';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { toast } from 'react-hot-toast';

interface Peer {
  id: string;
  name: string;
  rollNo: string;
  college: string;
  branch: string;
  graduationYear: number | string;
  profileStrength: number;
  skills: string[];
}

export default function NetworkingPage() {
  const { addTrace } = useDBMS();
  const [peers, setPeers] = useState<Peer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectingTo, setConnectingTo] = useState<string | null>(null);

  useEffect(() => {
    async function loadNetwork() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        
        if (!userId) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/dashboard/networking?userId=${userId}`);
        const data = await res.json();
        
        if (data.success) {
          setPeers(data.peers);
          
          addTrace({
            operation: 'SELECT',
            table: 'student',
            description: 'Synchronize peer intelligence directory and institutional skill matrix.',
            sql: `SELECT name, roll_no, email, skills FROM student WHERE roll_no IS NOT NULL;`
          });
        } else {
          toast.error("Failed to connect with peers.");
        }
      } catch (err) {
        console.error("Networking Load Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNetwork();
  }, []);

  const handleConnect = (peerId: string, peerName: string) => {
    setConnectingTo(peerId);
    setTimeout(() => {
      toast.success(`Connection request sent to ${peerName}.`, { icon: "🔗" });
      setConnectingTo(null);
    }, 800);
  };

  const filteredPeers = useMemo(() => {
    const rawQuery = searchQuery || '';
    if (!rawQuery.trim()) return peers;
    
    const q = rawQuery.trim().toLowerCase();
    return peers.filter(p => {
      const safeName = String(p?.name || '').toLowerCase();
      const safeBranch = String(p?.branch || '').toLowerCase();
      const safeRollNo = String(p?.rollNo || '').toLowerCase();
      
      const nameMatch = safeName.includes(q);
      const branchMatch = safeBranch.includes(q);
      const rollMatch = safeRollNo.includes(q);
      const skillMatch = Array.isArray(p?.skills) 
        ? p.skills.some(s => String(s || '').toLowerCase().includes(q))
        : false;
        
      return nameMatch || branchMatch || rollMatch || skillMatch;
    });
  }, [peers, searchQuery]);

  return (
    <div className="space-y-12 p-6 lg:p-10 max-w-7xl mx-auto pb-24">
      <AnimatedSection direction="up" distance={40}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-4">
               <div className="size-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-sm border border-cyan-100">
                  <Globe size={18} />
               </div>
               <h2 className="text-[10px] font-black uppercase tracking-[8px] text-slate-400">Student Network</h2>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tight uppercase leading-[0.9]">
              Peer<br /><span className="text-cyan-600">Hub.</span>
            </h1>
            <p className="max-w-xl text-slate-500 font-medium text-lg leading-relaxed mt-6 uppercase tracking-tight">Expand your career connections and network with skilled students.</p>
          </div>
          
          <div className="hidden lg:flex flex-col items-end">
             <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 min-w-[200px] text-right">
                <div className="text-4xl font-black text-slate-900">{loading ? '-' : peers.length}</div>
                <div className="text-[10px] font-black tracking-[3px] text-slate-400 uppercase mt-1">Active Students</div>
             </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Directory Engine */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-soft">
        
        {/* Search Matrix */}
        <div className="mb-10 row-start-1 col-span-full z-20">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-3 block ml-2">Search Students</label>
          <div className="relative group">
             <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
             </div>
             <input 
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-slate-50/50 border border-slate-200 rounded-[1.5rem] pl-14 pr-6 py-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all placeholder:text-slate-400"
               placeholder="Search by Name, Branch, or Skill (e.g. 'React')"
             />
             <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm flex items-center gap-2">
                     <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none translate-y-[1px]">Live</span>
                 </div>
             </div>
          </div>
        </div>

        {/* Peer Grid */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Loader2 size={48} className="text-cyan-500 animate-spin mb-6" />
                <p className="text-xs font-black uppercase tracking-[4px] text-slate-400">Loading Student Directory...</p>
            </div>
          ) : filteredPeers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                    <Users size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 mb-2">No students found</h3>
                <p className="text-slate-500 text-sm font-medium max-w-sm">Try adjusting your search criteria to find relevant students.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <AnimatePresence mode="popLayout">
                 {filteredPeers.map((peer, idx) => (
                   <motion.div
                     layout
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     transition={{ duration: 0.3, delay: idx * 0.05 }}
                     key={peer.id}
                     className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-[2rem] p-6 transition-all hover:shadow-lg hover:-translate-y-1 group relative overflow-hidden"
                   >
                     {/* Profile Strength Badge absolute top right */}
                     <div className="absolute top-6 right-6 bg-white px-3 py-1.5 border border-slate-200 rounded-full shadow-sm flex items-center gap-1.5 z-10">
                        <ArrowUpRight size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black tracking-widest text-slate-700">{peer.profileStrength}% Profile Strength</span>
                     </div>

                     <div className="flex items-start gap-4 mb-6 relative z-10">
                        <div className="size-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-md">
                           {peer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 pt-1 border-r border-transparent pr-12">
                           <div className="flex items-center gap-2">
                              <h3 className="text-lg font-black text-slate-900 truncate">{peer.name}</h3>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded tracking-widest">{peer.rollNo}</span>
                           </div>
                           <div className="flex items-center gap-1 text-slate-500 mt-1">
                              <GraduationCap size={14} />
                              <span className="text-xs font-semibold truncate uppercase tracking-widest">{peer.branch} • '{String(peer.graduationYear).slice(-2)}</span>
                           </div>
                        </div>
                     </div>

                     {/* Skills Badges */}
                     <div className="mb-8 flex flex-wrap gap-2 relative z-10">
                        {peer.skills.map((skill, i) => (
                           <div key={i} className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase shadow-sm">
                             {skill}
                           </div>
                        ))}
                     </div>

                     {/* Action Line */}
                     <button 
                       onClick={() => handleConnect(peer.id, peer.name)}
                       disabled={connectingTo === peer.id}
                       className="w-full bg-white hover:bg-slate-900 border border-slate-200 hover:border-slate-900 text-slate-900 hover:text-white transition-all py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[3px] flex items-center justify-center gap-2 group-hover:shadow-md disabled:opacity-50"
                     >
                       {connectingTo === peer.id ? (
                         <><Loader2 size={16} className="animate-spin" /> Connecting...</>
                       ) : (
                         <><MailPlus size={16} className="text-cyan-600 group-hover:text-cyan-400 transition-colors" /> Send Request</>
                       )}
                     </button>

                     {/* Ambient decorative gradient */}
                     <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-100/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
