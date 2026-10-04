'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Radio, Plus, Filter, Users, Play, BarChart3, ArrowRight } from 'lucide-react';
import { Sidebar } from '../../../components/layout/Sidebar';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';

export default function SessionsListPage() {
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
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
    async function loadSessions() {
      if (!user) return;
      try {
        let endpoint = '/sessions?';
        if (statusFilter) endpoint += `status=${statusFilter}&`;
        const data = await api.get(endpoint);
        if (data?.sessions) setSessions(data.sessions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, [user, statusFilter]);

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

  return (
    <div className="flex-1 flex bg-[#f8fafc] text-slate-900 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
              <Radio className="w-6 h-6 text-blue-600" />
              <span>Training Sessions</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Manage active, lobby, and completed simulation exercises</p>
          </div>

          <Link
            href="/instructor/sessions/new"
            className="px-4 py-2 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors self-start shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Launch New Session</span>
          </Link>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs outline-none shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="RUNNING">Running / Live</option>
            <option value="LOBBY">In Lobby</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Sessions Table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Join Code</th>
                <th className="py-3 px-4">Scenario Module</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Participants</th>
                <th className="py-3 px-4">Date Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{s.joinCode}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{s.scenario?.title || 'Tactical Module'}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                        s.status === 'RUNNING'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.status === 'COMPLETED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{s.participants?.length || 0} enrolled</td>
                  <td className="py-3.5 px-4 text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {s.status === 'LOBBY' && (
                      <Link
                        href={`/session/${s.id}/lobby`}
                        className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-all inline-block font-semibold"
                      >
                        Lobby
                      </Link>
                    )}
                    <Link
                      href={`/session/${s.id}/monitor`}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 inline-block font-medium"
                    >
                      Monitor
                    </Link>
                    <Link
                      href={`/aar/${s.id}`}
                      className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 inline-block font-medium border border-blue-200"
                    >
                      AAR
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
