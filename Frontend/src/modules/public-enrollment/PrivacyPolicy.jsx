import React from 'react';
import { MdArrowBack, MdSecurity, MdLock, MdShield } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-min-h-screen bg-slate-50 relative overflow-hidden font-inter selection:bg-blue-100 selection:text-blue-900">
      {/* Mesh Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-indigo-100 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-white/80 backdrop-blur-xl shadow-2xl border border-white/50 mb-4 animate-in zoom-in duration-700">
            <MdLock className="text-4xl text-blue-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight sm:text-6xl animate-in slide-in-from-bottom-4 duration-700">
              Privacy <span className="text-blue-600">Charter</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] animate-in fade-in duration-1000 delay-300">
              Data Integrity & Encryption Standards
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-white overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="p-10 sm:p-20 space-y-16">
            <section className="space-y-6 group">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full transition-all group-hover:h-12" />
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">1. Information Architecture</h2>
              </div>
              <p className="text-slate-500 text-lg leading-relaxed font-medium pl-6">
                We strictly collect personal identifiers—including full legal names, encrypted email addresses, and verified contact digits—exclusively for institutional enrollment processing and designated academic services.
              </p>
            </section>

            <section className="space-y-6 group">
               <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full transition-all group-hover:h-12" />
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">2. Secure Vault Operations</h2>
              </div>
              <p className="text-slate-500 text-lg leading-relaxed font-medium pl-6">
                All digital assets, including high-resolution identity scans and professional dossiers, are stored within our AES-256 encrypted infrastructure, accessible only via multi-factor authenticated institutional administrative protocols.
              </p>
            </section>

            <section className="space-y-6 group">
               <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full transition-all group-hover:h-12" />
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">3. Data Sovereignty</h2>
              </div>
              <div className="p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 group-hover:bg-blue-50 transition-all duration-500">
                <p className="text-blue-900 text-lg leading-relaxed font-black pl-2">
                  We maintain an absolute zero-sharing mandate. Your professional and personal telemetry is never transmitted to third-party marketing entities or external data aggregators.
                </p>
              </div>
            </section>

            <section className="space-y-6 group">
               <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full transition-all group-hover:h-12" />
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">4. Session Integrity</h2>
              </div>
              <p className="text-slate-500 text-lg leading-relaxed font-medium pl-6">
                We utilize non-persistent session tokens to preserve navigational state and ensure cryptographic integrity of your interaction. No behavioral tracking or cross-site monitoring is deployed.
              </p>
            </section>
          </div>

          {/* Premium Footer */}
          <div className="bg-slate-900 p-12 sm:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/5">
                <MdShield size={24} />
              </div>
              <div>
                <span className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Security Status</span>
                <span className="text-sm font-bold text-white tracking-wide">Institutional Lockdown Mode Active • ISO 27001 Compliant</span>
              </div>
            </div>
            
            <button
              onClick={() => navigate(-1)}
              className="w-full md:w-auto group flex items-center justify-center gap-3 px-12 py-5 bg-blue-600 text-white rounded-2xl font-black transition-all hover:bg-white hover:text-slate-900 hover:shadow-[0_20px_50px_-10px_rgba(255,255,255,0.2)] active:scale-95"
            >
              <MdArrowBack className="text-2xl group-hover:-translate-x-2 transition-transform" />
              RETURN TO PORTAL
            </button>
          </div>
        </div>
        
        <footer className="mt-16 text-center opacity-40">
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.5em]">&copy; 2024 ACADEMY GLOBAL • PRIVACY DIVISION</p>
        </footer>
      </div>
    </div>
  );
}
