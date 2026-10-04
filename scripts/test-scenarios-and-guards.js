const http = require('http');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function runAudit() {
  console.log('===========================================================');
  console.log('NAVDRISHTIAI COMPREHENSIVE BUG & LINK VERIFICATION AUDIT');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, desc) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.log(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // Test 1: Home page navbar points to /scenarios (NOT /instructor/scenarios)
  const home = await fetchText('http://localhost:3000/');
  assert(home.status === 200, 'Home page returns HTTP 200');
  assert(home.body.includes('href="/scenarios"'), 'Home page navbar contains link to /scenarios');
  assert(!home.body.includes('href="/instructor/scenarios"'), 'Home page navbar DOES NOT link to /instructor/scenarios');

  // Test 2: Public /scenarios page exists, returns 200, and is unauthenticated-friendly
  const scenarios = await fetchText('http://localhost:3000/scenarios');
  assert(scenarios.status === 200, 'Public /scenarios page returns HTTP 200');
  assert(scenarios.body.includes('Degraded Communication Training Scenarios'), 'Contains Scenario Catalog title');
  assert(scenarios.body.includes('MountainPass-01: Relief Convoy'), 'Contains MountainPass-01 scenario');
  assert(scenarios.body.includes('Sign In to Train'), 'Prompts guest users with "Sign In to Train"');
  assert(scenarios.body.includes('Instructor Sign In'), 'Prompts visitors with "Instructor Sign In"');

  // Test 3: Protected routes return valid HTML with Next.js client bundles
  const protectedRoutes = [
    '/dashboard',
    '/admin',
    '/profile',
    '/instructor',
    '/instructor/scenarios',
    '/instructor/sessions',
    '/session/ND-SIGNAL-88/simulate',
    '/aar/ND-DEMO-AAR'
  ];

  for (const route of protectedRoutes) {
    const res = await fetchText(`http://localhost:3000${route}`);
    assert(res.status === 200, `Protected route ${route} compiled and loads HTTP 200`);
  }

  console.log('\n===========================================================');
  console.log(`AUDIT RESULTS: ${passed} passed, ${failed} failed`);
  console.log('===========================================================');

  if (failed > 0) process.exit(1);
}

runAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
