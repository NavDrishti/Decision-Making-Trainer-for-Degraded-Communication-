'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  History,
  Activity,
  Settings,
  Mail,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'TEAMS' | 'USERS' | 'LOGS' | 'HEALTH' | 'WAITLIST'>('TEAMS');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<'ALL' | 'ALPHA' | 'BRAVO' | 'AIR' | 'LOGISTICS'>('ALL');
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const [uRes, logRes, hlthRes, wtRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/audit-logs'),
        api.get('/admin/system-health'),
        api.get('/admin/waitlist'),
      ]);

      if (uRes?.users) setUsers(uRes.users);
      if (logRes?.logs) setAuditLogs(logRes.logs);
      if (hlthRes?.health) setHealth(hlthRes.health);
      if (wtRes?.waitlist) setWaitlist(wtRes.waitlist);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${targetUserId}/role`, { role: newRole });
      setStatusMsg('Role updated successfully.');
      fetchAdminData();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update role.');
    }
  };

  const handleToggleLock = async (targetUserId: string, currentLocked: boolean) => {
    try {
      await api.patch(`/admin/users/${targetUserId}`, { isLocked: !currentLocked });
      setStatusMsg(`Account ${currentLocked ? 'unlocked' : 'locked'} successfully.`);
      fetchAdminData();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle account lock.');
    }
  };

  // Pre-configured Teams matching reference photo Row 5
  const teamCards = [
    {
      id: 'ALPHA',
      name: 'Team Alpha',
      membersCount: 5,
      avatars: [
        { label: 'Y', bg: 'bg-blue-600' },
        { label: 'A', bg: 'bg-purple-600' },
        { label: 'S', bg: 'bg-teal-600' },
        { label: 'P', bg: 'bg-sky-500' },
      ],
      extraCount: '+1',
    },
    {
      id: 'BRAVO',
      name: 'Team Bravo',
      membersCount: 5,
      avatars: [
        { label: 'A', bg: 'bg-purple-600' },
        { label: 'N', bg: 'bg-indigo-600' },
        { label: 'V', bg: 'bg-rose-600' },
      ],
      extraCount: '+1',
    },
    {
      id: 'AIR',
      name: 'Air Unit',
      membersCount: 3,
      avatars: [
        { label: 'A', bg: 'bg-blue-600' },
        { label: 'N', bg: 'bg-teal-600' },
        { label: 'H', bg: 'bg-sky-600' },
      ],
      extraCount: null,
    },
    {
      id: 'LOGISTICS',
      name: 'Logistics',
      membersCount: 4,
      avatars: [
        { label: 'L', bg: 'bg-rose-500' },
        { label: 'P', bg: 'bg-amber-600' },
        { label: 'S', bg: 'bg-emerald-600' },
        { label: 'D', bg: 'bg-blue-500' },
      ],
      extraCount: null,
    },
  ];

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Verifying administrator access...</span>
        </div>
      </div>
    );
  }

  const filteredTeams =
    selectedTeamFilter === 'ALL'
      ? teamCards
      : teamCards.filter((t) => t.id === selectedTeamFilter);

  return (
    <div className="flex-1 flex bg-[#f8fafc] text-slate-800 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto bg-[#f8fafc]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {activeTab === 'TEAMS' ? 'Team Management' : 'Super Administrator Governance'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Multiplayer unit assignments, security audit logs, system telemetry, and waitlist
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              Admin Console
            </span>
          </div>
        </div>

        {statusMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('TEAMS')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'TEAMS'
                ? 'bg-[#0066ff] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Teams ({teamCards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'USERS'
                ? 'bg-[#0066ff] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'LOGS'
                ? 'bg-[#0066ff] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('HEALTH')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'HEALTH'
                ? 'bg-[#0066ff] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>System Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('WAITLIST')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'WAITLIST'
                ? 'bg-[#0066ff] text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>AR/VR Waitlist ({waitlist.length})</span>
          </button>
        </div>

        {/* 1. TEAMS TAB matching reference photo (bottom right) */}
        {activeTab === 'TEAMS' && (
          <div className="space-y-4">
            {/* Top Bar with filter pills and + Create Team button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 text-xs font-semibold bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setSelectedTeamFilter('ALL')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedTeamFilter === 'ALL'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All Teams
                </button>
                <button
                  onClick={() => setSelectedTeamFilter('ALPHA')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedTeamFilter === 'ALPHA'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Team Alpha
                </button>
                <button
                  onClick={() => setSelectedTeamFilter('BRAVO')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedTeamFilter === 'BRAVO'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Team Bravo
                </button>
                <button
                  onClick={() => setSelectedTeamFilter('AIR')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedTeamFilter === 'AIR'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Air Unit
                </button>
                <button
                  onClick={() => setSelectedTeamFilter('LOGISTICS')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedTeamFilter === 'LOGISTICS'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Logistics
                </button>
              </div>

              <button
                onClick={() => alert('New team creation modal ready.')}
                className="px-4 py-2 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create Team</span>
              </button>
            </div>

            {/* Grid of Team Cards matching photo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredTeams.map((team) => (
                <div
                  key={team.id}
                  className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{team.name}</h3>
                    <p className="text-xs text-slate-500">{team.membersCount} Members</p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {/* Member Avatars */}
                    <div className="flex items-center -space-x-1.5">
                      {team.avatars.map((av, idx) => (
                        <div
                          key={idx}
                          className={`w-7 h-7 rounded-full ${av.bg} text-white flex items-center justify-center font-bold text-[11px] border-2 border-white shadow-sm`}
                        >
                          {av.label}
                        </div>
                      ))}
                      {team.extraCount && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-semibold text-[10px] border-2 border-white">
                          {team.extraCount}
                        </div>
                      )}
                    </div>

                    {/* Manage Button */}
                    <button
                      onClick={() => alert(`Managing settings for ${team.name}`)}
                      className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. USERS TAB */}
        {activeTab === 'USERS' && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Security Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.fullName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="px-2 py-1 rounded bg-slate-50 border border-slate-300 text-blue-700 font-mono text-[11px] outline-none"
                      >
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        <option value="INSTRUCTOR">INSTRUCTOR</option>
                        <option value="COMMANDER">COMMANDER</option>
                        <option value="TEAM_OPERATOR">TEAM_OPERATOR</option>
                        <option value="OBSERVER">OBSERVER</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {u.isLocked ? (
                        <span className="text-red-600 font-semibold flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> Locked
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleLock(u.id, u.isLocked)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] transition-colors"
                      >
                        {u.isLocked ? 'Unlock' : 'Lock Account'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. AUDIT LOGS TAB */}
        {activeTab === 'LOGS' && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">IP Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.action}</td>
                    <td className="py-3 px-4">{log.user?.fullName || log.userId || 'System'}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. HEALTH TELEMETRY */}
        {activeTab === 'HEALTH' && health && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs text-slate-500">Service Status</span>
              <div className="text-2xl font-bold text-emerald-600">{health.status}</div>
              <div className="text-[11px] text-slate-500">Uptime: {health.uptimeSeconds}s</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs text-slate-500">Memory Allocation</span>
              <div className="text-2xl font-bold text-blue-600">{health.memoryUsage?.rssMb} MB</div>
              <div className="text-[11px] text-slate-500">Heap: {health.memoryUsage?.heapUsedMb} MB</div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs text-slate-500">Database Engine</span>
              <div className="text-2xl font-bold text-slate-900">Active</div>
              <div className="text-[11px] text-slate-500">Prisma / SQLite Connected</div>
            </div>
          </div>
        )}

        {/* 5. AR/VR WAITLIST */}
        {activeTab === 'WAITLIST' && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Applicant</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Organization</th>
                  <th className="py-2.5 px-4">Interest Area</th>
                  <th className="py-2.5 px-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {waitlist.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{entry.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{entry.email}</td>
                    <td className="py-3 px-4">{entry.organization || 'Independent'}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{entry.interestType}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
