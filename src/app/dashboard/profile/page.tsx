'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  User, 
  School, 
  MapPin, 
  GraduationCap, 
  FileText, 
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState({ name: '', college: '', branch: '', graduation_year: '', resume_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user || { id: '00000000-0000-0000-0000-000000000000', email: 'demo@student.com' };
      setUserId(user.id);
      const { data } = await supabase.from('student').select('*').eq('student_id', user.id).single();
      if (data) {
        setProfile({
          name: data.name ?? '',
          college: data.college ?? '',
          branch: data.branch ?? '',
          graduation_year: data.graduation_year?.toString() ?? '',
          resume_url: data.resume_url ?? '',
        });
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('student').update({
      name: profile.name,
      college: profile.college,
      branch: profile.branch,
      graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : null,
      resume_url: profile.resume_url || null,
    }).eq('student_id', userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-indigo-600"
      >
        <User size={40} fill="currentColor" />
      </motion.div>
      <p className="text-slate-500 font-medium">Loading your profile...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-48 rounded-3xl bg-gradient-to-r from-indigo-600 to-indigo-400 overflow-hidden shadow-xl shadow-indigo-100"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
           <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="absolute -bottom-12 left-8 flex items-end gap-6">
           <div className="w-32 h-32 rounded-3xl bg-white p-1.5 shadow-2xl relative group cursor-pointer">
              <div className="w-full h-full rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400 overflow-hidden">
                 <User size={64} />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white">
                 <Camera size={24} />
              </div>
           </div>
           <div className="pb-14">
              <h1 className="text-white text-3xl font-display font-black tracking-tight flex items-center gap-3">
                {profile.name || 'Set Your Name'}
                <Sparkles size={20} className="text-indigo-200" />
              </h1>
              <p className="text-indigo-100 font-semibold flex items-center gap-1.5">
                <School size={16} />
                {profile.college || 'College not set'}
              </p>
           </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
        {/* Left Column: Summary */}
        <div className="space-y-6">
           <Card className="border-none shadow-md bg-white">
              <CardHeader className="pb-2">
                 <CardTitle className="text-sm uppercase tracking-widest text-slate-400 font-black">Profile Strength</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-end justify-between">
                    <span className="text-3xl font-display font-black text-slate-900">85%</span>
                    <Badge variant="success">Great Start!</Badge>
                 </div>
                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                 </div>
                 <p className="text-xs text-slate-500 font-medium leading-relaxed">
                   Completely filling your profile increases your chances of getting matched by <span className="text-indigo-600 font-bold">3x</span>.
                 </p>
              </CardContent>
           </Card>

           <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100 space-y-3">
              <h3 className="text-indigo-900 font-bold text-sm flex items-center gap-2">
                 <AlertCircle size={16} className="text-indigo-500" />
                 Pro Tip
              </h3>
              <p className="text-xs text-indigo-700/80 font-medium leading-loose">
                Make sure your Resume URL is public so recruiters can view it immediately. 
              </p>
           </div>
        </div>

        {/* Right Column: Form */}
        <div className="md:col-span-2">
          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-6">
              <CardTitle className="text-xl font-display font-bold text-slate-900 tracking-tight">Personal Details</CardTitle>
              <CardDescription>Update your information to receive better internship recommendations.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={saveProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <User size={14} className="text-indigo-500" /> Full Name
                  </label>
                  <input 
                    id="profile-name" 
                    type="text" 
                    value={profile.name} 
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} 
                    placeholder="e.g. Rahul Sharma" 
                    className="w-full h-12 px-4 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <School size={14} className="text-indigo-500" /> University / College
                    </label>
                    <input 
                      id="profile-college" 
                      type="text" 
                      value={profile.college} 
                      onChange={e => setProfile(p => ({ ...p, college: e.target.value }))} 
                      placeholder="e.g. IIT Delhi" 
                      className="w-full h-12 px-4 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <GraduationCap size={14} className="text-indigo-500" /> Graduation Year
                    </label>
                    <input 
                      id="profile-grad-year" 
                      type="number" 
                      value={profile.graduation_year} 
                      onChange={e => setProfile(p => ({ ...p, graduation_year: e.target.value }))} 
                      placeholder="e.g. 2026" 
                      min="2020" 
                      max="2035" 
                      className="w-full h-12 px-4 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={14} className="text-indigo-500" /> Branch of Study
                  </label>
                  <input 
                    id="profile-branch" 
                    type="text" 
                    value={profile.branch} 
                    onChange={e => setProfile(p => ({ ...p, branch: e.target.value }))} 
                    placeholder="e.g. Computer Science Engineering" 
                    className="w-full h-12 px-4 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} className="text-indigo-500" /> Resume Portfolio Link
                  </label>
                  <div className="relative">
                    <input 
                      id="profile-resume" 
                      type="url" 
                      value={profile.resume_url} 
                      onChange={e => setProfile(p => ({ ...p, resume_url: e.target.value }))} 
                      placeholder="https://drive.google.com/..." 
                      className="w-full h-12 pl-4 pr-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                    />
                    <div className="absolute right-4 top-3.5 text-slate-400">
                       <FileText size={18} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">PRO TIP: Use a link from Google Drive or Notion</p>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={saved ? 'saved' : 'save'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Button 
                      id="save-profile-btn" 
                      type="submit" 
                      disabled={saving} 
                      className={cn(
                        "w-full h-14 rounded-2xl text-lg font-black tracking-tight gap-3 shadow-xl transition-all duration-300",
                        saved ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                      )}
                    >
                      {saving ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Save size={20} /></motion.div>
                      ) : saved ? (
                        <><CheckCircle2 size={20} /> Changes Secured!</>
                      ) : (
                        <><Save size={20} /> Update My Profile</>
                      )}
                    </Button>
                  </motion.div>
                </AnimatePresence>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
