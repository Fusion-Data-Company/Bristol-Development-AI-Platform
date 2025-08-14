# Bristol Site Intelligence Platform

## Overview

Bristol Site Intelligence Platform is a comprehensive enterprise-grade AI-powered real estate development analysis tool designed for multifamily development opportunities across Sunbelt markets. The platform features a sophisticated React frontend with advanced Bristol-branded design system, comprehensive site analytics including interactive MapBox mapping, proprietary 100-point Bristol scoring methodology, real-time market intelligence, and GPT-5 powered AI assistant. Built with modern web technologies including TypeScript, Tailwind CSS, and enterprise-grade animations, the platform provides institutional-quality real estate analysis capabilities.

## Recent Changes

**August 2025 - Bristol Brain Elite Integration**
- ✓ **MAJOR: Bristol Brain Elite Fully Integrated into Popout** - All elite AI functionality now exists within the single popout widget
  - Implemented comprehensive PostgreSQL database schema with persistent memory across sessions
  - Created tables for agents, conversations, memories (short/long term), files, prompts, context, and decisions
  - Built BristolBrainService with elite-level AI capabilities and persistent memory management
  - Developed advanced API routes with file upload functionality (PDF, Excel, CSV, JSON) and conversation management
  - Fully integrated elite features into existing BristolFloatingWidget popout:
    - Elite Mode toggle switches between standard and advanced AI capabilities
    - New tabs added: Prompts (system/project prompt management) and Files (document attachments)
    - Shared session ID enables conversation continuity between popout and chat page
    - All functionality contained within the single popout interface - no separate windows
  - AI now thinks like senior partner with 30+ years experience handling IRR, NPV, cap rates, waterfalls, LP/GP structures
  - System maintains memory of user preferences, past decisions, and deal analysis patterns
  - Elite mode provides comprehensive deal analysis with confidence scores and impact values
  - File attachment system processes documents for context-aware analysis
  - Decision tracking logs all investment recommendations with reasoning and confidence levels

**August 2025**
- ✓ **MAJOR: Bristol Brain Boss Agent Complete** - Transformed Bristol Brain Intelligence into elite cyberpunk "boss agent" with MCP server connectivity
  - Moved Brain button to bottom-right corner as independent element that hides when popup is open
  - Added comprehensive 4-tab interface: Chat, Data, MCP Tools, Brain Config with cyberpunk Fortune 500 enterprise styling
  - Created bristol-brain-enhanced.ts API endpoint with boss agent capabilities and MCP tool execution
  - Built WebSocket integration for real-time status updates and live data monitoring
  - Added cyberpunk futuristic UI styling with glass effects, ambient glows, and animated status indicators
  - Enhanced input system with status indicators showing LIVE/OFFLINE, MCP ACTIVE/DISABLED, and data source counts
  - Implemented boss mode with real-time data injection, MCP tool execution permissions, and comprehensive system monitoring
  - Created elite model selection with GPT-5, Claude 4, Grok 4 filtering and automatic fallback to OpenRouter API
  - Added Tools pane showing n8n Workflows, Apify Web Scraping, Census Data API, HUD Fair Market Rent, and Metrics Storage
  - Built comprehensive error handling with fallback mode when enhanced endpoint is unavailable
  - Bristol Brain now serves as central AI controller with full website API access and MCP server integration
- ✓ **COMPLETED: Tools Page Styling Overhaul** - Achieved complete enterprise styling consistency across all 6 API tools
  - Applied premium Bristol enterprise styling to all form inputs using bristol-form-enhanced class
  - Standardized "Run Analysis" buttons with Bristol-maroon gradients, gold borders, and Cpu icons
  - Added high-resolution glowing digital globe background without overlays or filters
  - Enhanced mega headers with Bristol branding, gradient backgrounds, and professional animations
  - All tools (BLS, BEA, HUD, Foursquare, FBI, NOAA) now feature identical premium styling
