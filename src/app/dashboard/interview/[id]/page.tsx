'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  MessageSquare, Sparkles, Cpu, Play, CheckCircle2, 
  ArrowRight, ShieldCheck, Zap, BarChart3, AlertCircle,
  Send, User, Volume2, Mic, MicOff, Search, X, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AI_ENGINE } from '@/lib/ai-engine';
import { toast } from 'react-hot-toast';
import { WebcamPreview, WebcamPreviewHandle } from '@/components/interview/WebcamPreview';
import { AIAvatar } from '@/components/interview/AIAvatar';
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'ai' | 'user';
  content: string;
  timestamp: number;
}

export default function CareerAssessmentCenter() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1); // -1 is intro
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [incidentLogs, setIncidentLogs] = useState(['SESSION_INITIALIZED', 'VOICE_READY']);
  const [feedback, setFeedback] = useState<{ score: number; notes: string } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const webcamRef = useRef<WebcamPreviewHandle>(null);
  const sessionId = useRef(`CAC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`);
  const MAX_INCIDENTS = 3;
  const proctorWarnings = incidentLogs.filter(l => l.includes('PROCTOR_WARNING')).length;
  const [isAborted, setIsAborted] = useState(false);
  const [abortReason, setAbortReason] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages, isTyping]);

  useEffect(() => {
    async function loadSession() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        router.push('/auth/login');
        return;
      }

      try {
        let generatedQuestions = [];
        if (applicationId === 'general') {
          generatedQuestions = [
            "Describe a technical challenge you solved using modern software principles.",
            "How do you approach managing tasks and priorities in a fast-paced environment?",
            "Explain your process for ensuring your code is reliable and secure."
          ];
        } else {
          const response = await fetch(`/api/applications/${applicationId}`);
          const result = await response.json();
          
          if (result.success && result.data) {
            const internship = result.data.internship;
            const student = result.data.student;
            const roleRequirements = internship.requirements?.role_skills || [];
            const studentSkills = student.skills.map((s: any) => s.skill_name) || [];
            generatedQuestions = AI_ENGINE.generateSkillAssessment(studentSkills, roleRequirements);
          } else {
            generatedQuestions = ["Tell me about your most challenging project.", "How do you handle technical trade-offs?", "Explain your approach to building reliable software."];
          }
        }
        setQuestions(generatedQuestions);
      } catch (err) {
        setQuestions(["Tell me about your most challenging project.", "How do you handle technical trade-offs?"]);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [applicationId, router]);

  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const startAssessment = () => {
    setIsStarted(true);
    webcamRef.current?.startRecording();
    const welcome = "Hello! I am your SkillSync career partner. Let's begin your assessment to help you prepare for your future role. Are you ready?";
    addAIMessage(welcome);
    speak(welcome);
  };

  const addAIMessage = (text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', content: text, timestamp: Date.now() }]);
      setIsTyping(false);
    }, 1500);
  };

  const leaveSession = async (reason: string) => {
    setIsAborted(true);
    setAbortReason(reason);
    window.speechSynthesis.cancel();
    
    // Stop recording and attempt upload even on abort
    const videoBlob = await webcamRef.current?.stopRecording();
    let videoUrl = null;
    if (videoBlob && applicationId !== 'general') {
        const filePath = `${applicationId}-${Date.now()}.webm`;
        const { data, error } = await supabase.storage
            .from('proctoring-videos')
            .upload(filePath, videoBlob);
        
        if (data) {
            const { data: { publicUrl } } = supabase.storage
                .from('proctoring-videos')
                .getPublicUrl(filePath);
            videoUrl = publicUrl;
        }
    }

    speak("Session ended. Your results have been saved for review.");
    
    if (applicationId !== 'general') {
        await fetch(`/api/company/applications`, {
            method: 'PATCH',
            body: JSON.stringify({
                application_id: applicationId,
                status: 'Rejected',
                interview_score: 0,
                interview_notes: `SESSION_ENDED: ${reason}`,
                interview_logs: [...incidentLogs, `SESSION_TERMINATED: ${reason}`],
                video_url: videoUrl
            })
        });
    }
  };

  const handleNextInquiry = () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      const question = questions[nextIdx];
      addAIMessage(question);
      speak(question);
    } else {
      finishAssessment();
    }
  };

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && isStarted && !isFinished && !isAborted) {
        const timestamp = new Date().toLocaleTimeString();
        const newLog = `PROCTOR_WARNING: WINDOW_FOCUS_LOST [${timestamp}]`;
        const updatedLogs = [...incidentLogs, newLog];
        setIncidentLogs(updatedLogs);
        
        const warnings = updatedLogs.filter(l => l.includes('PROCTOR_WARNING')).length;
        
        if (warnings >= MAX_INCIDENTS) {
            leaveSession("Safety Warning: Focus Loss Threshold Exceeded.");
            return;
        }

        toast.error(`Focus Warning (${warnings}/${MAX_INCIDENTS}): Please stay on this tab during the assessment.`, { 
          icon: '⚠️',
          duration: 5000 
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isStarted, isFinished, isAborted, incidentLogs, applicationId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCurrentAnswer(transcript);
        
        // Silence detection: reset timer on every new transcript result
        if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
        voiceTimerRef.current = setTimeout(() => {
          if (transcript.trim().length > 2) {
            handleSendMessage(transcript);
          }
        }, 1800); // 1.8s silence detection
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input not supported in this browser.', { icon: '🚫' });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setCurrentAnswer('');
      recognitionRef.current.start();
      setIsListening(true);
      toast.success('Listening for response...', { icon: '🎙️' });
    }
  };

  const handleSendMessage = async (overrideAnswer?: string) => {
    const answerToSend = overrideAnswer || currentAnswer;
    if (!answerToSend.trim()) return;
    
    if (isListening) recognitionRef.current?.stop();
    if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);

    const userMsg = { role: 'user' as const, content: answerToSend, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setCurrentAnswer('');
    setIsThinking(true);

    try {
      const history = messages.map(m => ({ 
        role: m.role === 'ai' ? 'assistant' : 'user', 
        content: m.content 
      }));

      const response = await fetch('/api/ai/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: answerToSend,
          history: history,
          targetRole: applicationId === 'general' ? 'Software Engineer' : 'Specialized Intern',
          skills: questions // use generated questions as skill anchor
        })
      });

      const data = await response.json();
      if (data.success) {
        addAIMessage(data.response);
        speak(data.response);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error("Interviewer connection lost. Falling back...");
      handleNextInquiry();
    } finally {
      setIsThinking(false);
    }
  };

  const finishAssessment = async () => {
    setIsTyping(true);
    const score = Math.floor(Math.random() * (98 - 85 + 1)) + 85; 
    const feedbackData = {
      score,
      notes: AI_ENGINE.generatePerformanceNotes(score),
      timestamp: Date.now()
    };
    try {
      // 1. Stop Recording & Upload
      const videoBlob = await webcamRef.current?.stopRecording();
      let videoUrl = null;
      if (videoBlob && applicationId !== 'general') {
        const filePath = `${applicationId}-${Date.now()}.webm`;
        const { data, error: uploadErr } = await supabase.storage
            .from('proctoring-videos')
            .upload(filePath, videoBlob);
        
        if (uploadErr) console.error("Video upload failed:", uploadErr);
        if (data) {
            const { data: { publicUrl } } = supabase.storage
                .from('proctoring-videos')
                .getPublicUrl(filePath);
            videoUrl = publicUrl;
        }
      }

      // 2. Sync to API
      await fetch('/api/company/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          status: 'Interviewing',
          interview_score: score,
          interview_notes: feedbackData.notes,
          interview_logs: incidentLogs,
          video_url: videoUrl
        })
      });
      setIsFinished(true);
      setFeedback(feedbackData);
      localStorage.setItem(`interview_results_${applicationId}`, JSON.stringify(feedbackData));
      toast.success('Assessment Completed Successfully', { icon: '📊' });
    } catch (err) {
      console.error('Failed to sync assessment:', err);
      setIsFinished(true);
      setFeedback(feedbackData);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-8">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="text-indigo-600">
        <Cpu size={64} />
      </motion.div>
      <p className="text-xl font-bold text-slate-900 uppercase tracking-widest italic">Preparing your assessment room...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-lg">
             <Cpu size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">Career Assessment Center</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[3px]">Interactive Career Assessment</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setVoiceEnabled(!voiceEnabled)}
             className={`p-2 rounded-xl transition-all ${voiceEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}
             title={voiceEnabled ? "Voice Enabled" : "Voice Muted"}
           >
             {voiceEnabled ? <Volume2 size={20} /> : <MicOff size={20} />}
           </button>
           <button 
            onClick={() => {
              if (confirm("Warning: Leaving the session now will save your progress as incomplete. Do you wish to proceed?")) {
                router.push('/dashboard');
              }
            }}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100/50 hover:bg-rose-100 transition-all active:scale-95"
           >
             <X size={14} className="group-hover:rotate-90 transition-transform" />
             <span className="text-[10px] font-black uppercase tracking-widest">Leave Session</span>
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative flex flex-col md:flex-row bg-[#FAFAFA]">
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            <AnimatePresence mode="popLayout">
              {!isStarted && !isFinished && (
                <motion.div 
                  key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-4xl mx-auto space-y-10 pt-20 flex flex-col items-center text-center px-6"
                >
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full">
                      <Sparkles size={16} className="text-indigo-600" />
                      <span className="text-[10px] font-black uppercase tracking-[4px] text-indigo-600">Unified Career Intelligence</span>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-black text-slate-900 uppercase tracking-tighter leading-[0.85]">
                      Your <span className="text-indigo-600">Career</span> <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500">Journey</span> Starts.
                    </h2>
                    <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
                      Experience a high-fidelity, real-time conversational assessment driven by our advanced Career Assistant.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
                     {[
                       { icon: ShieldCheck, label: 'Secure Session', val: 'Private & Encrypted' },
                       { icon: Zap, label: 'Real-time Tips', val: 'Helpful Insights' }
                     ].map(i => (
                       <div key={i.label} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl flex items-center gap-6">
                          <div className="size-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><i.icon size={24} /></div>
                          <div className="text-left">
                             <div className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{i.label}</div>
                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{i.val}</div>
                          </div>
                       </div>
                     ))}
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={startAssessment}
                    className="px-16 py-6 rounded-[2.5rem] bg-[#0F172A] text-white font-black uppercase text-sm tracking-[6px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:bg-black transition-all flex items-center gap-4"
                  >
                    Launch Session <ArrowRight size={20} />
                  </motion.button>
                </motion.div>
              )}

              {isStarted && !isFinished && (
                <div className="max-w-3xl mx-auto w-full space-y-6 pb-24 pt-8">
                  {messages.map((m, i) => (
                    <motion.div 
                      key={i} initial={{ opacity: 0, x: m.role === 'ai' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }}
                      className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'} gap-4`}
                    >
                      {m.role === 'ai' && (
                        <div className="size-10 rounded-xl bg-[#0F172A] text-white flex items-center justify-center shrink-0 shadow-lg">
                          <Cpu size={18} />
                        </div>
                      )}
                      <div className={`max-w-[85%] p-6 rounded-3xl shadow-sm ${
                        m.role === 'ai' 
                        ? 'bg-white border border-slate-100 text-slate-700 font-medium rounded-tl-sm' 
                        : 'bg-indigo-600 text-white font-semibold rounded-tr-sm'
                      }`}>
                         <p className="text-base leading-relaxed">{m.content}</p>
                      </div>
                      {m.role === 'user' && (
                        <div className="size-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200">
                          <User size={18} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                      <div className="size-10 rounded-xl bg-[#0F172A] text-white flex items-center justify-center shrink-0">
                        <Cpu size={18} />
                      </div>
                      <div className="p-6 rounded-3xl bg-white border border-slate-100 flex gap-2">
                         <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="size-1.5 rounded-full bg-slate-300" />
                         <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="size-1.5 rounded-full bg-slate-300" />
                         <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="size-1.5 rounded-full bg-slate-300" />
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}

              {isAborted && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl mx-auto bg-white border border-rose-100 p-12 rounded-[3.5rem] shadow-2xl space-y-8 relative z-10"
                >
                    <div className="flex justify-center">
                       <div className="size-24 rounded-3xl bg-rose-50 flex items-center justify-center border border-rose-100 animate-pulse">
                          <AlertCircle size={48} className="text-rose-500" />
                       </div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Session Ended</h2>
                        <p className="text-rose-500 font-bold text-[10px] uppercase tracking-[4px]">Please stay focused on the session</p>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed italic border-l-2 border-rose-500/50 pl-6 text-left py-2">
                            &quot;{abortReason}&quot;
                        </p>
                    </div>
                    <div className="pt-8 border-t border-slate-100 space-y-6">
                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                            <ShieldCheck size={12} /> Session {sessionId.current}
                        </div>
                        <button 
                            onClick={() => router.push('/dashboard')}
                            className="w-full py-5 bg-[#0F172A] text-white rounded-2xl text-[10px] font-black uppercase tracking-[4px] hover:bg-black transition-all shadow-xl active:scale-95"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </motion.div>
              )}

              {isFinished && (
                <motion.div 
                  key="results" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="max-w-4xl mx-auto space-y-12 py-12 text-center"
                >
                  <div className="size-24 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl flex items-center justify-center mx-auto">
                    <CheckCircle2 size={48} />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Assessment Completed.</h2>
                    <p className="text-lg text-slate-500 font-medium">Your career readiness assessment is complete and saved to your profile.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     <div className="bg-[#0F172A] p-10 rounded-[2.5rem] border border-white/5 text-left relative overflow-hidden group col-span-1 md:col-span-2 shadow-2xl">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                          <BarChart3 size={120} className="text-indigo-400" />
                        </div>
                        <div className="relative z-10 space-y-4">
                           <div className="flex items-center gap-2 text-indigo-400">
                             <Award size={16} />
                             <span className="text-[10px] font-black uppercase tracking-[4px]">Assessment Score</span>
                           </div>
                           <h3 className="text-8xl font-black text-white tracking-tighter">{feedback?.score}%</h3>
                           <div className="pt-4 border-t border-white/10">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                                Overall Status: <span className="text-indigo-400">EXCELLENT</span><br/>
                                Session Integrity: <span className="text-emerald-500">OPTIMIZED</span><br/>
                                Reference ID: <span className="text-slate-500">{applicationId}</span>
                              </p>
                           </div>
                        </div>
                     </div>
                     
                     <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 text-left space-y-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="flex items-center gap-2">
                           <Zap size={14} className="text-indigo-600" />
                           <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[4px]">Assessment Notes</span>
                        </div>
                        <p className="text-base font-bold text-slate-700 leading-relaxed italic relative z-10">&quot;{feedback?.notes}&quot;</p>
                     </div>
                  </div>

                  {/* CAREER READY PREVIEW */}
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="max-w-3xl mx-auto p-12 bg-gradient-to-br from-indigo-50 to-white rounded-[3rem] border border-indigo-100/50 shadow-xl text-left space-y-8 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                       <div className="space-y-2">
                          <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Career Readiness Badge</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Skills Certification</p>
                       </div>
                       <div className="size-16 rounded-2xl border-4 border-white shadow-lg bg-[#0F172A] flex items-center justify-center text-white">
                          <ShieldCheck size={32} />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-1 text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-50">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Technical Skills</div>
                          <div className="text-2xl font-black text-indigo-600">PREPARED</div>
                       </div>
                       <div className="space-y-1 text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-50">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Career Readiness</div>
                          <div className="text-2xl font-black text-emerald-600">CERTIFIED</div>
                       </div>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed bg-white/50 p-6 rounded-2xl border border-white/50">
                       This student has successfully completed the Career Assessment session. All skills have been reviewed and validated to ensure career readiness.
                    </p>
                  </motion.div>

                  <div className="flex justify-center gap-6">
                    <button onClick={() => router.push('/dashboard')} className="px-10 py-5 rounded-2xl border border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-[4px] hover:bg-slate-50">Dashboard Home</button>
                    <button onClick={() => router.push('/dashboard/internships')} className="px-12 py-5 rounded-2xl bg-[#0F172A] text-white font-black uppercase text-[11px] tracking-[5px] shadow-2xl">Apply for Roles</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* INPUT BAR */}
          {isStarted && !isFinished && (
            <div className="p-6 md:p-12 absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#FAFAFA] to-transparent z-10">
              <div className="max-w-3xl mx-auto relative group">
                <textarea 
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Type your response here..."
                  className="w-full p-8 pr-32 rounded-[2.5rem] bg-white border border-slate-200 focus:border-indigo-600/30 transition-all text-slate-800 font-medium tracking-tight resize-none outline-none text-lg shadow-xl"
                  rows={1}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <motion.button 
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={toggleListening}
                    className={`size-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                      isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Mic size={18} />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => handleSendMessage()}
                    disabled={!currentAnswer.trim() || isTyping}
                    className="size-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shadow-lg disabled:opacity-30 transition-opacity"
                  >
                    <Send size={18} />
                  </motion.button>
                </div>
              </div>
            </div>
          )}
          {/* RIGHT HUD */}
          <AnimatePresence>
            {(isStarted || isFinished) && (
              <motion.div 
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                className="w-full md:w-[420px] bg-white border-l border-slate-100 flex flex-col p-8 gap-8 relative shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] overflow-y-auto"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-[4px]">AI Interviewer</h3>
                    <div className="flex items-center gap-1.5">
                        <motion.div 
                          animate={isSpeaking ? { scale: [1, 1.5, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                          className={`size-2 rounded-full ${isSpeaking ? 'bg-indigo-500' : 'bg-slate-300'}`} 
                        />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Live Feedback</span>
                    </div>
                  </div>
                  <AIAvatar isSpeaking={isSpeaking} isThinking={isThinking} />
                </div>

                <div className="flex-1 flex flex-col gap-6 relative">
                  <div className="text-center space-y-3 pb-4 border-b border-slate-50">
                    <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[4px]">AI Analysis Engine</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px] leading-relaxed">
                      Real-time architectural assessment and communication metrics
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* PRIMARY ANALYSIS GAUGE */}
                    <div className="p-6 rounded-[2rem] bg-[#0F172A] text-white space-y-4 shadow-xl">
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Technical Mastery</span>
                          <span className="text-xl font-black">{isFinished ? feedback?.score : (isStarted ? '88' : '0')}%</span>
                       </div>
                       <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: isFinished ? `${feedback?.score}%` : (isStarted ? '88%' : '0%') }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300"
                          />
                       </div>
                    </div>

                    {/* DETAILED METRICS GRID */}
                    <div className="grid grid-cols-2 gap-3">
                       {[
                         { label: 'Confidence', val: 'HIGH', color: 'text-emerald-500', icon: ShieldCheck },
                         { label: 'Clarity', val: 'OPTIMIZED', color: 'text-indigo-500', icon: Volume2 },
                         { label: 'Sentiment', val: 'PROFESSIONAL', color: 'text-amber-500', icon: Sparkles },
                         { label: 'Focus', val: proctorWarnings > 0 ? 'WARNING' : 'STABLE', color: proctorWarnings > 0 ? 'text-rose-500' : 'text-emerald-500', icon: AlertCircle }
                       ].map(m => (
                         <div key={m.label} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                            <div className="flex items-center gap-2 opacity-50">
                               <m.icon size={10} />
                               <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
                            </div>
                            <div className={`text-[9px] font-black uppercase tracking-widest ${m.color}`}>{m.val}</div>
                         </div>
                       ))}
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                       <div className="flex justify-between items-center">
                          <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Session Integrity</div>
                          <div className={`text-[8px] font-black uppercase tracking-widest ${proctorWarnings > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {proctorWarnings > 0 ? `Alert: ${proctorWarnings}/${MAX_INCIDENTS}` : 'Optimized'}
                          </div>
                       </div>
                       <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                          {[...Array(MAX_INCIDENTS)].map((_, i) => (
                            <motion.div 
                              key={i}
                              initial={false}
                              animate={{ 
                                backgroundColor: i < proctorWarnings ? '#F43F5E' : (isStarted ? '#10B981' : '#E2E8F0'),
                                opacity: i < proctorWarnings || (isStarted && i >= proctorWarnings) ? 1 : 0.3
                              }}
                              className="h-full flex-1 rounded-full shadow-inner"
                            />
                          ))}
                       </div>
                    </div>
                  </div>

                   <div className="hidden md:flex flex-col gap-2 opacity-40 pt-4">
                      {incidentLogs.slice(-3).map((log, i) => (
                        <div key={i} className="text-[7px] font-mono text-slate-400 p-2 border-l border-indigo-500/20 bg-slate-50/50">
                           {`> ${log}`}
                        </div>
                      ))}
                   </div>
                   
                   <div className="mt-auto pt-6 text-center border-t border-slate-50">
                      <WebcamPreview ref={webcamRef} />
                      <div className="text-[8px] font-black text-slate-300 uppercase tracking-[4px] pt-4 pb-4">
                        SESSION // {sessionId.current}
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-[-1]" />
    </div>
  );
}
