import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Bot, 
  Search, 
  Database, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  TrendingUp,
  Clock
} from 'lucide-react';

interface AgentStatus {
  active: boolean;
  currentTask: string | null;
  progress: number;
  lastUpdate: string;
  metrics: { processed: number; found: number; errors: number };
}

interface WebScrapingAgentTrackerProps {
  status: AgentStatus;
  onStatusUpdate: (status: AgentStatus) => void;
}

export default function WebScrapingAgentTracker({ 
  status, 
  onStatusUpdate 
}: WebScrapingAgentTrackerProps) {
  const [expanded, setExpanded] = useState(false);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);

  // Simulate agent activity for demo
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of activity
        const activities = [
          'Scanning LoopNet for multifamily properties...',
          'Extracting data from Apartments.com listings...',
          'Processing Rentals.com property details...',
          'Validating scraped property information...',
          'Storing cleaned data to database...',
          'Analyzing market trends from scraped data...'
        ];
        
        const newActivity = activities[Math.floor(Math.random() * activities.length)];
        setRecentActivity(prev => [newActivity, ...prev.slice(0, 4)]);
        
        // Update status
        onStatusUpdate({
          ...status,
          active: Math.random() > 0.3,
          currentTask: newActivity,
          progress: Math.floor(Math.random() * 100),
          lastUpdate: new Date().toLocaleTimeString(),
          metrics: {
            processed: status.metrics.processed + Math.floor(Math.random() * 5),
            found: status.metrics.found + Math.floor(Math.random() * 3),
            errors: status.metrics.errors + (Math.random() > 0.9 ? 1 : 0)
          }
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, onStatusUpdate]);

  return (
    <div className="mb-8">
      <Card className="bg-gradient-to-r from-brand-maroon/5 to-brand-gold/5 border-brand-maroon/20 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-brand-maroon font-cinzel text-xl flex items-center gap-3">
              <div className="relative">
                <Bot className="h-6 w-6" />
                {status.active && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </div>
              Web Scraping Agent
              <Badge 
                variant={status.active ? "default" : "secondary"}
                className={`${status.active 
                  ? 'bg-emerald-500/20 text-emerald-700 border-emerald-300' 
                  : 'bg-gray-500/20 text-gray-600 border-gray-300'
                }`}
              >
                {status.active ? 'ACTIVE' : 'IDLE'}
              </Badge>
            </CardTitle>
            
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-brand-maroon hover:text-brand-gold transition-colors"
            >
              <Activity className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Task Display */}
          <div className="bg-white/60 rounded-lg p-4 border border-brand-gold/20">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-brand-maroon" />
              <span className="font-semibold text-brand-maroon text-sm">Current Task</span>
            </div>
            <div className="flex items-center gap-3">
              {status.active && <Loader2 className="h-4 w-4 animate-spin text-brand-maroon" />}
              <span className="text-sm text-gray-700">
                {status.currentTask || 'Waiting for next task...'}
              </span>
            </div>
            
            {status.active && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{status.progress}%</span>
                </div>
                <Progress value={status.progress} className="h-2" />
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-700">{status.metrics.processed}</div>
              <div className="text-xs text-blue-600">Processed</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-emerald-700">{status.metrics.found}</div>
              <div className="text-xs text-emerald-600">Found</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-red-700">{status.metrics.errors}</div>
              <div className="text-xs text-red-600">Errors</div>
            </div>
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="border-t border-brand-gold/20 pt-4 space-y-4">
              {/* Recent Activity */}
              <div>
                <h4 className="text-brand-maroon font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                    <div key={index} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                      {activity}
                    </div>
                  )) : (
                    <div className="text-xs text-gray-500 italic">No recent activity</div>
                  )}
                </div>
              </div>

              {/* System Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">Scrapers Online</span>
                  </div>
                  <div className="text-xs text-slate-600">Firecrawl • Apify • Custom</div>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Last Update</span>
                  </div>
                  <div className="text-xs text-slate-600">{status.lastUpdate || 'Never'}</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-brand-maroon/5 border border-brand-maroon/20 rounded-lg p-3">
                <h5 className="text-brand-maroon font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance Metrics
                </h5>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-semibold text-emerald-600 ml-1">
                      {status.metrics.processed > 0 
                        ? Math.round(((status.metrics.processed - status.metrics.errors) / status.metrics.processed) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Response:</span>
                    <span className="font-semibold text-blue-600 ml-1">2.3s</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}