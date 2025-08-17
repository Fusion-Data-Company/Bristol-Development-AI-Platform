# ElevenLabs Agent Configuration Instructions

## ✅ WORKING SOLUTION - Tools are Now Accessible!

## Agent ID
`agent_8801k2t62y9qehhsqqdmzmp10kt9`

## Simple API Endpoints for ElevenLabs Agent

### 1. List Available Tools
```
GET https://[your-domain]/api/mcp/available-tools
```
Returns all 20+ available tools with descriptions

### 2. Execute Any Tool
```
POST https://[your-domain]/api/mcp/execute
Content-Type: application/json

{
  "tool": "tool_name",
  "args": { /* tool arguments */ }
}
```

## MCP Tools Access Configuration

### Available Tools (20+ tools)
The Bristol Elite MCP Superserver provides the following tools to the ElevenLabs agent:

#### Bristol Tools
- `verify_user` - Verify Bristol team member with role-based access
- `save_conversation` - Save conversation across all agents with shared memory
- `get_conversation_history` - Get unified conversation history across all agents
- `portfolio_analytics` - Get comprehensive Bristol portfolio analytics

#### Analysis Tools  
- `market_research` - Deep market research using Perplexity Sonar
- `property_analysis` - Analyze specific property details
- `competitive_analysis` - Compare properties and markets

#### Data Tools
- `fetch_sites` - Get Bristol site data
- `search_properties` - Search property database
- `get_demographics` - Get demographic data for locations

#### AI Tools
- `generate_image` - Create images using DALL-E 3
- `analyze_document` - Process and analyze documents
- `web_search` - Search web using Perplexity Sonar

#### Memory Tools
- `store_memory` - Store information in shared memory
- `retrieve_memory` - Get information from shared memory
- `clear_memory` - Clear memory contexts

#### Integration Tools
- `scrape_website` - Extract data from websites using Firecrawl
- `database_query` - Query PostgreSQL database
- `file_operations` - Read/write files

#### Utility Tools
- `send_notification` - Send notifications
- `schedule_task` - Schedule future tasks

## API Endpoints

### Main MCP Endpoint
```
POST https://[your-domain]/api/mcp/elevenlabs
```

### List Available Tools
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/list",
  "params": {}
}
```

### Call a Tool
```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "method": "tools/call",
  "params": {
    "name": "portfolio_analytics",
    "arguments": {}
  }
}
```

### Example Tool Calls

#### Verify Bristol Team Member
```json
{
  "method": "tools/call",
  "params": {
    "name": "verify_user",
    "arguments": {
      "name": "John Smith"
    }
  }
}
```

#### Get Market Research
```json
{
  "method": "tools/call",
  "params": {
    "name": "market_research",
    "arguments": {
      "query": "Nashville multifamily development opportunities"
    }
  }
}
```

#### Save Conversation
```json
{
  "method": "tools/call",
  "params": {
    "name": "save_conversation",
    "arguments": {
      "userId": "user-123",
      "message": "What are the best markets?",
      "response": "Based on our analysis...",
      "source": "elevenlabs"
    }
  }
}
```

## Headers Required
- `Content-Type: application/json`
- `X-User-Id: [user-id]` (optional)
- `X-Session-Id: [session-id]` (optional)
- `X-Conversation-Id: [conversation-id]` (optional)

## Authentication
- In production: HMAC signature validation via `X-Elevenlabs-Signature` header
- In development: No authentication required

## Tool Response Format
```json
{
  "jsonrpc": "2.0",
  "id": "request-id",
  "result": {
    // Tool-specific response data
  }
}
```

## Error Handling
If a tool fails, the response will include an error:
```json
{
  "jsonrpc": "2.0",
  "id": "request-id",
  "error": {
    "code": -32603,
    "message": "Error description",
    "data": "Additional details"
  }
}
```

## Shared Memory
All conversations and context are automatically shared between:
- ElevenLabs voice agent (Cap)
- Chat page agent
- Pop-out agent

This ensures seamless context switching when users move between different interfaces.

## Testing Tools
Test if tools are accessible:
```bash
curl -X POST https://[your-domain]/api/mcp/elevenlabs \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"test","method":"tools/list","params":{}}'
```

## 🔧 INSTRUCTIONS FOR ELEVENLABS DASHBOARD

### Step 1: Configure Custom Actions in ElevenLabs
1. Go to your ElevenLabs Agent Dashboard
2. Navigate to "Custom Actions" or "Functions" section
3. Add a new custom action with these settings:

**Action Name:** `execute_tool`
**HTTP Method:** POST
**URL:** `https://[your-domain]/api/mcp/execute`
**Headers:**
```json
{
  "Content-Type": "application/json"
}
```
**Request Body Schema:**
```json
{
  "tool": "string",
  "args": "object"
}
```

### Step 2: Add Tool Discovery Action
**Action Name:** `list_tools`
**HTTP Method:** GET
**URL:** `https://[your-domain]/api/mcp/available-tools`

### Step 3: Update Agent System Prompt
Add this to your ElevenLabs agent's system prompt:

```
You have access to 20+ Bristol MCP tools. To use them:

1. Call list_tools to see all available tools
2. Call execute_tool with:
   - tool: the tool name (e.g., "verify_user", "portfolio_analytics", "market_research")
   - args: the arguments for that tool

Available tools include:
- verify_user: Verify Bristol team members
- portfolio_analytics: Get Bristol portfolio data
- market_research: Search market intelligence using Perplexity
- save_conversation: Save conversation to shared memory
- get_conversation_history: Get previous conversations
- generate_image: Create images with DALL-E 3
- web_search: Search the web
- And 13+ more tools

All conversations are automatically saved to shared memory for seamless context switching between voice agent, chat, and pop-out interfaces.

Example: To verify a team member, call execute_tool with:
{
  "tool": "verify_user",
  "args": {"name": "John Smith"}
}
```

### Step 4: Test the Integration
In the ElevenLabs test console, try:
1. "List all available tools"
2. "Verify if John Smith is on the Bristol team"
3. "Get portfolio analytics"
4. "Research Nashville multifamily opportunities"