import fs from 'fs';
let bad = false;

if (!fs.existsSync('.protectedpaths')) {
  console.error('[CRITICAL] .protectedpaths file missing');
  process.exit(2);
}

const protectedPaths = fs.readFileSync('.protectedpaths', 'utf8')
  .split('\n')
  .map(x => x.trim())
  .filter(Boolean);

for (const path of protectedPaths) {
  if (!fs.existsSync(path)) {
    console.error('[CRITICAL MISSING]', path);
    bad = true;
  }
}

if (bad) {
  console.error('Critical files are missing! Build aborted to protect system integrity.');
  process.exit(2);
} else {
  console.log('✅ All critical paths verified');
}