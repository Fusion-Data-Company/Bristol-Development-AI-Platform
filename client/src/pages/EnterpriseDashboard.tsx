import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Activity,
  Shield,
  Database,
  Zap,
  Target,
  BarChart3,
  Cpu,
  Globe,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Eye,
  Settings,
  Download,
  Maximize2,
  RefreshCw,
  Layers,
  Sparkles,
  Crown,
  Trophy
} from 'lucide-react';
import SimpleChrome from '@/components/brand/SimpleChrome';
import bristolBackground from '@assets/thumbnail_1755274091217.jpg';
import { BristolFooter } from "@/components/ui/BristolFooter";
import { EnterpriseAnalyticsDashboard } from '@/components/ui/EnterpriseAnalyticsDashboard';

export default function EnterpriseDashboard() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Real-time status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <SimpleChrome>
      <div className="min-h-screen relative overflow-hidden" style={{backgroundImage: `url(${bristolBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'}}>
        
        {/* Professional overlay for content readability */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
        
        {/* Subtle brand accent overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-bristol-maroon/[0.05] via-transparent to-bristol-gold/[0.05]" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-bristol-maroon via-amber-500 to-bristol-maroon" />
        
        <div className="relative px-6 py-8">
          <div className="container mx-auto max-w-7xl space-y-8">
            
            {/* Elite Header with Status */}
            <div className="chrome-metallic-panel p-6 border-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-bristol-maroon to-red-800 flex items-center justify-center shadow-lg">
                      <Crown className="h-7 w-7 text-amber-300" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-4xl font-bold bg-gradient-to-r from-bristol-maroon to-amber-600 bg-clip-text text-transparent">
                        Enterprise Command Center
                      </h1>
                      <Badge className="bg-gradient-to-r from-bristol-maroon to-red-800 text-white animate-float">
                        <Sparkles className="h-3 w-3 mr-1" />
                        ELITE
                      </Badge>
                    </div>
                    <p className="text-gray-600 font-medium">Bristol Development Group Intelligence Platform</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-gray-500">Last updated {formatTimeAgo(lastUpdated)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="chrome-metallic-button border-bristol-maroon/30 hover:border-bristol-maroon"
                    onClick={() => setIsMaximized(!isMaximized)}
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    {isMaximized ? 'Minimize' : 'Fullscreen'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="chrome-metallic-button border-amber-400/30 hover:border-amber-400"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-bristol-maroon to-red-800 hover:from-red-800 hover:to-bristol-maroon text-white shadow-lg"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Live Analytics
                  </Button>
                </div>
              </div>

              {/* Real-Time Status Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-800">System Online</div>
                    <div className="text-xs text-green-600">99.9% uptime</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200">
                  <Database className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-blue-800">Data Sync</div>
                    <div className="text-xs text-blue-600">Real-time</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                  <Zap className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-semibold text-amber-800">AI Engine</div>
                    <div className="text-xs text-amber-600">Active</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
                  <Globe className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-semibold text-purple-800">Market Data</div>
                    <div className="text-xs text-purple-600">Live feed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Analytics Dashboard */}
            <div className="chrome-metallic-panel">
              <EnterpriseAnalyticsDashboard />
            </div>

            {/* Elite Performance Indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Performance Metrics */}
              <Card className="chrome-metallic-panel border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-bristol-maroon">
                    <Trophy className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Processing Speed</span>
                      <span className="text-sm font-bold text-green-600">2.3s avg</span>
                    </div>
                    <Progress value={92} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Data Accuracy</span>
                      <span className="text-sm font-bold text-bristol-maroon">99.7%</span>
                    </div>
                    <Progress value={97} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">API Response</span>
                      <span className="text-sm font-bold text-blue-600">145ms avg</span>
                    </div>
                    <Progress value={88} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card className="chrome-metallic-panel border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-bristol-maroon">
                    <Shield className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        All systems operational. No issues detected.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-center p-2 rounded bg-gray-50">
                        <div className="font-bold text-bristol-maroon">47</div>
                        <div className="text-gray-600">Active Scrapes</div>
                      </div>
                      <div className="text-center p-2 rounded bg-gray-50">
                        <div className="font-bold text-amber-600">1.2K</div>
                        <div className="text-gray-600">API Calls/hr</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="chrome-metallic-panel border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-bristol-maroon">
                    <Settings className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full chrome-metallic-button justify-start">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh All Data
                  </Button>
                  <Button className="w-full chrome-metallic-button justify-start">
                    <Layers className="h-4 w-4 mr-2" />
                    Update Layers
                  </Button>
                  <Button className="w-full chrome-metallic-button justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    Run Analysis
                  </Button>
                  <Button className="w-full chrome-metallic-button justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Report
                  </Button>
                </CardContent>
              </Card>
            </div>

            <BristolFooter />
          </div>
        </div>
      </div>
    </SimpleChrome>
  );
}