# Complete MCP Tools List for ElevenLabs Agent

**Total Tools Available: 22** ✅ *All tools verified working with enhanced error handling*

## COMPANY TOOLS (3 tools)

### verify_user
**Description:** Verify company team member with role-based access
**Use For:** Check if someone is a company team member and get their access level
**Parameters:** name (string, required)

### query_company_database
**Description:** Execute SQL queries against the Your Company database for comprehensive property and team analysis
**Use For:** Run custom database queries for property data, metrics, and team information
**Parameters:** query (string, required), params (array, required)

### get_company_team
**Description:** Get all Your Company team members with full details
**Use For:** List all company team members or search for specific members
**Parameters:** searchName (string, optional)

## MEMORY TOOLS (5 tools)

### save_conversation
**Description:** Save conversation across all agents with shared memory
**Use For:** Store conversations so all agents (chat, widget, ElevenLabs) can access them
**Parameters:** userId (string, required), message (string, required), response (string, required), source (string, required)

### get_conversation_history
**Description:** Get unified conversation history across all agents
**Use For:** Retrieve past conversations for context and continuity
**Parameters:** userId (string, required), limit (number, required)

### search_conversations
**Description:** Search through conversation history with keywords
**Use For:** Find specific past conversations or topics discussed previously
**Parameters:** userId (string, required), query (string, required), limit (number, required)

### fetch_last_conversation
**Description:** Retrieve last conversation summary and context for user
**Use For:** Get the most recent conversation for a specific user
**Parameters:** user_id (string, optional)

### log_conversation
**Description:** Log conversation with summary, tags, and timestamp
**Use For:** Create structured conversation logs with metadata
**Parameters:** user_id (string, optional), summary (string, required), tags (array, optional), timestamp (string, optional), convo_id (string, optional)

## ANALYSIS TOOLS (3 tools)

### market_research
**Description:** Deep market research using Perplexity Sonar
**Use For:** Get current market conditions, trends, and economic data
**Parameters:** query (string, required), depth (string, required)

### analyze_document
**Description:** Analyze documents with GPT-4 Vision
**Use For:** Extract insights from documents, PDFs, images, and reports
**Parameters:** documentUrl (string, required), analysisType (string, required)

### generate_report
**Description:** Generate professional reports
**Use For:** Create comprehensive company-formatted reports and summaries
**Parameters:** type (string, required), format (string, required), data (object, required)

## GENERAL BUSINESS TOOLS (6 tools)

### portfolio_analytics
**Description:** Get comprehensive company portfolio analytics
**Use For:** Access portfolio performance metrics and analytics
**Parameters:** type (string, required), timeframe (string, required)

### query_analytics
**Description:** Query company portfolio analytics - KPIs, financials, metrics
**Use For:** Get specific analytics data and performance indicators
**Parameters:** query (string, optional), project (string, optional), portfolio (string, optional), metric_set (string, optional)

### store_artifact
**Description:** Store drafts, memos, reports and other artifacts
**Use For:** Save important documents and work products
**Parameters:** type (string, required), content (string, required), meta (object, optional)

### economic_indicators
**Description:** Get economic indicators from BLS, BEA, Federal Reserve
**Use For:** Access real-time economic data and indicators
**Parameters:** indicators (array, required), region (string, required)

### property_search
**Description:** Search company properties with natural language
**Use For:** Find properties using conversational queries
**Parameters:** query (string, required), filters (object, required)

### property_valuation
**Description:** Get AI-powered property valuation
**Use For:** Estimate property values using AI analysis
**Parameters:** propertyId (string, required), method (string, required)

## DATA TOOLS (2 tools)

### census_data
**Description:** Get Census demographic data
**Use For:** Access demographic and population data for market analysis
**Parameters:** location (string, required), metrics (array, required)

### web_scraping
**Description:** Advanced web scraping with Firecrawl
**Use For:** Extract property data, listings, and market information from websites
**Parameters:** url (string, required), selector (string, required), format (string, required)

## AI TOOLS (1 tools)

### generate_image
**Description:** Generate images using DALL-E 3
**Use For:** Create visual content, property renderings, and marketing materials
**Parameters:** prompt (string, required), size (string, required)

## INTEGRATION TOOLS (1 tools)

### execute_tool_chain
**Description:** Execute multiple tools in sequence or parallel
**Use For:** Run complex workflows that require multiple tools working together
**Parameters:** tools (array, required), mode (string, required)

## UTILITY TOOLS (1 tools)

### schedule_task
**Description:** Schedule future tasks and reminders
**Use For:** Set up automated tasks, reminders, and scheduled operations
**Parameters:** task (string, required), scheduledFor (string, required), userId (string, required)

---

## Essential Tools for ElevenLabs Agent

**Core Conversation Management:**
1. **save_conversation** - Store all conversations for persistence
2. **get_conversation_history** - Retrieve past conversations for context
3. **search_conversations** - Find specific topics or conversations
4. **fetch_last_conversation** - Get most recent conversation

**Company Business Functions:**
5. **verify_user** - Check company team membership
6. **property_search** - Find properties with natural language
7. **property_valuation** - Get AI property valuations
8. **portfolio_analytics** - Access portfolio metrics

**Research & Analysis:**
9. **market_research** - Real-time market intelligence
10. **economic_indicators** - Economic data and trends
11. **analyze_document** - Document analysis with AI
12. **generate_report** - Create professional outputs

**Integration Notes:**
- All tools use JSON-RPC 2.0 protocol
- Accessible via `/api/mcp/stream` endpoint  
- No approval required - full access enabled
- Context persists across all agent types (chat, widget, ElevenLabs)
- Tools support both sequential and parallel execution
- **Enhanced Error Handling**: All tools now include comprehensive try/catch blocks, fallback logic, and detailed error responses
- **Smart Conversation Access**: `fetch_last_conversation` automatically searches test conversations when no user-specific conversations exist
- **Intelligent User Verification**: `verify_user` handles name variations (Rob/Robert/Bobby) and partial name matching