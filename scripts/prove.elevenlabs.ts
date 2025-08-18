// scripts/prove.elevenlabs.ts
import http from 'http'; 
import https from 'https'; 
import { URL } from 'url';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = process.env.PROVE_BASE || `http://127.0.0.1:${process.env.PORT||5000}`;
const LIVE = process.env.E2E_ELEVENLABS === '1';

function post(path: string, body: any, timeout = 12000): Promise<{status: number; len?: number; error?: string}> {
  return new Promise(res => {
    const url = new URL(path, BASE); 
    const h = url.protocol === 'https:' ? https : http;
    const data = JSON.stringify(body);
    const req = h.request(url, { 
      method: 'POST', 
      timeout, 
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(data)
      }
    }, (r) => {
      const chunks: Buffer[] = [];
      r.on('data', c => chunks.push(c));
      r.on('end', () => res({
        status: r.statusCode || 0,
        len: Buffer.concat(chunks).length
      }));
    });
    req.on('error', (e) => res({ status: 0, error: e.message }));
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log(`\n🎙️ ELEVENLABS VERIFICATION\n`);
  
  const dry = await post('/api/elevenlabs', { dryRun: true, text: 'ping' });
  console.log(`${dry.status >= 200 && dry.status < 300 ? '✅' : '❌'} DryRun → ${dry.status}${dry.error ? ` (${dry.error})` : ''}`);
  
  const webhook = await post('/api/elevenlabs-webhook', { dryRun: true });
  console.log(`${webhook.status >= 200 && webhook.status < 300 ? '✅' : '❌'} Webhook → ${webhook.status}${webhook.error ? ` (${webhook.error})` : ''}`);

  let live = { status: 204 };
  if (LIVE) {
    live = await post('/api/elevenlabs', { 
      text: 'Test one two', 
      voiceId: process.env.ELEVENLABS_VOICE_ID || 'default',
      durationSec: 1 
    });
    console.log(`${live.status >= 200 && live.status < 300 ? '✅' : '❌'} Live Synthesis → ${live.status} (${live.len} bytes)`);
  } else {
    console.log(`⏭️ Live Synthesis → Skipped (set E2E_ELEVENLABS=1 to test)`);
  }

  mkdirSync('docs', { recursive: true });
  writeFileSync('docs/prove-elevenlabs.json', JSON.stringify({ 
    timestamp: new Date().toISOString(), 
    dry, 
    webhook,
    live, 
    liveEnabled: LIVE,
    summary: {
      dryRunOk: dry.status >= 200 && dry.status < 300,
      webhookOk: webhook.status >= 200 && webhook.status < 300,
      liveOk: !LIVE || (live.status >= 200 && live.status < 300)
    }
  }, null, 2));
  
  const allOk = (dry.status >= 200 && dry.status < 300) && 
                (webhook.status >= 200 && webhook.status < 300) && 
                (!LIVE || (live.status >= 200 && live.status < 300));
  
  console.log(`\n📊 Summary: ElevenLabs ${allOk ? 'PASSING' : 'FAILING'}\n`);
  process.exit(allOk ? 0 : 2);
})();