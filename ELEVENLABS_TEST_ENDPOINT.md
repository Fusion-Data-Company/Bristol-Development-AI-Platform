# ElevenLabs MCP Integration Test Endpoint

## Configuration URL
Use this URL in ElevenLabs Configuration:
```
https://workspace.FusionDataCo.repl.co/api/mcp/elevenlabs
```

## Test the Connection
You can test the endpoint is working with:

### GET Test (Browser or curl):
```bash
curl https://workspace.FusionDataCo.repl.co/api/mcp/elevenlabs
```

Expected response:
```json
{
  "status": "active",
  "message": "ElevenLabs MCP endpoint is ready",
  "tools": [
    "verify_user",
    "fetch_last_conversation",
    "log_conversation",
    "query_analytics",
    "store_artifact"
  ],
  "total_available": 22
}
```

### POST Test (Tool Execution):
```bash
curl -X POST https://workspace.FusionDataCo.repl.co/api/mcp/elevenlabs \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/list",
    "params": {},
    "id": "test-1"
  }'
```

## Available Tools for Cap Personality

The endpoint provides these specific tools that Cap expects:

1. **verify_user** - Verify Bristol team member identity
2. **fetch_last_conversation** - Get previous conversation context
3. **log_conversation** - Save conversation for continuity
4. **query_analytics** - Get Bristol portfolio analytics
5. **store_artifact** - Store drafts, memos, and reports

Plus 17+ additional tools for:
- Market intelligence
- Property analysis  
- Web search
- Image generation
- Report generation
- And more

## How ElevenLabs Should Connect

1. In ElevenLabs Console, go to your agent's configuration
2. Find the "Custom Tools" or "MCP Server" section
3. Enter the Server URL: `https://workspace.FusionDataCo.repl.co/api/mcp/elevenlabs`
4. The endpoint will:
   - Respond to verification challenges
   - List available tools when requested
   - Execute tools when Cap needs them
   - Maintain conversation context across sessions

## What Happens When Connected

When ElevenLabs connects successfully:
- Cap will have access to all Bristol Development Group data
- Tools execute automatically when Cap needs them
- No permission prompts - seamless integration
- Shared memory across all agents
- Real-time market intelligence updates

## Troubleshooting

If connection fails:
1. Check that the server is running
2. Verify the URL is exactly: `https://workspace.FusionDataCo.repl.co/api/mcp/elevenlabs`
3. Make sure you're using HTTPS not HTTP
4. The endpoint handles both JSON-RPC and webhook formats automatically