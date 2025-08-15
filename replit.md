# Bristol Site Intelligence Platform

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
- **AI Integration**: **UNIFIED CHAT SYSTEM** - Advanced AI architecture with perfect memory retention and cross-session context sharing. Features OpenRouter API + Direct OpenAI BYOK integration supporting GPT-5 (flagship model), Grok 4, Claude 4 Opus, Gemini 2.5 Pro, and Perplexity Sonar. The Bristol A.I. Elite v6.0 system includes: unified chat service powering both floating widget and main chat interfaces, advanced memory service with long-term context awareness, enhanced auth middleware with bulletproof session management, comprehensive tool and data sharing between all interfaces, perfect conversation continuity across sessions, and institutional-quality error handling with multiple fallback systems.
- **File Storage**: Google Cloud Storage.
- **Real-time Features**: WebSocket server for live updates, chat, and tool execution status.
- **System Design Choices**: The Bristol A.I. acts as a central AI controller with full website API access and MCP (Model Context Protocol) server integration. **Unified Architecture**: Single chat service consolidates all chat functionality with shared memory, tools, and context between floating widget and main chat. Advanced memory service tracks user preferences, conversation history, and tool usage across all sessions. Enhanced authentication ensures bulletproof user management and secure access to all features.

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
- **Primary Web Scraping**: Firecrawl API (default scraper for property data extraction with LLM-ready markdown output and structured data extraction).
- **Fallback Scrapers**: Enhanced scraping agent and legacy adapters (ApartmentList, Rentals.com, LoopNet, Craigslist) for backup data collection.
- **Economic Data APIs**: BLS (employment), BEA (GDP/income), HUD (vacancy rates).
- **Other Data APIs**: Foursquare, FBI, NOAA.
- **Automation Tools**: n8n Workflows, Census Data API, HUD Fair Market Rent, Metrics Storage.
- **Mapping**: MapBox GL.
- **Microsoft 365**: Integration foundation for OneDrive and Outlook connectivity.