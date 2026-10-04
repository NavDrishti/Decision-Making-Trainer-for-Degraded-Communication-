'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // Don't reveal account existence
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 flex flex-col justify-center items-center bg-[#f8fafc]">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-6">
        <h1 className="text-xl font-bold text-slate-900 text-center">Reset Your Password</h1>
        {submitted ? (
          <div className="text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-xs text-slate-600">
              If your email is registered, instructions have been logged. In this local demo environment, you may proceed directly to
              the reset page.
            </p>
            <Link
              href="/reset-password?token=ND-DEMO-RESET-TOKEN"
              className="inline-block px-4 py-2 rounded-xl bg-[#0066ff] text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm"
            >
              Open Password Reset Form
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-500">
              Enter your email address and we'll transmit a secure one-time reset link.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@navdrishti.local"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#0066ff] hover:bg-blue-600 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              {loading ? 'Transmitting...' : 'Send Reset Link'}
            </button>
            <div className="text-center">
              <Link href="/login" className="text-xs text-slate-500 hover:text-blue-600 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
