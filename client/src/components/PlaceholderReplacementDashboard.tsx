import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Clock, Database, TrendingUp, MapPin, DollarSign } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PlaceholderStats {
  totalPlaceholders: number;
  categories: {
    category1: {
      name: string;
      placeholders: number;
      description: string;
    };
    category2: {
      name: string;
      placeholders: number;
      description: string;
    };
    category3: {
      name: string;
      placeholders: number;
      description: string;
    };
  };
  dataSourcesAvailable: Record<string, string>;
}

interface SiteStatus {
  siteId: string;
  totalPlaceholders: number;
  replacedCount: number;
  pendingCount: number;
  replacementPercentage: number;
  replacedPlaceholders: string[];
  lastUpdated: number | null;
}

export function PlaceholderReplacementDashboard() {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch overall placeholder statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/placeholders/stats'],
    queryFn: () => apiRequest('/api/placeholders/stats')
  });

  // Fetch sites for selection
  const { data: sites } = useQuery({
    queryKey: ['/api/sites'],
    queryFn: () => apiRequest('/api/sites')
  });

  // Fetch site status when selected
  const { data: siteStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/placeholders/status', selectedSiteId],
    queryFn: () => selectedSiteId ? apiRequest(`/api/placeholders/status/${selectedSiteId}`) : null,
    enabled: !!selectedSiteId
  });

  // Replace all placeholders mutation
  const replaceAllMutation = useMutation({
    mutationFn: (siteId: string) => apiRequest(`/api/placeholders/replace/all/${siteId}`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/placeholders/status'] });
      refetchStatus();
    }
  });

  // Replace category mutations
  const replaceCategory1Mutation = useMutation({
    mutationFn: (siteId: string) => apiRequest(`/api/placeholders/replace/category1/${siteId}`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/placeholders/status'] });
      refetchStatus();
    }
  });

  const replaceCategory2Mutation = useMutation({
    mutationFn: (siteId: string) => apiRequest(`/api/placeholders/replace/category2/${siteId}`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/placeholders/status'] });
      refetchStatus();
    }
  });

  const replaceCategory3Mutation = useMutation({
    mutationFn: (siteId: string) => apiRequest(`/api/placeholders/replace/category3/${siteId}`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/placeholders/status'] });
      refetchStatus();
    }
  });

  const getCategoryIcon = (category: number) => {
    switch (category) {
      case 1: return <TrendingUp className="h-5 w-5" />;
      case 2: return <DollarSign className="h-5 w-5" />;
      case 3: return <MapPin className="h-5 w-5" />;
      default: return <Database className="h-5 w-5" />;
    }
  };

  const getDataSourceStatus = (status: string) => {
    return status === 'configured' ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Configured
      </Badge>
    ) : (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Missing
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Placeholder Replacement System</h1>
        <p className="text-muted-foreground mt-2">
          Replace all 47 placeholder data sections with live API integrations
        </p>
      </div>

      {/* Overall Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Placeholders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlaceholders}</div>
              <p className="text-sm text-muted-foreground">Across 3 categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center space-y-0 space-x-2">
              {getCategoryIcon(1)}
              <CardTitle className="text-lg">Category 1</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categories.category1.placeholders}</div>
              <p className="text-sm text-muted-foreground">Property & Market Data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center space-y-0 space-x-2">
              {getCategoryIcon(2)}
              <CardTitle className="text-lg">Category 2</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categories.category2.placeholders}</div>
              <p className="text-sm text-muted-foreground">Financial & Economic Data</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center space-y-0 space-x-2">
              {getCategoryIcon(3)}
              <CardTitle className="text-lg">Category 3</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categories.category3.placeholders}</div>
              <p className="text-sm text-muted-foreground">Site & Location Data</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Source Status */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Data Source Configuration</CardTitle>
            <CardDescription>
              Status of external APIs required for placeholder replacement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.dataSourcesAvailable).map(([source, status]) => (
                <div key={source} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm font-medium capitalize">{source}</span>
                  {getDataSourceStatus(status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Site Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Site Selection</CardTitle>
          <CardDescription>
            Choose a site to replace placeholders with real data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Select a site...</option>
              {sites?.map((site: any) => (
                <option key={site.id} value={site.id}>
                  {site.name} - {site.city}, {site.state}
                </option>
              ))}
            </select>

            {selectedSiteId && (
              <Button
                onClick={() => replaceAllMutation.mutate(selectedSiteId)}
                disabled={replaceAllMutation.isPending}
                className="w-full"
              >
                {replaceAllMutation.isPending ? 'Replacing...' : 'Replace All Placeholders'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Site Status */}
      {siteStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Site Replacement Status</CardTitle>
            <CardDescription>
              Current placeholder replacement progress for selected site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {siteStatus.replacedCount}/{siteStatus.totalPlaceholders} replaced
              </span>
            </div>
            <Progress value={siteStatus.replacementPercentage} className="w-full" />
            <div className="text-center text-2xl font-bold">
              {siteStatus.replacementPercentage}%
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    {getCategoryIcon(1)}
                    <span className="ml-2">Category 1</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => replaceCategory1Mutation.mutate(selectedSiteId)}
                    disabled={replaceCategory1Mutation.isPending}
                  >
                    {replaceCategory1Mutation.isPending ? 'Replacing...' : 'Replace Property Data'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    {getCategoryIcon(2)}
                    <span className="ml-2">Category 2</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => replaceCategory2Mutation.mutate(selectedSiteId)}
                    disabled={replaceCategory2Mutation.isPending}
                  >
                    {replaceCategory2Mutation.isPending ? 'Replacing...' : 'Replace Financial Data'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    {getCategoryIcon(3)}
                    <span className="ml-2">Category 3</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => replaceCategory3Mutation.mutate(selectedSiteId)}
                    disabled={replaceCategory3Mutation.isPending}
                  >
                    {replaceCategory3Mutation.isPending ? 'Replacing...' : 'Replace Location Data'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {siteStatus.lastUpdated && (
              <p className="text-sm text-muted-foreground text-center">
                Last updated: {new Date(siteStatus.lastUpdated).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}