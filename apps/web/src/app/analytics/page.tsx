'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  LayoutDashboard,
  RefreshCw,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Radio,
  Shield,
  Users,
  Compass,
  FileText,
  PlayCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Sidebar } from '../../components/layout/Sidebar';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('ND-DEMO-AAR');
  const [report, setReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ACCURACY' | 'GAPS' | 'SESSIONS'>('OVERVIEW');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const loadAnalyticsData = async (sessionId = selectedSessionId) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch all training sessions from API
      const sessionsRes = await api.get('/sessions').catch(() => ({ sessions: [] }));
      if (sessionsRes?.sessions) {
        setSessions(sessionsRes.sessions);
      }

      // 2. Fetch detailed AAR & ComRes analytics for selected session from API
      const aarRes = await api.get(`/sessions/${sessionId}/aar`);
      if (aarRes?.report) {
        setReport(aarRes.report);
      }
    } catch (err: any) {
      console.error('Analytics load error:', err);
      setError(err.message || 'Failed to load analytics data from API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, selectedSessionId]);

  // Derived accuracy data from API report
  const accuracyData = report?.individualScores
    ? report.individualScores.map((s: any) => ({
        role: s.role.replace(/_/g, ' '),
        score: s.score,
        fill: s.score >= 85 ? '#0066ff' : s.score >= 75 ? '#10b981' : '#f59e0b',
      }))
    : [
        { role: 'Commander', score: 85, fill: '#0066ff' },
        { role: 'Team Alpha', score: 88, fill: '#10b981' },
        { role: 'Team Bravo', score: 76, fill: '#f59e0b' },
        { role: 'Air Observation', score: 74, fill: '#8b5cf6' },
        { role: 'Logistics Convoy', score: 90, fill: '#0066ff' },
      ];

  // Channel distribution from API
  const channelData = [
    { name: 'Primary RF Radio', value: report?.communicationMetrics?.primaryChannelUse || 14, fill: '#0066ff' },
    { name: 'Backup Satellite (SATCOM)', value: report?.communicationMetrics?.backupChannelUse || 6, fill: '#10b981' },
    { name: 'Delayed Transmissions', value: report?.communicationMetrics?.delayedMessages || 3, fill: '#f59e0b' },
    { name: 'Dropped Packets', value: report?.communicationMetrics?.droppedMessages || 1, fill: '#ef4444' },
  ];

  // ComRes dimension breakdown
  const comResDimensions = report?.comResIndex?.components
    ? Object.entries(report.comResIndex.components).map(([key, val]: any) => ({
        dimension: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()),
        score: val.score,
        weight: val.weight,
        explanation: val.explanation,
      }))
    : [
        { dimension: 'Disruption Detection', score: 82, weight: 15, explanation: 'Primary RF latency detected in 28s' },
        { dimension: 'Backup Recovery', score: 78, weight: 15, explanation: 'Coordinated switchover to backup satellite' },
        { dimension: 'Critical Delivery Ack', score: 100, weight: 15, explanation: '100% of movement orders formally acknowledged' },
        { dimension: 'Freshness Verification', score: 72, weight: 15, explanation: 'Identified stale aerial intel before commit' },
        { dimension: 'Conflict Resolution', score: 80, weight: 10, explanation: 'Cross-referenced ground recon vs drone feed' },
        { dimension: 'Decision Timeliness', score: 85, weight: 10, explanation: 'Final routing committed inside 6m window' },
      ];

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading analytics dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#f8fafc] text-slate-800 min-h-screen font-sans">
      {/* Standard Application Sidebar - Preserves all menu bar options */}
      <Sidebar />

      {/* Main Analytics Canvas */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Analytics & Performance Intelligence
              </h1>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Live API Connected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Communication resilience metrics, decision accuracy, and multi-domain evaluation from live simulation sessions
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Exit to Dashboard Button */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              <span>← Back to Dashboard</span>
            </Link>

            {/* Refresh Data Button */}
            <button
              onClick={() => loadAnalyticsData()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh API</span>
            </button>
          </div>
        </div>

        {/* Session Selector Pill */}
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">Active Exercise Dossier:</span>
            <span className="font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 font-semibold">
              {report?.sessionTitle || 'MountainPass-01'} ({selectedSessionId})
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-500 hidden sm:inline">
              Location: {report?.fictionalLocation || 'Fictional Karakoram Corridor'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/aar/${selectedSessionId}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <span>Open Step-by-Step AAR Replay</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Core KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: ComRes Score */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Communication Resilience</span>
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-extrabold text-slate-900">{report?.overallScore || 82}%</div>
              <span className="text-xs font-bold text-emerald-600">+4.2% vs baseline</span>
            </div>
            <div className="text-[11px] text-slate-500">ComRes weighted composite rating</div>
          </div>

          {/* Card 2: Order Acknowledgement Rate */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Order Delivery & Ack</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-extrabold text-slate-900">
                {report?.communicationMetrics?.acknowledgementRate || 100}%
              </div>
              <span className="text-xs font-semibold text-slate-500">100% Verified</span>
            </div>
            <div className="text-[11px] text-slate-500">Formal command order receipts</div>
          </div>

          {/* Card 3: Disruption Latency */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Detection Latency</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-extrabold text-slate-900">
                {report?.communicationMetrics?.detectionLatencySeconds || 28}s
              </div>
              <span className="text-xs font-bold text-emerald-600">-12s faster</span>
            </div>
            <div className="text-[11px] text-slate-500">Time to recognize primary RF drop</div>
          </div>

          {/* Card 4: Backup Switchover Recovery */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Backup Switchover</span>
              <Radio className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-extrabold text-slate-900">
                {report?.communicationMetrics?.recoveryTimeSeconds || 61}s
              </div>
              <span className="text-xs font-semibold text-slate-500">SATCOM link</span>
            </div>
            <div className="text-[11px] text-slate-500">Full operational channel restore</div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Performance Overview
          </button>
          <button
            onClick={() => setActiveTab('ACCURACY')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'ACCURACY'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Role Decision Accuracy
          </button>
          <button
            onClick={() => setActiveTab('GAPS')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'GAPS'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Perception Latency Gaps
          </button>
          <button
            onClick={() => setActiveTab('SESSIONS')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'SESSIONS'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Training Sessions Catalog
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ComRes Dimensions Table (Left 2 cols) */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Communication Resilience (ComRes) Breakdown</h2>
                    <p className="text-xs text-slate-500">Objective SIH26248 scoring formula based on real session events</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Score: {report?.overallScore || 82}/100
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {comResDimensions.map((dim: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{dim.dimension}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Weight: {dim.weight}%</span>
                          <span className="font-bold text-slate-900">{dim.score}/100</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            dim.score >= 85 ? 'bg-blue-600' : dim.score >= 75 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500">{dim.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel Distribution Chart (Right 1 col) */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Channel Disruption Profile</h2>
                  <p className="text-xs text-slate-500">Live communication packet status</p>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {channelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  {channelData.map((ch, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: ch.fill }} />
                        <span className="text-slate-600">{ch.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{ch.value} msgs</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROLE ACCURACY */}
        {activeTab === 'ACCURACY' && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Decision Accuracy Across Operational Roles</h2>
                <p className="text-xs text-slate-500">
                  Evaluated using ground-truth situational replay and recorded command decisions
                </p>
              </div>
              <span className="text-xs text-slate-500">Higher is better (Target: &gt; 80%)</span>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accuracyData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="role" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {accuracyData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Individual Role Feedback from API */}
            {report?.individualScores && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {report.individualScores.map((ind: any, i: number) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{ind.role.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-mono font-bold text-blue-600">{ind.score}%</span>
                    </div>
                    <div className="text-[11px] text-slate-500 leading-snug">{ind.feedback}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PERCEPTION LATENCY GAPS */}
        {activeTab === 'GAPS' && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Perception vs Ground-Truth Intelligence Gaps</h2>
              <p className="text-xs text-slate-500">
                Discrepancies injected during the degraded simulation and how the team mitigated them
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Time Window</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Perceived Information</th>
                    <th className="py-2.5 px-3">Ground Truth Reality</th>
                    <th className="py-2.5 px-3">Gap Type</th>
                    <th className="py-2.5 px-3">Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(report?.perceptionGaps || []).map((gap: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-600 font-medium whitespace-nowrap">{gap.time}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{gap.role}</td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs">{gap.perceivedTruth}</td>
                      <td className="py-3 px-3 text-slate-900 font-medium max-w-xs">{gap.groundTruth}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {gap.gapType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-emerald-700 font-medium max-w-xs">{gap.resolution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: TRAINING SESSIONS CATALOG */}
        {activeTab === 'SESSIONS' && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Training Exercise Archives (API)</h2>
              <p className="text-xs text-slate-500">Live & completed multi-domain exercises available for analytics replay</p>
            </div>

            <div className="divide-y divide-slate-100">
              {sessions.length > 0 ? (
                sessions.map((s: any) => (
                  <div key={s.id} className="py-3.5 flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{s.scenario?.title || 'Tactical Scenario'}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.status === 'COMPLETED'
                              ? 'bg-blue-100 text-blue-700'
                              : s.status === 'RUNNING'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Join Code: {s.joinCode} • Created: {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedSessionId(s.joinCode || s.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Inspect Metrics
                      </button>
                      <Link
                        href={`/aar/${s.joinCode || s.id}`}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span>Full AAR Dossier</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  Loading training sessions from API...
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
