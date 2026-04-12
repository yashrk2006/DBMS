'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Calendar as CalendarIcon, Clock, MapPin, Sparkles, LayoutGrid, Plus, X, Video, FileText } from 'lucide-react';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { toast } from 'react-hot-toast';

const EVENT_TYPES = [
  { value: 'Interview', label: 'Technical Interview', icon: '💼' },
  { value: 'Workshop', label: 'Workshop / Webinar', icon: '🎓' },
  { value: 'Deadline', label: 'Application Deadline', icon: '⚡' },
  { value: 'Networking', label: 'Networking Event', icon: '🤝' },
];

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: 'Interview',
    start_time: '',
    location: '',
  });

  const load = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) { setLoading(false); return; }
      setUserId(uid);
      
      const res = await fetch(`/api/dashboard/calendar?userId=${uid}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSchedule = async () => {
    if (!form.title || !form.start_time) {
      toast.error('Title and date/time are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, user_id: userId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Interview scheduled successfully! 📅');
        setIsSchedulerOpen(false);
        setForm({ title: '', description: '', event_type: 'Interview', start_time: '', location: '' });
        await load();
      } else {
        toast.error(data.error || 'Failed to schedule interview.');
      }
    } catch (e) {
      toast.error('Network error — please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { month: 'ERR', day: '!!', time: 'HH:MM' };
      return {
        month: d.toLocaleString('en-US', { month: 'short' }),
        day: d.getDate(),
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch {
      return { month: 'ERR', day: '!!', time: 'HH:MM' };
    }
  };

  const typeColors: Record<string, string> = {
    'Interview':   'bg-indigo-50 text-indigo-600 border-indigo-100',
    'Workshop':    'bg-amber-50 text-amber-600 border-amber-100',
    'Deadline':    'bg-rose-50 text-rose-600 border-rose-100',
    'Networking':  'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <div className="space-y-12 p-6 lg:p-12 max-w-7xl mx-auto pb-32">
      <AnimatedSection direction="up" distance={40}>
        <div className="flex items-center gap-4 mb-6">
           <div className="size-12 rounded-2xl bg-[#575a93]/10 flex items-center justify-center text-[#575a93] shadow-inner border border-[#575a93]/10">
              <CalendarIcon size={22} className="opacity-80" />
           </div>
           <div>
             <h2 className="text-[11px] font-black uppercase tracking-[6px] text-slate-400 mb-0.5">Your Schedule</h2>
             <div className="flex items-center gap-2">
               <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Syncing</p>
             </div>
           </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div className="relative">
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85]">
              Career<br /><span className="text-[#575a93] opacity-90 inline-flex items-center gap-4">Timeline.<Sparkles className="text-amber-400 size-10 md:size-16" /></span>
            </h1>
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-32 h-32 bg-[#575a93]/5 blur-[100px] rounded-full pointer-events-none" />
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsSchedulerOpen(true)}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[4px] hover:bg-[#575a93] transition-all shadow-xl shadow-slate-900/20 mb-2"
          >
            <Plus size={16} />
            Schedule Event
          </motion.button>
        </div>
        
        <p className="max-w-2xl text-slate-500 font-medium text-xl leading-relaxed mt-10 tracking-tight">
          Manage your upcoming <span className="text-black font-black">interviews</span>, workshops, and career readiness milestones.
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pt-6">
         {loading ? (
             [1, 2].map(i => (
               <div key={i} className="h-40 bg-white rounded-[3rem] animate-pulse border border-slate-100 shadow-soft" />
             ))
         ) : events.map((e, i) => {
             const { month, day, time } = formatDate(e.start_time);
             return (
               <AnimatedSection key={e.event_id || i} direction="up" delay={i*0.1} className="relative bg-white/70 backdrop-blur-xl p-10 rounded-[3.5rem] shadow-premium border border-white/40 hover:border-[#575a93]/20 transition-all flex flex-col md:flex-row items-center md:items-start gap-10 group overflow-hidden">
                   <div className="shrink-0 w-28 h-32 bg-slate-950 rounded-[2rem] flex flex-col items-center justify-center text-white shadow-2xl relative z-10 group-hover:scale-105 transition-transform duration-500">
                       <span className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-1">{month}</span>
                       <span className="text-5xl font-black tracking-tighter">{day}</span>
                       <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-20 pointer-events-none" />
                   </div>

                   <div className="flex-1 space-y-6 text-center md:text-left relative z-10 w-full">
                       <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                           <div>
                             <h3 className="text-2xl font-black tracking-tight text-slate-950 group-hover:text-[#575a93] transition-colors">{e.title}</h3>
                             <div className={`inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${typeColors[e.event_type] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                               {e.event_type}
                             </div>
                           </div>
                           <div className="size-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 group-hover:text-[#575a93] group-hover:border-[#575a93]/10 transition-all">
                              <LayoutGrid size={18} />
                           </div>
                       </div>
                       
                       <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md">{e.description || 'Upcoming career event.'}</p>
                       
                       <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 pt-4">
                          <div className="flex items-center gap-2.5 text-[11px] font-black tracking-[0.1em] uppercase text-slate-400">
                             <div className="size-2 rounded-full bg-[#575a93] shadow-[0_0_10px_rgba(87,90,147,0.5)]" />
                             <Clock size={14} className="text-[#575a93]" /> {time}
                          </div>
                          <div className="flex items-center gap-2.5 text-[11px] font-black tracking-[0.1em] uppercase text-slate-400">
                             <MapPin size={14} className="text-[#575a93]" /> {e.location || 'Virtual Meeting'}
                          </div>
                       </div>
                   </div>
                   
                   <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-48 h-48 bg-slate-50 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
               </AnimatedSection>
             );
         })}

         {!loading && events.length === 0 && (
             <div className="xl:col-span-2 p-24 text-center border-2 border-dashed border-slate-200 rounded-[4rem] bg-slate-50/50 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#575a93]/10 to-transparent" />
                <Clock size={60} className="text-slate-200 mx-auto mb-8 opacity-50 group-hover:scale-110 transition-transform duration-700" />
                <p className="text-2xl font-black uppercase tracking-tight text-slate-300">No Events Scheduled Yet.</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mt-3">Click "Schedule Event" to add your first calendar item.</p>
                <button 
                  onClick={() => setIsSchedulerOpen(true)}
                  className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#575a93] transition-all shadow-lg"
                >
                  + Schedule Now
                </button>
             </div>
         )}
      </div>
      
      <div className="h-20" />

      <AnimatePresence>
        {isSchedulerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-xl"
            onClick={(e) => e.target === e.currentTarget && setIsSchedulerOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 24 }}
              className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="bg-slate-950 p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <CalendarIcon size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-2 rounded-full bg-[#575a93] animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-[5px] text-[#575a93]/80">Event Scheduler</span>
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Add to Calendar</h2>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-[2px] mt-2">Plan and save events to your career timeline.</p>
                </div>
                <button
                  onClick={() => setIsSchedulerOpen(false)}
                  className="absolute top-10 right-10 size-10 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Event Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Workshop with SkillSync Partner"
                    className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#575a93]/30 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    {EVENT_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setForm(p => ({ ...p, event_type: t.value }))}
                        className={`px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                          form.event_type === t.value
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                            : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <span>{t.icon}</span> {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm(p => ({ ...p, start_time: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#575a93]/30 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Location / Meet Link</label>
                  <div className="relative">
                    <Video size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))}
                      placeholder="Zoom / Google Meet / Campus Room"
                      className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#575a93]/30 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Notes (Optional)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Reference links, items to bring..."
                    rows={2}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#575a93]/30 focus:bg-white transition-all resize-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSchedule}
                  disabled={isSubmitting || !form.title || !form.start_time}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[4px] hover:bg-[#575a93] transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                      <Sparkles size={16} />
                    </motion.div>
                  ) : (
                    <Plus size={16} />
                  )}
                  {isSubmitting ? 'Adding...' : 'Add to Calendar'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
