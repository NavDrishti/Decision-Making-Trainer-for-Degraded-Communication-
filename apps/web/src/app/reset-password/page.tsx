'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { api } from '../../lib/api';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || 'ND-DEMO-RESET-TOKEN';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 flex flex-col justify-center items-center bg-[#f8fafc]">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-6">
        <h1 className="text-xl font-bold text-slate-900 text-center">Set New Password</h1>
        {success ? (
          <div className="text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-xs text-slate-600">Your password has been securely updated with Argon2/bcrypt hash.</p>
            <Link
              href="/login"
              className="inline-block px-4 py-2 rounded-xl bg-[#0066ff] text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm"
            >
              Sign In with New Password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Reset Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-mono outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (min 12 chars)</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none shadow-sm"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                  className="absolute right-2.5 p-1.5 text-slate-400 hover:text-slate-800 focus:outline-none transition-colors cursor-pointer z-10 rounded flex items-center justify-center"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-500" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#0066ff] hover:bg-blue-600 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-slate-600 text-center py-20">Loading reset form...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
