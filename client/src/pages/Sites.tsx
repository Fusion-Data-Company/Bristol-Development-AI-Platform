import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer } from '@/components/maps/MapContainer';
import { SitesTable } from '@/components/tables/SitesTable';
import { MetricsTable } from '@/components/tables/MetricsTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Map, Table, ChartBar } from 'lucide-react';
import { type Site, type SiteMetric } from '@shared/schema';

export default function Sites() {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'table'>('table');

  // Fetch user sites
  const { data: sites = [], isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ['/api/sites']
  });

  // Fetch metrics for selected site
  const { data: metrics = [], isLoading: metricsLoading } = useQuery<SiteMetric[]>({
    queryKey: [`/api/sites/${selectedSite?.id}/metrics`],
    enabled: !!selectedSite
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sites</h1>
          <p className="text-muted-foreground mt-1">
            Manage and analyze your development sites
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => setViewMode('map')}
          >
            <Map className="h-4 w-4 mr-2" />
            Map View
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setViewMode('table')}
          >
            <Table className="h-4 w-4 mr-2" />
            Table View
          </Button>
          <Button className="bg-bristol-maroon hover:bg-bristol-maroon/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sites List/Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Sites</CardTitle>
              <CardDescription>
                {sites.length} active development sites
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === 'map' ? (
                <div className="h-[500px] rounded-lg overflow-hidden">
                  <MapContainer 
                    sites={sites}
                    onSiteSelect={setSelectedSite}
                    selectedSite={selectedSite}
                  />
                </div>
              ) : (
                <SitesTable
                  sites={sites}
                  loading={sitesLoading}
                  onSiteSelect={setSelectedSite}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Site Details */}
        <div>
          {selectedSite ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedSite.name}</CardTitle>
                <CardDescription>
                  {selectedSite.city}, {selectedSite.state}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bristol Score</span>
                        <span className="font-semibold">{selectedSite.bristolScore || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className="font-semibold capitalize">{selectedSite.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Acreage</span>
                        <span className="font-semibold">{selectedSite.acreage || 'N/A'} acres</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Zoning</span>
                        <span className="font-semibold">{selectedSite.zoning || 'N/A'}</span>
                      </div>
                    </div>
                    
                    {selectedSite.description && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          {selectedSite.description}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="metrics">
                    <MetricsTable
                      metrics={metrics}
                      loading={metricsLoading}
                      compact
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <ChartBar className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Select a site to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}