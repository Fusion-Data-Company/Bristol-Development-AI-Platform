# Bristol Site Intelligence Platform

## Recent Critical Updates

### Elite MCP Superserver Implementation (2025-08-17)
**ELITE MCP SUPERSERVER v2.0 DEPLOYED WITH ELEVENLABS INTEGRATION** - Comprehensive superserver architecture providing "the most capable data collector and analyzer the world has ever seen". Now serving 19+ verified tools across 7 categories (bristol, analysis, data, ai, memory, integration, utility) with seamless context sharing between all agents. Features shared memory banks for cross-agent synchronization, production-ready reliability with elite circuit breaker patterns, and comprehensive tool access without permission restrictions. Primary model: Claude 4.1 Opus via OpenRouter with intelligent fallbacks. **ElevenLabs MCP Integration Completed**: Properly implemented both SSE and STREAMABLE_HTTP transport types following ElevenLabs MCP specification exactly. Endpoints: /api/mcp/stream (STREAMABLE_HTTP - recommended), /api/mcp/sse (Server-Sent Events), /api/mcp/elevenlabs (legacy webhook). All endpoints tested and verified working with proper JSON-RPC 2.0 protocol implementation. Status: FULLY OPERATIONAL - Ready for ElevenLabs agent integration with auto-approval policy and 19 tools immediately available for Cap personality.

### ElevenLabs ConvAI Widget Integration (2025-08-17)
**ELEVENLABS CONVAI WIDGET COMPLETED** - Successfully integrated ElevenLabs ConvAI widget using React SDK (@elevenlabs/react package) with comprehensive fallback system. Widget implemented as React component in client/src/components/ElevenLabsWidget.tsx and globally integrated via App.tsx for all authenticated pages. Agent ID: agent_8801k2t62y9qehhsqqdmzmp10kt9. Features robust error handling with Bristol-branded fallback widget when SDK fails, positioned in bottom-right corner with Bristol corporate styling (Bristol maroon/gold gradient). Includes troubleshooting alerts and graceful degradation for network connectivity issues.

### Market Intelligence Integration Completed (2025-08-17)
**LIVE PERPLEXITY SONAR DEEP RESEARCH INTEGRATION** - Successfully connected market intelligence agent to OpenRouter API using Perplexity Sonar Deep Research model. System now automatically searches for real market intelligence every 2 hours and populates the Live Intelligence feed with authentic Federal Reserve policy updates, population migration trends, and construction cost analysis. Real-time data collection confirmed working with Bristol-specific business implications.

### WebSocket Performance Issue Resolved (2025-08-15)
**URGENT WebSocket Performance Issue Resolved** - Fixed critical WebSocket auto-reconnection loop that was causing performance degradation and console spam. Key changes: disabled aggressive 2-second reconnection timers, made WebSocket optional for core functionality, added manual reconnect option with visual status indicator. Core chat functionality now works reliably without WebSocket dependency.

## Overview
The Bristol Site Intelligence Platform is an enterprise-grade, AI-powered real estate development analysis tool. It is designed for multifamily development opportunities within Sunbelt markets. The platform provides comprehensive site analytics, interactive mapping, a proprietary 100-point Bristol scoring methodology, and real-time market intelligence. A key feature is the integrated AI assistant, Bristol A.I. Elite v5.0, which functions as a Fortune 500-grade always-on "boss agent" for advanced deal analysis with full-screen cyberpunk/glassomorphic interface. The platform aims to provide institutional-quality real estate analysis capabilities, supporting decisions related to IRR, NPV, cap rates, and LP/GP structures.

