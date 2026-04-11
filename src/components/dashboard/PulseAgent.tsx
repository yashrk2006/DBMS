'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  Send, 
  Bot, 
  X, 
  Maximize2, 
  Minimize2, 
  Cpu, 
  Sparkles,
  Zap,
  Briefcase,
  Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Message } from '@/types';

type MessageSender = 'user' | 'pulse-agent' | 'system';

export default function PulseAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Initial Load & Persistence
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id || !isMounted) return;
      setUserId(session.user.id);

      // Load History
      try {
        const res = await fetch(`/api/dashboard/chat?userId=${session.user.id}`, {
          signal: controller.signal
        });
        const data = await res.json();
        if (data.success && isMounted) {
          setMessages(data.messages);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Pulse History Error:", err);
        }
      }
    }
    
    init();
    return () => { 
      isMounted = false; 
      controller.abort();
    };
  }, []);

  // 2. Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiThinking]);

  // 3. Send Message Handler
  async function sendMessage(textOverride?: string) {
    const messageToSend = textOverride || input;
    if (!messageToSend.trim() || !userId || isAiThinking) return;

    // Abort previous AI request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMsg: Message = { 
      id: Date.now(), 
      sender_id: userId, 
      content: messageToSend, 
      created_at: new Date().toISOString() 
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textOverride) setInput('');
    setIsAiThinking(true);

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.sender_id === userId ? 'user' : 'assistant',
        message: m.content
      }));

      const res = await fetch('/api/dashboard/chat/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend, history, userId }),
        signal: abortControllerRef.current.signal
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender_id: 'pulse-agent',
          content: data.response,
          created_at: new Date().toISOString()
        }]);
      } else {
        toast.error("Pulse Synchronization Failed");
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        toast.error("Pulse Link Interrupted");
      }
    } finally {
      setIsAiThinking(false);
      abortControllerRef.current = null;
    }
  }

  const suggestions = [
    { label: "Analyze my Profile", icon: <Cpu size={14}/> },
    { label: "Find Internship Matches", icon: <Briefcase size={14}/> },
    { label: "Critique my Skills", icon: <Layers size={14}/> }
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-8 lg:bottom-12 lg:right-12 z-[100] bg-slate-900 text-white p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 flex items-center gap-3 active:bg-slate-800 transition-colors"
        >
          <div className="relative">
            <Zap className="text-amber-400 fill-amber-400" size={24} />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-amber-400 rounded-full"
            />
          </div>
          <span className="font-black text-xs uppercase tracking-[0.2em] hidden md:block">Pulse Agent</span>
        </motion.button>
      )}

      {/* Floating Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] md:w-[500px] z-[110] p-4 lg:p-6"
          >
            <div className="h-full bg-white/90 backdrop-blur-3xl rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-white flex flex-col overflow-hidden">
              
              {/* Header */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                    <Zap className="text-amber-400 fill-amber-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tighter text-slate-900 uppercase">Pulse <span className="text-amber-600">Agent.</span></h2>
                    <div className="flex items-center gap-2">
                       <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Synchronization Active</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-40">
                    <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                      <Sparkles className="text-slate-300" size={32} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Workspace Intelligence</p>
                      <p className="text-xs font-bold text-slate-400">Ask Pulse about your career path</p>
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const isMe = m.sender_id === userId;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={m.id || i}
                        className={`flex items-start gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div className={`shrink-0 size-8 rounded-xl flex items-center justify-center ${isMe ? 'bg-amber-100' : 'bg-slate-900'}`}>
                          {isMe ? <Zap size={14} className="text-amber-600 fill-amber-600" /> : <Bot size={14} className="text-white" />}
                        </div>
                        <div className={`p-5 text-[13px] font-semibold leading-relaxed shadow-sm ${
                          isMe 
                          ? 'bg-slate-900 text-white rounded-[2rem] rounded-tr-none' 
                          : 'bg-slate-50 text-slate-800 rounded-[2rem] rounded-tl-none border border-slate-100'
                        }`}>
                          <div className="whitespace-pre-wrap">{m.content}</div>
                          <p className="text-[9px] mt-3 opacity-50 font-bold uppercase tracking-widest">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                {isAiThinking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4">
                    <div className="size-8 rounded-xl bg-slate-900 flex items-center justify-center animate-spin-slow">
                      <Zap size={14} className="text-amber-400 fill-amber-400" />
                    </div>
                    <div className="bg-slate-50 px-6 py-4 rounded-[2rem] rounded-tl-none border border-slate-100 flex gap-2">
                       <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                       <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                       <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Suggestions */}
              {messages.length < 5 && !isAiThinking && (
                <div className="px-8 pb-4 flex flex-wrap gap-2">
                   {suggestions.map((s, idx) => (
                     <button
                       key={idx}
                       onClick={() => sendMessage(s.label)}
                       className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-all hover:bg-amber-50"
                     >
                       {s.icon}
                       {s.label}
                     </button>
                   ))}
                </div>
              )}

              {/* Input */}
              <div className="p-8 pt-4 bg-white/50">
                <div className="flex items-center gap-3 bg-white p-2.5 pl-6 rounded-full border border-slate-200 shadow-xl focus-within:border-amber-400 transition-all">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask Pulses..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] font-bold placeholder:text-slate-300"
                  />
                  <button 
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isAiThinking}
                    className="size-12 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-amber-600 transition-all disabled:opacity-50 disabled:hover:bg-slate-900"
                  >
                    <Send size={18} className="translate-x-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
