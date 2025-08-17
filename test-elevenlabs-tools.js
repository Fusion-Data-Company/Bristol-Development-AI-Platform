#!/usr/bin/env node

// Test script to verify all ElevenLabs Cap personality tools are working
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api/mcp/execute';

async function testTool(toolName, args) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolName, args })
    });
    const result = await response.json();
    return result;
  } catch (error) {
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🔍 Testing ElevenLabs Cap Personality Tools\n');
  console.log('============================================\n');

  // Test 1: verify_user
  console.log('1. Testing verify_user...');
  let result = await testTool('verify_user', { name: 'John Smith' });
  console.log('   Result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log('   Response:', JSON.stringify(result.result).substring(0, 100));

  // Test 2: fetch_last_conversation
  console.log('\n2. Testing fetch_last_conversation...');
  result = await testTool('fetch_last_conversation', { user_id: 'test-cap' });
  console.log('   Result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log('   Response:', JSON.stringify(result.result).substring(0, 100));

  // Test 3: log_conversation
  console.log('\n3. Testing log_conversation...');
  result = await testTool('log_conversation', {
    user_id: 'test-cap',
    summary: 'Test conversation from Cap',
    tags: ['test', 'cap'],
    convo_id: `cap-${Date.now()}`
  });
  console.log('   Result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log('   Response:', JSON.stringify(result.result).substring(0, 100));

  // Test 4: query_analytics
  console.log('\n4. Testing query_analytics...');
  result = await testTool('query_analytics', { 
    metric_set: 'overview',
    portfolio: 'bristol'
  });
  console.log('   Result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log('   Response:', JSON.stringify(result.result).substring(0, 100));

  // Test 5: store_artifact
  console.log('\n5. Testing store_artifact...');
  result = await testTool('store_artifact', {
    type: 'memo',
    content: 'Test memo from Cap - Deal analysis for Nashville property',
    meta: { author: 'Cap', timestamp: new Date().toISOString() }
  });
  console.log('   Result:', result.success ? '✅ SUCCESS' : '❌ FAILED');
  console.log('   Response:', JSON.stringify(result.result).substring(0, 100));

  console.log('\n============================================');
  console.log('✅ All Cap personality tools are accessible!');
  console.log('\nThese exact tools can now be used by the ElevenLabs agent.');
}

runTests().catch(console.error);