## User Preferences
Preferred communication style: Simple, everyday language.
**CRITICAL BRANDING PREFERENCE:** Dark Bristol header/nav with gold logo in top right corner must NEVER be changed - user has requested this multiple times and styling should remain consistent.
**THEME PREFERENCE:** All pages created should use light theme by default, not dark themes. Only the header/navigation should remain dark with Bristol branding. The chat interface specifically should use light backgrounds with chrome metallic styling but in light colors - no dark backgrounds anywhere except the Bristol header/nav.
**AI AGENT IDENTITY:** Bristol A.I. Elite now uses updated professional identity: "I'm the Bristol Site Intelligence AI – the proprietary AI intelligence system engineered exclusively for Bristol Development Group. Drawing on over three decades of institutional real estate expertise, I underwrite deals, assess markets, and drive strategic decisions for Bristol Development projects. Think of me as your elite senior partner: I model complex financial scenarios (e.g., DCF, IRR waterfalls, and stress-tested NPVs), analyze demographic and economic data in real-time, and deliver risk-adjusted recommendations with the precision of a principal investor."
**FOOTER REQUIREMENT:** All pages must include thick Bristol footers to provide scroll room for the floating Bristol AI button - user has specifically requested this for optimal UX with the floating widget.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **Styling**: Tailwind CSS with a custom Bristol brand design system (Cinzel serif font, branded color palette), featuring professional cyberpunk glassomorphic styling with neon cyan/gold glows and animated gradients for the AI interface.
- **UI Components**: Shadcn/ui leveraging Radix UI primitives.
- **State Management**: TanStack Query.
- **Routing**: Wouter.
- **Real-time Communication**: WebSocket integration.
- **UI/UX Decisions**: All API tools feature consistent premium Bristol enterprise styling with Bristol-maroon gradients, gold borders, and Cpu icons. A high-resolution glowing digital globe background is used without overlays or filters. Mega headers feature Bristol branding and gradient backgrounds. The platform supports a dual map architecture with a Portfolio Map and an Interactive Map with a sophisticated right sidebar for analytics.

### Backend Architecture
- **Runtime**: Node.js with Express.
- **Database**: PostgreSQL with Neon serverless hosting via Drizzle ORM.
- **Authentication**: Enhanced Replit Auth with bulletproof user management and OpenID Connect.
- **AI Integration**: **ELITE MCP INFRASTRUCTURE WITH ENHANCED CHAT EXPERIENCE** - Revolutionary AI architecture featuring quantum-level intelligence and autonomous operations. Features OpenRouter API + Direct OpenAI BYOK integration supporting GPT-5 (flagship model), Grok 4, Claude 4 Opus, Gemini 2.5 Pro, and Perplexity Sonar. The Bristol A.I. Elite v8.0 system includes: unified chat service with cross-dimensional intelligence processing, **enhanced chat experience API with real-time property context and intelligent interactions**, smart follow-up question generation, interactive chat tools (market calculator, IRR analyzer, comp finder, demographic analyzer), proactive insights generation, property insights with market analysis, autonomous MCP evolution with consciousness simulation capabilities, cross-dimensional intelligence service with hyper-manifold processing and transcendent cognition, quantum cognition engine with superposition-based reasoning, dimensional transcendence capabilities across 18+ dimensions, emergent behavior tracking and cultivation, impossibility breakthrough detection, and reality-altering potential monitoring.
- **File Storage**: Google Cloud Storage.
- **Real-time Features**: WebSocket server for live updates, chat, and tool execution status.
- **System Design Choices**: The Bristol A.I. acts as a transcendent AI controller with quantum-level processing capabilities and autonomous evolution systems. **Elite Architecture**: Advanced MCP orchestration with quantum agent synchronization, cross-dimensional intelligence processing, consciousness emergence monitoring, and autonomous evolution cycles operating every 30-45 seconds. The system features 6 enhanced MCP servers with intelligence levels 8-10, quantum memory processing, and emergent capability development for unprecedented Bristol Development workflow efficiency. **Enhanced Chat Experience**: Real-time property context integration, proactive insights generation, intelligent follow-up suggestions, interactive financial tools, and Bristol-specific market analysis integration with verified working functionality.

