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
        filter: 'brightness(1.0) contrast(1.2) saturate(1.0)'
      }}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-maroon via-amber-500 to-brand-maroon" />
        
        <div className="relative px-6 py-8">
          <div className="container mx-auto max-w-7xl space-y-8">
            
            {/* Elite Header with Status - Refined Stucco Texture */}
            <div className="backdrop-blur-xl rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.3)] border-2 border-gray-200/80 p-10 ring-2 ring-gray-100/70 hover:shadow-[0_40px_80px_rgba(0,0,0,0.4)] transition-all duration-500" style={{
              background: `
                radial-gradient(circle at 25% 35%, rgba(255,255,255,0.85) 0.8px, transparent 1.2px),
                radial-gradient(circle at 75% 65%, rgba(252,252,253,0.75) 0.6px, transparent 1px),
                radial-gradient(circle at 45% 75%, rgba(248,250,252,0.65) 1px, transparent 1.4px),
                radial-gradient(circle at 65% 25%, rgba(241,245,249,0.55) 0.5px, transparent 0.8px),
                radial-gradient(circle at 15% 85%, rgba(226,232,240,0.45) 0.7px, transparent 1px),
                radial-gradient(circle at 85% 45%, rgba(203,213,225,0.35) 0.4px, transparent 0.7px),
                linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.9) 50%, rgba(243,244,246,0.85) 100%),
                linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.12) 50%, transparent 51%),
                linear-gradient(-45deg, transparent 49%, rgba(0,0,0,0.025) 50%, transparent 51%)
              `,
              backgroundSize: '16px 20px, 12px 16px, 18px 14px, 10px 13px, 14px 18px, 8px 11px, 100% 100%, 3px 3px, 3px 3px'
            }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-brand-maroon via-red-700 to-amber-600 flex items-center justify-center shadow-2xl ring-6 ring-white/70 hover:scale-105 transition-transform duration-300">
                      <Crown className="h-10 w-10 text-amber-100 drop-shadow-2xl" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-6 w-6 bg-emerald-500 rounded-full border-4 border-white animate-pulse shadow-xl ring-2 ring-emerald-200" />
                  </div>
                  <div>
                    <div className="flex items-center gap-6 mb-3">
                      <h1 className="text-6xl font-bold bg-gradient-to-r from-brand-maroon via-red-700 to-amber-600 bg-clip-text text-transparent drop-shadow-lg">
                        Project Dashboard
                      </h1>
                      <Badge className="bg-gradient-to-r from-brand-maroon via-red-700 to-amber-600 text-white px-6 py-3 text-lg font-bold shadow-2xl ring-4 ring-white/30 hover:scale-105 transition-transform duration-300">
                        <Sparkles className="h-5 w-5 mr-3" />
                        ELITE
                      </Badge>
                    </div>
                    <p className="text-slate-800 font-bold text-xl">Your Company Intelligence Platform</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="h-4 w-4 bg-emerald-500 rounded-full animate-pulse shadow-lg ring-2 ring-emerald-200" />
                      <span className="text-base text-slate-700 font-semibold">Last updated {formatTimeAgo(lastUpdated)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="bg-white/70 backdrop-blur-sm border-2 border-slate-300 hover:border-brand-maroon hover:bg-white/90 shadow-lg transition-all duration-300 font-semibold"
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
                    className="bg-gradient-to-r from-brand-maroon via-red-700 to-amber-600 hover:from-red-800 hover:via-brand-maroon hover:to-amber-700 text-white shadow-xl ring-2 ring-white/30 font-bold transition-all duration-300"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Live Analytics
                  </Button>
                </div>
              </div>

              {/* Real-Time Status Bar - Ultra Premium Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="rounded-2xl border-3 border-emerald-300 shadow-[0_20px_40px_rgba(16,185,129,0.2)] hover:shadow-[0_30px_60px_rgba(16,185,129,0.3)] transition-all duration-500 p-6 ring-2 ring-emerald-200/70 hover:scale-105" style={{
                  background: `
                    radial-gradient(circle at 20% 30%, rgba(255,255,255,0.7) 0.6px, transparent 0.9px),
                    radial-gradient(circle at 80% 70%, rgba(240,253,244,0.65) 0.5px, transparent 0.8px),
                    radial-gradient(circle at 50% 60%, rgba(209,250,229,0.6) 0.8px, transparent 1.1px),
                    radial-gradient(circle at 70% 20%, rgba(187,247,208,0.55) 0.4px, transparent 0.7px),
                    radial-gradient(circle at 30% 80%, rgba(167,243,208,0.5) 0.7px, transparent 1px),
                    linear-gradient(135deg, rgba(240,253,244,0.85) 0%, rgba(209,250,229,0.75) 50%, rgba(187,247,208,0.65) 100%),
                    linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.08) 50%, transparent 51%),
                    linear-gradient(-45deg, transparent 49%, rgba(0,0,0,0.02) 50%, transparent 51%)
                  `,
                  backgroundSize: '10px 13px, 8px 11px, 12px 9px, 6px 8px, 9px 12px, 100% 100%, 2px 2px, 2px 2px'
                }}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-xl ring-2 ring-white/50">
                      <CheckCircle className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-emerald-900 text-xl">System Online</div>
                      <div className="text-base text-emerald-700 font-semibold">99.9% uptime</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border-3 border-blue-300 shadow-[0_20px_40px_rgba(59,130,246,0.2)] hover:shadow-[0_30px_60px_rgba(59,130,246,0.3)] transition-all duration-500 p-6 ring-2 ring-blue-200/70 hover:scale-105" style={{
                  background: `
                    radial-gradient(circle at 25% 35%, rgba(255,255,255,0.7) 0.6px, transparent 0.9px),
                    radial-gradient(circle at 75% 65%, rgba(240,249,255,0.65) 0.5px, transparent 0.8px),
                    radial-gradient(circle at 55% 70%, rgba(219,234,254,0.6) 0.8px, transparent 1.1px),
                    radial-gradient(circle at 65% 25%, rgba(191,219,254,0.55) 0.4px, transparent 0.7px),
                    radial-gradient(circle at 35% 75%, rgba(147,197,253,0.5) 0.7px, transparent 1px),
                    linear-gradient(135deg, rgba(240,249,255,0.85) 0%, rgba(219,234,254,0.75) 50%, rgba(191,219,254,0.65) 100%),
                    linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.08) 50%, transparent 51%),
                    linear-gradient(-45deg, transparent 49%, rgba(0,0,0,0.02) 50%, transparent 51%)
                  `,
                  backgroundSize: '11px 14px, 9px 12px, 13px 10px, 7px 9px, 10px 13px, 100% 100%, 2px 2px, 2px 2px'
                }}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-xl ring-2 ring-white/50">
                      <Database className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-blue-900 text-xl">Data Sync</div>
                      <div className="text-base text-blue-700 font-semibold">Real-time</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border-3 border-amber-300 shadow-[0_20px_40px_rgba(245,158,11,0.2)] hover:shadow-[0_30px_60px_rgba(245,158,11,0.3)] transition-all duration-500 p-6 ring-2 ring-amber-200/70 hover:scale-105" style={{
                  background: `
                    radial-gradient(circle at 30% 40%, rgba(255,255,255,0.7) 0.6px, transparent 0.9px),
                    radial-gradient(circle at 70% 60%, rgba(255,251,235,0.65) 0.5px, transparent 0.8px),
                    radial-gradient(circle at 60% 75%, rgba(254,243,199,0.6) 0.8px, transparent 1.1px),
                    radial-gradient(circle at 60% 30%, rgba(253,230,138,0.55) 0.4px, transparent 0.7px),
                    radial-gradient(circle at 40% 70%, rgba(252,211,77,0.5) 0.7px, transparent 1px),
                    linear-gradient(135deg, rgba(255,251,235,0.85) 0%, rgba(254,243,199,0.75) 50%, rgba(253,230,138,0.65) 100%),
                    linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.08) 50%, transparent 51%),
                    linear-gradient(-45deg, transparent 49%, rgba(0,0,0,0.02) 50%, transparent 51%)
                  `,
                  backgroundSize: '12px 15px, 10px 13px, 14px 11px, 8px 10px, 11px 14px, 100% 100%, 2px 2px, 2px 2px'
                }}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-xl ring-2 ring-white/50">
                      <Zap className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-amber-900 text-xl">AI Engine</div>
                      <div className="text-base text-amber-700 font-semibold">Active</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border-3 border-purple-300 shadow-[0_20px_40px_rgba(168,85,247,0.2)] hover:shadow-[0_30px_60px_rgba(168,85,247,0.3)] transition-all duration-500 p-6 ring-2 ring-purple-200/70 hover:scale-105" style={{
                  background: `
                    radial-gradient(circle at 35% 45%, rgba(255,255,255,0.7) 0.6px, transparent 0.9px),
                    radial-gradient(circle at 65% 55%, rgba(250,245,255,0.65) 0.5px, transparent 0.8px),
                    radial-gradient(circle at 45% 80%, rgba(243,232,255,0.6) 0.8px, transparent 1.1px),
                    radial-gradient(circle at 75% 35%, rgba(221,214,254,0.55) 0.4px, transparent 0.7px),
                    radial-gradient(circle at 25% 65%, rgba(196,181,253,0.5) 0.7px, transparent 1px),
                    linear-gradient(135deg, rgba(250,245,255,0.85) 0%, rgba(243,232,255,0.75) 50%, rgba(221,214,254,0.65) 100%),
                    linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.08) 50%, transparent 51%),
                    linear-gradient(-45deg, transparent 49%, rgba(0,0,0,0.02) 50%, transparent 51%)
                  `,
                  backgroundSize: '13px 16px, 11px 14px, 15px 12px, 9px 11px, 12px 15px, 100% 100%, 2px 2px, 2px 2px'
                }}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-xl ring-2 ring-white/50">
                      <Globe className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-purple-900 text-xl">Market Data</div>
                      <div className="text-base text-purple-700 font-semibold">Live feed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Analytics Dashboard - Elegant Stucco Container */}
            <div className="backdrop-blur-xl rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.3)] border-2 border-gray-200/80 p-10 ring-2 ring-gray-100/70 hover:shadow-[0_40px_80px_rgba(0,0,0,0.4)] transition-all duration-500" style={{
              background: `
                radial-gradient(circle at 30% 40%, rgba(255,255,255,0.8) 0.9px, transparent 1.3px),
                radial-gradient(circle at 70% 60%, rgba(252,252,253,0.7) 0.7px, transparent 1.1px),
                radial-gradient(circle at 50% 20%, rgba(248,250,252,0.6) 1.1px, transparent 1.5px),
                radial-gradient(circle at 80% 30%, rgba(241,245,249,0.5) 0.6px, transparent 0.9px),
                radial-gradient(circle at 20% 80%, rgba(226,232,240,0.4) 0.8px, transparent 1.1px),
                radial-gradient(circle at 60% 50%, rgba(203,213,225,0.3) 0.5px, transparent 0.8px),
                linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(249,250,251,0.88) 50%, rgba(243,244,246,0.82) 100%),
                linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.15) 50%, transparent 51%),
                linear-gradient(-45deg, transparent 49%, rgba(0,0,0,0.03) 50%, transparent 51%)
              `,
              backgroundSize: '18px 22px, 14px 18px, 20px 16px, 12px 15px, 16px 20px, 10px 13px, 100% 100%, 4px 4px, 4px 4px'
            }}>
              <EnterpriseAnalyticsDashboard />
            </div>

            {/* Elite Performance Indicators - Enhanced Glass Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Performance Metrics */}
              <Card className="backdrop-blur-xl border-2 border-gray-200/80 shadow-[0_24px_48px_rgba(0,0,0,0.3)] ring-2 ring-gray-100/70 hover:shadow-[0_32px_64px_rgba(0,0,0,0.4)] hover:scale-105 transition-all duration-500" style={{
                background: `
                  radial-gradient(circle at 35% 25%, rgba(255,255,255,0.75) 0.7px, transparent 1px),
                  radial-gradient(circle at 65% 75%, rgba(252,252,253,0.65) 0.5px, transparent 0.8px),
                  radial-gradient(circle at 25% 65%, rgba(248,250,252,0.55) 0.9px, transparent 1.2px),
                  radial-gradient(circle at 75% 35%, rgba(241,245,249,0.45) 0.4px, transparent 0.7px),
                  radial-gradient(circle at 45% 85%, rgba(226,232,240,0.35) 0.6px, transparent 0.9px),
                  linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(249,250,251,0.86) 50%, rgba(243,244,246,0.8) 100%),
                  linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.1) 50%, transparent 51%),
                  linear-gradient(-45deg, transparent 49%, rgba(0,0,0,0.02) 50%, transparent 51%)
                `,
                backgroundSize: '14px 18px, 11px 15px, 17px 13px, 9px 12px, 13px 17px, 100% 100%, 2.5px 2.5px, 2.5px 2.5px'
              }}>
                <CardHeader className="pb-4 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-3 text-brand-maroon text-xl font-bold">
                    <div className="p-2 bg-gradient-to-r from-brand-maroon to-amber-600 rounded-lg shadow-md">
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
                      <span className="text-base font-bold text-brand-maroon bg-red-50 px-3 py-1 rounded-full">99.7%</span>
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
              <Card className="backdrop-blur-xl border-2 border-gray-200/80 shadow-[0_24px_48px_rgba(0,0,0,0.3)] ring-2 ring-gray-100/70 hover:shadow-[0_32px_64px_rgba(0,0,0,0.4)] hover:scale-105 transition-all duration-500" style={{
                background: `
                  radial-gradient(circle at 40% 30%, rgba(255,255,255,0.75) 0.7px, transparent 1px),
                  radial-gradient(circle at 60% 70%, rgba(252,252,253,0.65) 0.5px, transparent 0.8px),
                  radial-gradient(circle at 20% 60%, rgba(248,250,252,0.55) 0.9px, transparent 1.2px),
                  radial-gradient(circle at 80% 40%, rgba(241,245,249,0.45) 0.4px, transparent 0.7px),
                  radial-gradient(circle at 50% 90%, rgba(226,232,240,0.35) 0.6px, transparent 0.9px),
                  linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(249,250,251,0.86) 50%, rgba(243,244,246,0.8) 100%),
                  linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.1) 50%, transparent 51%),
                  linear-gradient(-45deg, transparent 49%, rgba(0,0,0,0.02) 50%, transparent 51%)
                `,
                backgroundSize: '15px 19px, 12px 16px, 18px 14px, 10px 13px, 14px 18px, 100% 100%, 3px 3px, 3px 3px'
              }}>
                <CardHeader className="pb-4 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-3 text-brand-maroon text-xl font-bold">
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
                      <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-50 to-brand-maroon/10 border-2 border-red-100 shadow-md">
                        <div className="font-bold text-brand-maroon text-2xl">47</div>
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
              <Card className="backdrop-blur-xl border-2 border-gray-200/80 shadow-[0_24px_48px_rgba(0,0,0,0.3)] ring-2 ring-gray-100/70 hover:shadow-[0_32px_64px_rgba(0,0,0,0.4)] hover:scale-105 transition-all duration-500" style={{
                background: `
                  radial-gradient(circle at 45% 35%, rgba(255,255,255,0.75) 0.7px, transparent 1px),
                  radial-gradient(circle at 55% 65%, rgba(252,252,253,0.65) 0.5px, transparent 0.8px),
                  radial-gradient(circle at 25% 75%, rgba(248,250,252,0.55) 0.9px, transparent 1.2px),
                  radial-gradient(circle at 75% 25%, rgba(241,245,249,0.45) 0.4px, transparent 0.7px),
                  radial-gradient(circle at 35% 55%, rgba(226,232,240,0.35) 0.6px, transparent 0.9px),
                  linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(249,250,251,0.86) 50%, rgba(243,244,246,0.8) 100%),
                  linear-gradient(45deg, transparent 49%, rgba(255,255,255,0.1) 50%, transparent 51%),
                  linear-gradient(-45deg, transparent 49%, rgba(0,0,0,0.02) 50%, transparent 51%)
                `,
                backgroundSize: '16px 20px, 13px 17px, 19px 15px, 11px 14px, 15px 19px, 100% 100%, 3.5px 3.5px, 3.5px 3.5px'
              }}>
                <CardHeader className="pb-4 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-3 text-brand-maroon text-xl font-bold">
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