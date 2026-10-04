'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlayCircle,
  BarChart3,
  Compass,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  Radio,
  ChevronRight,
  CloudSun,
  Wind,
  Droplets,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();
  const [sessions, setSessions] = useState<any[]>([]);

  // Real-time Free Online API State (Open-Meteo Atmospheric & Weather Telemetry)
  const [liveWeather, setLiveWeather] = useState<{
    temp: number;
    wind: number;
    humidity: number;
    weatherCode: number;
    rfRisk: 'LOW' | 'MODERATE' | 'HIGH';
    updatedAt: string;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const data = await api.get('/sessions');
        if (data?.sessions) {
          setSessions(data.sessions);
        }
      } catch (err) {
        console.error('Failed to load dashboard sessions:', err);
      }
    }
    loadData();

    // Fetch from Free Public Online API (Open-Meteo) for Indian Himalayan Mountain Sector
    async function fetchLiveOnlineTelemetry() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=34.285&longitude=75.480&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code'
        );
        if (res.ok) {
          const json = await res.json();
          if (json?.current) {
            const wind = json.current.wind_speed_10m || 0;
            const humidity = json.current.relative_humidity_2m || 0;
            const rfRisk = wind > 25 || humidity > 85 ? 'HIGH' : wind > 10 || humidity > 70 ? 'MODERATE' : 'LOW';

            setLiveWeather({
              temp: json.current.temperature_2m,
              wind: json.current.wind_speed_10m,
              humidity: json.current.relative_humidity_2m,
              weatherCode: json.current.weather_code,
              rfRisk,
              updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            });
          }
        }
      } catch (e) {
        console.warn('Online weather API fallback:', e);
      } finally {
        setWeatherLoading(false);
      }
    }
    fetchLiveOnlineTelemetry();
  }, []);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Loading command dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-[#f8fafc] text-slate-800 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        {/* Top Header matching photo */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500">
                Welcome back, {user?.fullName || 'Operator'}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {user?.role === 'SUPER_ADMIN' ? 'Admin' : 'Team Member'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell with red alert dot */}
            <button className="relative p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
              <Radio className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>

            {/* User Profile Pill */}
            <Link
              href="/profile"
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-200 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {user?.avatarInitials || user?.fullName?.[0] || 'O'}
              </div>
              <span className="text-xs font-semibold text-slate-800">
                {user?.fullName?.split(' ')[0] || 'Operator'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90" />
            </Link>
          </div>
        </div>

        {/* 5 Top Metric Cards matching photo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Active Exercise */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Active Exercise</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                In Progress
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">MountainPass-01</div>
            <div className="text-[11px] text-slate-500 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> 3 of 32
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Elapsed 00:28:15
              </span>
            </div>
            <Link
              href="/session/ND-SIGNAL-88/simulate"
              className="w-full py-1.5 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1 shadow-sm mt-1"
            >
              <span>Join Exercise</span>
            </Link>
          </div>

          {/* Card 2: Completed Exercises */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-medium text-slate-500">Completed Exercises</div>
            <div className="text-2xl font-bold text-slate-900">8</div>
            <div className="text-[11px] font-medium text-emerald-600">+2 this month</div>
          </div>

          {/* Card 3: Avg. Decision Score */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-medium text-slate-500">Avg. Decision Score</div>
            <div className="text-2xl font-bold text-slate-900">78%</div>
            <div className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +12%
            </div>
          </div>

          {/* Card 4: Total Training Hours */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-medium text-slate-500">Total Training Hours</div>
            <div className="text-2xl font-bold text-slate-900">12.5</div>
            <div className="text-[11px] font-medium text-emerald-600">+4.5 this month</div>
          </div>

          {/* Card 5: Upcoming Scenarios */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-medium text-slate-500">Upcoming Scenarios</div>
            <div className="text-2xl font-bold text-slate-900">3</div>
            <Link
              href="/instructor/scenarios"
              className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* FREE ONLINE PUBLIC API DEMO CARD: Live Open-Meteo Environmental & RF Telemetry */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-xs font-bold text-slate-900">
                Live Environmental & RF Telemetry (Online Public API Integration)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Open-Meteo Public API
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Corridor Coords: 34.28°N, 75.48°E (Zojila Pass, Ladakh) • Updated: {liveWeather?.updatedAt || 'Live'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2.5">
              <CloudSun className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Corridor Temp</div>
                <div className="font-bold text-slate-900">
                  {weatherLoading ? 'Loading...' : `${liveWeather?.temp ?? 14.6} °C`}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2.5">
              <Wind className="w-5 h-5 text-sky-500" />
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Mountain Wind</div>
                <div className="font-bold text-slate-900">
                  {weatherLoading ? 'Loading...' : `${liveWeather?.wind ?? 2.1} km/h`}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2.5">
              <Droplets className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Atmospheric Humidity</div>
                <div className="font-bold text-slate-900">
                  {weatherLoading ? 'Loading...' : `${liveWeather?.humidity ?? 68} %`}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-indigo-500" />
              <div>
                <div className="text-[10px] text-slate-500 font-medium">Atmospheric RF Risk</div>
                <div className="font-bold text-emerald-600">
                  {weatherLoading ? 'Evaluating...' : `${liveWeather?.rfRisk ?? 'LOW'} (Clear RF)`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Area: Recent Exercises (Left) & Quick Actions (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Table (2/3 width) */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Recent Exercises</h2>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <tr>
                    <th className="py-2.5 px-4">Scenario</th>
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">River Crossing</td>
                    <td className="py-3 px-3">Bravo</td>
                    <td className="py-3 px-3 text-slate-500">Field Operator</td>
                    <td className="py-3 px-3 text-slate-500">20 Sep 2026</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                        +32%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href="/aar/ND-DEMO-AAR"
                        className="px-3 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">Supply Convoy</td>
                    <td className="py-3 px-3">Logistics</td>
                    <td className="py-3 px-3 text-slate-500">Logistics Operator</td>
                    <td className="py-3 px-3 text-slate-500">18 Sep 2026</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                        76%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href="/aar/ND-DEMO-AAR"
                        className="px-3 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">Urban Coordination</td>
                    <td className="py-3 px-3">Alpha</td>
                    <td className="py-3 px-3 text-slate-500">Team Lead</td>
                    <td className="py-3 px-3 text-slate-500">15 Sep 2026</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold">
                        65%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href="/aar/ND-DEMO-AAR"
                        className="px-3 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Quick Actions Card (1/3 width) matching photo */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
              <Link
                href="/session/ND-SIGNAL-88/simulate"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                    Join Exercise
                  </div>
                  <div className="text-[11px] text-slate-500">Enter ongoing session</div>
                </div>
              </Link>

              <Link
                href="/instructor/scenarios"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-purple-600">
                    Browse Scenarios
                  </div>
                  <div className="text-[11px] text-slate-500">Explore available training modules</div>
                </div>
              </Link>

              <Link
                href="/analytics"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-amber-600">
                    Performance Analytics
                  </div>
                  <div className="text-[11px] text-slate-500">Check metrics, ComRes & AAR</div>
                </div>
              </Link>

              <Link
                href="/admin"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-600">
                    Team Management
                  </div>
                  <div className="text-[11px] text-slate-500">Manage your team and roles</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
