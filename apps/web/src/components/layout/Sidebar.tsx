'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  FileText,
  Users,
  ShieldCheck,
  BarChart3,
  User,
  LogOut,
  Radio,
  PlayCircle,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const isInstructor = user?.role === 'INSTRUCTOR' || user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'SUPER_ADMIN';

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Exercises', href: '/session/ND-SIGNAL-88/simulate', icon: PlayCircle },
    { label: 'Scenarios', href: '/instructor/scenarios', icon: Compass },
    { label: 'Team', href: '/admin', icon: Users },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Reports', href: '/aar/ND-DEMO-AAR', icon: FileText },
    { label: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <aside className="w-56 flex-shrink-0 bg-[#0b1120] text-slate-300 flex flex-col justify-between hidden md:flex min-h-screen border-r border-slate-800/80">
      <div className="p-4 space-y-6">
        {/* Brand in Sidebar */}
        <Link href="/" className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-sky-400">
            <Radio className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            NavDrishti<span className="text-sky-400">AI</span>
          </span>
        </Link>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            let isActive = false;
            if (item.label === 'Reports') {
              isActive = pathname.startsWith('/aar');
            } else if (item.label === 'Analytics') {
              isActive = pathname.startsWith('/analytics');
            } else if (item.href === '/dashboard') {
              isActive = pathname === '/dashboard';
            } else {
              isActive = pathname === item.href || pathname.startsWith(item.href);
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1e3a8a] text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom controls */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        <div className="px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400">
          <div className="text-slate-300 font-semibold mb-0.5">SIH26248 Simulation</div>
          <div>Degraded RF Protocol Active</div>
        </div>

        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
