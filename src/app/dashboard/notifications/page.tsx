'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Bell, CheckCircle2, AlertCircle, Info, BellRing, Check, Trash2, RefreshCw } from 'lucide-react';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { toast } from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) { setLoading(false); return; }
    setUserId(uid);

    const res = await fetch(`/api/notifications?userId=${uid}`);
    const data = await res.json();
    if (data.success) setNotifications(data.notifications || data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAsRead = async (notifId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notifId })
      });
      setNotifications(prev => prev.map(n => n.notification_id === notifId ? { ...n, is_read: true } : n));
    } catch (e) { console.error(e); }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    setMarkingAll(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (e) { toast.error('Failed to mark all as read'); }
    setMarkingAll(false);
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'system':       return <Info size={18} className="text-indigo-500" />;
      case 'application':  return <CheckCircle2 size={18} className="text-emerald-500" />;
      case 'interview':    return <AlertCircle size={18} className="text-amber-500" />;
      default:             return <Bell size={18} className="text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-12 p-6 lg:p-10 max-w-4xl mx-auto pb-24">
      <AnimatedSection direction="up" distance={40}>
        <div className="flex items-center gap-4 mb-4">
           <div className="size-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xl border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
              <BellRing size={18} className="relative z-10" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 size-4 bg-amber-500 text-slate-900 text-[8px] font-black rounded-full flex items-center justify-center border-2 border-slate-900">
                  {unreadCount}
                </span>
              )}
           </div>
           <h2 className="text-[10px] font-black uppercase tracking-[8px] text-slate-400">System Alerts</h2>
        </div>
        <div className="flex items-end justify-between">
          <h1 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tight uppercase leading-[0.9]">
            Notice<br /><span className="text-slate-600">Board.</span>
          </h1>
          <div className="flex items-center gap-3 pb-2">
            <button
              onClick={load}
              className="size-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-sm hover:shadow transition-all"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="px-5 py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[3px] flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xl border border-white/10"
              >
                <Check size={14} className="text-amber-400" />
                Flush Notifications
              </button>
            )}
          </div>
        </div>
        <p className="max-w-xl text-slate-500 font-medium text-lg leading-relaxed mt-6 uppercase tracking-tight">Real-time synchronization logs and intelligence updates.</p>
      </AnimatedSection>

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white/50 h-24 rounded-[2rem] animate-pulse border border-slate-100" />
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map((n, i) => (
              <motion.div
                key={n.notification_id || i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-white p-6 rounded-[2rem] border transition-all flex items-start gap-6 group cursor-pointer ${
                  n.is_read ? 'border-slate-100 shadow-sm' : 'border-[#575a93]/20 shadow-md shadow-[#575a93]/5 bg-gradient-to-r from-white to-[#575a93]/[0.02]'
                }`}
                onClick={() => !n.is_read && markAsRead(n.notification_id)}
              >
                <div className={`size-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0 border transition-all duration-500 ${
                  n.is_read ? 'bg-slate-50 border-slate-100 group-hover:bg-slate-100' : 'bg-indigo-500/10 border-indigo-500/20 group-hover:border-indigo-500/40'
                }`}>
                  <div className={n.is_read ? 'opacity-40 grayscale' : 'animate-pulse'}>
                    {getIcon(n.type)}
                  </div>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className={`text-base font-black tracking-tight ${n.is_read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</h3>
                    <div className="flex items-center gap-3 shrink-0">
                      {!n.is_read && (
                        <div className="size-2 rounded-full bg-[#575a93] animate-pulse" />
                      )}
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{n.message || 'System intelligence payload received.'}</p>
                  {!n.is_read && (
                    <div className="pt-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#575a93]/60">
                        Click to mark as read
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!loading && notifications.length === 0 && (
          <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50">
            <Bell size={48} className="text-slate-300 mx-auto mb-6" />
            <p className="text-lg font-black uppercase tracking-tight text-slate-400">Log Clear.</p>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300 mt-2">No new intelligence signals detected.</p>
          </div>
        )}
      </div>
    </div>
  );
}
