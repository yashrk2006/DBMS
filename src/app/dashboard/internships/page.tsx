'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Search, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Target,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Internship {
  internship_id: number;
  title: string;
  description: string | null;
  duration: string | null;
  stipend: string | null;
  location: string | null;
  company: { company_name: string } | null;
  required_skills: Array<{ skill_id: number; skill_name: string }>;
  match_percentage: number;
  applied: boolean;
}

export default function InternshipsPage() {
  const supabase = createClient();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || { id: '00000000-0000-0000-0000-000000000000', email: 'demo@student.com' };

    const { data: studentSkills } = await supabase
      .from('student_skill').select('skill_id').eq('student_id', user.id);
    const mySkillIds = new Set((studentSkills ?? []).map((s: { skill_id: number }) => s.skill_id));

    const { data: internshipsData } = await supabase
      .from('internship')
      .select(`internship_id, title, description, duration, stipend, location,
        company:company_id (company_name),
        required_skills:internship_requirements (skill_id, skill:skill_id (skill_name))`);

    const { data: appsData } = await supabase
      .from('application').select('internship_id').eq('student_id', user.id);
    const appliedIds = new Set((appsData ?? []).map((a: { internship_id: number }) => a.internship_id));

    const mapped: Internship[] = ((internshipsData ?? []) as any[]).map((i) => {
      const companyRaw = Array.isArray(i.company) ? i.company[0] : i.company;
      const reqSkills = ((i.required_skills ?? []) as any[]).map((rs: any) => ({
        skill_id: rs.skill_id,
        skill_name: (Array.isArray(rs.skill) ? rs.skill[0]?.skill_name : rs.skill?.skill_name) ?? '',
      }));
      const matched = reqSkills.filter((rs: { skill_id: number }) => mySkillIds.has(rs.skill_id)).length;
      const match_percentage = reqSkills.length > 0 ? Math.round((matched / reqSkills.length) * 100) : 0;
      return {
        internship_id: i.internship_id,
        title: i.title,
        description: i.description,
        duration: i.duration,
        stipend: i.stipend,
        location: i.location,
        company: companyRaw ?? null,
        required_skills: reqSkills,
        match_percentage,
        applied: appliedIds.has(i.internship_id),
      };
    }).sort((a: Internship, b: Internship) => b.match_percentage - a.match_percentage);

    setInternships(mapped);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function handleApply(internship_id: number) {
    setApplying(internship_id);
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user || { id: '00000000-0000-0000-0000-000000000000', email: 'demo@student.com' };
    await supabase.from('application').insert({ student_id: user.id, internship_id });
    await load();
    setApplying(null);
  }

  const filtered = internships.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    (i.company?.company_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-indigo-600"
      >
        <Briefcase size={40} fill="currentColor" />
      </motion.div>
      <p className="text-slate-500 font-medium font-display animate-pulse">Matching opportunities with your profile...</p>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold mb-3 uppercase tracking-wider">
            <Sparkles size={14} fill="currentColor" />
            AI-Powered Matching
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Opportunity Hub</h1>
          <p className="text-slate-500 font-medium max-w-md mt-1">Discover internships custom-tailored to your unique skill set.</p>
        </motion.div>

        <div className="relative w-full md:w-80 group">
          <input
            id="internship-search"
            type="text"
            placeholder="Search roles or companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm group-hover:border-indigo-300"
          />
          <Search size={18} className="absolute left-4 top-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((i, index) => (
            <motion.div
              key={i.internship_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <Card className="group hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 border-none shadow-md bg-white overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center">
                  {/* Matching Side */}
                  <div className={cn(
                    "lg:w-48 p-8 flex flex-col items-center justify-center gap-3 text-center border-b lg:border-b-0 lg:border-r border-slate-100 transition-colors group-hover:bg-slate-50/50",
                    i.match_percentage >= 80 ? "bg-emerald-50/30" : i.match_percentage >= 50 ? "bg-amber-50/30" : "bg-slate-50/30"
                  )}>
                    <div className="relative">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          className="text-slate-100"
                        />
                        <motion.circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={175.9}
                          initial={{ strokeDashoffset: 175.9 }}
                          animate={{ strokeDashoffset: 175.9 - (175.9 * i.match_percentage) / 100 }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={cn(
                             i.match_percentage >= 80 ? "text-emerald-500" : i.match_percentage >= 50 ? "text-amber-500" : "text-indigo-400"
                          )}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-display font-black text-slate-800 text-sm">
                        {i.match_percentage}%
                      </div>
                    </div>
                    <div className="space-y-0.5">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Match Score</p>
                       <p className={cn(
                         "text-xs font-bold",
                         i.match_percentage >= 80 ? "text-emerald-600" : i.match_percentage >= 50 ? "text-amber-600" : "text-indigo-600"
                       )}>
                         {i.match_percentage >= 80 ? 'Highly Recommended' : i.match_percentage >= 50 ? 'Strong Potential' : 'New Challenge'}
                       </p>
                    </div>
                  </div>

                  {/* Content Side */}
                  <div className="flex-1 p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-display font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{i.title}</h3>
                          {i.applied && (
                            <Badge variant="success" className="gap-1 animate-in fade-in zoom-in duration-300">
                              <CheckCircle2 size={12} />
                              Applied
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-500">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
                            <Briefcase size={15} className="text-indigo-500" />
                            {i.company?.company_name}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={15} className="text-slate-400" />
                            {i.location ?? 'Remote'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={15} className="text-slate-400" />
                            {i.duration ?? 'Flexible Duration'}
                          </div>
                          {i.stipend && (
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <DollarSign size={15} />
                              {i.stipend}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                         <Button
                          id={`apply-btn-${i.internship_id}`}
                          onClick={() => handleApply(i.internship_id)}
                          disabled={i.applied || applying === i.internship_id}
                          variant={i.applied ? 'outline' : 'default'}
                          className={cn(
                            "h-11 px-8 rounded-xl font-bold transition-all shadow-lg",
                            !i.applied && "shadow-indigo-100 hover:shadow-indigo-200"
                          )}
                        >
                          {applying === i.internship_id ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Target size={18} /></motion.div>
                          ) : i.applied ? (
                             'View Status'
                          ) : (
                            'Apply Now'
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-50 relative">
                       <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 italic mb-4">
                         &quot;{i.description}&quot;
                       </p>

                       <div className="flex flex-wrap items-center gap-2">
                         <div className="p-1 px-2 rounded-lg bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1.5 mr-2">
                            <Target size={10} /> REQUIRED SKILLS
                         </div>
                         {i.required_skills.map((rs) => (
                           <Badge key={rs.skill_id} variant="secondary" className="px-2.5 py-1 bg-indigo-50/50 hover:bg-indigo-100/50 transition-colors border-none text-indigo-700 font-bold">
                             {rs.skill_name}
                           </Badge>
                         ))}
                       </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 space-y-4 shadow-sm">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Search size={40} />
             </div>
             <div className="max-w-xs mx-auto">
               <p className="text-slate-900 font-bold text-lg">No opportunities found</p>
               <p className="text-sm text-slate-500">Try adjusting your search or enhancing your skills to see more matches.</p>
             </div>
             <Button variant="outline" onClick={() => setSearch('')} className="mt-2">Clear Search Filters</Button>
          </div>
        )}
      </div>
    </div>
  );
}
