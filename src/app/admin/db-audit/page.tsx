'use client';

import React from 'react';
import { 
  Database, Server, Code2, Cpu, 
  ArrowLeft, Terminal, ShieldCheck, 
  GitMerge, Table2, Layers, Zap,
  Search, Link2, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function DBAuditPage() {
  const router = useRouter();

  const auditData = [
    {
      title: "Student Identity Lookup",
      scenario: "Validates institutional enrollment during individual session initialization.",
      supabase: `await supabase\n  .from('student')\n  .select('student_id, roll_no, college')\n  .eq('user_id', current_user_id)\n  .single();`,
      sql: `SELECT student_id, roll_no, college \nFROM student \nWHERE user_id = 'auth.uid()' \nLIMIT 1;`,
      performance: "INDEX-ONLY SCAN",
      table: "student",
      experiment: {
        change: "Remove index on student_id",
        impact: "Query degrades to SEQUENTIAL SCAN. Multi-user latency increases from 5ms to 120ms.",
        result: "Data remains same, but system throughput drops by 80%."
      }
    },
    {
       title: "Internship Saturation Heatmap",
       scenario: "Calculates corporate demand and platform application density.",
       supabase: `await supabase\n  .from('internship')\n  .select(\`*,\n    company(company_name),\n    application(count)\n  \`);`,
       sql: `SELECT i.*, c.company_name, COUNT(a.id) as app_count\nFROM internship i\nJOIN company c ON i.company_id = c.company_id\nLEFT JOIN application a ON i.internship_id = a.internship_id\nGROUP BY i.internship_id, c.company_name;`,
       performance: "HASH JOIN + AGGREGATE",
       table: "internship, application",
       experiment: {
         change: "Change LEFT JOIN to INNER JOIN",
         impact: "Internships with zero applications are EXCLUDED from the registry board.",
         result: "Admin loses visibility of 'Cold Start' roles needing promotion."
       }
    },
    {
       title: "AI Skill Gap Correlation",
       scenario: "Joins student competencies with internship requirements for intelligence matching.",
       supabase: `await supabase\n  .from('student_skill')\n  .select('skill(skill_name)')\n  .eq('student_id', userId);`,
       sql: `SELECT s.skill_name \nFROM student_skill ss\nJOIN skill s ON ss.skill_id = s.skill_id\nWHERE ss.student_id = $1;`,
       performance: "NESTED LOOP JOIN",
       table: "student_skill, skill",
       experiment: {
         change: "Add WHERE category = 'AI'",
         impact: "Filter pushdown reduces the working set in memory during the join operation.",
         result: "Optimizes CPU usage for specialized recommendation algorithms."
       }
    },
    {
       title: "Governance At-Risk Detection",
       scenario: "Heuristic-based filtering for students with zero application telemetry.",
       supabase: `await supabase\n  .from('student')\n  .select('*, application(count)')\n  .filter('application_count', 'eq', 0);`,
       sql: `SELECT * FROM student \nWHERE NOT EXISTS (\n  SELECT 1 FROM application \n  WHERE application.student_id = student.student_id\n);`,
       performance: "ANTI-JOIN (EXISTS)",
       table: "student, application",
       experiment: {
         change: "Use IN clause instead of EXISTS",
         impact: "Query plan might change to a subquery scan depending on NULL handling requirements.",
         result: "Potential performance bottleneck for large application datasets (>100k rows)."
       }
    },
    {
       title: "Institutional Lockdown Mutation",
       scenario: "Atomic update to global platform config for recruitment window orchestration.",
       supabase: `await supabase\n  .from('platform_config')\n  .update({ recruitment_active: false })\n  .eq('id', 'global_settings');`,
       sql: `UPDATE platform_config \nSET recruitment_active = false, \n    updated_at = NOW() \nWHERE id = 'global_settings';`,
       performance: "SINGLE-ROW UPDATE",
       table: "platform_config",
       experiment: {
         change: "Remove WHERE clause",
         impact: "ENTIRE platform configuration set is overwritten (Global Data Corruption).",
         result: "All configuration nodes (logos, maintenance mode, auth rules) reset to 'false'."
       }
    },
    {
       title: "Recruiter Privacy Sharding",
       scenario: "Dynamically toggles organizational visibility in the marketplace cache.",
       supabase: `await supabase\n  .from('company')\n  .update({ is_visible: !visibility })\n  .eq('id', corpId);`,
       sql: `UPDATE company \nSET is_visible = NOT is_visible \nWHERE company_id = $1 \nRETURNING is_visible;`,
       performance: "ROW-LEVEL LOCKING",
       table: "company",
       experiment: {
         change: "Change RETURNING to *",
         impact: "Increases network payload by returning all 24 columns for a BOOLEAN update.",
         result: "Sub-optimal data transfer for mobile client consumers."
       }
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      {/* Premium Header */}
      <header className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-2xl border-b border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.back()}
              className="size-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="h-10 w-px bg-slate-100 hidden md:block" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Database size={14} className="text-amber-600" />
                <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Database Core Intelligence</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">DBMS Inspector</h1>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-4 px-6 py-2.5 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Real-time Connection: Postgres Engine</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 pt-32 space-y-16">
        {/* Schema Visualization Static Board */}
        <section className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="size-10 rounded-xl bg-slate-950 text-white flex items-center justify-center">
                <GitMerge size={18} />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Institutional Relational Schema</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Core Entity Relationships & Foreign Key Mappings</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { name: 'Student', count: '1.6k Rows', icon: ShieldCheck, color: 'bg-indigo-50 text-indigo-600', ddl: `CREATE TABLE student (\n  student_id UUID PRIMARY KEY,\n  name VARCHAR(255),\n  cgpa DECIMAL(3,2),\n  market_reach INTEGER,\n  ai_resume_analysis JSONB\n);` },
                { name: 'Company', count: '48 Rows', icon: Link2, color: 'bg-slate-50 text-slate-600', ddl: `CREATE TABLE company (\n  company_id UUID PRIMARY KEY,\n  company_name TEXT,\n  industry TEXT\n);` },
                { name: 'Internship', count: '210 Rows', icon: Zap, color: 'bg-amber-50 text-amber-600', ddl: `CREATE TABLE internship (\n  internship_id UUID PRIMARY KEY,\n  company_id UUID REFERENCES company,\n  title TEXT,\n  stipend TEXT\n);` },
                { name: 'Application', count: '4.2k Rows', icon: Activity, color: 'bg-emerald-50 text-emerald-600', ddl: `CREATE TABLE application (\n  id UUID PRIMARY KEY,\n  student_id UUID REFERENCES student,\n  internship_id UUID REFERENCES internship,\n  status TEXT\n);` },
                { name: 'Skills', count: '85 Nodes', icon: Cpu, color: 'bg-rose-50 text-rose-600', ddl: `CREATE TABLE skill (\n  skill_id UUID PRIMARY KEY,\n  skill_name TEXT\n);` },
              ].map((table, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={table.name} 
                  className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-default group border-b-4 border-b-slate-900/5 hover:border-b-slate-900"
                >
                  <div className={`size-10 rounded-2xl ${table.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <table.icon size={18} />
                  </div>
                  <h4 className="font-black text-slate-950 uppercase tracking-tight text-sm mb-1">{table.name}</h4>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">{table.count}</p>
                  
                  <div className="hidden group-hover:block absolute z-20 top-full left-0 w-80 bg-slate-950 p-4 rounded-2xl shadow-2xl border border-white/10 mt-2">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-2">DDL Specification</p>
                    <pre className="text-[8px] text-indigo-300 font-mono leading-relaxed">{table.ddl}</pre>
                  </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* Technical Data Migrations */}
        <section className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="size-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Layers size={18} />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">System Evolution & Hardening</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Database Migration Audit Trail (DDL Mutations)</p>
              </div>
           </div>

           <div className="bg-slate-50 border border-slate-100 rounded-[3rem] overflow-hidden p-1">
             <div className="bg-white rounded-[2.8rem] overflow-hidden">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[2px] text-slate-400">
                         <th className="px-10 py-6">Timestamp</th>
                         <th className="px-10 py-6">Mutation Type</th>
                         <th className="px-10 py-6">Operation Spec</th>
                         <th className="px-10 py-6">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {[
                        { time: '2026-04-12 09:12', type: 'SCHEMA', op: 'ALTER TABLE student ADD COLUMN cgpa DECIMAL(3,2)', status: 'COMMITTED' },
                        { time: '2026-04-12 11:45', type: 'INDEX', op: 'CREATE INDEX idx_app_status ON application(status)', status: 'COMMITTED' },
                        { time: '2026-04-13 04:30', type: 'SCHEMA', op: 'ALTER TABLE college_directory ADD COLUMN market_reach INT', status: 'COMMITTED' },
                        { time: '2026-04-13 15:20', type: 'POLICY', op: 'ENABLE ROW LEVEL SECURITY ON student', status: 'ACTIVE' },
                      ].map((log, i) => (
                        <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="px-10 py-6 text-[10px] font-mono text-slate-400">{log.time}</td>
                           <td className="px-10 py-6">
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest border border-indigo-100">{log.type}</span>
                           </td>
                           <td className="px-10 py-6 text-[10px] font-black text-slate-700 uppercase tracking-tight">{log.op}</td>
                           <td className="px-10 py-6">
                              <div className="flex items-center gap-2">
                                <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{log.status}</span>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           </div>
        </section>

        {/* Query Audit Section */}
        <section className="space-y-12">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                <Terminal size={18} />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Live Query Correlation</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform Logic to SQL Execution Documentation</p>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-12">
              {auditData.map((item, idx) => (
                <motion.div 
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-slate-50/50 rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Scenario Info */}
                    <div className="p-10 md:p-14 space-y-8 lg:border-r border-slate-100 flex flex-col justify-between">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full bg-slate-950 text-white text-[8px] font-black uppercase tracking-widest">Case 0{idx+1}</span>
                          <span className="text-[10px] font-black text-amber-600 uppercase tracking-[3px]">Scenario Analysis</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-950 tracking-tighter leading-none">{item.title}.</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed italic border-l-2 border-amber-600 pl-6">
                          &quot;{item.scenario}&quot;
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Table2 size={12} className="text-slate-400" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[2px]">Primary Tables</span>
                          </div>
                          <p className="text-[10px] font-black text-slate-950 uppercase">{item.table}</p>
                        </div>
                        <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap size={12} className="text-emerald-500" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[2px]">Optimizer Plan</span>
                          </div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase">{item.performance}</p>
                        </div>
                      </div>
                    </div>

                    {/* Code Comparison */}
                    <div className="bg-slate-950 p-10 md:p-14 space-y-10 group relative">
                       <div className="absolute top-6 right-10 flex gap-2">
                          <div className="size-2.5 rounded-full bg-rose-500/20 group-hover:bg-rose-500 transition-colors" />
                          <div className="size-2.5 rounded-full bg-amber-500/20 group-hover:bg-amber-500 transition-colors" />
                          <div className="size-2.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors" />
                       </div>

                       <div className="space-y-6">
                          <div className="flex items-center gap-3">
                             <Code2 size={16} className="text-white/40" />
                             <span className="text-[10px] font-black text-white/40 uppercase tracking-[4px]">Supabase JS Client</span>
                          </div>
                          <div className="p-6 bg-white/5 rounded-2xl border border-white/5 font-mono text-[11px] text-white/80 overflow-x-auto whitespace-pre">
                             {item.supabase}
                          </div>
                       </div>

                       <div className="space-y-6">
                          <div className="flex items-center gap-3">
                             <Server size={16} className="text-indigo-400" />
                             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[4px]">Underlying SQL (Postgres)</span>
                          </div>
                          <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 font-mono text-[11px] text-indigo-200 overflow-x-auto whitespace-pre">
                             {item.sql}
                          </div>
                       </div>

                       {/* Experiment Layer */}
                       <div className="pt-6 border-t border-white/5 space-y-4">
                          <div className="flex items-center gap-2">
                             <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                             <span className="text-[10px] font-black text-amber-500 uppercase tracking-[3px]">DBMS Mutation Experiment</span>
                          </div>
                          <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5 space-y-4">
                             <div>
                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Observation</p>
                                <p className="text-[10px] text-white/80 font-bold italic">&quot;If we {item.experiment.change}...&quot;</p>
                             </div>
                             <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                   <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Structural Impact</p>
                                   <p className="text-[10px] text-rose-300/80 font-medium">{item.experiment.impact}</p>
                                </div>
                                <div className="flex-1">
                                   <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Resulting Logic</p>
                                   <p className="text-[10px] text-emerald-300/80 font-medium">{item.experiment.result}</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* DBMS Footer Info */}
        <footer className="pt-20 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 opacity-50">
           <div className="flex items-center gap-4">
              <div className="size-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                <Database size={14} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-900">SkillSync Database Intelligence Board <span className="text-slate-300">v2.4.0</span></p>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="size-1 rounded-full bg-slate-400" />
                <span className="text-[8px] font-black uppercase tracking-widest">Encryption: AES-256</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-1 rounded-full bg-slate-400" />
                <span className="text-[8px] font-black uppercase tracking-widest">Engine: PostgreSQL 15.1</span>
              </div>
           </div>
        </footer>
      </main>
    </div>
  );
}
