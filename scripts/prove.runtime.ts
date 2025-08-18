// scripts/prove.runtime.ts
import http from 'http'; 
import https from 'https'; 
import { URL } from 'url';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = process.env.PROVE_BASE || `http://127.0.0.1:${process.env.PORT||5000}`;
const ENDPOINTS = [
  '/api/elevenlabs?dryRun=1',
  '/api/elevenlabs-webhook?dryRun=1',
  '/api/mcp-elevenlabs?dryRun=1',
  '/api/mcp/health',
  '/api/mcp-stream',
  '/api/sites',
  '/api/sites/metrics'
];

function get(path: string, timeout = 4000): Promise<{path:string;status:number;error?:string}> {
  return new Promise(res => {
    const url = new URL(path, BASE); 
    const h = url.protocol === 'https:' ? https : http;
    const req = h.request(url, { method:'GET', timeout }, r => {
      res({ path, status: r.statusCode || 0 });
    });
    req.on('error', (e) => res({ path, status: 0, error: e.message })); 
    req.end();
  });
}

(async () => {
  console.log(`\n🔍 RUNTIME VERIFICATION - Base: ${BASE}\n`);
  const results = [];
  for (const p of ENDPOINTS) {
    const result = await get(p);
    results.push(result);
    const status = result.status >= 200 && result.status < 500 ? '✅' : '❌';
    console.log(`${status} ${result.path} → ${result.status}${result.error ? ` (${result.error})` : ''}`);
  }
  
  mkdirSync('docs', { recursive: true });
  writeFileSync('docs/prove-runtime.json', JSON.stringify({ 
    base: BASE, 
    timestamp: new Date().toISOString(), 
    results,
    summary: {
      total: results.length,
      passing: results.filter(r => r.status >= 200 && r.status < 500).length,
      failing: results.filter(r => r.status === 0 || r.status >= 500).length
    }
  }, null, 2));
  
  const ok = results.every(r => r.status && r.status < 500);
  console.log(`\n📊 Summary: ${results.filter(r => r.status >= 200 && r.status < 500).length}/${results.length} endpoints responding\n`);
  process.exit(ok ? 0 : 2);
})();