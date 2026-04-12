'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ClipboardList, 
  Clock, 
  Search, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Zap,
  BarChart3,
  Terminal,
  Database,
  Trash2,
  ChevronRight,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Application {
  application_id: number;
  applied_date: string;
  status: 'Pending' | 'Under Review' | 'Interviewing' | 'Accepted' | 'Rejected';
  ai_match_score: number;
  internship: {
    title: string;
    duration: string | null;
    stipend: string | null;
    location: string | null;
    company: { company_name: string } | null;
  } | null;
}

// Status progression timeline steps
const PIPELINE_STEPS = ['Pending', 'Under Review', 'Interviewing', 'Accepted'] as const;

const statusConfig: Record<string, { color: string; glow: string; bg: string; border: string; icon: any; label: string }> = {
  'Pending':      { color: 'text-amber-600',  glow: 'shadow-amber-600/5',  bg: 'bg-amber-50',  border: 'border-amber-100',  icon: Clock,         label: 'PENDING REVIEW'   },
  'Under Review': { color: 'text-amber-600',  glow: 'shadow-amber-600/5',  bg: 'bg-amber-50',  border: 'border-amber-100',  icon: Search,        label: 'UNDER ASSESSMENT' },
  'Interviewing': { color: 'text-amber-700',  glow: 'shadow-amber-700/10', bg: 'bg-amber-100', border: 'border-amber-200',  icon: TrendingUp,    label: 'ACTIVE INTERVIEW' },
  'Accepted':     { color: 'text-emerald-700',glow: 'shadow-emerald-700/10',bg: 'bg-emerald-50',border: 'border-emerald-200',icon: CheckCircle2,  label: 'OFFER ACCEPTED'   },
  'Rejected':     { color: 'text-red-600',    glow: 'shadow-red-600/5',    bg: 'bg-red-50',    border: 'border-red-100',    icon: AlertCircle,   label: 'NOT SELECTED'     },
};

