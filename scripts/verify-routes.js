const http = require('http');

const urls = [
  'http://localhost:3000',
  'http://localhost:3000/login',
  'http://localhost:3000/dashboard',
  'http://localhost:3000/about',
  'http://localhost:3000/security',
  'http://localhost:3000/help',
  'http://localhost:3000/ar-vr',
  'http://localhost:3000/profile',
  'http://localhost:3000/admin',
  'http://localhost:3000/scenarios',
  'http://localhost:3000/instructor/scenarios',
  'http://localhost:3000/instructor/scenarios/new',
  'http://localhost:3000/instructor/sessions',
  'http://localhost:3000/instructor/sessions/new',
  'http://localhost:3000/session/ND-SIGNAL-88/simulate',
  'http://localhost:3000/aar/ND-DEMO-AAR',
  'http://localhost:5000/health',
  'http://localhost:5000/scenarios'
];

async function checkAll() {
  console.log('Testing live routes and endpoints...');
  let failed = 0;
  for (const url of urls) {
    await new Promise((resolve) => {
      http.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          console.log(`[PASS] ${res.statusCode} : ${url}`);
        } else {
          console.log(`[WARN] ${res.statusCode} : ${url}`);
          failed++;
        }
        resolve();
      }).on('error', (err) => {
        console.log(`[FAIL] ${err.message} : ${url}`);
        failed++;
        resolve();
      });
    });
  }
  console.log(`\nCompleted verification with ${failed} failures.`);
}

checkAll();
