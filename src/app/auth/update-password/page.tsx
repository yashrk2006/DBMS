'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Lock, CheckCircle2, AlertCircle, 
  ArrowRight, ShieldCheck, Zap 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { NeuralParticleField } from '@/components/ui/NeuralParticleField';
import GsapMagnetic from '@/components/ui/GsapMagnetic';
import Link from 'next/link';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      toast.success("Security Handshake Complete: Password Rotated");
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Credential update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <NeuralParticleField />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <GsapMagnetic>
            <Link href="/">
              <div className="inline-flex size-14 rounded-2xl bg-slate-900 text-white items-center justify-center shadow-lg shadow-slate-950/20 mb-8">
                <Zap size={28} />
              </div>
            </Link>
          </GsapMagnetic>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Security Rotation</h1>
          <p className="text-[10px] font-black uppercase tracking-[5px] text-slate-400 mt-2">Credential Reset Protocol</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 relative overflow-hidden">
          {success ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6 py-4"
            >
              <div className="size-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 uppercase">Synchronized</h2>
                <p className="text-sm font-medium text-slate-500">Your new credentials have been committed to the security vault. Redirecting to terminal...</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-8">
              <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                 <ShieldCheck size={14} className="text-amber-600" />
                 <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Active Security Session</span>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Confirm Identity Key</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[4px] flex items-center justify-center gap-3 hover:bg-amber-600 transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? "Processing..." : <>Commit Changes <ArrowRight size={18} /></>}
              </button>
            </form>
          )}
        </div>

        <p className="mt-12 text-center text-[9px] font-black uppercase tracking-[4px] text-slate-300">
          Secure Auth Protocol • SkillSync v4.2
        </p>
      </motion.div>
    </div>
  );
}
