import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen py-12 px-4 flex flex-col justify-center items-center bg-[#f8fafc] text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900">Email Verified</h1>
        <p className="text-xs text-slate-600">
          Your institutional account has been verified. You may now participate in simulation exercises.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2.5 rounded-xl bg-[#0066ff] text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
