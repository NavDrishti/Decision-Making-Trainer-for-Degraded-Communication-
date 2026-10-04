'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Radio, Play, Copy, CheckCircle2, Shield, Eye, Clock, ArrowRight } from 'lucide-react';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';
import { getSocket } from '../../../../lib/socket';

export default function SessionLobbyPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();

  const [session, setSession] = useState<any>(null);
  const [currentParticipant, setCurrentParticipant] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>('COMMANDER');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableRoles = [
    { id: 'COMMANDER', name: 'Command Center', desc: 'Issues tactical movement orders and records decision rationales' },
    { id: 'TEAM_ALPHA', name: 'Scout Alpha', desc: 'Northern mountain ridge reconnaissance' },
    { id: 'TEAM_BRAVO', name: 'Patrol Bravo', desc: 'Southern contingency corridor security' },
    { id: 'AIR_OBSERVATION', name: 'Air Observation Unit', desc: 'Aerial drone feed surveillance & freshness verification' },
    { id: 'LOGISTICS', name: 'Logistics Convoy', desc: 'Controls relief transport vehicle & executes routing orders' },
    { id: 'OBSERVER', name: 'Observer', desc: 'Read-only exercise monitor' },
  ];

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchSession = async () => {
    try {
      const data = await api.get(`/sessions/${resolvedParams.sessionId}`);
      if (data?.session) {
        setSession(data.session);
        setCurrentParticipant(data.currentParticipant);
        if (data.currentParticipant?.assignedRole) {
          setSelectedRole(data.currentParticipant.assignedRole);
        }
        if (data.session.status === 'RUNNING') {
          const isInst = user?.role === 'INSTRUCTOR' || user?.role === 'SUPER_ADMIN';
          router.push(isInst ? `/session/${data.session.id}/monitor` : `/session/${data.session.id}/simulate`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load session lobby.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSession();

      const socket = getSocket();
      socket.emit('session:join', { sessionId: resolvedParams.sessionId });

      socket.on('session:status-updated', (data: any) => {
        if (data.status === 'RUNNING') {
          const isInst = user?.role === 'INSTRUCTOR' || user?.role === 'SUPER_ADMIN';
          router.push(isInst ? `/session/${resolvedParams.sessionId}/monitor` : `/session/${resolvedParams.sessionId}/simulate`);
        }
      });

      socket.on('session:participant-joined', () => {
        fetchSession();
      });

      return () => {
        socket.off('session:status-updated');
        socket.off('session:participant-joined');
      };
    }
  }, [resolvedParams.sessionId, user]);

  const handleCopyCode = () => {
    if (session?.joinCode) {
      navigator.clipboard.writeText(session.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleRoleChange = async (roleId: string) => {
    setSelectedRole(roleId);
    if (currentParticipant) {
      try {
        await api.post(`/sessions/${session.id}/assign-role`, {
          participantId: currentParticipant.id,
          role: roleId,
        });
        fetchSession();
      } catch {}
    } else {
      try {
        await api.post('/sessions/join', { code: session.joinCode, requestedRole: roleId });
        fetchSession();
      } catch {}
    }
  };

  const handleStartSession = async () => {
    setStarting(true);
    try {
      await api.post(`/sessions/${session.id}/start`);
      router.push(`/session/${session.id}/monitor`);
    } catch (err: any) {
      setError(err.message || 'Failed to start session.');
      setStarting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Entering simulation lobby...</span>
        </div>
      </div>
    );
  }

  const isInstructor = user?.role === 'INSTRUCTOR' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <span>← Return to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Exercise Lobby
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {session?.scenario?.title || 'Operation Signal Break'}
              </h1>
              <p className="text-xs text-slate-500">
                Location: {session?.scenario?.fictionalLocation || 'Fictional Karakoram Corridor'} • Target Delivery: Zone C
              </p>
            </div>

            {/* Join Code Card */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Join Code</div>
                <div className="text-lg font-mono font-bold text-blue-600 tracking-wider">
                  {session?.joinCode || 'ND-SIGNAL-88'}
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors shadow-sm"
                title="Copy Join Code"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {/* Role Picker */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Select Your Operational Role:</h2>
              <span className="text-xs text-slate-500">Each role receives unique degraded perspective projections</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availableRoles.map((r) => {
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleRoleChange(r.id)}
                    className={`p-4 rounded-xl border text-left transition-all space-y-1.5 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                        {r.name}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="text-[11px] leading-snug line-clamp-2 text-slate-500">{r.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Participants Enrolled */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Connected Participants ({session?.participants?.length || 1}):</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {session?.participants?.map((p: any) => (
                <div
                  key={p.id}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-800">{p.user?.fullName || 'Trainee'}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                    {p.assignedRole}
                  </span>
                </div>
              )) || (
                <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-800">{user?.fullName || 'Trainee'}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                    {selectedRole}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {isInstructor
                ? 'As Instructor, you will start the simulation clock for all connected participants.'
                : 'Waiting for Instructor to start simulation. You will be automatically redirected.'}
            </div>

            <div className="flex items-center gap-3">
              {isInstructor ? (
                <button
                  onClick={handleStartSession}
                  disabled={starting}
                  className="px-8 py-3 rounded-xl bg-[#0066ff] hover:bg-blue-600 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>{starting ? 'Starting Simulation...' : 'Start Simulation Exercise'}</span>
                </button>
              ) : (
                <Link
                  href={`/session/${session?.id || resolvedParams.sessionId}/simulate`}
                  className="px-6 py-2.5 rounded-xl bg-[#0066ff] hover:bg-blue-600 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span>Enter Simulator Room</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
