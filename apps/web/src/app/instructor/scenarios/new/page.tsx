'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, CheckCircle2, ArrowRight, ArrowLeft, Plus, Trash2, MapPin, Radio, AlertTriangle } from 'lucide-react';
import { Sidebar } from '../../../../components/layout/Sidebar';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';
import { defaultScenarioData } from '../../../../../../api/src/modules/scenarios/default-scenario';

export default function NewScenarioPage() {
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    initAuth();
  }, [initAuth]);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Verifying authorization...</span>
        </div>
      </div>
    );
  }

  // Form State
  const [title, setTitle] = useState('MountainPass-02');
  const [fictionalLocation, setFictionalLocation] = useState('Karakoram Synthetic Sector');
  const [description, setDescription] = useState(
    'Coordinated movement through a mountain pass with degraded communication and route blockage.'
  );
  const [objective, setObjective] = useState(
    'Escort medical supplies to northern civilian post while navigating packet loss and weather route blockage.'
  );
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [durationMinutes, setDurationMinutes] = useState(10);

  // Degradation Events State
  const [events, setEvents] = useState<any[]>([
    {
      id: 'evt-custom-1',
      triggerAtSeconds: 60,
      type: 'REPORT_CREATED',
      targetRole: 'TEAM_ALPHA',
      description: 'Alpha scout reports route blockage debris',
      payload: { content: 'North pass debris observed. Impassable.' },
    },
    {
      id: 'evt-custom-2',
      triggerAtSeconds: 150,
      type: 'CHANNEL_DEGRADED',
      targetRole: 'TEAM_ALPHA',
      description: 'Primary channel incurs 45s latency delay',
      payload: { delaySeconds: 45 },
    },
    {
      id: 'evt-custom-3',
      triggerAtSeconds: 270,
      type: 'MESSAGE_DROPPED',
      targetRole: 'TEAM_BRAVO',
      description: 'Bravo message dropped by simulated interference',
      payload: { dropped: true },
    },
  ]);

  const addEvent = () => {
    setEvents([
      ...events,
      {
        id: `evt-custom-${events.length + 1}`,
        triggerAtSeconds: 180,
        type: 'CHANNEL_DEGRADED',
        targetRole: 'TEAM_ALPHA',
        description: 'New degradation injected',
        payload: { delaySeconds: 30 },
      },
    ]);
  };

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);

    const scenarioPayload = {
      title,
      fictionalLocation,
      description,
      objective,
      difficulty,
      durationSeconds: durationMinutes * 60,
      status: 'PUBLISHED',
      configurationJson: JSON.stringify({
        ...defaultScenarioData,
        title,
        fictionalLocation,
        description,
        objective,
        difficulty,
        durationSeconds: durationMinutes * 60,
        scheduledEvents: events,
      }),
      scoreWeightsJson: JSON.stringify(defaultScenarioData.scoreWeights),
    };

    try {
      const res = await api.post('/scenarios', scenarioPayload);
      if (res?.scenario) {
        router.push('/instructor/scenarios');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create scenario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex bg-[#f8fafc] text-slate-900 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto space-y-6 overflow-y-auto">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Compass className="w-7 h-7 text-blue-600" />
            <span>Scenario Builder Wizard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Design deterministic degraded-communication training exercises</p>
        </div>

        {/* Wizard Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 text-xs font-semibold">
          {[
            { num: 1, label: 'Basic Info' },
            { num: 2, label: 'Map & Environment' },
            { num: 3, label: 'Degradation Events' },
            { num: 4, label: 'Review & Publish' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 pb-2 transition-all ${
                step === s.num
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : step > s.num
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === s.num
                    ? 'bg-[#0066ff] text-white'
                    : step > s.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Basic Info</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Scenario Name</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="MountainPass-02"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Coordinated movement through a mountain pass with degraded communication and route blockage."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Scenario Type</label>
                    <select
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs outline-none"
                    >
                      <option>Multi-domain Coordination</option>
                      <option>Convoy Relief</option>
                      <option>Search & Rescue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Difficulty Level</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs outline-none"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Estimated Duration</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs outline-none"
                  >
                    <option value={10}>10 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
              </div>

              {/* Upload Map Dropzone with Satellite Thumbnail */}
              <div className="flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Operational Map</label>
                  <div
                    className="h-44 rounded-xl border border-slate-300 bg-cover bg-center relative overflow-hidden flex flex-col items-center justify-end p-3 shadow-inner"
                    style={{ backgroundImage: `url('/satellite-map.jpg')` }}
                  >
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative text-center text-white space-y-1">
                      <div className="text-xs font-bold flex items-center justify-center gap-1">
                        <Compass className="w-3.5 h-3.5" /> Upload Map
                      </div>
                      <div className="text-[10px] text-slate-200">or drag and drop a map image</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-2 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Map & Setup */}
        {step === 2 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Step 2: Tactical Corridors & Zones</h2>
            <p className="text-xs text-slate-600">
              The scenario engine links 3 tactical transit paths from Base Orion to Zone C:
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">North Ridge Pass (Route A)</div>
                  <div className="text-slate-500 text-[11px]">Direct mountain corridor • Target for rockslide debris injection</div>
                </div>
                <span className="text-red-600 font-mono font-semibold">BLOCKED at 01:00</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">Central Corridor Highway (Route B)</div>
                  <div className="text-slate-500 text-[11px]">Primary highway • Target for flash weather degradation</div>
                </div>
                <span className="text-amber-600 font-mono font-semibold">DEGRADED at 05:00</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">South Valley Bypass (Route C)</div>
                  <div className="text-slate-500 text-[11px]">Longer contingency route • Secure and clear</div>
                </div>
                <span className="text-emerald-600 font-mono font-semibold">CLEAR (Optimal)</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <span>Continue to Degradation Events</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Degradation Events */}
        {step === 3 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Step 3: Degradation Injection Schedule</h2>
                <p className="text-xs text-slate-500">Configure deterministic message delays, dropouts, and channel failures</p>
              </div>
              <button
                type="button"
                onClick={addEvent}
                className="px-3 py-1.5 rounded-lg bg-[#0066ff] text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
            </div>

            <div className="space-y-3">
              {events.map((ev, index) => (
                <div key={ev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-700">T+{ev.triggerAtSeconds}s</span>
                      <span className="font-semibold text-slate-900">{ev.type}</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[10px] text-blue-700 font-semibold">{ev.targetRole}</span>
                    </div>
                    <div className="text-slate-600 text-[11px]">{ev.description}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEvent(index)}
                    className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-2 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <span>Review & Publish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Publish */}
        {step === 4 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900">Step 4: Review & Validate Scenario</h2>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Scenario Name:</span>
                <span className="font-bold text-slate-900">{title}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Synthetic Location:</span>
                <span className="font-bold text-blue-700">{fictionalLocation}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Difficulty / Duration:</span>
                <span className="font-bold text-slate-900">
                  {difficulty} • {durationMinutes} Minutes
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Degradations:</span>
                <span className="font-bold text-emerald-700">{events.length} Events Configured</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>Validation Passed: Deterministic timeline, route nodes, and score weights verified.</span>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handlePublish}
                className="px-8 py-2.5 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-bold text-xs shadow-sm transition-all"
              >
                {loading ? 'Publishing...' : 'Publish Scenario to Library'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
