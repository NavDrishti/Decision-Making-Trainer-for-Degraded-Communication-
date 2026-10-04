'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Eye, Radio, Menu, X, ArrowRight, User as UserIcon, LogOut, Terminal } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { ThemeToggle } from '../common/ThemeToggle';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isWorkspacePage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/session') ||
    pathname.startsWith('/aar') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/forgot-password');

  if (isWorkspacePage) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <div className="relative">
              <Eye className="w-5 h-5 text-white" />
              <Radio className="w-3 h-3 text-cyan-200 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              NavDrishti<span className="text-sky-400">AI</span>
            </span>
            <span className="hidden sm:block text-[10px] tracking-wider uppercase text-slate-400 font-mono -mt-1">
              SIH26248 • Decisional Trainer
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors ${
              pathname === '/' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Home
          </Link>
          <Link
            href="/#features"
            className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            Features
          </Link>
          <Link
            href="/scenarios"
            className={`px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors ${
              pathname === '/scenarios' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Scenarios
          </Link>
          <Link
            href="/about"
            className={`px-3 py-1.5 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors ${
              pathname === '/about' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            About
          </Link>
        </nav>

        {/* Right CTA / User controls */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-1.5 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-medium text-sm transition-all flex items-center gap-2 shadow-sm"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/profile"
                className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-sky-300 hover:border-sky-500 transition-colors"
                title={`${user.fullName} (${user.role})`}
              >
                {user.avatarInitials || 'Y'}
              </Link>
              <button
                onClick={() => logout()}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="px-4 py-1.5 text-sm font-medium text-white bg-slate-800/90 border border-slate-700 hover:bg-slate-700/80 rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 text-sm font-medium text-white bg-[#0066ff] hover:bg-blue-600 rounded-lg transition-colors shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 pt-2 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Home
          </Link>
          <Link
            href="/scenarios"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Scenarios Catalog
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            About & SIH26248
          </Link>
          <Link
            href="/security"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Security by Design
          </Link>
          <Link
            href="/ar-vr"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            AR / VR Command Suite (Coming Soon)
          </Link>
          <Link
            href="/help"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Help & Role Guides
          </Link>

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-sky-600 text-white font-medium text-sm"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-center py-2 rounded-lg bg-slate-800 text-slate-300 text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-lg bg-slate-800 text-slate-200 text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-sky-600 text-white font-medium text-sm"
                >
                  Launch Demo
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
