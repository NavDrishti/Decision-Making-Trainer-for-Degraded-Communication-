'use client';

import React from 'react';
import { Sun } from 'lucide-react';

export function ThemeToggle() {
  return (
    <div
      className="p-1.5 rounded-lg border border-slate-700/60 bg-slate-900/50 text-slate-300 flex items-center gap-1.5 text-xs font-medium"
      title="High-Visibility Tactical White Theme Active"
    >
      <Sun className="w-3.5 h-3.5 text-amber-400" />
      <span className="hidden sm:inline text-[11px] text-slate-300">White Theme</span>
    </div>
  );
}
