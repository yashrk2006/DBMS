'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Zap, Plus, Trash2, Search, BookOpen, Trophy, 
  Filter, CheckCircle2, Sparkles, TrendingUp, 
  Activity, Cpu, Terminal, Database, Layers, 
  ChevronRight, Target, Flame, Star, Lightbulb,
  ShieldCheck, BarChart3, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { supabase } from '@/lib/supabase';

interface Skill { skill_id: number; skill_name: string; category?: string; }
interface StudentSkill { skill_id: number; skill_name: string; proficiency_level: string; category?: string; }

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

const levelConfig: Record<string, { color: string, glow: string, bg: string, icon: any, progress: number }> = {
  'Beginner': { color: 'text-slate-400', glow: '', bg: 'bg-slate-100', icon: BookOpen, progress: 25 },
  'Intermediate': { color: 'text-amber-600', glow: 'shadow-amber-600/5', bg: 'bg-amber-50', icon: TrendingUp, progress: 50 },
  'Advanced': { color: 'text-amber-700', glow: 'shadow-amber-700/10', bg: 'bg-amber-100', icon: CheckCircle2, progress: 75 },
  'Expert': { color: 'text-amber-700', glow: 'shadow-amber-700/20', bg: 'bg-amber-200', icon: Trophy, progress: 100 },
};

