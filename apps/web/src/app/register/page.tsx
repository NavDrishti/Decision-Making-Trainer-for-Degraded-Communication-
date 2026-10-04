'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Shield, Lock, Mail, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('COMMANDER');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.post('/auth/register', {
        fullName,
        email,
        password,
        role,
      });

      if (data?.user) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center bg-[#f8fafc]">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#0066ff] flex items-center justify-center text-white shadow-sm">
              <Eye className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              NavDrishti<span className="text-[#0066ff]">AI</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900">Create Training Account</h2>
          <p className="text-xs text-slate-500">Join immersive degraded-communication simulation exercises</p>
        </div>

        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-5">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="text-lg font-bold text-slate-900">Account Created!</div>
              <p className="text-xs text-slate-600">
                Your account is ready. In this local development environment, your email is automatically verified.
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-2.5 rounded-xl bg-[#0066ff] text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm"
              >
                Proceed to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Capt. Vikram Rathore"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trainee@institution.ac.in"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Primary Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none shadow-sm"
                >
                  <option value="COMMANDER">Commander</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="TEAM_OPERATOR">Team Operator (Scout / Patrol / Convoy / Air)</option>
                  <option value="OBSERVER">Observer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-slate-400 font-normal">(min 12 chars)</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none shadow-sm"
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
                className="w-full py-3 rounded-xl bg-[#0066ff] hover:bg-blue-600 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
