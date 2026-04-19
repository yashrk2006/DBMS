'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, ChevronUp, ChevronDown, Database, Trash2, Maximize2, Minimize2, Download, Sparkles } from 'lucide-react';
import { useDBMS } from '@/context/DBMSContext';

export function SQLTraceOverlay() {
  const { traces, isConsoleOpen, setIsConsoleOpen, clearTraces } = useDBMS();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [viewMode, setViewMode] = useState<'LOGS' | 'SCHEMA' | 'INSIGHTS'>('LOGS');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<number[]>(Array(20).fill(12));
  const [qps, setQps] = useState(0.4);
  const [editingTraceId, setEditingTraceId] = useState<string | null>(null);
  const [editedSql, setEditedSql] = useState('');
  const [simResult, setSimResult] = useState<{ rows: number; latency: number; risk: 'LOW' | 'MED' | 'HIGH' } | null>(null);
  const [dbHealth, setDbHealth] = useState({ pool: 88, cpu: 12, connections: 8 });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Trigger pulse animation on new traces
  useEffect(() => {
    if (traces.length > 0) {
      setIsPinging(true);
      const timer = setTimeout(() => setIsPinging(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [traces.length]);

  // Live Jitter for Showcase Metrics
  useEffect(() => {
    const timer = setInterval(() => {
      setDbHealth(prev => ({
        pool: Math.min(98, Math.max(82, prev.pool + (Math.random() * 2 - 1))),
        cpu: Math.min(45, Math.max(4, prev.cpu + (Math.random() * 4 - 2))),
        connections: Math.max(1, prev.connections + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0))
      }));
      setPerformanceHistory(prev => [...prev.slice(1), Math.min(50, Math.max(5, prev[prev.length-1] + (Math.random() * 10 - 5)))]);
      setQps(prev => Math.min(2.5, Math.max(0.1, prev + (Math.random() * 0.4 - 0.2))));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const SCHEMA_DEFINITIONS: Record<string, any> = {
    student: {
      cols: ['id', 'name', 'roll_no', 'college', 'ai_match_score', 'ai_resume_analysis'],
      pk: 'student_id',
      indices: ['idx_roll_no', 'idx_ai_score'],
      description: 'Master student registry with integrated neural matching scores.'
    },
    application: {
      cols: ['id', 'student_id', 'internship_id', 'status', 'ai_match_score'],
      pk: 'application_id',
      indices: ['idx_student_internship'],
      description: 'Relational bridge tracking recruitment lifecycle and AI fit.'
    },
    internship: {
      cols: ['id', 'title', 'company_id', 'deadline', 'openings'],
      pk: 'internship_id',
      indices: ['idx_company_id'],
      description: 'Available corporate positions with associated skill nodes.'
    },
    company: {
      cols: ['id', 'name', 'industry', 'hq_location'],
      pk: 'company_id',
      indices: ['idx_industry'],
      description: 'Corporate partner directory for institutional recruitment.'
    },
    skill: {
      cols: ['id', 'skill_name', 'category'],
      pk: 'skill_name',
      indices: ['pk_skill_name'],
      description: 'Unified neural skill library spanning 50+ technical sectors.'
    }
  };

  const handleSimulate = (sql: string, operation: string) => {
    // Heuristic Simulation Engine
    const rows = sql.toLowerCase().includes('where') ? Math.floor(Math.random() * 5) + 1 : 450;
    const latency = Math.floor(Math.random() * 50) + 10;
    const isDangerous = (operation === 'DELETE' || operation === 'UPDATE') && !sql.toLowerCase().includes('where');
    
    setSimResult({
      rows,
      latency,
      risk: isDangerous ? 'HIGH' : (rows > 100 ? 'MED' : 'LOW')
    });
  };

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'Operation', 'Table', 'Description', 'SQL'],
      ...traces.map(t => [t.timestamp, t.operation, t.table, t.description, t.sql.replace(/\n/g, ' ')])
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SQL_Audit_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const highlightSQL = (sql: string) => {
    const keywords = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'NOW', 'AND', 'OR', 'JOIN', 'ON'];
    let highlighted = sql;
    keywords.forEach(key => {
      const reg = new RegExp(`\\b${key}\\b`, 'gi');
      highlighted = highlighted.replace(reg, `<span class="text-indigo-300 font-black">${key}</span>`);
    });
    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [traces, viewMode]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {isConsoleOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '60px' : '550px',
              boxShadow: isPinging ? '0 0 40px rgba(99, 102, 241, 0.4)' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`w-[420px] md:w-[520px] bg-slate-950/90 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden pointer-events-auto flex flex-col transition-shadow duration-500 ${isPinging ? 'border-indigo-500/50' : ''}`}
          >
            {/* Console Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className={`size-8 rounded-lg ${isPinging ? 'bg-indigo-500 text-white' : 'bg-indigo-500/20 text-indigo-400'} flex items-center justify-center transition-all duration-300`}>
                  <Terminal size={14} className={isPinging ? 'animate-pulse' : ''} />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[3px]">DBMS Live Trace</h3>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!isMinimized && (
                   <div className="flex items-center bg-white/5 rounded-lg p-1 mr-2 border border-white/5">
                      <button 
                        onClick={() => setViewMode('LOGS')}
                        className={`px-3 py-1 rounded-md text-[8px] font-black transition-all ${viewMode === 'LOGS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                      >
                         LOGS
                      </button>
                      <button 
                        onClick={() => setViewMode('SCHEMA')}
                        className={`px-3 py-1 rounded-md text-[8px] font-black transition-all ${viewMode === 'SCHEMA' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                      >
                         SCHEMA
                      </button>
                      <button 
                        onClick={() => setViewMode('INSIGHTS')}
                        className={`px-3 py-1 rounded-md text-[8px] font-black transition-all ${viewMode === 'INSIGHTS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                      >
                         INSIGHTS
                      </button>
                   </div>
                )}
                {!isMinimized && (
                   <button 
                     onClick={handleExport}
                     className="p-2 text-slate-500 hover:text-emerald-400 transition-colors"
                     title="Export Audit"
                   >
                     <Download size={14} />
                   </button>
                )}
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                   {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
                <button 
                  onClick={clearTraces}
                  className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Clear Log"
                >
                   <Trash2 size={14} />
                </button>
                <button 
                  onClick={() => setIsConsoleOpen(false)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                   <X size={14} />
                </button>
              </div>
            </div>

            {/* Console Body */}
            {!isMinimized && (
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
              >
                {viewMode === 'LOGS' ? (
                  traces.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                      {traces.map((trace) => (
                        <motion.div
                          key={trace.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-3 pb-6 border-b border-white/5 last:border-0"
                        >
                          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full border ${
                                trace.operation === 'INSERT' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' :
                                trace.operation === 'UPDATE' ? 'text-amber-400 border-amber-400/20 bg-amber-400/10' :
                                trace.operation === 'DELETE' ? 'text-rose-400 border-rose-400/20 bg-rose-400/10' : 'text-indigo-400 border-indigo-400/20 bg-indigo-400/10'
                              }`}>
                                {trace.operation}
                              </span>
                              <span className="text-slate-500">@{trace.table}</span>
                            </div>
                            <span className="text-slate-600">{trace.timestamp}</span>
                          </div>
                          
                          {editingTraceId === trace.id ? (
                            <div className="space-y-4 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/30 animate-in fade-in zoom-in duration-300">
                               <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                    <Database size={10} /> Simulation Sandbox
                                  </span>
                                  <button onClick={() => { setEditingTraceId(null); setSimResult(null); }} className="text-[8px] font-black text-slate-500 hover:text-white uppercase transition-colors">Cancel</button>
                               </div>
                               <textarea 
                                 value={editedSql}
                                 onChange={(e) => setEditedSql(e.target.value)}
                                 className="w-full h-32 bg-slate-900/50 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-indigo-300 outline-none focus:border-indigo-500/50 transition-all scrollbar-hide"
                               />
                               <div className="flex gap-3">
                                  <button 
                                    onClick={() => handleSimulate(editedSql, trace.operation)}
                                    className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-indigo-600/20"
                                  >
                                    Run Simulation
                                  </button>
                               </div>
                               
                               {simResult && (
                                 <motion.div 
                                   initial={{ opacity: 0, y: 10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   className="grid grid-cols-3 gap-3 pt-2"
                                 >
                                    <div className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                                       <div className="text-[7px] text-slate-500 font-black uppercase mb-1">Impact</div>
                                       <div className="text-[10px] text-white font-black">{simResult.rows} Rows</div>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded-lg border border-white/5 text-center">
                                       <div className="text-[7px] text-slate-500 font-black uppercase mb-1">Latency</div>
                                       <div className="text-[10px] text-white font-black">{simResult.latency}ms</div>
                                    </div>
                                    <div className={`p-2 rounded-lg border text-center ${
                                       simResult.risk === 'HIGH' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                                       simResult.risk === 'MED' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                       'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    }`}>
                                       <div className="text-[7px] font-black uppercase mb-1">Risk Profile</div>
                                       <div className="text-[10px] font-black">{simResult.risk}</div>
                                    </div>
                                 </motion.div>
                               )}
                            </div>
                          ) : (
                            <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5 relative group hover:border-indigo-500/20 transition-all">
                              <div className="text-[10px] text-slate-300 font-bold mb-2 italic">
                                 -- {trace.description}
                              </div>
                              <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto scrollbar-hide whitespace-pre-wrap text-slate-100">
                                {highlightSQL(trace.sql)}
                              </pre>
                              
                              {/* AI Optimization Tip */}
                              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-3">
                                 <div className="size-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <Sparkles size={12} />
                                 </div>
                                 <p className="text-[10px] font-medium text-indigo-300/60 uppercase tracking-widest italic leading-relaxed">
                                    AI Tip: {
                                      trace.sql.toLowerCase().includes('select') && !trace.sql.toLowerCase().includes('where') 
                                      ? "Unbounded SELECT detected. Add LIMIT or WHERE for index optimal performance."
                                      : trace.sql.toLowerCase().includes('update')
                                      ? "Ensure RLS policies are scoped to ID for transaction safety."
                                      : "Query is optimized for relational cluster cache."
                                    }
                                 </p>
                              </div>
                              
                              <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                 <button 
                                   onClick={() => {
                                     setEditingTraceId(trace.id);
                                     setEditedSql(trace.sql);
                                     setSimResult(null);
                                   }}
                                   className="px-2 py-1 bg-indigo-500 hover:bg-indigo-400 text-white rounded-md text-[8px] uppercase font-black shadow-lg shadow-indigo-500/20"
                                 >
                                    Simulate
                                 </button>
                                 <button 
                                   onClick={() => {
                                     navigator.clipboard.writeText(trace.sql);
                                   }}
                                   className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md text-[8px] uppercase font-black"
                                 >
                                    Copy
                                 </button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 py-20 opacity-40">
                       <Terminal size={40} className="text-slate-500" />
                       <div className="text-center">
                          <div className="text-[10px] font-black text-white uppercase tracking-[4px]">System Listening</div>
                          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Waiting for relational mutations...</div>
                       </div>
                    </div>
                  )
                ) : viewMode === 'SCHEMA' ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-8 py-10 animate-in fade-in zoom-in duration-500">
                     <div className="text-center space-y-2">
                        <h2 className="text-sm font-black text-indigo-400 uppercase tracking-[4px]">Relational Schema</h2>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">DBMS Project Production Cluster</p>
                     </div>
                     
                     <div className="relative w-full max-w-[320px] h-[280px]">
                        {[
                          { id: 'student', label: 'STUDENT', x: '50%', y: '15%', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
                          { id: 'application', label: 'APPLICATION', x: '50%', y: '50%', color: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' },
                          { id: 'internship', label: 'INTERNSHIP', x: '50%', y: '85%', color: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
                          { id: 'company', label: 'COMPANY', x: '10%', y: '85%', color: 'border-slate-500/30 bg-slate-500/10 text-slate-400' },
                          { id: 'skill', label: 'SKILLS', x: '90%', y: '15%', color: 'border-rose-500/30 bg-rose-500/10 text-rose-400' }
                        ].map((node) => (
                           <motion.div 
                             key={node.id}
                             whileHover={{ scale: 1.1 }}
                             whileTap={{ scale: 0.95 }}
                             onClick={() => setSelectedNode(node.id)}
                             style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)' }}
                             className={`absolute px-4 py-2 rounded-lg border-2 ${node.color} text-[10px] font-black tracking-widest whitespace-nowrap z-10 shadow-xl cursor-pointer transition-all duration-300 ${selectedNode === node.id ? 'ring-4 ring-white/20' : ''}`}
                           >
                              {node.label}
                           </motion.div>
                        ))}
                        
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                           <line x1="50%" y1="15%" x2="50%" y2="50%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4" />
                           <line x1="50%" y1="50%" x2="50%" y2="85%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4" />
                           <line x1="50%" y1="85%" x2="10%" y2="85%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4" />
                           <line x1="50%" y1="15%" x2="90%" y2="15%" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4" />
                        </svg>
                     </div>
                     
                     <AnimatePresence mode="wait">
                        {selectedNode ? (
                          <motion.div 
                            key={selectedNode}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full bg-white/[0.03] p-6 rounded-3xl border border-white/10 space-y-4"
                          >
                             <div className="flex justify-between items-center">
                                <div>
                                   <h4 className="text-sm font-black text-white uppercase tracking-widest">{selectedNode}</h4>
                                   <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-1">{SCHEMA_DEFINITIONS[selectedNode].description}</p>
                                </div>
                                <button onClick={() => setSelectedNode(null)} className="p-2 text-slate-500 hover:text-white"><X size={14}/></button>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Columns</div>
                                   <div className="flex flex-wrap gap-1.5">
                                     {SCHEMA_DEFINITIONS[selectedNode].cols.map((c: string) => (
                                        <span key={c} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[8px] text-slate-300 font-bold">{c}</span>
                                     ))}
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Indices</div>
                                   <div className="flex flex-wrap gap-1.5">
                                     {SCHEMA_DEFINITIONS[selectedNode].indices.map((i: string) => (
                                        <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[8px] text-indigo-400 font-black">{i}</span>
                                     ))}
                                   </div>
                                </div>
                             </div>
                          </motion.div>
                        ) : (
                           <div className="grid grid-cols-2 gap-4 w-full">
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                                 <div className="text-[7px] text-slate-500 font-black uppercase">Primary Key pool</div>
                                 <div className="text-xs font-black text-white uppercase tracking-widest">Indexed</div>
                              </div>
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                                 <div className="text-[7px] text-slate-500 font-black uppercase">Relationship type</div>
                                 <div className="text-xs font-black text-white uppercase tracking-widest">Relational</div>
                              </div>
                              <div className="col-span-2 text-center pt-2">
                                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-[4px] animate-pulse">Select a relational node to inspect definitions</p>
                              </div>
                           </div>
                        )}
                     </AnimatePresence>
                  </div>
                ) : (
                  <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[4px]">DBMS Intelligence</h2>
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black text-emerald-500 uppercase">Live Engine</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 space-y-2">
                         <div className="text-[7px] text-slate-500 font-black uppercase tracking-widest">Institutional Scale</div>
                         <div className="text-xl font-black text-white">1,642 <span className="text-[10px] text-indigo-400">Students</span></div>
                      </div>
                      <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 space-y-2">
                         <div className="text-[7px] text-slate-500 font-black uppercase tracking-widest">Active Pipeline</div>
                         <div className="text-xl font-black text-white">248 <span className="text-[10px] text-amber-400">Positions</span></div>
                      </div>
                    </div>

                    <div className="bg-white/[0.03] p-5 rounded-3xl border border-white/5 space-y-6">
                       <div className="flex items-center justify-between">
                          <div className="space-y-1">
                             <div className="text-[7px] text-slate-500 font-black uppercase tracking-widest">DBMS Performance Telemetry</div>
                             <div className="text-xs font-black text-white tracking-widest">LIVE TRAAKING</div>
                          </div>
                          <div className="text-right">
                             <div className="text-[12px] font-black text-emerald-400">{qps.toFixed(2)} QPS</div>
                             <div className="text-[7px] text-slate-500 font-black uppercase">Current load</div>
                          </div>
                       </div>
                       
                       <div className="h-16 flex items-end gap-1 px-1">
                          {performanceHistory.map((h, i) => (
                             <motion.div 
                               key={i}
                               initial={{ height: 0 }}
                               animate={{ height: `${h}%` }}
                               transition={{ duration: 0.5 }}
                               className={`flex-1 rounded-t-sm ${h > 35 ? 'bg-indigo-500' : 'bg-slate-700'} opacity-60`}
                             />
                          ))}
                       </div>

                       <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                             <div className="flex justify-between items-center text-[7px] font-black text-slate-500 uppercase">
                                <span>Buffer Pool</span>
                                <span className="text-white">{dbHealth.pool.toFixed(1)}%</span>
                             </div>
                             <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div animate={{ width: `${dbHealth.pool}%` }} className="h-full bg-indigo-500" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <div className="flex justify-between items-center text-[7px] font-black text-slate-500 uppercase">
                                <span>CPU Latency</span>
                                <span className="text-white">{dbHealth.cpu.toFixed(1)}%</span>
                             </div>
                             <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div animate={{ width: `${dbHealth.cpu}%` }} className="h-full bg-emerald-500" />
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/20 space-y-3">
                       <div className="flex items-center gap-2 text-indigo-400">
                          <Database size={12} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Engine Status</span>
                       </div>
                       <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                         "Relational cluster is operating at Peak Institutional Efficiency. Latency: {(10 + Math.random() * 5).toFixed(1)}ms. No transaction locks detected."
                       </p>
                    </div>
                  </div>
                )}
                
                {traces.length > 0 && viewMode === 'LOGS' && (
                   <div className="text-center pb-4 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                      === End of Trace Buffer ===
                   </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Minimize Trigger (if closed) */}
      {!isConsoleOpen && (
         <motion.button
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           onClick={() => setIsConsoleOpen(true)}
           className="size-14 rounded-full bg-slate-950 text-indigo-400 flex items-center justify-center border border-white/10 shadow-2xl pointer-events-auto hover:bg-indigo-600 hover:text-white transition-all group relative"
         >
            <Database size={24} className="group-hover:animate-pulse" />
            <div className="absolute -top-1 -right-1 size-5 bg-indigo-500 text-white font-black text-[9px] rounded-full flex items-center justify-center border-2 border-slate-950">
               {traces.length}
            </div>
            
            {/* Live Pulse Neon Ring */}
            <div className="absolute inset-0 rounded-full border border-indigo-500/50 animate-ping opacity-20" />
         </motion.button>
      )}
    </div>
  );
}
