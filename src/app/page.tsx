'use client';

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  Globe, 
  Cpu, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Terminal,
  Activity,
  ChevronRight,
  Database,
  Layers,
  Sparkles,
  Command,
  Box
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { DBMSNetworkHUD } from "@/components/ui/DBMSNetworkHUD";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    setIsClient(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start end", "end start"]
  });

  const rotateXHero = useTransform(scrollYProgress, [0, 0.2], [5, 20]);
  const rotateYHero = useTransform(scrollYProgress, [0, 0.2], [0, -15]);
  const translateZHero = useTransform(scrollYProgress, [0, 0.2], [0, 100]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  const rotateX = useTransform(scrollYProgress, [0.3, 0.6], [20, 0]);
  const scale = useTransform(scrollYProgress, [0.3, 0.6], [0.8, 1]);
  const perspective = useTransform(scrollYProgress, [0, 1], [1200, 2400]);

  const features = [
    {
      title: "Modern Tech",
      description: "Built on the latest React and server action patterns for lightning fast user experiences.",
      icon: <Cpu className="size-6" />,
      subtitle: "FEATURE_01"
    },
    {
      title: "Seamless Experience",
      description: "Advanced streaming and performance optimization for a seamless student dashboard.",
      icon: <Layers className="size-6" />,
      subtitle: "FEATURE_02"
    },
    {
      title: "Interactive UI",
      description: "Beautiful, responsive interfaces designed for the modern database professional.",
      icon: <Box className="size-6" />,
      subtitle: "FEATURE_03"
    },
    {
      title: "Global Reach",
      description: "Our platform helps you sync your expertise with roles from top companies worldwide.",
      icon: <Globe className="size-6" />,
      subtitle: "FEATURE_04"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Career Assessment",
      description: "Build your student profile and highlight your core technical skills.",
      status: "COMPLETED"
    },
    {
      number: "02",
      title: "Smart Job Matching",
      description: "Our platform identifies the best internship and job opportunities for you.",
      status: "ACTIVE"
    },
    {
      number: "03",
      title: "Direct Applications",
      description: "Apply with a single click and land a role at your dream tech team.",
      status: "PENDING"
    }
  ];

  const stats = [
    { label: "Active Students", value: "854", icon: <Globe className="size-4" /> },
    { label: "Skills Synced", value: "12,450", icon: <Activity className="size-4" /> },
    { label: "Real Jobs", value: "480", icon: <Zap className="size-4" /> },
    { label: "Success Rate", value: "99.9%", icon: <CheckCircle2 className="size-4" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen selection:bg-amber-500/30 text-slate-900 bg-white selection:text-white">
      <Navbar />
      
      {/* DBMS Background Overlay */}
      {mounted && <DBMSNetworkHUD progress={scrollYProgress} range={[0.15, 0.4]} />}

      <main className="flex-grow pt-32">
        {/* --- HERO SECTION --- */}
        <section className="relative min-h-[110vh] flex flex-col items-center justify-center px-6 overflow-hidden perspective-[2000px]">
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.08),_transparent_70%)] blur-[120px]" />
             <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20200%20200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.65%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%20opacity%3D%220.4%22%2F%3E%3C%2Fsvg%3E')] opacity-20 pointer-events-none" />
             
             {/* Floating Orbs for Depth */}
             <div className="absolute inset-0 z-0">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      y: [0, -40, 0], 
                      rotate: [0, 180, 360],
                      scale: [1, 1.1, 1] 
                    }}
                    transition={{ 
                      duration: 8 + i * 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className="absolute size-32 rounded-full border border-slate-100 bg-slate-50/20 backdrop-blur-sm shadow-xl"
                    style={{ 
                      left: `${15 + i * 15}%`, 
                      top: `${20 + (i % 3) * 20}%`,
                      opacity: 0.3
                    }}
                  />
                ))}
             </div>
          </div>

          <motion.div 
            style={{ 
              rotateX: rotateXHero, 
              rotateY: rotateYHero, 
              translateZ: translateZHero,
              opacity: opacityHero
            }}
            className="max-w-6xl mx-auto text-center relative z-20"
          >
            <AnimatedSection delay={0.2}>
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-2xl bg-slate-950 border border-white/10 mb-10 shadow-[var(--soft-shadow)] backdrop-blur-xl">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-[10px] text-white font-bold uppercase tracking-[6px]">
                  Now Live: PLATFORM v2.0
                </span>
              </div>

              <h1 className="text-[clamp(1.5rem,10vw,12rem)] font-black text-slate-950 uppercase tracking-tighter mb-6 md:mb-10 leading-[0.85] md:leading-[0.75] italic">
                SYNC SKILLS. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 not-italic">GET HIRED.</span>
              </h1>

              <p className="text-slate-500 text-lg md:text-3xl font-bold max-w-4xl mx-auto mb-10 md:mb-16 leading-snug md:leading-[1.1] tracking-tighter px-4">
                The smart <span className="text-slate-900 border-b-4 md:border-b-8 border-amber-500/30">Career Path</span>. 
                Seamlessly match your <span className="italic text-amber-600 font-black">Skills</span> to real roles from the DBMS core system.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 w-full max-w-lg mx-auto md:max-w-none">
                <Link
                  href="/auth/login"
                  className="w-full sm:w-auto px-16 md:px-24 py-6 md:py-8 rounded-[2rem] md:rounded-[3rem] bg-slate-950 text-white text-[11px] font-bold uppercase tracking-[6px] shadow-[var(--soft-shadow)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4 md:gap-6 group"
                >
                  Enter Platform
                  <Zap size={18}  className="fill-amber-500 text-amber-500 group-hover:rotate-12 transition-transform duration-500" />
                </Link>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto px-10 md:px-20 py-5 md:py-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-white border border-slate-200 text-slate-950 text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] hover:bg-slate-50 hover:border-amber-500 transition-all flex items-center justify-center gap-4 md:gap-6 group shadow-2xl"
                >
                  Explore Features
                  <Box size={18}  className="group-hover:translate-x-3 transition-transform duration-500" />
                </button>
              </div>
            </AnimatedSection>
          </motion.div>

          {/* Platform Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 100, rotateX: 45 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 10 }}
            viewport={{ once: true }}
            className="mt-32 relative w-full max-w-7xl px-10 group"
          >
             <div className="absolute inset-0 bg-amber-500/20 blur-[150px] opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="w-full aspect-[21/9] rounded-[4rem] bg-slate-950 border border-white/5 shadow-[0_150px_150px_-70px_rgba(0,0,0,0.2)] p-1 overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop')] bg-cover opacity-20 pointer-events-none group-hover:scale-105 transition-transform duration-[2000ms]" />
                <div className="relative h-full w-full bg-slate-950/80 backdrop-blur-3xl rounded-[3.8rem] border border-white/10 p-16 flex flex-col justify-between overflow-hidden">
                    <div className="flex justify-between items-start">
                       <div className="space-y-4">
                          <div className="flex items-center gap-2">
                             <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                             <span className="text-[10px] font-black text-amber-500 tracking-[0.6em] uppercase">SYSTEM ONLINE</span>
                          </div>
                          <div className="text-6xl font-black text-white tracking-tighter uppercase leading-none italic">Career <br /> Hub v2.</div>
                       </div>
                       <div className="size-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-white backdrop-blur-xl group-hover:bg-amber-600 transition-colors">
                          <CheckCircle2 size={40} />
                       </div>
                    </div>
                   
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                       {[
                         { label: 'Latency', value: '4ms', color: 'text-amber-500' },
                         { label: 'Accuracy', value: '98.5%', color: 'text-white' },
                         { label: 'Uptime', value: '99.99%', color: 'text-white' },
                         { label: 'Active Students', value: '12,042', color: 'text-emerald-500' }
                       ].map((stat, i) => (
                         <div key={stat.label} className="h-32 md:h-48 rounded-[1.5rem] md:rounded-[2.5rem] bg-white/5 border border-white/5 p-4 md:p-8 flex flex-col justify-end group/item hover:bg-white/10 transition-colors">
                            <div className={`text-xl md:text-4xl font-black ${stat.color} mb-1 md:mb-2 tracking-tighter`}>{stat.value}</div>
                            <div className="text-[7px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">{stat.label}</div>
                         </div>
                       ))}
                   </div>
                </div>
             </div>
          </motion.div>
        </section>

        {/* --- TECHNOLOGY BELT --- */}
        <section className="py-24 border-y border-slate-100 bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
            <motion.div 
               animate={{ x: [0, -1000] }}
               transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
               className="flex items-center gap-24 whitespace-nowrap px-12"
            >
               {[...Array(20)].map((_, i) => (
                  <div key={i} className="flex items-center gap-8 group">
                     <span className="text-8xl font-black text-slate-200/50 uppercase tracking-tighter group-hover:text-amber-600 transition-colors">
                        {['Next.js 15', 'React 19', 'Three.js', 'Framer Motion', 'WebGPU', 'Rust', 'TypeScript', 'Node.js'][i % 8]}
                     </span>
                     <div className="size-4 rounded-full bg-amber-500" />
                  </div>
               ))}
            </motion.div>
        </section>

        {/* --- STATS BAR --- */}
        <section id="stats" className="border-y border-slate-100 bg-slate-50/50 py-16">
            <div className="max-w-7xl mx-auto px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center">
                            <div className="flex items-center gap-3 mb-3 text-amber-600">
                                {stat.icon}
                                <span className="text-[9px] uppercase font-black tracking-[0.4em] text-slate-400">{stat.label}</span>
                            </div>
                            <span className="text-4xl md:text-6xl font-black text-slate-950 tracking-tighter leading-none italic">
                                {stat.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* --- FEATURES --- */}
        <section id="features" ref={scrollRef} className="py-40 px-6 relative overflow-hidden bg-slate-950">
          <div className="absolute inset-0 opacity-10">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(217,119,6,0.2),_transparent_50%)]" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <AnimatedSection className="text-center mb-32" direction="up">
              <h2 className="text-[10px] font-black uppercase tracking-[0.8em] text-amber-500 mb-8">
                Career Discovery
              </h2>
              <h3 className="text-5xl md:text-[7rem] font-black text-white uppercase tracking-tighter leading-[0.8] mb-12">
                Designed for <br /><span className="text-amber-500 italic">Today's Students</span>
              </h3>
            </AnimatedSection>

            <motion.div 
               style={{ rotateX, scale, perspective }}
               className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10"
            >
              {features.map((feature, idx) => (
                <div 
                  key={idx} 
                  className="group relative p-1 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent border border-white/5 backdrop-blur-xl transition-all duration-500 hover:scale-105 hover:-translate-y-4"
                >
                   <div className="p-10 flex flex-col h-full bg-slate-900 rounded-[2.3rem] border border-white/5">
                      <div className="size-16 rounded-3xl bg-amber-600 flex items-center justify-center text-white mb-10 shadow-2xl shadow-amber-600/20 group-hover:rotate-12 transition-transform duration-500">
                         {feature.icon}
                      </div>
                      <div className="text-[8px] font-black text-amber-500 uppercase tracking-[0.4em] mb-4">{feature.subtitle}</div>
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 group-hover:text-amber-400 transition-colors">{feature.title}</h4>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed uppercase tracking-tight">
                        {feature.description}
                      </p>
                   </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* --- SKILL VISUALIZATION --- */}
        <section className="py-40 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                <div className="relative aspect-square scale-110">
                   <div className="absolute inset-0 bg-amber-500/10 blur-[120px] rounded-full animate-pulse" />
                   <div className="relative size-full p-12 flex items-center justify-center">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-[0.5px] border-slate-100 rounded-full border-dashed"
                        />
                        <motion.div 
                          animate={{ rotate: -360 }}
                          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-20 border-[0.5px] border-slate-200 rounded-full border-dashed"
                        />
                        
                        {/* Profile Nodes */}
                        <div className="relative z-10 grid grid-cols-3 gap-8">
                            {[...Array(9)].map((_, i) => (
                              <motion.div
                                key={i}
                                whileHover={{ scale: 1.2, backgroundColor: '#f59e0b' }}
                                className="size-20 rounded-2xl bg-slate-950 flex items-center justify-center text-white shadow-2xl transition-colors cursor-crosshair group-node"
                              >
                                 <Cpu size={24} className={i === 4 ? 'text-amber-500 font-bold' : ''} />
                              </motion.div>
                            ))}
                        </div>

                        {/* Connection Lines (SVG) */}
                        <svg className="absolute inset-0 size-full pointer-events-none opacity-20">
                            <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#e2e8f0" strokeWidth="1" />
                            <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#e2e8f0" strokeWidth="1" />
                            <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="5 5" />
                        </svg>
                   </div>
                </div>

                <div className="space-y-12">
                   <div>
                      <h2 className="text-[11px] font-black uppercase tracking-[0.8em] text-amber-600 mb-8">Smart Review</h2>
                      <h3 className="text-5xl md:text-8xl font-black text-slate-900 uppercase tracking-tighter leading-[0.8] mb-12">
                         The Smart <br />
                         <span className="italic text-amber-600">Career Path.</span>
                      </h3>
                      <p className="text-slate-500 text-xl font-bold leading-relaxed max-w-xl italic">
                         Our system reviews your skills and maps your expertise to real company roles. 
                         Get matched with roles that fit your <span className="text-slate-900 border-b-4 border-amber-500/20">Skill Profile</span>.
                      </p>
                   </div>
                   <div className="flex gap-12">
                      <div>
                         <div className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">12K+</div>
                         <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Job Data Points</div>
                      </div>
                      <div className="h-16 w-px bg-slate-100" />
                      <div>
                         <div className="text-5xl font-black text-slate-900 mb-2 tracking-tighter">&lt;0.1s</div>
                         <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Matching Latency</div>
                      </div>
                   </div>
                </div>
            </div>
        </section>

        {/* --- WORKFLOW --- */}
        <section id="how-it-works" className="py-40 px-6 bg-white relative">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                <div>
                   <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-amber-600 mb-8">
                      Simple Workflow
                   </h2>
                   <h3 className="text-5xl md:text-8xl font-black text-slate-900 uppercase tracking-tighter leading-[0.85] mb-12">
                      Your Career, <br /> Simplified.
                   </h3>
                   <p className="text-slate-500 text-xl font-bold mb-16 leading-relaxed max-w-xl">
                      We've simplified the job hunt process. Just upload your resume, sync your skills, and get matched with  
                      your dream roles within <span className="text-slate-950 font-black italic underline decoration-amber-500">72 hours</span>.
                   </p>
                </div>
                <div className="space-y-10">
                    {steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-8 group">
                            <span className="text-6xl font-black text-slate-100 group-hover:text-amber-600/20 transition-colors leading-none">{step.number}</span>
                            <div className="flex flex-col pt-1">
                                <h4 className="text-slate-950 font-black text-xl uppercase tracking-tighter mb-2">{step.title}</h4>
                                <p className="text-slate-400 text-sm font-semibold uppercase tracking-tight leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
              </div>

              <div className="relative aspect-square">
                 <div className="absolute inset-0 bg-amber-600/5 blur-[150px] animate-pulse rounded-full" />
                 <div className="w-full h-full rounded-[4rem] p-1 shadow-2xl relative overflow-hidden group bg-slate-950">
                    <div className="h-full w-full bg-slate-950 rounded-[3.8rem] border border-white/5 p-16 flex flex-col justify-center gap-10 font-mono text-xs overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-150 transition-transform duration-1000 rotate-12">
                           <Activity size={300} className="text-amber-500" />
                        </div>
                        
                        <div className="space-y-6 relative z-10">
                           <div className="flex gap-4">
                              <span className="text-amber-500 font-black">USERCONNECTED</span>
                              <span className="text-white/40">MATCHFOUND_100%</span>
                           </div>
                           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} whileInView={{ width: '100%' }} transition={{ duration: 2 }} className="h-full bg-amber-500" />
                           </div>
                           <div className="grid grid-cols-2 gap-4 mt-12">
                              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                                 <div className="text-[10px] text-white/50 font-black uppercase">Job Match</div>
                                 <div className="text-4xl font-black text-white italic">AA+</div>
                              </div>
                              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                                 <div className="text-[10px] text-white/50 font-black uppercase">Role Value</div>
                                 <div className="text-4xl font-black text-amber-500 italic">High</div>
                              </div>
                           </div>
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- STUDENT IMPACT --- */}
        <section className="py-60 px-6 bg-slate-950 relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(217,119,6,0.1),_transparent_50%)]" />
           <div className="max-w-7xl mx-auto relative z-10">
              <AnimatedSection className="text-center mb-32">
                 <h2 className="text-[11px] font-black uppercase tracking-[0.8em] text-amber-500 mb-8">What Students Say</h2>
                 <h3 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.8]">
                    Real Stories, <br /> <span className="italic text-amber-500">Real Success.</span>
                 </h3>
              </AnimatedSection>

              <div className="flex flex-col md:flex-row gap-12 perspective-[2000px] py-10 relative">
                 {[
                   { name: "Yash", role: "Software Developer", quote: "SkillSync made my transition from college to my career so much easier. The tools were amazing.", rating: 5 },
                   { name: "Student A", role: "Junior Analyst", quote: "I found my internship within 2 days of setting up my profile. Very efficient platform.", rating: 5 },
                   { name: "Student B", role: "Tech Lead", quote: "A must-have for every student. The interface is stunning and very intuitive.", rating: 5 }
                 ].map((t, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, rotateY: i % 2 === 0 ? -25 : 25, z: -200 }}
                     whileInView={{ opacity: 1, rotateY: 0, z: 0 }}
                     viewport={{ once: false, margin: "-100px" }}
                     transition={{ duration: 0.8, ease: "easeOut" }}
                     className="flex-1 min-w-[320px] group"
                   >
                        <div className="h-full p-10 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col justify-between hover:border-amber-500/50 transition-all duration-500 group-hover:bg-white/[0.08]">
                           <div className="space-y-6">
                              <div className="flex gap-1 text-amber-500">
                                 {[...Array(t.rating)].map((_, i) => <Sparkles key={i} size={12} fill="currentColor" />)}
                              </div>
                              <p className="text-xl font-bold text-white italic tracking-tight leading-relaxed">
                                 &quot;{t.quote}&quot;
                              </p>
                           </div>
                           <div className="pt-8 border-t border-white/5 mt-10">
                              <div className="text-white font-black uppercase text-sm tracking-tighter">{t.name}</div>
                              <div className="text-amber-500 font-black uppercase text-[9px] tracking-widest">{t.role}</div>
                           </div>
                        </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* --- CTA SECTION --- */}
        <section className="py-60 px-6 text-center relative overflow-hidden bg-white">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-[radial-gradient(circle_at_center,_rgba(217,119,6,0.05),_transparent_40%)]" />
          </div>

          <AnimatedSection className="max-w-5xl mx-auto relative z-10" direction="up">
            <h2 className="text-[clamp(3rem,8vw,9rem)] font-black text-slate-950 uppercase tracking-tighter leading-[0.8] mb-16">
                Start Your <br /> <span className="text-amber-600">Career.</span>
            </h2>
            <p className="text-slate-500 text-2xl md:text-3xl font-bold max-w-3xl mx-auto mb-20 leading-tight italic">
              Don't just code. Build your future with <span className="text-slate-900 underline decoration-amber-500 decoration-8">DBMS Project</span>.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
               <Link
                 href="/auth/login"
                 className="px-20 py-8 rounded-[2.5rem] bg-slate-950 text-white text-xs font-black uppercase tracking-[0.6em] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] hover:scale-110 active:scale-95 transition-all inline-flex items-center gap-6 group"
               >
                 Get Started
                 <Zap size={24} className="fill-amber-500 text-amber-500 group-hover:rotate-45 transition-transform" />
               </Link>
            </div>
          </AnimatedSection>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function BoxIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg 
      className={className} 
      width={size}
      height={size}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
    </svg>
  );
}
