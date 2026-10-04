const http = require('http');
const fs = require('fs');
const path = require('path');

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

async function fetchHttp(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('===========================================================');
  console.log('NAVDRISHTIAI ANALYTICS & MENU BAR BUG AUDIT');
  console.log('===========================================================');

  // 1. Check Sidebar.tsx
  test('Sidebar routes Analytics to dedicated /analytics page', () => {
    const sidebarSrc = fs.readFileSync(path.join(__dirname, '../apps/web/src/components/layout/Sidebar.tsx'), 'utf8');
    if (!sidebarSrc.includes("href: '/analytics'")) {
      throw new Error("Sidebar does not route Analytics to '/analytics'");
    }
    if (!sidebarSrc.includes("label: 'Analytics'")) {
      throw new Error("Sidebar missing Analytics item");
    }
  });

  // 2. Check /analytics page source
  test('Analytics page has standard Sidebar and Back to Dashboard navigation', () => {
    const analyticsSrc = fs.readFileSync(path.join(__dirname, '../apps/web/src/app/analytics/page.tsx'), 'utf8');
    if (!analyticsSrc.includes('<Sidebar />')) {
      throw new Error('Analytics page must include standard Sidebar to preserve menu options');
    }
    if (!analyticsSrc.includes('Back to Dashboard')) {
      throw new Error('Analytics page missing Back to Dashboard button');
    }
    if (!analyticsSrc.includes("api.get('/sessions')")) {
      throw new Error('Analytics page missing API integration for sessions');
    }
    if (!analyticsSrc.includes("api.get(`/sessions/${sessionId}/aar`)")) {
      throw new Error('Analytics page missing API integration for AAR');
    }
  });

  // 3. Check AAR page Back to Dashboard
  test('AAR page has Back to Dashboard in both sidebar rail and top header', () => {
    const aarSrc = fs.readFileSync(path.join(__dirname, '../apps/web/src/app/aar/[sessionId]/page.tsx'), 'utf8');
    if (!aarSrc.includes('← Back to Dashboard')) {
      throw new Error('AAR page missing prominent ← Back to Dashboard button');
    }
    if (!aarSrc.includes('All Analytics Hub')) {
      throw new Error('AAR page missing link to Analytics Hub');
    }
  });

  // 4. Test live HTTP endpoint /analytics
  try {
    const res = await fetchHttp('http://localhost:3000/analytics');
    test('HTTP GET /analytics returns 200', () => {
      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    });
  } catch (err) {
    console.error(`[FAIL] HTTP GET /analytics: ${err.message}`);
    process.exitCode = 1;
  }

  // 5. Test live API endpoint /sessions/ND-DEMO-AAR/aar
  try {
    // Login to get token first
    const loginPayload = JSON.stringify({ email: 'instructor@navdrishti.local', password: 'ChangeMe!NavDrishti2026' });
    const loginRes = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: 5000,
          path: '/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginPayload) },
        },
        (res) => {
          let b = '';
          res.on('data', (d) => (b += d));
          res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(b) }));
        }
      );
      req.on('error', reject);
      req.write(loginPayload);
      req.end();
    });

    const token = loginRes.body.accessToken;

    // Call AAR API
    const aarApiRes = await fetchHttp('http://localhost:5000/sessions/ND-DEMO-AAR/aar', {
      Authorization: `Bearer ${token}`,
    });

    test('HTTP GET /sessions/ND-DEMO-AAR/aar returns valid ComRes report JSON', () => {
      if (aarApiRes.status !== 200) throw new Error(`Expected 200, got ${aarApiRes.status}`);
      const data = JSON.parse(aarApiRes.body);
      if (!data.success || !data.report) throw new Error('Missing report object in API response');
      if (typeof data.report.overallScore !== 'number') throw new Error('Missing overallScore in report');
      if (!data.report.comResIndex) throw new Error('Missing comResIndex in report');
      if (!Array.isArray(data.report.individualScores)) throw new Error('Missing individualScores in report');
    });

    // Call Sessions API
    const sessionsApiRes = await fetchHttp('http://localhost:5000/sessions', {
      Authorization: `Bearer ${token}`,
    });

    test('HTTP GET /sessions returns sessions list for analytics', () => {
      if (sessionsApiRes.status !== 200) throw new Error(`Expected 200, got ${sessionsApiRes.status}`);
      const data = JSON.parse(sessionsApiRes.body);
      if (!data.success || !Array.isArray(data.sessions)) throw new Error('Invalid sessions array');
    });

  } catch (err) {
    console.error(`[FAIL] API Integration test: ${err.message}`);
    process.exitCode = 1;
  }

  console.log('===========================================================');
  if (process.exitCode) {
    console.log('SOME TESTS FAILED');
  } else {
    console.log('ALL ANALYTICS & MENU BAR TESTS PASSED (100%)');
  }
  console.log('===========================================================');
}

run();
