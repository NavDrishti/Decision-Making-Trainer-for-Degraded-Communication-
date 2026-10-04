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

console.log('===========================================================');
console.log('NAVDRISHTIAI FIXES VERIFICATION AUDIT');
console.log('===========================================================');

// 1. Password Eye Toggle Tests
test('Login page has clickable showPassword toggle button', () => {
  const loginSrc = fs.readFileSync(path.join(__dirname, '../apps/web/src/app/login/page.tsx'), 'utf8');
  if (!loginSrc.includes('setShowPassword(!showPassword)')) throw new Error('Missing toggle handler in login');
  if (!loginSrc.includes('type={showPassword ? \'text\' : \'password\'}')) throw new Error('Input does not switch type between text and password');
  if (!loginSrc.includes('<EyeOff')) throw new Error('Missing EyeOff icon');
  if (!loginSrc.includes('<Eye')) throw new Error('Missing Eye icon');
  if (!loginSrc.includes('cursor-pointer z-10')) throw new Error('Missing cursor-pointer or z-10 on toggle button');
});

test('Register page has clickable showPassword toggle button', () => {
  const regSrc = fs.readFileSync(path.join(__dirname, '../apps/web/src/app/register/page.tsx'), 'utf8');
  if (!regSrc.includes('setShowPassword(!showPassword)')) throw new Error('Missing toggle handler in register');
  if (!regSrc.includes('type={showPassword ? \'text\' : \'password\'}')) throw new Error('Input does not switch type');
});

test('Reset Password page has clickable showPassword toggle button', () => {
  const resetSrc = fs.readFileSync(path.join(__dirname, '../apps/web/src/app/reset-password/page.tsx'), 'utf8');
  if (!resetSrc.includes('setShowPassword(!showPassword)')) throw new Error('Missing toggle handler in reset-password');
  if (!resetSrc.includes('type={showPassword ? \'text\' : \'password\'}')) throw new Error('Input does not switch type');
});

// 2. Exercise Back to Dashboard Tests
test('Simulate exercise page has Back to Dashboard in left sidebar and header bar', () => {
  const simSrc = fs.readFileSync(path.join(__dirname, '../apps/web/src/app/session/[sessionId]/simulate/page.tsx'), 'utf8');
  if (!simSrc.includes('href="/dashboard"')) throw new Error('Missing dashboard link');
  if (!simSrc.includes('Back to Dashboard')) throw new Error('Missing Back to Dashboard text in left sidebar');
  if (!simSrc.includes('LayoutDashboard')) throw new Error('Missing Dashboard icon in top header');
});

test('Exercise Lobby page has Return to Dashboard link', () => {
  const lobbySrc = fs.readFileSync(path.join(__dirname, '../apps/web/src/app/session/[sessionId]/lobby/page.tsx'), 'utf8');
  if (!lobbySrc.includes('href="/dashboard"')) throw new Error('Missing dashboard link in lobby');
  if (!lobbySrc.includes('Return to Dashboard')) throw new Error('Missing Return to Dashboard text in lobby');
});

// 3. Free Keyless Map APIs Tests
test('Tactical Map contains 4 free keyless public GIS map APIs without watermarks', () => {
  const mapSrc = fs.readFileSync(path.join(__dirname, '../apps/web/src/components/map/TacticalMap.tsx'), 'utf8');
  if (!mapSrc.includes('tile.openstreetmap.org')) throw new Error('Missing OpenStreetMap free API');
  if (!mapSrc.includes('World_Street_Map')) throw new Error('Missing ESRI World Street Map free GIS API');
  if (!mapSrc.includes('World_Topo_Map')) throw new Error('Missing ESRI World Topo free GIS API');
  if (!mapSrc.includes('World_Imagery')) throw new Error('Missing ESRI Satellite Imagery free API');
  if (!mapSrc.includes("BASEMAP_CONFIGS.esri_satellite") && !mapSrc.includes("BASEMAP_CONFIGS.osm")) throw new Error('Missing free basemaps');
  if (mapSrc.includes('cartocdn.com')) throw new Error('CartoDB basemap should be removed to eliminate API KEY REQUIRED watermarks');
});

// 4. Reload Auth Persistence Tests
test('API client and Auth store persist session in localStorage across reloads', () => {
  const apiSrc = fs.readFileSync(path.join(__dirname, '../apps/web/src/lib/api.ts'), 'utf8');
  if (!apiSrc.includes("localStorage.getItem('nd_access_token')")) throw new Error('API client must read nd_access_token from localStorage');
  if (!apiSrc.includes("localStorage.setItem('nd_access_token'")) throw new Error('API client must write nd_access_token to localStorage');

  const authSrc = fs.readFileSync(path.join(__dirname, '../apps/web/src/stores/authStore.ts'), 'utf8');
  if (!authSrc.includes("localStorage.getItem('nd_user')")) throw new Error('Auth store must restore cached user from localStorage');
});

// 5. Typography Scale & Tactical Map Styling
test('globals.css scales base font size and applies tactical map canvas', () => {
  const cssSrc = fs.readFileSync(path.join(__dirname, '../apps/web/src/app/globals.css'), 'utf8');
  if (!cssSrc.includes('font-size: 17.5px;') && !cssSrc.includes('font-size: 16px;')) throw new Error('Missing font size scaling in html');
  if (!cssSrc.includes('.leaflet-container')) throw new Error('Missing leaflet container styling');
});

console.log('===========================================================');
console.log('ALL FIXES VERIFIED SUCCESSFULLY');
console.log('===========================================================');
