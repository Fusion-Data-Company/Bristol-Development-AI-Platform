# Bristol AI Integration Test Plan

## Objective
Verify that the Bristol AI agent can perform web scraping through MCP with results appearing in both:
1. AI chat interface (Bristol AI agent response)
2. Comparables Annex page (database storage)

## Test Scenarios

### 1. Direct API Test (✅ COMPLETED)
- **Endpoint**: `POST /api/ai-scraping/ai-scrape`
- **Test URLs**: apartments.com, rent.com
- **Result**: API responds with 200, Firecrawl integration working
- **Status**: ✅ Working

### 2. Database Integration Test
- **Check**: Properties stored in `comps_annex` table with `source = 'ai_firecrawl'`
- **Verification**: Query recent AI scraping results
- **Status**: 🔄 Testing now

### 3. MCP Tool Integration (Next)
- **Component**: Bristol AI agent calls through MCP
- **Tool**: `bristol_property_scraper`
- **Expected**: AI can scrape properties and show results in chat

### 4. End-to-End User Test (Final)
- **Flow**: User asks Bristol AI to "find properties in Austin"
- **Expected**: AI scrapes data, stores in database, shows in chat and Comparables Annex
- **Verification**: Dual display functionality

## Architecture Overview

```
User Request → Bristol AI Agent → MCP Tool → AI Scraping API → Firecrawl → Database Storage
                     ↓                                                           ↓
              Chat Response with Results                              Comparables Annex Display
```

## Current Status
- ✅ Firecrawl MCP package installed
- ✅ AI scraping API endpoint created
- ✅ Direct API test working
- 🔄 Database integration verification
- ⏳ MCP tool integration pending
- ⏳ End-to-end test pending