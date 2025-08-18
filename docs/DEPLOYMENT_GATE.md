# 🚪 DEPLOYMENT GATE - NEVER DEPLOY BROKEN CODE

**Created**: August 18, 2025  
**Purpose**: Prevent deployment of broken Bristol functionality

## ✅ PRE-DEPLOYMENT CHECKLIST

**All checks must pass before any deployment:**

### 1. **Runtime Endpoints** (7/7 must pass)
```bash
npx tsx scripts/prove.runtime.ts
```
**Expected**: All endpoints return 2xx status codes
- `/api/elevenlabs?dryRun=1`
- `/api/elevenlabs-webhook?dryRun=1` 
- `/api/mcp-elevenlabs?dryRun=1`
- `/api/mcp/health`
- `/api/mcp-stream`
- `/api/sites`
- `/api/sites/metrics`

### 2. **MCP Tools** (7/7 must pass)
```bash
npx tsx scripts/prove.mcp.ts
```
**Expected**: All tools respond with success in <50ms
- `verify_user`
- `get_bristol_team`
- `portfolio_analytics`
- `market_research`
- `web_scraping`
- `generate_image`
- `analyze_document`

### 3. **ElevenLabs Integration** 
```bash
npx tsx scripts/prove.elevenlabs.ts
```
**Expected**: DryRun and Webhook both return 200

### 4. **Critical File Protection**
```bash
node scripts/verify-critical.js
```
**Expected**: "✅ All critical paths verified"

### 5. **Regression Guards**
```bash
node scripts/guard-no-html-proxy.js
```
**Expected**: No HTML imports from API paths

## 🚨 FAILURE RESPONSES

**If ANY check fails:**

1. **DO NOT DEPLOY** - Fix the issue first
2. Check the JSON reports in `docs/prove-*.json` for exact error details
3. If needed, restore from stable tag:
   ```bash
   # See docs/STABLE_COMMIT.txt for commit hash
   git checkout <stable-commit> -- path/to/broken/file
   ```

## 📊 VERIFICATION ARTIFACTS

**Every deployment must generate these files:**
- `docs/prove-runtime.json` - Endpoint verification
- `docs/prove-mcp.json` - Tool verification  
- `docs/prove-elevenlabs.json` - Audio synthesis verification
- `docs/VERIFICATION_EVIDENCE.md` - Complete audit trail

## 🔒 STABLE STATE RECOVERY

**Last known good commit**: See `docs/STABLE_COMMIT.txt`
**Recovery command**: 
```bash
git checkout $(cat docs/STABLE_COMMIT.txt) -- server/api/ server/services/
```

## 📋 RELEASE RITUAL

1. Run all verification scripts
2. Confirm 100% pass rate
3. Generate audit trail
4. Deploy with confidence
5. Never deploy on claims alone - only on proof

**Remember**: If it doesn't verify, it doesn't deploy.