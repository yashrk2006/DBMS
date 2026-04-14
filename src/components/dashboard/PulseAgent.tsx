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

type MessageSender = 'user' | 'career-assistant' | 'system';

export default function CareerHubAgent() {
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
          console.error("Chat History Error:", err);
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
          sender_id: 'career-assistant',
          content: data.response,
          created_at: new Date().toISOString()
        }]);
      } else {
        toast.error("Assistant Connection Failed");
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        toast.error("Connection Interrupted");
      }
    } finally {
      setIsAiThinking(false);
      abortControllerRef.current = null;
    }
  }

  const suggestions = [
    { label: "Review my Profile", icon: <Cpu size={14}/> },
    { label: "Find Internship Matches", icon: <Briefcase size={14}/> },
    { label: "Analyze my Skills", icon: <Layers size={14}/> }
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
          className="fixed bottom-28 md:bottom-12 right-6 md:right-12 z-[100] bg-slate-900 text-white p-3.5 md:p-4 rounded-2xl md:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 flex items-center gap-2 md:gap-3 active:bg-slate-800 transition-colors"
        >
          <div className="relative">
            <Zap className="text-amber-500 fill-amber-500" size={20} />
            <motion.div 
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute inset-0 bg-amber-500 rounded-full"
            />
          </div>
          <span className="font-bold text-[10px] md:text-xs uppercase tracking-[0.3em] hidden sm:block">Agent Pulse</span>
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
              <div className="p-8 md:p-10 border-b border-slate-50 flex items-center justify-between bg-white/80">
                <div className="flex items-center gap-5">
                  <div className="size-14 bg-slate-950 rounded-[1.5rem] flex items-center justify-center shadow-lg transform rotate-2">
                    <Zap className="text-amber-500 fill-amber-500" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950">Pulse AI.</h2>
                    <div className="flex items-center gap-2 mt-1">
                       <div className="size-1.5 bg-emerald-500 rounded-full" />
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[4px] leading-none">Intelligence Engine Active</p>
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
                className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 scroll-smooth"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-40">
                    <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-6">
                      <Sparkles className="text-slate-300" size={40} />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[4px] text-slate-400 mb-2">Student Intelligence Hub</p>
                      <p className="text-sm font-medium text-slate-400">Personalized career orchestration active.</p>
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
                        <div className={`shrink-0 size-10 rounded-[1rem] flex items-center justify-center ${isMe ? 'bg-amber-50' : 'bg-slate-950'}`}>
                          {isMe ? <Zap size={18} className="text-amber-600 fill-amber-600" /> : <Bot size={18} className="text-white" />}
                        </div>
                        <div className={`p-5 md:p-6 text-[13px] font-medium leading-[1.6] shadow-[var(--soft-shadow)] ${
                          isMe 
                          ? 'bg-slate-950 text-white rounded-[2rem] rounded-tr-none' 
                          : 'bg-slate-50 text-slate-800 rounded-[2rem] rounded-tl-none border border-slate-100'
                        }`}>
                          <div className="whitespace-pre-wrap">{m.content}</div>
                          <p className="text-[9px] mt-4 opacity-40 font-bold uppercase tracking-[2px]">
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
                <div className="px-6 md:px-8 pb-4 flex flex-wrap gap-2">
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
              <div className="p-6 md:p-8 pt-2 md:pt-4 bg-white/50">
                <div className="flex items-center gap-2 md:gap-3 bg-white p-2 pl-4 md:pl-6 rounded-full border border-slate-200 shadow-xl focus-within:border-amber-400 transition-all">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-xs md:text-[13px] font-bold placeholder:text-slate-300"
                  />
                  <button 
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isAiThinking}
                    className="size-10 md:size-12 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-amber-600 transition-all disabled:opacity-50 disabled:hover:bg-slate-900 shrink-0"
                  >
                    <Send size={16}  className="translate-x-0.5" />
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
