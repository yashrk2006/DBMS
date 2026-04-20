'use client';

import { motion } from "framer-motion";
import { Database, Mail, Phone, BookOpen, ShieldCheck, Globe, Cpu, Network } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    { 
      title: "Solutions", 
      links: [
        { label: "Skill Matching", href: "#" }, 
        { label: "Career Progress", href: "/dashboard" }, 
        { label: "Student Profiles", href: "/dashboard" }, 
        { label: "Privacy First", href: "#" }
      ] 
    },
    { 
      title: "Community", 
      links: [
        { label: "About DBMS Project", href: "#" }, 
        { label: "Campus Jobs", href: "#" }, 
        { label: "Our Story", href: "#" }, 
        { label: "Support Team", href: "#" }
      ] 
    },
    { 
      title: "Resources", 
      links: [
        { label: "Student Help", href: "#" }, 
        { label: "API Access", href: "#" }, 
        { label: "Terms", href: "#" }, 
        { label: "Privacy", href: "#" }
      ] 
    },
  ];

  return (
    <footer className="bg-slate-50 pt-24 pb-12 border-t border-slate-200 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-5 gap-16 mb-20 relative z-10">
        {/* Brand Section */}
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-4 mb-8 group cursor-pointer inline-flex">
            <div className="size-12 rounded-2xl bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center shadow-md group-hover:bg-amber-600 group-hover:text-white transition-all duration-500">
              <Database size={24} className="group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-slate-950 text-3xl font-black leading-none tracking-tighter uppercase">DBMS</h2>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1">Sync Skills</span>
            </div>
          </Link>
          <p className="text-slate-600 text-sm max-w-sm mb-8 font-medium leading-relaxed">
            The modern way to manage your career, skill up, and find the perfect job match.
          </p>
          <div className="flex gap-5">
            {[Globe, Network, Cpu, ShieldCheck].map((IconComp, idx) => (
              <motion.div 
                key={idx} 
                whileHover={{ scale: 1.1, y: -2 }}
                className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer"
              >
                <IconComp size={18} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Links Grid */}
        {footerSections.map((col) => (
          <div key={col.title} className="flex flex-col gap-6">
            <h4 className="text-slate-900 font-black text-xs uppercase tracking-[0.3em] inline-flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-amber-500/40" />
              {col.title}
            </h4>
            <div className="flex flex-col gap-4">
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] hover:text-amber-600 hover:translate-x-2 transition-all duration-300 inline-block cursor-pointer"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Metadata */}
      <div className="max-w-7xl mx-auto px-8 pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
        <div className="flex flex-col gap-1">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            &copy; {currentYear} DBMS PROJECT // SMART RECRUITMENT
          </p>
          <p className="text-slate-400 text-[8px] font-mono tracking-widest uppercase">
            Edition: 2025 // Status: ACTIVE
          </p>
        </div>
        
        <div className="flex items-center gap-4 px-6 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500/40 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-amber-500" />
            </span>
            <span className="text-[10px] text-amber-600 uppercase font-black tracking-[0.5em] antialiased">
              System Syncing
            </span>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.4em]">
            Network: DBMS Sync Cloud
          </span>
        </div>
      </div>
    </footer>
  );
}
