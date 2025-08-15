import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { InteractiveMap } from "@/components/maps/InteractiveMap";
import { InteractiveMapDashboard } from "@/components/dashboards/InteractiveMapDashboard";
import { SiteScoring } from "@/components/analytics/SiteScoring";
import { MarketAnalytics } from "@/components/analytics/MarketAnalytics";
import { ParallaxBackground, ParallaxHero } from "@/components/ParallaxBackground";
import { DashboardBackground } from "../components/EnterpriseBackgrounds";
import { ThinkingIndicator } from "@/components/chat/ThinkingIndicator";
import { 
  MessageSquare, 
  Map, 
  BarChart3, 
  Settings, 
  Plus,
  TrendingUp,
  Building,
  Users,
  DollarSign,
  Home,
  Briefcase,
  MapPin,
  Star,
  Activity,
  Target,
  PieChart,
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  ExternalLink,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Site, SiteMetric, ChatSession } from '@shared/schema';
import bristolLogoPath from '@assets/bristol-logo_1754934306711.gif';
import propertyImage1 from '@assets/Screenshot 2025-08-11 at 10.44.53_1754934296368.png';
import Chrome from "@/components/brand/SimpleChrome";
import propertyImage2 from '@assets/Screenshot 2025-08-11 at 10.45.12_1754934314469.png';
import { BristolFooter } from "@/components/BristolFooter";

interface DashboardData {
  summary: {
    totalSites: number;
    activeSites: number;
    avgBristolScore: number;
    lastUpdated: string;
  };
  recentSites: Site[];
  metrics: SiteMetric[];
  marketTrends: {
    rentGrowth: number;
    occupancyRate: number;
    demographicScore: number;
    competitionLevel: string;
  };
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "mapping" | "scoring" | "analytics" | "chat">("mapping");
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  // KML data will be loaded from files or user uploads
  const kmlData = undefined;
  const [activeChatSession, setActiveChatSession] = useState<string | undefined>();

  // Helper function for getting score colors
  const getScoreColor = (score: number): string => {
    if (score >= 85) return '#22c55e';
    if (score >= 70) return '#84cc16';
    if (score >= 55) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocket({
    onMessage: (message) => {
      if (message.type === "integration_update") {
        toast({
          title: "Integration Update",
          description: `${message.data?.service}: ${message.data?.status}`,
        });
      }
    }
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/analytics/dashboard"],
    retry: false,
  });

  // Fetch sites
  const { data: sites = [], isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
    retry: false,
  });

  // Fetch site metrics
  const { data: siteMetrics = [], isLoading: metricsLoading } = useQuery<SiteMetric[]>({
    queryKey: ["/api/sites/metrics"],
    retry: false,
  });

