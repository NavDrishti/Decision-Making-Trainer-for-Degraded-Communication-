'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Radio,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Shield,
  Eye,
  ArrowRight,
  MessageSquare,
  HelpCircle,
  Truck,
  FileCheck,
  MapPin,
  Users,
  Target,
  ListOrdered,
  FileText,
  ChevronDown,
  Activity,
  Battery,
  Wifi,
  WifiOff,
  LayoutDashboard,
} from 'lucide-react';
import { TacticalMap } from '../../../../components/map/TacticalMap';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../stores/authStore';
import { getSocket } from '../../../../lib/socket';

export default function SimulatorPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isLoading, initAuth } = useAuthStore();

  const [session, setSession] = useState<any>(null);
  const [simulationSecond, setSimulationSecond] = useState<number>(1695); // 00:28:15 default demo
  const [activeTab, setActiveTab] = useState<'TEAM' | 'ALL' | 'SYSTEM'>('TEAM');
  const [activeNav, setActiveNav] = useState<'MAP' | 'COMMS' | 'STATUS' | 'OBJECTIVES' | 'EVENTS' | 'DOCS'>('MAP');
  const [currentView, setCurrentView] = useState<'YOUR_VIEW' | 'GROUND_TRUTH'>('YOUR_VIEW');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Corridor selection definitions with distinct actions and operational hints
  const CORRIDOR_OPTIONS: Record<string, { label: string; action: string; hint: string }> = {
    'route-central': {
      label: 'Central Corridor (Weather Slowdown)',
      action: 'Transit Central Corridor with Weather Caution',
      hint: 'Direct path through highway. Surface rain causes 35% speed reduction, but corridor remains open.',
    },
    'route-north': {
      label: 'North Ridge Pass (Reported Blocked)',
      action: 'Hold & Recon North Ridge Pass',
      hint: 'Rockfall reported by Scout Alpha. Ground reports conflict with older aerial surveillance pass.',
    },
    'route-south': {
      label: 'South Valley Bypass (Clear Pass)',
      action: 'Divert Convoy via South Valley Bypass',
      hint: 'Confirmed clear by Patrol Bravo. Adds 4.2 km distance but completely avoids hazards.',
    },
  };

  // Messages list with distinct Team and System entries matching realistic mission feeds
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'm1',
      sender: 'HQ Command',
      senderRole: 'COMMANDER',
      avatarBg: 'bg-blue-600',
      text: 'Move to checkpoint B. Confirm ETA.',
      time: '14:45',
      isDelayed: false,
      isSystem: false,
    },
    {
      id: 's1',
      sender: 'RF Grid Node 04',
      senderRole: 'SYSTEM',
      avatarBg: 'bg-amber-600',
      text: 'Propagation delay active (+45s lag on Primary VHF channel) due to atmospheric disturbance.',
      time: '14:44',
      isDelayed: false,
      isSystem: true,
    },
    {
      id: 'm2',
      sender: 'Team Bravo',
      senderRole: 'TEAM_BRAVO',
      avatarBg: 'bg-rose-700',
      text: 'We are facing heavy delays on sector 3.',
      time: '14:43',
      isDelayed: false,
      isSystem: false,
    },
    {
      id: 's2',
      sender: 'Weather Telemetry',
      senderRole: 'SYSTEM',
      avatarBg: 'bg-sky-600',
      text: 'Meteorological Alert: Flash rain on Central Corridor Highway. Transit speed reduced 35%.',
      time: '14:42',
      isDelayed: false,
      isSystem: true,
    },
    {
      id: 'm3',
      sender: 'Air Unit',
      senderRole: 'AIR_OBSERVATION',
      avatarBg: 'bg-emerald-600',
      text: 'Visual unclear, possible movement.',
      time: '14:41',
      isDelayed: false,
      isSystem: false,
    },
    {
      id: 's3',
      sender: 'Relay Subsystem',
      senderRole: 'SYSTEM',
      avatarBg: 'bg-purple-600',
      text: 'Link Health: 1 packet dropped on South Valley link. Packet rerouting via backup UHF node.',
      time: '14:39',
      isDelayed: false,
      isSystem: true,
    },
    {
      id: 'm4',
      sender: 'Logistics',
      senderRole: 'LOGISTICS',
      avatarBg: 'bg-amber-600',
      text: 'Fuel status at 60%. Ready for transit clearance.',
      time: '14:38',
      isDelayed: false,
      isSystem: false,
    },
    {
      id: 'm5',
      sender: 'Team Alpha',
      senderRole: 'TEAM_ALPHA',
      avatarBg: 'bg-red-600',
      text: 'Reached waypoint A. Rockfall debris observed.',
      deliveryNote: '(Delivered after 10 min)',
      time: '14:30',
      isDelayed: true,
      isSystem: false,
    },
  ]);

  const [messageInput, setMessageInput] = useState('');

  // Decision Modal State
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState('route-central');
  const [decisionAction, setDecisionAction] = useState('Transit Central Corridor with Weather Caution');
  const [decisionRationale, setDecisionRationale] = useState('');
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionSubmitted, setDecisionSubmitted] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const handleCorridorChange = (corridorId: string) => {
    setSelectedRouteId(corridorId);
    if (CORRIDOR_OPTIONS[corridorId]) {
      setDecisionAction(CORRIDOR_OPTIONS[corridorId].action);
    }
    setDecisionError(null);
  };

  // Filtered message lists for Team, All, and System tabs
  const teamMessages = messages.filter((m) => !m.isSystem && m.senderRole !== 'SYSTEM');
  const systemMessages = messages.filter((m) => m.isSystem || m.senderRole === 'SYSTEM');
  const visibleMessages =
    activeTab === 'TEAM' ? teamMessages : activeTab === 'SYSTEM' ? systemMessages : messages;

  // Real-time Live Online Weather & RF Propagation Telemetry (Open-Meteo Public API)
  const [liveWeather, setLiveWeather] = useState<{
    temperature: number;
    windSpeed: number;
    humidity: number;
    condition: string;
    rfDelay: number;
  }>({
    temperature: 14.2,
    windSpeed: 8.6,
    humidity: 58,
    condition: 'Stable Atmospheric Valley',
    rfDelay: 0,
  });

  useEffect(() => {
    async function fetchLiveWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=34.285&longitude=75.480&current_weather=true&hourly=relativehumidity_2m'
        );
        const data = await res.json();
        if (data?.current_weather) {
          const temp = data.current_weather.temperature;
          const wind = data.current_weather.windspeed;
          const hum = data.hourly?.relativehumidity_2m?.[0] || 62;
          let cond = 'Clear Mountain Corridor';
          let delay = 0;
          if (wind > 20 || hum > 80) {
            cond = 'Atmospheric RF Turbulence';
            delay = 45;
          } else if (wind > 12) {
            cond = 'Scattered Mountain Fog';
            delay = 15;
          }
          setLiveWeather({
            temperature: temp,
            windSpeed: wind,
            humidity: hum,
            condition: cond,
            rfDelay: delay,
          });
        }
      } catch (e) {
        console.warn('Weather API fetch fallback');
      }
    }
    fetchLiveWeather();
    const interval = setInterval(fetchLiveWeather, 60000);
    return () => clearInterval(interval);
  }, []);

  // Full Simulation Events for the Event Log
  const [simulationEvents, setSimulationEvents] = useState<any[]>([
    {
      id: 'e1',
      timeSec: 60,
      timeFormatted: '01:00',
      type: 'REPORT_CREATED',
      badge: 'REPORT',
      badgeColor: 'bg-blue-100 text-blue-700',
      title: 'Obstruction Observation Transmitted',
      role: 'Team Alpha',
      detail: 'Team Alpha scouts visually observe heavy debris rockfall at North Ridge kilometer 14.',
    },
    {
      id: 'e2',
      timeSec: 90,
      timeFormatted: '01:30',
      type: 'CONFLICTING_REPORT',
      badge: 'CONTRADICTORY',
      badgeColor: 'bg-purple-100 text-purple-700',
      title: 'Contradictory Reconnaissance Report',
      role: 'Air Observation',
      detail: 'Reconnaissance drone transmits report stating North Route appears clear based on older archival satellite pass.',
    },
    {
      id: 'e3',
      timeSec: 150,
      timeFormatted: '02:30',
      type: 'CHANNEL_DEGRADED',
      badge: 'DELAY INJECTED',
      badgeColor: 'bg-amber-100 text-amber-700',
      title: 'Primary Radio Propagation Lag (+45s)',
      role: 'System / RF Environment',
      detail: 'Primary communication channel experiences 45-second propagation delay queue on Alpha transmission.',
    },
    {
      id: 'e4',
      timeSec: 195,
      timeFormatted: '03:15',
      type: 'MESSAGE_DELAYED',
      badge: 'LATE ARRIVAL',
      badgeColor: 'bg-amber-100 text-amber-700',
      title: 'Delayed Recon Message Delivered',
      role: 'Team Alpha',
      detail: 'Alpha follow-up verification message arrives 45 seconds late to Commander.',
    },
    {
      id: 'e5',
      timeSec: 270,
      timeFormatted: '04:30',
      type: 'MESSAGE_DROPPED',
      badge: 'PACKET DROP',
      badgeColor: 'bg-red-100 text-red-700',
      title: 'Field Status Transmission Dropped',
      role: 'Team Bravo',
      detail: 'Routine perimeter status from Patrol Bravo silently dropped due to simulated interference.',
    },
    {
      id: 'e6',
      timeSec: 300,
      timeFormatted: '05:00',
      type: 'ROUTE_DEGRADED',
      badge: 'WEATHER SLOWDOWN',
      badgeColor: 'bg-amber-100 text-amber-700',
      title: 'Central Corridor Weather Deterioration',
      role: 'Environmental Grid',
      detail: 'Flash rainstorm causes surface water pooling on Central Corridor Highway. Transit speed reduced by 35%.',
    },
    {
      id: 'e7',
      timeSec: 360,
      timeFormatted: '06:00',
      type: 'DECISION_EXECUTED',
      badge: 'TACTICAL DECISION',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      title: 'Convoy Transit Order Issued',
      role: 'Commander',
      detail: 'Commander issues formal order diverting supply vehicle through Central Corridor Bypass with written rationale.',
    },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.get(`/sessions/${resolvedParams.sessionId}`);
        if (data?.session) {
          setSession(data.session);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();

    const socket = getSocket();
    socket.emit('session:join', { sessionId: resolvedParams.sessionId });

    socket.on('timer:update', (data: { simulationSecond: number }) => {
      setSimulationSecond(data.simulationSecond);
    });

    socket.on('message:delivered', (newMsg: any) => {
      setMessages((prev) => [
        ...prev,
        {
          id: newMsg.id || String(Date.now()),
          sender: newMsg.senderRole || 'Operator',
          senderRole: newMsg.senderRole,
          avatarBg: newMsg.senderRole === 'SYSTEM' ? 'bg-amber-600' : 'bg-blue-600',
          text: newMsg.body,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDelayed: (newMsg.delaySeconds || 0) > 0,
          isSystem: newMsg.senderRole === 'SYSTEM',
        },
      ]);
    });

    return () => {
      socket.off('timer:update');
      socket.off('message:delivered');
    };
  }, [resolvedParams.sessionId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMsg = {
      id: String(Date.now()),
      sender: user?.fullName || 'Commander',
      senderRole: user?.role || 'COMMANDER',
      avatarBg: 'bg-sky-600',
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDelayed: false,
      isSystem: false,
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessageInput('');

    try {
      await api.post(`/sessions/${resolvedParams.sessionId}/messages`, {
        body: newMsg.text,
        channel: 'PRIMARY',
      });
    } catch (err) {
      console.error('Send message failed:', err);
    }
  };

  const handleSubmitDecision = async () => {
    if (!decisionRationale.trim()) {
      setDecisionError('Please provide a decision rationale explaining your tactical reasoning.');
      return;
    }
    setSubmittingDecision(true);
    setDecisionError(null);

    const actionText = decisionAction.trim() || CORRIDOR_OPTIONS[selectedRouteId]?.action || 'Tactical Route Order';

    try {
      await api.post(`/sessions/${resolvedParams.sessionId}/decisions`, {
        decisionType: 'ROUTE_SELECTION',
        action: actionText,
        rationale: decisionRationale.trim(),
        selectedRouteId: selectedRouteId,
      });

      // Add decision event to simulationEvents state immediately
      const newEvent = {
        id: `dec-${Date.now()}`,
        timeSec: simulationSecond,
        timeFormatted: formatTimer(simulationSecond),
        type: 'DECISION_EXECUTED',
        badge: 'TACTICAL DECISION',
        badgeColor: 'bg-emerald-100 text-emerald-700',
        title: actionText,
        role: user?.fullName || 'Commander',
        detail: `Commander logged tactical decision: "${decisionRationale.trim()}". Fair assessment snapshot saved.`,
      };
      setSimulationEvents((prev) => [newEvent, ...prev]);

      setDecisionSubmitted(true);
      setTimeout(() => {
        setDecisionModalOpen(false);
        setDecisionSubmitted(false);
        setDecisionRationale('');
        setDecisionError(null);
      }, 1500);
    } catch (err: any) {
      console.error('Decision submission error:', err);
      setDecisionError(err?.message || 'Failed to record decision. Please check connection and try again.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const formatTimer = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const remainder = sec % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Entering simulation console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      {/* 1. BLACK BAR LEFT NAVIGATION RAIL matching photo */}
      <aside className="w-56 bg-[#0b1120] text-slate-300 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 z-20">
        <div className="p-3.5 space-y-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-sky-400">
              <Radio className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              NavDrishti<span className="text-sky-400">AI</span>
            </span>
          </Link>

          {/* Session Indicator Card */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">MountainPass-01</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider">
                Live
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">{formatTimer(simulationSecond)}</div>
          </div>

          {/* Dashboard Exit Link */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 hover:bg-slate-800 transition-all shadow-sm group"
          >
            <LayoutDashboard className="w-4 h-4 text-sky-400 group-hover:text-white transition-colors" />
            <span>← Back to Dashboard</span>
          </Link>

          {/* Nav Items */}
          <nav className="space-y-1 pt-1">
            <button
              onClick={() => setActiveNav('MAP')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeNav === 'MAP'
                  ? 'bg-[#1e3a8a] text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Situation Map</span>
            </button>

            <button
              onClick={() => setActiveNav('COMMS')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeNav === 'COMMS'
                  ? 'bg-[#1e3a8a] text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Communications</span>
            </button>

            <button
              onClick={() => setActiveNav('STATUS')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeNav === 'STATUS'
                  ? 'bg-[#1e3a8a] text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team Status</span>
            </button>

            <button
              onClick={() => setActiveNav('OBJECTIVES')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeNav === 'OBJECTIVES'
                  ? 'bg-[#1e3a8a] text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Objectives</span>
            </button>

            <button
              onClick={() => setActiveNav('EVENTS')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeNav === 'EVENTS'
                  ? 'bg-[#1e3a8a] text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Event Log</span>
            </button>

            <button
              onClick={() => setActiveNav('DOCS')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeNav === 'DOCS'
                  ? 'bg-[#1e3a8a] text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </button>
          </nav>
        </div>

        {/* Bottom role pill */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Role: Team Alpha</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
      </aside>

      {/* 2. CENTER PANEL: Dynamic View Based on Selected Nav Item */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative">
        {/* Header Bar */}
        <div className="h-11 px-4 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs"
              title="Return to Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-600" />
              <span>Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs font-bold text-slate-900">
              {activeNav === 'MAP' && 'Situation Map'}
              {activeNav === 'OBJECTIVES' && 'Mission Objectives & Directives'}
              {activeNav === 'EVENTS' && 'Chronological Simulation Event Log'}
              {activeNav === 'STATUS' && 'Team Multi-Domain Operational Status'}
              {activeNav === 'DOCS' && 'Operational Documentation & Briefings'}
              {activeNav === 'COMMS' && 'Tactical Radio & Signal Feeds'}
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">• Live operational view - Team Alpha</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Online Free Weather API Telemetry Display */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-[11px] text-blue-900">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-semibold text-blue-700">Open-Meteo Live API:</span>
              <span>{liveWeather.temperature}°C</span>
              <span>• Wind: {liveWeather.windSpeed} km/h</span>
              <span>• Hum: {liveWeather.humidity}%</span>
              <span className="font-semibold text-amber-700">RF Lag: +{liveWeather.rfDelay}s</span>
            </div>

            {activeNav === 'MAP' && (
              /* View toggle pill matching photo: [ Your View | Ground Truth ] */
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
                <button
                  onClick={() => setCurrentView('YOUR_VIEW')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    currentView === 'YOUR_VIEW'
                      ? 'bg-white text-slate-900 font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>Your View</span>
                </button>
                <button
                  onClick={() => setCurrentView('GROUND_TRUTH')}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    currentView === 'GROUND_TRUTH'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Ground Truth</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Center Body */}
        <div className="flex-1 relative overflow-y-auto">
          {/* A. SITUATION MAP VIEW */}
          {activeNav === 'MAP' && (
            <div className="w-full h-full relative">
              <TacticalMap
                role={currentView === 'GROUND_TRUTH' ? 'INSTRUCTOR' : 'TEAM_ALPHA'}
                selectedView={currentView === 'GROUND_TRUTH' ? 'GROUND_TRUTH' : 'PERCEPTION'}
                onViewChange={(v) => setCurrentView(v === 'GROUND_TRUTH' ? 'GROUND_TRUTH' : 'YOUR_VIEW')}
                simulationSecond={simulationSecond}
                activeRouteHighlight={selectedRouteId}
                onSelectRoute={(id) => handleCorridorChange(id)}
              />

              {/* Tactical Bottom Action Bar */}
              <div className="absolute bottom-3 right-3 z-[1000] flex items-center gap-2">
                <button
                  onClick={() => setDecisionModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-lg flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Make Tactical Decision</span>
                </button>
              </div>
            </div>
          )}

          {/* B. OBJECTIVES VIEW */}
          {activeNav === 'OBJECTIVES' && (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4" /> Primary Mission Directive
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    High Priority
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Escort Critical Medical Supplies from Base Orion to Zone C
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Safely coordinate the transit of Relief Convoy 1 across the MountainPass-01 corridor before the 10:00 session window concludes. Primary radio channels are experiencing atmospheric and propagation degradation. Reconcile ground scouting observations with aerial feeds before committing transport assets.
                </p>
              </div>

              {/* Checkpoint Objectives */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Secondary Operational Milestones</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">1. Recon Checkpoint Alpha</span>
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Team Alpha scout verified North Ridge approach. Reported rockfall debris.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">2. Aerial Corridor Clearance</span>
                      <span className="text-purple-600">Conflicting Intel</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Air Observation drone reported route clear using older imagery pass. Freshness cross-check required.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">3. Route Selection Decision</span>
                      <span className="text-amber-600">Pending Execution</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Commander must select between North Pass, Central Highway, or South Bypass.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">4. Convoy Arrival at Zone C</span>
                      <span className="text-slate-400">Target ETA 09:30</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Relief supplies handed over to forward civilian medical response teams.
                    </p>
                  </div>
                </div>
              </div>

              {/* Safety Disclaimers */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-600" /> SIH26248 Fair Assessment Protocol Active
                </div>
                <div className="text-[11px] text-blue-800">
                  Your tactical score will evaluate decisions solely against what was perceivable by your team at the time of the order. Unreceived or dropped communications will not penalize your leadership score.
                </div>
              </div>
            </div>
          )}

          {/* C. EVENT LOG VIEW */}
          {activeNav === 'EVENTS' && (
            <div className="p-6 max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Simulation Event Timeline</h2>
                  <p className="text-xs text-slate-500">Real-time chronicle of injected friction, propagation delays, and team reports</p>
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700">
                  {simulationEvents.length} Events Logged
                </span>
              </div>

              <div className="space-y-2.5">
                {simulationEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start gap-4 transition-all hover:border-blue-300"
                  >
                    <div className="text-center font-mono flex-shrink-0 pt-0.5">
                      <div className="text-xs font-bold text-blue-600">{evt.timeFormatted}</div>
                      <div className="text-[10px] text-slate-400">T+{evt.timeSec}s</div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{evt.title}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${evt.badgeColor}`}>
                          {evt.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{evt.detail}</p>
                      <div className="text-[11px] text-slate-400 font-medium">Actor / Source: {evt.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* D. TEAM STATUS VIEW */}
          {activeNav === 'STATUS' && (
            <div className="p-6 max-w-4xl mx-auto space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Multi-Domain Unit Status & Readiness</h2>
                <p className="text-xs text-slate-500">Live coordinates, operational state, and channel latency across all participating elements</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Commander */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Command Center</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                      COMMANDER
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Location: <strong>Base Orion (34.12°N, 74.80°E)</strong></div>
                    <div>State: <strong>Evaluating Transit Intelligence</strong></div>
                    <div>Active Channel: <strong>PRIMARY RF (Normal)</strong></div>
                  </div>
                </div>

                {/* Team Alpha */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Team Alpha (Scout)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                      ACTIVE RECON
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Location: <strong>North Ridge Pass (34.17°N, 74.84°E)</strong></div>
                    <div>State: <strong>Reporting Rockfall Obstruction</strong></div>
                    <div>Channel Status: <strong className="text-amber-600">45s Propagation Lag</strong></div>
                  </div>
                </div>

                {/* Team Bravo */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Team Bravo (Patrol)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                      ON PATROL
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Location: <strong>South Valley Bypass (34.11°N, 74.92°E)</strong></div>
                    <div>State: <strong>Corridor Clear & Secured</strong></div>
                    <div>Channel Status: <strong className="text-red-600">1 Packet Dropped</strong></div>
                  </div>
                </div>

                {/* Air Unit */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Air Observation Unit</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                      ORBITING (800m)
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Location: <strong>Sector Apex (34.16°N, 74.88°E)</strong></div>
                    <div>State: <strong>Transmitting Overhead Video Feed</strong></div>
                    <div>Imagery Freshness: <strong className="text-amber-600">Pass Stale by 85s</strong></div>
                  </div>
                </div>

                {/* Logistics */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Relief Convoy 1</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                      STANDBY FOR ROUTE ORDER
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Location: <strong>Staging Area Base Orion (34.12°N, 74.80°E)</strong></div>
                    <div>Cargo: <strong>Critical Medical Supply Packages (1 Unit)</strong></div>
                    <div>Vehicle Readiness: <strong>100% Fuel, All Terrain Tire Chains Equipped</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* E. DOCUMENTS VIEW */}
          {activeNav === 'DOCS' && (
            <div className="p-6 max-w-4xl mx-auto space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Operational Briefing & Doctrine</h2>
                <p className="text-xs text-slate-500">Standard operating procedures, communication resilience metrics, and non-kinetic safety policies</p>
              </div>

              <div className="space-y-3">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> SOP-01: Degraded Communication Decision Protocol
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Under primary radio latency or partial packet loss, commanders must verify information freshness timestamps before dispatching high-value logistics units. When conflicting reports occur between ground reconnaissance and aerial imagery, operators should prioritize local ground physical verification or switch to backup frequency bands.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" /> SOP-02: ComRes Index Resilience Evaluation
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The Communication Resilience Index (ComRes) scores team performance out of 100 based on 9 transparent components: Disruption Detection Speed (15%), Backup Recovery Speed (15%), Order Acknowledgement Rate (15%), Freshness Verification (15%), Contradiction Resolution (10%), Decision Timeliness (10%), Team Coordination (10%), Adaptability (5%), and Resource Efficiency (5%).
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" /> Compliance Declaration: Safe Synthetic Data
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    NavDrishtiAI utilizes 100% fictional coordinate grids (NavDrishti Corridor) and generic non-sensitive civilian relief assets. The platform contains no operational military assets, kinetic targeting weapons, classified radio frequencies, or electronic jamming devices.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* F. FULL COMMS VIEW */}
          {activeNav === 'COMMS' && (
            <div className="p-6 max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Tactical Communications Log</h2>
                  <p className="text-xs text-slate-500">Live multi-channel message stream with delivery status, latency tags, and system telemetry</p>
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700">
                  Primary RF Channel: NORMAL
                </div>
              </div>

              {/* View filter tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('TEAM')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'TEAM'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>Team Comms</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'TEAM' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {teamMessages.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'ALL'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>All Feeds</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'ALL' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {messages.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('SYSTEM')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'SYSTEM'
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>System Broadcasts</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'SYSTEM' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {systemMessages.length}
                  </span>
                </button>
              </div>

              <div className="space-y-3">
                {visibleMessages.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2 bg-white rounded-xl border border-slate-200">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                    <span>No {activeTab.toLowerCase()} messages logged at this time.</span>
                  </div>
                ) : (
                  visibleMessages.map((m) => (
                    <div key={m.id} className={`p-4 rounded-xl bg-white border ${m.isSystem ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'} shadow-sm flex items-start gap-3`}>
                      <div className={`w-8 h-8 rounded-full ${m.avatarBg} text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5`}>
                        {m.isSystem ? (
                          <Radio className="w-4 h-4" />
                        ) : (
                          m.sender.split(' ').map((n: string) => n[0]).join('').substring(0, 2)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            {m.isDelayed ? <span className="text-red-600 font-bold">(Delayed) {m.sender}</span> : m.sender}
                            {m.isSystem && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 uppercase">
                                Automated Node
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">{m.time}</span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1">{m.text}</p>
                        {m.deliveryNote && <div className="text-[11px] text-red-600 font-medium mt-0.5">{m.deliveryNote}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. RIGHT PANEL: Communications matching photo */}
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col flex-shrink-0 z-20 shadow-sm">
        {/* Header with chevron */}
        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-bold text-slate-900">Communications</span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500 cursor-pointer" />
        </div>

        {/* Filter Tabs: [ Team | All | System ] with badges */}
        <div className="px-3 pt-2.5 pb-2 flex items-center gap-1.5 border-b border-slate-200 text-[11px] font-semibold bg-white">
          <button
            onClick={() => setActiveTab('TEAM')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'TEAM'
                ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Team</span>
            <span className={`text-[10px] px-1 py-0.2 rounded-full ${activeTab === 'TEAM' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {teamMessages.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1 py-0.2 rounded-full ${activeTab === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {messages.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('SYSTEM')}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'SYSTEM'
                ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>System</span>
            <span className={`text-[10px] px-1 py-0.2 rounded-full ${activeTab === 'SYSTEM' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {systemMessages.length}
            </span>
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-3 space-y-3 overflow-y-auto bg-slate-50/30">
          {visibleMessages.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <MessageSquare className="w-6 h-6 text-slate-300" />
              <span>No {activeTab.toLowerCase()} messages in this feed.</span>
            </div>
          ) : (
            visibleMessages.map((m) => (
              <div key={m.id} className={`flex items-start gap-2.5 text-xs bg-white p-2.5 rounded-xl border ${m.isSystem ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200/80'} shadow-2xs`}>
                {/* Circle Avatar */}
                <div
                  className={`w-7 h-7 rounded-full ${m.avatarBg} text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5 shadow-sm`}
                >
                  {m.isSystem ? (
                    <Radio className="w-3.5 h-3.5" />
                  ) : (
                    m.sender.split(' ').map((n: string) => n[0]).join('').substring(0, 2)
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-900 text-[11px] truncate flex items-center gap-1">
                      {m.isDelayed ? (
                        <span className="text-red-600 flex items-center gap-1 font-bold">
                          <span>(Delayed)</span> {m.sender}
                        </span>
                      ) : (
                        m.sender
                      )}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {m.isSystem && (
                        <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800 uppercase">
                          System
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">{m.time}</span>
                    </div>
                  </div>
                  <div className="text-slate-700 text-xs mt-0.5 leading-relaxed">{m.text}</div>
                  {m.deliveryNote && (
                    <div className="text-[10px] text-red-600 font-medium mt-0.5">{m.deliveryNote}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input matching photo */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              className="w-8 h-8 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white flex items-center justify-center transition-colors flex-shrink-0 shadow-sm cursor-pointer"
              title="Send"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </aside>

      {/* Decision Rationale Modal */}
      {decisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Submit Tactical Decision</span>
              </h3>
              <button
                onClick={() => {
                  setDecisionModalOpen(false);
                  setDecisionError(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {decisionSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-xs font-bold">Decision Logged Successfully</div>
                <div className="text-[11px] text-slate-500">Cryptographic state snapshot recorded.</div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {decisionError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
                    <span>{decisionError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Select Transit Corridor</label>
                  <select
                    value={selectedRouteId}
                    onChange={(e) => handleCorridorChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
                  >
                    <option value="route-north">North Ridge Pass (Reported Blocked)</option>
                    <option value="route-central">Central Corridor (Weather Slowdown)</option>
                    <option value="route-south">South Valley Bypass (Clear Pass)</option>
                  </select>
                  {CORRIDOR_OPTIONS[selectedRouteId]?.hint && (
                    <div className="mt-1.5 p-2 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-snug">
                      <span className="font-semibold text-slate-800">Corridor Intel:</span> {CORRIDOR_OPTIONS[selectedRouteId].hint}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tactical Directive / Action</label>
                  <input
                    type="text"
                    value={decisionAction}
                    onChange={(e) => setDecisionAction(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
                    placeholder="e.g. Transit Central Corridor with Weather Caution"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Decision Rationale <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={decisionRationale}
                    onChange={(e) => {
                      setDecisionRationale(e.target.value);
                      if (decisionError) setDecisionError(null);
                    }}
                    placeholder="Explain why this decision is made based on the intel you currently have..."
                    className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[10px] text-blue-900">
                  ℹ️ <strong>Fair Assessment Guarantee:</strong> Your decision will only be evaluated against the information available to you at this moment.
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setDecisionModalOpen(false);
                      setDecisionError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitDecision}
                    disabled={submittingDecision}
                    className="px-4 py-1.5 rounded-lg bg-[#0066ff] hover:bg-blue-600 text-white font-bold text-xs disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    {submittingDecision && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <span>{submittingDecision ? 'Recording Decision...' : 'Record Decision'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
