const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

async function runVerification() {
  console.log('=== NavDrishtiAI Verification: Indian Coordinates, Tactical Data & Typography ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Check globals.css font-size
  try {
    const cssContent = fs.readFileSync(path.join(__dirname, '../apps/web/src/app/globals.css'), 'utf8');
    assert(cssContent.includes('font-size: 17.5px;'), 'Global font-size scaled up to 17.5px in globals.css');
    assert(cssContent.includes('.leaflet-control-scale-line'), 'Custom leaflet scale bar CSS rules configured');
    assert(cssContent.includes('.tactical-pill-marker'), 'Tactical dark pill badge reset classes defined');
  } catch (err) {
    assert(false, `Failed to read globals.css: ${err.message}`);
  }

  // 2. Check TacticalMap.tsx coordinates & photo markers
  try {
    const mapContent = fs.readFileSync(path.join(__dirname, '../apps/web/src/components/map/TacticalMap.tsx'), 'utf8');
    assert(mapContent.includes('[34.285, 75.480]'), 'Map initial center configured at Indian Himalayan coordinates [34.285, 75.480] (Zojila Pass)');
    assert(mapContent.includes("useState<BasemapKey>('esri_satellite')"), 'Default basemap set to free ESRI Satellite Recon');
    assert(mapContent.includes('L.control.scale'), 'Leaflet metric scale control configured at bottom-left');
    assert(mapContent.includes('Supply Point') && mapContent.includes('Last seen 22 min ago'), 'Green Supply Point tactical marker & floating pill label configured');
    assert(mapContent.includes('Team Alpha') && mapContent.includes('Moving'), 'Blue Team Alpha tactical marker & floating pill label configured');
    assert(mapContent.includes('Blocked Route') && mapContent.includes('Unknown to Alpha'), 'Red Blocked Route hazard circle & floating pill label configured');
    assert(mapContent.includes('Possible Activity') && mapContent.includes('Delayed Report'), 'Amber Possible Activity warning circle & floating pill label configured');
    assert(mapContent.includes('Team Bravo') && mapContent.includes('Crossing South Ridge Pass'), 'Purple Team Bravo crossing southern mountain ridge configured');
    assert(mapContent.includes('Air Recon Falcon-1') && mapContent.includes('Alt: 4,800m'), 'Cyan Air Recon UAV orbiting mountain peaks configured');
    assert(mapContent.includes('Logistics Convoy 02'), 'Logistics Convoy on mountain pass route configured');
    assert(mapContent.includes('Relief Post Zone C'), 'Target Destination Relief Post Zone C configured');
  } catch (err) {
    assert(false, `Failed to read TacticalMap.tsx: ${err.message}`);
  }

  // 3. Check Dashboard & Simulate Indian Weather coordinates
  try {
    const dashContent = fs.readFileSync(path.join(__dirname, '../apps/web/src/app/dashboard/page.tsx'), 'utf8');
    const simContent = fs.readFileSync(path.join(__dirname, '../apps/web/src/app/session/[sessionId]/simulate/page.tsx'), 'utf8');
    assert(dashContent.includes('latitude=34.285&longitude=75.480'), 'Dashboard queries Open-Meteo for Indian Himalayan coordinates');
    assert(simContent.includes('latitude=34.285&longitude=75.480'), 'Simulate page queries Open-Meteo for Indian Himalayan coordinates');
  } catch (err) {
    assert(false, `Failed to verify weather coordinates: ${err.message}`);
  }

  // 4. Test Web Server HTTP 200 Responses
  const testUrls = [
    'http://localhost:3000/session/ND-SIGNAL-88/simulate',
    'http://localhost:3000/session/ND-SIGNAL-88/monitor',
    'http://localhost:3000/dashboard',
    'http://localhost:3000/analytics',
  ];

  for (const url of testUrls) {
    await new Promise((resolve) => {
      http.get(url, (res) => {
        assert(res.statusCode === 200, `Page ${url} returns HTTP ${res.statusCode}`);
        resolve();
      }).on('error', (err) => {
        assert(false, `Page ${url} request failed: ${err.message}`);
        resolve();
      });
    });
  }

  // 5. Test Live Open-Meteo Free API directly for Zojila Pass
  await new Promise((resolve) => {
    https.get('https://api.open-meteo.com/v1/forecast?latitude=34.285&longitude=75.480&current=temperature_2m,relative_humidity_2m,wind_speed_10m', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          assert(json?.current?.temperature_2m !== undefined, `Live Open-Meteo API returns valid temperature for Zojila Pass (${json?.current?.temperature_2m}°C)`);
        } catch {
          assert(false, 'Open-Meteo API response parse failed');
        }
        resolve();
      });
    }).on('error', (err) => {
      assert(false, `Open-Meteo API network failed: ${err.message}`);
      resolve();
    });
  });

  console.log(`\nVerification Complete: ${passed} Passed, ${failed} Failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

runVerification();
