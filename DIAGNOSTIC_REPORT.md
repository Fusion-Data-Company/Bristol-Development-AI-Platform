# Bristol Site Intelligence Platform - Full Environment & Runtime State Report

## 1. Framework Detection
- **Framework**: Custom Express.js + Vite setup with React frontend
- **TypeScript Version**: 5.6.3
- **Node.js Version**: v20.19.3
- **TSX Version**: v4.19.2 (TypeScript executor)
- **Mode**: Development (NODE_ENV=development)
- **Build Tool**: Vite 5.4.19 for frontend, esbuild for backend

## 2. Entry Points & Build Pipeline

### Frontend Entry Points
- **Main Entry**: `client/src/main.tsx`
- **App Component**: `client/src/App.tsx`
- **Root Element**: `document.getElementById("root")`

### Build Configuration
- **Vite Config**: `vite.config.ts`
- **Build Output**: `dist/public`
- **Frontend Root**: `client/` directory

### Package.json Scripts
```json
{
  "dev": "NODE_ENV=development tsx server/index.ts",
  "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "NODE_ENV=production node dist/index.js"
}
```

## 3. Routing Setup

### File Structure
```
client/src/pages/
├── Landing.tsx (unauthenticated)
├── App.tsx (main app)
├── Dashboard.tsx
├── Sites.tsx
├── Analytics.tsx
├── Chat.tsx
├── Demographics.tsx
├── Tools.tsx
├── ToolsConsole.tsx
└── IntegrationsNew.tsx
```

### Route Configuration (wouter)
- Uses conditional routing based on authentication status
- Unauthenticated users see Landing page
- Authenticated users get full app with navigation

## 4. Server Setup

### Express Server (`server/index.ts`)
- **Port**: 5000 (or process.env.PORT)
- **Host**: 0.0.0.0
- **Middleware**: JSON parsing, URL encoding, request logging
- **Development**: Uses Vite dev server integration
- **Production**: Serves static files from dist/public

### Key Server Files
- `server/routes.ts` - Main API routes registration
- `server/simple-routes.ts` - Fallback simple routes
- `server/replitAuth.ts` - Authentication middleware
- `server/storage.ts` - Database operations
- `server/vite.ts` - Vite development server integration

## 5. Environment Variables

### Current .env
```
FEATURE_PARLAY=off
```

### Available Secrets
- ✅ DATABASE_URL (exists)
- ✅ OPENROUTER_API_KEY (exists) 
- ✅ OPENROUTER_API_KEY2 (exists)

## 6. Dependencies

### Core Production Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "express": "^4.21.2",
  "typescript": "5.6.3",
  "vite": "^5.4.19",
  "@tanstack/react-query": "^5.60.5",
  "wouter": "^3.3.5",
  "drizzle-orm": "^0.39.1",
  "@neondatabase/serverless": "^0.10.4"
}
```

### UI Dependencies
- Complete Radix UI component suite (@radix-ui/*)
- Tailwind CSS with animations
- Lucide React icons
- Framer Motion for animations

## 7. Running Processes & Ports

### Current Status: FAILED ❌
- **Workflow**: "Start application" status: failed
- **Command**: `NODE_ENV=development tsx server/index.ts`
- **Expected Port**: 5000
- **Issue**: Server not opening port after 60 seconds timeout

### Error Details
```
run command "Start application" didn't open port `5000` after 60000ms. 
Consider optimizing any resource-intensive startup operations.
```

## 8. WebSocket/HMR Configuration

### Vite HMR Setup
- **Plugin**: @vitejs/plugin-react
- **Runtime Error Modal**: @replit/vite-plugin-runtime-error-modal
- **Cartographer**: @replit/vite-plugin-cartographer (dev only)
- **Client**: Vite serves /@vite/client for HMR

### WebSocket Service
- Custom WebSocket service initialized in `server/services/websocketService.ts`
- HTTP server creation in `server/routes.ts`

## 9. Browser Console Errors

### TypeScript Compilation Errors (RESOLVED)
- ✅ Fixed: ParallaxBackground component props error in Landing.tsx
- ✅ No current LSP diagnostics found

### Expected Frontend Errors
- Authentication 401 errors (expected for unauthenticated state)
- Unable to test browser errors due to server startup failure

## 10. Network Tab Logs

### API Endpoints Status
- `GET /api/auth/user` → 401 Unauthorized (expected)
- `POST /api/openrouter` → 401 Unauthorized (expected)
- Unable to test further due to server not starting

## 11. Crash Logs

### Server Startup Issues
```
Initialized 5 MCP tools
[express] serving on port 5000
```
Server logs show initialization but process terminates or doesn't bind properly to port.

### Root Cause Analysis
The server appears to:
1. Initialize MCP tools successfully
2. Log "serving on port 5000" 
3. Not actually bind to the port or crashes immediately after

## 12. OpenRouter Integration Check

### ✅ Found: `/api/openrouter-models` endpoint
**File**: `server/api/openrouter-models.ts`
- Fetches models from OpenRouter API
- Filters to ELITE_MODELS only (GPT-5, Claude Opus 4, Grok 4, etc.)
- Uses OPENROUTER_API_KEY2 or fallback to OPENAI_API_KEY

### ✅ Found: `/api/openrouter` endpoint  
**File**: `server/routes.ts` (lines 77-95)
- POST endpoint for AI chat requests
- Requires authentication
- Proxies to OpenRouter API with proper auth headers

### Elite Models Configuration
```javascript
const ELITE_MODELS = [
  "openai/gpt-5",
  "openai/gpt-5-chat", 
  "anthropic/claude-opus-4",
  "anthropic/claude-opus-4.1",
  "x-ai/grok-4",
  "google/gemini-2.5-pro",
  "perplexity/sonar-deep-research",
  // ... more elite models
];
```

## 13. Global CSS & Theme Handling

### Styling Architecture
- **Framework**: Tailwind CSS with custom Bristol theme
- **Components**: Shadcn/ui with Radix UI primitives
- **Theme**: Custom Bristol brand colors (gold, maroon, ink)
- **Global Styles**: `client/src/index.css`
- **Font**: Cinzel serif for headers, sans-serif for body

### Theme Configuration
- No theme provider issues detected
- CSS imports properly configured in Vite

## 14. Stateful Components

### BristolFloatingWidget Integration
- **Location**: `client/src/components/BristolFloatingWidget.tsx`
- **Usage**: Imported in `client/src/App.tsx` line 8, rendered line 75
- **Issue**: Component only renders when authenticated
- **Props**: Receives aggregated app data (sites, analytics, user context)

### Component Architecture
- Widget is client-side only (no SSR issues)
- Proper conditional rendering based on authentication state
- Uses React Query for data fetching

## CRITICAL ISSUES IDENTIFIED

### 🚨 Primary Issue: Server Startup Failure
1. **Symptom**: Server process terminates or fails to bind to port 5000
2. **Impact**: Entire application unusable
3. **Likely Causes**:
   - Database connection timeout during startup
   - MCP service initialization hanging
   - Route registration failing
   - Memory session store issues

### 🔧 Recommended Immediate Actions
1. Switch to simplified route registration temporarily
2. Add proper error handling to server startup
3. Implement timeout handling for database connections
4. Add debugging logs to identify where startup fails

### 🎯 Next Steps for Debugging
1. Test server startup with minimal route configuration
2. Isolate MCP service initialization
3. Verify database connectivity without blocking startup
4. Add process.on error handlers for uncaught exceptions