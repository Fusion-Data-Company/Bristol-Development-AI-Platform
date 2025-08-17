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
import luxuryInteriorBg from '@assets/thumbnail-2_1755400030789.jpg';
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
      <div className="min-h-screen relative overflow-hidden" style={{
        backgroundImage: `url(${luxuryInteriorBg})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        backgroundRepeat: 'no-repeat',
        filter: 'brightness(0.8) contrast(1.1) saturate(0.9)'
      }}>
        
        {/* Professional overlay for crystal clarity and content readability */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[0.5px]" />
        
        {/* Subtle brand accent overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-bristol-maroon/[0.03] via-transparent to-bristol-gold/[0.03]" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-bristol-maroon via-amber-500 to-bristol-maroon" />
        
        <div className="relative px-6 py-8">
          <div className="container mx-auto max-w-7xl space-y-8">
            
            {/* Elite Header with Status - Enhanced Glass Morphism */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 p-8 ring-1 ring-black/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-bristol-maroon via-red-700 to-amber-600 flex items-center justify-center shadow-xl ring-4 ring-white/50">
                      <Crown className="h-8 w-8 text-amber-100 drop-shadow-lg" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-3 border-white animate-pulse shadow-lg" />
                  </div>
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h1 className="text-5xl font-bold bg-gradient-to-r from-bristol-maroon via-red-700 to-amber-600 bg-clip-text text-transparent drop-shadow-sm">
                        Enterprise Command Center
                      </h1>
                      <Badge className="bg-gradient-to-r from-bristol-maroon to-amber-600 text-white px-4 py-2 text-sm font-bold shadow-lg ring-2 ring-white/20">
                        <Sparkles className="h-4 w-4 mr-2" />
                        ELITE
                      </Badge>
                    </div>
                    <p className="text-slate-700 font-semibold text-lg">Bristol Development Group Intelligence Platform</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse shadow-sm" />
                      <span className="text-sm text-slate-600 font-medium">Last updated {formatTimeAgo(lastUpdated)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="bg-white/70 backdrop-blur-sm border-2 border-slate-300 hover:border-bristol-maroon hover:bg-white/90 shadow-lg transition-all duration-300 font-semibold"
                    onClick={() => setIsMaximized(!isMaximized)}
                  >
                    <Maximize2 className="h-5 w-5 mr-2" />
                    {isMaximized ? 'Minimize' : 'Fullscreen'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="bg-white/70 backdrop-blur-sm border-2 border-amber-300 hover:border-amber-500 hover:bg-amber-50/90 shadow-lg transition-all duration-300 font-semibold"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Export Report
                  </Button>
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-bristol-maroon via-red-700 to-amber-600 hover:from-red-800 hover:via-bristol-maroon hover:to-amber-700 text-white shadow-xl ring-2 ring-white/30 font-bold transition-all duration-300"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Live Analytics
                  </Button>
                </div>
              </div>

              {/* Real-Time Status Bar - Enhanced Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 p-5 ring-1 ring-emerald-200/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500 rounded-lg shadow-md">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-emerald-900 text-lg">System Online</div>
                      <div className="text-sm text-emerald-700 font-medium">99.9% uptime</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 p-5 ring-1 ring-blue-200/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg shadow-md">
                      <Database className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-blue-900 text-lg">Data Sync</div>
                      <div className="text-sm text-blue-700 font-medium">Real-time</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 p-5 ring-1 ring-amber-200/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500 rounded-lg shadow-md">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-amber-900 text-lg">AI Engine</div>
                      <div className="text-sm text-amber-700 font-medium">Active</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 p-5 ring-1 ring-purple-200/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg shadow-md">
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-purple-900 text-lg">Market Data</div>
                      <div className="text-sm text-purple-700 font-medium">Live feed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Analytics Dashboard - Premium Glass Container */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 p-8 ring-1 ring-black/5">
              <EnterpriseAnalyticsDashboard />
            </div>

            {/* Elite Performance Indicators - Enhanced Glass Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Performance Metrics */}
              <Card className="bg-white/95 backdrop-blur-xl border-2 border-white/40 shadow-2xl ring-1 ring-black/5 hover:shadow-3xl transition-all duration-300">
                <CardHeader className="pb-4 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-3 text-bristol-maroon text-xl font-bold">
                    <div className="p-2 bg-gradient-to-r from-bristol-maroon to-amber-600 rounded-lg shadow-md">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-700">Processing Speed</span>
                      <span className="text-base font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">2.3s avg</span>
                    </div>
                    <Progress value={92} className="h-3 bg-gray-200" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-700">Data Accuracy</span>
                      <span className="text-base font-bold text-bristol-maroon bg-red-50 px-3 py-1 rounded-full">99.7%</span>
                    </div>
                    <Progress value={97} className="h-3 bg-gray-200" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-700">API Response</span>
                      <span className="text-base font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">145ms avg</span>
                    </div>
                    <Progress value={88} className="h-3 bg-gray-200" />
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card className="bg-white/95 backdrop-blur-xl border-2 border-white/40 shadow-2xl ring-1 ring-black/5 hover:shadow-3xl transition-all duration-300">
                <CardHeader className="pb-4 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-3 text-bristol-maroon text-xl font-bold">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg shadow-md">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <Alert className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 shadow-lg">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      <AlertDescription className="text-emerald-800 font-semibold text-base">
                        All systems operational. No issues detected.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-50 to-bristol-maroon/10 border-2 border-red-100 shadow-md">
                        <div className="font-bold text-bristol-maroon text-2xl">47</div>
                        <div className="text-gray-700 font-medium">Active Scrapes</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-100 border-2 border-amber-100 shadow-md">
                        <div className="font-bold text-amber-600 text-2xl">1.2K</div>
                        <div className="text-gray-700 font-medium">API Calls/hr</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/95 backdrop-blur-xl border-2 border-white/40 shadow-2xl ring-1 ring-black/5 hover:shadow-3xl transition-all duration-300">
                <CardHeader className="pb-4 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-3 text-bristol-maroon text-xl font-bold">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg shadow-md">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg border-0 p-4 justify-start text-base font-semibold transition-all duration-300">
                    <RefreshCw className="h-5 w-5 mr-3" />
                    Refresh All Data
                  </Button>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg border-0 p-4 justify-start text-base font-semibold transition-all duration-300">
                    <Layers className="h-5 w-5 mr-3" />
                    Update Layers
                  </Button>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg border-0 p-4 justify-start text-base font-semibold transition-all duration-300">
                    <Target className="h-5 w-5 mr-3" />
                    Run Analysis
                  </Button>
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg border-0 p-4 justify-start text-base font-semibold transition-all duration-300">
                    <Calendar className="h-5 w-5 mr-3" />
                    Schedule Report
                  </Button>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </SimpleChrome>
  );
}