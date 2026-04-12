'use client';

import React, { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { Course } from '@/types';
import { toast } from 'react-hot-toast';

interface PathExplorerProps {
  courses: Course[];
  searchTerm: string;
  onViewAll: () => void;
  onCourseClick: (course: Course) => void;
}

export const PathExplorer = ({ courses, searchTerm, onViewAll, onCourseClick }: PathExplorerProps) => {
  const filteredCourses = useMemo(() => {
    if (!searchTerm) return courses;
    const query = searchTerm.toLowerCase();
    return courses.filter(c => 
      c.title.toLowerCase().includes(query) || 
      (c.category && c.category.toLowerCase().includes(query))
    );
  }, [courses, searchTerm]);

  return (
    <div className="pb-10">
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-extrabold text-xl tracking-tight uppercase">SkillSync Paths</h3>
        <button onClick={onViewAll} className="text-[12px] font-bold text-[#575a93]">View all</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map(c => (
            <div 
              key={c.course_id} 
              onClick={() => onCourseClick(c)}
              className="bg-white/60 backdrop-blur-md p-7 rounded-[2.2rem] relative border border-white hover:border-[#575a93]/30 transition-all group cursor-pointer shadow-soft active:scale-[0.98] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#575a93]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <button 
                onClick={(e) => { e.stopPropagation(); toast("Course bookmarked", { icon: "🔖" }); }} 
                className="absolute top-6 right-6 text-slate-300 group-hover:text-[#575a93] transition-colors z-10"
              >
                <Icon name="more_vert" />
              </button>
              <div className="w-full h-32 flex items-center justify-center mb-6 relative">
                <div className="relative w-20 h-20">
                  <div className={`absolute top-0 right-0 w-10 h-10 ${c.category === 'AI' ? 'bg-emerald-400' : 'bg-orange-400'} rounded-full shadow-lg z-10 animate-pulse`} />
                  <div className={`absolute bottom-4 left-0 w-12 h-12 ${c.category === 'Development' ? 'bg-purple-500' : 'bg-[#575a93]'} rounded-2xl rotate-12 shadow-xl`} />
                  <div className={`absolute bottom-0 right-4 w-10 h-10 ${c.category === 'Cloud' ? 'bg-cyan-400' : 'bg-blue-400'} rounded-full shadow-lg`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon 
                      name={c.icon === 'AutoAwesome' ? 'auto_awesome' : c.icon === 'Code' ? 'code' : c.icon === 'CloudSync' ? 'cloud_sync' : 'school'} 
                      className="text-white text-3xl drop-shadow-md" 
                    />
                  </div>
                </div>
              </div>
              <h4 className="font-extrabold text-[17px] mb-2 relative z-10">{c.title}</h4>
              <p className="text-[11px] text-[#717171] mb-6 font-medium uppercase tracking-tight line-clamp-2 relative z-10">
                {c.description || 'Expertly crafted career paths'}
              </p>
              <div className="flex items-center justify-between relative z-10">
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.category || 'Tech'}</span>
                   <span className="text-[8px] font-bold text-[#575a93] uppercase tracking-[2px] mt-1 flex items-center gap-1">
                     <Sparkles className="size-2" /> Featured Path
                   </span>
                 </div>
                 <div className="w-9 h-9 bg-[#575a93]/10 rounded-full flex items-center justify-center group-hover:bg-[#575a93] group-hover:text-white transition-all">
                   <Icon name="arrow_forward" className="text-sm" />
                 </div>
              </div>
            </div>
          ))
        ) : searchTerm ? (
          <div className="col-span-1 md:col-span-2 xl:col-span-3 py-16 text-center bg-slate-50/50 backdrop-blur-sm rounded-[2.2rem] border-2 border-dashed border-slate-200 group hover:border-[#575a93]/20 transition-all">
            <div className="size-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
              <Icon name="travel_explore" className="text-3xl text-[#575a93]" />
            </div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">No results found</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">We couldn't find any paths matching &quot;{searchTerm}&quot;. <br/> Discover our recommended paths below.</p>
            <button 
              onClick={() => { window.dispatchEvent(new CustomEvent('clear-search')); }}
              className="mt-6 px-6 py-2 bg-[#575a93] text-white text-[9px] font-black rounded-lg uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-95"
            >
              Reset Search
            </button>
          </div>
        ) : (
          [1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white/20 backdrop-blur-sm p-7 rounded-[2.2rem] border border-white/30 animate-pulse h-64 shadow-inner" />
          ))
        )}
      </div>
    </div>
  );
};

export default PathExplorer;
