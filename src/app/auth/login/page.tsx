'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ShieldCheck, Briefcase, Zap, Info, ArrowRight, Mail, KeyRound, Fingerprint, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import AuthRoleCard from '@/components/auth/AuthRoleCard';
import GsapMagnetic from '@/components/ui/GsapMagnetic';
import { NeuralParticleField } from '@/components/ui/NeuralParticleField';

type AuthStep = 'role' | 'identity' | 'verify' | 'otp' | 'credentials' | 'success';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>('role');
  const [loading, setLoading] = useState(true); // Start loading to check session
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  
  // Identity State
  const [rollNo, setRollNo] = useState('');
  const [studentData, setStudentData] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // New: for registration
  const [otp, setOtp] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login'); // New: unified mode
  const [companies, setCompanies] = useState<any[]>([]); // New: for directory
  const [fetchingCompanies, setFetchingCompanies] = useState(false);

  // ✅ DIRECT ACCESS GUARD
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // If already logged in, redirect to dashboard
          router.push('/dashboard');
        } else {
          // No session — show the login UI
          setLoading(false);
        }
      } catch {
        // On error, still show the login UI
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);


  // ✅ FETCH REGISTERED COMPANIES
  useEffect(() => {
    if (selectedRole === 'company' && authMode === 'login' && companies.length === 0) {
      const fetchCompanies = async () => {
        setFetchingCompanies(true);
        try {
          const res = await fetch('/api/auth/directory/companies');
          const data = await res.json();
          if (data.success) {
            setCompanies(data.companies);
          }
        } catch (e) {
          console.error('Failed to fetch corporate directory');
        } finally {
          setFetchingCompanies(false);
        }
      };
      fetchCompanies();
    }
  }, [selectedRole, authMode, companies.length]);

  const roles = [
    {
      id: 'student',
      title: 'Student Portal',
      description: 'Access internships, track applications, and manage your skills profile.',
      icon: GraduationCap,
      href: '/dashboard',
      tag: 'Candidate'
    },
    {
      id: 'admin',
      title: 'College Admin',
      description: 'Monitor placement metrics, approve companies, and analyze performance.',
      icon: ShieldCheck,
      href: '/admin',
      tag: 'Authority'
    },
    {
      id: 'company',
      title: 'Company Hub',
      description: 'Find top talent, post requirements, and review matched profiles.',
      icon: Briefcase,
      href: '/company',
      tag: 'Partner'
    }
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setAuthMode('login'); // Default to login on role switch
    if (roleId === 'student') {
      setStep('identity');
    } else {
      setStep('credentials');
    }
  };

  const handleCredentialsAuth = async () => {
    if (!email || !password) return toast.error('Email and Password required');
    if (authMode === 'signup' && !name) return toast.error('Full Name required for registration');
    
    setLoading(true);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else {
        // Sign Up via API
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, type: selectedRole })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        
        // After signup, automatically sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      }

      toast.success(authMode === 'login' ? 'Access Granted • Opening Dashboard' : 'Account Created • Opening Dashboard');
      setStep('success');
      
      const redirectMap: Record<string, string> = {
        admin: '/admin',
        company: '/company',
        student: '/dashboard',
      };
      setTimeout(() => {
        window.location.href = redirectMap[selectedRole || ''] || '/dashboard';
      }, 1500);

    } catch (error: any) {
      const displayError = error.message || 'Authentication Failed. Please contact the Placement Cell.';
      toast.error(displayError);
    } finally {
      setLoading(false);
    }
  };

  const handleIdentityLookup = async () => {
    if (!rollNo) return toast.error('Enter your Roll Number');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/directory/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: rollNo })
      });

      const data = await res.json();
      if (data.success) {
        setStudentData(data.student);
        setStep('verify');
      } else {
        toast.error(data.error || 'Student record not found in verified institutional batch.');
      }
    } catch (e) {
      toast.error('Identity server reached a connectivity limit.');
    } finally {
      setLoading(false);
    }
  };

  const [devOtp, setDevOtp] = useState<string | null>(null);

  const handleSendOTP = async () => {
      if (!email) return toast.error('Email required for verification');
      setLoading(true);

      try {
          const res = await fetch('/api/auth/otp/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ roll_no: rollNo, email })
          });

          const data = await res.json();
          if (data.success) {
              // Auto-fill OTP from response (Auth Mode)
              if (data.otp_code) {
                  setOtp(data.otp_code);
                  setDevOtp(data.otp_code);
              }
              setStep('otp');
              toast.success('Verification code generated successfully.');
          } else {
              toast.error(data.error || 'Failed to generate verification session.');
          }
      } catch (e) {
          toast.error('Failed to dispatch verification code. Please check your connection.');
      } finally {
          setLoading(false);
      }
  };

  const handleVerifyOTP = async () => {
      if (otp.length < 6) return toast.error('Enter valid 6-digit code');
      setLoading(true);

      try {
          const res = await fetch('/api/auth/otp/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ roll_no: rollNo, email, otp })
          });

          const data = await res.json();
          if (data.success) {
              // Permanent Handshake: Sign in with the forced credential
              const { error: signInError } = await supabase.auth.signInWithPassword({
                  email: data.email,
                  password: data.sync_password
              });

              if (signInError) throw signInError;

              toast.success('Identity Verified Successfully');
              setStep('success');
              
              // Force hard redirect to clear middleware cache
              setTimeout(() => {
                  window.location.href = '/dashboard';
              }, 1500);
          } else {
              toast.error(data.error || 'Verification encountered an inconsistency.');
          }
      } catch (e: any) {
          toast.error(e.message || 'Identity verification failed.');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <NeuralParticleField />
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(234,88,12,0.03),transparent_50%)] -z-10" />

      {loading && step === 'role' ? (
        <div className="flex flex-col items-center gap-4 animate-pulse relative z-10">
          <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Authenticating Identity...</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl relative z-10"
        >
        <div className="text-center mb-16">
          <GsapMagnetic>
            <Link href="/">
              <div className="inline-flex size-14 rounded-2xl bg-slate-900 text-white items-center justify-center shadow-lg shadow-slate-950/20 mb-10 cursor-pointer">
                <Zap size={28} />
              </div>
            </Link>
          </GsapMagnetic>
          
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4 uppercase">
            {step === 'role' ? 'Login Hub' : 'DBMS Project Access'}
          </h1>
          <p className="text-slate-400 font-black uppercase tracking-[5px] text-[10px]">
             {step === 'role' ? 'Secure Login • Select your Role' : 'Verified Access Protocol'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'role' && (
            <motion.div 
              key="role"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid md:grid-cols-3 gap-8 mb-16"
            >
              {roles.map((role) => (
                <AuthRoleCard
                  key={role.id}
                  role={role}
                  isSelected={selectedRole === role.id}
                  onSelect={() => handleRoleSelect(role.id)}
                  onAuth={() => handleRoleSelect(role.id)}
                  loading={loading && selectedRole === role.id}
                  type={authMode}
                />
              ))}
            </motion.div>
          )}

          {step === 'identity' && (
            <motion.div 
              key="identity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto bg-white rounded-3xl p-10 shadow-xl shadow-slate-200 border border-slate-100"
            >
               <div className="mb-8 flex justify-center">
                  <div className="size-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Fingerprint size={32} />
                  </div>
               </div>
               <h2 className="text-2xl font-black text-slate-900 text-center mb-2">Identify Yourself</h2>
               <p className="text-slate-500 text-center text-sm mb-10 uppercase tracking-widest font-bold">Step 01: Identification</p>
               
               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Student Roll Number</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 24/70001"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                  
                  <button 
                    disabled={loading}
                    onClick={handleIdentityLookup}
                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-amber-600 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <>Verify Profile <ArrowRight size={18} /></>}
                  </button>
                  
                  <button onClick={() => setStep('role')} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">
                    Go Back
                  </button>
               </div>
            </motion.div>
          )}

          {step === 'verify' && (
            <motion.div 
              key="verify"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto bg-white rounded-3xl p-10 shadow-xl shadow-slate-200 border border-slate-100"
            >
               <div className="text-center mb-10">
                  <div className="size-20 rounded-full bg-green-50 text-green-600 mx-auto mb-6 flex items-center justify-center ring-8 ring-green-50/50">
                      <GraduationCap size={40} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">Hello, {studentData?.name}!</h2>
                  <p className="text-slate-500 text-sm italic">Verified {studentData?.course} student (Batch of {studentData?.batch_year})</p>
               </div>

               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Link your Email</label>
                    <div className="relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email" 
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>
                  
                  <button 
                    disabled={loading}
                    onClick={handleSendOTP}
                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-amber-600 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <>Request Secure OTP <KeyRound size={18} /></>}
                  </button>
               </div>
            </motion.div>
          )}

          {step === 'credentials' && (
            <motion.div 
              key="credentials"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto bg-white rounded-3xl p-10 shadow-xl shadow-slate-200 border border-slate-100"
            >
               <div className="mb-8 flex flex-col items-center">
                  <div className="size-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-6">
                      <KeyRound size={32} />
                  </div>
                  <div className="flex bg-slate-100/50 p-1.5 rounded-2xl">
                    <div className="px-8 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white text-slate-900 shadow-sm border border-slate-100">
                      Authorized Access
                    </div>
                  </div>
               </div>
               
               <h2 className="text-2xl font-black text-slate-900 text-center mb-2 uppercase tracking-tighter">
                 {authMode === 'login' ? 'Secure Login' : 'Create Account'}
               </h2>
               <p className="text-slate-500 text-center text-[10px] mb-10 uppercase tracking-[3px] font-bold">
                 {authMode === 'login' ? `Authorized ${selectedRole} Access Only` : `${selectedRole} Registration`}
               </p>
               
               <div className="space-y-6">
                  {authMode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Full Name / Entity Name</label>
                      <input 
                        type="text" 
                        placeholder={selectedRole === 'company' ? 'e.g. Innovate Corp' : 'e.g. Dr. Adam Smith'}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                      />
                    </motion.div>
                  )}

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Email Address</label>
                    <input 
                      type="email" 
                      placeholder={selectedRole === 'admin' ? 'admin@institution.edu' : 'hiring@company.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                    />
                  </div>
                  <button 
                    disabled={loading}
                    onClick={handleCredentialsAuth}
                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-amber-600 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <>{authMode === 'login' ? 'Sign In' : 'Create Profile'} <ArrowRight size={18} /></>}
                  </button>
                  
                  {selectedRole === 'company' && authMode === 'login' && companies.length > 0 && (
                    <div className="pt-8 mt-8 border-t border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-6 text-center">Corporate Partners</p>
                      <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {companies.map((corp) => (
                           <button
                             key={corp.email}
                             onClick={() => {
                               setEmail(corp.email);
                               setPassword('company123456');
                               toast.success(`Identity Selected: ${corp.company_name}`);
                             }}
                             className="group p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-amber-500 transition-all text-left"
                           >
                             <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-black text-slate-900 uppercase truncate">{corp.company_name}</p>
                                <Zap size={10} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                             </div>
                             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{corp.industry}</p>
                           </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRole === 'admin' && authMode === 'login' && (
                    <div className="pt-8 mt-8 border-t border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 mb-6 text-center">Administrative Access Directory</p>
                      <div className="grid grid-cols-1 gap-4">
                         <button
                           onClick={() => {
                             setEmail('admin@skillsync.com');
                             setPassword('admin123456');
                             toast.success('Admin Profile Selected');
                           }}
                           className="group p-5 rounded-3xl border border-slate-900 bg-slate-900 text-white hover:bg-amber-600 hover:border-amber-600 transition-all text-left flex items-center justify-between shadow-xl"
                         >
                           <div>
                              <p className="text-[11px] font-black uppercase tracking-[4px] mb-1">TNP Placement Officer</p>
                              <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest">Master Admin Account</p>
                           </div>
                           <ShieldCheck size={20} className="text-white/40 group-hover:text-white transition-opacity text-amber-500" />
                         </button>
                      </div>
                    </div>
                  )}

                  <button onClick={() => setStep('role')} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">
                    Switch Access Role
                  </button>
               </div>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div 
              key="otp"
              className="max-w-md mx-auto bg-white rounded-3xl p-10 shadow-xl shadow-slate-200 border border-slate-100"
            >
               <h2 className="text-2xl font-black text-slate-900 text-center mb-2">Enter Verification Code</h2>
               <p className="text-slate-500 text-center text-xs mb-6">Your verification code has been generated and auto-filled below.</p>
               
               {/* Verification Code Banner */}
               {devOtp && (
                 <div className="mb-6 p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center shadow-2xl relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 opacity-50" />
                   <div className="relative z-10">
                    <p className="text-[9px] font-black uppercase tracking-[5px] text-white/40 mb-3">Verification Code</p>
                    <p className="text-4xl font-black tracking-[10px] text-white group-hover:scale-110 transition-transform duration-500">{devOtp}</p>
                   </div>
                 </div>
               )}
               
               <div className="space-y-8">
                  <div className="flex justify-center">
                    <input 
                      type="text" 
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      className="w-full h-20 text-center text-4xl font-black tracking-[12px] bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                  
                  <button 
                    disabled={loading || otp.length < 6}
                    onClick={handleVerifyOTP}
                    className="w-full h-14 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-900 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Complete Login'}
                  </button>
               </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
               <div className="size-24 rounded-full bg-green-500 text-white mx-auto mb-8 flex items-center justify-center shadow-lg shadow-green-200">
                  <Zap size={40} />
               </div>
               <h2 className="text-4xl font-black text-slate-900 mb-4 uppercase">Success</h2>
               <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Opening Your Dashboard...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-20 pt-10 border-t border-slate-100 text-center">
          <p className="text-slate-300 text-[9px] font-black uppercase tracking-[4px]">
             DBMS Project Auth Protocol • Secured Access
          </p>
        </div>
      </motion.div>
    )}
  </div>
);
}
