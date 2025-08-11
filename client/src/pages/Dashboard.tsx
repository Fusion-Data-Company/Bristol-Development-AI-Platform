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
import { SiteScoring } from "@/components/analytics/SiteScoring";
import { MarketAnalytics } from "@/components/analytics/MarketAnalytics";
import { ParallaxBackground, ParallaxHero } from "@/components/ParallaxBackground";
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
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Site, SiteMetric, ChatSession } from '@shared/schema';
import bristolLogoPath from '@assets/bristol-logo_1754934306711.gif';
import propertyImage1 from '@assets/Screenshot 2025-08-11 at 10.44.53_1754934296368.png';
import propertyImage2 from '@assets/Screenshot 2025-08-11 at 10.45.12_1754934314469.png';

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

  // PARLAY KML data from the uploaded file
  const kmlData = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom">
<Document>
        <name>PARLAY Parcels</name>
        <description>Zoom in to view. https://reportallusa.com/</description>
        <styleUrl>#parlay_parcels</styleUrl>
        <gx:balloonVisibility>1</gx:balloonVisibility>
        <Style id="parlay_parcels">
                <ListStyle>
                        <ItemIcon>
                                <href>https://reportallusa.com/favicon.ico</href>
                        </ItemIcon>
                </ListStyle>
        </Style>
        <NetworkLink>
                <name>Layers</name>
                <Link>
                        <href>https://reportallusa.com/parlay/gearth_layers2.kmz?user_key=837bac90efffc90</href>
                </Link>
        </NetworkLink>
