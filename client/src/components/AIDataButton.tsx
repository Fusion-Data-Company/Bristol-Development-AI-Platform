import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Database, 
  Brain, 
  Activity, 
  Zap, 
  RefreshCw, 
  Download,
  Eye,
  Loader2 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AIDataButtonProps {
  onDataPush?: (data: any) => void;
  className?: string;
}

export default function AIDataButton({ onDataPush, className = "" }: AIDataButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch comprehensive data for AI
  const { data: systemData, isLoading, refetch } = useQuery({
    queryKey: ['/api/ai/enhanced/context'],
    queryFn: () => apiRequest('/api/ai/enhanced/context', 'POST', {
      sessionId: 'system',
      dataTypes: ['all']
    }),
    enabled: false
  });

  // Push data to AI
  const pushDataMutation = useMutation({
    mutationFn: async (dataTypes: string[]) => {
      const response = await apiRequest('/api/ai/enhanced/context', 'POST', {
        sessionId: 'system',
        dataTypes
      });
      return response;
    },
    onSuccess: (data) => {
      if (onDataPush) {
        onDataPush(data);
      }
      toast({
        title: "Data Pushed to AI",
        description: "Real-time data has been sent to the AI agent"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to push data to AI",
        variant: "destructive"
      });
    }
  });

  const handleDataRefresh = () => {
    refetch();
  };

  const handlePushAllData = () => {
    pushDataMutation.mutate(['all']);
  };

  const handlePushSpecificData = (dataType: string) => {
    pushDataMutation.mutate([dataType]);
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={`bg-gradient-to-r from-bristol-maroon/10 to-red-800/10 border-bristol-gold/30 hover:border-bristol-gold/60 ${className}`}
            onClick={handleDataRefresh}
          >
            <Database className="h-4 w-4 mr-2" />
            AI Data Access
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-bristol-maroon" />
              AI Data Context Manager
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sites">Sites</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">System Data Overview</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDataRefresh}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                  <Button
                    onClick={handlePushAllData}
                    disabled={pushDataMutation.isPending}
                    size="sm"
                    className="bg-bristol-maroon hover:bg-bristol-maroon/90"
                  >
                    {pushDataMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Push to AI
                  </Button>
                </div>
              </div>

              {systemData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Properties</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-bristol-maroon">
                        {systemData.sites?.length || 0}
                      </div>
                      <p className="text-xs text-gray-600">Total sites</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => handlePushSpecificData('sites')}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Push Sites
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        <Activity className="h-6 w-6" />
                      </div>
                      <p className="text-xs text-gray-600">Live data</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => handlePushSpecificData('analytics')}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Push Analytics
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {systemData.realTimeMetrics?.metrics?.dataPoints || 0}
                      </div>
                      <p className="text-xs text-gray-600">Data points</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => handlePushSpecificData('metrics')}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Push Metrics
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Integrations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        <Badge variant="outline" className="text-green-600">
                          Active
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">API status</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => handlePushSpecificData('integrations')}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Push Status
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sites" className="space-y-4">
              <ScrollArea className="h-[400px]">
                {systemData?.sites && (
                  <div className="space-y-2">
                    {systemData.sites.map((site: any, index: number) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{site.name}</h4>
                            <p className="text-sm text-gray-600">
                              {site.city}, {site.state}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {site.status}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <ScrollArea className="h-[400px]">
                {systemData?.analytics && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Market Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                          {JSON.stringify(systemData.analytics.market, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Pipeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                          {JSON.stringify(systemData.analytics.pipeline, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-4">
              <ScrollArea className="h-[400px]">
                {systemData?.integrationStatus && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">API Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(systemData.integrationStatus.apis || {}).map(([api, status]: [string, any]) => (
                            <div key={api} className="flex items-center justify-between p-2 border rounded">
                              <span className="text-sm font-medium uppercase">{api}</span>
                              <Badge variant={status.status === 'operational' ? 'default' : 'destructive'}>
                                {status.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">System Health</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Database</span>
                            <Badge variant="default">Connected</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">WebSockets</span>
                            <Badge variant="default">Active</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">MCP Tools</span>
                            <Badge variant="default">
                              {systemData.integrationStatus.mcp?.toolsAvailable || 0} Available
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              Last updated: {systemData?.timestamp ? new Date(systemData.timestamp).toLocaleString() : 'Never'}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Raw
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}