export default function SkillsPage() {
  const router = useRouter();
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [mySkills, setMySkills] = useState<StudentSkill[]>([]);
  const [adding, setAdding] = useState(false);
  const [selectedSkillName, setSelectedSkillName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<typeof LEVELS[number]>('Beginner');
  const [aiSkillSuggestions, setAiSkillSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [matrixSearch, setMatrixSearch] = useState(''); // Local search for existing skills
  const [aiInsights, setAiInsights] = useState<{ marketReach: number, nextBestSkill: any } | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const storedUserId = session?.user?.id;
    
    if (!storedUserId) {
      setLoading(false);
      router.push('/auth/login');
      return;
    }
    try {
      const resp = await fetch(`/api/skills?userId=${storedUserId}`);
      const result = await resp.json();
      if (result.success) {
        setAllSkills(result.allSkills || []);
        setMySkills(result.studentSkills || []);
        setAiInsights(result.aiInsights);
        
        // Extract suggestions from AI Resume Analysis
        if (result.aiResumeAnalysis?.skills) {
          const existingNames = new Set(result.studentSkills.map((s: any) => s.skill_name.toLowerCase()));
          const suggestions = result.aiResumeAnalysis.skills.filter((s: string) => !existingNames.has(s.toLowerCase()));
          setAiSkillSuggestions(suggestions);
        }
      }
    } catch (err) {
      console.error('Failed to load skills:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addSkill = async () => {
    // Use either the selected skill from dropdown OR whatever is typed in the search box
    const skillToAdd = selectedSkillName || searchQuery.trim();
    if (!skillToAdd) { toast.error('Please type or select a skill first.'); return; }
    setAdding(true);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) { setAdding(false); return; }

    try {
      const resp = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, skillName: skillToAdd, proficiencyLevel: selectedLevel })
      });
      const result = await resp.json();
      if (result.success) {
        setMySkills(result.data);
        setSelectedSkillName('');
        setSearchQuery('');
        setAiSkillSuggestions(prev => prev.filter(s => s !== skillToAdd));
        toast.success(`${skillToAdd} added to your matrix!`);
      } else {
        toast.error(result.error || 'Failed to add skill.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const removeSkill = async (skillName: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    try {
      const resp = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, skillName, action: 'delete' })
      });
      const result = await resp.json();
      if (result.success) {
        setMySkills(result.data);
      }
    } catch (err) { console.error(err); }
  };

  const filteredSkills = useMemo(() => {
    if (!searchTerm) return [];
    return allSkills.filter(s => 
      s.skill_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !mySkills.find(ms => ms.skill_name.toLowerCase() === s.skill_name.toLowerCase())
    ).slice(0, 10);
  }, [allSkills, searchTerm, mySkills]);

  return (
    <div className="space-y-12 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase leading-none">Skill Matrix</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[4px] text-[10px]">SkillSync Recruitment Ecosystem • Technical Inventory Control</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm text-slate-400 font-black text-[9px] uppercase tracking-[3px]">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active Intelligence
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
         <div className="xl:col-span-1 space-y-10">
            <AnimatedSection direction="up" className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20"><Plus size={20} /></div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Inventory Management</h2>
                </div>
                
                <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-premium space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2 relative">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] ml-1">Search Identifier</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-5 flex items-center text-slate-400 group-focus-within:text-amber-600 transition-colors">
                                    <Search size={16} />
                                </div>
                                 <input 
                                    type="text" 
                                    placeholder="TYPE OR SEARCH 40+ SKILLS..."
                                    value={searchTerm || selectedSkillName}
                                    onChange={(e) => {
                                      setSearchTerm(e.target.value);
                                      setSelectedSkillName(''); // clear previous selection when typing new
                                    }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') addSkill(); }}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 transition-all outline-none placeholder:text-slate-300"
                                />
                                <div className="mt-2 px-1 text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                                  Tip: You can type any skill and press Enter to add it.
                                </div>
                                <AnimatePresence>
                                    {filteredSkills.length > 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl z-50 overflow-hidden"
                                        >
                                            {filteredSkills.map(s => (
                                                <button 
                                                    key={s.skill_id}
                                                    onClick={() => {
                                                        setSelectedSkillName(s.skill_name);
                                                        setSearchQuery('');
                                                    }}
                                                    className="w-full px-6 py-4 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group/item"
                                                >
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{s.skill_name}</span>
                                                    <ChevronRight size={14} className="text-slate-300 group-hover/item:translate-x-1 group-hover/item:text-amber-600 transition-all" />
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] ml-1">Proficiency Level</label>
                           <div className="grid grid-cols-2 gap-3">
                              {LEVELS.map(level => {
                                 const config = levelConfig[level];
                                 const Icon = config.icon;
                                 return (
                                    <button 
                                       key={level}
                                       onClick={() => setSelectedLevel(level)}
                                       className={`p-4 rounded-2xl border text-left transition-all ${
                                          selectedLevel === level 
                                             ? `${config.bg} ${config.color} border-transparent shadow-inner ring-2 ring-slate-900/5` 
                                             : 'bg-white border-slate-100 hover:border-slate-300 text-slate-400'
                                       }`}
                                    >
                                       <Icon size={14} className="mb-2" />
                                       <div className="text-[9px] font-black uppercase tracking-widest">{level}</div>
                                    </button>
                                 );
                              })}
                           </div>
                        </div>

                        <button 
                            onClick={addSkill}
                            disabled={adding || (!selectedSkillName && !searchQuery.trim())}
                            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[3px] text-[10px] hover:bg-amber-600 shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
                        >
                            {adding ? <Activity size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                            {adding ? 'SYNCHRONIZING...' : 'INJECT INTO MATRIX'}
                        </button>
                    </div>
                </div>
            </AnimatedSection>

            <AnimatePresence>
                {aiSkillSuggestions.length > 0 && (
                    <AnimatedSection direction="up" delay={0.1} className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm"><Sparkles size={20} /></div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Skill Extractions</h2>
                        </div>
                        <div className="p-8 bg-white rounded-[2.5rem] border border-indigo-100 shadow-xl shadow-indigo-600/5 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] scale-150"><Cpu size={100} /></div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">Based on your recent resume analysis, we detected these competencies. Add them to your matrix:</p>
                            <div className="flex flex-wrap gap-2">
                                {aiSkillSuggestions.map(skill => (
                                    <button 
                                        key={skill}
                                        onClick={() => {
                                            setSelectedSkillName(skill);
                                            // Scroll to input if needed
                                        }}
                                        className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all transform hover:-translate-y-0.5 active:scale-95"
                                    >
                                        + {skill}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </AnimatedSection>
                )}
            </AnimatePresence>

            <AnimatedSection direction="up" delay={0.2} className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm"><Lightbulb size={20} /></div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Market Alignment</h2>
                </div>
                <div className="p-8 bg-slate-950 rounded-[2.5rem] border border-white/5 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-[3px] text-amber-500">Gap Intelligence</span>
                    </div>
                    <div className="space-y-4">
                        {aiInsights?.nextBestSkill ? (
                             <div className="p-5 bg-white/5 rounded-2xl border border-white/10 border-l-amber-600/50">
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                                    Acquiring <span className="text-amber-500">{aiInsights.nextBestSkill.name}</span> will increase your market reach by <span className="text-amber-500">{aiInsights.nextBestSkill.boost}%</span>.
                                </p>
                             </div>
                        ) : (
                            <div className="p-5 bg-white/5 rounded-2xl border border-white/10 border-l-emerald-600/50">
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
                                    Your current stack has maximum market compatibility.
                                </p>
                             </div>
                        )}
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">AI has detected emerging demand for <span className="text-amber-500">Distributed Systems</span>.</p>
                        </div>
                    </div>
                </div>
            </AnimatedSection>
         </div>

         <div className="xl:col-span-2 space-y-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-slate-50 text-slate-700 border border-slate-100 flex items-center justify-center shadow-sm"><Layers size={18} /></div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Active Skill Matrix</h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className="relative group w-48">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="FILTER MATRIX..."
                            value={matrixSearch}
                            onChange={(e) => setMatrixSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest focus:bg-white focus:border-slate-300 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[3px] text-slate-400">{mySkills.length} Verified Entries</span>
                    </div>
                </div>
            </div>

            {mySkills.length === 0 ? (
                <div className="p-32 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <Database size={48} className="text-slate-200 mx-auto mb-8 animate-pulse" />
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4 text-slate-950 font-black">Empty Repository</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                        {mySkills
                        .filter(s => !matrixSearch || s.skill_name.toLowerCase().includes(matrixSearch.toLowerCase()))
                        .map((ms, index) => {
                            const config = levelConfig[ms.proficiency_level] || levelConfig['Beginner'];
                            return (
                                <motion.div key={ms.skill_name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.05 }} className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-amber-500/30 transition-all duration-500 shadow-sm hover:shadow-xl">
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="space-y-4">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${config.bg} ${config.color} border-transparent shadow-sm`}>
                                                <config.icon size={11} className="animate-pulse" />
                                                <span className="text-[9px] font-black uppercase tracking-[2px]">{ms.proficiency_level}</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-amber-600 transition-colors leading-none">{ms.skill_name}</h3>
                                        </div>
                                        <button onClick={() => removeSkill(ms.skill_name)} className="size-10 rounded-xl flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="space-y-3 mb-10">
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-[2px] text-slate-400">
                                            <span>Proficiency Index</span>
                                            <span>{config.progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${config.progress}%` }} className={`h-full rounded-full ${ms.proficiency_level === 'Expert' ? 'bg-amber-600' : ms.proficiency_level === 'Advanced' ? 'bg-amber-500' : ms.proficiency_level === 'Intermediate' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                                        </div>
                                    </div>
                                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${ms.proficiency_level === 'Expert' ? 'bg-amber-600' : 'bg-slate-100'}`} />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
         </div>
      </div>
    </div>
  );
}
