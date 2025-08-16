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
    <Chrome>
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="interactive">GeoMapping Demographics</TabsTrigger>
            <TabsTrigger value="map">Basic Map</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="sandbox">3D Sandbox</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-6">
            <Card className="h-[75vh]">
              <CardContent className="p-0 h-full">
                <PortfolioMap onSiteSelect={handleSiteSelect} selectedSiteId={selectedSite?.id} className="h-full" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactive" className="mt-6 h-[85vh]">
            <InteractiveMapDashboard 
              selectedSite={selectedSite} 
              onSiteSelect={handleSiteSelect}
            />
          </TabsContent>

          <TabsContent value="tables" className="mt-6">
            <ElitePropertyAnalyticsDashboard 
              sites={sites} 
              selectedSite={selectedSite}
              onSiteSelect={handleSiteSelect}
            />
          </TabsContent>

          <TabsContent value="sandbox" className="mt-6 h-[80vh]">
            <ThreeJSSandbox 
              selectedSite={selectedSite}
              onSiteSelect={handleSiteSelect}
            />
          </TabsContent>
        </Tabs>
        
      </div>
    </Chrome>
  );
}