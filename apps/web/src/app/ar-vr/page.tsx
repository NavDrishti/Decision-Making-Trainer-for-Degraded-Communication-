'use client';

import React, { useState } from 'react';
import { Glasses, Sparkles, CheckCircle2, ArrowRight, Layers, Cpu, Radio, Shield } from 'lucide-react';
import { api } from '../../lib/api';

export default function ArVrPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [interestType, setInterestType] = useState('COMMAND_ROOM_VR');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/waitlist/ar-vr', { name, email, organization, interestType, notes });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to join waitlist.');
    } finally {
      setLoading(false);
    }
  };

  const capabilities = [
    {
      title: 'VR Virtual Command Room',
      desc: 'Step into a shared 3D tactical command deck with holographic table projections, physicalized radio dials, and localized spatial audio channels.',
      icon: Glasses,
    },
    {
      title: 'AR Operational Map Overlays',
      desc: 'Project fictional terrain contour lines, route statuses, and unit telemetry directly onto classroom tables or sandboxes via passthrough headsets.',
      icon: Layers,
    },
    {
      title: 'Immersive Team Briefings',
      desc: 'Conduct synchronized pre-mission operational briefings and post-exercise AAR reviews in a shared 3D replay dome with spatial timeline scrubbing.',
      icon: Radio,
    },
    {
      title: 'Cross-Platform Headset Support',
      desc: 'Optimized for OpenXR, WebXR, Meta Quest, Apple Vision Pro, and mobile WebXR tablets without requiring specialized hardware.',
      icon: Cpu,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="space-y-4 border-b border-slate-200 pb-8 text-center max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Research & Prototype Roadmap</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900">AR / VR Command Suite</h1>
          <p className="text-slate-600 text-base leading-relaxed">
            Extending NavDrishtiAI beyond 2D browser canvases into spatial computing environments for immersive command simulations.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilities.map((c, idx) => {
            const Icon = c.icon;
            return (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">{c.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed">{c.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Early Access Form */}
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Request Early Access / Research Pilot</h2>
            <p className="text-xs text-slate-500 mt-1">
              Join the academic preview program to test spatial command post prototypes with your team.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
              <div className="font-bold text-sm">Waitlist Application Received!</div>
              <div className="text-xs text-emerald-700">Thank you for your interest. We will reach out when the spatial sandbox is ready for testing.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Prof. A. K. Verma"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Institutional Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="verma@defense-lab.edu"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Organization / Lab</label>
                  <input
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="SimLab IIT / Emergency Responders"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Area of Primary Focus</label>
                <select
                  value={interestType}
                  onChange={(e) => setInterestType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
                >
                  <option value="COMMAND_ROOM_VR">Virtual Command Post Room (VR)</option>
                  <option value="TABLETOP_AR">Augmented Reality Sand-Table Overlay (AR)</option>
                  <option value="AAR_SPATIAL">Spatial After-Action Replay (WebXR)</option>
                  <option value="HUMAN_FACTORS">Cognitive Load / Ergonomics Study</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Pilot Use-Case Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us about the training scenarios or headsets available at your institution..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-medium text-xs transition-colors flex items-center gap-2 shadow-sm"
              >
                <span>{loading ? 'Submitting...' : 'Apply for Spatial Beta Access'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