- ✓ **Bristol Floating AI Analyst Widget** - Completed production-ready floating analyst widget with OpenRouter AI integration
  - Slide-out panel from left edge with Chat/Data/Admin tabs
  - Dynamic model fetching from OpenRouter API filtering to elite models only (GPT-5, Claude 4, Grok 4, Perplexity)
  - Model switcher with automatic default selection preferring GPT-5 Chat
  - Admin tab for customizing Bristol mega-prompt with localStorage persistence
  - Data inspector showing all available app context (properties, demographics, analytics)
  - Secure OpenRouter proxy endpoint at /api/openrouter using OPENROUTER_API_KEY2
  - Automatic data context injection into each AI request for grounded analysis
  - Optional n8n webhook integration for telemetry and logging
  - Bristol-branded UI with gradient styling matching platform design system
  - Fixed all TypeScript compilation errors preventing app startup

**August 2025 (Previous)**
- ✓ **CRITICAL: Fixed API Tools Compatibility** - Successfully implemented compatibility layer that returns both new format `{ ok, rows, meta }` and legacy format `{ hasData, data }` for frontend
- ✓ **Verified Working APIs** - BLS and BEA APIs now fully functional and returning real data through the tools interface
- ✓ **Authentication Integration** - Fixed API authentication issues with Foursquare (Bearer token) and FBI (API_KEY parameter) formats
- ✓ **MAJOR: Complete API Tools Overhaul** - Rewrote all 6 API tools (BLS, BEA, HUD, Foursquare, FBI, NOAA) with uniform response format and proper error handling
- ✓ **New Unified Response Structure** - All tools now return consistent `{ ok: true/false, params: {...}, rows: [...], meta: {...} }` format
- ✓ **Enhanced API Endpoints** - Fixed endpoint URLs, parameter handling, and data processing for all external APIs
- ✓ **Improved Error Reporting** - Added detailed error logging with upstream API response text for debugging
- ✓ **Updated Cache Strategy** - Optimized cache keys and TTL values for each tool type (10min-24hr based on data volatility)
- ✓ **Fixed Route Structure** - Corrected HUD routing to support mode/zip/lookback and FBI routing for geo/state/offense/from/to patterns
- ✓ **Implemented Economic Intelligence Tools** - Added comprehensive BLS, BEA, and HUD API integration for live economic data analysis at /tools
- ✓ **Created Tools database schema** - Added snapshots table for saving tool results with user-specific data persistence
- ✓ **Built live API integration** - Three API routes (BLS employment, BEA GDP/income, HUD vacancy) with caching and error handling
- ✓ **Developed Tools UI components** - Interactive React components with real-time charts, data export, and snapshot saving
- ✓ **Integrated Chart.js visualization** - Professional data visualization with Bristol gold branding and responsive charts
- ✓ **Added caching system** - Memory-based caching for API responses to avoid rate limits and improve performance
- ✓ **CRITICAL: Restored dark Bristol branding** - Fixed header/nav styling with gold logo in top right corner (user requested this remain unchanged)
- ✓ **Completed geocoding system** - Enhanced with 3 fallback strategies, 100% of 46 properties now have coordinates
- ✓ **Upgraded Sites Intelligence page** - Premium dark Bristol styling with gold/ink theme throughout
- ✓ **Enhanced search and filters** - Bristol-branded search bar and status filters with premium styling
- ✓ **Upgraded content cards** - Database table and details sidebar with sophisticated dark Bristol theme
- ✓ **Fixed critical API calls** - Resolved incorrect apiRequest function usage causing geocoding failures
- ✓ **Premium modal styling** - Add Site form with matching Bristol dark branding
- ✓ **Resolved import errors** - Fixed missing Building/Map icon imports causing application crashes
- ✓ **Implemented dual map architecture** - Added Portfolio Map (current KML/KMZ layers) and Interactive Map with sophisticated right sidebar analytics as requested by user
- ✓ **Created InteractiveMapDashboard component** - Recreated original map functionality with Market Overview, Site Analysis, Demographics, Market Conditions, and Bristol Scoring panels in right sidebar