  // Create site mutation
  const createSiteMutation = useMutation({
    mutationFn: async (siteData: Partial<Site>) => {
      return apiRequest("/api/sites", "POST", siteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      toast({
        title: "Site Created",
        description: "New site has been added to your portfolio",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create site",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bristol-fog flex items-center justify-center">
        <ThinkingIndicator isThinking={true} size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // This should not happen due to App.tsx routing, but just in case
  }

  return (
    <DashboardBackground>
      <Chrome>
        <div className="relative min-h-screen">
          {/* Parallax Background */}
          <ParallaxBackground />
        {/* Dashboard Tabs Navigation */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl mx-6 mb-6 p-4 shadow-lg border border-white/20">
          <div className="flex items-center justify-center space-x-4">
            <button 
              onClick={() => setActiveTab("overview")}
              className={cn(
                "px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300",
                activeTab === "overview" 
                  ? "bg-bristol-maroon text-white shadow-lg" 
                  : "text-bristol-maroon hover:bg-bristol-maroon/10"
              )}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab("mapping")}
              className={cn(
                "px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300",
                activeTab === "mapping" 
                  ? "bg-bristol-maroon text-white shadow-lg" 
                  : "text-bristol-maroon hover:bg-bristol-maroon/10"
              )}
            >
              Interactive Map
            </button>
            <button 
              onClick={() => setActiveTab("scoring")}
              className={cn(
                "px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300",
                activeTab === "scoring" 
                  ? "bg-bristol-maroon text-white shadow-lg" 
                  : "text-bristol-maroon hover:bg-bristol-maroon/10"
              )}
            >
              Site Scoring
            </button>
            <button 
              onClick={() => setActiveTab("analytics")}
              className={cn(
                "px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300",
                activeTab === "analytics" 
                  ? "bg-bristol-maroon text-white shadow-lg" 
                  : "text-bristol-maroon hover:bg-bristol-maroon/10"
              )}
            >
              Market Analytics
            </button>
            <button 
              onClick={() => setActiveTab("chat")}
              className={cn(
                "px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300",
                activeTab === "chat" 
                  ? "bg-bristol-maroon text-white shadow-lg" 
                  : "text-bristol-maroon hover:bg-bristol-maroon/10"
              )}
            >
              AI Assistant
            </button>
          </div>
        </div>
        {/* Dashboard Content */}
        <div className="relative z-10 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4">
              {/* Welcome Section */}
              <div className="mb-8">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-bristol-ink mb-2">
                        Welcome back, {(user as any)?.firstName || "Developer"}
                      </h2>
                      <p className="text-bristol-stone">
                        Your Bristol Intelligence dashboard • Last updated: {dashboardData?.summary.lastUpdated ? new Date(dashboardData.summary.lastUpdated).toLocaleString() : "Loading..."}
                      </p>
                    </div>
                    <Button
                      onClick={() => setActiveTab("chat")}
                      className="bg-bristol-maroon hover:bg-bristol-maroon/90 text-white"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Start Analysis
                    </Button>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              {dashboardLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="bg-white/90 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-4 bg-bristol-sky rounded mb-2"></div>
                          <div className="h-8 bg-bristol-sky rounded"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-bristol-sky">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-bristol-stone">Total Sites</p>
                          <p className="text-3xl font-bold text-bristol-ink">
                            {dashboardData?.summary.totalSites || 0}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-bristol-maroon/10 rounded-lg flex items-center justify-center">
                          <Building className="w-6 h-6 text-bristol-maroon" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-bristol-sky">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-bristol-stone">Active Sites</p>
                          <p className="text-3xl font-bold text-bristol-ink">
                            {dashboardData?.summary.activeSites || 0}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-bristol-sky">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-bristol-stone">Avg Bristol Score</p>
                          <p className="text-3xl font-bold text-bristol-ink">
                            {dashboardData?.summary.avgBristolScore || 0}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-bristol-gold/20 rounded-lg flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-bristol-gold" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-bristol-sky">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-bristol-stone">Median Income</p>
                          <p className="text-3xl font-bold text-bristol-ink">
                            $72,400
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Quick Actions */}
                <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-bristol-sky">
                  <CardHeader>
                    <CardTitle className="text-lg font-serif text-bristol-ink">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        onClick={() => setActiveTab("mapping")}
                        variant="outline" 
                        className="h-20 flex-col border-bristol-maroon text-bristol-maroon hover:bg-bristol-maroon hover:text-white"
                      >
                        <Map className="w-6 h-6 mb-2" />
                        <span className="text-sm">Interactive Map</span>
                      </Button>
                      <Button 
                        onClick={() => setActiveTab("scoring")}
                        variant="outline" 
                        className="h-20 flex-col border-bristol-gold text-bristol-gold hover:bg-bristol-gold hover:text-bristol-ink"
                      >
                        <Star className="w-6 h-6 mb-2" />
                        <span className="text-sm">Site Scoring</span>
                      </Button>
                      <Button 
                        onClick={() => setActiveTab("analytics")}
                        variant="outline" 
                        className="h-20 flex-col border-bristol-sky text-bristol-sky hover:bg-bristol-sky hover:text-white"
                      >
                        <BarChart3 className="w-6 h-6 mb-2" />
                        <span className="text-sm">Market Analytics</span>
                      </Button>
                      <Button 
                        onClick={() => setActiveTab("chat")}
                        variant="outline" 
                        className="h-20 flex-col border-bristol-stone text-bristol-stone hover:bg-bristol-stone hover:text-white"
                      >
                        <MessageSquare className="w-6 h-6 mb-2" />
                        <span className="text-sm">AI Assistant</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Market Overview - Enhanced Bristol Metrics */}
                <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-bristol-sky hover:shadow-xl hover:shadow-bristol-maroon/20 transition-all duration-500 hover:scale-[1.02] hover:border-bristol-maroon/40 group">
                  <CardHeader className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-bristol-maroon/5 via-transparent to-bristol-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-lg"></div>
                    <CardTitle className="text-lg font-serif text-bristol-ink flex items-center gap-2 relative z-10 group-hover:text-bristol-maroon transition-colors duration-300">
                      <BarChart3 className="w-5 h-5 text-bristol-maroon group-hover:drop-shadow-[0_0_8px_rgba(139,69,19,0.6)] transition-all duration-300" />
                      Bristol Market Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-bristol-gold/5 via-transparent to-bristol-sky/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-lg"></div>
                    <div className="space-y-4 relative z-10">
                      {/* Primary Bristol Indicators */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between hover:bg-bristol-maroon/5 p-2 rounded-lg transition-all duration-300 hover:scale-[1.01]">
                          <span className="text-bristol-stone font-medium">Bristol Development Score</span>
                          <Badge className="bg-bristol-maroon text-white font-bold hover:shadow-lg hover:shadow-bristol-maroon/40 transition-all duration-300 hover:scale-110">
                            84.2 / 100
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between hover:bg-green-50 p-2 rounded-lg transition-all duration-300 hover:scale-[1.01]">
                          <span className="text-bristol-stone">Market Trend</span>
                          <Badge className="bg-green-100 text-green-800 hover:shadow-lg hover:shadow-green-400/40 transition-all duration-300 hover:scale-110">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Strong Growth
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between hover:bg-cyan-50 p-2 rounded-lg transition-all duration-300 hover:scale-[1.01]">
                          <span className="text-bristol-stone">PARLAY Parcels</span>
                          <span className="font-semibold text-bristol-maroon hover:drop-shadow-[0_0_6px_rgba(0,255,255,0.4)] transition-all duration-300">2 Active</span>
                        </div>
                      </div>
                      
                      <Separator className="group-hover:bg-bristol-maroon/30 transition-colors duration-500" />
                      
                      {/* Demographics */}
                      <div className="space-y-2 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-green-50/50 p-3 rounded-lg transition-all duration-500">
                        <h4 className="font-semibold text-bristol-ink text-sm flex items-center gap-2">
                          <Users className="w-4 h-4 text-bristol-maroon" />
                          Demographics
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="hover:bg-green-100/50 p-2 rounded transition-all duration-300 hover:scale-105">
                            <span className="text-bristol-stone">Population Growth</span>
                            <div className="font-semibold text-green-600 hover:drop-shadow-[0_0_4px_rgba(34,197,94,0.5)]">+3.2% YoY</div>
                          </div>
                          <div className="hover:bg-bristol-maroon/10 p-2 rounded transition-all duration-300 hover:scale-105">
                            <span className="text-bristol-stone">Median Income</span>
                            <div className="font-semibold text-bristol-ink hover:text-bristol-maroon">$72,400</div>
                          </div>
                          <div className="hover:bg-blue-100/50 p-2 rounded transition-all duration-300 hover:scale-105">
                            <span className="text-bristol-stone">Employment Rate</span>
                            <div className="font-semibold text-blue-600 hover:drop-shadow-[0_0_4px_rgba(37,99,235,0.5)]">94.2%</div>
                          </div>
                          <div className="hover:bg-bristol-gold/20 p-2 rounded transition-all duration-300 hover:scale-105">
                            <span className="text-bristol-stone">Age 25-44</span>
                            <div className="font-semibold text-bristol-maroon hover:drop-shadow-[0_0_4px_rgba(139,69,19,0.5)]">28.4%</div>
                          </div>
                        </div>
                      </div>
                      
                      <Separator className="group-hover:bg-bristol-maroon/30 transition-colors duration-500" />
                      
                      {/* Market Conditions */}
                      <div className="space-y-2 hover:bg-gradient-to-r hover:from-bristol-sky/10 hover:to-bristol-gold/10 p-3 rounded-lg transition-all duration-500">
                        <h4 className="font-semibold text-bristol-ink text-sm flex items-center gap-2">
                          <Building className="w-4 h-4 text-bristol-maroon" />
                          Market Conditions
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="hover:bg-green-100/50 p-2 rounded transition-all duration-300 hover:scale-105">
                            <span className="text-bristol-stone">Avg Rent/Unit</span>
                            <div className="font-semibold text-green-600 hover:drop-shadow-[0_0_4px_rgba(34,197,94,0.5)]">$1,485</div>
                          </div>
                          <div className="hover:bg-blue-100/50 p-2 rounded transition-all duration-300 hover:scale-105">
                            <span className="text-bristol-stone">Occupancy Rate</span>
                            <div className="font-semibold text-blue-600 hover:drop-shadow-[0_0_4px_rgba(37,99,235,0.5)]">96.8%</div>
                          </div>
                          <div className="hover:bg-bristol-maroon/10 p-2 rounded transition-all duration-300 hover:scale-105">
                            <span className="text-bristol-stone">Absorption Rate</span>
                            <div className="font-semibold text-bristol-maroon hover:drop-shadow-[0_0_4px_rgba(139,69,19,0.5)]">2.3 mo</div>
                          </div>
                          <div className="hover:bg-orange-100/50 p-2 rounded transition-all duration-300 hover:scale-105">
                            <span className="text-bristol-stone">Cap Rate</span>
                            <div className="font-semibold text-orange-600 hover:drop-shadow-[0_0_4px_rgba(234,88,12,0.5)]">5.8%</div>
                          </div>
                        </div>
                      </div>
                      
                      <Separator className="group-hover:bg-bristol-maroon/30 transition-colors duration-500" />
                      
                      {/* Financial Projections */}
                      <div className="space-y-2 hover:bg-gradient-to-r hover:from-bristol-maroon/5 hover:to-bristol-gold/10 p-3 rounded-lg transition-all duration-500">
                        <h4 className="font-semibold text-bristol-ink text-sm flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-bristol-maroon" />
                          Bristol Projections
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="hover:bg-green-100/50 p-2 rounded transition-all duration-300 hover:scale-105">
                            <span className="text-bristol-stone">Projected IRR</span>
                            <div className="font-semibold text-green-600 hover:drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]">18.2%</div>
                          </div>
                          <div className="hover:bg-bristol-maroon/10 p-2 rounded transition-all duration-300 hover:scale-105">
                            <span className="text-bristol-stone">Land Cost/Unit</span>
                            <div className="font-semibold text-bristol-maroon hover:drop-shadow-[0_0_4px_rgba(139,69,19,0.5)]">$12,400</div>
                          </div>
                          <div className="hover:bg-orange-100/50 p-2 rounded transition-all duration-300 hover:scale-105">
                            <span className="text-bristol-stone">Construction</span>
                            <div className="font-semibold text-orange-600 hover:drop-shadow-[0_0_4px_rgba(234,88,12,0.5)]">$125/sq ft</div>
                          </div>
                          <div className="hover:bg-bristol-gold/20 p-2 rounded transition-all duration-300 hover:scale-105">
                            <span className="text-bristol-stone">Total Investment</span>
                            <div className="font-semibold text-bristol-ink hover:text-bristol-maroon hover:drop-shadow-[0_0_4px_rgba(139,69,19,0.5)]">$8.2M</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-bristol-stone">Occupancy Rate</span>
                        <span className="font-semibold text-bristol-ink">96.8%</span>
                      </div>
                      <Separator />
                      <div className="text-center">
                        <p className="text-sm text-bristol-stone mb-2">Bristol Intelligence Status</p>
                        <div className="flex items-center justify-center gap-2">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                          )} />
                          <span className="text-sm font-medium text-bristol-ink">
                            {isConnected ? "Real-time Data Active" : "Data Connection Lost"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-bristol-sky">
                <CardHeader>
                  <CardTitle className="text-lg font-serif text-bristol-ink">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-bristol-stone mx-auto mb-4" />
                    <h3 className="font-semibold text-bristol-ink mb-2">
                      No Recent Activity
                    </h3>
                    <p className="text-bristol-stone text-sm">
                      Start analyzing sites to see your activity here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="py-8">
            <div className="max-w-4xl mx-auto px-4">
              <ChatInterface 
                sessionId={activeChatSession}
                onSessionCreate={(session) => setActiveChatSession(session.id)}
                className="h-[600px]"
              />
            </div>
          </div>
        )}



        {/* Interactive Mapping Tab - Breaks out of container constraints */}
        </div>
        
        {activeTab === "mapping" && (
          <div className="fixed inset-0 z-40 h-screen bg-bristol-cream flex flex-col m-0 p-0">
            {/* Top Info Panel - Full Width */}
            <div className="bg-white/95 backdrop-blur-sm border-b border-bristol-stone p-4 z-20 relative w-full m-0">
              <div className="flex items-center justify-between max-w-none w-full px-4">
                <div className="flex items-center gap-4">
                  <img src={bristolLogoPath} alt="Bristol Development Group" className="h-8 w-auto" />
                  <div>
                    <h1 className="text-xl font-serif font-bold text-bristol-ink">Bristol Site Intelligence</h1>
                    <p className="text-sm text-bristol-stone">Geographic Data & Market Analysis</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Live Stats */}
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-bristol-maroon">{sites?.length || 46}</div>
                      <div className="text-xs text-bristol-stone">Active Sites</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-bristol-maroon">9,953</div>
                      <div className="text-xs text-bristol-stone">Total Units</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-bristol-maroon">84.2</div>
                      <div className="text-xs text-bristol-stone">Avg Score</div>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="text-bristol-maroon border-bristol-maroon">
                    <Activity className="w-3 h-3 mr-1" />
                    Live Data
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("overview")}
                  >
                    <Home className="w-4 h-4 mr-1" />
                    Dashboard
                  </Button>
                </div>
              </div>
            </div>

            {/* Interactive Map Dashboard - Override All Margins */}
            <div className="flex-1 flex relative w-full h-full m-0 p-0 max-w-none overflow-hidden">
              <InteractiveMapDashboard />
            </div>
          </div>
        )}
        
        <div className="relative z-10 py-8">

        {/* Scoring Tab */}
        {activeTab === "scoring" && (
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-bold text-bristol-ink mb-2">Bristol Site Scoring</h2>
              <p className="text-bristol-stone">Advanced 100-point analysis methodology for development opportunities</p>
            </div>
            
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("mapping")}
                className="flex items-center gap-2"
              >
                <Map className="w-4 h-4" />
                Back to Map View
              </Button>
            </div>
            
            {selectedSite ? (
              <SiteScoring
                site={selectedSite}
                metrics={siteMetrics.filter(m => m.siteId === selectedSite.id)}
                onRecalculateScore={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/sites/metrics"] });
                  toast({
                    title: "Score Recalculated",
                    description: "Bristol score has been updated with latest data",
                  });
                }}
              />
            ) : (
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Target className="w-16 h-16 text-bristol-maroon mx-auto mb-4" />
                  <h3 className="text-lg font-serif font-semibold text-bristol-ink mb-2">
                    Select a Site to View Scoring
                  </h3>
                  <p className="text-bristol-stone mb-4">
                    Choose a site from the map or site list to view detailed Bristol scoring analysis.
                  </p>
                  <Button 
                    onClick={() => setActiveTab("mapping")}
                    className="bg-bristol-maroon hover:bg-bristol-maroon/90"
                  >
                    <Map className="w-4 h-4 mr-2" />
                    Go to Map View
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4">
              <div className="mb-6">
                <h2 className="text-2xl font-serif font-bold text-bristol-ink mb-2">
                  Market Analytics & Insights
                </h2>
                <p className="text-bristol-stone">
                  Comprehensive market analysis and trend insights for your development portfolio.
                </p>
              </div>
              
              {selectedSite ? (
                <MarketAnalytics
                  site={selectedSite}
                  metrics={siteMetrics}
                />
              ) : (
                <Card className="bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <BarChart3 className="w-16 h-16 text-bristol-maroon mx-auto mb-4" />
                    <h3 className="text-lg font-serif font-semibold text-bristol-ink mb-2">
                      Select a Site for Analytics
                    </h3>
                    <p className="text-bristol-stone mb-4">
                      Choose a site to view detailed market analytics and performance insights.
                    </p>
                    <Button 
                      onClick={() => setActiveTab("mapping")}
                      className="bg-bristol-maroon hover:bg-bristol-maroon/90"
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Go to Map View
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="py-8">
            <div className="max-w-4xl mx-auto px-4">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-serif font-bold text-bristol-ink mb-2">
                  Bristol Site Intelligence Assistant
                </h2>
                <p className="text-bristol-stone">
                  Powered by GPT-5 via OpenRouter for advanced site analysis, market research, and development insights.
                </p>
              </div>
              
              <ChatInterface 
                sessionId={activeChatSession}
                onSessionCreate={(session) => setActiveChatSession(session.id)}
                className="h-[600px]"
              />
            </div>
          </div>
        )}
        
        {/* Floating Chat Button */}
        {activeTab !== "chat" && (
          <div className="fixed bottom-6 right-6 z-50">
            <button 
              onClick={() => setActiveTab("chat")}
              className="w-16 h-16 bg-bristol-maroon text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-bristol-maroon/90 transition-all group relative"
            >
              <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
              {isConnected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-bristol-gold rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-bristol-ink">AI</span>
                </div>
              )}
            </button>
          </div>
        )}
        </div>
        
        <BristolFooter variant="enterprise" />
      </div>
    </Chrome>
    </DashboardBackground>
  );
}
