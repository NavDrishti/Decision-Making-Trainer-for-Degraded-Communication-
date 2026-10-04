'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Award,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Eye,
  Shield,
  AlertTriangle,
  Download,
  FileText,
  CheckCircle2,
  Users,
  Compass,
  Radio,
  Layers,
  Lock,
  ChevronRight,
  BarChart3,
  FileCheck,
  LayoutDashboard,
  PlayCircle,
  FileSpreadsheet,
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
} from 'recharts';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';

export default function AarReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();

  const [report, setReport] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [replaySecond, setReplaySecond] = useState<number>(755); // 00:12:35 matching reference photo
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TIMELINE' | 'PERCEPTION' | 'DECISIONS' | 'CONSEQUENCES'>('TIMELINE');
  const [activeMetricTab, setActiveMetricTab] = useState<'ACCURACY' | 'GAP' | 'RESPONSE'>('ACCURACY');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'decisions') setActiveTab('DECISIONS');
      else if (tab === 'overview') setActiveTab('OVERVIEW');
      else if (tab === 'perception') setActiveTab('PERCEPTION');
      else if (tab === 'consequences') setActiveTab('CONSEQUENCES');
      else if (tab === 'timeline') setActiveTab('TIMELINE');
    }

    async function loadAarData() {
      try {
        const repRes = await api.get(`/sessions/${resolvedParams.sessionId}/aar`);
        if (repRes?.report) setReport(repRes.report);
      } catch (err) {
        console.error('Failed to load AAR:', err);
      }
    }
    loadAarData();
  }, [resolvedParams.sessionId]);

  // Replay Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setReplaySecond((prev) => {
          if (prev >= 3734) {
            setIsPlaying(false);
            return 3734;
          }
          return prev + 10 * playbackSpeed;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed]);

  const formatTimer = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const remainder = sec % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    try {
      const res = await fetch(`http://localhost:5000/sessions/${resolvedParams.sessionId}/export/${format}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${api.getToken()}` },
      });
      if (format === 'pdf') {
        const html = await res.text();
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
        }
      } else {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NavDrishti_AAR_${resolvedParams.sessionId}.${format}`;
        a.click();
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Dynamic Recharts Chart Data from API report
  const accuracyData = report?.individualScores?.length
    ? report.individualScores.map((s: any) => ({
        role: s.role.replace(/_/g, ' '),
        score: s.score,
        fill: s.score >= 85 ? '#0066ff' : s.score >= 75 ? '#10b981' : '#f59e0b',
      }))
    : [
        { role: 'Commander', score: 85, fill: '#0066ff' },
        { role: 'Team Alpha', score: 72, fill: '#10b981' },
        { role: 'Team Bravo', score: 66, fill: '#f59e0b' },
        { role: 'Air Unit', score: 80, fill: '#8b5cf6' },
        { role: 'Logistics', score: 75, fill: '#ef4444' },
      ];

  const gapData = [
    { role: 'Commander', score: 18, fill: '#0066ff' },
    { role: 'Team Alpha', score: 35, fill: '#10b981' },
    { role: 'Team Bravo', score: 28, fill: '#f59e0b' },
    { role: 'Air Unit', score: 12, fill: '#8b5cf6' },
    { role: 'Logistics', score: 24, fill: '#ef4444' },
  ];

  const responseData = [
    { role: 'Commander', score: 24, fill: '#0066ff' },
    { role: 'Team Alpha', score: 48, fill: '#10b981' },
    { role: 'Team Bravo', score: 42, fill: '#f59e0b' },
    { role: 'Air Unit', score: 18, fill: '#8b5cf6' },
    { role: 'Logistics', score: 31, fill: '#ef4444' },
  ];

  const chartData = activeMetricTab === 'ACCURACY' ? accuracyData : activeMetricTab === 'GAP' ? gapData : responseData;

  // Sidebar navigation items matching photo Row 4
  const aarNavItems = [
    { id: 'OVERVIEW', label: 'AAR Report', icon: FileText },
    { id: 'TIMELINE', label: 'Timeline Replay', icon: PlayCircle },
    { id: 'PERCEPTION', label: 'Perception vs Truth', icon: Eye },
    { id: 'DECISIONS', label: 'Decisions', icon: FileCheck },
    { id: 'ANALYTICS', label: 'Analytics', icon: BarChart3 },
    { id: 'EXPORT', label: 'Download Report', icon: Download },
  ];

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading After-Action Review dossier...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      {/* 1. BLACK BAR LEFT NAVIGATION RAIL matching photo Row 4 */}
      <aside className="w-56 bg-[#0b1120] text-slate-300 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 z-20 hidden md:flex">
        <div className="p-3.5 space-y-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sky-400">
              <Radio className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              NavDrishti<span className="text-sky-400">AI</span>
            </span>
          </Link>

          {/* Back to Dashboard Button */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 hover:bg-slate-800 transition-all shadow-sm group"
          >
            <LayoutDashboard className="w-4 h-4 text-sky-400 group-hover:text-white transition-colors" />
            <span>← Back to Dashboard</span>
          </Link>

          <Link
            href="/analytics"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <span>All Analytics Hub</span>
          </Link>

          {/* Navigation rail items */}
          <nav className="space-y-1 pt-1">
            {aarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = (item.id === 'EXPORT' ? false : activeTab === item.id) || (item.id === 'ANALYTICS' && activeTab === 'TIMELINE');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'EXPORT') {
                      handleExport('pdf');
                    } else if (item.id === 'ANALYTICS') {
                      setActiveTab('TIMELINE');
                    } else {
                      setActiveTab(item.id as any);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#1e3a8a] text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom session meta */}
        <div className="p-3.5 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="pt-1 text-[10px] text-slate-500">
            Session: <strong>{report?.sessionTitle || 'MountainPass-01'}</strong>
          </div>
        </div>
      </aside>

      {/* 2. PURE WHITE AAR CANVAS */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-5 overflow-y-auto bg-[#f8fafc]">
        {/* Header matching photo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-2xs"
              title="Return to Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-600" />
              <span>Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">After Action Review</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {report?.sessionTitle || 'MountainPass-01'} • 12 Sep 2026 • Team Alpha
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('pdf')}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-red-600" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs matching photo */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'OVERVIEW'
                ? 'bg-[#0066ff] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'TIMELINE'
                ? 'bg-[#0066ff] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Timeline Replay
          </button>
          <button
            onClick={() => setActiveTab('PERCEPTION')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'PERCEPTION'
                ? 'bg-[#0066ff] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Perception vs Truth
          </button>
          <button
            onClick={() => setActiveTab('DECISIONS')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'DECISIONS'
                ? 'bg-[#0066ff] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Decisions
          </button>
          <button
            onClick={() => setActiveTab('CONSEQUENCES')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'CONSEQUENCES'
                ? 'bg-[#0066ff] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Consequences
          </button>
        </div>

        {/* VIEW 1: TIMELINE REPLAY (Matches Photo Row 4) */}
        {activeTab === 'TIMELINE' && (
          <div className="space-y-5">
            {/* Playback Timeline Bar matching photo */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="text-xs font-bold text-slate-700">Playback Timeline</div>
              <div className="flex items-center gap-3">
                {/* Play/Pause Button */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full bg-[#0066ff] hover:bg-blue-600 text-white flex items-center justify-center transition-colors flex-shrink-0 shadow"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>

                {/* Time Indicator */}
                <span className="text-xs font-mono font-bold text-slate-800">
                  {formatTimer(replaySecond)} / 01:02:14
                </span>

                {/* Scrubber slider bar with keyframe marker dots */}
                <div className="flex-1 relative flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={3734}
                    value={replaySecond}
                    onChange={(e) => setReplaySecond(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                  {/* Event Dots on Timeline */}
                  <span className="absolute left-[15%] w-2 h-2 rounded-full bg-emerald-500 pointer-events-none" />
                  <span className="absolute left-[20%] w-2 h-2 rounded-full bg-amber-500 pointer-events-none" />
                  <span className="absolute left-[40%] w-2 h-2 rounded-full bg-blue-500 pointer-events-none" />
                  <span className="absolute left-[65%] w-2 h-2 rounded-full bg-rose-500 pointer-events-none" />
                </div>

                {/* Speed Selector */}
                <div className="flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-300">
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="bg-transparent outline-none cursor-pointer"
                  >
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={4}>4x</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Main Grid: Dual Map Comparison (Left 2/3) & Analytics (Right 1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dual Map View (2/3 width) matching photo */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Ground Truth (Actual Scenario State) */}
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col">
                    <div className="p-3 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Ground Truth (Actual Scenario State)</span>
                      <span className="text-[10px] text-red-600 font-semibold uppercase">Real World</span>
                    </div>
                    {/* Satellite Imagery with Red Blockage Polygon */}
                    <div
                      className="h-52 relative bg-cover bg-center overflow-hidden flex items-center justify-center"
                      style={{ backgroundImage: `url('/satellite-map.jpg')` }}
                    >
                      <div className="absolute inset-0 bg-black/30" />
                      {/* Red Hazard Area */}
                      <div className="relative flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-red-600/40 border-2 border-dashed border-red-500 flex items-center justify-center animate-pulse">
                          <div className="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xs">
                            ✕
                          </div>
                        </div>
                        <span className="mt-1 px-2 py-0.5 rounded bg-red-700 text-white text-[9px] font-bold">
                          Blocked Route
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Team Alpha View (What they saw) */}
                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col">
                    <div className="p-3 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Team Alpha View (What they saw)</span>
                      <span className="text-[10px] text-blue-600 font-semibold uppercase">Perception</span>
                    </div>
                    {/* Satellite Imagery with Blue Radar Ring - NO blockage visible! */}
                    <div
                      className="h-52 relative bg-cover bg-center overflow-hidden flex items-center justify-center"
                      style={{ backgroundImage: `url('/satellite-map.jpg')` }}
                    >
                      <div className="absolute inset-0 bg-black/30" />
                      {/* Blue Radar Scanner */}
                      <div className="relative flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full border border-sky-400/80 bg-sky-500/20 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full border border-sky-400 bg-sky-500/30 flex items-center justify-center">
                            <div className="w-3.5 h-3.5 rounded-full bg-sky-400" />
                          </div>
                        </div>
                        <span className="mt-1 px-2 py-0.5 rounded bg-blue-700 text-white text-[9px] font-bold">
                          Team Alpha (Recon)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Callout Card at 00:12:35 matching photo */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2.5">
                  <div className="text-xs font-bold text-slate-800">
                    Event at 00:12:35
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Road Blockage Occurred</div>
                      <div className="text-[11px] text-slate-500">
                        This event was not visible to Team Alpha at this time.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-[11px] pt-1">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Users className="w-3.5 h-3.5" />
                      <span>Affected Teams: <strong className="text-slate-800">Bravo, Logistics</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Information Delay: <strong className="text-slate-800">Visible to Alpha after 18 minutes</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Analytics Card matching photo */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-slate-900">Analytics</h2>
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-4">
                  {/* Analytics Metric Tabs: [ Decision Accuracy | Information Gap | Response Time ] */}
                  <div className="flex items-center gap-1 border-b border-slate-200 pb-2 text-[10px] font-semibold">
                    <button
                      onClick={() => setActiveMetricTab('ACCURACY')}
                      className={`px-2 py-1 rounded transition-colors ${
                        activeMetricTab === 'ACCURACY'
                          ? 'bg-[#0066ff] text-white font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Decision Accuracy
                    </button>
                    <button
                      onClick={() => setActiveMetricTab('GAP')}
                      className={`px-2 py-1 rounded transition-colors ${
                        activeMetricTab === 'GAP'
                          ? 'bg-[#0066ff] text-white font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Information Gap
                    </button>
                    <button
                      onClick={() => setActiveMetricTab('RESPONSE')}
                      className={`px-2 py-1 rounded transition-colors ${
                        activeMetricTab === 'RESPONSE'
                          ? 'bg-[#0066ff] text-white font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Response Time
                    </button>
                  </div>

                  {/* Bar Chart matching photo */}
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 10, left: -25, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                        <XAxis
                          dataKey="role"
                          tick={{ fontSize: 9 }}
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                        />
                        <YAxis
                          tick={{ fontSize: 9 }}
                          domain={[0, 100]}
                          unit={activeMetricTab === 'RESPONSE' ? 's' : '%'}
                        />
                        <Tooltip
                          formatter={(val: any) => [`${val}${activeMetricTab === 'RESPONSE' ? 's' : '%'}`, activeMetricTab]}
                          contentStyle={{
                            fontSize: '11px',
                            borderRadius: '8px',
                            background: '#ffffff',
                            borderColor: '#cbd5e1',
                            color: '#0f172a',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* ComRes Score Callout */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Team ComRes Index:</span>
                    <span className="font-bold text-emerald-600">84 / 100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mission Outcome</span>
                <div className="text-2xl font-extrabold text-emerald-600">Mission Success</div>
                <p className="text-xs text-slate-600">Relief Convoy reached Zone C safely via South Valley Bypass.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ComRes Resilience Score</span>
                <div className="text-2xl font-extrabold text-[#0066ff]">84 / 100</div>
                <p className="text-xs text-slate-600">Above benchmark of 75. High verification prudence recorded.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Communication Degradation</span>
                <div className="text-2xl font-extrabold text-amber-600">45s Delay • 1 Drop</div>
                <p className="text-xs text-slate-600">Simulated RF latency handled via backup acknowledgment protocol.</p>
              </div>
            </div>

            {/* Rubric Breakdown Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">ComRes Index Evaluation Rubric Breakdown</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-800">Disruption Detection (15%)</div>
                  <div className="text-lg font-bold text-emerald-600 mt-1">88%</div>
                  <div className="text-[11px] text-slate-500">Identified channel delay in 32s</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-800">Freshness Verification (15%)</div>
                  <div className="text-lg font-bold text-emerald-600 mt-1">76%</div>
                  <div className="text-[11px] text-slate-500">Rejected stale drone feed at 01:30</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-800">Order Acknowledgement (15%)</div>
                  <div className="text-lg font-bold text-emerald-600 mt-1">92%</div>
                  <div className="text-[11px] text-slate-500">Confirmed read receipts on all orders</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-800">Contradiction Resolution (10%)</div>
                  <div className="text-lg font-bold text-emerald-600 mt-1">85%</div>
                  <div className="text-[11px] text-slate-500">Resolved scout vs air conflict</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-800">Decision Timeliness (10%)</div>
                  <div className="text-lg font-bold text-amber-600 mt-1">70%</div>
                  <div className="text-[11px] text-slate-500">Convoy committed at 06:00</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-800">Resource Efficiency (5%)</div>
                  <div className="text-lg font-bold text-emerald-600 mt-1">90%</div>
                  <div className="text-[11px] text-slate-500">Zero vehicle damage / loss</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: PERCEPTION VS TRUTH */}
        {activeTab === 'PERCEPTION' && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Perception Gap Chronology</h2>
              <p className="text-xs text-slate-500">Measurable difference between actual ground reality and role perception</p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-700">T+01:00 (Simulation Time)</span>
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-semibold">45s Gap</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Ground Truth:</span>
                    <span className="text-slate-600">Physical rockslide on North Pass km 14 completely blocks heavy vehicles.</span>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    <span className="font-bold text-blue-700 block mb-1">Commander Perception:</span>
                    <span className="text-slate-600">Believes North Route is clear based on 2-hour-old satellite baseline imagery.</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-700">T+02:30 (Simulation Time)</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">Radio Delay Injected</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    <span className="font-bold text-slate-800 block mb-1">Team Alpha State:</span>
                    <span className="text-slate-600">Alpha scout transmitted urgent blockage confirmation at 01:45.</span>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    <span className="font-bold text-amber-700 block mb-1">In-Flight Latency:</span>
                    <span className="text-slate-600">Message buffered in simulated RF propagation queue. Arrived at Commander terminal at 02:30.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: DECISIONS AUDIT */}
        {activeTab === 'DECISIONS' && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recorded Tactical Decisions & Rationale Audit</h2>
                <p className="text-xs text-slate-500">Every decision evaluated strictly against the perceived situational snapshot at the exact moment of execution</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {(report?.decisions?.length || 0)} Decisions Recorded
              </span>
            </div>

            <div className="space-y-3">
              {report?.decisions && report.decisions.length > 0 ? (
                report.decisions.map((d: any, idx: number) => {
                  const scoreExp = typeof d.scoreExplanation === 'string' ? JSON.parse(d.scoreExplanation) : (d.scoreExplanation || {});
                  return (
                    <div key={d.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">Decision #{idx + 1}: {d.action}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            T+{formatTimer(d.simulationSecond || 0)}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                          Role: {d.role || 'Commander'}
                        </span>
                      </div>
                      <div className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                        <strong className="text-slate-900">Submitted Rationale:</strong> <em>"{d.rationale}"</em>
                      </div>
                      <div className="text-[11px] text-blue-800 bg-blue-50/70 p-2.5 rounded-lg border border-blue-100 flex items-start gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Fair Assessment Evaluation:</strong> {scoreExp.feedback || 'Evaluated strictly against information available to the operator at this timestamp without penalizing for hidden ground truth.'}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">Decision #1: Hold Convoy at Base Orion</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                        Score: 100% (Prudent)
                      </span>
                    </div>
                    <div className="text-slate-600 leading-relaxed">
                      <strong>Commander Rationale:</strong> <em>"Air imagery conflicts with recent weather warnings. Holding relief convoy until scout Alpha transmits verified physical confirmation."</em>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      Perceived Truth: Air reported clear, but Alpha radio was in propagation delay. Prudence recognized.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">Decision #2: Reroute via South Valley Bypass</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                        Score: 95% (Optimal)
                      </span>
                    </div>
                    <div className="text-slate-600 leading-relaxed">
                      <strong>Commander Rationale:</strong> <em>"Alpha confirmed North Pass completely impassable due to rockslide. Dispatching Convoy 1 via secured South Bypass."</em>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      Ground Truth Match: 100%. South corridor was completely dry and safe. Zero convoy attrition.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 5: CONSEQUENCES */}
        {activeTab === 'CONSEQUENCES' && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Operational Consequences & Impact Modeling</h2>
              <p className="text-xs text-slate-500">Downstream effects of decisions executed under degraded communication</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Transit Duration</div>
                <div className="text-2xl font-bold text-blue-700">38 min</div>
                <div className="text-slate-500">6 minutes longer than North route, but avoided catastrophic blockage immobilization.</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Convoy Cargo Integrity</div>
                <div className="text-2xl font-bold text-emerald-600">100% Intact</div>
                <div className="text-slate-500">Medical supplies delivered without water exposure or transit damage.</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Radio Protocol Discipline</div>
                <div className="text-2xl font-bold text-emerald-600">Zero Lost Packets</div>
                <div className="text-slate-500">All transmissions re-acknowledged upon delay queue release.</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">Next Training Recommendation</div>
                <div className="text-sm font-semibold text-slate-800">Advance to Multi-Channel Jamming</div>
                <div className="text-slate-500">Team is ready for concurrent satellite and HF radio failover scenarios.</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
