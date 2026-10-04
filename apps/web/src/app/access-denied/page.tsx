import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen py-12 px-4 flex flex-col justify-center items-center bg-[#f8fafc] text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900">Access Denied (403)</h1>
        <p className="text-xs text-slate-600">
          Your current user role does not possess authorization to view this resource. Contact your Chief Instructor or
          Administrator if you require higher access privileges.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2.5 rounded-xl bg-[#0066ff] text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
