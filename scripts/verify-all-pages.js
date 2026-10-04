const http = require('http');

const routes = [
  '/',
  '/about',
  '/security',
  '/ar-vr',
  '/help',
  '/terms',
  '/privacy',
  '/accessibility',
  '/scenarios',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/dashboard',
  '/analytics',
  '/profile',
  '/admin',
  '/instructor',
  '/instructor/scenarios',
  '/instructor/scenarios/new',
  '/instructor/sessions',
  '/instructor/sessions/new',
  '/session/ND-SIGNAL-88/simulate',
  '/session/ND-SIGNAL-88/lobby',
  '/session/ND-SIGNAL-88/monitor',
  '/aar/ND-DEMO-AAR',
  '/two-factor',
  '/verify-email',
  '/session-expired',
  '/access-denied',
];

async function checkRoute(route) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${route}`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`[PASS] ${route} -> HTTP 200 (${data.length} bytes)`);
          resolve(true);
        } else {
          console.error(`[FAIL] ${route} -> HTTP ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    req.on('error', (err) => {
      console.error(`[FAIL] ${route} -> Error: ${err.message}`);
      resolve(false);
    });
  });
}

async function run() {
  console.log('===========================================================');
  console.log('COMPLETE 30-ROUTE END-TO-END HEALTH AUDIT');
  console.log('===========================================================');
  let passed = 0;
  for (const r of routes) {
    const ok = await checkRoute(r);
    if (ok) passed++;
  }
  console.log('===========================================================');
  console.log(`RESULTS: ${passed} / ${routes.length} routes healthy`);
  console.log('===========================================================');
  if (passed !== routes.length) process.exit(1);
}

run();
