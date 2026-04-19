'use client';

import React from 'react';
import Icon from '@/components/ui/Icon';
import { Internship, Application, AIResumeAnalysis } from '@/types';
import { Sparkles } from 'lucide-react';

interface RecruitmentPanelProps {
  aiJobs: Internship[] | null;
  recentApplications: Application[];
  resumeAnalysis: AIResumeAnalysis | null;
  onApplyJob: (job: Internship) => void;
  onSkillGap: () => void;
  onMatchJobs: () => void;
  onUploadClick: () => void;
  onSyncSkills: () => void;
  onClearAnalysis: () => void;
  onCourseClick: () => void;
  onMockInterview: () => void;
  searchTerm?: string;
}

export const RecruitmentPanel = ({
  aiJobs,
  recentApplications,
  resumeAnalysis,
  onApplyJob,
  onSkillGap,
  onMatchJobs,
  onUploadClick,
  onSyncSkills,
  onClearAnalysis,
  onCourseClick,
  onMockInterview,
  searchTerm = ""
}: RecruitmentPanelProps) => {
  const [hideApplied, setHideApplied] = React.useState(false);

  const filteredJobs = React.useMemo(() => {
    if (!aiJobs) return [];
    let result = hideApplied ? aiJobs.filter(j => !j.applied) : aiJobs;
    
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(j => 
        j.title.toLowerCase().includes(q) || 
        j.company_name.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [aiJobs, hideApplied, searchTerm]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-fit">
      {/* Skill Prep Card */}
      <div className="bg-white/50 backdrop-blur-sm p-8 rounded-3xl relative flex flex-col gap-5 overflow-hidden border border-slate-100 h-full shadow-[var(--soft-shadow)] hover:-translate-y-1 transition-all">
        <div className="space-y-1 relative z-10">
          <h4 className="text-xl font-bold tracking-tight text-slate-950">Mock Preparation.</h4>
          <p className="text-xs text-slate-500 font-medium">Practice with realistic AI interviewers</p>
        </div>
        <div className="flex items-center justify-between mt-auto relative z-10">
          <button 
            onClick={onMockInterview}
            className="w-full bg-slate-900 text-white font-bold px-4 py-3 rounded-2xl text-xs hover:bg-black transition-all active:scale-95 shadow-lg"
          >
            Start Practice Session
          </button>
        </div>
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl z-0" />
      </div>

      {/* Profile Analysis */}
          {resumeAnalysis ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-base tracking-tight text-emerald-600">Profile Intelligence</h4>
                  <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-3 py-1 rounded-full border border-emerald-100">Score: {resumeAnalysis.score}</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Your Skills</p>
                  <div className="max-h-[140px] overflow-y-auto pr-1">
                     <div className="flex flex-wrap gap-2">
                        {(resumeAnalysis.skills||[]).map((s:string)=>(
                          <span key={s} className="bg-slate-50 text-[8px] px-3 py-1.5 rounded-xl font-bold text-slate-600 border border-slate-100">{s}</span>
                        ))}
                     </div>
                   </div>
                </div>
                <div>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1">Focus Areas</p>
                  <div className="max-h-[140px] overflow-y-auto pr-1">
                     <div className="flex flex-wrap gap-2">
                        {(resumeAnalysis.missing||[]).map((s:string)=>(
                          <span key={s} className="bg-amber-50 text-amber-600 text-[8px] px-3 py-1.5 rounded-xl font-bold border border-amber-100">{s}</span>
                        ))}
                     </div>
                   </div>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                   <div className="grid grid-cols-2 gap-2">
                     <button 
                       onClick={onSyncSkills}
                       className="py-2.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"
                     >
                       <Icon name="check_circle" className="text-[12px]" /> Save
                     </button>
                     <button 
                       onClick={onMatchJobs}
                       className="py-2.5 rounded-xl border border-amber-100 bg-amber-50 text-amber-700 text-[9px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"
                     >
                       <Icon name="explore" className="text-[12px]" /> Roles
                     </button>
                   </div>
                   <button 
                     onClick={onClearAnalysis}
                     className="w-full py-2.5 rounded-xl bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
                   >
                     <Icon name="update" className="text-[12px]" /> Reset Profile
                   </button>
                 </div>
               </div>
         ) : (
               <div onClick={onUploadClick} className="flex flex-col items-center justify-center text-center gap-3 cursor-pointer py-4 group">
                 <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform"><Icon name="edit_document" className="text-3xl" /></div>
                 <div className="space-y-1">
                   <h5 className="text-[15px] font-bold tracking-tight">Resume Analysis</h5>
                   <p className="text-[11px] text-[#5a6062] px-6 font-medium">Get personalized career help</p>
                 </div>
               </div>
         )}


        <div className="col-span-1 lg:col-span-3 bg-white/40 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-3">
                <Sparkles className="text-amber-500 size-6" />
                Opportunities Found.
              </h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[4px]">Verified Career Intelligence Matches</p>
            </div>
            <button 
              onClick={() => setHideApplied(!hideApplied)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all w-full md:w-auto justify-center ${hideApplied ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'}`}
            >
              <Icon name={hideApplied ? 'visibility_off' : 'visibility'} className="text-sm" />
              {hideApplied ? 'Hidden Applied' : 'Hide Applied'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredJobs.length > 0 ? (
               filteredJobs.slice(0, 3).map(job => (
                 <div key={job.internship_id} className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                       <div className="space-y-1">
                          <h5 className="text-xs font-black uppercase tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">{job.title}</h5>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{job.company_name}</p>
                       </div>
                       {job.applied && <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[8px] font-black uppercase">Applied</span>}
                    </div>
                    <button 
                      onClick={() => onApplyJob(job)}
                      disabled={job.applied}
                      className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${job.applied ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-[#575a93] text-white hover:bg-black active:scale-95'}`}
                    >
                      {job.applied ? 'Submitted' : 'One-Click Apply'}
                    </button>
                 </div>
               ))
             ) : (
               <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching roles found with current filters</p>
               </div>
             )}
          </div>
        </div>

      <section id="growth-map" className="col-span-1 lg:col-span-3 space-y-6 pt-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
              <Icon name="auto_stories" className="text-slate-900" />
              Your Progress Path
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended steps based on your skills</p>
          </div>
        </div>
        
        <div className="relative">
          {resumeAnalysis?.missing && resumeAnalysis.missing.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {resumeAnalysis.missing.slice(0, 3).map((skill: string, i: number) => (
                <div key={i} onClick={onCourseClick} className="bg-white p-6 rounded-[2.2rem] flex flex-col gap-4 shadow-soft active:scale-95 transition-transform border border-slate-50 cursor-pointer group">
                  <div className="flex justify-between items-start">
                    <div className="size-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                      <Icon name="school" className="text-xl" />
                    </div>
                    <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-widest">Priority</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight mb-3">{skill}</h4>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000" 
                        style={{ width: i === 0 ? '40%' : i === 1 ? '25%' : '15%' }} 
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                       <span className="text-[8px] font-bold text-slate-400 uppercase">Proficiency</span>
                      <span className="text-[8px] font-bold text-amber-600 uppercase">{i === 0 ? '40%' : i === 1 ? '25%' : '15%'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative p-12 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-50" />
              <div className="relative z-10 space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 animate-pulse">
                  <Icon name="tips_and_updates" className="text-3xl" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black uppercase tracking-[2px] text-slate-400">Path Not Started</h4>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[3px]">Complete your profile to see recommendations</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RecruitmentPanel;
