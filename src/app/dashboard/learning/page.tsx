'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { BookOpen, Star, Trophy, Zap, Clock, ChevronRight, Sparkles } from 'lucide-react';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { toast } from 'react-hot-toast';

export default function LearningPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/dashboard/learning`);
        const data = await res.json();
        if (data.success) {
          // Add some premium mock data if empty
          if (!data.courses || data.courses.length === 0) {
            setCourses([
              { 
                course_id: 'c1', 
                title: 'Web Development Fundamentals', 
                description: 'Learn the basics of building modern web applications with React and Node.js.',
                level: 'Beginner',
                tags: ['Frontend', 'Backend']
              },
              { 
                course_id: 'c2', 
                title: 'Data Structures & Algorithms', 
                description: 'Master the core concepts for technical interviews and competitive programming.',
                level: 'Intermediate',
                tags: ['Logic', 'Interviews']
              },
              { 
                course_id: 'c3', 
                title: 'Cloud Computing Basics', 
                description: 'Introduction to AWS, GCP, and deploying scalable web applications.',
                level: 'Advanced',
                tags: ['DevOps', 'Cloud']
              }
            ]);
          } else {
            setCourses(data.courses);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-16 py-6 pb-32">
      <AnimatedSection direction="up" distance={40}>
        <div className="flex items-center gap-4 mb-6">
           <div className="size-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 shadow-inner border border-purple-500/10">
              <BookOpen size={22} className="opacity-80" />
           </div>
           <div>
             <h2 className="text-[11px] font-black uppercase tracking-[6px] text-slate-400 mb-0.5">Learning Hub</h2>
             <div className="flex items-center gap-2">
               <div className="size-1.5 rounded-full bg-purple-500 animate-pulse" />
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">DBMS Project Curated</p>
             </div>
           </div>
        </div>
        
        <div className="relative">
          <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85]">
            Skill<br /><span className="text-purple-600 opacity-90 inline-flex items-center gap-4">Academy.<Sparkles className="text-amber-400 size-10 md:size-16" /></span>
          </h1>
          <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-40 h-40 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
        </div>
        
          Enhance your <span className="text-black font-black">skills</span> with expert-led courses and personalized learning paths.
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-96 bg-white/50 animate-pulse rounded-[4rem] border border-slate-100 shadow-soft" />)
        ) : courses.map((course, idx) => (
          <AnimatedSection key={course.course_id || idx} direction="up" delay={idx * 0.1}>
            <div className="group relative bg-white/70 backdrop-blur-xl p-10 rounded-[4rem] border border-white/60 shadow-premium hover:shadow-2xl hover:border-purple-500/20 transition-all duration-700 h-full flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[4rem]" />
              
              <div className="flex justify-between items-start mb-16 relative z-10">
                 <div className="size-16 rounded-[2rem] bg-purple-500/5 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-500 shadow-inner border border-purple-500/10">
                    <Trophy size={28} className="opacity-80" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[3px] bg-slate-950 text-white px-4 py-2 rounded-full shadow-lg group-hover:bg-purple-600 transition-colors">
                   {course.level || 'Expert'}
                 </span>
              </div>

              <div className="space-y-4 mb-10 flex-1 relative z-10">
                <h3 className="text-3xl font-black text-slate-950 tracking-tighter leading-none group-hover:text-purple-600 transition-colors">{course.title}</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed opacity-80">{course.description}</p>
              </div>

              <div className="flex flex-wrap gap-2.5 mb-10 relative z-10">
                 {(course.tags || ['#design', '#system']).map((tag: string) => (
                    <span key={tag} className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl uppercase tracking-widest group-hover:border-purple-500/20 group-hover:text-purple-500 transition-all">{tag}</span>
                 ))}
              </div>

              <div className="pt-8 border-t border-slate-100 flex items-center justify-between relative z-10 mt-auto">
                 <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <Clock size={16} className="text-purple-500 opacity-60" /> 
                    <span className="group-hover:text-slate-600 transition-colors">12 Modules</span>
                 </div>
                 <button onClick={() => toast('Course launching soon!', { icon: '🚀' })} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[3px] bg-slate-950 text-white px-8 py-4 rounded-[1.5rem] hover:bg-purple-600 transition-all shadow-xl shadow-slate-950/10 hover:shadow-purple-500/20 active:scale-95 group/btn">
                   Launch <ChevronRight size={16} className="translate-x-0 group-hover/btn:translate-x-1 transition-transform" />
                 </button>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
      
      {/* Visual Spacer */}
      <div className="h-20" />
    </div>
  );
}
