'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, RefreshCcw } from 'lucide-react';
import { NeuralParticleField } from '@/components/ui/NeuralParticleField';

export default function AuthCodeError() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <NeuralParticleField />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[3rem] p-12 shadow-2xl relative z-10 border border-slate-100 text-center"
      >
        <div className="size-20 rounded-full bg-red-50 flex items-center justify-center text-red-600 mx-auto mb-8 shadow-inner">
          <AlertTriangle size={40} />
        </div>
        
        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-4">Login <span className="text-red-600">Failed</span></h2>
        
        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-8 leading-relaxed">
          The authentication code could not be verified by the core engine. This usually happens if the session expired or the redirect URL was misconfigured.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-[3px] text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
          >
            <RefreshCcw size={16} />
            Initialize Re-Link
          </button>
          
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-5 rounded-2xl bg-white text-slate-400 font-black uppercase tracking-[3px] text-[10px] border border-slate-100 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
          >
            <ArrowLeft size={16} />
            Back to Review Hub
          </button>
        </div>

        <div className="mt-10 pt-10 border-t border-slate-50">
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[2px]">Error Code: AUTH_SESSION_MISSING_OR_INVALID</p>
        </div>
      </motion.div>
    </div>
  );
}
