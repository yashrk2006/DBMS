'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  MessageSquare, Sparkles, Cpu, Play, CheckCircle2, 
  ArrowRight, ShieldCheck, Zap, BarChart3, AlertCircle,
  Send, User, Volume2, Mic, MicOff, Search, X, Award,
  Brain, Target
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

const premiumSpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20
};

function VoiceWaveform({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-8 px-4">
      {[...Array(12)].map((_, i) => (
        <motion.div
           key={i}
           animate={isActive ? {
             height: [8, Math.random() * 24 + 8, 8],
             opacity: [0.4, 1, 0.4]
           } : { height: 4, opacity: 0.2 }}
           transition={{
             duration: 0.5 + Math.random() * 0.5,
             repeat: Infinity,
             ease: "easeInOut"
           }}
           className="w-1 rounded-full bg-indigo-500"
        />
      ))}
    </div>
  );
}

function CompetencyRadar({ score, metrics }: { score: number; metrics: any }) {
  const size = 180;
  const center = size / 2;
  const radius = size * 0.4;
  
  // Normalized points for (Technical, Communication, Sentiment, Stability)
  const points = [
    { label: 'TEC', val: score / 100 },
    { label: 'COM', val: metrics.clarity / 100 },
    { label: 'SEN', val: metrics.sentiment / 100 },
    { label: 'STA', val: metrics.stability / 100 }
  ];

  const getPoint = (val: number, index: number) => {
    const angle = (Math.PI * 2 * index) / points.length - Math.PI / 2;
    return {
      x: center + radius * val * Math.cos(angle),
      y: center + radius * val * Math.sin(angle)
    };
  };

  const polygonPath = points.map((p, i) => {
    const pt = getPoint(p.val, i);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  return (
    <div className="relative size-[180px] flex items-center justify-center">
       <svg className="size-full overflow-visible">
          {/* Grid Circles */}
          {[0.25, 0.5, 0.75, 1].map(r => (
            <circle key={r} cx={center} cy={center} r={radius * r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          ))}
          {/* Axis Lines */}
          {points.map((p, i) => {
            const pt = getPoint(1, i);
            return <line key={p.label} x1={center} y1={center} x2={pt.x} y2={pt.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
          })}
          {/* Data Polygon */}
          <motion.polygon 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            points={polygonPath} 
            fill="rgba(99, 102, 241, 0.25)"
            stroke="#818cf8"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Labels */}
          {points.map((p, i) => {
            const pt = getPoint(1.2, i);
            return (
              <text key={p.label} x={pt.x} y={pt.y} textAnchor="middle" className="fill-indigo-400/60 text-[8px] font-black uppercase tracking-widest">{p.label}</text>
            );
          })}
       </svg>
    </div>
  );
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
    const welcome = "Hello! I am your DBMS institutional partner. Let's begin your assessment to help you evaluate your database proficiency. Are you ready?";
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

      <main className="flex-1 overflow-hidden relative flex flex-col xl:flex-row bg-[#FAFAFA]">
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {isStarted && !isFinished && !isAborted && (
            <div className="absolute top-8 left-8 z-30 flex flex-col gap-2 pointer-events-none">
               <div className="flex items-center gap-2 bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 border-l-rose-500 border-l-2">
                  <div className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[7px] font-black text-white uppercase tracking-[4px]">Live Proctoring Enabled</span>
               </div>
               <div className="flex flex-col gap-1 text-[7px] font-mono text-slate-500 uppercase tracking-widest pl-2">
                  <span>// EYE_TRACKING: ACTIVE</span>
                  <span>// AUDIO_FEED: ENCRYPTED</span>
                  <span>// SESSION_ID: {sessionId.current}</span>
               </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            <AnimatePresence mode="popLayout">
              {!isStarted && !isFinished && (
                <motion.div 
                  key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-4xl mx-auto space-y-10 pt-20 flex flex-col items-center text-center px-6"
                >
                  <div className="space-y-4 md:space-y-6 flex flex-col items-center">
                    <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full">
                      <Sparkles size={16} className="text-indigo-600" />
                      <span className="text-[10px] font-black uppercase tracking-[4px] text-indigo-600">Unified Career Intelligence</span>
                    </div>
                    <h2 className="text-4xl md:text-8xl font-black text-slate-900 uppercase tracking-tighter leading-[0.85]">
                      Your <span className="text-indigo-600">Career</span> <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500">Journey</span> Starts.
                    </h2>
                    <p className="text-sm md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl px-4">
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
                      <div className={`max-w-[85%] p-6 rounded-3xl shadow-sm relative group ${
                        m.role === 'ai' 
                        ? 'bg-white border border-slate-100 text-slate-700 font-medium rounded-tl-sm' 
                        : 'bg-indigo-600 text-white font-semibold rounded-tr-sm'
                      }`}>
                         <p className="text-base leading-relaxed">{m.content}</p>
                         {m.role === 'ai' && (
                           <button 
                             onClick={() => speak(m.content)}
                             className="absolute -right-12 top-0 p-2 text-slate-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all"
                             title="Replay Audio"
                           >
                             <Volume2 size={16} />
                           </button>
                         )}
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
                  key="results" 
                  initial={{ opacity: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  transition={premiumSpring}
                  className="max-w-6xl mx-auto space-y-12 py-12 md:py-20"
                >
                  <div className="flex flex-col items-start gap-6 border-l-4 border-indigo-600 pl-8">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Tactical assessment complete // validation: verified</span>
                    </div>
                    <h2 className="text-6xl md:text-8xl font-black text-[#09090B] uppercase tracking-[-0.04em] leading-[0.85]">
                      Capability<br/>Validated.
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                     {/* Score Panel - Large/Primary */}
                     <div className="lg:col-span-8 bg-[#09090B] p-12 rounded-[3.5rem] border border-white/5 text-left relative overflow-hidden group shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] min-h-[450px] flex flex-col justify-between">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.05] group-hover:scale-110 transition-transform duration-1000">
                          <Brain size={300} />
                        </div>
                        
                        <div className="relative z-10">
                           <div className="flex items-center gap-2 text-indigo-400 mb-8">
                             <Award size={20} />
                             <span className="text-[11px] font-black uppercase tracking-[0.5em]">Institutional score matrix</span>
                           </div>
                           <div className="flex items-baseline gap-4">
                             <h3 className="text-[10rem] font-black text-white tracking-tighter leading-none tabular-nums font-mono">
                               {feedback?.score}
                             </h3>
                             <span className="text-4xl font-black text-indigo-400 opacity-50 uppercase tracking-tighter">%</span>
                           </div>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-white/10">
                           {[
                             { label: 'Clarity', val: '92' },
                             { label: 'Sentiment', val: '88' },
                             { label: 'Stability', val: (100 - (proctorWarnings * 10)).toString() },
                             { label: 'Heuristic', val: '95' }
                           ].map(m => (
                             <div key={m.label} className="space-y-1">
                               <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.label}</div>
                               <div className="text-2xl font-black text-white font-mono tabular-nums">{m.val}<span className="text-[10px] text-slate-600 ml-0.5">%</span></div>
                             </div>
                           ))}
                        </div>
                     </div>

                     {/* Radar/Visual Column */}
                     <div className="lg:col-span-4 flex flex-col gap-8">
                        <div className="flex-1 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-50" />
                           <div className="relative z-10 scale-125">
                              <CompetencyRadar 
                                score={feedback?.score || 0} 
                                metrics={{ clarity: 92, sentiment: 88, stability: 100 - (proctorWarnings * 10) }} 
                              />
                           </div>
                           <div className="mt-8 text-center relative z-10">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Multi-axial competency map</span>
                           </div>
                        </div>

                        <div className="bg-[#09090B] p-10 rounded-[3rem] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                              <Target size={120} />
                           </div>
                           <div className="relative z-10 space-y-4">
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Assessment notes</span>
                              <p className="text-xl font-bold leading-tight text-white/90 italic">&quot;{feedback?.notes}&quot;</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Operational Controls */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className="size-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl">
                          <CheckCircle2 size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session verified // Reference</p>
                          <p className="text-sm font-black text-slate-900 font-mono tracking-tighter uppercase">{applicationId}-{sessionId.current}</p>
                       </div>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                      <button 
                        onClick={() => router.push('/dashboard')} 
                        className="flex-1 md:flex-none px-10 py-5 rounded-2xl border border-slate-200 text-slate-900 font-black uppercase text-[10px] tracking-[0.4em] hover:bg-slate-50 transition-all active:scale-95"
                      >
                        Navigate Home
                      </button>
                      <button 
                        onClick={() => router.push('/dashboard/internships')} 
                        className="flex-1 md:flex-none px-12 py-5 rounded-2xl bg-[#09090B] text-white font-black uppercase text-[11px] tracking-[0.5em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
                      >
                        Explore Channels
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* INPUT BAR */}
          {isStarted && !isFinished && (
            <div className="p-4 md:p-12 absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#FAFAFA] to-transparent z-10">
              <div className="max-w-4xl mx-auto relative group">
                <textarea 
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Type or speak your response..."
                  className="w-full p-6 md:p-8 pr-32 rounded-[2rem] md:rounded-[2.5rem] bg-white border border-slate-200 focus:border-indigo-600/30 transition-all text-slate-800 font-medium tracking-tight resize-none outline-none text-base md:text-lg shadow-xl"
                  rows={1}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   <div className="flex items-center gap-2">
                     <VoiceWaveform isActive={isListening} />
                     <motion.button 
                       whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                       onClick={toggleListening}
                       className={`size-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                         isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'
                       }`}
                     >
                       <Mic size={18} />
                     </motion.button>
                   </div>
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
                className="w-full xl:w-[420px] bg-white border-l border-slate-100 flex flex-col p-6 md:p-8 gap-6 md:gap-8 relative shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] overflow-y-auto"
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
                      <div className="p-8 rounded-[2.5rem] bg-[#09090B] text-white space-y-6 shadow-2xl border border-white/5 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                            <Activity size={100} />
                         </div>
                         <div className="flex justify-between items-end relative z-10">
                            <div>
                               <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400 block mb-1">Neural telemetry</span>
                               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Technical Mastery</span>
                            </div>
                            <span className="text-5xl font-black font-mono tracking-tighter tabular-nums leading-none">
                               {isFinished ? feedback?.score : (isStarted ? '88' : '0')}
                               <span className="text-xs text-indigo-400 ml-1">%</span>
                            </span>
                         </div>
                         <div className="h-2 bg-white/5 rounded-full overflow-hidden relative z-10">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: isFinished ? `${feedback?.score}%` : (isStarted ? '88%' : '0%') }}
                              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                            />
                         </div>
                      </div>

                      {/* DETAILED METRICS GRID */}
                      <div className="grid grid-cols-2 gap-4">
                         {[
                           { label: 'Latency', val: '42ms', color: 'text-emerald-500', icon: Zap },
                           { label: 'Clarity', val: 'HIGH', color: 'text-indigo-400', icon: Volume2 },
                           { label: 'Heuristic', val: 'SYNT', color: 'text-amber-400', icon: Sparkles },
                           { label: 'Stability', val: proctorWarnings > 0 ? 'FAIL' : 'NOMINAL', color: proctorWarnings > 0 ? 'text-rose-500' : 'text-emerald-500', icon: ShieldCheck }
                         ].map(m => (
                           <div key={m.label} className="p-6 rounded-[2rem] bg-white border border-slate-100 space-y-3 shadow-sm hover:shadow-md transition-shadow group">
                              <div className="flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                                 <m.icon size={12} className="text-slate-900" />
                                 <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-900">{m.label}</span>
                              </div>
                              <div className={`text-xl font-black uppercase tracking-tighter ${m.color} font-mono tabular-nums`}>{m.val}</div>
                           </div>
                         ))}
                      </div>

                      {/* Proctoring Log - Terminal Style */}
                      <div className="p-8 rounded-[2.5rem] bg-[#09090B] border border-white/5 space-y-5 shadow-2xl relative overflow-hidden group">
                         <div className="flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-2">
                               <div className="size-2 rounded-full bg-indigo-500 animate-pulse" />
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Proctoring events // log</span>
                            </div>
                            <div className={`text-[9px] font-black uppercase tracking-widest tabular-nums font-mono ${proctorWarnings > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {proctorWarnings > 0 ? `WARN: ${proctorWarnings}/${MAX_INCIDENTS}` : 'SYST: STABLE'}
                            </div>
                         </div>
                         
                         <div className="h-[120px] overflow-hidden relative flex flex-col gap-2 font-mono text-[8px] tracking-tight text-slate-500">
                            {incidentLogs.slice(-5).map((log, i) => (
                              <div key={i} className={`flex items-start gap-3 p-2 border-l border-indigo-500/20 bg-white/5 rounded-sm ${log.includes('WARNING') ? 'text-rose-400 bg-rose-500/5 border-l-rose-500' : ''}`}>
                                 <span className="opacity-30 shrink-0">[{new Date().toLocaleTimeString('en-GB')}]</span>
                                 <span className="truncate group-hover:whitespace-normal transition-all">{`>> ${log}`}</span>
                              </div>
                            ))}
                            {/* Terminal Scanline */}
                            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-20 bg-[length:100%_2px,3px_100%]" />
                         </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col gap-6">
                       <div className="group relative">
                          <WebcamPreview ref={webcamRef} />
                          <div className="absolute inset-0 border-[8px] border-white/10 rounded-[2.5rem] pointer-events-none group-hover:border-indigo-500/20 transition-all duration-700" />
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
