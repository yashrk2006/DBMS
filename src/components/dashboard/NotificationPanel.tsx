'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, ShieldAlert, CheckCircle2, Clock, MapPin, Search, MailOpen } from 'lucide-react';
import { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id?: string) => void;
}

export function NotificationPanel({ isOpen, onClose, notifications, onMarkRead }: NotificationPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
          />

          {/* Panel */}
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col border-l border-slate-100"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
               <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Recent Notifications</h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[3px]">Stay Updated</p>
               </div>
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onMarkRead()}
                    className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors flex items-center gap-1.5"
                  >
                    <MailOpen size={12} /> Mark All Read
                  </button>
                  <button 
                    onClick={onClose}
                    className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all hover:bg-slate-100"
                  >
                    <X size={20} />
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
               {notifications.length > 0 ? (
                 notifications.map((notif) => (
                   <motion.div 
                     key={notif.notification_id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     onClick={() => !notif.is_read && onMarkRead(notif.notification_id)}
                     className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer relative group ${
                       notif.is_read 
                         ? 'bg-white border-slate-100 opacity-60' 
                         : 'bg-white border-indigo-100 shadow-lg shadow-indigo-600/5 ring-1 ring-indigo-50'
                     }`}
                   >
                     {!notif.is_read && (
                       <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-full" />
                     )}
                     
                     <div className="flex gap-4">
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                           notif.type === 'interview' ? 'bg-indigo-50 text-indigo-600' :
                           notif.type === 'application' ? 'bg-emerald-50 text-emerald-600' :
                           notif.type === 'community' ? 'bg-amber-50 text-amber-600' :
                           'bg-slate-50 text-slate-600'
                        }`}>
                           {notif.type === 'interview' ? <ShieldAlert size={18} /> :
                            notif.type === 'application' ? <CheckCircle2 size={18} /> :
                            notif.type === 'community' ? <Clock size={18} /> : 
                            <Bell size={18} />}
                        </div>
                        <div className="space-y-1">
                           <div className="flex items-center justify-between gap-4">
                              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{notif.title}</h3>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                 {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                              </span>
                           </div>
                           <p className="text-[11px] font-medium text-slate-500 leading-relaxed group-hover:text-slate-900 transition-colors">
                              {notif.message}
                           </p>
                        </div>
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                    <div className="size-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-300">
                       <Search size={32} />
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-sm font-black text-slate-900 uppercase">All caught up</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No new notifications at the moment.</p>
                    </div>
                 </div>
               )}
            </div>

            <div className="p-8 bg-white border-t border-slate-50">
               <button 
                 onClick={onClose}
                 className="w-full py-4 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:bg-black transition-all shadow-xl active:scale-95"
               >
                 Close Panel
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
