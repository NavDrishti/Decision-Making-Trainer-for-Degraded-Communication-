'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Plus, Search, Filter, Copy, Edit, Archive, Play, CheckCircle2, ArrowRight } from 'lucide-react';
import { Sidebar } from '../../../components/layout/Sidebar';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';

export default function ScenariosPage() {
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchScenarios = async () => {
    try {
      let endpoint = '/scenarios?';
      if (search) endpoint += `search=${encodeURIComponent(search)}&`;
      if (difficulty) endpoint += `difficulty=${difficulty}&`;
      const data = await api.get(endpoint);
      if (data?.scenarios) setScenarios(data.scenarios);
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchScenarios();
    }
  }, [user, search, difficulty]);

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

  const handleClone = async (id: string) => {
    try {
      await api.post(`/scenarios/${id}/clone`);
      setActionMsg('Scenario cloned successfully as draft.');
      fetchScenarios();
      setTimeout(() => setActionMsg(null), 3000);
    } catch {}
  };

  const handleArchive = async (id: string) => {
    try {
      await api.post(`/scenarios/${id}/archive`);
      setActionMsg('Scenario archived.');
      fetchScenarios();
      setTimeout(() => setActionMsg(null), 3000);
    } catch {}
  };

  return (
    <div className="flex-1 flex bg-[#f8fafc] text-slate-900 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              <Compass className="w-6 h-6 text-blue-600" />
              <span>Scenario Library & Templates</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Create, customize, and clone multi-domain degraded communication training modules
            </p>
          </div>

          <Link
            href="/instructor/scenarios/new"
            className="px-4 py-2 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors self-start shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Scenario</span>
          </Link>
        </div>

        {actionMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMsg}</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scenarios by name, location, or objective..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none shadow-sm"
            />
          </div>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs outline-none shadow-sm"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((sc) => {
            const config = JSON.parse(sc.configurationJson || '{}');
            return (
              <div key={sc.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono font-semibold">
                      {sc.difficulty}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{Math.round(sc.durationSeconds / 60)} minutes</span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">{sc.title}</h2>
                  <div className="text-xs font-semibold text-blue-600">{sc.fictionalLocation}</div>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{sc.description}</p>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>{config.zones?.length || 5} Map Zones</span>
                    <span>{config.routes?.length || 3} Transit Routes</span>
                    <span>{config.scheduledEvents?.length || 11} Degradation Events</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleClone(sc.id)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Clone Scenario"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleArchive(sc.id)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors"
                      title="Archive Scenario"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    href={`/instructor/sessions/new?scenarioId=${sc.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <span>Launch Session</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