**December 2024**
- ✓ Completed comprehensive Bristol Site Intelligence Dashboard implementation
- ✓ Built advanced InteractiveMap component with MapBox GL integration and geocoding
- ✓ Implemented Bristol 100-point scoring methodology in SiteScoring component  
- ✓ Created MarketAnalytics component with real-time data visualization and charts
- ✓ Enhanced enterprise-grade Bristol branding with sophisticated animations and parallax backgrounds
- ✓ Fixed react-map-gl package compatibility issues for stable mapping functionality
- ✓ Integrated GPT-5 AI assistant via OpenRouter API for advanced site analysis
- ✓ Added comprehensive navigation system with Overview, Interactive Map, Site Scoring, Market Analytics, and AI Assistant tabs
- ✓ Implemented real-time WebSocket connections for live data updates and integration status

## User Preferences

Preferred communication style: Simple, everyday language.
**CRITICAL BRANDING PREFERENCE:** Dark Bristol header/nav with gold logo in top right corner must NEVER be changed - user has requested this multiple times and styling should remain consistent.
**THEME PREFERENCE:** All pages created should use light theme by default, not dark themes. Only the header/navigation should remain dark with Bristol branding.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Styling**: Tailwind CSS with custom Bristol brand design system using Cinzel serif font and branded color palette
- **UI Components**: Shadcn/ui component library with Radix UI primitives for accessibility and consistency
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live updates and chat functionality

### Backend Architecture
- **Runtime**: Node.js with Express server framework
- **Database**: PostgreSQL with Neon serverless hosting via Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect for secure user authentication
- **AI Integration**: OpenRouter API for conversational AI capabilities using Claude 3.5 Sonnet
- **File Storage**: Google Cloud Storage for file uploads and asset management
- **Real-time Features**: WebSocket server for live chat, tool execution status, and integration updates

### Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon with connection pooling
- **ORM**: Drizzle for type-safe database operations and schema management
- **Session Storage**: PostgreSQL-backed session store for authentication
- **Schema Structure**: 
  - User management (users, sessions)
  - Site intelligence (sites, site_metrics)
  - Chat system (chat_sessions, chat_messages)
  - Integration tracking (integration_logs, mcp_tools)

### Authentication and Authorization
- **Provider**: Replit Auth with OpenID Connect protocol
- **Session Management**: Express-session with PostgreSQL backing store
- **Security**: Secure HTTP-only cookies with CSRF protection
- **User Context**: Full user profile management with profile images and metadata

### External Service Integrations
- **AI Services**: OpenRouter API for conversational AI with multiple model support
- **Cloud Storage**: Google Cloud Storage for file handling and asset management
- **Economic Data APIs**: Live integration with BLS (unemployment), BEA (GDP/income), and HUD (vacancy rates)
- **Real Estate Data**: Placeholder architecture for MLS, Census, and market data APIs
- **Automation Tools**: MCP (Model Context Protocol) framework for tool execution and workflow automation
- **File Processing**: Support for KML/KMZ geospatial file uploads and processing
- **Microsoft 365**: Integration foundation for OneDrive and Outlook connectivity

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity for Neon hosting
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **@google-cloud/storage**: Cloud file storage and asset management

### UI and Styling
- **@radix-ui/***: Comprehensive accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library for consistent iconography
- **framer-motion**: Animation library for enhanced user experience

### Development and Build
- **vite**: Fast development server and build tool
- **typescript**: Type safety and enhanced developer experience
- **esbuild**: Fast JavaScript bundler for production builds

### Authentication and Security
- **openid-client**: OpenID Connect authentication
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### File Processing and Utilities
- **@uppy/***: File upload components and utilities
- **ws**: WebSocket implementation for real-time features
- **zod**: Runtime type validation and schema parsing