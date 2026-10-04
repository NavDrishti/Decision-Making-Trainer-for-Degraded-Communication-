'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Key, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function TwoFactorPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.post('/auth/2fa/verify', { token: code });
      if (data.success) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid two-factor code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 flex flex-col justify-center items-center bg-[#f8fafc]">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <Key className="w-10 h-10 text-blue-600 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">Two-Factor Authentication</h1>
          <p className="text-xs text-slate-500">Enter the 6-digit code from your authenticator app</p>
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="w-full text-center tracking-widest text-xl font-mono py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:border-blue-500 outline-none shadow-sm"
          />
          <div className="text-[11px] text-slate-400 text-center">Demo OTP code: 123456</div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#0066ff] hover:bg-blue-600 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
