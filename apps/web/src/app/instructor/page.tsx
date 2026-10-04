'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  PlayCircle,
  Radio,
  FileText,
  Users,
  AlertTriangle,
  ArrowRight,
  Shield,
  Activity,
  Plus,
  Clock,
  Layers,
} from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function InstructorDashboard() {
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [sessRes, scenRes] = await Promise.all([api.get('/sessions'), api.get('/scenarios')]);
        if (sessRes?.sessions) setSessions(sessRes.sessions);
        if (scenRes?.scenarios) setScenarios(scenRes.scenarios);
      } catch (err) {
        console.error('Failed to load instructor data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Verifying instructor credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-[#f8fafc] text-slate-900 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              <Compass className="w-7 h-7 text-blue-600" />
              <span>Instructor Command & Control</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Author scenarios, manage multiplayer training sessions, and inject real-time communication disruptions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/instructor/scenarios/new"
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Create Scenario</span>
            </Link>
            <Link
              href="/instructor/sessions/new"
              className="px-4 py-2 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Radio className="w-4 h-4" />
              <span>Launch Session</span>
            </Link>
          </div>
        </div>

        {/* Live Exercise Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                Live Session Health
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-semibold">
                ONLINE
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900">ND-SIGNAL-88</div>
            <div className="text-xs text-slate-500">Default Training Session • Primary RF Relays Active</div>
            <div className="pt-2 flex items-center gap-2">
              <Link
                href="/session/ND-SIGNAL-88/monitor"
                className="px-3.5 py-1.5 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
              >
                <span>Live Monitor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/session/ND-SIGNAL-88/lobby"
                className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs hover:bg-slate-200 transition-colors"
              >
                Lobby
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scenario Library</span>
              <span className="text-xs font-mono font-bold text-blue-600">{scenarios.length} Published</span>
            </div>
            <div className="text-xl font-bold text-slate-900">Operation Signal Break</div>
            <div className="text-xs text-slate-500">Fictional relief package delivery with 11 scheduled degradation events</div>
            <div className="pt-2">
              <Link
                href="/instructor/scenarios"
                className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Manage All Scenarios</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Sessions</span>
              <span className="text-xs font-mono font-bold text-emerald-600">AAR Ready</span>
            </div>
            <div className="text-xl font-bold text-slate-900">ND-DEMO-AAR</div>
            <div className="text-xs text-slate-500">Score: 84/100 • Full Perceptions vs Ground Truth Replay</div>
            <div className="pt-2">
              <Link
                href="/aar/ND-DEMO-AAR"
                className="text-xs text-emerald-600 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Open AAR & Replay</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Managed Training Sessions</h2>
            <Link href="/instructor/sessions" className="text-xs text-blue-600 hover:underline font-medium">
              View All
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Join Code</th>
                  <th className="py-3 px-4">Scenario</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Participants</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{s.joinCode}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{s.scenario?.title || 'Tactical Scenario'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                          s.status === 'RUNNING'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : s.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{s.participants?.length || 0} enrolled</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        href={`/session/${s.id}/monitor`}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 inline-block font-medium shadow-sm transition-colors"
                      >
                        Live Monitor
                      </Link>
                      <Link
                        href={`/aar/${s.id}`}
                        className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white inline-block font-medium transition-colors"
                      >
                        AAR
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
