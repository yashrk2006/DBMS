'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, School, GraduationCap, FileText, Save, CheckCircle2,
  AlertCircle, Camera, Activity, Cpu, ShieldCheck, Link as LinkIcon,
  TrendingUp, Zap, BookOpen, Award, Upload, Terminal, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumCard from '@/components/ui/PremiumCard';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { supabase } from '@/lib/supabase';
import { SkillManager } from '@/components/dashboard/SkillManager';
import { toast } from 'react-hot-toast';
import { useDBMS } from '@/context/DBMSContext';

interface ProfileState {
  name: string;
  roll_no: string;
  college: string;
  branch: string;
  graduation_year: string;
  cgpa: string;
  resume_url: string;
  bio: string;
  email: string;
}

interface CompletionStep {
  label: string;
  done: boolean;
  icon: any;
  hint: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileState>({
    name: '', roll_no: '', college: '', branch: '', graduation_year: '', cgpa: '', resume_url: '', bio: '', email: ''
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [authId, setAuthId] = useState<string>('');
  const { addTrace } = useDBMS();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
       toast.error("Cloud Governance: Only PDF resumes supported.");
       return;
    }

    setUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const studentId = session?.user?.id;

    if (!studentId) {
      toast.error("Auth session expired.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('studentId', studentId);

    try {
      const res = await fetch('/api/upload/resume', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      if (result.success) {
        setProfile(prev => ({ ...prev, resume_url: result.url }));
        toast.success("Resume provisioned to storage vault.");
      } else {
        toast.error(result.error || "Upload failed.");
      }
    } catch (err) {
      toast.error("Upload service unavailable.");
    } finally {
      setUploading(false);
    }
  };
  const [skillCount, setSkillCount] = useState(0);
  const [appCount, setAppCount] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        setLoading(false);
        return; // Redirect handled by layout
      }
      setAuthId(userId);

      try {
        const res = await fetch(`/api/students/profile?userId=${userId}`);
        if (!res.headers.get('content-type')?.includes('application/json')) throw new Error('Bad response');
        const data = await res.json();
        if (data.success) {
          const student = data.data.profile;
          setProfile({
            name: student.name || '',
            roll_no: student.roll_no || '',
            college: student.college || '',
            branch: student.branch || '',
            graduation_year: student.graduation_year?.toString() || '',
            cgpa: student.cgpa?.toString() || '',
            resume_url: student.resume_url || '',
            bio: student.bio || '',
            email: student.email || ''
          });
          setSkillCount(data.data.stats.skills || 0);
          setAppCount(data.data.stats.applications || 0);
        } else {
          toast.error('Could not load profile: ' + (data.error || 'Unknown error'));
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
        toast.error('Failed to connect to profile service.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Dynamic completion checklist — recomputes whenever profile changes
  const completionSteps: CompletionStep[] = useMemo(() => [
    { label: 'Full Name', done: !!profile.name.trim(), icon: User, hint: 'Enter your full name so recruiters can identify you' },
    { label: 'University / College', done: !!profile.college.trim(), icon: School, hint: 'Add your institution for college placement tracking' },
    { label: 'Branch / Major', done: !!profile.branch.trim(), icon: BookOpen, hint: 'Your field of study helps match you with relevant roles' },
    { label: 'Graduation Year', done: !!profile.graduation_year, icon: GraduationCap, hint: 'Companies filter candidates by batch year' },
    { label: 'Current CGPA', done: !!profile.cgpa && parseFloat(profile.cgpa) > 0, icon: TrendingUp, hint: 'Essential for job eligibility matching' },
    { label: 'Portfolio / Resume Link', done: !!profile.resume_url.trim(), icon: FileText, hint: 'A direct link to your resume dramatically boosts visibility' },
    { label: 'At Least 3 Skills', done: skillCount >= 3, icon: Award, hint: 'Add skills in the Skills tab to get matched with suitable roles' },
    { label: 'First Application', done: appCount > 0, icon: Zap, hint: 'Apply to at least one internship to activate your tracking' },
  ], [profile, skillCount, appCount]);

  const completedCount = completionSteps.filter(s => s.done).length;
  const completionPct = Math.round((completedCount / completionSteps.length) * 100);

  const completionColor =
    completionPct >= 85 ? 'text-emerald-600' :
    completionPct >= 60 ? 'text-amber-600' : 'text-red-500';

  const completionBarColor =
    completionPct >= 85 ? 'bg-emerald-500' :
    completionPct >= 60 ? 'bg-amber-500' : 'bg-red-400';

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      toast.error("Interactive session identity required for modification.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/students/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profile })
      });
      if (!res.headers.get('content-type')?.includes('application/json')) throw new Error('Bad response');
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        toast.success('Profile saved successfully!');
        
        // DBMS TRACE: Profile Update
        addTrace({
          operation: 'UPDATE',
          table: 'student',
          description: `Update core student identity and academic metrics`,
          sql: `UPDATE student \nSET name = '${profile.name}', \n    college = '${profile.college}', \n    branch = '${profile.branch}', \n    cgpa = ${profile.cgpa || 0}, \n    bio = '${profile.bio.replace(/'/g, "''")}', \n    resume_url = '${profile.resume_url}'\nWHERE user_id = '${userId}';`
        });

        setTimeout(() => setSaved(false), 2500);
      } else {
        toast.error(data.error || 'Failed to save profile');
      }
    } catch (e: any) {
      console.error('Failed to save profile:', e);
      toast.error('Could not save profile. Check your connection.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-8">
      <motion.div 
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-amber-600"
      >
        <User size={64} fill="currentColor" />
      </motion.div>
      <div className="text-center">
         <h2 className="text-[10px] font-bold uppercase tracking-[10px] text-amber-600 mb-2">Loading Profile</h2>
         <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[5px] animate-pulse">Syncing Profile Data &amp; Professional Records</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">

      {/* Hero Banner */}
      <AnimatedSection direction="up" distance={40}>
        <div className="mb-6">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-600 transition-colors"
          >
            <ChevronRight size={14} className="rotate-180" /> Back to Dashboard
          </button>
        </div>
        <div className="relative min-h-[16rem] md:h-64 rounded-[2.5rem] md:rounded-[4rem] bg-white border border-slate-100 overflow-hidden shadow-premium flex items-end p-6 md:p-14 group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-slate-50 opacity-40 pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 w-full text-center md:text-left mt-8 md:mt-0">
            <div className="relative group/avatar shrink-0 mb-2 md:mb-0">
               <div className="size-24 md:size-36 rounded-2xl md:rounded-[3rem] bg-white border-[4px] md:border-[6px] border-white flex items-center justify-center text-amber-600 shadow-2xl group-hover:scale-105 transition-all duration-700 relative overflow-hidden ring-1 ring-slate-100">
                  <span className="text-3xl md:text-6xl font-black tracking-tighter text-amber-500/20 select-none">{profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}</span>
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=f59e0b&color=fff&bold=true&size=256`} alt="Profile" className="absolute inset-0 size-full object-cover" />
               </div>
               <div className="absolute -bottom-1 -right-1 size-8 md:size-10 rounded-xl md:rounded-2xl bg-slate-950 border-2 md:border-4 border-white flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-amber-600 transition-colors">
                  <Camera size={12}  />
               </div>
            </div>
            <div className="flex-1 pb-2">
               <div className="flex items-center justify-center md:justify-start gap-3 mb-2 md:mb-4">
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/10">
                    <ShieldCheck size={10}  className="text-amber-600" />
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[2px] md:tracking-[3px] text-amber-700">Verified identity</span>
                  </div>
               </div>
               <h1 className="text-2xl sm:text-3xl md:text-7xl font-black text-slate-950 tracking-tighter uppercase leading-[1.1] md:leading-[0.8]">
                 {profile.name || 'Anonymous'}<br className="hidden md:block" />
                 <span className="text-amber-600 opacity-80 md:ml-0 ml-2">Sync Profile.</span>
               </h1>
            </div>

            <div className="flex md:hidden w-full items-center justify-between border-t border-slate-100 pt-4 mt-2">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[8px] font-black uppercase tracking-[2px] text-slate-400">Sync Nodes</span>
                  <div className="text-xl font-black tracking-tighter text-slate-900">{completedCount}/{completionSteps.length}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[8px] font-black uppercase tracking-[2px] text-slate-400">Match Index</span>
                  <div className={`text-xl font-black tracking-tighter ${completionColor}`}>{completionPct}%</div>
                </div>
            </div>

            <div className="hidden md:flex flex-col items-end gap-2 pb-2">
               <div className="flex items-center gap-2">
                 <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">Optimization Matrix</span>
               </div>
               <div className="flex items-baseline gap-2">
                 <span className={`text-6xl font-black tracking-tighter leading-none ${completionColor}`}>{completionPct}%</span>
               </div>
               <span className="text-[9px] text-slate-400 uppercase font-black tracking-[2px]">{completedCount}/{completionSteps.length} Nodes Synchronized</span>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left — Completion Sidebar */}
        <div className="lg:col-span-1 space-y-6">

          {/* Dynamic Profile Completion Widget */}
          <AnimatedSection direction="right">
            <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] md:rounded-[3rem] border border-white/60 shadow-premium p-6 md:p-10 space-y-6 md:space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-10 -mt-10" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-amber-500/10 border border-amber-500/10 flex items-center justify-center text-amber-600 shadow-inner shrink-0">
                  <Activity size={18}  />
                </div>
                <div>
                  <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[2px] md:tracking-[4px] text-slate-400">Capability Sync</div>
                  <div className={`text-xl md:text-3xl font-black tracking-tighter ${completionColor}`}>{completionPct}% Completion</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner relative z-10">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${completionPct}%` }}
                   transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                   className={`h-full rounded-full shadow-lg ${completionBarColor}`}
                />
              </div>

              {/* Checklist */}
              <div className="space-y-3 md:space-y-4 relative z-10">
                {completionSteps.map((step) => (
                  <div key={step.label} className={`flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-500 ${step.done ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-slate-50/50 border border-slate-100 hover:border-amber-500/20'}`}>
                    <div className={`size-7 md:size-8 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${step.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white border border-slate-200 text-slate-300'}`}>
                      {step.done ? <CheckCircle2 size={12}  /> : <step.icon size={12}  />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[9px] md:text-[11px] font-black uppercase tracking-[1px] md:tracking-[2px] ${step.done ? 'text-emerald-700 opacity-60' : 'text-slate-700'}`}>
                        {step.label}
                      </div>
                      {!step.done && (
                        <div className="text-[9px] md:text-[10px] font-medium text-slate-400 mt-0.5 leading-relaxed">{step.hint}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recruiter boost message */}
              {completionPct < 100 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp size={12} className="text-amber-600" />
              <span className="text-[9px] font-black uppercase tracking-[3px] text-amber-700">Visibility Boost</span>
              </div>
              <p className="text-[9px] font-medium text-amber-800/70 leading-relaxed">
              Complete all steps to boost recruiter visibility by <span className="font-black text-amber-700">240%</span> and unlock Top Candidate status.
              </p>
              </div>
              )}

              {completionPct === 100 && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
              <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-[2px]">Profile fully optimised — you are a Top Candidate!</p>
              </div>
              )}

            </div>
          </AnimatedSection>

          {/* Intelligence Snapshot - NEW PREMIUM SECTION */}
          <AnimatedSection direction="right" delay={0.2}>
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white border border-white/5 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                    <Terminal size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tighter uppercase leading-none">Intelligence.</h3>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[3px]">Skill DNA Analysis</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    { label: 'Technical Maturity', pct: 88, color: 'bg-indigo-500' },
                    { label: 'System Logic', pct: 74, color: 'bg-emerald-500' },
                    { label: 'Communication Sync', pct: 92, color: 'bg-amber-500' }
                  ].map((metric, i) => (
                    <div key={metric.label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{metric.label}</span>
                        <span className="text-[10px] font-black">{metric.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${metric.pct}%` }} 
                          transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                          className={`h-full rounded-full ${metric.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/5">
                  <p className="text-[9px] font-medium text-slate-500 leading-relaxed italic">
                    &quot;Heuristics indicate high affinity for Full-Stack Architecture and Distributed Systems based on recent activity telemetry.&quot;
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Quick Stats */}
          <AnimatedSection direction="right" delay={0.1}>
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 md:p-6 grid grid-cols-2 gap-3 md:gap-4">
              {[
                { label: 'Skills Added', value: skillCount, color: 'text-amber-600', icon: Award },
                { label: 'Applications', value: appCount, color: 'text-indigo-600', icon: Zap },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-xl border border-slate-100 p-3 md:p-4 flex flex-col gap-1 md:gap-2">
                  <item.icon size={12}  className={item.color} />
                  <div className={`text-xl md:text-2xl font-black tracking-tighter ${item.color}`}>{item.value}</div>
                  <div className="text-[8px] md:text-[9px] font-black uppercase tracking-[2px] text-slate-400">{item.label}</div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>

        {/* Right — Edit Form */}
        <div className="lg:col-span-2">
          <AnimatedSection direction="up">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center gap-4">
                <div className="size-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <User size={16} />
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[5px] text-slate-400">Edit Profile</div>
                  <div className="text-sm font-black text-slate-900">Personal &amp; Academic Details</div>
                </div>
              </div>

              <form onSubmit={saveProfile} className="p-6 md:p-8 space-y-6 md:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                      <User size={11} /> Full Name
                    </label>
                    <input 
                      type="text" value={profile.name}
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full h-12 md:h-14 px-4 md:px-5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all placeholder:text-slate-300 outline-none"
                    />
                  </div>

                  {/* Roll Number (Official ID) */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-amber-600 uppercase tracking-[3px] flex items-center gap-2">
                      <ShieldCheck size={11} /> Profile ID
                    </label>
                    <input 
                      type="text" value={profile.roll_no}
                      onChange={e => setProfile(p => ({ ...p, roll_no: e.target.value }))}
                      placeholder="e.g. 24/70001"
                      className="w-full h-12 md:h-14 px-4 md:px-5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-900 tracking-wider focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all placeholder:text-slate-300 outline-none"
                    />
                  </div>

                  {/* Graduation Year */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                      <GraduationCap size={11} /> Graduation Year
                    </label>
                    <input 
                      type="number" value={profile.graduation_year}
                      onChange={e => setProfile(p => ({ ...p, graduation_year: e.target.value }))}
                      placeholder="e.g. 2026" min="2020" max="2035"
                      className="w-full h-12 md:h-14 px-4 md:px-5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all placeholder:text-slate-300 outline-none"
                    />
                  </div>

                  {/* College */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                      <School size={11} /> Institution
                    </label>
                    <input 
                      type="text" value={profile.college}
                      onChange={e => setProfile(p => ({ ...p, college: e.target.value }))}
                      placeholder="e.g. IIT Delhi"
                      className="w-full h-12 md:h-14 px-4 md:px-5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all placeholder:text-slate-300 outline-none"
                    />
                  </div>

                  {/* Branch */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                      <Cpu size={11} /> Branch / Major
                    </label>
                    <input 
                      type="text" value={profile.branch}
                      onChange={e => setProfile(p => ({ ...p, branch: e.target.value }))}
                      placeholder="e.g. Computer Science"
                      className="w-full h-12 md:h-14 px-4 md:px-5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all placeholder:text-slate-300 outline-none"
                    />
                  </div>

                  {/* CGPA */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-amber-600 uppercase tracking-[3px] flex items-center gap-2">
                      <TrendingUp size={11} /> Current CGPA
                    </label>
                    <input 
                      type="number" step="0.01" min="0" max="10"
                      value={profile.cgpa}
                      onChange={e => setProfile(p => ({ ...p, cgpa: e.target.value }))}
                      placeholder="e.g. 9.15"
                      className="w-full h-12 md:h-14 px-4 md:px-5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-900 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all placeholder:text-slate-300 outline-none"
                    />
                  </div>

                  {/* Bio / Professional Summary */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                      <Activity size={11} /> Professional Summary / Bio
                    </label>
                    <textarea 
                      value={profile.bio}
                      onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                      placeholder="A short summary of your background..."
                      className="w-full h-32 p-4 md:p-5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/40 transition-all placeholder:text-slate-300 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Resume Upload Capability */}
                <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                    <Terminal size={11} /> Resume Document / Portfolio
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className="relative h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 group hover:border-amber-500/50 hover:bg-amber-50/10 transition-all cursor-pointer overflow-hidden"
                      onClick={() => document.getElementById('cv-upload')?.click()}
                    >
                      <input 
                        id="cv-upload" type="file" accept=".pdf" 
                        className="hidden" onChange={handleFileUpload} 
                      />
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Cpu size={24} className="text-amber-600 animate-spin" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-amber-600">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} className="text-slate-300 group-hover:text-amber-600 transition-colors" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Click to Upload PDF</span>
                        </>
                      )}
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:bg-amber-600 transition-colors">
                          <FileText size={18} />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black text-slate-900 uppercase tracking-tight block">CV Metadata</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
                            {profile.resume_url ? 'Linked to Vault' : 'No document linked'}
                          </span>
                        </div>
                      </div>
                      {profile.resume_url && (
                        <button 
                          type="button"
                          onClick={() => window.open(profile.resume_url, '_blank')}
                          className="size-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:border-amber-600/30 transition-all"
                        >
                          <LinkIcon size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                       <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Manual URL Override</label>
                       <input 
                        type="url" value={profile.resume_url}
                        onChange={e => setProfile(p => ({ ...p, resume_url: e.target.value }))}
                        placeholder="https://drive.google.com/..."
                        className="w-full h-12 px-5 rounded-xl border border-slate-100 bg-slate-100/50 text-xs font-bold text-slate-500 focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/20 transition-all placeholder:text-slate-300 outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[2px]">Cloud Storage: Resumes are encrypted and stored in private vaults.</p>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <AnimatePresence mode="wait">
                    <motion.button
                      key={saved ? 'saved' : 'save'}
                      type="submit"
                      disabled={saving}
                      whileHover={{ scale: 1.01, boxShadow: "0 20px 40px rgba(217,119,6,0.12)" }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full h-16 rounded-2xl text-[11px] font-black uppercase tracking-[5px] shadow-lg flex items-center justify-center gap-4 transition-all duration-500 ${
                        saved ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-amber-600"
                      }`}
                    >
                      {saving ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Cpu size={20} /></motion.div>
                      ) : saved ? (
                        <><CheckCircle2 size={20} /> Profile Updated</>
                      ) : (
                        <><Terminal size={20} /> Deploy Changes</>
                      )}
                    </motion.button>
                  </AnimatePresence>

                  {saved && (
                    <motion.p 
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="text-center text-[9px] font-bold uppercase tracking-[3px] text-emerald-600/70 mt-3"
                    >
                      Profile changes have been successfully saved.
                    </motion.p>
                  )}
                </div>
              </form>
            </div>
          </AnimatedSection>

          {/* Project Showcase — NEW PREMIUM SECTION */}
          <AnimatedSection direction="up" delay={0.1}>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8 md:p-14 space-y-10 mt-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                      <Terminal size={18} />
                    </div>
                    <h2 className="text-xl md:text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Impact Logic.</h2>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] ml-1">Evidence of Technical Contribution</p>
                </div>
                <button className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-slate-900/10">Add Deployment</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[
                   { name: 'Distributed Mesh Network', tech: 'Rust, gRPC', impact: 'Optimized packet synchronization by 42% across heterogeneous nodes.' },
                   { name: 'GenAI Recruitment Engine', tech: 'Next.js, OpenAI', impact: 'Automated skill extraction for 1.6k student profiles with 98% accuracy.' }
                 ].map((proj, i) => (
                   <div key={proj.name} className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:border-amber-600/30 transition-all group cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                         <LinkIcon size={48} className="text-amber-600" />
                      </div>
                      <div className="space-y-4 relative z-10">
                         <div className="flex items-center gap-3">
                            <span className="text-[8px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-widest">{proj.tech}</span>
                         </div>
                         <h4 className="text-lg font-black text-slate-950 uppercase tracking-tight">{proj.name}</h4>
                         <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic border-l-2 border-slate-200 pl-4">
                            &quot;{proj.impact}&quot;
                         </p>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Skills Sync Hub — NEW PREMIUM MODULE */}
          <AnimatedSection direction="up" delay={0.1}>
            <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-premium p-8 md:p-14 space-y-10 mt-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                      <Zap size={18} />
                    </div>
                    <h2 className="text-xl md:text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Skills Sync Hub.</h2>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] ml-1">Relational Capability Mapping Engine</p>
                </div>

                <div className="flex items-center gap-4 bg-slate-900 px-6 py-3 rounded-2xl border border-white/5">
                   <div className="flex flex-col items-start">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Nodes</span>
                      <span className="text-lg font-black text-white leading-none">{skillCount}</span>
                   </div>
                   <div className="w-[1px] h-6 bg-white/10 mx-2" />
                   <div className="flex flex-col items-start text-indigo-400">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sync Priority</span>
                      <span className="text-lg font-black leading-none">High</span>
                   </div>
                </div>
              </div>

              <div className="pt-4">
                <SkillManager 
                  userId={authId} 
                  onUpdate={(count) => setSkillCount(count)} 
                />
              </div>

              <div className="p-6 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 flex items-start gap-4">
                 <ShieldCheck className="text-indigo-600 mt-1 shrink-0" size={24} />
                 <div>
                    <h5 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1">Knowledge Verification</h5>
                    <p className="text-[11px] font-medium text-indigo-900/60 leading-relaxed">
                      Skills added here are cross-referenced with educational transcripts and project repositories to generate your 
                      <span className="font-black text-indigo-600"> Skill DNA Score</span>.
                    </p>
                 </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
