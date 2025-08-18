#!/usr/bin/env node

// Production preflight checks for Bristol Development App
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'OPENROUTER_API_KEY',
  'OPENAI_API_KEY'
];

const OPTIONAL_ENV_VARS = [
  'ELEVENLABS_API_KEY',
  'FIRECRAWL_API_KEY',
  'DEMO_MODE'
];

console.log('🔍 Running Bristol App Preflight Checks...\n');

let hasErrors = false;

// Check environment variables
console.log('📋 Checking Environment Variables:');
REQUIRED_ENV_VARS.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`  ✅ ${envVar}: Present`);
  } else {
    console.log(`  ❌ ${envVar}: Missing (REQUIRED)`);
    hasErrors = true;
  }
});

OPTIONAL_ENV_VARS.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`  ✅ ${envVar}: Present`);
  } else {
    console.log(`  ⚠️  ${envVar}: Missing (optional)`);
  }
});

// Check if build files exist
console.log('\n🏗️  Checking Build Status:');
const workspaceRoot = path.join(__dirname, '..');
const distExists = fs.existsSync(path.join(workspaceRoot, 'dist'));
const clientDistExists = fs.existsSync(path.join(workspaceRoot, 'client', 'dist'));

if (distExists) {
  console.log('  ✅ Server build: Present');
} else {
  console.log('  ❌ Server build: Missing (run npm run build)');
  hasErrors = true;
}

if (clientDistExists) {
  console.log('  ✅ Client build: Present');
} else {
  console.log('  ❌ Client build: Missing (run npm run build)');
  hasErrors = true;
}

// Check MCP configuration
console.log('\n🔧 Checking MCP Configuration:');
try {
  const workspaceRoot = path.join(__dirname, '..');
  const mcpConfigPath = path.join(workspaceRoot, 'mcp-config.json');
  const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
  console.log('  ✅ MCP config: Valid JSON');
  
  if (mcpConfig.mcpServers) {
    const serverCount = Object.keys(mcpConfig.mcpServers).length;
    console.log(`  ✅ MCP servers: ${serverCount} configured`);
  } else {
    console.log('  ❌ MCP servers: No servers configured');
    hasErrors = true;
  }
} catch (error) {
  console.log('  ❌ MCP config: Invalid or missing');
  hasErrors = true;
}

// Check database connection (basic)
console.log('\n🗄️  Database Connection:');
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`  ✅ Database URL: Valid format (${url.protocol}//${url.hostname})`);
  } catch (error) {
    console.log('  ❌ Database URL: Invalid format');
    hasErrors = true;
  }
} else {
  console.log('  ❌ Database URL: Not configured');
  hasErrors = true;
}

// Final status
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ PREFLIGHT FAILED - Fix errors before deployment');
  process.exit(1);
} else {
  console.log('✅ PREFLIGHT PASSED - Ready for production');
  process.exit(0);
}