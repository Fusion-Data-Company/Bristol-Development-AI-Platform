import { useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Chrome from "../components/brand/SimpleChrome";
import { PortfolioMap } from "../components/maps/PortfolioMap";
import { SiteDemographicAnalysis } from "../components/analysis/SiteDemographicAnalysis";
import { AddressDemographics } from "../components/analysis/AddressDemographics";
import Sites from "./Sites";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, MapPin } from "lucide-react";
import { ThreeJSSandbox } from "../components/visualization/ThreeJSSandbox";
import type { Site } from '@shared/schema';
import { InteractiveMapDashboard } from "../components/dashboards/InteractiveMapDashboard";
// Enhanced Tables Tab - Production Ready
import { ElitePropertyAnalyticsDashboard } from "../components/tables/ElitePropertyAnalyticsDashboard";

export default function App() {
  const [location] = useLocation();
  
  // If we're on the Sites page, render it directly
  if (location === '/sites') {
    return <Sites />;
  }
  
  const [activeTab, setActiveTab] = useState("interactive");
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  // Fetch sites data for the Tables tab
  const { data: sites = [] } = useQuery<Site[]>({  
    queryKey: ['/api/sites'],
    retry: false,
  });

  const handleSiteSelect = (site: Site | null) => {
    setSelectedSite(site);
    // Removed automatic tab switching to prevent navigation conflicts
  };

  return (
    <div className="min-h-screen relative">
      {/* Fortune 500 Executive Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url('/src/assets/Icon+1_1755370919284.webp')`
        }}
      />
      
      {/* Executive Glass Overlay */}
      <div className="relative z-10 min-h-screen backdrop-blur-sm">
        <Chrome>
          <div className="container mx-auto px-8 py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Executive Navigation */}
              <div className="mb-8">
                <TabsList className="grid w-full grid-cols-4 bg-black/30 backdrop-blur-xl border border-white/20 p-2 rounded-3xl h-16">
                  <TabsTrigger 
                    value="interactive" 
                    className="data-[state=active]:bg-bristol-gold data-[state=active]:text-black text-white/80 text-lg px-6 py-4 rounded-2xl font-semibold transition-all duration-300"
                  >
                    <MapPin className="h-5 w-5 mr-3" />
                    Executive Intelligence
                  </TabsTrigger>
                  <TabsTrigger 
                    value="map" 
                    className="data-[state=active]:bg-bristol-gold data-[state=active]:text-black text-white/80 text-lg px-6 py-4 rounded-2xl font-semibold transition-all duration-300"
                  >
                    <Building className="h-5 w-5 mr-3" />
                    Portfolio Map
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tables" 
                    className="data-[state=active]:bg-bristol-gold data-[state=active]:text-black text-white/80 text-lg px-6 py-4 rounded-2xl font-semibold transition-all duration-300"
                  >
                    <Building className="h-5 w-5 mr-3" />
                    Analytics Dashboard
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sandbox" 
                    className="data-[state=active]:bg-bristol-gold data-[state=active]:text-black text-white/80 text-lg px-6 py-4 rounded-2xl font-semibold transition-all duration-300"
                  >
                    <Building className="h-5 w-5 mr-3" />
                    3D Visualization
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="map" className="mt-0">
                <Card className="h-[80vh] backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl rounded-3xl overflow-hidden">
                  <CardContent className="p-0 h-full">
                    <PortfolioMap onSiteSelect={handleSiteSelect} selectedSiteId={selectedSite?.id} className="h-full rounded-3xl" />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interactive" className="mt-0 h-[85vh]">
                <InteractiveMapDashboard 
                  selectedSite={selectedSite} 
                  onSiteSelect={handleSiteSelect}
                />
              </TabsContent>

              <TabsContent value="tables" className="mt-0">
                <ElitePropertyAnalyticsDashboard 
                  sites={sites} 
                  selectedSite={selectedSite}
                  onSiteSelect={handleSiteSelect}
                />
              </TabsContent>

              <TabsContent value="sandbox" className="mt-0 h-[80vh]">
                <Card className="h-full backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl rounded-3xl overflow-hidden">
                  <CardContent className="p-8 h-full">
                    <ThreeJSSandbox 
                      selectedSite={selectedSite}
                      onSiteSelect={handleSiteSelect}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </Chrome>
      </div>
    </div>
  );
}