import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Building2, MapPin, Calendar, TrendingUp, Users, Activity, Play, RefreshCw } from 'lucide-react';
import { BristolFooter } from '@/components/ui/BristolFooter';
import { format } from 'date-fns';

interface CompetitorSignal {
  id: string;
  type: string;
  jurisdiction: string;
  source: string;
  title: string;
  address?: string;
  whenIso: string;
  link?: string;
  competitorMatch?: string;
  confidence?: number;
  priority?: number;
  analyzed: boolean;
}

interface CompetitorEntity {
  id: string;
  name: string;
  type: string;
  keywords: string[];
  active: boolean;
  cik?: string;
}

interface GeoJurisdiction {
  key: string;
  label: string;
  state: string;
  active: boolean;
  lastScraped?: string;
}

interface ScrapeJob {
  id: string;
  status: string;
  source: string;
  recordsFound?: number;
  recordsNew?: number;
  startedAt?: string;
  finishedAt?: string;
  errorMessage?: string;
}

interface DashboardData {
  summary: {
    totalSignals: number;
    competitorMatches: number;
    highPriority: number;
    jurisdictionsActive: number;
    competitorsTracked: number;
  };
  signalsByType: Record<string, number>;
  signalsByJurisdiction: Record<string, number>;
  signalsByCompetitor: Record<string, number>;
  highPrioritySignals: CompetitorSignal[];
  recentAnalyses: any[];
  competitors: CompetitorEntity[];
  jurisdictions: GeoJurisdiction[];
}

export default function CompetitorWatch() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<{ data: DashboardData }>({
    queryKey: ['/api/competitor/dashboard'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch signals
  const { data: signalsData } = useQuery<{ signals: CompetitorSignal[] }>({
    queryKey: ['/api/competitor/signals'],
    enabled: activeTab === 'signals',
  });

  // Fetch jobs
  const { data: jobsData } = useQuery<{ jobs: ScrapeJob[] }>({
    queryKey: ['/api/competitor/jobs'],
    enabled: activeTab === 'jobs',
    refetchInterval: 5000, // Refresh every 5 seconds for jobs
  });

  // Manual scrape mutation
  const scrapeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/competitor/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysBack: 7 }),
      });
      if (!response.ok) throw new Error('Failed to start scrape');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitor/jobs'] });
    },
  });

  const dashboard = dashboardData?.data;

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-[#8B1538]" />
          </div>
        </div>
        <BristolFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-[Cinzel]">
            Competitor Watch
          </h1>
          <p className="text-gray-600 text-lg">
            Real-time monitoring of competitor development activities across multiple jurisdictions
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="signals">Signals</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            <TabsTrigger value="jobs">Scrape Jobs</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card className="border-l-4 border-l-[#8B1538]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Signals</p>
                      <p className="text-2xl font-bold text-[#8B1538]">
                        {dashboard?.summary.totalSignals || 0}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-[#8B1538]" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Competitor Matches</p>
                      <p className="text-2xl font-bold text-orange-500">
                        {dashboard?.summary.competitorMatches || 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">High Priority</p>
                      <p className="text-2xl font-bold text-red-500">
                        {dashboard?.summary.highPriority || 0}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Jurisdictions</p>
                      <p className="text-2xl font-bold text-blue-500">
                        {dashboard?.summary.jurisdictionsActive || 0}
                      </p>
                    </div>
                    <MapPin className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Competitors Tracked</p>
                      <p className="text-2xl font-bold text-green-500">
                        {dashboard?.summary.competitorsTracked || 0}
                      </p>
                    </div>
                    <Building2 className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Control Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Control Panel
                </CardTitle>
                <CardDescription>
                  Monitor and control competitor intelligence scraping operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    onClick={() => scrapeMutation.mutate()}
                    disabled={scrapeMutation.isPending}
                    className="bg-[#8B1538] hover:bg-[#8B1538]/90"
                  >
                    {scrapeMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Run Scrape Cycle
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jurisdictions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Active Jurisdictions</CardTitle>
                <CardDescription>
                  Monitoring {dashboard?.jurisdictions.length || 0} jurisdictions across Tennessee
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Scraped</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard?.jurisdictions.map((jurisdiction) => (
                      <TableRow key={jurisdiction.key}>
                        <TableCell className="font-medium">
                          {jurisdiction.label}
                        </TableCell>
                        <TableCell>{jurisdiction.state}</TableCell>
                        <TableCell>
                          <Badge variant={jurisdiction.active ? "default" : "secondary"}>
                            {jurisdiction.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {jurisdiction.lastScraped
                            ? format(new Date(jurisdiction.lastScraped), 'MMM d, h:mm a')
                            : 'Never'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Signals Tab */}
          <TabsContent value="signals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Signals</CardTitle>
                <CardDescription>
                  Latest competitor development activities detected
                </CardDescription>
              </CardHeader>
              <CardContent>
                {signalsData?.signals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No signals detected in recent searches.
                    <br />
                    Try running a scrape cycle to collect new data.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Jurisdiction</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Competitor</TableHead>
                        <TableHead>Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signalsData?.signals.map((signal) => (
                        <TableRow key={signal.id}>
                          <TableCell>
                            <Badge variant="outline">{signal.type}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {signal.title}
                          </TableCell>
                          <TableCell>{signal.jurisdiction}</TableCell>
                          <TableCell>
                            {format(new Date(signal.whenIso), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {signal.competitorMatch || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={signal.priority && signal.priority > 7 ? "destructive" : "secondary"}
                            >
                              {signal.priority || 'Low'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competitors Tab */}
          <TabsContent value="competitors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tracked Competitors</CardTitle>
                <CardDescription>
                  {dashboard?.competitors.length || 0} competitors being monitored
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Keywords</TableHead>
                      <TableHead>SEC CIK</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard?.competitors.map((competitor) => (
                      <TableRow key={competitor.id}>
                        <TableCell className="font-medium">
                          {competitor.name}
                        </TableCell>
                        <TableCell className="capitalize">
                          {competitor.type}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {competitor.keywords.slice(0, 3).map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {competitor.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{competitor.keywords.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{competitor.cik || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={competitor.active ? "default" : "secondary"}>
                            {competitor.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scrape Jobs</CardTitle>
                <CardDescription>
                  Monitor the status of data collection operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {jobsData?.jobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No recent scrape jobs.
                    <br />
                    Start a scrape cycle to begin monitoring.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Records Found</TableHead>
                        <TableHead>New Records</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobsData?.jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">
                            {job.source}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                job.status === 'running' ? 'default' :
                                job.status === 'done' ? 'secondary' :
                                job.status === 'failed' ? 'destructive' : 'outline'
                              }
                            >
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {job.startedAt 
                              ? format(new Date(job.startedAt), 'MMM d, h:mm a')
                              : '-'
                            }
                          </TableCell>
                          <TableCell>{job.recordsFound || '-'}</TableCell>
                          <TableCell>{job.recordsNew || '-'}</TableCell>
                          <TableCell>
                            {job.startedAt && job.finishedAt
                              ? `${Math.round((new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)}s`
                              : job.status === 'running' ? 'Running...' : '-'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <BristolFooter />
    </div>
  );
}