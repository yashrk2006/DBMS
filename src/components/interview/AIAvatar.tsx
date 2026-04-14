'use client';

import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AIAvatarProps {
  isSpeaking?: boolean;
  isThinking?: boolean;
}

export function AIAvatar({ isSpeaking = false, isThinking = false }: AIAvatarProps) {
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const mouthControls = useAnimation();

  // Eye movement logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSpeaking) {
        setEyePos({
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 2,
        });
      } else {
        setEyePos({ x: 0, y: 0 }); // Look at user when speaking
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Lip sync / Mouth movement logic
  useEffect(() => {
    if (isSpeaking) {
      mouthControls.start({
        scaleY: [1, 1.5, 0.8, 1.3, 1],
        transition: {
          duration: 0.4,
          repeat: Infinity,
          ease: "easeInOut"
        }
      });
    } else {
      mouthControls.stop();
      mouthControls.set({ scaleY: 1 });
    }
  }, [isSpeaking, mouthControls]);

  return (
    <div className="relative w-full max-w-[280px] md:max-w-[400px] aspect-[4/5] mx-auto rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-slate-100 shadow-2xl border-2 md:border-4 border-white">
      {/* Background Image (Realistic Portrait) */}
      <img 
        src="/images/interviewer.png" 
        alt="AI Interviewer" 
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Thinking / Processing Overlay: Neural Pulse Engine */}
      <AnimatePresence>
        {isThinking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-indigo-950/40 backdrop-blur-[2px] z-10 flex items-center justify-center p-12"
          >
             <div className="relative size-full">
                <svg className="size-full overflow-visible" viewBox="0 0 100 100">
                   {/* Neural Grid Nodes */}
                   {[
                     { x: 30, y: 30 }, { x: 70, y: 30 }, 
                     { x: 50, y: 50 }, 
                     { x: 30, y: 70 }, { x: 70, y: 70 },
                     { x: 50, y: 20 }, { x: 80, y: 50 }, { x: 20, y: 50 }
                   ].map((node, i) => (
                     <g key={i}>
                        {/* Connection Lines to Center */}
                        <motion.line 
                          x1={node.x} y1={node.y} x2={50} y2={50}
                          stroke="rgba(99, 102, 241, 0.4)"
                          strokeWidth="0.3"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: [0, 1, 0] }}
                          transition={{ 
                            duration: 2 + Math.random(), 
                            repeat: Infinity, 
                            delay: i * 0.15,
                            ease: "easeInOut"
                          }}
                        />
                        <motion.circle 
                          cx={node.x} cy={node.y} r="1.5"
                          fill="#6366f1"
                          animate={{ 
                            scale: [1, 1.4, 1], 
                            opacity: [0.4, 1, 0.4],
                            filter: ["blur(0px)", "blur(1px)", "blur(0px)"]
                          }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        />
                        <motion.circle 
                          cx={node.x} cy={node.y} r="5"
                          stroke="#6366f1" strokeWidth="0.1" fill="transparent"
                          animate={{ scale: [1, 4, 1], opacity: [0.2, 0, 0.2] }}
                          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2 }}
                        />
                     </g>
                   ))}
                </svg>
                <div className="absolute inset-x-0 bottom-4 text-center">
                   <div className="flex items-center justify-center gap-2">
                     <span className="text-[7px] font-black text-indigo-400 uppercase tracking-[4px] animate-pulse">Neural Core // Active</span>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Institutional Scanner Overlay */}
      <motion.div 
        animate={{ y: ['0%', '1000%', '0%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent z-10 opacity-30 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
      />

      {/* SVG Animation Layer - Eyes and Mouth Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 400 500">
        {/* We use specific coordinates roughly matching a standard headshot */}
        {/* These positions are calculated for the generated portrait style */}
        
        {/* Left Eye Mask Area (rough position) */}
        <g transform="translate(165, 185)">
           <circle cx="0" cy="0" r="8" fill="white" opacity="0.1" />
           <motion.circle 
             animate={{ x: eyePos.x, y: eyePos.y }}
             transition={{ type: "spring", stiffness: 100, damping: 10 }}
             cx="0" cy="0" r="3" fill="#1e293b" 
           />
        </g>

        {/* Right Eye Mask Area */}
        <g transform="translate(235, 185)">
           <circle cx="0" cy="0" r="8" fill="white" opacity="0.1" />
           <motion.circle 
             animate={{ x: eyePos.x, y: eyePos.y }}
             transition={{ type: "spring", stiffness: 100, damping: 10 }}
             cx="0" cy="0" r="3" fill="#1e293b" 
           />
        </g>

        {/* Mouth Overlay Area */}
        {/* We apply a subtle shadow and scale it to simulate talking */}
        <motion.g 
          animate={mouthControls}
          transform="translate(200, 285)"
        >
           {/* A dark horizontal line that scales up/down */}
           <rect x="-15" y="-1" width="30" height="2" rx="1" fill="#4a1a1a" opacity="0.6" />
        </motion.g>
      </svg>

      {/* Subtle Breathing / Pulsing Effect */}
      <motion.div 
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"
      />
    </div>
  );
}
