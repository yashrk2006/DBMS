'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';
import { Activity, Cpu, Zap, Radio } from 'lucide-react';

interface HUDProps {
  progress: MotionValue<number>;
  range?: [number, number];
}

export function SkillSyncNetworkHUD({ progress, range = [0.2, 0.4] }: HUDProps) {
  // Descent from top with perspective tilt
  const midRange = (range[0] + range[1]) / 2;
  const y = useTransform(progress, range, [-200, 100]);
  const opacity = useTransform(
    progress, 
    [range[0], range[0] + 0.05, range[1] - 0.05, range[1]], 
    [0, 0.6, 0.6, 0] // Peaks in the middle, fades at edges
  );
  const rotateX = useTransform(progress, range, [-30, 10]);
  const scale = useTransform(progress, range, [0.6, 0.8]);
  const z = useTransform(progress, range, [-100, 50]);

  return (
    <motion.div
      style={{ y, opacity, rotateX, scale, z, perspective: 1200 }}
      className="pointer-events-none fixed inset-x-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-4 md:p-20"
    >
      <div className="relative size-[320px] md:size-[600px] flex items-center justify-center">
        {/* --- VISUAL RINGS (SVG) --- */}
        <svg className="absolute inset-0 size-full overflow-visible drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]">
          {/* Main Outer Ring */}
          <motion.circle
            cx="50%" cy="50%" r="48%"
            fill="none"
            stroke="url(#amber-grad)"
            strokeWidth="1"
            strokeDasharray="10 40 100 20"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Secondary Intermittent Ring */}
          <motion.circle
            cx="50%" cy="50%" r="42%"
            fill="none"
            stroke="rgba(245,158,11,0.2)"
            strokeWidth="0.5"
            strokeDasharray="2 10"
            animate={{ rotate: -360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          />

          {/* Scanning Line */}
          <motion.line
            x1="50%" y1="10%" x2="50%" y2="50%"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            className="origin-bottom opacity-50"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          <defs>
            <linearGradient id="amber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* --- CENTRAL INTERFACE --- */}
        <div className="relative z-10 size-48 md:size-64 rounded-full bg-slate-950/40 backdrop-blur-3xl border border-amber-500/20 flex flex-col items-center justify-center p-4 md:p-8 text-center group">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-2 md:mb-4 text-amber-500"
          >
            <Zap size={32}  strokeWidth={1} />
          </motion.div>
          
          <div className="text-[7px] md:text-[10px] font-black tracking-[0.4em] text-amber-500 uppercase mb-1 md:mb-2">SkillSync Active</div>
          <div className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-2 md:mb-4">Skill <br /> Sync</div>
          
          <div className="flex gap-1 md:gap-2">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ delay: i * 0.2, duration: 1, repeat: Infinity }}
                className="w-1 md:w-1.5 h-4 md:h-6 bg-amber-500 rounded-full"
              />
            ))}
          </div>
        </div>

        {/* --- FLOATING HUD LABELS --- */}
        <div className="absolute inset-0 font-mono text-[7px] md:text-[9px] font-black uppercase tracking-widest text-amber-500/60">
           {/* Top Left */}
           <motion.div 
             animate={{ x: [-3, 3, -3] }}
             transition={{ duration: 4, repeat: Infinity }}
             className="absolute top-4 left-4 md:top-10 md:left-10 flex items-center gap-1 md:gap-2 border-l border-amber-500/30 pl-2 md:pl-3"
           >
              <Activity size={8}  />
              <span>STATUS::ACTIVE</span>
           </motion.div>

           {/* Top Right */}
           <motion.div 
             animate={{ x: [3, -3, 3] }}
             transition={{ duration: 5, repeat: Infinity }}
             className="absolute top-4 right-4 md:top-10 md:right-10 flex flex-col items-end gap-1 border-r border-amber-500/30 pr-2 md:pr-3"
           >
              <div className="flex items-center gap-1 md:gap-2">
                 <span>OPTIMIZED::ON</span>
                 <Radio size={8}  className="text-emerald-500" />
              </div>
              <span className="text-[6px] md:text-[7px] text-white/40">DATA_VERIFIED</span>
           </motion.div>

           {/* Bottom Left */}
           <motion.div className="absolute bottom-10 left-0 md:bottom-20 md:left-0 space-y-1 md:space-y-2">
              <div className="flex items-center gap-2 md:gap-3">
                 <div className="size-1 md:size-2 bg-amber-500 animate-ping" />
                 <span>PLATFORM_ONLINE</span>
              </div>
              <div className="w-20 md:w-32 h-[1px] bg-gradient-to-r from-amber-500/50 to-transparent" />
           </motion.div>

           {/* Bottom Right */}
           <motion.div className="absolute bottom-10 right-0 md:bottom-20 md:right-0 text-right">
              <div className="mb-1 md:mb-2 text-white font-black italic text-xs md:text-sm">#CAREER_HUB</div>
              <div className="flex gap-0.5 md:gap-1 justify-end">
                {[...Array(10)].map((_, i) => (
                   <motion.div
                     key={i}
                     animate={{ height: [3, 10, 3] }}
                     transition={{ delay: i * 0.1, duration: 0.5, repeat: Infinity }}
                     className="w-0.5 bg-amber-500"
                   />
                ))}
              </div>
           </motion.div>
        </div>

        {/* --- SCANNING OVERLAY --- */}
        <motion.div
          animate={{ x: ['100%', '-100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-x-0 h-[1.5px] md:h-[2px] bg-amber-500/20 blur-sm pointer-events-none"
          style={{ top: '45%' }}
        />
      </div>
    </motion.div>
  );
}
