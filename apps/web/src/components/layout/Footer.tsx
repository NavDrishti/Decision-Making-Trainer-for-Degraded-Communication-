'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Eye, Shield, Lock, Radio } from 'lucide-react';

export function Footer() {
  const pathname = usePathname();
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
    <footer className="w-full border-t border-slate-800 bg-slate-950 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                <Eye className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                NavDrishti<span className="text-sky-400">AI</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Immersive Multi-Domain Decision-Making Trainer for Degraded Communication Environments. Built for Smart India Hackathon
              (SIH26248).
            </p>
            <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs leading-relaxed max-w-lg">
              <strong className="block text-amber-400 mb-0.5 font-semibold">Responsible Training Statement:</strong>
              NavDrishtiAI uses fictional, synthetic data and is intended solely for educational simulations and research. It is
              NOT an operational command, weapon control, targeting, cyber, or electronic-warfare system.
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-slate-300 font-semibold mb-3">Platform Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-sky-400 transition-colors">
                  Product Overview
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-sky-400 transition-colors">
                  About SIH26248
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-sky-400 transition-colors">
                  Security Architecture
                </Link>
              </li>
              <li>
                <Link href="/ar-vr" className="hover:text-sky-400 transition-colors">
                  AR / VR Command Suite
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-sky-400 transition-colors">
                  FAQ & Role Handbook
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-slate-300 font-semibold mb-3">Security & Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-sky-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-sky-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="hover:text-sky-400 transition-colors">
                  Accessibility Statement
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sky-400 hover:underline">
                  Quick Demo Access
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© 2026 NavDrishtiAI. All rights reserved. SIH26248 Full-Stack Solution.</div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Engine Online (v1.0.0)
            </span>
            <span>Zero Real Defence Data</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
