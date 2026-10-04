'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Radio, Users, CheckCircle2, ArrowRight, Play, Key } from 'lucide-react';
import { Sidebar } from '../../../../components/layout/Sidebar';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';

function NewSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, initAuth } = useAuthStore();
  const defaultScenarioId = searchParams.get('scenarioId') || '';

  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(defaultScenarioId);
  const [customCode, setCustomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Verifying authorization...</span>
        </div>
      </div>
    );
  }

  useEffect(() => {
    async function loadScenarios() {
      try {
        const data = await api.get('/scenarios');
        if (data?.scenarios) {
          setScenarios(data.scenarios);
          if (!selectedScenarioId && data.scenarios.length > 0) {
            setSelectedScenarioId(data.scenarios[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadScenarios();
  }, [selectedScenarioId]);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScenarioId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/sessions', {
        scenarioId: selectedScenarioId,
        customJoinCode: customCode ? customCode.trim().toUpperCase() : undefined,
      });

      if (res?.session) {
        router.push(`/session/${res.session.id}/lobby`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex bg-[#f8fafc] text-slate-900 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-2xl mx-auto space-y-6 overflow-y-auto">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Radio className="w-6 h-6 text-blue-600" />
            <span>Launch New Training Session</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Configure lobby join code and initialize scenario state machine</p>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>}

        <form onSubmit={handleLaunch} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Scenario Module</label>
            <select
              required
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
            >
              {scenarios.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.title} ({sc.fictionalLocation} - {Math.round(sc.durationSeconds / 60)} min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Custom Join Code <span className="text-slate-400 font-normal">(Optional, e.g. ND-CORRIDOR-01)</span>
            </label>
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              placeholder="Leave blank to auto-generate random code"
              className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-300 text-blue-700 font-mono text-xs focus:border-blue-500 outline-none uppercase"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Multiplayer Role Setup</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              When trainees join using the generated join code, they can choose or be assigned their role (Commander, Team Alpha,
              Team Bravo, Air Observation, Logistics Convoy, Observer).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            <span>{loading ? 'Initializing Engine...' : 'Initialize Session Lobby'}</span>
          </button>
        </form>
      </main>
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense fallback={<div className="text-slate-600 text-center py-20">Loading session launcher...</div>}>
      <NewSessionContent />
    </Suspense>
  );
}
