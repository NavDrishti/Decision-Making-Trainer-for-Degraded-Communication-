import React from 'react';
import Link from 'next/link';
import { Clock, ShieldAlert } from 'lucide-react';

export default function SessionExpiredPage() {
  return (
    <div className="min-h-screen py-12 px-4 flex flex-col justify-center items-center bg-[#f8fafc] text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
        <Clock className="w-12 h-12 text-amber-500 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900">Session Expired</h1>
        <p className="text-xs text-slate-600">
          Your secure authentication token has expired due to inactivity. Please log in again.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2.5 rounded-xl bg-[#0066ff] text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm"
        >
          Sign In Again
        </Link>
      </div>
    </div>
  );
}
