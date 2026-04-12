'use client';

import { motion } from 'framer-motion';
import { Target, Lightbulb, CheckCircle2, Circle, ArrowRight } from 'lucide-react';

interface RadarData {
  subject: string;
  value: number;
  fullMark: number;
}

interface AnalysisMetricsProps {
  radarData: RadarData[];
  roadmap: string[];
  missingSkills: string[];
}

export function RadarChart({ data }: { data: RadarData[] }) {
  const size = 300;
  const center = size / 2;
  const radius = center * 0.7;
  const totalLevels = 5;

  const points = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
    const x = center + radius * (d.value / d.fullMark) * Math.cos(angle);
    const y = center + radius * (d.value / d.fullMark) * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background webs */}
        {[...Array(totalLevels)].map((_, i) => {
          const lRadius = (radius * (i + 1)) / totalLevels;
          const levelPoints = data.map((_, j) => {
            const angle = (Math.PI * 2 * j) / data.length - Math.PI / 2;
            const x = center + lRadius * Math.cos(angle);
            const y = center + lRadius * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ');
          return (
            <polygon
              key={i}
              points={levelPoints}
              className="fill-none stroke-slate-100 stroke-1"
            />
          );
        })}
        
        {/* Axis lines */}
        {data.map((_, i) => {
          const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center} y1={center}
              x2={x} y2={y}
              className="stroke-slate-100 stroke-1"
            />
          );
        })}

        {/* Data polygon */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.2, scale: 1 }}
          points={points}
          className="fill-indigo-600"
        />
        <motion.polygon
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          points={points}
          className="fill-none stroke-indigo-600 stroke-2"
        />

        {/* Labels */}
        {data.map((d, i) => {
          const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
          const x = center + (radius + 25) * Math.cos(angle);
          const y = center + (radius + 25) * Math.sin(angle);
          return (
            <text
              key={i}
              x={x} y={y}
              textAnchor="middle"
              className="text-[9px] font-black fill-slate-400 uppercase tracking-widest"
            >
              {d.subject}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function RoadmapTimeline({ roadmap }: { roadmap: string[] }) {
  return (
    <div className="space-y-6">
      {roadmap.map((item, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex gap-6 relative"
        >
          {i < roadmap.length - 1 && (
            <div className="absolute left-[11px] top-8 bottom-[-24px] w-px bg-slate-100" />
          )}
          <div className="relative z-10 size-6 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-sm">
             <div className="size-2 rounded-full bg-indigo-600" />
          </div>
          <div className="flex-1 pb-8">
            <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Step 0{i+1}</div>
            <p className="text-sm font-bold text-slate-800 leading-relaxed">{item}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function SkillGapAnalysis({ missing }: { missing: string[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {missing.map((skill, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
           <div className="size-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Target size={16} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{skill}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Gap Identified</p>
           </div>
        </div>
      ))}
    </div>
  );
}
