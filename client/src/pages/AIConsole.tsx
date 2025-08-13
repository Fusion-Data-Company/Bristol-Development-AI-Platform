import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EnhancedAIAgent from "@/components/EnhancedAIAgent";
import AIDataButton from "@/components/AIDataButton";
import { Brain, Zap, Database, Activity, Settings } from "lucide-react";

export default function AIConsole() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-bristol-maroon to-red-800 flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enhanced AI Console</h1>
              <p className="text-gray-600">Comprehensive AI agent with real-time data access</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Activity className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Zap className="h-3 w-3 mr-1" />
              MCP Tools
            </Badge>
            <AIDataButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Status Cards */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">AI Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-bristol-maroon">GPT-4o</div>
              <p className="text-xs text-gray-600 mt-1">Enhanced with function calling</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">6</div>
              <p className="text-xs text-gray-600 mt-1">APIs connected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Real-time Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">Active</div>
              <p className="text-xs text-gray-600 mt-1">WebSocket connected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">MCP Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">5</div>
              <p className="text-xs text-gray-600 mt-1">Tools available</p>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-bristol-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-bristol-maroon">
                <Database className="h-5 w-5" />
                Real-time Data Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-3">
                AI agent has access to all property data, market analytics, and economic indicators in real-time.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Property portfolio data</li>
                <li>• Market analytics & demographics</li>
                <li>• Economic indicators (BLS, BEA, HUD)</li>
                <li>• Integration status monitoring</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-bristol-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-bristol-maroon">
                <Zap className="h-5 w-5" />
                MCP Tool Execution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-3">
                Execute workflows and gather additional data through Model Context Protocol tools.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• n8n workflow automation</li>
                <li>• Apify web scraping</li>
                <li>• Metrics storage & retrieval</li>
                <li>• Census data fetching</li>
                <li>• HUD fair market rent data</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-bristol-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-bristol-maroon">
                <Brain className="h-5 w-5" />
                Enhanced AI Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-3">
                Advanced AI analysis with comprehensive context and function calling capabilities.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Multi-model support (GPT-4o, Claude)</li>
                <li>• Function calling for tool execution</li>
                <li>• Context-aware responses</li>
                <li>• Real-time data interpretation</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mb-6 bg-gradient-to-r from-bristol-maroon/5 to-red-800/5 border-bristol-gold/30">
          <CardHeader>
            <CardTitle className="text-bristol-maroon">Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                <strong>1. Click the Brain icon</strong> in the bottom-right to open the Enhanced AI Agent
              </p>
              <p>
                <strong>2. Enable Real-time Data</strong> and MCP Tools in the chat interface
              </p>
              <p>
                <strong>3. Ask questions about your properties, market data, or request analysis</strong>
              </p>
              <p>
                <strong>4. Use the AI Data Access button</strong> to view and push specific data to the AI
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configure AI Settings
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            View Data Sources
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Test MCP Tools
          </Button>
        </div>
      </div>

      {/* Enhanced AI Agent will be displayed as floating component */}
      <EnhancedAIAgent />
    </div>
  );
}