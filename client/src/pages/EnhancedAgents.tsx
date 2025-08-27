import { EnhancedAgentManagement } from '@/components/agents/EnhancedAgentManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, Zap, Activity } from 'lucide-react';

export default function EnhancedAgents() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-brand-maroon via-brand-ink to-brand-maroon text-white py-8">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Network className="h-12 w-12" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-gold rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold mb-2">Enhanced Agent Management</h1>
                <p className="text-brand-stone text-lg">
                  Company Development Group Multi-Agent Intelligence System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">9</div>
                <div className="text-sm text-brand-stone">Active Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">MCP</div>
                <div className="text-sm text-brand-stone">Integrated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-brand-stone">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* System Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-brand-sky bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-brand-maroon" />
                  Multi-Agent Orchestration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Advanced agent coordination with real-time task delegation, result synthesis, 
                  and intelligent workflow optimization for Company Development operations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-brand-sky bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-brand-maroon" />
                  MCP Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Full Model Context Protocol integration enabling agents to access filesystem, 
                  memory, databases, web scraping, and sequential thinking capabilities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-brand-sky bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Network className="h-5 w-5 text-brand-maroon" />
                  Prompt Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Comprehensive system prompt editing, versioning, and optimization with 
                  real-time agent behavior modification and performance tracking.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Agent Management Component */}
          <EnhancedAgentManagement />
        </div>
      </div>

      {/* Thick Footer for Company AI Button */}
      <div className="bg-gradient-to-r from-brand-maroon via-brand-ink to-brand-maroon text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="space-y-4">
            <h3 className="text-xl font-serif font-semibold">Company Development Group</h3>
            <p className="text-brand-stone max-w-2xl mx-auto leading-relaxed">
              Elite real estate intelligence powered by advanced multi-agent AI systems. 
              Delivering institutional-grade analysis for strategic investment decisions.
            </p>
            <div className="flex justify-center gap-8 text-sm">
              <div>© 2024 Company Development Group</div>
              <div>•</div>
              <div>Enterprise AI Intelligence</div>
              <div>•</div>
              <div>Multi-Agent Systems</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}