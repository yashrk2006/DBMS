'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Search,
  BookOpen,
  Trophy,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Skill { skill_id: number; skill_name: string; category: string | null; }
interface StudentSkill { skill_id: number; proficiency_level: string; skill: Skill; }

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

const levelConfig: Record<string, { color: 'primary' | 'secondary' | 'success' | 'warning', icon: any }> = {
  Beginner: { color: 'primary', icon: BookOpen },
  Intermediate: { color: 'secondary', icon: TrendingUp },
  Advanced: { color: 'success', icon: CheckCircle2 },
  Expert: { color: 'warning', icon: Trophy },
};

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export default function SkillsPage() {
  const supabase = createClient();
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [mySkills, setMySkills] = useState<StudentSkill[]>([]);
  const [adding, setAdding] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<typeof LEVELS[number]>('Beginner');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || { id: '00000000-0000-0000-0000-000000000000', email: 'demo@student.com' };
    setUserId(user.id);

    const [{ data: skills }, { data: mySkillsData }] = await Promise.all([
      supabase.from('skill').select('*').order('skill_name'),
      supabase.from('student_skill').select('skill_id, proficiency_level, skill:skill_id (skill_id, skill_name, category)').eq('student_id', user.id),
    ]);

    setAllSkills(skills ?? []);
    const normalized = (mySkillsData ?? []).map((s: { skill_id: number; proficiency_level: string; skill: Skill | Skill[] }) => ({
      skill_id: s.skill_id,
      proficiency_level: s.proficiency_level,
      skill: Array.isArray(s.skill) ? s.skill[0] : s.skill,
    }));
    setMySkills(normalized);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function addSkill() {
    if (!selectedSkillId || !userId) return;
    setAdding(true);
    await supabase.from('student_skill').upsert({
      student_id: userId,
      skill_id: parseInt(selectedSkillId),
      proficiency_level: selectedLevel,
    });
    await load();
    setSelectedSkillId('');
    setAdding(false);
  }

  async function removeSkill(skill_id: number) {
    await supabase.from('student_skill').delete().eq('student_id', userId).eq('skill_id', skill_id);
    await load();
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <motion.div 
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-indigo-600"
      >
        <Zap size={40} fill="currentColor" />
      </motion.div>
      <p className="text-slate-500 font-medium">Loading your skillset...</p>
    </div>
  );

  const mySkillIds = new Set(mySkills.map(s => s.skill_id));
  const availableSkills = allSkills
    .filter(s => !mySkillIds.has(s.skill_id))
    .filter(s => s.skill_name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-3 uppercase tracking-wider">
            <Zap size={14} fill="currentColor" />
            Competitive Edge
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">My Skills Portfolio</h1>
          <p className="text-slate-500 font-medium max-w-md mt-1">Showcase your expertise and get matched with relevant internships.</p>
        </motion.div>

        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
           <Trophy size={16} className="text-amber-500" />
           <span>Level: <span className="text-slate-900 font-bold">{mySkills.length > 5 ? 'Expert' : 'Rising Star'}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Add Skill Panel */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="border-none shadow-xl shadow-indigo-100/20 bg-gradient-to-br from-white to-indigo-50/30 overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
               <SparklesIcon size={24} className="text-indigo-200" />
            </div>
            <CardHeader>
              <CardTitle className="text-xl">Add New Skill</CardTitle>
              <CardDescription>Select a skill from the catalog to add to your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Search size={14} /> Search Skills
                </label>
                <div className="relative">
                   <select
                    id="skill-select"
                    value={selectedSkillId}
                    onChange={e => setSelectedSkillId(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm appearance-none bg-white font-medium pr-10"
                  >
                    <option value="">Choose a skill...</option>
                    {availableSkills.map(s => <option key={s.skill_id} value={s.skill_id}>{s.skill_name}</option>)}
                  </select>
                  <Filter size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <TrendingUp size={14} /> Proficiency Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LEVELS.map(level => (
                    <button
                      key={level}
                      onClick={() => setSelectedLevel(level)}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border text-xs font-bold transition-all text-center",
                        selectedLevel === level 
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                          : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                id="add-skill-btn"
                onClick={addSkill}
                disabled={!selectedSkillId || adding}
                className="w-full h-12 rounded-xl text-md font-bold gap-2 mt-2"
              >
                {adding ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity }}><Zap size={16} /></motion.div> : <Plus size={18} />}
                {adding ? 'Adding...' : 'Add to Portfolio'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Skills List */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-display font-bold text-slate-900">Your Expertise</h2>
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{mySkills.length} SKILLS TOTAL</span>
          </div>

          {mySkills.length === 0 ? (
            <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 space-y-4">
               <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-slate-300">
                  <BookOpen size={28} />
               </div>
               <div>
                 <p className="text-slate-900 font-bold">No skills listed yet</p>
                 <p className="text-sm text-slate-500">Add your technical and soft skills to stand out.</p>
               </div>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {mySkills.map((ms, index) => {
                  const config = levelConfig[ms.proficiency_level] || { color: 'secondary', icon: Zap };
                  return (
                    <motion.div
                      key={ms.skill_id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-100 bg-white shadow-sm border-none">
                        <div className={`absolute top-0 left-0 bottom-0 w-1 transition-all group-hover:w-1.5 ${
                          ms.proficiency_level === 'Expert' ? 'bg-amber-400' : 
                          ms.proficiency_level === 'Advanced' ? 'bg-emerald-400' : 'bg-indigo-400'
                        }`} />
                        <CardHeader className="flex flex-row items-start justify-between p-5 pb-2">
                          <div className="space-y-1">
                             <Badge variant={config.color} className="gap-1.5 px-2 py-1 rounded-lg">
                               <config.icon size={12} />
                               {ms.proficiency_level}
                             </Badge>
                             <CardTitle className="text-lg font-bold group-hover:text-indigo-600 transition-colors uppercase pt-2">
                               {ms.skill?.skill_name}
                             </CardTitle>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeSkill(ms.skill_id)}
                            className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </CardHeader>
                        <CardContent className="px-5 pb-5">
                           {ms.skill?.category && (
                             <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                {ms.skill.category}
                             </div>
                           )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

const SparklesIcon = ({ size, className }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
);
