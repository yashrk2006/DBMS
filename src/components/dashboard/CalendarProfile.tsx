'use client';

import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, CalendarOff, Users, Bell, User, Clock, CalendarDays } from 'lucide-react';
import Icon from '@/components/ui/Icon';
import { CalendarEvent } from '@/types';

interface CalendarProfileProps {
  currentMonth: Date;
  selectedDate: Date | null;
  events: CalendarEvent[];
  onMonthChange: (date: Date) => void;
  onDateSelect: (date: Date | null) => void;
  onViewAllCalendar: () => void;
}

export const CalendarProfile = ({
  currentMonth,
  selectedDate,
  events,
  onMonthChange,
  onDateSelect,
  onViewAllCalendar
}: CalendarProfileProps) => {
  const getCalendarDays = () => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const firstDay = startOfMonth.getDay();
    const days = [];
    
    // Days from prev month
    const prevMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ val: prevMonthEnd - i, current: false, month: currentMonth.getMonth() - 1 });
    }
    // Days from current month
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      days.push({ val: i, current: true, month: currentMonth.getMonth() });
    }
    // Days from next month
    while (days.length < 42) {
      days.push({ val: days.length - (firstDay + endOfMonth.getDate()) + 1, current: false, month: currentMonth.getMonth() + 1 });
    }
    return days;
  };

  const dayEvents = (dateObj: {val: number, current: boolean, month: number}) => {
    return events.filter(e => {
        const d = new Date(e.start_time);
        return d.getDate() === dateObj.val && d.getMonth() === dateObj.month;
     });
  };

  const filteredEvents = selectedDate 
    ? events.filter(e => {
        const d = new Date(e.start_time);
        return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth();
      })
    : events;

  return (
    <aside className="w-full xl:w-[340px] flex flex-col gap-8">
      {/* Unified Calendar & Schedule Box */}
      <div className="bg-white p-8 rounded-[2.2rem] shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-slate-50 flex flex-col gap-10">
        
        {/* Section 1: Interaction Grid */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                <Calendar size={14} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                {currentMonth.toLocaleString('en-us', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} 
                className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={16} className="text-slate-400" />
              </button>
              <button 
                onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} 
                className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-3 text-center">
            {['S','M','T','W','T','F','S'].map((d, i) => <span key={i} className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{d}</span>)} 
            {getCalendarDays().map((dateObj, i) => {
              const now = new Date();
              const isToday = dateObj.val === now.getDate() && dateObj.current && dateObj.month === now.getMonth() && currentMonth.getFullYear() === now.getFullYear();
              const isSelected = selectedDate?.getDate() === dateObj.val && selectedDate?.getMonth() === dateObj.month && dateObj.current;
              const eventsForDay = dayEvents(dateObj);
              const hasEvent = eventsForDay.length > 0;
              
              return (
                <span 
                  key={`date-${i}`} 
                  onClick={() => {
                    if (dateObj.current) {
                      const newDate = new Date(currentMonth.getFullYear(), dateObj.month, dateObj.val);
                      onDateSelect(isSelected ? null : newDate);
                    }
                  }}
                  className={`text-[11px] font-black relative flex items-center justify-center w-7 h-7 mx-auto transition-all cursor-pointer rounded-lg ${
                    isSelected ? 'bg-amber-400 text-slate-950 scale-110 shadow-lg' : 
                    hasEvent ? 'bg-[#575a93] text-white shadow-sm' : 
                    isToday ? 'border-2 border-[#575a93] text-[#575a93]' : 
                    'hover:bg-slate-50 text-slate-600'
                  } ${!dateObj.current ? 'opacity-10 pointer-events-none' : ''}`}
                >
                  {dateObj.val}
                  {hasEvent && !isSelected && <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full" />}
                </span>
              );
            })}
          </div>
        </div>

        {/* Separator Line */}
        <div className="h-px bg-slate-100 w-full" />

        {/* Section 2: Upcoming Events List */}
        <div className="flex flex-col flex-1 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-[13px] uppercase tracking-tight text-slate-900">Upcoming Events</h3>
            <button onClick={onViewAllCalendar} className="text-[9px] font-black text-[#9395D3] hover:text-[#575a93] transition-colors uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">View All</button>
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar max-h-[500px]">
             {filteredEvents.length === 0 ? (
               <div className="py-12 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                 <CalendarOff size={32} className="text-slate-200 animate-pulse mx-auto" />
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                   {selectedDate ? "No events for this date" : "No upcoming events found"}
                 </p>
               </div>
             ) : (
               filteredEvents.map(e => (
                 <div key={e.event_id || e.id} className="shrink-0 bg-slate-50 p-5 rounded-[2rem] border border-slate-100 group hover:border-[#575a93]/20 transition-all cursor-pointer relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-5 transition-opacity z-0">
                        <Users size={32} className="text-slate-950" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <Bell size={14} className="text-orange-400 group-hover:text-[#575a93] transition-colors" />
                        <span className="text-[8px] font-black uppercase tracking-[1px] text-[#575a93] bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">Event</span>
                      </div>
                      <h4 className="text-[14px] font-black mb-1 leading-tight group-hover:text-[#575a93] transition-colors pr-6">{e.title}</h4>
                      <div className="flex items-center gap-2 mb-4">
                          <div className="size-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[#575a93] shadow-sm">
                              <User size={10} />
                          </div>
                           <p className="text-[9px] font-black text-slate-500 uppercase">{e.recruiter_name || "Coordinator"}</p>
                      </div>
                      <div className="mt-auto">
                        <p className="text-[8px] text-slate-400 leading-tight font-black uppercase tracking-widest flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200/50 w-fit">
                          <Clock size={12} className="text-[#575a93]" />
                          {new Date(e.start_time).toLocaleString('en-us', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          <span className="mx-1 opacity-20 text-slate-950">|</span>
                          {new Date(e.start_time).toLocaleString('en-us', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
               ))
             )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CalendarProfile;
