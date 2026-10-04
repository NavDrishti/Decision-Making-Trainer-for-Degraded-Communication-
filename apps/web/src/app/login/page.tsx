'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Shield,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  User,
  Key,
  Radio,
  Users,
  Compass,
  Layers,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    { label: 'Commander', email: 'commander@navdrishti.local', role: 'COMMANDER', badge: 'bg-indigo-100 text-indigo-700' },
    { label: 'Instructor', email: 'instructor@navdrishti.local', role: 'INSTRUCTOR', badge: 'bg-amber-100 text-amber-700' },
    { label: 'Team Alpha (Scout)', email: 'alpha@navdrishti.local', role: 'TEAM_OPERATOR', badge: 'bg-sky-100 text-sky-700' },
    { label: 'Team Bravo (Patrol)', email: 'bravo@navdrishti.local', role: 'TEAM_OPERATOR', badge: 'bg-sky-100 text-sky-700' },
    { label: 'Air Observation', email: 'air@navdrishti.local', role: 'TEAM_OPERATOR', badge: 'bg-purple-100 text-purple-700' },
    { label: 'Logistics Convoy', email: 'logistics@navdrishti.local', role: 'TEAM_OPERATOR', badge: 'bg-emerald-100 text-emerald-700' },
    { label: 'Super Admin', email: 'admin@navdrishti.local', role: 'SUPER_ADMIN', badge: 'bg-red-100 text-red-700' },
    { label: 'Observer', email: 'observer@navdrishti.local', role: 'OBSERVER', badge: 'bg-slate-100 text-slate-700' },
  ];

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('ChangeMe!NavDrishti2026');
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.post('/auth/login', {
        email,
        password,
        twoFactorCode: showTwoFactor ? twoFactorCode : undefined,
      });

      if (data.requireTwoFactor) {
        setShowTwoFactor(true);
        setLoading(false);
        return;
      }

      if (data.accessToken && data.user) {
        api.setToken(data.accessToken);
        if (data.refreshToken) {
          api.setRefreshToken(data.refreshToken);
        }
        setUser(data.user);
        router.push('/dashboard');
      } else {
        throw new Error('Invalid response from login server.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-[#f8fafc]">
      {/* LEFT COLUMN: Exactly matching 1st image Hero Section */}
      <div className="lg:w-7/12 relative bg-slate-950 p-8 sm:p-12 lg:p-16 flex flex-col justify-between overflow-hidden">
        {/* Background Image of Mountain Command Center */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-55"
          style={{ backgroundImage: `url('/hero-command-center.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />

        {/* Content Overlay */}
        <div className="relative z-10 space-y-6 max-w-xl my-auto">
          {/* SIH Pill */}
          <div>
            <span className="inline-block px-3 py-1 rounded bg-slate-900/90 border border-slate-700/80 text-xs font-mono font-medium text-slate-300 shadow">
              SIH26248
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            NavDrishti<span className="text-[#38bdf8]">AI</span>
          </h1>

          {/* Subtitle */}
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-normal font-sans">
            Train under uncertainty. Decide with confidence.
          </h2>

          {/* Description */}
          <p className="text-sm text-slate-300 font-normal leading-relaxed">
            Immersive multi-domain decision-making trainer for degraded communication environments.
          </p>

          {/* 4 Feature Items matching photo */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-200">
            <div className="flex flex-col items-start gap-1.5">
              <Users className="w-5 h-5 text-slate-300" />
              <span className="text-xs font-medium text-slate-300 leading-snug">Real-time Multiplayer Exercises</span>
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <Radio className="w-5 h-5 text-slate-300" />
              <span className="text-xs font-medium text-slate-300 leading-snug">Degraded Communication</span>
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <Compass className="w-5 h-5 text-slate-300" />
              <span className="text-xs font-medium text-slate-300 leading-snug">Scenario-based Training</span>
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <Layers className="w-5 h-5 text-slate-300" />
              <span className="text-xs font-medium text-slate-300 leading-snug">Perception vs Ground-Truth Replay</span>
            </div>
          </div>
        </div>

        {/* Safe-Use Footer Note */}
        <div className="relative z-10 pt-6 text-[11px] text-slate-400">
          Synthetic Fictional Sector • Educational Decision Simulator • SIH26248
        </div>
      </div>

      {/* RIGHT COLUMN: Exactly matching 1st image Login Card */}
      <div className="lg:w-5/12 p-6 sm:p-10 flex flex-col justify-center items-center bg-[#f8fafc]">
        <div className="max-w-[390px] w-full space-y-4">
          {/* Card */}
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/60 space-y-5">
            {/* Logo & Header */}
            <div className="text-center space-y-1">
              <Link href="/" className="inline-flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-sky-400 shadow-sm">
                  <Radio className="w-5 h-5 text-sky-500" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  NavDrishti<span className="text-sky-500">AI</span>
                </span>
              </Link>
              <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
              <p className="text-xs text-slate-500">Login to your account</p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-3.5">
              {!showTwoFactor ? (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@navdrishti.ai"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors pr-10"
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
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Eye className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                      <span>Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Two-Factor Authentication Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-widest font-mono text-lg py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Login'}
              </button>
            </form>

            {/* Social login divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-white px-3 text-slate-400">or continue with</span>
              </div>
            </div>

            {/* Social buttons matching photo */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('commander@navdrishti.local')}
                className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-2.5 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('instructor@navdrishti.local')}
                className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-2.5 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
                <span>Continue with Microsoft</span>
              </button>
            </div>

            <div className="text-center text-xs text-slate-500 pt-1">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                Sign up
              </Link>
            </div>
          </div>

          {/* Quick Demo Accounts Drawer */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-800">SIH Evaluator Demo Roles:</span>
              <span className="text-[10px] text-slate-400">1-click fill</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {demoAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => fillDemoAccount(acc.email)}
                  className="text-left px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-500 text-[11px] text-slate-700 hover:text-blue-600 transition-all flex items-center justify-between"
                >
                  <span className="truncate font-medium">{acc.label}</span>
                  <span className={`text-[9px] px-1 py-0.5 rounded font-mono ${acc.badge}`}>
                    {acc.role.substring(0, 4)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
