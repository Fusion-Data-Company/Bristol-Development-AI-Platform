// Zero-Downtime Verification - Code presence audit (non-disruptive)
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';

const criticalFiles = [
  'server/api/elevenlabs.ts',
  'server/api/elevenlabs-webhook.ts', 
  'server/api/mcp-elevenlabs.ts',
  'src/mcp/manager.ts',
  'server/services/websocketService.ts',
  'server/services/schedulerService.ts',
  'src/lib/singleton.ts',
  'src/lib/metrics.ts',
  'src/lib/logger.ts'
];

console.log('🔍 Auditing critical file presence...');

const report = criticalFiles.map(path => {
  const exists = existsSync(path);
  const bytes = exists ? readFileSync(path).length : 0;
  const status = exists ? '✅' : '❌';
  
  console.log(`${status} ${path}: ${exists ? `${bytes} bytes` : 'MISSING'}`);
  
  return {
    path,
    exists,
    bytes,
    status: exists ? 'OK' : 'MISSING'
  };
});

const summary = {
  total: report.length,
  present: report.filter(r => r.exists).length,
  missing: report.filter(r => !r.exists).length,
  total_bytes: report.reduce((sum, r) => sum + r.bytes, 0)
};

mkdirSync('docs', {recursive: true});

const output = {
  timestamp: new Date().toISOString(),
  audit_type: 'critical_files',
  summary,
  report
};

writeFileSync('docs/zvp-code-results.json', JSON.stringify(output, null, 2));
console.log('\n📋 Code audit complete:', JSON.stringify(summary, null, 2));

if (summary.missing > 0) {
  console.error('❌ CRITICAL: Missing files detected!');
  process.exit(1);
} else {
  console.log('✅ All critical files present and accounted for');
}