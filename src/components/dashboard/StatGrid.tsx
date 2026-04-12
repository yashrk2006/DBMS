'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';

interface StatGridProps {
  stats: {
    applications: number;
    skills: number;
    internships: number;
    accepted: number;
  };
  skills: {
    label: string;
    val: number;
    color: string;
  }[];
  onCatalogClick: () => void;
}

export const StatGrid = ({ stats, skills, onCatalogClick }: StatGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-premium border border-white/50 relative hover:-translate-y-2 transition-all duration-500 group overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="font-black text-[13px] uppercase tracking-[4px] text-slate-400">Career Lessons</h3>
          <button 
            onClick={onCatalogClick}
            className="text-[10px] font-black bg-slate-950 text-white px-6 py-2.5 rounded-full uppercase tracking-[2px] hover:bg-orange-500 transition-all shadow-lg active:scale-95"
          >
            All Courses
          </button>
        </div>
        <div className="flex items-end justify-between relative z-10">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl md:text-6xl font-black tracking-tighter leading-none text-slate-950">
                {stats.accepted > 0 ? (stats.accepted * 12) + 4 : (stats.skills * 4) + 2}
              </span>
              <div className="flex items-center text-xs font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md mb-2">
                <Icon name="arrow_downward" className="text-sm mr-1" />7%
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-black uppercase tracking-[3px]">Lessons Explored</p>
          </div>
          <div className="w-36 mb-6">
            <svg className="w-full drop-shadow-lg" viewBox="0 0 100 40">
              <path className="stroke-orange-500 stroke-[4] fill-none" d="M0,30 C10,32 15,10 25,15 C35,20 40,35 50,30 C60,25 70,5 85,10 C95,15 100,20 100,20" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-premium border border-white/50 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h3 className="font-black text-[13px] uppercase tracking-[4px] text-slate-400">Skill Progress</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-8 md:gap-12 relative z-10">
          <div className="flex flex-col justify-end shrink-0">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black text-slate-950 leading-none tracking-tighter">
                {Math.floor(stats.skills * 14.5)}h
              </span>
              <div className="text-[10px] md:text-xs font-black text-emerald-500 flex items-center bg-emerald-50 px-2 py-0.5 rounded-md mb-1">
                <Icon name="arrow_upward" className="text-sm mr-1" />{(stats.skills * 4)}%
              </div>
            </div>
            <p className="text-[10px] md:text-[11px] text-slate-400 font-black uppercase tracking-[2px] md:tracking-[3px] mt-2">Study Hours</p>
          </div>
          <div className="flex-1 space-y-4 md:space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {(skills.length > 0 ? skills : stats.skills > 0 ? Array(Math.min(stats.skills, 5)).fill(null) : []).map((s, i) => (
              <div key={i} className={!s ? 'animate-pulse' : ''}>
                <div className="flex justify-between text-[10px] font-black mb-2 uppercase tracking-widest">
                   <span className="text-slate-400">{s?.label || 'Analyzing...'}</span>
                   <span className="text-slate-950">{s?.val || '0'}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${s?.val || 0}%` }} 
                    className={`h-full ${s?.color || 'bg-slate-200'} rounded-full shadow-lg`} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatGrid;
