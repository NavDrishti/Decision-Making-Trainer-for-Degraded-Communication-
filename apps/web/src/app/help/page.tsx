'use client';

import React, { useState } from 'react';
import { HelpCircle, BookOpen, Send, CheckCircle2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

export default function HelpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('COMMANDER');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/support', { name, email, role, subject, message });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  const glossary = [
    { term: 'Ground Truth', desc: 'The actual, objective state of routes, units, hazards, and channels in the scenario engine.' },
    { term: 'Perceived Truth', desc: 'The subjective view visible to an individual role based only on messages and intel received.' },
    { term: 'Information Gap', desc: 'The measurable difference between what exists in ground truth and what a trainee currently knows.' },
    { term: 'Information Freshness', desc: 'The elapsed time since an observation or aerial feed was generated (e.g., 85s old).' },
    { term: 'Stale Information', desc: 'Intel that may have been accurate previously but no longer reflects current physical conditions.' },
    { term: 'Primary Channel', desc: 'Standard high-bandwidth radio/network communication link, vulnerable to simulated RF jamming or delay.' },
    { term: 'Backup Channel', desc: 'Secondary satellite/HF failover link activated when primary communication degrades.' },
    { term: 'ComRes Index', desc: 'Communication Resilience Index: explainable 100-point metric evaluating adaptation under uncertainty.' },
  ];

  const roleGuides = [
    { role: 'COMMANDER', guide: 'Synthesizes field reports, resolves conflicting intelligence, issues movement orders, and records formal decision rationales.' },
    { role: 'TEAM_ALPHA (Scout)', guide: 'Executes reconnaissance along northern mountain passes, identifies route blockages, and retransmits status when degraded.' },
    { role: 'TEAM_BRAVO (Patrol)', guide: 'Secures southern contingency corridors and reports road transit conditions.' },
    { role: 'AIR_OBSERVATION', guide: 'Monitors aerial drone imagery, checks timestamp freshness, and alerts command to overhead route statuses.' },
    { role: 'LOGISTICS', guide: 'Controls high-value relief convoy vehicles, awaits confirmed routing clearances, and verifies order acknowledgements.' },
    { role: 'INSTRUCTOR', guide: 'Oversees complete ground truth, starts/pauses exercises, injects manual delays and channel disruptions, and leads AAR reviews.' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="space-y-4 border-b border-slate-200 pb-8 bg-white p-8 rounded-2xl shadow-sm border">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            Operational Knowledge Base
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900">Help Center & Role Handbook</h1>
          <p className="text-slate-600 text-base leading-relaxed max-w-3xl">
            Comprehensive guide to navigating degraded communication exercises, understanding simulator terms, and operating role
            interfaces.
          </p>
        </div>

        {/* Glossary */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Tactical Terminology Glossary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {glossary.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
                <div className="text-sm font-bold text-blue-700 font-mono">{item.term}</div>
                <div className="text-xs text-slate-600 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Guides */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Role Briefings & Responsibilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleGuides.map((rg, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide">{rg.role}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{rg.guide}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support / Feedback Form */}
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Contact Platform Support</h2>
            <p className="text-xs text-slate-500 mt-1">
              Questions regarding simulation setups, evaluation criteria, or institutional deployments? Send a message to our team.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
              <div className="font-bold text-sm">Support Request Dispatched!</div>
              <div className="text-xs text-emerald-700">A NavDrishtiAI coordinator has received your ticket and will respond soon.</div>
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
                    placeholder="e.g. Capt. Sharma"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@institution.ac.in"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role / Affiliation</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
                  >
                    <option value="COMMANDER">Commander</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="STUDENT_TRAINEE">Student / Trainee</option>
                    <option value="EVALUATOR">Hackathon Evaluator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Question about ComRes Index or scenario customization"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry or platform feedback..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-medium text-xs transition-colors flex items-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Submitting...' : 'Submit Support Request'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
