'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  Clock,
  Radio,
  ArrowRight,
  Shield,
  Layers,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function PublicScenariosPage() {
  const { user } = useAuthStore();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const scenarioCatalog = [
    {
      id: 'scen-mountainpass-01',
      title: 'MountainPass-01: Relief Convoy',
      location: 'Fictional Karakoram Sector (Corridor-01)',
      difficulty: 'MEDIUM',
      duration: '10 Minutes',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      description:
        'Coordinated movement through a high-altitude mountain pass experiencing atmospheric interference, a rockslide blockage at km 14, and contradictory aerial recon.',
      challenges: [
        '45-second radio propagation latency',
        'Stale aerial drone imagery pass',
        'Unconfirmed scout blockage report',
      ],
      recommendedRole: 'Commander, Scout Alpha, Logistics',
    },
    {
      id: 'scen-river-crossing',
      title: 'River Crossing: Flash Flood Protocol',
      location: 'Fictional Tawi Synthetic Sector',
      difficulty: 'HARD',
      duration: '15 Minutes',
      badgeColor: 'bg-red-100 text-red-800 border-red-200',
      description:
        'Rapid river rise threatens logistics bridge crossing. Primary VHF links drop silently while units attempt secondary satellite failover.',
      challenges: [
        'Total primary packet dropout',
        'Secondary satellite channel queue',
        'Time-critical water gauge alerts',
      ],
      recommendedRole: 'Field Operator, Logistics Convoy',
    },
    {
      id: 'scen-supply-echo',
      title: 'Supply Convoy Echo: Humanitarian Transit',
      location: 'Fictional Baramulla Valley Corridor',
      difficulty: 'EASY',
      duration: '12 Minutes',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description:
        'Entry-level training exercise familiarizing trainees with message acknowledgment discipline and order confirmation verification.',
      challenges: [
        'Intermittent radio packet drops (15%)',
        'Simulated read receipt verification',
        'Standard checkpoint reporting',
      ],
      recommendedRole: 'All Trainee Roles',
    },
    {
      id: 'scen-urban-delta',
      title: 'Urban Coordination Delta: Gridlock',
      location: 'Fictional Zoji Synthetic Sector',
      difficulty: 'HARD',
      duration: '20 Minutes',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      description:
        'High-density structural interference creating multi-path RF distortion and asynchronous situational awareness across 5 field units.',
      challenges: [
        'Asymmetric communication delays',
        'Conflicting multi-team perimeter reports',
        'High cognitive decision load',
      ],
      recommendedRole: 'Multiplayer Team Exercise',
    },
  ];

  const filteredScenarios = scenarioCatalog.filter((sc) => {
    const matchesDifficulty = selectedDifficulty === 'ALL' || sc.difficulty === selectedDifficulty;
    const matchesSearch =
      sc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDifficulty && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Operational Scenario Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Degraded Communication Training Scenarios
          </h1>
          <p className="text-slate-600 text-base leading-relaxed max-w-3xl">
            Explore deterministic training modules simulating realistic operational friction. Each scenario challenges teams to recognize missing information, verify freshness, and execute resilient decisions.
          </p>

          {/* Quick Filters */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    selectedDifficulty === diff
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {diff === 'ALL' ? 'All Difficulties' : diff}
                </button>
              ))}
            </div>

            <div className="relative sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scenarios by title, sector..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredScenarios.map((sc) => (
            <div
              key={sc.id}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${sc.badgeColor}`}>
                    {sc.difficulty}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {sc.duration}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">{sc.title}</h2>
                  <div className="text-xs font-semibold text-blue-600 mt-0.5">{sc.location}</div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{sc.description}</p>

                {/* Challenges checklist */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Simulated Injects:</div>
                  <ul className="text-xs space-y-1 text-slate-600">
                    {sc.challenges.map((ch, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                        <span>{ch}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Target: <strong>{sc.recommendedRole}</strong>
                </span>
                <Link
                  href={user ? '/session/ND-SIGNAL-88/simulate' : '/login'}
                  className="px-4 py-2 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>{user ? 'Enter Exercise' : 'Sign In to Train'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Instructor Callout Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Are you an authorized Instructor or Evaluator?</h3>
            <p className="text-xs text-slate-600">
              Access the Scenario Builder Wizard to create customized degradation schedules, inject manual friction events, and supervise live multiplayer exercises.
            </p>
          </div>
          <Link
            href={user ? '/instructor/scenarios' : '/login'}
            className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs whitespace-nowrap transition-colors shadow-sm"
          >
            {user ? 'Open Instructor Studio' : 'Instructor Sign In'}
          </Link>
        </div>
      </div>
    </div>
  );
}
