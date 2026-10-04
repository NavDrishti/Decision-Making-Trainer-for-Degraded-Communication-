'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Shield, Lock, Smartphone, Key, History, LogOut, CheckCircle2, AlertTriangle, Sun } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, isLoading, initAuth } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 2FA Setup
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [twoFactorMsg, setTwoFactorMsg] = useState<string | null>(null);

  // Sessions & Security Events
  const [sessions, setSessions] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);

  useEffect(() => {
    if (user?.fullName) setFullName(user.fullName);

    async function loadSecurityData() {
      try {
        const sessData = await api.get('/auth/sessions');
        if (sessData?.sessions) setSessions(sessData.sessions);

        const evData = await api.get('/users/me/security-events');
        if (evData?.events) setSecurityEvents(evData.events);
      } catch (err) {
        console.error('Failed to load profile security data:', err);
      }
    }

    loadSecurityData();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api.patch('/users/me', { fullName });
      if (data?.user) {
        setUser(data.user);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch {}
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword.length < 12) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 12 characters.' });
      return;
    }
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password successfully updated. All other active sessions revoked.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    }
  };

  const handleStart2Fa = async () => {
    try {
      const data = await api.post('/auth/2fa/setup');
      if (data?.secret) {
        setTwoFactorSetup(data);
      }
    } catch (err: any) {
      setTwoFactorMsg(err.message || 'Failed to initialize 2FA.');
    }
  };

  const handleVerify2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api.post('/auth/2fa/verify', { token: twoFactorCode });
      if (data?.success) {
        setRecoveryCodes(data.recoveryCodes || []);
        setTwoFactorSetup(null);
        setTwoFactorMsg('Two-Factor Authentication is now ENABLED on your account!');
        if (user) setUser({ ...user, twoFactorEnabled: true });
      }
    } catch (err: any) {
      setTwoFactorMsg(err.message || 'Verification failed.');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {}
  };

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading profile credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-[#f8fafc] text-slate-900 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto space-y-6 overflow-y-auto">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Profile & Account Security</h1>
          <p className="text-xs text-slate-500 mt-1">Manage institutional credentials, 2FA, and device sessions</p>
        </div>

        {/* 1. Account Details */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>Operational Credentials</span>
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            {profileSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Profile updated successfully.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email (Institutional ID)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Assigned System Role</label>
              <div className="text-xs font-mono font-bold text-blue-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                {user?.role || 'COMMANDER'}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Active Visual Theme</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>High-Visibility Tactical White Theme (Mandatory Standard)</span>
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white text-xs font-semibold shadow-sm"
            >
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* 2. Change Password */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Change Master Password</span>
          </h2>

          {passwordMsg && (
            <div
              className={`p-3 rounded-lg text-xs ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">New Password (min 12 characters)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* 3. Two-Factor Authentication (TOTP) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Two-Factor Authentication (2FA)</span>
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded font-semibold ${
                user?.twoFactorEnabled
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {user?.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>

          {twoFactorMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              {twoFactorMsg}
            </div>
          )}

          {!user?.twoFactorEnabled && !twoFactorSetup && (
            <div>
              <p className="text-xs text-slate-600 mb-3">
                Secure your simulation account with time-based one-time password (TOTP) codes compatible with Google Authenticator
                and 1Password.
              </p>
              <button
                onClick={handleStart2Fa}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
              >
                Set Up Two-Factor Authentication
              </button>
            </div>
          )}

          {twoFactorSetup && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 max-w-md">
              <div className="text-xs text-slate-700">
                1. Add this manual secret key to your authenticator app:
                <div className="p-2 rounded bg-white border border-slate-200 font-mono text-xs text-blue-700 my-2 select-all">
                  {twoFactorSetup.secret}
                </div>
              </div>

              <form onSubmit={handleVerify2Fa} className="space-y-3">
                <label className="block text-xs font-medium text-slate-700">
                  2. Enter generated 6-digit code (Demo code: <strong>123456</strong>):
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-base font-mono py-2 rounded-lg bg-white border border-slate-300 text-blue-700 outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                >
                  Confirm & Enable 2FA
                </button>
              </form>
            </div>
          )}

          {recoveryCodes.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="text-xs font-bold text-amber-800">Save Your Emergency Recovery Codes:</div>
              <div className="grid grid-cols-3 gap-2">
                {recoveryCodes.map((c, i) => (
                  <span key={i} className="font-mono text-xs text-amber-900 bg-white border border-amber-200 px-2 py-1 rounded text-center">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Active Device Sessions */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-600" />
            <span>Active Logged-in Devices</span>
          </h2>

          <div className="divide-y divide-slate-100 text-xs">
            {sessions.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900 truncate max-w-sm">{s.userAgent}</div>
                  <div className="text-[11px] text-slate-500">
                    IP: {s.ipAddress} • Last active: {new Date(s.lastUsedAt).toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeSession(s.id)}
                  className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Security Events Audit */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span>Recent Security Audit Log</span>
          </h2>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {securityEvents.map((ev) => (
              <div key={ev.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex justify-between">
                <div>
                  <span className="font-mono font-bold text-blue-700">{ev.action}</span>
                  <span className="text-slate-500 ml-2">from {ev.ipAddress}</span>
                </div>
                <span className="text-[11px] text-slate-400">{new Date(ev.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
