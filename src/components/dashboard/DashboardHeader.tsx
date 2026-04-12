'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { Search } from 'lucide-react';
import { NotificationPanel } from '@/components/dashboard/NotificationPanel';
import { Notification } from '@/types';

interface DashboardHeaderProps {
  userName: string;
  rollNo: string;
  searchTerm: string;
  unreadCount?: number;
  notifications: Notification[];
  onSearchChange: (val: string) => void;
  onFilterChange?: (filters: { category: string; timeframe: string }) => void;
  onProfileClick: () => void;
  onLogout: () => void;
  onMarkRead: (id?: string) => void;
}

export const DashboardHeader = ({
  userName,
  rollNo,
  searchTerm,
  unreadCount = 0,
  notifications = [],
  onSearchChange,
  onFilterChange,
  onProfileClick,
  onLogout,
  onMarkRead
}: DashboardHeaderProps) => {
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState({ category: 'All', timeframe: 'All' });

  const handleFilterChange = (key: 'category' | 'timeframe', val: string) => {
    const newFilters = { ...filters, [key]: val };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 md:mb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[4px]">Verified Career Profile</span>
          <div className="h-[1px] w-8 bg-amber-500/30" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tighter leading-[0.9]">
          Welcome back,
          <br className="hidden lg:block" /> {userName || 'Student'}
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 flex-1 justify-end w-full">
        <div className="relative group w-full sm:max-w-[340px] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-[#575a93] transition-colors" />
            <input 
              type="text"
              placeholder="Search Opportunities..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-6 py-3.5 md:py-4 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300 focus:outline-none focus:border-[#575a93]/30 focus:bg-white shadow-soft transition-all"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`size-12 rounded-2xl border flex items-center justify-center transition-all active:scale-95 ${isFilterOpen ? 'bg-[#575a93] text-white border-[#575a93]' : 'bg-white border-slate-100 text-slate-400 hover:text-[#575a93]'}`}
            >
              <Icon name="tune" className="text-xl" />
            </button>

            {isFilterOpen && (
              <div className="absolute top-14 right-0 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-[100] animate-in slide-in-from-top-2">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Category</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['All', 'Jobs', 'Skills', 'Courses'].map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => handleFilterChange('category', cat)}
                          className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filters.category === cat ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-400 border border-transparent hover:bg-slate-100'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Timeframe</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {['All', 'Today', 'This Week', 'This Month'].map(time => (
                        <button 
                          key={time} 
                          onClick={() => handleFilterChange('timeframe', time)}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase text-left transition-all ${filters.timeframe === time ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-400 border border-transparent hover:bg-slate-100'}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-between sm:justify-end sm:pl-4 sm:border-l border-slate-100 pt-2 sm:pt-0">
          <div className="flex sm:hidden flex-col items-start">
             <span className="text-[10px] font-black text-[#575a93] uppercase tracking-[1px] leading-tight">Student Hub</span>
             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">ID: {rollNo || 'Verified'}</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
          {/* Notification Bell */}
          <div 
            onClick={() => setIsPanelOpen(true)}
            className="size-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#575a93] hover:border-[#575a93]/20 transition-all cursor-pointer relative active:scale-95 shadow-soft group"
          >
            <Icon name="notifications" className="text-xl group-hover:rotate-12 transition-transform" />
            {unreadCount !== undefined && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 size-5 bg-[#575a93] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-md">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>

          <NotificationPanel 
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
            notifications={notifications}
            onMarkRead={onMarkRead}
          />

          <div 
            className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-white shadow-premium cursor-pointer hover:scale-110 transition-transform active:scale-95" 
            onClick={onProfileClick}
          >
            <img 
              alt="User" 
              className="w-full h-full object-cover" 
              src="/assets/user_avatar.png" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${userName}&background=575a93&color=fff&bold=true`;
              }}
            />
          </div>

          {rollNo && (
            <div className="hidden sm:flex flex-col items-start min-w-[80px]">
              <span className="text-[10px] font-black text-[#575a93] uppercase tracking-[1px] leading-tight truncate max-w-[120px]">ID: {rollNo}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">SkillSync Member</span>
            </div>
          )}

            <div 
              onClick={onLogout}
              className="size-10 md:size-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer active:scale-95 shadow-sm"
              title="Logout"
            >
              <Icon name="logout" className="text-lg" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
