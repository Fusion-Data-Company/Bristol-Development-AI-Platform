// scripts/prove.mcp.ts
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import http from 'http';
import { URL } from 'url';

const BASE = process.env.PROVE_BASE || `http://127.0.0.1:${process.env.PORT||5000}`;

type Row = { tool: string; check: string; ok: boolean; note: string; ms: number };

const rows: Row[] = [];

function post(path: string, body: any, timeout = 10000): Promise<{status: number; data?: any; error?: string}> {
  return new Promise(res => {
    const url = new URL(path, BASE);
    const data = JSON.stringify(body);
    const req = http.request(url, { 
      method: 'POST', 
      timeout, 
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(data)
      }
    }, r => {
      const chunks: Buffer[] = [];
      r.on('data', c => chunks.push(c));
      r.on('end', () => {
        try {
          const text = Buffer.concat(chunks).toString();
          const parsed = text ? JSON.parse(text) : null;
          res({ status: r.statusCode || 0, data: parsed });
        } catch (e) {
          res({ status: r.statusCode || 0, error: 'Parse error' });
        }
      });
    });
    req.on('error', (e) => res({ status: 0, error: e.message }));
    req.write(data);
    req.end();
  });
}

async function testMCPTool(tool: string, args: any) {
  const start = Date.now();
  try {
    const result = await post('/api/mcp-stream', {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: tool,
        arguments: args
      }
    });
    
    const ms = Date.now() - start;
    if (result.status >= 200 && result.status < 300) {
      rows.push({ tool, check: 'invoke', ok: true, note: 'Success', ms });
    } else {
      rows.push({ tool, check: 'invoke', ok: false, note: `HTTP ${result.status}`, ms });
    }
  } catch (e: any) {
    const ms = Date.now() - start;
    rows.push({ tool, check: 'invoke', ok: false, note: e?.message || 'Unknown error', ms });
  }
}

(async () => {
  console.log(`\n🔧 MCP TOOL VERIFICATION\n`);

  // Test key MCP tools with minimal args
  const testTools = [
    { name: 'verify_user', args: { username: 'test' } },
    { name: 'get_bristol_team', args: {} },
    { name: 'portfolio_analytics', args: {} },
    { name: 'market_research', args: { query: 'test market' } },
    { name: 'web_scraping', args: { url: 'https://example.com' } },
    { name: 'generate_image', args: { prompt: 'test image' } },
    { name: 'analyze_document', args: { content: 'test document' } }
  ];

  for (const test of testTools) {
    await testMCPTool(test.name, test.args);
    const lastResult = rows[rows.length - 1];
    const status = lastResult.ok ? '✅' : '❌';
    console.log(`${status} ${lastResult.tool} → ${lastResult.note} (${lastResult.ms}ms)`);
  }

  mkdirSync('docs', { recursive: true });
  writeFileSync('docs/prove-mcp.json', JSON.stringify({ 
    timestamp: new Date().toISOString(), 
    rows,
    summary: {
      total: rows.length,
      passing: rows.filter(r => r.ok).length,
      failing: rows.filter(r => !r.ok).length
    }
  }, null, 2));
  
  console.log(`\n📊 Summary: ${rows.filter(r => r.ok).length}/${rows.length} MCP tools responding\n`);
  process.exit(rows.some(r => !r.ok) ? 2 : 0);
})();