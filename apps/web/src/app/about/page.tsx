import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Target, CheckCircle2, AlertTriangle, ArrowRight, Layers, FileText } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="space-y-4 border-b border-slate-200 pb-8 bg-white p-8 rounded-2xl shadow-sm border">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            Problem Statement SIH26248
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900">About NavDrishtiAI</h1>
          <p className="text-slate-600 text-base leading-relaxed max-w-3xl">
            Immersive Multi-Domain Decision-Making Trainer for Degraded Communication Environments. Designed to teach strategic
            resilience and tactical adaptability when information is delayed, contradictory, or absent.
          </p>
        </div>

        {/* Mission & Fair Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Our Training Mission
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              In modern disaster relief and tactical coordination, communication is never guaranteed. Traditional simulators assume
              perfect radio transmission, creating false confidence. NavDrishtiAI trains teams to formulate contingency plans, cross-verify
              stale intelligence, and switch to backup channels under realistic friction.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Fair Assessment Philosophy
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              A commander must never be penalized for a decision made without the benefit of information that was blocked in a
              degraded queue. NavDrishtiAI measures the <em>information gap</em> between Ground Truth and Perceived Truth, evaluating
              decisions strictly against what the trainee had available.
            </p>
          </div>
        </div>

        {/* Scope and Non-Goals */}
        <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Strict Boundaries & Non-Goals</h2>
          <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-900 block mb-1">Fictional Synthetic Environments Only:</strong>
                NavDrishtiAI does NOT model real operational defense installations, classified military radio frequencies, real
                weapon systems, offensive cyber tools, or targeting algorithms. All scenarios simulate fictional emergency
                coordination, medical relief, and supply convoys in hypothetical zones like the "NavDrishti Corridor".
              </div>
            </div>
          </div>
        </div>

        {/* Core Architecture Pillars */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Core Architecture Pillars</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-blue-700 font-bold text-sm">1. Degraded Radio Simulation</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Probabilistic and scheduled packet loss, latency queues, and out-of-order delivery across synthetic VHF/UHF/Satellite channels.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-indigo-700 font-bold text-sm">2. Dual State Replay Engine</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Captures exact ground truth side-by-side with each player's partial perception. Enables granular post-mission debriefing.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-emerald-700 font-bold text-sm">3. ComRes Index Scoring</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Objective quantification of resilience, acknowledgement discipline, verification of stale reports, and adaptability.
              </p>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="flex justify-between items-center p-6 bg-slate-900 rounded-2xl text-white">
          <div>
            <div className="font-bold text-lg">Ready to experience the platform?</div>
            <div className="text-xs text-slate-400">Launch a live simulation session in less than 30 seconds.</div>
          </div>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-medium text-sm flex items-center gap-2"
          >
            <span>Launch Quick Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