function PipelineTimeline({ status }: { status: string }) {
  if (status === 'Rejected') {
    return (
      <div className="flex items-center gap-2 mt-4">
        <XCircle size={13} className="text-red-400" />
        <span className="text-[10px] font-black text-red-400 uppercase tracking-[3px]">Application Closed</span>
      </div>
    );
  }
  const currentIndex = PIPELINE_STEPS.indexOf(status as any);
  return (
    <div className="flex items-center gap-1.5 md:gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
      {PIPELINE_STEPS.map((step, idx) => {
        const isDone = idx <= currentIndex;
        const isCurrent = idx === currentIndex;
        return (
          <div key={step} className="flex items-center gap-1.5 md:gap-2 shrink-0">
            <div className={`flex flex-col items-center gap-1`}>
              <div className={`size-2 md:size-2.5 rounded-full border-[1.5px] md:border-2 transition-all ${
                isDone
                  ? isCurrent
                    ? 'bg-amber-600 border-amber-600 shadow-[0_0_6px_rgba(217,119,6,0.4)]'
                    : 'bg-amber-400 border-amber-400'
                  : 'bg-white border-slate-200'
              }`} />
              <span className={`text-[6px] md:text-[7px] font-black uppercase tracking-wider whitespace-nowrap ${isDone ? 'text-amber-600' : 'text-slate-300'}`}>
                {step === 'Under Review' ? 'Review' : step}
              </span>
            </div>
            {idx < PIPELINE_STEPS.length - 1 && (
              <div className={`h-[1px] w-6 md:w-8 mb-2.5 md:mb-3 rounded-full ${isDone && idx < currentIndex ? 'bg-amber-400' : 'bg-slate-150'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      router.push('/auth/login');
      return;
    }

    try {
      const res = await fetch(`/api/application-submit?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setApps(data.data || []);
      }
    } catch (e) {
      console.error('Failed to load applications:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function withdrawApplication(application_id: number) {
    const isConfirmed = await new Promise<boolean>((resolve) => {
      const toastId = toast(
        (t) => (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-slate-900 font-sans">Withdraw this application?</p>
            <p className="text-xs text-slate-500 font-sans">This operation is permanent and cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => { toast.dismiss(toastId); resolve(true); }}
                className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all"
              >Confirm Withdrawal</button>
              <button
                onClick={() => { toast.dismiss(toastId); resolve(false); }}
                className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-xl active:scale-95 transition-all"
              >Cancel</button>
            </div>
          </div>
        ),
        { duration: 8000 }
      );
    });

    if (!isConfirmed) return;
    
    setWithdrawingId(application_id);
    try {
      const res = await fetch(`/api/application-submit?applicationId=${application_id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        setApps(prev => prev.filter(a => a.application_id !== application_id));
        toast.success('Application request retracted successfully.', { icon: '🗑️' });
      } else {
        toast.error(data.error || 'System failed to process withdrawal.');
      }
    } catch (e) {
      console.error('Withdraw rejection error:', e);
      toast.error('Network identity lost. Check connectivity.');
    } finally {
      setWithdrawingId(null);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-10">
      <motion.div 
        animate={{ rotate: 360, scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="text-amber-600"
      >
        <ClipboardList size={80} className="fill-amber-600/10" />
      </motion.div>
      <div className="text-center">
         <h2 className="text-xs font-black uppercase tracking-[12px] text-amber-600 mb-4">Loading Applications</h2>
         <p className="text-slate-500 text-[10px] font-black uppercase tracking-[6px] animate-pulse">Syncing Application Status &amp; Records</p>
      </div>
    </div>
  );

  // Quick stats derived from application data
  const totalApps = apps.length;
  const pending = apps.filter(a => a.status === 'Pending' || a.status === 'Under Review').length;
  const interviews = apps.filter(a => a.status === 'Interviewing').length;
  const accepted = apps.filter(a => a.status === 'Accepted').length;
  const rejected = apps.filter(a => a.status === 'Rejected').length;
  const successRate = totalApps > 0 ? Math.round((accepted / totalApps) * 100) : 0;

  return (
    <div className="space-y-16 pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 md:gap-12 pb-8 md:pb-12 border-b border-slate-200">
        <AnimatedSection direction="up" distance={40}>
          <div className="flex items-center gap-4 mb-4 md:mb-6">
             <div className="size-8 md:size-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                <BarChart3 size={16} md:size={18} className="animate-pulse" />
             </div>
             <h2 className="text-[8px] md:text-[10px] font-black uppercase tracking-[4px] md:tracking-[8px] text-slate-400">Application Tracker</h2>
          </div>
          <h1 className="text-3xl md:text-7xl font-black text-slate-950 tracking-tight uppercase leading-[1.1] md:leading-[0.9] mb-4 md:mb-6">
            My<br />
            <span className="text-amber-600">Applications.</span>
          </h1>
          <p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-[2px] md:tracking-[3px]">
            Comprehensive tracking of all active and past applications.
          </p>
        </AnimatedSection>

        {/* Status Summary Chips */}
        {apps.length > 0 && (
           <AnimatedSection direction="up" className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 md:gap-3" delay={0.2}>
             {[
               { label: 'Active', value: pending, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
               { label: 'Interviews', value: interviews, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
               { label: 'Offers', value: accepted, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
               { label: 'Rejected', value: rejected, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' },
               { label: 'Ratio', value: `${successRate}%`, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
             ].map(chip => (
               <div key={chip.label} className={`flex items-center justify-between sm:justify-start gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl border ${chip.bg} ${chip.border} shadow-sm`}>
                 <span className="text-[7px] md:text-[9px] font-black uppercase tracking-[2px] md:tracking-[3px] text-slate-400">{chip.label}</span>
                 <span className={`text-xs md:text-sm font-black ${chip.color}`}>{chip.value}</span>
               </div>
             ))}
          </AnimatedSection>
        )}
      </div>

      {apps.length === 0 ? (
         <AnimatedSection direction="up" className="p-32 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
            <div className="size-28 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center mx-auto mb-10 text-slate-200 shadow-sm">
               <Database size={48} className="animate-pulse" />
            </div>
            <h3 className="text-4xl font-black text-slate-950 uppercase tracking-tighter mb-6">No Applications Yet</h3>
            <p className="text-[11px] font-medium uppercase tracking-[4px] text-slate-400 max-w-md mx-auto leading-relaxed mb-12">
               Your application feed is currently empty. Start exploring opportunities to begin your career journey.
            </p>
            <Link href="/dashboard/internships">
               <button className="px-12 py-6 rounded-2xl bg-amber-600 text-white text-[11px] font-black uppercase tracking-[5px] shadow-lg shadow-amber-600/20 hover:bg-amber-500 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 mx-auto">
                 <Zap size={18} className="fill-white" />
                 Browse Internships
               </button>
            </Link>
         </AnimatedSection>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          <AnimatePresence mode="popLayout">
            {apps.map((app, index) => {
              const config = statusConfig[app.status] || statusConfig['Pending'];
              const isWithdrawable = app.status === 'Pending' || app.status === 'Under Review';
              return (
                <AnimatedSection key={app.application_id} delay={index * 0.05} direction="up">
                  <div className="group relative bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 hover:border-amber-200 transition-all duration-700 overflow-hidden p-6 md:p-10 shadow-sm hover:shadow-xl">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 md:gap-10">

                          <div className="flex flex-col sm:flex-row sm:items-start gap-4 md:gap-8 flex-1">
                             <div className={`size-12 md:size-16 rounded-xl md:rounded-2xl ${config.bg} border ${config.border} flex items-center justify-center transition-all duration-700 shadow-inner shrink-0 leading-none`}>
                                <config.icon size={20} md:size={24} className={config.color} />
                             </div>
                             
                             <div className="space-y-3 flex-1">
                                <div>
                                  <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-amber-600 transition-colors leading-none mb-2">
                                    {app.internship?.title ?? 'Internship Title'}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                     <div className="size-1.5 rounded-full bg-amber-500/30" />
                                     <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-[2px] md:tracking-[3px] text-slate-400">{app.internship?.company?.company_name ?? 'Company'}</span>
                                     <div className="px-2 md:px-3 py-1 rounded-full bg-black text-white text-[7px] md:text-[9px] font-black tracking-widest flex items-center gap-1.5 md:gap-2">
                                        <Zap size={8} md:size={10} className="text-amber-400 fill-amber-400" />
                                        {app.ai_match_score || 0}% MATCH
                                     </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-6 md:gap-x-8 gap-y-2 md:gap-y-3">
                                   {app.internship?.location && (
                                     <div className="flex items-center gap-2">
                                        <MapPin size={10} md:size={12} className="text-slate-300" />
                                        <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[1px] md:tracking-[2px]">{app.internship.location}</span>
                                     </div>
                                   )}
                                   {app.internship?.duration && (
                                     <div className="flex items-center gap-2">
                                        <Calendar size={10} md:size={12} className="text-slate-300" />
                                        <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[1px] md:tracking-[2px]">{app.internship.duration}</span>
                                     </div>
                                   )}
                                   {app.internship?.stipend && (
                                     <div className="flex items-center gap-2">
                                        <DollarSign size={10} md:size={12} className="text-amber-400" />
                                        <span className="text-[8px] md:text-[10px] font-black text-amber-600 uppercase tracking-[1px] md:tracking-[2px]">{app.internship.stipend}</span>
                                     </div>
                                   )}
                                </div>

                                <div className="overflow-x-auto pb-2 scrollbar-none">
                                    <PipelineTimeline status={app.status} />
                                </div>
                             </div>
                          </div>

                       <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 shrink-0 border-t md:border-t-0 border-slate-50 pt-6 md:pt-0 mt-2 md:mt-0">
                          {/* Status Badge */}
                          <div className={`flex items-center gap-3 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl border ${config.border} ${config.bg} shadow-sm ${config.glow} transition-all duration-500 group-hover:scale-105`}>
                             <config.icon size={13} md:size={15} className={`${config.color} animate-pulse`} />
                             <div className="flex flex-col">
                                <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-[2px] md:tracking-[3px] ${config.color}`}>{app.status}</span>
                                <span className="text-[6px] md:text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">{config.label}</span>
                             </div>
                          </div>

                         {/* Applied date */}
                         <div className="flex items-center gap-2 text-slate-300 font-mono">
                            <Terminal size={11} className="opacity-40" />
                            <span className="text-[9px] font-bold uppercase tracking-[2px] opacity-60">
                               Applied: {new Date(app.applied_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                            </span>
                         </div>

                         {/* Withdraw button — only for Pending/Under Review */}
                         {isWithdrawable && (
                           <button
                             onClick={() => withdrawApplication(app.application_id)}
                             disabled={withdrawingId === app.application_id}
                             className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-[3px] hover:bg-red-50 hover:border-red-200 active:scale-95 transition-all disabled:opacity-50"
                           >
                             {withdrawingId === app.application_id ? (
                               <div className="size-3 rounded-full border border-red-400 border-t-transparent animate-spin" />
                             ) : (
                               <Trash2 size={11} />
                             )}
                             Withdraw
                           </button>
                         )}
                      </div>
                    </div>

                    {/* Hover accent */}
                    <div className="absolute top-0 right-0 size-48 bg-amber-500/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  </div>
                </AnimatedSection>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
