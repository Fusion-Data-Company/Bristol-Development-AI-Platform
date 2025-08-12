# Bristol Site Intelligence Platform

## Overview

Bristol Site Intelligence Platform is a comprehensive enterprise-grade AI-powered real estate development analysis tool designed for multifamily development opportunities across Sunbelt markets. The platform features a sophisticated React frontend with advanced Bristol-branded design system, comprehensive site analytics including interactive MapBox mapping, proprietary 100-point Bristol scoring methodology, real-time market intelligence, and GPT-5 powered AI assistant. Built with modern web technologies including TypeScript, Tailwind CSS, and enterprise-grade animations, the platform provides institutional-quality real estate analysis capabilities.

## Recent Changes

**August 2025**
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