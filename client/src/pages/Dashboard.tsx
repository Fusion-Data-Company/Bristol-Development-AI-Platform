import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { MetricsCard, bristolMetrics } from "@/components/analytics/MetricsCard";
import { MapWidget } from "@/components/analytics/MapWidget";
import { ToolsConsole } from "@/components/tools/ToolsConsole";
import { ParallaxBackground } from "@/components/ParallaxBackground";
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
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";

interface DashboardData {
  summary: {
    totalSites: number;
    activeSites: number;
    avgBristolScore: number;
    lastUpdated: string;
  };
  recentSites: any[];
  metrics: {
    medianIncome: number;
    vacancyRate: number;
    employmentGrowth: number;
  };
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "sites" | "analytics" | "tools">("overview");
  const [activeChatSession, setActiveChatSession] = useState<string | undefined>();
  const { toast } = useToast();

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

  // Fetch integration status
  const { data: integrationStatus } = useQuery({
    queryKey: ["/api/integrations/status"],
    retry: false,
  });

  const backgroundImages = [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
  ];

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

  const demographics = dashboardData ? bristolMetrics.demographics({
    medianIncome: dashboardData.metrics.medianIncome,
    incomeGrowth: 3.2,
    populationGrowth: 4.1,
    collegeEducated: 68.5
  }) : [];

  const housing = dashboardData ? bristolMetrics.housing({
    vacancyRate: dashboardData.metrics.vacancyRate,
    rentGrowth: 5.7,
    averageRent: 1450
  }) : [];

  const economic = dashboardData ? bristolMetrics.economic({
    employmentGrowth: dashboardData.metrics.employmentGrowth,
    unemploymentRate: 3.1,
    majorEmployers: 12
  }) : [];

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
      <ParallaxBackground images={backgroundImages} />

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
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab("sites")}
                className={cn(
                  "hover:text-bristol-gold transition-colors",
                  activeTab === "sites" && "text-bristol-gold"
                )}
              >
                Sites
              </button>
              <button 
                onClick={() => setActiveTab("analytics")}
                className={cn(
                  "hover:text-bristol-gold transition-colors",
                  activeTab === "analytics" && "text-bristol-gold"
                )}
              >
                Analytics
              </button>
              <button 
                onClick={() => setActiveTab("tools")}
                className={cn(
                  "hover:text-bristol-gold transition-colors",
                  activeTab === "tools" && "text-bristol-gold"
                )}
              >
                Tools Console
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
                            ${(dashboardData?.metrics.medianIncome || 0).toLocaleString()}
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
                {/* Interactive Maps */}
                <MapWidget className="lg:col-span-1" />

                {/* Market Analytics */}
                <MetricsCard 
                  title="Market Analytics"
                  metrics={demographics}
                  className="lg:col-span-1"
                />
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <MetricsCard 
                  title="Housing Market"
                  metrics={housing}
                />
                
                <MetricsCard 
                  title="Economic Indicators"
                  metrics={economic}
                />
              </div>
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

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <MetricsCard 
                  title="Demographics"
                  metrics={demographics}
                />
                <MetricsCard 
                  title="Housing Market"
                  metrics={housing}
                />
                <MetricsCard 
                  title="Economic Indicators"
                  metrics={economic}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tools Tab */}
        {activeTab === "tools" && (
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4">
              <ToolsConsole />
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
