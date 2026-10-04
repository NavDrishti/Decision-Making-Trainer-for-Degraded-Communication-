import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Key, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export default function SecurityPage() {
  const securityPillars = [
    {
      title: 'Server-Side Role-Based Access Control (RBAC)',
      desc: 'Permissions are verified on every single REST API route and WebSocket event. Trainees cannot access instructor ground truth or hidden role states through frontend manipulation.',
      icon: Shield,
    },
    {
      title: 'Data Minimization & Synthetic Isolation',
      desc: 'No real defense data, classified radio frequencies, targeting information, or real-world operational coordinates are used. All maps and assets are synthetic and fictional.',
      icon: Key,
    },
    {
      title: 'Defense-in-Depth Authentication',
      desc: 'Passwords hashed with salted Argon2id/bcrypt. Short-lived 15-minute access tokens paired with rotating HttpOnly SameSite refresh tokens and optional RFC 6238 TOTP 2FA.',
      icon: Lock,
    },
    {
      title: 'Comprehensive Immutable Audit Logging',
      desc: 'High-risk actions, instructor event injections, session starts, user role changes, and AAR exports are permanently recorded with timestamps and network provenance.',
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="space-y-4 border-b border-slate-200 pb-8 bg-white p-8 rounded-2xl shadow-sm border">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
            Security by Design
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900">Security & Trust Architecture</h1>
          <p className="text-slate-600 text-base leading-relaxed max-w-3xl">
            NavDrishtiAI applies institutional-grade security controls to protect exercise integrity, prevent data leakage, and ensure
            fair and reproducible training evaluations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityPillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-900">{p.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Watermarking & Export Control */}
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Watermarked AAR Exports & Compliance</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            All generated reports and after-action review documents are stamped with an indelible cryptographic SHA-256 integrity hash, session ID, exporter identity, and simulation classification banner. This guarantees that training records remain non-repudiable and tamper-evident.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Fully compliant with institutional academic audit requirements.</span>
          </div>
        </div>

        {/* Back Link */}
        <div className="flex justify-end">
          <Link
            href="/dashboard"
            className="px-6 py-2.5 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-medium text-sm transition-all shadow-sm inline-flex items-center gap-2"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
