# ElevenLabs MCP Gateway Integration

## Overview
The Bristol Elite MCP Gateway is now fully operational, providing an intelligent bridge between ElevenLabs' Cap AI assistant and all existing MCP servers on the platform.

## Architecture

### Core Components
1. **MCP Gateway Server** (`/server/services/elevenLabsMCPGateway.ts`)
   - Claude 4.1 Opus as primary model via OpenRouter
   - Circuit breaker pattern for error resilience
   - Tool orchestration with parallel execution
   - Intelligent caching and performance optimization

2. **API Endpoints** (`/server/api/mcp-elevenlabs.ts`)
   - `/api/mcp/elevenlabs` - Main MCP endpoint
   - `/api/mcp/tools` - Tool discovery
   - `/api/mcp/health` - Health check
   - `/api/mcp/stream` - SSE for real-time updates
   - `/api/mcp/register` - ElevenLabs registration

3. **Database Schema** (New tables in PostgreSQL)
   - `bristol_users` - Bristol team roster (22 members)
   - `conversation_sessions` - State management
   - `mcp_tool_executions` - Tool execution logs
   - `analytics_cache` - Performance optimization
   - `artifacts` - Document storage
   - `tasks` - Task management

## Available Tools

### 1. verify_user
Verifies Bristol team members against the database roster.
```json
{
  "name": "verify_user",
  "parameters": { "name": "Rob Yeager" }
}
```

### 2. fetch_last_conversation
Retrieves previous conversation context for continuity.
```json
{
  "name": "fetch_last_conversation",
  "parameters": { "user_id": "user-id-here" }
}
```

### 3. log_conversation
Saves conversation state for future reference.
```json
{
  "name": "log_conversation",
  "parameters": {
    "user_id": "user-id",
    "summary": "Discussed Q2 portfolio performance",
    "tags": ["portfolio", "analytics"],
    "timestamp": "2025-08-17T20:00:00Z",
    "convo_id": "conversation-id"
  }
}
```

### 4. query_analytics
Fetches Bristol portfolio analytics with caching.
```json
{
  "name": "query_analytics",
  "parameters": {
    "query": "sunbelt markets performance",
    "type": "portfolio" // or "project", "metric_set"
  }
}
```

### 5. store_artifact
Saves documents, reports, and memos.
```json
{
  "name": "store_artifact",
  "parameters": {
    "type": "memo",
    "content": "Meeting notes content...",
    "meta": { "userId": "user-id", "conversationId": "convo-id" }
  }
}
```

### 6. web_search
Performs external market research via Perplexity Sonar.
```json
{
  "name": "web_search",
  "parameters": {
    "query": "Latest Federal Reserve interest rate projections"
  }
}
```

## Bristol Team Members
The system has been populated with 22 Bristol team members including:

### Leadership (Admin Access)
- Scott Koontz (CEO)
- Greg Grissom (President)
- Rob Yeager (Developer/Admin)
- Bill Boyd (COO)
- James Currie (CFO)
- Nick Davis (CIO)

### Full Access
- Jason Perez (Guest)
- All VPs and EVPs

### Standard Access
- Marketing and support staff

## Testing the Integration

### Health Check
```bash
curl http://localhost:5000/api/mcp/health
```

### Tool Discovery
```bash
curl http://localhost:5000/api/mcp/tools
```

### Tool Execution
```bash
curl -X POST http://localhost:5000/api/mcp/elevenlabs \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/execute",
    "params": {
      "name": "verify_user",
      "arguments": { "name": "Rob Yeager" }
    },
    "id": 1
  }'
```

## Environment Variables Required
```env
# Required for full functionality
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_MCP_SECRET=your-secure-mcp-secret
OPENROUTER_API_KEY=your-openrouter-api-key
OPENAI_API_KEY=your-openai-api-key
```

## Registration with ElevenLabs
To register this MCP server with your ElevenLabs agent:

1. Set the required environment variables
2. Call the registration endpoint:
```bash
curl -X POST http://localhost:5000/api/mcp/register
```

This will register the server and return a server ID that can be used to configure your ElevenLabs agent.

## Performance Features
- **Circuit Breaker**: Prevents cascade failures
- **Caching**: 1-hour cache for analytics queries
- **Parallel Execution**: Tools can run simultaneously
- **Timeout Management**: Different timeouts for different tool complexities
- **Error Recovery**: Automatic retry with exponential backoff

## Security
- HMAC signature validation for production
- Bristol team authentication
- Access level enforcement (admin/full/standard)
- Secure session management

## Status
✅ **FULLY OPERATIONAL**
- All 6 tools tested and working
- 22 Bristol team members loaded
- Database schema created
- API endpoints active
- Claude 4.1 Opus configured as primary model