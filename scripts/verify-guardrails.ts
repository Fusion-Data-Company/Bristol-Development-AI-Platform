// Guardrails verifier - prevents future accidental removals
import { existsSync, readFileSync } from 'fs';
import http from 'http';
import { URL } from 'url';

const base = process.env.ZVP_BASE_URL || `http://127.0.0.1:${process.env.PORT || 5000}`;
const protectedPaths = readFileSync('.protectedpaths', 'utf8')
  .split('\n')
  .map(s => s.trim())
  .filter(Boolean);

let failed = false;

console.log('🛡️  Verifying protected files...');
for (const path of protectedPaths) {
  if (!existsSync(path)) {
    console.error(`[GUARD] ❌ Missing protected file: ${path}`);
    failed = true;
  } else {
    console.log(`[GUARD] ✅ ${path}`);
  }
}

const criticalEndpoints = [
  '/healthz',
  '/api/elevenlabs',
  '/api/mcp-elevenlabs'
];

function checkEndpoint(endpoint: string): Promise<number> {
  return new Promise((resolve) => {
    const url = new URL(endpoint, base);
    const req = http.request(url, {
      method: 'GET',
      timeout: 2500,
      headers: {'User-Agent': 'Guardrails-Check'}
    }, (res) => {
      resolve(res.statusCode || 0);
    });
    
    req.on('error', () => resolve(0));
    req.on('timeout', () => {
      req.destroy();
      resolve(0);
    });
    req.end();
  });
}

console.log('🛡️  Verifying critical endpoints...');
(async () => {
  for (const endpoint of criticalEndpoints) {
    try {
      const status = await checkEndpoint(endpoint);
      if (status === 0 || status >= 500) {
        console.error(`[GUARD] ❌ Endpoint unhealthy: ${endpoint} (${status})`);
        failed = true;
      } else {
        console.log(`[GUARD] ✅ ${endpoint}: ${status}`);
      }
    } catch (error) {
      console.error(`[GUARD] ❌ Endpoint check failed: ${endpoint}`);
      failed = true;
    }
  }
  
  if (failed) {
    console.error('🚨 [GUARD] PROTECTION VIOLATION DETECTED - Build should fail');
    process.exit(2);
  }
  
  console.log('✅ [GUARD] All protected files and endpoints healthy');
})();