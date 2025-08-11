import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Database,
  Map,
  Building2,
  Brain,
  Cloud,
  Code,
  Link,
  ArrowRight,
  Key,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface IntegrationStatus {
  name: string;
  connected: boolean;
  configured: boolean;
  lastSync?: string;
  error?: string;
}

export default function Integrations() {
  const [activeTab, setActiveTab] = useState('services');
  const [testingService, setTestingService] = useState<string | null>(null);

  // Get integration status
  const { data: integrations, isLoading } = useQuery<IntegrationStatus[]>({
    queryKey: ['/api/integrations/status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get integration logs
  const { data: logs } = useQuery({
    queryKey: ['/api/integrations/logs'],
    refetchInterval: 10000
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (service: string) => {
      const response = await fetch(`/api/integrations/${service}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Connection test failed');
      return response.json();
    },
    onSuccess: (data, service) => {
      toast({
        title: 'Connection Successful',
        description: `${service} is connected and working properly.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/integrations/status'] });
    },
    onError: (error, service) => {
      toast({
        title: 'Connection Failed',
        description: `Failed to connect to ${service}. Please check your configuration.`,
        variant: 'destructive'
      });
    }
  });

  const getServiceIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'arcgis':
      case 'mapbox':
        return <Map className="h-5 w-5" />;
      case 'costar':
      case 'rentometer':
        return <Building2 className="h-5 w-5" />;
      case 'openai':
      case 'claude':
        return <Brain className="h-5 w-5" />;
      case 'microsoft':
      case 'onedrive':
        return <Cloud className="h-5 w-5" />;
      case 'apify':
        return <Code className="h-5 w-5" />;
      case 'postgres':
      case 'postgresql':
        return <Database className="h-5 w-5" />;
      default:
        return <Link className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (integration: IntegrationStatus) => {
    if (integration.error) {
      return <Badge variant="destructive">Error</Badge>;
    }
    if (integration.connected && integration.configured) {
      return <Badge className="bg-green-600">Connected</Badge>;
    }
    if (integration.configured) {
      return <Badge variant="secondary">Configured</Badge>;
    }
    return <Badge variant="outline">Not Configured</Badge>;
  };

  const serviceIntegrations = [
    {
      name: 'ArcGIS',
      description: 'Access geospatial data and mapping services',
      configured: true,
      connected: true,
      features: ['Map layers', 'Demographics', 'Census data']
    },
    {
      name: 'MapBox',
      description: 'Interactive maps and location intelligence',
      configured: true,
      connected: true,
      features: ['Interactive maps', 'Geocoding', 'Routing']
    },
    {
      name: 'OpenAI',
      description: 'AI-powered analysis and chat capabilities',
      configured: !!process.env.OPENAI_API_KEY,
      connected: !!process.env.OPENAI_API_KEY,
      features: ['Site analysis', 'Chat assistance', 'Report generation']
    },
    {
      name: 'Microsoft',
      description: 'OneDrive integration for file storage',
      configured: !!process.env.MICROSOFT_CLIENT_ID,
      connected: false,
      features: ['File sync', 'Document storage', 'Collaboration']
    },
    {
      name: 'Apify',
      description: 'Web scraping and data extraction',
      configured: !!process.env.APIFY_API_TOKEN,
      connected: !!process.env.APIFY_API_TOKEN,
      features: ['Property data', 'Market research', 'Competitor analysis']
    },
    {
      name: 'PostgreSQL',
      description: 'Primary database for data storage',
      configured: true,
      connected: true,
      features: ['Data persistence', 'Analytics', 'Reporting']
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Integrations</h1>
            <p className="text-muted-foreground mt-1">
              Manage external services and API connections
            </p>
          </div>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/integrations/status'] })}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {serviceIntegrations.map((service) => (
                <Card key={service.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getServiceIcon(service.name)}
                        {service.name}
                      </div>
                      {service.connected ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : service.configured ? (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Features */}
                    <div className="space-y-1">
                      {service.features.map((feature, i) => (
                        <div key={i} className="text-sm text-muted-foreground flex items-center gap-1">
                          <ArrowRight className="h-3 w-3" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <Badge variant={service.connected ? 'default' : service.configured ? 'secondary' : 'outline'}>
                        {service.connected ? 'Connected' : service.configured ? 'Configured' : 'Not Configured'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTestingService(service.name);
                          testConnectionMutation.mutate(service.name);
                        }}
                        disabled={!service.configured || testingService === service.name}
                      >
                        {testingService === service.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Test'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-4">
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                API keys are stored securely as environment variables. Contact your administrator to update keys.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {[
                { name: 'OPENAI_API_KEY', service: 'OpenAI', required: true },
                { name: 'MAPBOX_PUBLIC_TOKEN', service: 'MapBox', required: true },
                { name: 'MICROSOFT_CLIENT_ID', service: 'Microsoft OAuth', required: false },
                { name: 'MICROSOFT_CLIENT_SECRET', service: 'Microsoft OAuth', required: false },
                { name: 'APIFY_API_TOKEN', service: 'Apify', required: false },
                { name: 'DATABASE_URL', service: 'PostgreSQL', required: true }
              ].map((key) => (
                <Card key={key.name}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {key.name}
                        </code>
                        {key.required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{key.service}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {process.env[key.name] ? (
                        <Badge className="bg-green-600">Set</Badge>
                      ) : (
                        <Badge variant="outline">Not Set</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Integration events and API calls from the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {logs && logs.length > 0 ? (
                    <div className="space-y-2">
                      {logs.map((log: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50">
                          <div className={cn(
                            "mt-1 rounded-full p-1",
                            log.status === 'success' ? 'bg-green-100' : 
                            log.status === 'error' ? 'bg-red-100' : 
                            'bg-gray-100'
                          )}>
                            {log.status === 'success' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : log.status === 'error' ? (
                              <XCircle className="h-3 w-3 text-red-600" />
                            ) : (
                              <Loader2 className="h-3 w-3 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{log.service}</p>
                              <span className="text-xs text-muted-foreground">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{log.message}</p>
                            {log.error && (
                              <p className="text-xs text-red-600">{log.error}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activity logs
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}