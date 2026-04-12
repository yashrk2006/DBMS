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
  onProfileClick,
  onLogout,
  onMarkRead
}: DashboardHeaderProps) => {
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[4px]">Verified Career Profile</span>
          <div className="h-[1px] w-8 bg-amber-500/30" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter">
          Welcome back,
          <br className="hidden md:block" /> {userName || 'Student'}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
        <div className="relative group flex-1 max-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-[#575a93] transition-colors" />
          <input 
            type="text"
            placeholder="Search Jobs & Skills..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300 focus:outline-none focus:border-[#575a93]/30 focus:bg-white shadow-soft transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 pl-2 md:pl-4 border-l border-slate-100">
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
            className="size-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer active:scale-95"
            title="Logout"
          >
            <Icon name="logout" className="text-lg" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
