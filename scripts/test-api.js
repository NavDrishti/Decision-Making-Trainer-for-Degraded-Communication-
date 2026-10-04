/**
 * NavDrishtiAI Integration & Smoke Test Suite
 */

const API_BASE = process.env.API_URL || 'http://localhost:5000';
const WEB_BASE = process.env.WEB_URL || 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('NAVDRISHTIAI INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`Testing: ${name}... `);
    try {
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /health (API server liveness)', async () => {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ONLINE') throw new Error(`Unexpected status: ${data.status}`);
  });

  // 2. Authentication Login
  let authToken = '';
  await test('POST /auth/login (Demo Instructor Login)', async () => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'instructor@navdrishti.local',
        password: 'ChangeMe!NavDrishti2026'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.accessToken) throw new Error('Missing accessToken');
    if (data.user.role !== 'INSTRUCTOR') throw new Error(`Unexpected role: ${data.user.role}`);
    authToken = data.accessToken;
  });

  // 3. Scenarios Retrieval
  await test('GET /scenarios (Fetch Scenarios with Auth)', async () => {
    const res = await fetch(`${API_BASE}/scenarios`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const scenarios = data.scenarios || data;
    if (!Array.isArray(scenarios) || scenarios.length === 0) throw new Error('No scenarios found');
    const signalBreak = scenarios.find(s => s.title.includes('Operation Signal Break'));
    if (!signalBreak) throw new Error('Operation Signal Break scenario not found');
  });

  // 4. Session Retrieval by Join Code
  await test('GET /sessions/ND-DEMO-AAR (Session Lookup by Join Code)', async () => {
    const res = await fetch(`${API_BASE}/sessions/ND-DEMO-AAR`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const session = data.session || data;
    if (session.joinCode !== 'ND-DEMO-AAR') throw new Error(`Unexpected join code: ${session.joinCode}`);
  });

  // 5. AAR Report Retrieval
  await test('GET /sessions/ND-DEMO-AAR/aar (AAR & ComRes Index Evaluation)', async () => {
    const res = await fetch(`${API_BASE}/sessions/ND-DEMO-AAR/aar`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const report = data.report || data;
    if (!report) throw new Error('Missing report in response');
    if (report.overallScore !== 84) throw new Error(`Expected score 84, got ${report.overallScore}`);
    if (!Array.isArray(report.perceptionGaps) || report.perceptionGaps.length === 0) throw new Error('Empty perceptionGaps');
    if (!Array.isArray(report.decisions) || report.decisions.length === 0) throw new Error('Empty decisions');
  });

  // 6. AR/VR Waitlist Registration
  await test('POST /waitlist/ar-vr (AR/VR Waitlist Submission)', async () => {
    const randomEmail = `test.user.${Date.now()}@example.org`;
    const res = await fetch(`${API_BASE}/waitlist/ar-vr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'SIH Evaluator',
        email: randomEmail,
        organization: 'Smart India Hackathon Team',
        interestType: 'COMMAND_ROOM_VR'
      })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.entryId) throw new Error('Missing entryId in waitlist response');
  });

  // 7. Frontend Liveness
  await test('GET http://localhost:3000/ (Frontend Liveness)', async () => {
    const res = await fetch(WEB_BASE);
    if (!res.ok) throw new Error(`Frontend returned HTTP ${res.status}`);
  });

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
