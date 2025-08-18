#!/bin/bash
# Complete verification pipeline for Bristol deployment gate

set -e  # Exit on any failure

echo "🔍 BRISTOL DEPLOYMENT VERIFICATION PIPELINE"
echo "============================================="

# 1. Critical file protection
echo "1. Verifying critical files..."
node scripts/verify-critical.js
echo "   ✅ Critical files verified"

# 2. Regression guards
echo "2. Running regression guards..."
node scripts/guard-no-html-proxy.js
echo "   ✅ No HTML import regressions"

# 3. Runtime endpoints
echo "3. Testing runtime endpoints..."
npx tsx scripts/prove.runtime.ts
echo "   ✅ All endpoints responding"

# 4. MCP tools
echo "4. Testing MCP tools..."
npx tsx scripts/prove.mcp.ts  
echo "   ✅ All MCP tools functional"

# 5. ElevenLabs integration
echo "5. Testing ElevenLabs integration..."
npx tsx scripts/prove.elevenlabs.ts
echo "   ✅ ElevenLabs integration verified"

echo ""
echo "🎉 ALL VERIFICATION CHECKS PASSED"
echo "   Deployment is authorized."
echo "   Audit trail available in docs/prove-*.json"
echo ""