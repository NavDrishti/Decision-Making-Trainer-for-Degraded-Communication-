import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 text-slate-300">
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Effective Date: October 2026 | Smart India Hackathon Prototype (SIH26248)</p>
      </div>

      <div className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-white">1. Data Minimization by Design</h2>
        <p>
          NavDrishtiAI collects minimal personal identifiable information (PII). We collect only full names, institutional email
          addresses, role choices, and exercise telemetry (timestamps, messages sent, and decisions made during training sessions).
        </p>

        <h2 className="text-lg font-bold text-white">2. Synthetic Simulation Data</h2>
        <p>
          No real defense telemetry, operational military locations, active frequencies, or weapon systems are stored or processed.
          All geographic points and logistical scenarios are 100% fictional.
        </p>

        <h2 className="text-lg font-bold text-white">3. Retention & Deletion</h2>
        <p>
          Administrators may wipe or archive simulation records at any time. Session logs are retained solely for instructor AAR
          reviews and institutional training metrics.
        </p>
      </div>
    </div>
  );
}
