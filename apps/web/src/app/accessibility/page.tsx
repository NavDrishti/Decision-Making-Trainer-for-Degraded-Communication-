import React from 'react';

export default function AccessibilityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 text-slate-300">
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Accessibility Commitment (WCAG 2.1)</h1>
        <p className="text-xs text-slate-400">NavDrishtiAI Accessible Serious Game Standards</p>
      </div>

      <div className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-white">1. High-Contrast Tactical Visuals</h2>
        <p>
          NavDrishtiAI avoids color-only status indicators. All route disruptions and channel degradations combine iconography,
          distinctive line styling (solid, dashed, dotted), and explicit textual labels to ensure accessibility for color-blind
          users.
        </p>

        <h2 className="text-lg font-bold text-white">2. Keyboard Navigation & Screen Readers</h2>
        <p>
          Interactive controls feature visible focus outlines, ARIA role tags, and semantic landmark elements. Tactical feeds and
          chat logs support keyboard tab progression.
        </p>

        <h2 className="text-lg font-bold text-white">3. Reduced Motion Support</h2>
        <p>
          The interface honors system-level prefers-reduced-motion preferences, disabling high-frequency pulse animations on map
          overlays and HUD badges.
        </p>
      </div>
    </div>
  );
}
