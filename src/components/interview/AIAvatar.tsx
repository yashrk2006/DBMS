'use client';

import { motion, useAnimation } from 'framer-motion';
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
    <div className="relative w-full max-w-[400px] aspect-[4/5] mx-auto rounded-[3rem] overflow-hidden bg-slate-100 shadow-2xl border-4 border-white">
      {/* Background Image (Realistic Portrait) */}
      <img 
        src="/images/interviewer.png" 
        alt="AI Interviewer" 
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Thinking / Processing Overlay */}
      {isThinking && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-indigo-900/10 backdrop-blur-[2px] z-10 flex items-center justify-center"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="size-12 border-4 border-indigo-500 border-t-transparent rounded-full"
          />
        </motion.div>
      )}

      {/* SVG Animation Layer - Eyes and Mouth Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 400 500">
        {/* We use specific coordinates roughly matching a standard headshot */}
        {/* These positions are calculated for the generated portrait style */}
        
        {/* Left Eye Mask Area (rough position) */}
        <g transform="translate(165, 185)">
           <circle cx="0" cy="0" r="8" fill="white" opacity="0.1" />
           <motion.circle 
             animate={{ x: eyePos.x, y: eyePos.y }}
             cx="0" cy="0" r="3" fill="#1e293b" 
           />
        </g>

        {/* Right Eye Mask Area (rough position) */}
        <g transform="translate(235, 185)">
           <circle cx="0" cy="0" r="8" fill="white" opacity="0.1" />
           <motion.circle 
             animate={{ x: eyePos.x, y: eyePos.y }}
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
