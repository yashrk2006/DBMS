'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Building2, GraduationCap, MapPin, Briefcase, Calendar, Sparkles, Zap } from 'lucide-react';
import { NeuralParticleField } from '@/components/ui/NeuralParticleField';

function CompleteProfileContent() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'student' | 'company' | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Student Fields
  const [studentData, setStudentData] = useState({
    college: '',
    branch: '',
    graduation_year: new Date().getFullYear() + 2
  });

  // Company Fields
  const [companyData, setCompanyData] = useState({
    industry: '',
    location: '',
    company_name: ''
  });

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      setSession(session);
      
      // Role Detection Logic: 
      // 1. Query Param (from callback)
      // 2. User Metadata (from previous sessions)
      // 3. Fallback to student
      const urlRole = searchParams.get('role') as any;
      const metaRole = session.user.user_metadata?.role;
      const finalRole = urlRole || metaRole || 'student';
      
      setRole(finalRole);

      // Security Check: Existing persona detection
      const { data: isStudent } = await supabase.from('student').select('student_id').eq('student_id', session.user.id).single();
      const { data: isCompany } = await supabase.from('company').select('company_name').eq('company_id', session.user.id).single();
      const { data: isAdmin } = await supabase.from('admin').select('admin_id').eq('admin_id', session.user.id).single();

      if (isAdmin) {
          router.push('/admin');
          return;
      }

      // If already has profile, redirect to respective dashboard
      if (isStudent && finalRole === 'student') { router.push('/dashboard'); return; }
      if (isCompany && finalRole === 'company') { router.push('/company'); return; }

      setLoading(false);
    }
    checkAuth();
  }, [router, searchParams]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompleting(true);

    try {
      if (role === 'student') {
        const fullName = session.user.user_metadata.full_name || session.user.email?.split('@')[0];
        
        // 1. Insert into Student table
        const { error: dbError } = await supabase.from('student').insert({
          student_id: session.user.id,
          name: fullName,
          email: session.user.email!,
          college: studentData.college,
          branch: studentData.branch,
          graduation_year: studentData.graduation_year
        });
        if (dbError) throw dbError;

        // 2. Update Auth Metadata for RBAC persistence
        await supabase.auth.updateUser({
          data: { role: 'student', full_name: fullName }
        });

        toast.success('Profile Created');
        router.push('/dashboard');
      } else if (role === 'company') {
        // 1. Insert into Company table
        const { error: dbError } = await supabase.from('company').insert({
          company_id: session.user.id,
          company_name: companyData.company_name,
          email: session.user.email!,
          industry: companyData.industry,
          location: companyData.location
        });
        if (dbError) throw dbError;

        // 2. Update Auth Metadata
        await supabase.auth.updateUser({
          data: { role: 'company', full_name: companyData.company_name }
        });

        toast.success('Corporate Identity Activated');
        router.push('/company');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
        <NeuralParticleField />
        <div className="size-16 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin relative z-10" />
        <p className="mt-8 text-[11px] font-black uppercase tracking-[5px] text-white/40 animate-pulse relative z-10">Initializing Environment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <NeuralParticleField />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white rounded-[3rem] p-12 shadow-2xl relative z-10 border border-slate-100"
      >
        <div className="absolute top-0 left-0 w-full h-[10px] bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600" />
        
        <div className="flex items-center gap-4 mb-10">
          <div className="size-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm">
            {role === 'student' ? <GraduationCap size={24} /> : <Building2 size={24} />}
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Final <span className="text-amber-600">Verification</span></h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Complete your {role} profile</p>
          </div>
        </div>

        <form onSubmit={handleComplete} className="space-y-8">
          {role === 'student' ? (
            <>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 ml-5">Institutional Base (College)</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    value={studentData.college}
                    onChange={(e) => setStudentData(p => ({ ...p, college: e.target.value }))}
                    placeholder="e.g. Stanford University"
                    className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-2xl border-2 border-slate-50 focus:border-amber-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 ml-5">Academic Stream</label>
                  <div className="relative">
                    <Briefcase size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      value={studentData.branch}
                      onChange={(e) => setStudentData(p => ({ ...p, branch: e.target.value }))}
                      placeholder="Computer Science"
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-2xl border-2 border-slate-50 focus:border-amber-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 ml-5">Graduation Cycle</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="number"
                      value={studentData.graduation_year}
                      onChange={(e) => setStudentData(p => ({ ...p, graduation_year: parseInt(e.target.value) }))}
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-2xl border-2 border-slate-50 focus:border-amber-500 focus:bg-white outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 ml-5">Organizational Name</label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    value={companyData.company_name}
                    onChange={(e) => setCompanyData(p => ({ ...p, company_name: e.target.value }))}
                    placeholder="InnovateTech Inc."
                    className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-2xl border-2 border-slate-50 focus:border-amber-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 ml-5">Sector</label>
                  <div className="relative">
                    <Sparkles size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      value={companyData.industry}
                      onChange={(e) => setCompanyData(p => ({ ...p, industry: e.target.value }))}
                      placeholder="Artificial Intelligence"
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-2xl border-2 border-slate-50 focus:border-amber-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[3px] text-slate-400 ml-5">HQ Location</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      value={companyData.location}
                      onChange={(e) => setCompanyData(p => ({ ...p, location: e.target.value }))}
                      placeholder="Silicon Valley, CA"
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-2xl border-2 border-slate-50 focus:border-amber-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={completing}
            className="w-full py-6 rounded-3xl bg-slate-900 text-white font-black uppercase tracking-[5px] text-xs shadow-2xl shadow-slate-900/20 hover:bg-amber-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-4"
          >
            {completing ? (
              <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Zap size={18} className="fill-white" />
                Initialize Ecosystem
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function CompleteProfile() {
  return (
    <Suspense fallback={null}>
      <CompleteProfileContent />
    </Suspense>
  );
}

