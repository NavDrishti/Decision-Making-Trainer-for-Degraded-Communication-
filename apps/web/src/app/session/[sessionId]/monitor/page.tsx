'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Radio,
  Play,
  Pause,
  StopCircle,
  Clock,
  Shield,
  AlertTriangle,
  Zap,
  Users,
  Send,
  MessageSquare,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { TacticalMap } from '../../../../components/map/TacticalMap';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';
import { getSocket } from '../../../../lib/socket';

export default function InstructorMonitorPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();

  const [session, setSession] = useState<any>(null);
  const [simulationSecond, setSimulationSecond] = useState<number>(0);
  const [sessionStatus, setSessionStatus] = useState<string>('RUNNING');
  const [messages, setMessages] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);

  // Injection Console State
  const [injectionType, setInjectionType] = useState('INJECT_DELAY');
  const [targetRole, setTargetRole] = useState('TEAM_ALPHA');
  const [delayDuration, setDelayDuration] = useState('45');
  const [contradictoryText, setContradictoryText] = useState('Recon shows North Route is clear of obstacles.');
  const [instructorNoteText, setInstructorNoteText] = useState('');
  const [injectSuccess, setInjectSuccess] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchSessionData = async () => {
    try {
      const data = await api.get(`/sessions/${resolvedParams.sessionId}`);
      if (data?.session) {
        setSession(data.session);
        setSessionStatus(data.session.status);
        setSimulationSecond(data.session.currentSimulationSecond || 0);
      }

      const msgData = await api.get(`/sessions/${resolvedParams.sessionId}/messages`);
      if (msgData?.messages) setMessages(msgData.messages);

      const decData = await api.get(`/sessions/${resolvedParams.sessionId}/decisions`);
      if (decData?.decisions) setDecisions(decData.decisions);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSessionData();

      const socket = getSocket();
      socket.emit('session:join', { sessionId: resolvedParams.sessionId });

      socket.on('timer:update', (data: { simulationSecond: number }) => {
        setSimulationSecond(data.simulationSecond);
      });

      socket.on('session:status-updated', (data: any) => {
        setSessionStatus(data.status);
      });

      socket.on('message:delivered', (newMsg: any) => {
        setMessages((prev) => [...prev, newMsg]);
      });

      socket.on('message:dropped', (dropData: any) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `drop-${Date.now()}`,
            senderRole: dropData.senderRole,
            body: dropData.content,
            status: 'DROPPED',
            simulationSecond: dropData.second,
          },
        ]);
      });

      return () => {
        socket.off('timer:update');
        socket.off('session:status-updated');
        socket.off('message:delivered');
        socket.off('message:dropped');
      };
    }
  }, [resolvedParams.sessionId, user]);

  const handlePause = async () => {
    await api.post(`/sessions/${resolvedParams.sessionId}/pause`);
    setSessionStatus('PAUSED');
  };

  const handleResume = async () => {
    await api.post(`/sessions/${resolvedParams.sessionId}/resume`);
    setSessionStatus('RUNNING');
  };

  const handleEnd = async () => {
    if (confirm('Conclude training session and compile After-Action Review?')) {
      await api.post(`/sessions/${resolvedParams.sessionId}/end`);
      setSessionStatus('COMPLETED');
    }
  };

  const handleInject = async (e: React.FormEvent) => {
    e.preventDefault();
    setInjectSuccess(null);

    let injectParams: Record<string, any> = {};

    if (injectionType === 'INJECT_DELAY') {
      injectParams = { role: targetRole, delaySeconds: parseInt(delayDuration, 10) };
    } else if (injectionType === 'DROP_NEXT_MESSAGE') {
      injectParams = { role: targetRole };
    } else if (injectionType === 'INJECT_CONTRADICTORY_REPORT') {
      injectParams = { senderRole: targetRole, content: contradictoryText };
    } else if (injectionType === 'TOGGLE_AERIAL_FEED') {
      injectParams = { active: false };
    } else if (injectionType === 'ADD_INSTRUCTOR_NOTE') {
      injectParams = { content: instructorNoteText, targetRole };
    }

    try {
      await api.post(`/sessions/${resolvedParams.sessionId}/events/inject`, {
        actionType: injectionType,
        params: injectParams,
      });

      setInjectSuccess(`Disruption [${injectionType}] successfully dispatched into simulation!`);
      setTimeout(() => setInjectSuccess(null), 3500);
      fetchSessionData();
    } catch (err: any) {
      alert(err.message || 'Injection failed.');
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Verifying instructor monitor privileges...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-[#f8fafc] text-slate-900 overflow-hidden">
      {/* Top Bar: Session Title, Clock, Status, Instructor Controls */}
      <header className="h-14 border-b border-slate-200 bg-[#0b1120] text-slate-200 px-4 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/instructor/sessions" className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium">
            <span>← Sessions</span>
          </Link>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-tight">
              Instructor Monitor: {session?.scenario?.title || 'Operation Signal Break'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                sessionStatus === 'RUNNING'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {sessionStatus}
            </span>
          </div>
        </div>

        {/* Timer, Instructor Controls & AAR Link */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold text-white tracking-widest">{formatTimer(simulationSecond)}</span>
          </div>

          {sessionStatus === 'RUNNING' ? (
            <button
              onClick={handlePause}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handleResume}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume</span>
            </button>
          )}

          <button
            onClick={handleEnd}
            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>End Session</span>
          </button>

          <Link
            href={`/aar/${session?.id || resolvedParams.sessionId}`}
            className="px-3 py-1 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
          >
            <span>Review AAR</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 3-Column Center: Enrolled Units | Ground Truth Map | Real-time Feed */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Participants & Scenario Intel */}
        <aside className="w-64 border-r border-slate-200 bg-white p-4 space-y-4 overflow-y-auto hidden md:block">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-blue-600 font-bold">Participants Enrolled</div>
            <div className="text-xs text-slate-500">Real-time role telemetry</div>
          </div>

          <div className="space-y-2">
            {session?.participants?.map((p: any) => (
              <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 truncate max-w-[120px]">{p.user?.fullName}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[10px] font-mono text-blue-600 font-semibold">{p.assignedRole}</div>
              </div>
            )) || (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{user?.fullName || 'Trainee'}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[10px] font-mono text-blue-600 font-semibold">TEAM_ALPHA</div>
              </div>
            )}
          </div>

          {/* Quick Demo Script for SIH Judges */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-2">
            <div className="font-bold text-blue-900 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>SIH Demo Guide</span>
            </div>
            <ol className="text-[11px] text-blue-800 space-y-1 list-decimal list-inside leading-relaxed">
              <li>01:00: Scout reports North blockage</li>
              <li>01:30: Drone reports clear (stale)</li>
              <li>02:30: Primary delay injected (45s)</li>
              <li>04:30: Bravo packet dropped</li>
              <li>06:00: Commander routes convoy south</li>
            </ol>
          </div>
        </aside>

        {/* Center: Full Ground Truth Tactical Map */}
        <div className="flex-1 flex flex-col p-4 bg-[#f8fafc] relative overflow-hidden">
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
            <TacticalMap
              isInstructor={true}
              selectedView="GROUND_TRUTH"
              simulationSecond={simulationSecond}
            />
          </div>

          {/* Instructor Injections Bar */}
          <div className="mt-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Live Disruption Injection Console</span>
              </div>
              {injectSuccess && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {injectSuccess}
                </span>
              )}
            </div>

            <form onSubmit={handleInject} className="flex flex-wrap items-center gap-3 text-xs">
              <select
                value={injectionType}
                onChange={(e) => setInjectionType(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 outline-none shadow-sm"
              >
                <option value="INJECT_DELAY">Inject Message Latency (Delay)</option>
                <option value="DROP_NEXT_MESSAGE">Drop Next Transmitted Message</option>
                <option value="INJECT_CONTRADICTORY_REPORT">Inject Contradictory Intelligence</option>
                <option value="TOGGLE_AERIAL_FEED">Toggle Aerial Drone Outage</option>
                <option value="ADD_INSTRUCTOR_NOTE">Add Instructor Evaluation Note</option>
              </select>

              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 outline-none shadow-sm"
              >
                <option value="TEAM_ALPHA">Target: Team Alpha (Scout)</option>
                <option value="TEAM_BRAVO">Target: Team Bravo (Patrol)</option>
                <option value="AIR_OBSERVATION">Target: Air Observation Unit</option>
                <option value="LOGISTICS">Target: Logistics Convoy</option>
                <option value="COMMANDER">Target: Commander</option>
              </select>

              {injectionType === 'INJECT_DELAY' && (
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 text-[11px]">Lag:</span>
                  <input
                    type="number"
                    value={delayDuration}
                    onChange={(e) => setDelayDuration(e.target.value)}
                    className="w-16 px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-mono text-center outline-none shadow-sm"
                  />
                  <span className="text-slate-500 text-[11px]">sec</span>
                </div>
              )}

              {injectionType === 'INJECT_CONTRADICTORY_REPORT' && (
                <input
                  type="text"
                  value={contradictoryText}
                  onChange={(e) => setContradictoryText(e.target.value)}
                  className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 outline-none shadow-sm"
                />
              )}

              {injectionType === 'ADD_INSTRUCTOR_NOTE' && (
                <input
                  type="text"
                  placeholder="Record note for AAR..."
                  value={instructorNoteText}
                  onChange={(e) => setInstructorNoteText(e.target.value)}
                  className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 outline-none shadow-sm"
                />
              )}

              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-sm"
              >
                Trigger Injection
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Telemetry Stream */}
        <aside className="w-80 border-l border-slate-200 bg-white flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Ground Truth Telemetry</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{messages.length} Events</span>
          </div>

          <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
            {messages.map((m, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-blue-600">{m.senderRole}</span>
                  <span className="text-slate-400 font-mono">T+{m.simulationSecond}s</span>
                </div>
                <div className="text-slate-700 leading-snug">{m.body}</div>

                <div className="flex items-center gap-1.5 pt-1">
                  {m.status === 'DROPPED' ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 font-bold">
                      DROPPED IN TRANSIT
                    </span>
                  ) : m.delaySeconds > 0 ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                      Delayed {m.delaySeconds}s
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                      Delivered
                    </span>
                  )}
                </div>
              </div>
            ))}

            {decisions.map((d, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-1 shadow-sm">
                <div className="flex items-center justify-between text-[10px] text-blue-800 font-bold">
                  <span>DECISION: {d.role}</span>
                  <span>T+{d.simulationSecond}s</span>
                </div>
                <div className="text-slate-900 font-semibold">{d.action}</div>
                <div className="text-[11px] text-slate-600 italic">"{d.rationale}"</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
