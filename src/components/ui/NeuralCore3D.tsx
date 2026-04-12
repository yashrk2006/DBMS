'use client';

import { motion } from 'framer-motion';

interface NeuralCoreProps {
  status?: 'idle' | 'processing' | 'active';
  size?: number;
}

export function NeuralCore3D({ status = 'active', size = 300 }: NeuralCoreProps) {
  const isProcessing = status === 'processing';
  const isActive = status === 'active';

  return (
    <div 
      className="relative flex items-center justify-center p-12"
      style={{ width: size, height: size, perspective: 1000 }}
    >
      {/* --- LAYERED HOLOGRAPHIC RINGS --- */}
      
      {/* Outer X-Axis Ring */}
      <motion.div
        animate={{ rotateX: 360, rotateZ: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-x-0 inset-y-0 rounded-full border border-amber-500/10 shadow-[0_0_50px_rgba(245,158,11,0.1)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
         <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      </motion.div>

      {/* Mid Y-Axis Ring */}
      <motion.div
        animate={{ rotateY: -360, rotateZ: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-2 rounded-full border border-indigo-500/10 shadow-[0_0_40px_rgba(79,70,229,0.1)]"
        style={{ transformStyle: 'preserve-3d' }}
      >
         <div className="absolute left-1/2 top-0 h-full w-[1px] bg-gradient-to-b from-transparent via-indigo-500/40 to-transparent" />
      </motion.div>

      {/* Inner Rapid Scan Ring */}
      <motion.div
        animate={{ rotateZ: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-8 rounded-full border-t border-r border-amber-500/40 border-l-transparent border-b-transparent animate-pulse"
      />

      {/* --- CENTRAL NEURAL ORB --- */}
      <div className="relative size-16 transform-gpu" style={{ transformStyle: 'preserve-3d' }}>
         {/* Glow Layer */}
         <motion.div 
           animate={{ 
             scale: isActive ? [1, 1.2, 1] : 1,
             opacity: isActive ? [0.6, 1, 0.6] : 0.4
           }}
           transition={{ duration: 2, repeat: Infinity }}
           className="absolute -inset-10 rounded-full bg-amber-500/20 blur-3xl"
         />
         
         {/* Core Sphere */}
         <motion.div 
            animate={isProcessing ? {
              scale: [1, 0.9, 1.1, 1],
              boxShadow: [
                '0 0 40px rgba(245,158,11,0.4)',
                '0 0 80px rgba(245,158,11,0.8)',
                '0 0 40px rgba(245,158,11,0.4)'
              ]
            } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-gradient-radial from-amber-400 via-amber-600 to-slate-900 border border-white/40 shadow-[0_0_30px_rgba(245,158,11,0.6)]" 
         />
      </div>

      {/* --- TELEMETRY LABELS --- */}
      <div className="absolute inset-0 font-mono text-[8px] font-black uppercase tracking-widest text-amber-500/40">
         <div className="absolute top-0 left-0 border-l border-t border-amber-500/20 p-2">SYSTEM_V:1.0.4</div>
         <div className="absolute bottom-0 right-0 border-r border-b border-amber-500/20 p-2 text-right">SYNC:ACTIVE</div>
      </div>
    </div>
  );
}
