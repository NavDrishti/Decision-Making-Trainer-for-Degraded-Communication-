import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 text-slate-300">
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Terms of Service & Training Agreement</h1>
        <p className="text-xs text-slate-400">SIH26248 Solution Standard Terms</p>
      </div>

      <div className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-white">1. Authorized Training Purpose</h2>
        <p>
          NavDrishtiAI is a training simulator and educational serious game. It is expressly prohibited from being used for
          kinetic operational targeting, live defense operations, offensive cyber operations, or weapon telemetry.
        </p>

        <h2 className="text-lg font-bold text-white">2. Simulated Degradation Acceptance</h2>
        <p>
          By joining an exercise, participants acknowledge that the server will intentionally simulate packet drops, message
          latencies, and contradictory intelligence to train psychological resilience under friction.
        </p>

        <h2 className="text-lg font-bold text-white">3. Intellectual Property</h2>
        <p>
          The architecture, ComRes Index algorithm, and deterministic scenario engine are developed under Smart India Hackathon
          guidelines.
        </p>
      </div>
    </div>
  );
}
