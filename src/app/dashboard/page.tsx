'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Student, Application, Course, CalendarEvent, Notification } from '@/types';
import { toast } from 'react-hot-toast';
import { StatGrid } from '@/components/dashboard/StatGrid';
import { PathExplorer } from '@/components/dashboard/PathExplorer';
import { CalendarProfile } from '@/components/dashboard/CalendarProfile';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { RecruitmentPanel } from '@/components/dashboard/RecruitmentPanel';
import { CareerSummaryWidget } from '@/components/dashboard/AIReadinessWidget';
import Icon from '@/components/ui/Icon';

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [cgpa, setCgpa] = useState<number>(0);
  const [stats, setStats] = useState({ applications: 0, skills: 0, internships: 0, accepted: 0 });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [completionPct, setCompletionPct] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<{label: string, val: number, color: string}[]>([]);
  
  // UX State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // AI Agent States
  const [resumeAnalysis, setResumeAnalysis] = useState<import('@/types').AIResumeAnalysis | null>(null);
  const [aiJobs, setAiJobs] = useState<import('@/types').Internship[] | null>(null);
  const [aiRoadmap, setAiRoadmap] = useState<{summary: string, roadmap: string[]} | null>(null);
  const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        if (!controller.signal.aborted) setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/dashboard/stats?userId=${userId}&t=${Date.now()}`, { 
          signal: controller.signal,
          cache: 'no-store'
        });
        const data = await response.json();
        
        if (data.success && !controller.signal.aborted) {
          const student = data.student as Student;
          if (!student) { setLoading(false); return; }
          setUserName(student.name.split(' ')[0]);
          setRollNo(student.roll_no || '');
          setCgpa(Number(student.cgpa) || 0);
          setStats(data.stats);
          setRecentApplications(data.recentApplications);

          if (data.student?.skills && data.student.skills.length > 0) {
            const colors = ['bg-emerald-400', 'bg-purple-500', 'bg-orange-400', 'bg-cyan-400', 'bg-[#575a93]'];
            setSkills(data.student.skills.map((sk: any, i: number) => ({
              label: (typeof sk === 'string' ? sk : sk?.skill_name) || 'Skill',
              val: typeof sk === 'object' && sk.level ? (sk.level === 'Advanced' ? 95 : sk.level === 'Intermediate' ? 70 : sk.level === 'Expert' ? 100 : 40) : 75,
              color: colors[i % colors.length]
            })));
          } else {
            setSkills([]);
          }

          const checks = [!!student.name, !!student.college, !!student.email, data.stats.skills >= 3];
          setCompletionPct(Math.round((checks.filter(Boolean).length / checks.length) * 100));

          if (student.ai_resume_analysis) {
            setResumeAnalysis(student.ai_resume_analysis);
          }
        }

        const [learnRes, calRes, notifRes] = await Promise.all([
           fetch('/api/dashboard/learning', { signal: controller.signal }),
           fetch(`/api/dashboard/calendar?userId=${userId}`, { signal: controller.signal }),
           fetch(`/api/notifications?userId=${userId}`, { signal: controller.signal })
        ]);

        const [learnData, calData, notifData] = await Promise.all([
          learnRes.json(),
          calRes.json(),
          notifRes.json()
        ]);
        
        if (!controller.signal.aborted) {
          if (learnData.success) setCourses(learnData.courses.slice(0, 6)); 
          if (calData.success) setEvents(calData.events.slice(0, 5));     
          if (notifData.success) {
            setNotifications(notifData.notifications || notifData.data || []);
          }
          setLoading(false);
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
        console.error('Dashboard load error:', e);
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [supabase]);


  const handleUploadResume = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const file = selectedFile || fileInputRef.current?.files?.[0];
    if (!file) return toast.error("Please select a PDF file first");

    setIsUploadModalOpen(false);
    toast.loading("Analyzing...", { id: "resume-toast" });
    setIsAnalyzing(true);
    
    const controller = new AbortController();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        toast.error("Session expired.", { id: "resume-toast" });
        setIsAnalyzing(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('studentId', userId);

      const res = await fetch('/api/upload/resume', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      const data = await res.json();
      if (data.success) {
         setResumeAnalysis(data.analysis);
         toast.success(`Profile Updated.`, { id: "resume-toast" });
         
         const statsRes = await fetch(`/api/dashboard/stats?userId=${userId}`, { signal: controller.signal });
         const statsData = await statsRes.json();
         if (statsData.success) {
            setStats(statsData.stats);
            if (statsData.student?.skills) {
               const colors = ['bg-emerald-400', 'bg-purple-500', 'bg-orange-400', 'bg-cyan-400', 'bg-[#575a93]'];
               setSkills(statsData.student.skills.map((sk: any, i: number) => ({
                 label: (typeof sk === 'string' ? sk : sk?.skill_name) || 'Skill',
                 val: typeof sk === 'object' && sk.level ? (sk.level === 'Advanced' ? 95 : 70) : 75,
                 color: colors[i % colors.length]
               })));
            }
         }
      } else {
         toast.error(data.error || "Update failed", { id: "resume-toast" });
      }
    } catch(err: unknown) { 
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error("Update Error:", err);
      toast.error("Processing error.", { id: "resume-toast" }); 
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, supabase]);

  const handleMatchJobs = useCallback(async () => {
     if(!resumeAnalysis || !resumeAnalysis.skills) return toast.error("Please update your profile first!");
     toast.loading("Finding matches...", { id: "jobs-toast" });
     const controller = new AbortController();
     try {
       const res = await fetch('/api/dashboard/ai/match-jobs', {
          method: 'POST', 
          body: JSON.stringify({ skills: resumeAnalysis.skills }),
          signal: controller.signal
       });
       
       if (!res.headers.get("content-type")?.includes("application/json")) throw new Error("Unavailable");
       
       const data = await res.json();
       if(data.success) {
           setAiJobs(data.data.internships);
           toast.success("Matches Found!", { id: "jobs-toast" });
       }
     } catch(err: unknown) { 
       if (err instanceof Error && err.name === 'AbortError') return;
       const e = err as Error;
       console.error("Match Error:", e);
       toast.error(e.message || "Search error", { id: "jobs-toast" }); 
     }
  }, [resumeAnalysis]);

  const handleSkillGap = useCallback(async () => {
     if(!resumeAnalysis) return toast.error("Update profile first");
     toast.loading("Analyzing paths...", { id: "gap-toast" });
     const controller = new AbortController();
     try {
       const res = await fetch('/api/dashboard/ai/skill-gap', {
          method: 'POST', 
          body: JSON.stringify({ studentSkills: resumeAnalysis.skills, requiredSkills: ['System Design', 'SQL', ...(resumeAnalysis.missing||[])] }),
          signal: controller.signal
       });
       
       if (!res.headers.get("content-type")?.includes("application/json")) throw new Error("Error");

       const data = await res.json();
       if(data.success){
         setAiRoadmap(data.data);
         toast.success("Path Generated", { id: "gap-toast" });
       }
     } catch(err: unknown) {
            const e = err as Error;
            console.error("Path Error:", e);
            toast.error(e.message || "Generation Failure", { id: "gap-toast" });
     }
  }, [resumeAnalysis]);

  const handleSyncSkills = useCallback(async () => {
    if (!resumeAnalysis || !resumeAnalysis.skills) return;

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return toast.error("Session lost.");

    toast.loading("Saving to Profile...", { id: "sync-toast" });
    const controller = new AbortController();
    try {
      const res = await fetch('/api/dashboard/ai/sync-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, skills: resumeAnalysis.skills }),
        signal: controller.signal
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success("Saved to profile!", { id: "sync-toast" });
        const response = await fetch(`/api/dashboard/stats?userId=${userId}`, { cache: 'no-store', signal: controller.signal });
        if (response.ok) {
           const result = await response.json();
           if (result.success) setStats(result.stats);
        }
      } else {
        toast.error(data.error || "Save failed", { id: "sync-toast" });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error("Save Error:", err);
      toast.error("Failed to save");
    }
  }, [resumeAnalysis, supabase]);

  const handleClearAnalysis = async () => {
    setResumeAnalysis(null);
    setAiJobs(null);
    setAiRoadmap(null);
    toast.success("Profile Cleared.", { icon: "🧹" });
  };

  const handleApplyJob = useCallback(async (job: import('@/types').Internship) => {
    const minRequired = job.min_cgpa || 0;
    if (cgpa < minRequired) {
      toast.error(`Eligibility: Minimum CGPA of ${minRequired} required.`, { id: "apply-toast" });
      return;
    }

    toast.loading(`Applying...`, { id: "apply-toast" });
    const controller = new AbortController();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const res = await fetch('/api/dashboard/applications', {
        method: 'POST',
        body: JSON.stringify({ studentId: session.user.id, internshipId: job.internship_id, companyId: job.company_id }),
        signal: controller.signal
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Application submitted!`, { id: "apply-toast" });
        setStats(prev => ({ ...prev, applications: prev.applications + 1 }));
        if (aiJobs) setAiJobs(aiJobs.map(j => (j.internship_id === job.internship_id) ? { ...j, applied: true } : j));
      } else {
        toast.error(data.error || "Submission failed", { id: "apply-toast" });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      toast.error("Submission failed.", { id: "apply-toast" });
    }
  }, [aiJobs, cgpa, supabase]);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (err) {
      router.push('/auth/login');
    }
  }, [supabase, router]);


  const handleMarkRead = useCallback(async (id?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationId: id, userId: session.user.id })
      });

      if (res.ok) {
        setNotifications(prev => prev.map(n => (!id || n.notification_id === id) ? { ...n, is_read: true } : n));
      }
    } catch (err) {
      console.error("Notification Error:", err);
    }
  }, [supabase]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black animate-pulse text-slate-300 uppercase tracking-widest">Loading...</div>;

  return (
    <>
      <div className="flex flex-col gap-10 p-6 lg:p-12 font-sans bg-slate-50/10 min-h-screen max-w-[1400px] mx-auto">
        
        {/* Header Section */}
        <DashboardHeader 
          userName={userName}
          rollNo={rollNo}
          searchTerm={searchTerm}
          unreadCount={notifications.filter(n => !n.is_read).length}
          notifications={notifications}
          onSearchChange={setSearchTerm}
          onProfileClick={() => router.push('/dashboard/profile')}
          onLogout={handleLogout}
          onMarkRead={handleMarkRead}
        />

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
          
          {/* Main Content Column */}
          <div className="lg:col-span-3 space-y-10">
            {/* Stats Row */}
            <StatGrid 
              stats={stats}
              skills={skills}
              onCatalogClick={() => router.push('/dashboard/learning')}
            />

            {/* Career Summary Widget (Central Focus) */}
            <CareerSummaryWidget 
              score={Math.round(
                ((resumeAnalysis?.score || 70) * 0.4) + 
                ((recentApplications.filter(a => (a as any).interview_score).reduce((acc, curr) => acc + ((curr as any).interview_score || 0), 0) / 
                  Math.max(1, recentApplications.filter(a => (a as any).interview_score).length)) * 0.6)
              )}
              topSkills={resumeAnalysis?.skills.slice(0, 3) || ['Technical Project', 'Teamwork', 'Core Fundamentals']}
              recentScores={recentApplications
                .filter(a => (a as any).interview_score)
                .map(a => (a as any).interview_score)
                .slice(0, 4)
              }
              applicationStatus={{ active: recentApplications.filter(a => a.status !== 'Rejected').length, total: recentApplications.length }}
              latestOpportunity={aiJobs?.length ? { title: aiJobs[0].title, company: aiJobs[0].company_name } : { title: "Ready for Matching", company: "SkillSync Hub" }}
              onViewDetail={() => router.push('/dashboard/analysis')}
            />

            <RecruitmentPanel 
              aiJobs={aiJobs}
              recentApplications={recentApplications}
              resumeAnalysis={resumeAnalysis}
              onApplyJob={handleApplyJob}
              onSkillGap={handleSkillGap}
              onMatchJobs={handleMatchJobs}
              onUploadClick={() => setIsUploadModalOpen(true)}
              onSyncSkills={handleSyncSkills}
              onClearAnalysis={handleClearAnalysis}
              onCourseClick={() => router.push('/dashboard/learning')}
              onMockInterview={() => router.push('/dashboard/interview')}
            />

            {/* Final Progress Section */}
            <div className="pt-10 border-t border-slate-200">
              <PathExplorer 
                courses={courses}
                searchTerm={searchTerm}
                onViewAll={() => router.push('/dashboard/learning')}
                onCourseClick={(c) => {
                  if (c.url && c.url.startsWith('http')) {
                    window.open(c.url, '_blank');
                  } else {
                    router.push(c.url || '/dashboard/learning');
                  }
                }}
              />
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-1 h-full sticky top-12">
            <CalendarProfile 
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              events={events}
              onMonthChange={setCurrentMonth}
              onDateSelect={setSelectedDate}
              onViewAllCalendar={() => router.push('/dashboard/calendar')}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {isReadinessModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 translate-x-8 -translate-y-8">
                <Icon name="auto_awesome" className="text-[160px] text-indigo-600" />
             </div>
             
             <button onClick={() => setIsReadinessModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-black transition-colors">
                <Icon name="close" />
             </button>

             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                   <div className="size-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                      <Icon name="psychology" className="text-3xl" />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black uppercase tracking-tight">Career Summary</h2>
                      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Your Progress Details</h2>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                   {[
                     { label: 'Profile Score', score: resumeAnalysis?.score || 0, color: 'text-emerald-500', icon: 'description' },
                     { label: 'Skill Depth', score: Math.round(recentApplications.filter(a => (a as any).interview_score).reduce((acc, curr) => acc + ((curr as any).interview_score || 0), 0) / Math.max(1, recentApplications.filter(a => (a as any).interview_score).length)) || 75, color: 'text-indigo-500', icon: 'analytics' },
                     { label: 'Platform Engagement', score: 98, color: 'text-amber-500', icon: 'verified_user' }
                   ].map((metric, i) => (
                     <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
                        <Icon name={metric.icon} className={`text-2xl mb-2 ${metric.color}`} />
                        <span className="text-[24px] font-black text-slate-900">{metric.score || 0}%</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{metric.label}</span>
                     </div>
                   ))}
                </div>

                <div className="space-y-6">
                   <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                      <div className="h-[2px] w-8 bg-indigo-600 rounded-full" />
                      Advice Hub
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                         <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Growth Plan</h4>
                         <p className="text-xs font-medium text-indigo-900">Focus on improving your {resumeAnalysis?.missing?.[0] || 'Technical Projects'} and relevant skill sets.</p>
                      </div>
                      <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                         <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Recommended</h4>
                         <p className="text-xs font-medium text-emerald-900">Your professional identity and platform engagement is outstanding.</p>
                      </div>
                   </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-50 flex justify-end">
                   <button onClick={() => setIsReadinessModalOpen(false)} className="px-8 py-4 bg-slate-900 text-white font-black uppercase tracking-[3px] text-[10px] rounded-xl hover:bg-black transition-all shadow-xl active:scale-95">Close</button>
                </div>
             </div>
          </div>
        </div>
      )}
      {aiRoadmap && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in max-h-screen overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-8 max-w-xl w-full shadow-2xl relative">
             <button onClick={() => setAiRoadmap(null)} className="absolute top-6 right-6 text-slate-400 hover:text-black"><Icon name="close" /></button>
             <h2 className="text-2xl font-black uppercase mb-2">Learning Roadmap</h2>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-6">Steps to reach your career goal</p>
             <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-100">
               <h3 className="font-bold mb-2">Summary</h3>
               <p className="text-sm font-medium text-slate-700">{aiRoadmap.summary}</p>
             </div>
             <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest">Recommended Path</h3>
                {(aiRoadmap.roadmap||[]).map((step: string, i: number) => (
                   <div key={i} className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">{i+1}</div>
                      <p className="text-sm font-medium pt-1 text-slate-700">{step}</p>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative text-center">
             <button onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); }} className="absolute top-6 right-6 text-slate-400 hover:text-black"><Icon name="close" /></button>
             <div className="w-16 h-16 bg-[#575a93]/10 text-[#575a93] rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="upload_file" className="text-3xl" />
             </div>
             <h2 className="text-2xl font-black mb-2 tracking-tight">Update Profile</h2>
             <p className="text-sm font-medium text-slate-500 mb-8">Upload your resume to update your career insights and job matches.</p>
             <div 
               onClick={() => fileInputRef.current?.click()}
               onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-[#575a93]', 'bg-[#575a93]/5'); }}
               onDragLeave={(e) => { e.currentTarget.classList.remove('border-[#575a93]', 'bg-[#575a93]/5'); }}
               onDrop={(e) => {
                 e.preventDefault();
                 e.currentTarget.classList.remove('border-[#575a93]', 'bg-[#575a93]/5');
                 const file = e.dataTransfer.files?.[0];
                 if (file && file.type === 'application/pdf') {
                   setSelectedFile(file);
                   toast.success(`Selected: ${file.name}`);
                 } else if (file) {
                   toast.error('Please drop a PDF file only.');
                 }
               }}
               className="border-2 border-dashed border-slate-200 rounded-2xl p-8 mb-6 hover:border-[#575a93] hover:bg-slate-50 transition-all cursor-pointer select-none"
             >
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setSelectedFile(file); toast.success(`Selected: ${file.name}`); }
                }}/>
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <Icon name="picture_as_pdf" className="text-3xl text-[#575a93] mb-1" />
                    <p className="text-sm font-black text-[#575a93] tracking-tight truncate max-w-full px-4">{selectedFile.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(selectedFile.size / 1024).toFixed(0)} KB — Ready to Process</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Icon name="cloud_upload" className="text-3xl text-slate-300 mb-1" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Drag & Drop or Click</p>
                    <p className="text-[10px] font-medium text-slate-300">PDF files only</p>
                  </div>
                )}
             </div>
             <button onClick={() => handleUploadResume()} disabled={!selectedFile} className="w-full bg-[#575a93] text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-[#434575] transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
               {isAnalyzing ? 'Processing...' : selectedFile ? 'Update Profile' : 'Select a PDF First'}
             </button>
          </div>
        </div>
      )}
    </>
  );
}
