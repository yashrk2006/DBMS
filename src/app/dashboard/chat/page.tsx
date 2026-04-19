'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Send, User as UserIcon, Bot, MoreVertical, Loader2 } from 'lucide-react';
import { AI_ENGINE } from '@/lib/ai-engine';
import { toast } from 'react-hot-toast';

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState('');
  const [identityVerified, setIdentityVerified] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      setUserId(uid);

      try {
        const res = await fetch(`/api/dashboard/chat?userId=${uid}`);
        const contentType = res.headers.get('content-type');
        if (!contentType?.includes('application/json')) return;
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages);
          setIdentityVerified(true);
        }
      } catch (err) {
        console.error('Chat load error:', err);
      }
    }
    load();
  }, []);

  const [isAiThinking, setIsAiThinking] = useState(false);

  async function sendMessage() {
    if (!input.trim() || !userId) return;
    
    const userMsgContent = input;
    const newMsg = { id: Date.now(), sender_id: userId, content: userMsgContent, created_at: new Date() };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsAiThinking(true);

    try {
      // Save user message to DB (Optional but good for demo)
      fetch('/api/dashboard/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: userId, receiverId: 'system', content: userMsgContent })
      }).catch(err => console.error("DB save error:", err));

      // Get AI Response from Cohere
      const history = messages.slice(-6).map(m => ({
        role: m.sender_id === userId ? 'user' : 'assistant',
        message: m.content
      }));

      const res = await fetch('/api/dashboard/chat/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsgContent, history, userId })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender_id: 'system',
          content: data.response,
          created_at: new Date()
        }]);
      } else {
        toast.error("AI Assistant is offline");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiThinking(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-screen p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
        <div>
           <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Comms <span className="text-amber-600">Hub.</span></h1>
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">DBMS Protocol Recruiter Link</p>
        </div>
        <div className="size-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
           <MoreVertical size={20} className="text-slate-400" />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] shadow-soft border border-slate-50 flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
           {messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center opacity-50">
                   <Bot size={48} className="text-slate-300 mb-4" />
                   <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Initiate Communication</p>
               </div>
           ) : messages.map((m, i) => {
             const isMe = m.sender_id === userId;
             return (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                 key={m.id || i}
                 className={`flex items-end gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
               >
                 {!isMe && <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center"><Bot size={14} className="text-slate-500"/></div>}
                 <div className={`whitespace-pre-wrap px-6 py-4 max-w-[70%] text-[13px] font-medium leading-relaxed ${isMe ? 'bg-slate-900 text-white rounded-[2rem] rounded-br flex-row-reverse' : 'bg-slate-50 text-slate-700 rounded-[2rem] rounded-bl'}`}>
                    {m.content}
                 </div>
                 {isMe && <div className="size-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center"><UserIcon size={14} className="text-amber-600"/></div>}
               </motion.div>
             )
           })}
           {isAiThinking && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-slate-400">
               <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center animate-pulse"><Bot size={14} /></div>
               <div className="flex gap-1.5 bg-slate-50 px-4 py-3 rounded-full">
                 <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                 <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                 <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
               </div>
             </motion.div>
           )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100">
          <div className="flex items-center gap-3 bg-white p-2 rounded-full shadow-sm border border-slate-100">
             <input 
               type="text" 
               className="flex-1 bg-transparent border-none focus:ring-0 px-6 py-3 text-sm font-medium placeholder:text-slate-300"
               placeholder="Transmit message to recruiter..."
               value={input}
               onChange={e => setInput(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && sendMessage()}
             />
             <button onClick={sendMessage} className="size-12 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-amber-600 transition-colors shadow-lg">
                <Send size={18} className="translate-x-0.5" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
