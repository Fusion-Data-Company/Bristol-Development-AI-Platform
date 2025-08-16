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
            <TabsTrigger value="interactive">MapBox Intelligence</TabsTrigger>
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
            <div className="space-y-6">
              {/* Demographics Analysis */}
              {selectedSite ? (
                <div className="space-y-6">
                  <SiteDemographicAnalysis siteId={selectedSite.id} />
                  <AddressDemographics 
                    className="mt-4"
                    onLocationSelect={(lat, lng) => console.log('Location selected:', lat, lng)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sites.slice(0, 6).map((site) => (
                    <Card key={site.id} className="cursor-pointer hover:shadow-lg transition-shadow border-bristol-maroon/20 bg-white/90">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-bristol-ink">{site.name}</h3>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedSite(site)}
                            className="text-bristol-maroon border-bristol-maroon hover:bg-bristol-maroon hover:text-white"
                          >
                            View Demographics
                          </Button>
                        </div>
                        <div className="space-y-2 text-sm text-bristol-stone">
                          <p>{site.city}, {site.state}</p>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            <span>{site.unitsTotal || 'TBD'} units</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{site.acreage || 'TBD'} acres</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              <div className="text-center p-8 text-gray-500">
                <p>Demographics data powered by U.S. Census Bureau • Visit the <a href="/demographics" className="text-bristol-maroon hover:underline">Demographics page</a> for advanced analysis.</p>
              </div>
            </div>
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