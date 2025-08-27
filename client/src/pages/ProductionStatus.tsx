import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface HealthCheck {
  success: boolean;
  overallHealth: string;
  healthyServices: number;
  totalServices: number;
  details: Record<string, boolean>;
  apis: Record<string, any>;
  timestamp: string;
}

interface ReplacementResult {
  success: boolean;
  message: string;
  summary: any;
  results?: any[];
  errors?: string[];
  timestamp: string;
}

export default function ProductionStatus() {
  const [activeReplacement, setActiveReplacement] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Health check query
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery<HealthCheck>({
    queryKey: ['/api/placeholder-replacement/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Replacement mutations
  const replacementMutations = {
    demographics: useMutation({
      mutationFn: () => apiRequest('/api/placeholder-replacement/replace-demographics', { method: 'POST' }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/placeholder-replacement/health'] });
        setActiveReplacement(null);
      },
    }),
    bristolScores: useMutation({
      mutationFn: () => apiRequest('/api/placeholder-replacement/replace-brand-scores', { method: 'POST' }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/placeholder-replacement/health'] });
        setActiveReplacement(null);
      },
    }),
    marketData: useMutation({
      mutationFn: () => apiRequest('/api/placeholder-replacement/replace-market-data', { method: 'POST' }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/placeholder-replacement/health'] });
        setActiveReplacement(null);
      },
    }),
    allPlaceholders: useMutation({
      mutationFn: () => apiRequest('/api/placeholder-replacement/replace-all-placeholders', { method: 'POST' }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/placeholder-replacement/health'] });
        setActiveReplacement(null);
      },
    }),
  };

  const handleReplacement = (type: keyof typeof replacementMutations) => {
    setActiveReplacement(type);
    replacementMutations[type].mutate();
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getHealthProgress = () => {
    if (!healthData) return 0;
    return (healthData.healthyServices / healthData.totalServices) * 100;
  };

  if (healthLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading production status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Readiness Status</h1>
          <p className="text-gray-600 mt-2">Real-time monitoring of data sources and placeholder replacement</p>
        </div>
        <Button onClick={() => refetchHealth()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Overall Health Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            System Health Overview
          </CardTitle>
          <CardDescription>
            {healthData?.overallHealth} • Last updated: {new Date(healthData?.timestamp || '').toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Overall Health</span>
                <span>{Math.round(getHealthProgress())}%</span>
              </div>
              <Progress value={getHealthProgress()} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {healthData?.details && Object.entries(healthData.details).map(([service, status]) => (
                <div key={service} className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span className="text-sm font-medium capitalize">
                    {service.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="apis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="apis">API Status</TabsTrigger>
          <TabsTrigger value="replacement">Placeholder Replacement</TabsTrigger>
        </TabsList>

        <TabsContent value="apis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {healthData?.apis && Object.entries(healthData.apis).map(([api, info]: [string, any]) => (
              <Card key={api}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">{api} API</CardTitle>
                    <Badge variant={info.status === 'healthy' ? 'default' : 'destructive'}>
                      {info.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <div>Endpoint: <code className="text-xs bg-gray-100 px-1 rounded">{info.endpoint}</code></div>
                    <div>Key Required: {info.keyRequired ? 'Yes' : 'No'}</div>
                    {info.keyRequired && (
                      <div>Configured: {info.configured ? '✅ Yes' : '❌ No'}</div>
                    )}
                  </div>
                  {info.keyRequired && !info.configured && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        API key not configured. Add {api.toUpperCase()}_API_KEY to environment.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="replacement" className="space-y-4">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertTitle>Production Ready Replacement System</AlertTitle>
            <AlertDescription>
              Replace all 47 identified placeholder sections with real data from authenticated APIs.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {/* Individual Replacement Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Demographics Data Replacement</CardTitle>
                <CardDescription>
                  Replace hardcoded demographics with real US Census Bureau data for all sites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleReplacement('demographics')}
                  disabled={activeReplacement === 'demographics' || replacementMutations.demographics.isPending}
                  className="w-full"
                >
                  {(activeReplacement === 'demographics' || replacementMutations.demographics.isPending) && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Replace Demographics Data
                </Button>
                {replacementMutations.demographics.data && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-sm text-green-800">
                      ✅ {(replacementMutations.demographics.data as any).message}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company Scores Replacement</CardTitle>
                <CardDescription>
                  Calculate real Company scores using proprietary 100-point methodology
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleReplacement('bristolScores')}
                  disabled={activeReplacement === 'bristolScores' || replacementMutations.bristolScores.isPending}
                  className="w-full"
                >
                  {(activeReplacement === 'bristolScores' || replacementMutations.bristolScores.isPending) && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Calculate Company Scores
                </Button>
                {replacementMutations.bristolScores.data && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-sm text-green-800">
                      ✅ {(replacementMutations.bristolScores.data as any).message}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Data Replacement</CardTitle>
                <CardDescription>
                  Replace static market data with real-time API feeds from multiple sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleReplacement('marketData')}
                  disabled={activeReplacement === 'marketData' || replacementMutations.marketData.isPending}
                  className="w-full"
                >
                  {(activeReplacement === 'marketData' || replacementMutations.marketData.isPending) && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Replace Market Data
                </Button>
                {replacementMutations.marketData.data && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-sm text-green-800">
                      ✅ {(replacementMutations.marketData.data as any).message}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comprehensive Replacement */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">🚀 Replace ALL Placeholders</CardTitle>
                <CardDescription className="text-yellow-700">
                  Comprehensive replacement of all 47 placeholder sections in one operation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleReplacement('allPlaceholders')}
                  disabled={activeReplacement === 'allPlaceholders' || replacementMutations.allPlaceholders.isPending}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  {(activeReplacement === 'allPlaceholders' || replacementMutations.allPlaceholders.isPending) && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  REPLACE ALL PLACEHOLDERS
                </Button>
                {replacementMutations.allPlaceholders.data && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-sm text-green-800">
                      ✅ {(replacementMutations.allPlaceholders.data as any).message}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Duration: {(replacementMutations.allPlaceholders.data as any).duration}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}