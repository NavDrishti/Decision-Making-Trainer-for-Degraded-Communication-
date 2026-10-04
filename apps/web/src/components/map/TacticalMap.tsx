'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Eye, Shield, Compass, Layers, Info } from 'lucide-react';

interface TacticalMapProps {
  role?: string;
  isInstructor?: boolean;
  selectedView?: 'PERCEPTION' | 'GROUND_TRUTH';
  onViewChange?: (view: 'PERCEPTION' | 'GROUND_TRUTH') => void;
  activeRouteHighlight?: string;
  onSelectRoute?: (routeId: string) => void;
  simulationSecond?: number;
  customRoutesState?: Record<string, string>;
}

type BasemapKey = 'esri_satellite' | 'esri_topo' | 'osm' | 'esri_street';

const BASEMAP_CONFIGS: Record<BasemapKey, { name: string; url: string; attribution: string; icon: string }> = {
  esri_satellite: {
    name: 'Satellite Recon',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Source: Esri, Maxar, Earthstar Geographics (Free Public GIS API)',
  },
  esri_topo: {
    name: 'Terrain Topo',
    icon: '⛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri World Topo (Free GIS API)',
  },
  osm: {
    name: 'OpenStreetMap',
    icon: '🗺️',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors (Free Keyless API)',
  },
  esri_street: {
    name: 'Street Map',
    icon: '☀️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri World Street (Free Public GIS API)',
  },
};

// Indian Himalayan Mountain Pass Sector: Zojila Pass Corridor (Ladakh / Kashmir Border, India)
const INDIAN_MAP_CENTER: [number, number] = [34.285, 75.480];
const INDIAN_MAP_DEFAULT_ZOOM = 12;

