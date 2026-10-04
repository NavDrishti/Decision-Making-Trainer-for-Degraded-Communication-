'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Eye,
  Radio,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  BarChart3,
  Lock,
  Layers,
  Sparkles,
  Users,
  Compass,
  CloudSun,
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'TRUTH' | 'COMMANDER' | 'ALPHA'>('COMMANDER');

  return (
    <div className="flex flex-col w-full bg-[#f8fafc] text-slate-900 min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative bg-white border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column Text */}
          <div className="lg:col-span-7 space-y-6">
            {/* SIH Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              Smart India Hackathon • SIH26248
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              NavDrishti<span className="text-[#0066ff]">AI</span>
            </h1>

            {/* Subtitle */}
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
              Train under uncertainty. Decide with confidence.
            </h2>

            {/* Paragraph */}
            <p className="text-base text-slate-600 max-w-xl font-normal leading-relaxed">
              Immersive multi-domain decision-making trainer for degraded communication environments. Evaluates operational resilience when radio transmissions are lagged, dropped, or contradictory.
            </p>

            {/* 4 Feature Items */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Users className="w-5 h-5 text-blue-600 mb-1.5" />
                <span className="text-xs font-semibold text-slate-800 block">Multiplayer Exercises</span>
                <span className="text-[11px] text-slate-500">Real-time roles</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Radio className="w-5 h-5 text-amber-600 mb-1.5" />
                <span className="text-xs font-semibold text-slate-800 block">Degraded Comms</span>
                <span className="text-[11px] text-slate-500">Lag & drop engine</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Compass className="w-5 h-5 text-indigo-600 mb-1.5" />
                <span className="text-xs font-semibold text-slate-800 block">Scenario Engine</span>
                <span className="text-[11px] text-slate-500">Dynamic injects</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Layers className="w-5 h-5 text-emerald-600 mb-1.5" />
                <span className="text-xs font-semibold text-slate-800 block">Perception Replay</span>
                <span className="text-[11px] text-slate-500">Truth vs perceived</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="px-6 py-3 rounded-lg bg-[#0066ff] hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm inline-flex items-center gap-2"
              >
                <span>Launch Quick Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-sm inline-flex items-center justify-center"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>

          {/* Right Column Visual (Matches Reference Command Center Visual) */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-slate-900 group">
              <img
                src="/hero-command-center.jpg"
                alt="NavDrishti Command Center Simulation"
                className="w-full h-80 sm:h-96 object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-6">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-white text-xs font-mono mb-2 self-start border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  CORRIDOR-01 ACTIVE SIMULATION
                </div>
                <div className="text-white font-bold text-lg">Mountain Pass Relief Logistics</div>
                <div className="text-slate-300 text-xs mt-1">Simulated RF latency: 45s • Open-Meteo Real-time Telemetry Synced</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRIMARY USP: PERCEPTION VS GROUND-TRUTH INTERACTIVE DEMO */}
      <section className="py-16 bg-[#f8fafc] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <div className="text-xs uppercase tracking-wider font-bold text-blue-600">Core Decision Intelligence</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              “Train under uncertainty, measure the information gap, and explain every decision.”
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              In high-stress emergency operations, decisions must be judged by what the operator <em>actually knew</em> at that second,
              never by hidden ground truth they were deprived of. Toggle perspectives below to see the information gap in action:
            </p>

            {/* Perspective Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-slate-200 border border-slate-300 mx-auto mt-4">
              <button
                onClick={() => setActiveTab('TRUTH')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'TRUTH' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                1. Actual Ground Truth
              </button>
              <button
                onClick={() => setActiveTab('ALPHA')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ALPHA' ? 'bg-[#0066ff] text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                2. Team Alpha View
              </button>
              <button
                onClick={() => setActiveTab('COMMANDER')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'COMMANDER' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                3. Commander Perceived View
              </button>
            </div>
          </div>

          {/* Interactive Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-mono font-bold text-blue-700">SIMULATION T+02:45 / OPERATION SIGNAL BREAK</span>
                <span className="text-xs px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                  Channel: PRIMARY (DEGRADED - 45s LAG)
                </span>
              </div>

              {activeTab === 'TRUTH' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900">
                    <div className="font-bold flex items-center gap-2 text-sm text-red-700 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-600" /> Physical Ground Truth State:
                    </div>
                    <ul className="text-xs space-y-1.5 list-disc list-inside text-red-800">
                      <li>
                        <strong>North Ridge Pass:</strong> Physical rockslide at km 14 completely blocks all convoy vehicles.
                      </li>
                      <li>
                        <strong>Central Highway:</strong> Flash cloudburst flooding makes travel slow and hazardous.
                      </li>
                      <li>
                        <strong>South Valley Bypass:</strong> 100% clear and dry. Optimal transit corridor.
                      </li>
                    </ul>
                  </div>
                  <div className="text-xs text-slate-500">
                    The Instructor sees this absolute state. Field operators do NOT have access to this hidden reality until confirmed.
                  </div>
                </div>
              )}

              {activeTab === 'ALPHA' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                    <div className="font-bold flex items-center gap-2 text-sm text-blue-700 mb-1">
                      <Eye className="w-4 h-4 text-blue-600" /> Scout Alpha Recon Observation:
                    </div>
                    <ul className="text-xs space-y-1.5 list-disc list-inside text-blue-800">
                      <li>Scout visually verified the rockslide at North Ridge pass.</li>
                      <li>
                        Transmitted urgent confirmation: <em>"North route completely blocked."</em>
                      </li>
                      <li>
                        <strong>Degradation Injected:</strong> Message queued in relay buffer; will take 45s to reach Command.
                      </li>
                    </ul>
                  </div>
                  <div className="text-xs text-slate-500">
                    Alpha knows North is blocked, but their transmission is trapped in simulated latency.
                  </div>
                </div>
              )}

              {activeTab === 'COMMANDER' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900">
                    <div className="font-bold flex items-center gap-2 text-sm text-indigo-700 mb-1">
                      <Layers className="w-4 h-4 text-indigo-600" /> Commander Perceived State (The Information Gap):
                    </div>
                    <ul className="text-xs space-y-1.5 list-disc list-inside text-indigo-800">
                      <li>
                        Received older Air Unit report stating: <em>"North route appears clear"</em> (Stale imagery).
                      </li>
                      <li>Team Alpha’s confirmed blockage has NOT arrived yet due to the 45s delay.</li>
                      <li>
                        <strong>Decision Dilemma:</strong> Dispatch convoy now based on stale imagery, or wait for ground
                        confirmation?
                      </li>
                    </ul>
                  </div>
                  <div className="text-xs text-slate-500">
                    <strong>Fair Assessment:</strong> If the Commander holds the convoy for confirmation, they receive full marks
                    for prudence despite having incomplete data.
                  </div>
                </div>
              )}
            </div>

            {/* Scorecard Preview */}
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ComRes Index Engine</div>
              <div className="text-4xl font-extrabold text-blue-700">
                84 <span className="text-sm font-normal text-slate-500">/ 100</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Disruption Detection</span>
                  <span className="font-semibold text-emerald-600">88%</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Freshness Verification</span>
                  <span className="font-semibold text-amber-600">76%</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Order Acknowledgement</span>
                  <span className="font-semibold text-emerald-600">92%</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 leading-snug">
                Zero penalty for information not received. Every decision captured with exact situational snapshot.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SIMULATION WORKFLOW ARCHITECTURE */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs uppercase tracking-wider font-bold text-blue-600">Operational Flow</h2>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900">How NavDrishtiAI Operates</div>
            <p className="text-slate-600 text-sm">Four structured phases ensuring reproducible, evidence-based training.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-[#f8fafc] border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Scenario Creation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instructor defines fictional corridors, units, routes, and scheduled degradation events using structured templates.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#f8fafc] border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Live Degraded Exercise</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Roles join via secure codes. The server injects message delays, dropped packets, and channel degradations in real time.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#f8fafc] border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Decisions & Rationale</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every action requires an explicit rationale. The system stamps the exact perceived-state snapshot for fair audit.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#f8fafc] border border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center mb-4">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">After-Action Replay</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scrubber replay compares Ground Truth with each role's perception. Generates explainable ComRes Index and exports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECURITY & SAFE-USE BANNER */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                <span>Security by Design & Safe Use</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Engineered for Responsible Serious Gaming</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                NavDrishtiAI strictly excludes real operational defense locations, classified radio frequencies, targeting tools,
                and kinetic weapon controls. All map coordinates represent synthetic fictional training corridors.
              </p>
            </div>
            <Link
              href="/security"
              className="px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold whitespace-nowrap transition-colors shadow-sm"
            >
              Review Security Architecture
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FAST DEMO LAUNCHPAD */}
      <section className="py-16 text-center bg-[#f8fafc]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Ready to Train Under Uncertainty?</h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            Log in with one click using our pre-seeded role credentials or create a new training account.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="px-6 py-3 rounded-lg bg-[#0066ff] hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              Open Quick-Fill Login
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors shadow-sm"
            >
              Register New Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
