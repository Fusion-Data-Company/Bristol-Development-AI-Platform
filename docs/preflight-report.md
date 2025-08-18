# Pre-Flight Audit Report - Bristol Development App Production Hardening

Generated: August 18, 2025

## 1. Dependency and Route Graph

### Key Files Identified:
- **MCP Configuration**: `mcp-config.json`, `server/config/elite-mcp-servers.json`
- **Webhook Routes**: `server/api/elevenlabs-webhook.ts`
- **Main Server**: `server/index.ts`
- **Routes**: `server/routes.ts`
- **Client Entry**: `client/src/main.tsx`, `client/src/App.tsx`

### Route Endpoints Found:
- `/api/elevenlabs-webhook` - ElevenLabs webhook handler
- Multiple MCP-related endpoints in server/api/mcp-*.ts files
- Bristol agent endpoints in server/api/bristol-*.ts files
- Chat system endpoints in server/api/chat*.ts files

## 2. Potential Placeholders Found

### Files with Placeholder Patterns:
- Limited to TypeScript definition files in node_modules and cache
- Main application code appears to be free of placeholder patterns

## 3. Asset Inventory

### Client Assets:
- `client/public/bristol-logo-social.svg`
- `client/public/bristol-social-preview.png`
- Large collection of attached assets in `attached_assets/` directory

### File Sizes: (To be measured during cleanup phase)

## 4. MCP & Webhook Integrity

### PROTECTED FILES IDENTIFIED:
1. **MCP Configuration**:
   - `mcp-config.json` - Already marked as PROTECTED
   - `server/config/elite-mcp-servers.json` - Elite MCP server configuration
   - `server/mcp-postgres-server.cjs` - Database MCP server

2. **Webhook Routes**:
   - `server/api/elevenlabs-webhook.ts` - ElevenLabs webhook handler

3. **MCP Integration Services**:
   - `server/services/mcpService.ts`
   - `server/services/integrationService.ts`
   - All files in `server/api/mcp-*.ts`

## 5. Mobile Readiness Assessment

### Pages Requiring Mobile Optimization:
- Main application layout needs mobile navigation
- Chat interface requires mobile-friendly design
- Property/sites pages need responsive layout
- Pop-out agent component needs mobile hiding

### Identified Issues:
- No mobile navigation system currently implemented
- Pop-out agent not hidden on mobile viewports
- Need to verify responsive design across all pages

## 6. Build Settings

### Current Configuration:
- **Node Version**: Using TypeScript 5.6.3, Node 20.x (implied by package.json)
- **Build Command**: `vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist`
- **Start Command**: `NODE_ENV=production node dist/index.js`
- **Development**: `NODE_ENV=development tsx server/index.ts`

### Issues Identified:
- Missing production-specific npm scripts from mega prompt requirements
- Need to add preflight, analyze, lint, typecheck, a11y scripts

## 7. Security & Compliance Quick Pass

### Current State:
- CORS configuration present in server setup
- Express security middleware appears to be configured
- Environment variables used for API keys
- No obvious security vulnerabilities in initial scan

### Required Improvements:
- Need to add Content Security Policy headers
- Rate limiting may need enhancement
- Error handling should be reviewed for information leakage

## 8. Risk Assessment

### High Risk (DO NOT MODIFY):
- `mcp-config.json` and all MCP-related configuration files
- `server/api/elevenlabs-webhook.ts` and webhook handlers
- Environment variable names and structure
- MCP server implementations and tools

### Medium Risk (Modify with Caution):
- Main application routes in `server/routes.ts`
- Client-side routing in `client/src/App.tsx`
- Database configuration and connections

### Low Risk (Safe to Modify):
- UI components and styling
- Mobile navigation implementation
- Performance optimizations
- Asset optimization

## 9. Immediate Action Plan

### Phase 1 - Mobile Implementation:
1. Hide pop-out agent on mobile viewports
2. Implement mobile navigation system
3. Ensure chat page mobile usability

### Phase 2 - Placeholder Purge:
1. Scan for remaining placeholders
2. Implement or remove placeholder functionality
3. Gate demo content behind DEMO_MODE flag

### Phase 3 - Performance & Security:
1. Add production logging system
2. Implement CSP headers
3. Optimize assets and bundling
4. Add error boundaries

### Phase 4 - Build & Deploy:
1. Update package.json scripts
2. Verify production build process
3. Add operational documentation

## 10. Protected File Marking Required

The following files need `// PROTECTED: do not modify without owner approval` comments:
- `mcp-config.json` ✅ (already marked)
- `server/config/elite-mcp-servers.json`
- `server/mcp-postgres-server.cjs`
- `server/api/elevenlabs-webhook.ts`
- All `server/api/mcp-*.ts` files
- `server/services/mcpService.ts`
- `server/services/integrationService.ts`

## Summary

The application appears to be in good shape with minimal placeholders and a solid MCP/webhook foundation. The primary work needed is mobile optimization, performance hardening, and production readiness improvements. All high-risk areas have been identified and will be protected during the hardening process.