</Document>
</kml>`;
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
      return apiRequest("/api/sites", {
        method: "POST",
        body: JSON.stringify(siteData),
      });
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
    <div className="min-h-screen bg-bristol-fog relative overflow-x-hidden">
      {/* Parallax Background */}
      <ParallaxBackground />

      {/* Navigation Header */}
      <header className="relative z-10 bg-bristol-ink text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-bristol-maroon rounded-lg flex items-center justify-center">
                <span className="text-white font-serif font-bold text-xl">B</span>
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold">Bristol Development</h1>
                <p className="text-bristol-stone text-sm">Site Intelligence Platform</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "hover:text-bristol-gold transition-colors",
                  activeTab === "overview" && "text-bristol-gold"
                )}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab("mapping")}
                className={cn(
                  "hover:text-bristol-gold transition-colors",
                  activeTab === "mapping" && "text-bristol-gold"
                )}
              >
                Interactive Map
              </button>
              <button 
                onClick={() => setActiveTab("scoring")}
                className={cn(
                  "hover:text-bristol-gold transition-colors",
                  activeTab === "scoring" && "text-bristol-gold"
                )}
              >
                Site Scoring
              </button>
              <button 
                onClick={() => setActiveTab("analytics")}
                className={cn(
                  "hover:text-bristol-gold transition-colors",
                  activeTab === "analytics" && "text-bristol-gold"
                )}
              >
                Market Analytics
              </button>
              <button 
                onClick={() => setActiveTab("chat")}
                className={cn(
                  "hover:text-bristol-gold transition-colors",
                  activeTab === "chat" && "text-bristol-gold"
                )}
              >
                AI Assistant
              </button>
            </nav>
            
            <div className="flex items-center space-x-4">
              {/* WebSocket Status Indicator */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                )} />
                <span className="text-sm">{isConnected ? "Live" : "Offline"}</span>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-bristol-stone rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.firstName?.[0] || user?.email?.[0] || "U"}
                  </span>
                </div>
                <Button 
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-bristol-gold"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen">
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
                        Welcome back, {user?.firstName || "Developer"}
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

                {/* Market Overview */}
                <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-bristol-sky">
                  <CardHeader>
                    <CardTitle className="text-lg font-serif text-bristol-ink">Market Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-bristol-stone">Market Trend</span>
                        <Badge className="bg-green-100 text-green-800">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Strong Growth
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-bristol-stone">Population Growth</span>
                        <span className="font-semibold text-bristol-ink">+3.2% YoY</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-bristol-stone">Median Income</span>
                        <span className="font-semibold text-bristol-ink">$72,400</span>
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

        {/* Sites Tab */}
        {activeTab === "sites" && (
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4">
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-bristol-sky">
                <CardHeader>
                  <CardTitle className="font-serif text-xl font-semibold text-bristol-ink">
                    Site Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Building className="w-16 h-16 text-bristol-maroon mx-auto mb-4" />
                    <h3 className="text-lg font-serif font-semibold text-bristol-ink mb-2">
                      Site Management Coming Soon
                    </h3>
                    <p className="text-bristol-stone mb-4">
                      Advanced site management and comparison tools are in development.
                    </p>
                    <Button className="bg-bristol-maroon hover:bg-bristol-maroon/90 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Site
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Interactive Mapping Tab - Full Screen */}
        {activeTab === "mapping" && (
          <div className="h-screen bg-bristol-cream flex flex-col">
            {/* Top Info Panel */}
            <div className="bg-white/95 backdrop-blur-sm border-b border-bristol-stone p-4 z-20 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={bristolLogoPath} alt="Bristol Development Group" className="h-8 w-auto" />
                  <div>
                    <h1 className="text-xl font-serif font-bold text-bristol-ink">Bristol Site Intelligence</h1>
                    <p className="text-sm text-bristol-stone">PARLAY Parcels & Market Analysis</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Live Stats */}
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-bristol-maroon">{sites?.length || 5}</div>
                      <div className="text-xs text-bristol-stone">Active Sites</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-bristol-maroon">82.4</div>
                      <div className="text-xs text-bristol-stone">Avg Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-bristol-maroon">$2.4M</div>
                      <div className="text-xs text-bristol-stone">Total Value</div>
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

            {/* Full Screen Map with Side Panel */}
            <div className="flex-1 flex relative">
              {/* Map */}
              <div className="flex-1">
                <InteractiveMap
                  sites={sites || []}
                  selectedSiteId={selectedSite?.id}
                  onSiteSelect={setSelectedSite}
                  kmlData={kmlData}
                  fullScreen={true}
                  showControls={true}
                  className="h-full"
                />
              </div>

              {/* Right Info Panel */}
              <div className="w-80 bg-white/95 backdrop-blur-sm border-l border-bristol-stone p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-bristol-ink mb-2">Site Analysis</h3>
                    {selectedSite ? (
                      <Card>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-bristol-ink">{selectedSite.name}</h4>
                              <p className="text-sm text-bristol-stone">{selectedSite.address}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge 
                                style={{ backgroundColor: getScoreColor(selectedSite.bristolScore || 75) }}
                                className="text-white"
                              >
                                {selectedSite.bristolScore || 75}
                              </Badge>
                              <span className="text-sm font-medium">Bristol Score</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-bristol-stone">Zoning:</span>
                                <div className="font-medium">Mixed Use</div>
                              </div>
                              <div>
                                <span className="text-bristol-stone">Size:</span>
                                <div className="font-medium">2.4 acres</div>
                              </div>
                            </div>
                            
                            <Button 
                              size="sm" 
                              className="w-full bg-bristol-maroon hover:bg-bristol-maroon/90"
                              onClick={() => setActiveTab("scoring")}
                            >
                              View Full Analysis
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="p-4 text-center">
                          <MapPin className="w-12 h-12 text-bristol-stone mx-auto mb-2" />
                          <p className="text-bristol-stone">Click on a site marker to view details</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div>
                    <h3 className="font-serif text-lg font-semibold text-bristol-ink mb-2">Market Overview</h3>
                    <div className="space-y-2">
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-sm">Population Growth</span>
                            </div>
                            <span className="font-semibold text-green-600">+3.2%</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-bristol-maroon" />
                              <span className="text-sm">Median Income</span>
                            </div>
                            <span className="font-semibold">$72,400</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-blue-600" />
                              <span className="text-sm">Occupancy Rate</span>
                            </div>
                            <span className="font-semibold text-blue-600">94.2%</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif text-lg font-semibold text-bristol-ink mb-2">PARLAY Data</h3>
                    <Card>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">PARLAY Parcels Loaded</span>
                          </div>
                          <div className="text-xs text-bristol-stone">
                            79+ development parcels across Sunbelt markets
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-3 h-3 bg-cyan-400 border border-cyan-600 rounded-sm"></div>
                            <span className="text-bristol-stone">PARLAY Parcels (Cyan)</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full text-xs"
                            onClick={() => window.open('https://reportallusa.com/', '_blank')}
                          >
                            View Data Source
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Site Scoring Tab */}
        {activeTab === "scoring" && (
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4">
              <div className="mb-6">
                <h2 className="text-2xl font-serif font-bold text-bristol-ink mb-2">
                  Bristol Site Scoring System
                </h2>
                <p className="text-bristol-stone">
                  Comprehensive development feasibility analysis using Bristol's proprietary 100-point scoring methodology.
                </p>
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
                      Go to Map
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Market Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4">
              <div className="mb-6">
                <h2 className="text-2xl font-serif font-bold text-bristol-ink mb-2">
                  Market Analytics Dashboard
                </h2>
                <p className="text-bristol-stone">
                  Real-time market intelligence with demographic analysis, competitive landscape, and financial projections.
                </p>
              </div>
              
              {selectedSite ? (
                <MarketAnalytics
                  siteId={selectedSite.id}
                  metrics={siteMetrics.filter(m => m.siteId === selectedSite.id)}
                />
              ) : (
                <Card className="bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <PieChart className="w-16 h-16 text-bristol-maroon mx-auto mb-4" />
                    <h3 className="text-lg font-serif font-semibold text-bristol-ink mb-2">
                      Select a Site for Market Analysis
                    </h3>
                    <p className="text-bristol-stone mb-4">
                      Choose a site to view comprehensive market analytics and demographic insights.
                    </p>
                    <Button 
                      onClick={() => setActiveTab("mapping")}
                      className="bg-bristol-maroon hover:bg-bristol-maroon/90"
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Browse Sites
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
                  Powered by GPT-5 for advanced site analysis, market research, and development insights.
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
      </main>

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
  );
}
