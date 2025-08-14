import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Play, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Eye,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScrapeJob {
  id: string;
  status: 'queued' | 'running' | 'done' | 'error';
  query: {
    address: string;
    radius_mi: number;
    asset_type: string;
    keywords: string[];
  };
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
}

interface ScrapeQuery {
  address: string;
  radius_mi: number;
  asset_type: string;
  keywords: string[];
}

export function ScraperJobManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLaunchDialogOpen, setIsLaunchDialogOpen] = useState(false);
  const [scrapeQuery, setScrapeQuery] = useState<ScrapeQuery>({
    address: '',
    radius_mi: 5,
    asset_type: 'Multifamily',
    keywords: []
  });
  const [keywordInput, setKeywordInput] = useState('');

  // Fetch scrape jobs
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/comps-annex/jobs'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const jobs: ScrapeJob[] = (jobsData as any)?.rows || [];

  // Launch scrape job mutation
  const launchScrapeMutation = useMutation({
    mutationFn: async (query: ScrapeQuery) => {
      const response = await fetch('/api/comps-annex/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      });
      if (!response.ok) throw new Error('Failed to launch scrape');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comps-annex/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] });
      toast({ title: 'Scrape job launched successfully' });
      setIsLaunchDialogOpen(false);
      setScrapeQuery({
        address: '',
        radius_mi: 5,
        asset_type: 'Multifamily',
        keywords: []
      });
    },
    onError: () => {
      toast({ title: 'Failed to launch scrape job', variant: 'destructive' });
    },
  });

  const addKeyword = () => {
    if (keywordInput.trim() && !scrapeQuery.keywords.includes(keywordInput.trim())) {
      setScrapeQuery(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setScrapeQuery(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      queued: 'secondary',
      running: 'default',
      done: 'default',
      error: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="text-xs">
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Scraper Job Manager
          </CardTitle>
          <Dialog open={isLaunchDialogOpen} onOpenChange={setIsLaunchDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Launch Scrape
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Launch Scraper Job</DialogTitle>
                <DialogDescription>
                  Configure and launch a new web scraping job to collect comparable property data
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Search Address/Area</Label>
                  <Input
                    id="address"
                    placeholder="e.g., Atlanta, GA or 123 Main St, Atlanta, GA"
                    value={scrapeQuery.address}
                    onChange={(e) => setScrapeQuery(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="radius">Radius (miles)</Label>
                    <Input
                      id="radius"
                      type="number"
                      min="1"
                      max="50"
                      value={scrapeQuery.radius_mi}
                      onChange={(e) => setScrapeQuery(prev => ({ ...prev, radius_mi: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="asset-type">Asset Type</Label>
                    <select
                      id="asset-type"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={scrapeQuery.asset_type}
                      onChange={(e) => setScrapeQuery(prev => ({ ...prev, asset_type: e.target.value }))}
                    >
                      <option value="Multifamily">Multifamily</option>
                      <option value="Office">Office</option>
                      <option value="Retail">Retail</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Mixed-Use">Mixed-Use</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Keywords</Label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {scrapeQuery.keywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add keyword..."
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addKeyword();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addKeyword}>
                      Add
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => launchScrapeMutation.mutate(scrapeQuery)}
                  disabled={!scrapeQuery.address || launchScrapeMutation.isPending}
                  className="w-full"
                >
                  {launchScrapeMutation.isPending ? 'Launching...' : 'Launch Scrape Job'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {jobsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading jobs...</div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No scrape jobs found</p>
            <p className="text-sm">Launch your first scrape job to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Radius</TableHead>
                  <TableHead>Asset Type</TableHead>
                  <TableHead>Keywords</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        {getStatusBadge(job.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={job.query.address}>
                        {job.query.address}
                      </div>
                    </TableCell>
                    <TableCell>{job.query.radius_mi}mi</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {job.query.asset_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {job.query.keywords?.slice(0, 2).map((keyword, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {job.query.keywords && job.query.keywords.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{job.query.keywords.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-500">
                        {new Date(job.createdAt).toLocaleDateString()} {new Date(job.createdAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-500">
                        {job.startedAt && job.finishedAt
                          ? `${Math.round((new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)}s`
                          : job.startedAt
                          ? 'Running...'
                          : '-'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                        {job.status === 'error' || job.status === 'done' ? (
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ScraperJobManager;