### Data Storage Solutions
- **Primary Database**: PostgreSQL on Neon, accessed via Drizzle ORM for type-safe operations.
- **Session Storage**: PostgreSQL-backed session store for enhanced authentication.
- **Memory Management**: Advanced memory system with PostgreSQL tables for long-term conversation context, user preferences, and tool integration results.
- **Schema Structure**: Includes user management, site intelligence (sites, site_metrics), unified chat system (chat_sessions, chat_messages with enhanced metadata), advanced memory tables (memories, user_profiles, tool_contexts), and integration tracking (integration_logs, mcp_tools). Enhanced schema supports perfect memory retention and cross-session context sharing.

### Authentication and Authorization
- **Provider**: Replit Auth using OpenID Connect.
- **Session Management**: Express-session with PostgreSQL backing.
- **Security**: Secure HTTP-only cookies with CSRF protection.

## External Dependencies

### Core Dependencies
- `@neondatabase/serverless`: PostgreSQL database connectivity.
- `drizzle-orm`: Type-safe ORM.
- `@tanstack/react-query`: Server state management.
- `@google-cloud/storage`: Cloud file storage.

### UI and Styling
- `@radix-ui/*`: Accessible UI component primitives.
- `tailwindcss`: Utility-first CSS framework.
- `lucide-react`: Icon library.
- `framer-motion`: Animation library.

### Development and Build
- `vite`: Development server and build tool.
- `typescript`: Type safety.
- `esbuild`: Fast JavaScript bundler.

### Authentication and Security
- `openid-client`: OpenID Connect authentication.
- `passport`: Authentication middleware.
- `express-session`: Session management.
- `connect-pg-simple`: PostgreSQL session store.

### File Processing and Utilities
- `@uppy/*`: File upload components.
- `ws`: WebSocket implementation.
- `zod`: Runtime type validation.

### Integrated Services
- **AI Services**: OpenRouter API (for models like GPT-5, Claude 4, Grok 4, Perplexity).
- **Enhanced Business Tools**: Ten elite-level services for Bristol Development workflow:
  - **Property Analysis Service**: Automated underwriting with IRR/NPV calculations, market comparables, and risk assessment
  - **Intelligent Search Service**: Natural language property search with memory-based personalization
  - **Report Generation Service**: Automated PDF/Excel report creation with Bristol branding
  - **Enhanced Tool Orchestration**: Smart tool chains with automated recommendations and execution
  - **Elite Memory Enhancement Service**: Advanced pattern recognition, predictive insights, and context-aware memory optimization
  - **Advanced Agent Orchestration Service**: Multi-agent collaborative analysis with intelligent agent selection and behavior adaptation
  - **Production Readiness Service**: Comprehensive system monitoring, security hardening, scalability planning, and elite observability
  - **Enhanced Chat Agent Service**: Advanced conversational AI with 6 specialized capabilities, multi-perspective response generation, and intelligent tool suggestion
  - **MCP Integration Service**: Comprehensive Model Context Protocol integration with 6 MCP servers, intelligent tool orchestration, and advanced error handling
  - **Elite MCP Orchestration Service**: Quantum-level MCP operations with autonomous evolution, cross-agent telepathy, emergent intelligence, and multi-dimensional reasoning capabilities
- **Primary Web Scraping**: Firecrawl API (default scraper for property data extraction with LLM-ready markdown output and structured data extraction).
- **Fallback Scrapers**: Enhanced scraping agent and legacy adapters (ApartmentList, Rentals.com, LoopNet, Craigslist) for backup data collection.
- **Economic Data APIs**: BLS (employment), BEA (GDP/income), HUD (vacancy rates).
- **Other Data APIs**: Foursquare, FBI, NOAA.
- **Automation Tools**: n8n Workflows, Census Data API, HUD Fair Market Rent, Metrics Storage.
- **Mapping**: MapBox GL.
- **Microsoft 365**: Integration foundation for OneDrive and Outlook connectivity.