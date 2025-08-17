#!/bin/bash

# Test script for ElevenLabs MCP Gateway
# Run this to verify all tools are working correctly

echo "🔍 Testing ElevenLabs MCP Gateway Integration"
echo "============================================="

# Base URL
BASE_URL="http://localhost:5000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "\n1️⃣ Testing Health Check..."
HEALTH=$(curl -s "$BASE_URL/api/mcp/health")
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "$HEALTH" | python3 -m json.tool
else
    echo -e "${RED}❌ Health check failed${NC}"
fi

# Test 2: Tool Discovery
echo -e "\n2️⃣ Testing Tool Discovery..."
TOOLS=$(curl -s "$BASE_URL/api/mcp/tools")
TOOL_COUNT=$(echo "$TOOLS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['tools']))")
if [ "$TOOL_COUNT" = "6" ]; then
    echo -e "${GREEN}✅ All 6 tools discovered${NC}"
else
    echo -e "${RED}❌ Expected 6 tools, found $TOOL_COUNT${NC}"
fi

# Test 3: Verify User (Rob Yeager)
echo -e "\n3️⃣ Testing User Verification (Rob Yeager)..."
VERIFY_RESULT=$(curl -s -X POST "$BASE_URL/api/mcp/elevenlabs" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/execute",
    "params": {
      "name": "verify_user",
      "arguments": { "name": "Rob Yeager" }
    },
    "id": 1
  }')
if echo "$VERIFY_RESULT" | grep -q '"verified":true'; then
    echo -e "${GREEN}✅ Rob Yeager verified as admin${NC}"
else
    echo -e "${RED}❌ User verification failed${NC}"
fi

# Test 4: Query Analytics
echo -e "\n4️⃣ Testing Portfolio Analytics Query..."
ANALYTICS_RESULT=$(curl -s -X POST "$BASE_URL/api/mcp/elevenlabs" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/execute",
    "params": {
      "name": "query_analytics",
      "arguments": {
        "query": "portfolio overview",
        "type": "portfolio"
      }
    },
    "id": 2
  }')
if echo "$ANALYTICS_RESULT" | grep -q "totalSites"; then
    echo -e "${GREEN}✅ Portfolio analytics retrieved${NC}"
else
    echo -e "${RED}❌ Analytics query failed${NC}"
fi

# Test 5: Store Artifact
echo -e "\n5️⃣ Testing Artifact Storage..."
ARTIFACT_RESULT=$(curl -s -X POST "$BASE_URL/api/mcp/elevenlabs" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/execute",
    "params": {
      "name": "store_artifact",
      "arguments": {
        "type": "test_memo",
        "content": "This is a test memo from the MCP gateway test script",
        "meta": { "test": true }
      }
    },
    "id": 3
  }')
if echo "$ARTIFACT_RESULT" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Artifact stored successfully${NC}"
else
    echo -e "${RED}❌ Artifact storage failed${NC}"
fi

# Test 6: Tool Chain (Multiple tools)
echo -e "\n6️⃣ Testing Tool Chain Execution..."
CHAIN_RESULT=$(curl -s -X POST "$BASE_URL/api/mcp/elevenlabs" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/chain",
    "params": {
      "tools": [
        { "name": "verify_user", "params": { "name": "Jason Perez" } },
        { "name": "query_analytics", "params": { "query": "test", "type": "portfolio" } }
      ]
    },
    "id": 4
  }')
if echo "$CHAIN_RESULT" | grep -q "results"; then
    echo -e "${GREEN}✅ Tool chain executed successfully${NC}"
else
    echo -e "${RED}❌ Tool chain execution failed${NC}"
fi

echo -e "\n============================================="
echo -e "${GREEN}🎉 MCP Gateway Test Complete!${NC}"
echo -e "\nTo register with ElevenLabs, run:"
echo -e "curl -X POST $BASE_URL/api/mcp/register"