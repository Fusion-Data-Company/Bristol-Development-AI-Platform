import { useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import Chrome from "../components/brand/SimpleChrome";
import { PortfolioMap } from "../components/maps/PortfolioMap";
import { SitesTable } from "../widgets/tables/SitesTable";
import { MetricsTable } from "../widgets/tables/MetricsTable";
import { CompsTable } from "../widgets/tables/CompsTable";
import Sites from "./Sites";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { Site } from '@shared/schema';
import { InteractiveMapDashboard } from "../components/dashboards/InteractiveMapDashboard";

export default function App() {
  const [location] = useLocation();
  
  // If we're on the Sites page, render it directly
  if (location === '/sites') {
    return <Sites />;
  }
  
  const [activeTab, setActiveTab] = useState("map");
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  const handleSiteSelect = (site: Site | null) => {
    setSelectedSite(site);
    if (site) {
      setActiveTab("tables"); // Switch to tables tab when a site is selected
    }
  };

  return (
    <Chrome>
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="map">Portfolio Map</TabsTrigger>
            <TabsTrigger value="interactive">Interactive Map</TabsTrigger>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="sandbox">3D Sandbox</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <PortfolioMap onSiteSelect={handleSiteSelect} selectedSiteId={selectedSite?.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactive" className="mt-6">
            <InteractiveMapDashboard 
              selectedSite={selectedSite} 
              onSiteSelect={handleSiteSelect}
            />
          </TabsContent>

          <TabsContent value="tables" className="mt-6">
            <div className="space-y-6">
              {/* Sites Table */}
              <SitesTable 
                data={[]}
                isLoading={false}
                onSelectSite={handleSiteSelect} 
                selectedSite={selectedSite}
                onRefresh={() => {}}
              />
              
              {/* Metrics Table */}
              <MetricsTable siteId={selectedSite?.id} />
              
              {/* Comps Table */}
              <CompsTable siteId={selectedSite?.id} />
            </div>
          </TabsContent>

          <TabsContent value="sandbox" className="mt-6">
            <Card>
              <CardContent className="p-8">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏗️</div>
                  <h2 className="text-2xl font-bold text-gray-700 mb-2">
                    Cesium loads here when enabled
                  </h2>
                  <p className="text-gray-500">
                    3D visualization and modeling capabilities will be available in this section.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Chrome>
  );
}