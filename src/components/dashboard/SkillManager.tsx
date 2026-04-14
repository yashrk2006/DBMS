'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, X, Search, Award, TrendingUp, Sparkles, 
  Trash2, ChevronRight, Activity, Cpu, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useDBMS } from '@/context/DBMSContext';

interface Skill {
  skill_id: string | number;
  skill_name: string;
  proficiency_level?: string;
}

interface SkillManagerProps {
  userId: string;
  onUpdate?: (count: number) => void;
}

const PROFICIENCY_LEVELS = [
  { label: 'Beginner', value: 'Beginner', color: 'bg-slate-100 text-slate-600' },
  { label: 'Intermediate', value: 'Intermediate', color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Advanced', value: 'Advanced', color: 'bg-purple-50 text-purple-600' },
  { label: 'Expert', value: 'Expert', color: 'bg-amber-50 text-amber-600' },
];

export function SkillManager({ userId, onUpdate }: SkillManagerProps) {
  const [studentSkills, setStudentSkills] = useState<Skill[]>([]);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  const [search, setSearch] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState('Intermediate');
  const [isAdding, setIsAdding] = useState(false);
  const { addTrace } = useDBMS();

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/skills?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setStudentSkills(data.studentSkills || []);
        setAvailableSkills(data.allSkills || []);
        setInsights(data.careerInsights || null);
        if (onUpdate) onUpdate(data.studentSkills?.length || 0);
      }
    } catch (err) {
      console.error("Skill sync failure:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, onUpdate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddSkill = async (skillName: string) => {
    setSyncing(true);
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          skillName,
          proficiencyLevel: selectedProficiency,
          action: 'add'
        })
      });
      const data = await res.json();
      if (data.success) {
        setStudentSkills(data.data);
        toast.success(`${skillName} synchronized to profile.`);
        setSearch('');
        setIsAdding(false);
        if (onUpdate) onUpdate(data.data.length);
        
        // DBMS TRACE: Add Skill
        addTrace({
          operation: 'INSERT',
          table: 'student_skill',
          description: `Associate new skill node with student profile`,
          sql: `BEGIN;\nINSERT INTO skill (skill_name) VALUES ('${skillName}') ON CONFLICT (skill_name) DO NOTHING;\nINSERT INTO student_skill (student_id, skill_id, proficiency_level) \nVALUES ('${userId}', (SELECT skill_id FROM skill WHERE skill_name = '${skillName}'), '${selectedProficiency}');\nCOMMIT;`
        });

        // Refresh insights
        loadData();
      }
    } catch (err) {
      toast.error("Cluster sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteSkill = async (skillName: string) => {
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          skillName,
          action: 'delete'
        })
      });
      const data = await res.json();
      if (data.success) {
        setStudentSkills(data.data);
        toast.success("Skill node decoupled.");
        if (onUpdate) onUpdate(data.data.length);
        
        // DBMS TRACE: Delete Skill
        addTrace({
          operation: 'DELETE',
          table: 'student_skill',
          description: `Decouple skill node from professional graph`,
          sql: `DELETE FROM student_skill \nWHERE student_id = '${userId}' \nAND skill_id = (SELECT skill_id FROM skill WHERE skill_name = '${skillName}');`
        });

        loadData();
      }
    } catch (err) {
      toast.error("De-provisioning failed.");
    }
  };

  const filteredAvailable = availableSkills.filter(s => 
    s.skill_name.toLowerCase().includes(search.toLowerCase()) && 
    !studentSkills.some(ss => ss.skill_name === s.skill_name)
  ).slice(0, 5);

  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center gap-4 bg-white/50 rounded-[2rem] border border-slate-100 animate-pulse">
       <Cpu className="text-slate-200 animate-spin" size={32} />
       <span className="text-[10px] font-black uppercase tracking-[5px] text-slate-300">Calibrating Skill DNA</span>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Skill Input Area */}
      <div className="relative group">
        <label className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 mb-3 block">Skill Ingestion Engine</label>
        <div className="relative">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text"
            placeholder="INGEST SKILL NAME (E.G. NEXT.JS, PYTHON)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsAdding(true)}
            className="w-full h-16 pl-16 pr-6 bg-white border border-slate-100 rounded-2xl md:rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 outline-none text-[10px] font-black uppercase tracking-[2px] shadow-sm transition-all"
          />
        </div>

        <AnimatePresence>
          {isAdding && search.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 top-full mt-3 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Suggestions</span>
                 <button onClick={() => setIsAdding(false)}><X size={14} className="text-slate-300" /></button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredAvailable.map((s) => (
                  <button
                    key={s.skill_id}
                    onClick={() => handleAddSkill(s.skill_name)}
                    className="w-full px-6 py-4 text-left hover:bg-indigo-50 transition-colors flex items-center justify-between group/item"
                  >
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{s.skill_name}</span>
                    <ChevronRight size={14} className="text-slate-200 group-hover/item:text-indigo-600 transform group-hover/item:translate-x-1 transition-all" />
                  </button>
                ))}
                {filteredAvailable.length === 0 && (
                  <button 
                    onClick={() => handleAddSkill(search)}
                    className="w-full px-6 py-6 text-left hover:bg-emerald-50 transition-colors flex items-center gap-4 group/new"
                  >
                    <div className="size-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                       <Plus size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Provision Custom Node: "{search}"</span>
                      <p className="text-[9px] font-bold text-emerald-600/60 uppercase mt-0.5">Automated Repository Expansion</p>
                    </div>
                  </button>
                )}
              </div>
              
              <div className="p-4 border-t border-slate-50 grid grid-cols-4 gap-2">
                 {PROFICIENCY_LEVELS.map(lev => (
                   <button
                    key={lev.value}
                    onClick={() => setSelectedProficiency(lev.value)}
                    className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                      selectedProficiency === lev.value ? lev.color + ' ring-2 ring-current ring-offset-2' : 'bg-slate-50 text-slate-400'
                    }`}
                   >
                     {lev.label}
                   </button>
                 ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Skills Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {studentSkills.map((s, idx) => {
            const levelConfig = PROFICIENCY_LEVELS.find(l => l.value === s.proficiency_level) || PROFICIENCY_LEVELS[1];
            return (
              <motion.div
                key={s.skill_id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    {s.skill_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">{s.skill_name}</h4>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md mt-1 inline-block ${levelConfig.color}`}>
                      {s.proficiency_level}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteSkill(s.skill_name)}
                  className="opacity-0 group-hover:opacity-100 size-9 rounded-xl bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-all flex items-center justify-center"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* AI Insights & Telemetry */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Activity size={80} />
             </div>
             <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="size-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <TrendingUp size={16} />
                   </div>
                   <h5 className="text-[10px] font-black uppercase tracking-[3px]">Reach Coefficient</h5>
                </div>
                <div>
                   <div className="text-4xl font-black tracking-tighter">{insights.marketReach}%</div>
                   <p className="text-[9px] font-medium text-white/60 uppercase tracking-widest mt-1">Opportunity Affinity Index</p>
                </div>
             </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden border border-white/5 shadow-xl">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Sparkles size={80} />
             </div>
             <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3 text-amber-400">
                   <div className="size-8 rounded-xl bg-amber-400/20 backdrop-blur-md flex items-center justify-center">
                      <Award size={16} />
                   </div>
                   <h5 className="text-[10px] font-black uppercase tracking-[3px]">AI Recommendation</h5>
                </div>
                <div>
                   <div className="text-2xl font-black tracking-tighter uppercase">{insights.nextBestSkill || 'Analyzing...'}</div>
                   <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-1">Recommended Upskill Node</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {studentSkills.length === 0 && !loading && (
        <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/30">
           <Cpu size={48} className="text-slate-200 mx-auto mb-6" />
           <p className="text-xs font-black text-slate-300 uppercase tracking-[5px]">Skill Matrix Depleted</p>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[3px] mt-2">Initialize nodes to activate matching algorithms</p>
        </div>
      )}
    </div>
  );
}
