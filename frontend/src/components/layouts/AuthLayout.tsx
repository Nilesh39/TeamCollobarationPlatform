import * as React from 'react';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#090d16]">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 border-r border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white">AI WORK OS</h1>
            <p className="text-xs text-blue-400 font-mono">INTELLIGENT WORKSPACE AUTOMATION</p>
          </div>
        </div>

        <div className="space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium">
            <Zap className="w-3.5 h-3.5" /> Next-Gen Enterprise Operating System
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            The autonomous workspace where teams and AI agents collaborate seamlessly.
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Enterprise project tracking, strict multi-tenant data isolation, deep knowledge base RAG, and automated reasoning workflows powered by Google Gemini.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2.5 text-sm text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Argon2id & Redis Token Rotation
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              PostgreSQL 16 + pgvector
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          © 2026 AI WORK OS Inc. Production Architecture Baseline.
        </div>
      </div>

      {/* Right Authentication Form Shell */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
