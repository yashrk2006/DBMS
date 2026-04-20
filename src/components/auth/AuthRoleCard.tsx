'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, ArrowRight, CheckCircle2, Zap } from 'lucide-react';

interface AuthRoleCardProps {
  role: {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    tag: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  onAuth: () => void;
  loading: boolean;
  type: 'login' | 'signup';
}

export default function AuthRoleCard({ 
  role, 
  isSelected, 
  onSelect, 
  onAuth, 
  loading,
  type 
}: AuthRoleCardProps) {
  const Icon = role.icon;

  return (
    <motion.div
      layout
      onClick={onSelect}
      className={`cursor-pointer group relative p-8 rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${
        isSelected 
          ? "border-amber-600 bg-amber-600/[0.03] shadow-2xl shadow-amber-600/10 scale-[1.02]" 
          : "border-slate-100 bg-white hover:border-slate-200"
      }`}
    >
      {/* Background Decor */}
      <div className={`absolute -right-4 -top-4 size-24 rounded-full blur-3xl transition-opacity duration-500 ${
        isSelected ? "bg-amber-600/10 opacity-100" : "bg-transparent opacity-0"
      }`} />

      <div className="flex flex-col h-full relative z-10">
        <div className="flex items-start justify-between mb-8">
          <div className={`size-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
            isSelected ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 font-bold"
          }`}>
            <Icon size={28} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-[2px] px-3 py-1.5 rounded-full ${
            isSelected ? "bg-amber-600/10 text-amber-600" : "bg-slate-50 text-slate-400"
          }`}>
            {role.tag}
          </span>
        </div>

        <div className="flex-1">
          <h3 className={`text-xl font-black tracking-tighter uppercase mb-3 transition-colors ${
            isSelected ? "text-slate-950" : "text-slate-900"
          }`}>
            {role.title}
          </h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed italic mb-6">
            "{role.description}"
          </p>
        </div>

        <AnimatePresence mode="wait">
          {isSelected ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 pt-4 border-t border-amber-600/10"
            >
              <button
                onClick={(e) => { e.stopPropagation(); onAuth(); }}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-slate-950 text-white flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[3px] hover:bg-amber-600 transition-all shadow-xl shadow-slate-950/20 group/btn"
              >
                {loading ? (
                  <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap size={16} className="text-amber-500 group-hover/btn:text-white transition-colors" />
                    {type === 'login' ? 'Student Login' : 'Get Started'}
                  </>
                )}
              </button>
              <p className="text-center text-[9px] font-bold text-amber-600 uppercase tracking-widest flex items-center justify-center gap-2">
                 <CheckCircle2 size={10} /> Secure Sync Active
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[2px] text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all"
            >
              Select Role <ArrowRight size={14} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
