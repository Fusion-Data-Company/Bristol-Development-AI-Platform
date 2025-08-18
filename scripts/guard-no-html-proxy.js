import fs from 'fs';
import { execSync } from 'child_process';

try {
  const out = execSync('grep -RIn --exclude-dir=node_modules -E "import .*\\.html" client src || true', { encoding: 'utf8' });
  
  if (out.includes('/api/')) {
    console.error('[GUARD] HTML import from /api path detected:\n' + out);
    process.exit(2);
  }
  
  console.log('[GUARD] No illegal .html imports from /api detected.');
} catch (e) {
  console.log('[GUARD] No HTML import issues found.');
}