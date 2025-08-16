import { useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Chrome from "../components/brand/Chrome";
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
    <div className="min-h-screen bg-white relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{
          backgroundImage: `url('/src/assets/bristol-analytics-background.jpg')`,
        }}
      />
      <Chrome>
        <div className="container mx-auto px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Clean Navigation */}
            <div className="mb-6">
              <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-300 p-1 rounded-lg h-12 shadow-sm">
                <TabsTrigger 
                  value="interactive" 
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-gray-700 text-base px-4 py-2 rounded-md font-cinzel font-semibold transition-all duration-200"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Interactive Map
                </TabsTrigger>
                <TabsTrigger 
                  value="map" 
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-gray-700 text-base px-4 py-2 rounded-md font-cinzel font-semibold transition-all duration-200"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Portfolio
                </TabsTrigger>
                <TabsTrigger 
                  value="tables" 
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-gray-700 text-base px-4 py-2 rounded-md font-cinzel font-semibold transition-all duration-200"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="sandbox" 
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-gray-700 text-base px-4 py-2 rounded-md font-cinzel font-semibold transition-all duration-200"
                >
                  <Building className="h-4 w-4 mr-2" />
                  3D View
                </TabsTrigger>
              </TabsList>
            </div>

              <TabsContent value="map" className="mt-0">
                <Card className="h-[80vh] bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
                  <CardContent className="p-0 h-full">
                    <PortfolioMap onSiteSelect={handleSiteSelect} selectedSiteId={selectedSite?.id} className="h-full rounded-lg" />
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
                <Card className="h-full bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden">
                  <CardContent className="p-6 h-full">
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
  );
}