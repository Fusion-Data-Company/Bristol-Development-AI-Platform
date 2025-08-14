# Bristol Site Intelligence Platform

## Overview
The Bristol Site Intelligence Platform is an enterprise-grade, AI-powered real estate development analysis tool. It is designed for multifamily development opportunities within Sunbelt markets. The platform provides comprehensive site analytics, interactive mapping, a proprietary 100-point Bristol scoring methodology, and real-time market intelligence. A key feature is the integrated AI assistant, Bristol A.I. Elite v5.0, which functions as a Fortune 500-grade always-on "boss agent" for advanced deal analysis with full-screen cyberpunk/glassomorphic interface. The platform aims to provide institutional-quality real estate analysis capabilities, supporting decisions related to IRR, NPV, cap rates, and LP/GP structures.

## User Preferences
Preferred communication style: Simple, everyday language.
**CRITICAL BRANDING PREFERENCE:** Dark Bristol header/nav with gold logo in top right corner must NEVER be changed - user has requested this multiple times and styling should remain consistent.
**THEME PREFERENCE:** All pages created should use light theme by default, not dark themes. Only the header/navigation should remain dark with Bristol branding.
**AI AGENT IDENTITY:** Bristol A.I. Elite now uses updated professional identity: "I'm the Bristol Site Intelligence AI – the proprietary AI intelligence system engineered exclusively for Bristol Development Group. Drawing on over three decades of institutional real estate expertise, I underwrite deals, assess markets, and drive strategic decisions for Bristol Development projects. Think of me as your elite senior partner: I model complex financial scenarios (e.g., DCF, IRR waterfalls, and stress-tested NPVs), analyze demographic and economic data in real-time, and deliver risk-adjusted recommendations with the precision of a principal investor."

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
- **Authentication**: Replit Auth with OpenID Connect.
- **AI Integration**: OpenRouter API + Direct OpenAI BYOK integration for conversational AI, supporting models like GPT-5 (default with BYOK), Grok 4, Claude 4 Opus, Gemini 2.5 Pro, and Perplexity Sonar. The Bristol A.I. Elite v5.0 AI agent features GPT-5 as flagship model using OPENAI_API_KEY2 BYOK setup, advanced persistent memory management, full-screen cyberpunk/glassomorphic popout widget with fixed input bar at bottom, comprehensive PostgreSQL database schema (tables for agents, conversations, memories, files, prompts, context, decisions), and enhanced property analysis visualization with special formatting for IRR/NPV/Cap Rate metrics and risk assessments.
- **File Storage**: Google Cloud Storage.
- **Real-time Features**: WebSocket server for live updates, chat, and tool execution status.
- **System Design Choices**: The Bristol A.I. acts as a central AI controller with full website API access and MCP (Model Context Protocol) server integration, allowing real-time data injection and tool execution. API tools are designed with a uniform response format `{ ok, params, rows, meta }` and robust error handling. A memory-based caching system is implemented for API responses.

### Data Storage Solutions
- **Primary Database**: PostgreSQL on Neon, accessed via Drizzle ORM for type-safe operations.
- **Session Storage**: PostgreSQL-backed session store for authentication.
- **Schema Structure**: Includes user management, site intelligence (sites, site_metrics), chat system (chat_sessions, chat_messages), and integration tracking (integration_logs, mcp_tools). A `snapshots` table exists for saving tool results.

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
- **Economic Data APIs**: BLS (employment), BEA (GDP/income), HUD (vacancy rates).
- **Other Data APIs**: Foursquare, FBI, NOAA.
- **Automation Tools**: n8n Workflows, Apify Web Scraping, Census Data API, HUD Fair Market Rent, Metrics Storage.
- **Mapping**: MapBox GL.
- **Microsoft 365**: Integration foundation for OneDrive and Outlook connectivity.