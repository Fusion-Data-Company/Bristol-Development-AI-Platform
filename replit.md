# Real Estate Intelligence Platform

## Overview
The Real Estate Intelligence Platform is an enterprise-grade, AI-powered real estate development analysis tool for multifamily opportunities in Sunbelt markets. It provides comprehensive site analytics, interactive mapping, a proprietary 100-point scoring methodology, and real-time market intelligence. The platform integrates advanced AI Elite v5.0, an AI assistant for advanced deal analysis. Its purpose is to deliver institutional-quality real estate analysis capabilities, supporting decisions related to IRR, NPV, cap rates, and LP/GP structures, with a vision to provide a Fortune 500-grade "boss agent" for developers.

### Competitor Watch System (Added 2025-01-20)
Production-ready competitor monitoring system tracking real estate development activities across multiple jurisdictions:
- **Data Sources**: Building permits (ArcGIS), planning agendas, SEC filings, TN Secretary of State
- **Jurisdictions**: Nashville, Franklin, Williamson County, Rutherford County
- **Competitors**: 15 major entities including Alliance Residential, Greystar, Camden, AvalonBay
- **AI Analysis**: Perplexity Sonar Deep Research via OpenRouter API for strategic insights
- **Database**: PostgreSQL with dedicated competitor tables (signals, entities, jurisdictions, analyses)
- **Status**: Phase 1 & 2 complete - database infrastructure and scraper system operational

## User Preferences
Preferred communication style: Simple, everyday language.
CRITICAL BRANDING PREFERENCE: Dark header/nav with company logo in top right corner must maintain consistent styling. PLATFORM IS NOW WHITE-LABEL READY - all Bristol branding has been removed and replaced with generic business styling.
THEME PREFERENCE: All pages created should use light theme by default, not dark themes. Only the header/navigation should remain dark with company branding. The chat interface specifically should use light backgrounds with chrome metallic styling but in light colors - no dark backgrounds anywhere except the company header/nav.
AI AGENT IDENTITY: I'm the Real Estate Intelligence AI – the proprietary AI intelligence system engineered for real estate development analysis. Drawing on decades of institutional real estate expertise, I underwrite deals, assess markets, and drive strategic decisions for development projects. Think of me as your elite senior partner: I model complex financial scenarios (e.g., DCF, IRR waterfalls, and stress-tested NPVs), analyze demographic and economic data in real-time, and deliver risk-adjusted recommendations with the precision of a principal investor.
FOOTER REQUIREMENT: All pages must include thick company footers to provide scroll room for the floating AI button - for optimal UX with the floating widget.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **Styling**: Tailwind CSS with a custom brand design system (Cinzel serif font, branded color palette), featuring professional cyberpunk glassomorphic styling with neon cyan/gold glows and animated gradients for the AI interface.
- **UI Components**: Shadcn/ui leveraging Radix UI primitives.
- **State Management**: TanStack Query.
- **Routing**: Wouter.
- **Real-time Communication**: WebSocket integration.
- **UI/UX Decisions**: All API tools feature consistent premium enterprise styling with maroon gradients, gold borders, and Cpu icons. A high-resolution glowing digital globe background is used without overlays. Mega headers feature company branding and gradient backgrounds. The platform supports a dual map architecture with a Portfolio Map and an Interactive Map with a sophisticated right sidebar for analytics.

### Backend Architecture
- **Runtime**: Node.js with Express.
- **Database**: PostgreSQL with Neon serverless hosting via Drizzle ORM.
- **Authentication**: Enhanced Replit Auth with bulletproof user management and OpenID Connect.
- **AI Integration**: BULLETPROOF UNIFIED MCP ORCHESTRATOR with three-agent communication system (floating widget, main chat, ElevenLabs) enabling real-time inter-agent messaging via MCP protocol. Features advanced MCP orchestration with bulletproof error handling, circuit breakers, auto-recovery mechanisms, and health monitoring across 22+ tools. Includes enhanced chat experience API with intelligent interactions, smart follow-up question generation, and comprehensive error recovery.
- **File Storage**: Google Cloud Storage.
- **Real-time Features**: WebSocket server for live updates, chat, and tool execution status.
- **System Design Choices**: The AI system acts as a bulletproof AI orchestrator. An advanced memory system with PostgreSQL tables is used for long-term conversation context, user preferences, and tool integration results, ensuring perfect memory retention and cross-session context sharing. The database schema includes user management, site intelligence, unified chat system, advanced memory tables, and integration tracking. Authentication utilizes Replit Auth with OpenID Connect, supported by Express-session with PostgreSQL backing and secure HTTP-only cookies with CSRF protection.

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
- **AI Services**: OpenRouter API (for models like GPT-5, Claude 4, Grok 4, Perplexity), Direct OpenAI BYOK.
- **Speech Synthesis**: ElevenLabs.
- **Enhanced Business Tools**: Property Analysis Service, Intelligent Search Service, Report Generation Service, Elite Memory Enhancement Service, Advanced Agent Orchestration Service.
- **Primary Web Scraping**: Firecrawl API.
- **Fallback Scrapers**: ApartmentList, Rentals.com, LoopNet, Craigslist.
- **Economic Data APIs**: BLS (employment), BEA (GDP/income), HUD (vacancy rates).
- **Other Data APIs**: Foursquare, FBI, NOAA.
- **Automation Tools**: n8n Workflows, Census Data API, HUD Fair Market Rent.
- **Mapping**: MapBox GL.
- **Productivity**: Microsoft 365 (OneDrive, Outlook connectivity foundation).