export function TacticalMap({
  role = 'COMMANDER',
  isInstructor = false,
  selectedView = 'PERCEPTION',
  onViewChange,
  activeRouteHighlight,
  onSelectRoute,
  simulationSecond = 180,
  customRoutesState,
}: TacticalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const currentTileLayerRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const [currentView, setCurrentView] = useState<'PERCEPTION' | 'GROUND_TRUTH'>(selectedView);
  const [activeBasemap, setActiveBasemap] = useState<BasemapKey>('esri_satellite');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // Sync internal view when selectedView prop changes
  useEffect(() => {
    if (selectedView) {
      setCurrentView(selectedView);
    }
  }, [selectedView]);

  const toggleView = (view: 'PERCEPTION' | 'GROUND_TRUTH') => {
    setCurrentView(view);
    if (onViewChange) onViewChange(view);
  };

  // Initialize Map at Indian Himalayan coordinates with Leaflet Scale & Controls
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = await import('leaflet');

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: INDIAN_MAP_CENTER,
          zoom: INDIAN_MAP_DEFAULT_ZOOM,
          minZoom: 8,
          maxZoom: 18,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          touchZoom: true,
          dragging: true,
          zoomControl: false,
        });

        // Default to Satellite Recon (ESRI World Imagery - Free Public GIS API matching photo)
        const config = BASEMAP_CONFIGS.esri_satellite;
        const tileLayer = L.tileLayer(config.url, {
          attribution: config.attribution,
          maxZoom: 18,
        }).addTo(map);

        currentTileLayerRef.current = tileLayer;

        // Top-left zoom controls
        L.control.zoom({ position: 'topleft' }).addTo(map);

        // Bottom-left metric scale control showing 2 km / metric distance like photo
        L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = layerGroup;
        mapInstanceRef.current = map;

        if (isMounted) setMapLoaded(true);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch Free Basemap API Layer
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (currentTileLayerRef.current) {
        map.removeLayer(currentTileLayerRef.current);
      }

      const config = BASEMAP_CONFIGS[activeBasemap];
      const newLayer = L.tileLayer(config.url, {
        attribution: config.attribution,
        maxZoom: 18,
      }).addTo(map);

      currentTileLayerRef.current = newLayer;
    });
  }, [activeBasemap, mapLoaded]);

  // Re-render tactical layers whenever view, state, or highlight changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !layerGroupRef.current) return;

    import('leaflet').then((L) => {
      const lg = layerGroupRef.current;
      lg.clearLayers();

      const isTruth = currentView === 'GROUND_TRUTH' || isInstructor;

      // -------------------------------------------------------------
      // 1. MOUNTAIN TRANSIT ROUTES CROSSING PASSES & RIDGES
      // -------------------------------------------------------------
      const northStatus = isTruth
        ? 'BLOCKED'
        : role === 'TEAM_ALPHA'
        ? 'BLOCKED'
        : simulationSecond >= 240
        ? 'BLOCKED'
        : 'CONFLICTING';

      const centralStatus = isTruth || simulationSecond >= 300 ? 'DEGRADED' : 'CLEAR';
      const southStatus = 'CLEAR';

      const routes = [
        {
          id: 'route-north',
          name: 'North Mountain Pass Corridor (Zojila Main)',
          coords: [
            [34.238, 75.405],
            [34.255, 75.430],
            [34.275, 75.465],
            [34.292, 75.495],
            [34.305, 75.520],
            [34.320, 75.555],
            [34.335, 75.590],
          ],
          status: customRoutesState?.['route-north'] || northStatus,
        },
        {
          id: 'route-south',
          name: 'South Ridge Mountain Crossing (Team Bravo Flank)',
          coords: [
            [34.238, 75.405],
            [34.225, 75.450],
            [34.235, 75.510],
            [34.270, 75.550],
            [34.300, 75.570],
            [34.335, 75.590],
          ],
          status: customRoutesState?.['route-south'] || southStatus,
        },
        {
          id: 'route-central',
          name: 'Central Valley Mountain Bypass',
          coords: [
            [34.238, 75.405],
            [34.250, 75.425],
            [34.260, 75.480],
            [34.280, 75.530],
            [34.310, 75.565],
            [34.335, 75.590],
          ],
          status: customRoutesState?.['route-central'] || centralStatus,
        },
      ];

      routes.forEach((r) => {
        let color = '#10b981'; // green / clear
        let dashArray = undefined;

        if (r.id === 'route-south') {
          color = '#a855f7'; // purple for south ridge mountain traverse
          dashArray = '6, 6';
        } else if (r.status === 'BLOCKED') {
          color = '#ef4444'; // red
        } else if (r.status === 'DEGRADED') {
          color = '#f59e0b'; // amber
          dashArray = '6, 6';
        } else if (r.status === 'CONFLICTING') {
          color = '#8b5cf6'; // purple / conflicting
          dashArray = '4, 4';
        }

        const isSelected = activeRouteHighlight === r.id;

        const poly = L.polyline(r.coords as [number, number][], {
          color,
          weight: isSelected ? 6 : 4,
          opacity: isSelected ? 1 : 0.85,
          dashArray,
        }).addTo(lg);

        poly.on('click', () => {
          if (onSelectRoute) onSelectRoute(r.id);
        });

        poly.bindPopup(`
          <div style="padding: 6px; color: #0f172a; min-width: 180px;">
            <div style="font-weight: 700; color: ${color}; font-size: 13px;">${r.name}</div>
            <div style="font-size: 11px; color: #334155; margin-top: 4px;">Status: <strong>${r.status}</strong></div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Click to select this transit corridor.</div>
          </div>
        `);
      });

      // -------------------------------------------------------------
      // 2. ACTIVE TRAJECTORY LINE FOR TEAM ALPHA (CYAN DASHED LIKE PHOTO)
      // -------------------------------------------------------------
      const alphaTrajectory = [
        [34.238, 75.405],
        [34.255, 75.430],
        [34.275, 75.465],
      ];
      L.polyline(alphaTrajectory as [number, number][], {
        color: '#38bdf8',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '5, 6',
      }).addTo(lg);

      // -------------------------------------------------------------
      // 3. AIR RECON ORBIT PATH (CYAN DASHED ORBIT CIRCLE OVER PEAKS)
      // -------------------------------------------------------------
      L.circle([34.310, 75.480], {
        radius: 1200,
        color: '#06b6d4',
        weight: 1.5,
        opacity: 0.7,
        dashArray: '4, 8',
        fill: false,
      }).addTo(lg);

      // -------------------------------------------------------------
      // 4. SHADED HAZARD AREAS (MATCHING PHOTO: RED BLOCKED & AMBER ACTIVITY)
      // -------------------------------------------------------------

      // A. RED BLOCKED ROUTE HAZARD CIRCLE
      if (isTruth || role === 'TEAM_ALPHA' || simulationSecond >= 240) {
        L.circle([34.305, 75.520], {
          radius: 850,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.32,
          weight: 2,
          dashArray: '6, 6',
        }).addTo(lg);

        // Center ✖ red icon
        const blockedCenterIcon = L.divIcon({
          className: 'tactical-hazard-marker',
          html: `
            <div style="transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center;">
              <div style="
                width: 28px; height: 28px; border-radius: 50%;
                background: #dc2626; border: 2px solid #ffffff;
                display: flex; align-items: center; justify-content: center;
                color: #ffffff; font-weight: 900; font-size: 13px;
                box-shadow: 0 4px 14px rgba(220, 38, 38, 0.7);
              ">✖</div>
            </div>
          `,
        });
        L.marker([34.305, 75.520], { icon: blockedCenterIcon }).addTo(lg);

        // Floating Dark Pill Label matching photo: [ Blocked Route / (Unknown to Alpha) ]
        const blockedPillIcon = L.divIcon({
          className: 'tactical-pill-marker',
          html: `
            <div style="
              background: rgba(15, 23, 42, 0.94);
              border: 1px solid rgba(239, 68, 68, 0.65);
              border-radius: 8px;
              padding: 5px 11px;
              color: #ffffff;
              box-shadow: 0 6px 18px rgba(0,0,0,0.55);
              display: flex; align-items: center; gap: 8px;
              white-space: nowrap;
              backdrop-filter: blur(4px);
            ">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444;"></div>
              <div>
                <div style="font-size: 12px; font-weight: 700; color: #f87171; line-height: 1.2;">Blocked Route</div>
                <div style="font-size: 10px; font-weight: 600; color: #fca5a5; line-height: 1.2;">
                  ${isTruth ? '(Confirmed Debris Blockage)' : '(Unknown to Alpha)'}
                </div>
              </div>
            </div>
          `,
          iconAnchor: [-10, 20],
        });
        const blockedMarker = L.marker([34.305, 75.520], { icon: blockedPillIcon }).addTo(lg);
        blockedMarker.bindPopup(`
          <div style="padding: 6px; color: #0f172a;">
            <div style="color: #ef4444; font-weight: bold; font-size: 13px;">⚠️ Blocked Route (Km 18 Pass)</div>
            <div style="font-size: 11px; color: #334155; margin-top: 2px;">
              Severe rockslide and road fracture. Impassable for heavy transport vehicles.
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
              Status: <strong>${isTruth ? 'Fully Confirmed Ground Truth' : 'Unknown to Field Unit'}</strong>
            </div>
          </div>
        `);
      }

      // B. AMBER POSSIBLE ACTIVITY CIRCLE
      L.circle([34.280, 75.555], {
        radius: 750,
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.25,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(lg);

      const activityCenterIcon = L.divIcon({
        className: 'tactical-hazard-marker',
        html: `
          <div style="transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center;">
            <div style="
              width: 26px; height: 26px; border-radius: 50%;
              background: #d97706; border: 2px solid #ffffff;
              display: flex; align-items: center; justify-content: center;
              font-size: 12px; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.6);
            ">⚠️</div>
          </div>
        `,
      });
      L.marker([34.280, 75.555], { icon: activityCenterIcon }).addTo(lg);

      // Floating Dark Pill Label matching photo: [ Possible Activity / (Delayed Report) ]
      const activityPillIcon = L.divIcon({
        className: 'tactical-pill-marker',
        html: `
          <div style="
            background: rgba(15, 23, 42, 0.94);
            border: 1px solid rgba(245, 158, 11, 0.65);
            border-radius: 8px;
            padding: 5px 11px;
            color: #ffffff;
            box-shadow: 0 6px 18px rgba(0,0,0,0.55);
            display: flex; align-items: center; gap: 8px;
            white-space: nowrap;
            backdrop-filter: blur(4px);
          ">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #f59e0b;"></div>
            <div>
              <div style="font-size: 12px; font-weight: 700; color: #fbbf24; line-height: 1.2;">Possible Activity</div>
              <div style="font-size: 10px; font-weight: 600; color: #fde68a; line-height: 1.2;">(Delayed Report)</div>
            </div>
          </div>
        `,
        iconAnchor: [-10, 18],
      });
      const activityMarker = L.marker([34.280, 75.555], { icon: activityPillIcon }).addTo(lg);
      activityMarker.bindPopup(`
        <div style="padding: 6px; color: #0f172a;">
          <div style="color: #d97706; font-weight: bold; font-size: 13px;">⚠️ Possible Activity Basin</div>
          <div style="font-size: 11px; color: #334155; margin-top: 2px;">
            Unverified sensor trigger reported 35 min ago via delayed radio packet.
          </div>
        </div>
      `);

      // -------------------------------------------------------------
      // 5. TACTICAL UNITS & WAYPOINTS (FLOATING PILL LABELS LIKE PHOTO)
      // -------------------------------------------------------------

      // A. GREEN SUPPLY POINT
      const supplyPos: [number, number] = [34.238, 75.405];
      const supplyPinIcon = L.divIcon({
        className: 'tactical-pin-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(16, 185, 129, 0.4); animation: ping 2.5s infinite;"></div>
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #059669; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(5, 150, 105, 0.8);">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          </div>
        `,
      });
      L.marker(supplyPos, { icon: supplyPinIcon }).addTo(lg);

      const supplyPillIcon = L.divIcon({
        className: 'tactical-pill-marker',
        html: `
          <div style="
            background: rgba(15, 23, 42, 0.94);
            border: 1px solid rgba(16, 185, 129, 0.65);
            border-radius: 8px;
            padding: 5px 11px;
            color: #ffffff;
            box-shadow: 0 6px 18px rgba(0,0,0,0.55);
            display: flex; align-items: center; gap: 8px;
            white-space: nowrap;
            backdrop-filter: blur(4px);
          ">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></div>
            <div>
              <div style="font-size: 12px; font-weight: 700; color: #ffffff; line-height: 1.2;">Supply Point</div>
              <div style="font-size: 10px; font-weight: 600; color: #34d399; line-height: 1.2;">Last seen 22 min ago</div>
            </div>
          </div>
        `,
        iconAnchor: [-10, 20],
      });
      const supplyMarker = L.marker(supplyPos, { icon: supplyPillIcon }).addTo(lg);
      supplyMarker.bindPopup(`
        <div style="padding: 6px; color: #0f172a;">
          <div style="color: #059669; font-weight: bold; font-size: 13px;">🟢 Main Supply Point (Sonamarg Base)</div>
          <div style="font-size: 11px; color: #334155; margin-top: 2px;">
            Logistics depot, fuel, and medical staging area. Status: Fully Operational.
          </div>
        </div>
      `);

      // B. BLUE TEAM ALPHA (MOVING ALONG MOUNTAIN PASS)
      const alphaPos: [number, number] = [34.275, 75.465];
      const alphaPinIcon = L.divIcon({
        className: 'tactical-pin-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(2, 132, 199, 0.45); animation: ping 2s infinite;"></div>
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #0284c7; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(2, 132, 199, 0.8);">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          </div>
        `,
      });
      L.marker(alphaPos, { icon: alphaPinIcon }).addTo(lg);

      const alphaPillIcon = L.divIcon({
        className: 'tactical-pill-marker',
        html: `
          <div style="
            background: rgba(15, 23, 42, 0.94);
            border: 1px solid rgba(56, 189, 248, 0.65);
            border-radius: 8px;
            padding: 5px 11px;
            color: #ffffff;
            box-shadow: 0 6px 18px rgba(0,0,0,0.55);
            display: flex; align-items: center; gap: 8px;
            white-space: nowrap;
            backdrop-filter: blur(4px);
          ">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #38bdf8;"></div>
            <div>
              <div style="font-size: 12px; font-weight: 700; color: #ffffff; line-height: 1.2;">Team Alpha</div>
              <div style="font-size: 10px; font-weight: 600; color: #7dd3fc; line-height: 1.2;">Moving</div>
            </div>
          </div>
        `,
        iconAnchor: [-10, 20],
      });
      const alphaMarker = L.marker(alphaPos, { icon: alphaPillIcon }).addTo(lg);
      alphaMarker.bindPopup(`
        <div style="padding: 6px; color: #0f172a;">
          <div style="color: #0284c7; font-weight: bold; font-size: 13px;">🔵 Team Alpha (Forward Recon)</div>
          <div style="font-size: 11px; color: #334155; margin-top: 2px;">
            Ascending Zojila Pass. Speed: 18 km/h. Radio Link: Degraded (SNR -14dB).
          </div>
        </div>
      `);

      // C. PURPLE TEAM BRAVO (CROSSING SOUTH RIDGE MOUNTAIN PASS)
      const bravoPos: [number, number] = [34.235, 75.510];
      const bravoPinIcon = L.divIcon({
        className: 'tactical-pin-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
            <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: rgba(168, 85, 247, 0.4); animation: ping 2.5s infinite;"></div>
            <div style="width: 20px; height: 20px; border-radius: 50%; background: #9333ea; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(147, 51, 234, 0.7);">
              <div style="width: 5px; height: 5px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          </div>
        `,
      });
      L.marker(bravoPos, { icon: bravoPinIcon }).addTo(lg);

      const bravoPillIcon = L.divIcon({
        className: 'tactical-pill-marker',
        html: `
          <div style="
            background: rgba(15, 23, 42, 0.94);
            border: 1px solid rgba(168, 85, 247, 0.65);
            border-radius: 8px;
            padding: 5px 11px;
            color: #ffffff;
            box-shadow: 0 6px 18px rgba(0,0,0,0.55);
            display: flex; align-items: center; gap: 8px;
            white-space: nowrap;
            backdrop-filter: blur(4px);
          ">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #c084fc;"></div>
            <div>
              <div style="font-size: 12px; font-weight: 700; color: #e9d5ff; line-height: 1.2;">Team Bravo</div>
              <div style="font-size: 10px; font-weight: 600; color: #c084fc; line-height: 1.2;">Crossing South Ridge Pass</div>
            </div>
          </div>
        `,
        iconAnchor: [-10, 20],
      });
      const bravoMarker = L.marker(bravoPos, { icon: bravoPillIcon }).addTo(lg);
      bravoMarker.bindPopup(`
        <div style="padding: 6px; color: #0f172a;">
          <div style="color: #9333ea; font-weight: bold; font-size: 13px;">🟣 Team Bravo (Ridge Patrol)</div>
          <div style="font-size: 11px; color: #334155; margin-top: 2px;">
            Crossing southern mountain crest at 3,650m elevation. Providing flank security.
          </div>
        </div>
      `);

      // D. CYAN AIR RECON FALCON-1 (UAV OVER HIGH PEAKS)
      const uavPos: [number, number] = [34.310, 75.480];
      const uavPinIcon = L.divIcon({
        className: 'tactical-pin-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #0891b2; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(8, 145, 178, 0.8);">
              <span style="font-size: 10px;">✈️</span>
            </div>
          </div>
        `,
      });
      L.marker(uavPos, { icon: uavPinIcon }).addTo(lg);

      const uavPillIcon = L.divIcon({
        className: 'tactical-pill-marker',
        html: `
          <div style="
            background: rgba(15, 23, 42, 0.94);
            border: 1px solid rgba(6, 182, 212, 0.65);
            border-radius: 8px;
            padding: 5px 11px;
            color: #ffffff;
            box-shadow: 0 6px 18px rgba(0,0,0,0.55);
            display: flex; align-items: center; gap: 8px;
            white-space: nowrap;
            backdrop-filter: blur(4px);
          ">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #22d3ee;"></div>
            <div>
              <div style="font-size: 12px; font-weight: 700; color: #cffafe; line-height: 1.2;">Air Recon Falcon-1</div>
              <div style="font-size: 10px; font-weight: 600; color: #67e8f9; line-height: 1.2;">UAV Orbit • Alt: 4,800m</div>
            </div>
          </div>
        `,
        iconAnchor: [-10, 20],
      });
      const uavMarker = L.marker(uavPos, { icon: uavPillIcon }).addTo(lg);
      uavMarker.bindPopup(`
        <div style="padding: 6px; color: #0f172a;">
          <div style="color: #0891b2; font-weight: bold; font-size: 13px;">✈️ Air Recon Falcon-1 (UAV)</div>
          <div style="font-size: 11px; color: #334155; margin-top: 2px;">
            High-altitude electro-optical recon. Orbiting central peaks at 4,800m ASL.
          </div>
        </div>
      `);

      // E. EMERALD LOGISTICS CONVOY
      const convoyPos: [number, number] = [34.250, 75.425];
      const convoyPillIcon = L.divIcon({
        className: 'tactical-pill-marker',
        html: `
          <div style="
            background: rgba(15, 23, 42, 0.94);
            border: 1px solid rgba(16, 185, 129, 0.65);
            border-radius: 8px;
            padding: 5px 11px;
            color: #ffffff;
            box-shadow: 0 6px 18px rgba(0,0,0,0.55);
            display: flex; align-items: center; gap: 8px;
            white-space: nowrap;
            backdrop-filter: blur(4px);
          ">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #34d399;"></div>
            <div>
              <div style="font-size: 12px; font-weight: 700; color: #ecfdf5; line-height: 1.2;">Logistics Convoy 02</div>
              <div style="font-size: 10px; font-weight: 600; color: #6ee7b7; line-height: 1.2;">En Route • 25 km/h</div>
            </div>
          </div>
        `,
        iconAnchor: [-10, 20],
      });
      const convoyMarker = L.marker(convoyPos, { icon: convoyPillIcon }).addTo(lg);
      convoyMarker.bindPopup(`
        <div style="padding: 6px; color: #0f172a;">
          <div style="color: #059669; font-weight: bold; font-size: 13px;">🚛 Logistics Convoy 02</div>
          <div style="font-size: 11px; color: #334155; margin-top: 2px;">
            Carrying emergency rations & medical supply crates to Zone C.
          </div>
        </div>
      `);

      // F. TARGET DESTINATION: RELIEF POST ZONE C
      const objectivePos: [number, number] = [34.335, 75.590];
      const objectivePinIcon = L.divIcon({
        className: 'tactical-pin-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(245, 158, 11, 0.4); animation: ping 2s infinite;"></div>
            <div style="width: 24px; height: 24px; border-radius: 50%; background: #d97706; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(217, 119, 6, 0.8);">
              <span style="font-size: 11px; color: #ffffff;">⭐</span>
            </div>
          </div>
        `,
      });
      L.marker(objectivePos, { icon: objectivePinIcon }).addTo(lg);

      const objectivePillIcon = L.divIcon({
        className: 'tactical-pill-marker',
        html: `
          <div style="
            background: rgba(15, 23, 42, 0.94);
            border: 1px solid rgba(251, 191, 36, 0.7);
            border-radius: 8px;
            padding: 5px 11px;
            color: #ffffff;
            box-shadow: 0 6px 18px rgba(0,0,0,0.55);
            display: flex; align-items: center; gap: 8px;
            white-space: nowrap;
            backdrop-filter: blur(4px);
          ">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #f59e0b;"></div>
            <div>
              <div style="font-size: 12px; font-weight: 700; color: #fde68a; line-height: 1.2;">Relief Post Zone C</div>
              <div style="font-size: 10px; font-weight: 600; color: #cbd5e1; line-height: 1.2;">Target Objective</div>
            </div>
          </div>
        `,
        iconAnchor: [-10, 20],
      });
      const objMarker = L.marker(objectivePos, { icon: objectivePillIcon }).addTo(lg);
      objMarker.bindPopup(`
        <div style="padding: 6px; color: #0f172a;">
          <div style="color: #d97706; font-weight: bold; font-size: 13px;">⭐ Forward Relief Post Zone C (Dras Valley)</div>
          <div style="font-size: 11px; color: #334155; margin-top: 2px;">
            Target mission delivery post. Primary directive: deliver critical medical cargo safely.
          </div>
        </div>
      `);
    });
  }, [mapLoaded, currentView, role, simulationSecond, activeRouteHighlight, customRoutesState]);

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex flex-col shadow-sm">
      {/* Map Control Overlay Header */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-700/80 text-xs font-semibold text-white flex items-center gap-2 shadow-lg">
          <Compass className="w-4 h-4 text-sky-400" />
          <span>NavDrishti Tactical Grid (Zojila Pass, Ladakh • 34.28°N / 75.48°E)</span>
        </div>
      </div>

      {/* Basemap Free API Switcher & Perspective Toggle */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 flex-wrap justify-end">
        {/* Free Map API Selector */}
        <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-1 text-[11px] font-medium text-slate-300">
          {(Object.keys(BASEMAP_CONFIGS) as BasemapKey[]).map((key) => {
            const cfg = BASEMAP_CONFIGS[key];
            const isActive = activeBasemap === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveBasemap(key)}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={`Switch to free ${cfg.name} map layer (no API key required)`}
              >
                <span>{cfg.icon}</span>
                <span className="hidden sm:inline">{cfg.name}</span>
              </button>
            );
          })}
        </div>

        {/* Perspective Toggle matching photo: [ Your View | Ground Truth ] */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg">
          <button
            type="button"
            onClick={() => toggleView('PERCEPTION')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'PERCEPTION'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Your View</span>
          </button>

          <button
            type="button"
            onClick={() => toggleView('GROUND_TRUTH')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === 'GROUND_TRUTH'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={isInstructor ? 'Full ground truth visible to instructors' : 'Compare with absolute scenario ground truth'}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Ground Truth</span>
          </button>
        </div>
      </div>

      {/* Perception Gap Banner when Ground Truth toggle is active */}
      {currentView === 'GROUND_TRUTH' && (
        <div className="absolute top-14 right-3 z-[1000] bg-amber-950/90 border border-amber-500/70 text-amber-200 text-xs px-3.5 py-1.5 rounded-lg shadow-lg max-w-sm backdrop-blur-md">
          ⚠️ <strong>Ground Truth Mode:</strong> Revealing actual mountain pass blockage (km 18). In active trainee mode, field units operate under degraded radio uncertainty!
        </div>
      )}

      {/* Tactical Leaflet Canvas Container */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0" />

      {/* Interactive Bottom Map Legend (docked at bottom-left next to 2 km scale bar, leaving bottom-right free for tactical actions) */}
      <div className="absolute bottom-3 left-28 z-[1000] bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 text-xs text-slate-200 hidden sm:flex items-center gap-3.5 flex-wrap shadow-xl">
        <span className="font-bold text-white flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-sky-400" /> Forces:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="font-medium text-slate-300">Team Alpha</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span className="font-medium text-slate-300">Team Bravo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="font-medium text-slate-300">Air Recon</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="font-medium text-slate-300">Supply / Convoy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="font-medium text-red-400">Blocked Route</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="font-medium text-amber-300">Activity Basin</span>
        </div>
      </div>
    </div>
  );
}
