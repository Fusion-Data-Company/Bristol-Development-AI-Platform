import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Building2, MapPin, Calendar, TrendingUp, Users, Activity, Play, RefreshCw, Brain, Shield } from 'lucide-react';
import { BristolFooter } from '@/components/ui/BristolFooter';
import { format } from 'date-fns';
import Chrome from "../components/brand/SimpleChrome";
import bristolBackgroundImage from "@assets/Screenshot 2025-08-18 at 00.30.48_1755502256595.png";

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
      <Chrome>
        <div className="min-h-screen relative z-10"
          style={{
            backgroundImage: `url(${bristolBackgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}>
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
          <div className="container mx-auto p-6 relative z-10">
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-bristol-maroon" />
            </div>
          </div>
        </div>
      </Chrome>
    );
  }

  return (
    <Chrome>
      <div className="min-h-screen relative z-10"
        style={{
          backgroundImage: `url(${bristolBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
        <div className="absolute inset-0 bg-white/85 backdrop-blur-sm"></div>
        
        {/* Premium Intelligence Header */}
        <div className="bg-white/90 backdrop-blur-md border-b-2 border-bristol-maroon/20 shadow-xl relative z-10">
          <div className="px-8 py-6 relative overflow-hidden">
            {/* Enhanced ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-bristol-cream/40 via-white/30 to-bristol-sky/40"></div>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-96 h-96 bg-bristol-maroon/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-bristol-gold/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
            
            <div className="flex items-center justify-between mb-4 relative">
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <div className="relative group">
                    <Brain className="h-12 w-12 text-bristol-maroon drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute -inset-2 bg-bristol-maroon/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                  </div>
                  <div>
                    <h1 className="text-5xl font-cinzel font-bold text-bristol-ink tracking-wide drop-shadow-lg bg-gradient-to-r from-bristol-ink to-bristol-maroon bg-clip-text text-transparent">
                      Intel
                    </h1>
                    <p className="text-bristol-maroon mt-1 font-medium tracking-wider text-lg">
                      Bristol Competitor Intelligence Platform
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge 
                  variant="outline" 
                  className="px-8 py-4 text-bristol-ink border-bristol-maroon/50 bg-gradient-to-br from-white via-bristol-cream/30 to-bristol-maroon/10 backdrop-blur-sm font-bold text-xl shadow-xl shadow-bristol-maroon/25 hover:shadow-bristol-maroon/40 transition-all duration-500 hover:scale-105 border-2"
                >
                  <Shield className="w-6 h-6 mr-3 text-bristol-maroon" />
                  Active Monitoring
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto p-6 relative z-10">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-bristol-cream/20 via-white/80 to-bristol-cream/20 backdrop-blur-md border-2 border-bristol-maroon/20 shadow-xl p-2">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-bristol-maroon data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-bristol-maroon/40 font-bold transition-all duration-300 hover:scale-105"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="signals" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-bristol-maroon data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-bristol-maroon/40 font-bold transition-all duration-300 hover:scale-105"
            >
              Signals
            </TabsTrigger>
            <TabsTrigger 
              value="competitors" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-bristol-maroon data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-bristol-maroon/40 font-bold transition-all duration-300 hover:scale-105"
            >
              Competitors
            </TabsTrigger>
            <TabsTrigger 
              value="jobs" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-bristol-maroon data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-bristol-maroon/40 font-bold transition-all duration-300 hover:scale-105"
            >
              Scrape Jobs
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card className="border-l-4 border-l-bristol-maroon bg-gradient-to-br from-white via-bristol-cream/20 to-white backdrop-blur-sm shadow-xl shadow-bristol-maroon/20 hover:shadow-bristol-maroon/40 transition-all duration-500 hover:scale-105 border border-bristol-maroon/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-bristol-maroon/70 font-medium">Total Signals</p>
                      <p className="text-2xl font-bold text-bristol-maroon">
                        {dashboard?.summary.totalSignals || 0}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-bristol-maroon" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-white via-orange-100/30 to-white backdrop-blur-sm shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-500 hover:scale-105 border border-orange-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600/70 font-medium">Competitor Matches</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {dashboard?.summary.competitorMatches || 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-white via-red-100/30 to-white backdrop-blur-sm shadow-xl shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-500 hover:scale-105 border border-red-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600/70 font-medium">High Priority</p>
                      <p className="text-2xl font-bold text-red-600">
                        {dashboard?.summary.highPriority || 0}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-white via-blue-100/30 to-white backdrop-blur-sm shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-500 hover:scale-105 border border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600/70 font-medium">Jurisdictions</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {dashboard?.summary.jurisdictionsActive || 0}
                      </p>
                    </div>
                    <MapPin className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-white via-green-100/30 to-white backdrop-blur-sm shadow-xl shadow-green-500/20 hover:shadow-green-500/40 transition-all duration-500 hover:scale-105 border border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600/70 font-medium">Competitors Tracked</p>
                      <p className="text-2xl font-bold text-green-600">
                        {dashboard?.summary.competitorsTracked || 0}
                      </p>
                    </div>
                    <Building2 className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Control Panel */}
            <Card className="bg-gradient-to-br from-white via-bristol-cream/20 to-white backdrop-blur-sm shadow-xl shadow-bristol-maroon/20 hover:shadow-bristol-maroon/30 transition-all duration-500 border-2 border-bristol-maroon/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-bristol-ink font-cinzel font-bold text-xl">
                  <TrendingUp className="w-5 h-5 text-bristol-maroon" />
                  Control Panel
                </CardTitle>
                <CardDescription className="text-bristol-maroon/70 font-medium">
                  Monitor and control competitor intelligence scraping operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    onClick={() => scrapeMutation.mutate()}
                    disabled={scrapeMutation.isPending}
                    className="relative group overflow-hidden bg-gradient-to-r from-bristol-maroon via-red-600 to-bristol-maroon text-white font-bold px-6 py-3 rounded-xl shadow-2xl shadow-bristol-maroon/40 hover:shadow-bristol-maroon/60 transition-all duration-500 border-2 border-bristol-gold/30 hover:border-bristol-gold/60 hover:scale-105 transform hover:rotate-1"
                  >
                    {/* Animated background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-bristol-gold/20 via-yellow-400/20 to-bristol-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl blur-sm"></div>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="relative flex items-center">
                      {scrapeMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      )}
                      Run Scrape Cycle
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries()}
                    className="relative group overflow-hidden border-2 border-bristol-gold text-bristol-maroon hover:text-white bg-gradient-to-r from-bristol-gold/10 via-yellow-200/20 to-bristol-gold/10 hover:from-bristol-gold hover:via-yellow-400 hover:to-bristol-gold backdrop-blur-sm shadow-2xl shadow-bristol-gold/30 hover:shadow-bristol-gold/50 transition-all duration-500 font-bold px-5 py-2.5 rounded-lg hover:scale-105"
                  >
                    {/* Sparkle effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute top-1 left-2 w-1 h-1 bg-white rounded-full animate-ping"></div>
                      <div className="absolute bottom-1 right-2 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute top-2 right-4 w-0.5 h-0.5 bg-white rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                    </div>
                    <div className="relative flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                      Refresh Data
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jurisdictions Table */}
            <Card className="bg-gradient-to-br from-white via-bristol-cream/20 to-white backdrop-blur-sm shadow-xl shadow-bristol-maroon/20 hover:shadow-bristol-maroon/30 transition-all duration-500 border-2 border-bristol-maroon/20">
              <CardHeader>
                <CardTitle className="text-bristol-ink font-cinzel font-bold text-xl">Active Jurisdictions</CardTitle>
                <CardDescription className="text-bristol-maroon/70 font-medium">
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
            <Card className="bg-gradient-to-br from-white via-bristol-cream/20 to-white backdrop-blur-sm shadow-xl shadow-bristol-maroon/20 hover:shadow-bristol-maroon/30 transition-all duration-500 border-2 border-bristol-maroon/20">
              <CardHeader>
                <CardTitle className="text-bristol-ink font-cinzel font-bold text-xl">Recent Signals</CardTitle>
                <CardDescription className="text-bristol-maroon/70 font-medium">
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
            <Card className="bg-gradient-to-br from-white via-bristol-cream/20 to-white backdrop-blur-sm shadow-xl shadow-bristol-maroon/20 hover:shadow-bristol-maroon/30 transition-all duration-500 border-2 border-bristol-maroon/20">
              <CardHeader>
                <CardTitle className="text-bristol-ink font-cinzel font-bold text-xl">Tracked Competitors</CardTitle>
                <CardDescription className="text-bristol-maroon/70 font-medium">
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
            <Card className="bg-gradient-to-br from-white via-bristol-cream/20 to-white backdrop-blur-sm shadow-xl shadow-bristol-maroon/20 hover:shadow-bristol-maroon/30 transition-all duration-500 border-2 border-bristol-maroon/20">
              <CardHeader>
                <CardTitle className="text-bristol-ink font-cinzel font-bold text-xl">Scrape Jobs</CardTitle>
                <CardDescription className="text-bristol-maroon/70 font-medium">
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
      </div>
    </Chrome>
  );
}