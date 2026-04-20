'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { Search } from 'lucide-react';
import { NotificationPanel } from '@/components/dashboard/NotificationPanel';
import { Notification } from '@/types';

interface DashboardHeaderProps {
  userName: string;
  rollNo?: string;
  searchTerm: string;
  unreadCount?: number;
  notifications: Notification[];
  role?: 'student' | 'admin' | 'company';
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
  role = 'student',
  onSearchChange,
  onFilterChange,
  onProfileClick,
  onLogout,
  onMarkRead
}: DashboardHeaderProps) => {
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [filters, setFilters] = React.useState({ category: 'All', timeframe: 'All' });

  // Role-specific labels
  const roleConfig = {
    student: {
      label: "Verified Career Profile",
      subLabel: "Student Hub",
      idLabel: "ID",
      color: "text-amber-500",
      accent: "bg-amber-500"
    },
    admin: {
      label: "Platform Intelligence",
      subLabel: "System Stats",
      idLabel: "ID",
      color: "text-indigo-500",
      accent: "bg-indigo-500"
    },
    company: {
      label: "Career Hub",
      subLabel: "Talent Advisor",
      idLabel: "PARTNER",
      color: "text-emerald-500",
      accent: "bg-emerald-500"
    }
  }[role];

  const handleFilterChange = (key: 'category' | 'timeframe', val: string) => {
    const newFilters = { ...filters, [key]: val };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 md:mb-12">
      <div className="animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[9px] font-black ${roleConfig.color} uppercase tracking-[4px]`}>{roleConfig.label}</span>
          <div className={`h-[1px] w-8 ${roleConfig.accent}/30`} />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-slate-950 tracking-tight leading-[1.1]">
          {role === 'student' ? 'Welcome back,' : role === 'admin' ? 'Active session,' : 'Matching talent,'}
          <br className="hidden lg:block" /> {userName || 'User'}
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 flex-1 justify-end w-full">
        <div className="relative group w-full sm:max-w-[340px] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
            <input 
              type="text"
              placeholder={role === 'student' ? "Search Opportunities..." : "Search Analysis..."}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-6 py-3.5 md:py-4 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-100 text-[10px] font-bold uppercase tracking-widest placeholder:text-slate-300 focus:outline-none focus:border-slate-200 focus:bg-white shadow-[var(--soft-shadow)] transition-all"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`size-12 rounded-2xl border flex items-center justify-center transition-all active:scale-95 ${isFilterOpen ? 'bg-slate-950 text-white' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900 shadow-sm'}`}
            >
              <Icon name="tune" className="text-xl" />
            </button>

            {isFilterOpen && (
              <div className="absolute top-14 right-0 w-64 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-100 p-6 z-[100] animate-in zoom-in-95 duration-200">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Filters</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['All', 'Recent', 'Urgent', 'Flagged'].map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => handleFilterChange('category', cat)}
                          className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filters.category === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-transparent hover:bg-slate-100'}`}
                        >
                          {cat}
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
             <span className={`text-[10px] font-black ${roleConfig.color} uppercase tracking-[1px] leading-tight`}>{roleConfig.subLabel}</span>
             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status: Active</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
          {/* Notification Bell */}
          <div 
            onClick={() => setIsPanelOpen(true)}
            className="size-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-200 transition-all cursor-pointer relative active:scale-95 shadow-[var(--soft-shadow)] group"
          >
            <Icon name="notifications" className="text-xl group-hover:rotate-12 transition-transform" />
            {unreadCount !== undefined && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 size-5 bg-slate-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
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
              src={`https://ui-avatars.com/api/?name=${userName}&background=${role === 'student' ? '575a93' : role === 'admin' ? '0f172a' : '10b981'}&color=fff&bold=true`}
            />
          </div>

          <div className="hidden sm:flex flex-col items-start min-w-[80px]">
            <span className={`text-[10px] font-black ${roleConfig.color} uppercase tracking-[1px] leading-tight truncate max-w-[120px]`}>{roleConfig.subLabel}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              {roleConfig.idLabel}: {rollNo || 'VERIFIED'}
            </span>
          </div>

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
