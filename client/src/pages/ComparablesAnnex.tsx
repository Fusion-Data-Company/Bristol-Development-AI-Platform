import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import Chrome from '@/components/brand/SimpleChrome';
import TanStackCompsTable from '@/components/comparables/TanStackCompsTable';
import AdvancedFilters from '@/components/comparables/AdvancedFilters';
import BulkImport from '@/components/comparables/BulkImport';
import ScraperJobManager from '@/components/comparables/ScraperJobManager';
import { EliteFirecrawlInterface } from '@/components/comparables/EliteFirecrawlInterface';
import AIAnalyticsPanel from '@/components/comparables/AIAnalyticsPanel';
import DataVisualization from '@/components/comparables/DataVisualization';
import ExportTools from '@/components/comparables/ExportTools';
import CompAnalysisWidget from '@/components/comparables/CompAnalysisWidget';
import { ExportCompsTools } from '@/components/comparables/ExportCompsTools';
import { CompsFilters } from '@/components/comparables/CompsFilters';
import ProductionMetrics from '@/components/comparables/ProductionMetrics';
import ProductionValidation from '@/components/comparables/ProductionValidation';
import { 
  Search, 
  Download, 
  Upload, 
  Play, 
  Building2,
  TrendingUp,
  BarChart3,
  Settings
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface CompRecord {
  id: string;
  source: string;
  sourceUrl?: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  assetType: string;
  subtype?: string;
  units?: number;
  yearBuilt?: number;
  rentPsf?: number;
  rentPu?: number;
  occupancyPct?: number;
  concessionPct?: number;
  amenityTags?: string[];
  notes?: string;
  canonicalAddress: string;
  unitPlan?: string;
  scrapedAt?: string;
  createdAt: string;
  updatedAt: string;
  jobId?: string;
}

interface ScrapeQuery {
  address: string;
  radius_mi: number;
  asset_type: string;
  keywords: string[];
  amenities: string[];
}

interface FilterState {
  search: string;
  assetType: string[];
  subtype: string[];
  source: string[];
  city: string[];
  minUnits: string;
  maxUnits: string;
  minRentPsf: string;
  maxRentPsf: string;
  minYearBuilt: string;
  maxYearBuilt: string;
  minOccupancy: string;
  maxOccupancy: string;
  amenities: string[];
}

export default function ComparablesAnnex() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    assetType: [],
    subtype: [],
    source: [],
    city: [],
    minUnits: '',
    maxUnits: '',
    minRentPsf: '',
    maxRentPsf: '',
    minYearBuilt: '',
    maxYearBuilt: '',
    minOccupancy: '',
    maxOccupancy: '',
    amenities: [],
  });

  const [scrapeDialogOpen, setScrapeDialogOpen] = useState(false);
  const [scrapeQuery, setScrapeQuery] = useState<ScrapeQuery>({
    address: '',
    radius_mi: 5,
    asset_type: 'Multifamily',
    keywords: [],
    amenities: []
  });
  
  // Enhanced scraping agent state
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [agentQuery, setAgentQuery] = useState<ScrapeQuery>({
    address: '',
    radius_mi: 5,
    asset_type: 'Multifamily',
    keywords: [],
    amenities: []
  });

  // Fetch comparables data
  const { data: compsData, isLoading } = useQuery({
    queryKey: ['/api/comps-annex', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      params.append('limit', '2000');
      const response = await fetch(`/api/comps-annex?${params}`);
      if (!response.ok) throw new Error('Failed to fetch comparables');
      return response.json();
    },
  });

  const rawComps: CompRecord[] = compsData?.rows || [];
  const total = compsData?.total || 0;

  // Calculate available filter options from data
  const availableOptions = useMemo(() => {
    const assetTypes = [...new Set(rawComps.map(c => c.assetType).filter(Boolean))];
    const subtypes = [...new Set(rawComps.map(c => c.subtype).filter(Boolean))];
    const sources = [...new Set(rawComps.map(c => c.source).filter(Boolean))];
    const cities = [...new Set(rawComps.map(c => c.city).filter(Boolean))];
    const amenities = [...new Set(rawComps.flatMap(c => c.amenityTags || []))];
    
    return { assetTypes, subtypes, sources, cities, amenities };
  }, [rawComps]);

  // Apply client-side filters
  const comps = useMemo(() => {
    return rawComps.filter(comp => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchableText = [
          comp.name,
          comp.address,
          comp.city,
          comp.state,
          comp.assetType,
          comp.subtype
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) return false;
      }
      
      // Asset type filter
      if (filters.assetType.length > 0 && !filters.assetType.includes(comp.assetType)) return false;
      
      // Subtype filter
      if (filters.subtype.length > 0 && comp.subtype && !filters.subtype.includes(comp.subtype)) return false;
      
      // Source filter
      if (filters.source.length > 0 && !filters.source.includes(comp.source)) return false;
      
      // City filter
      if (filters.city.length > 0 && comp.city && !filters.city.includes(comp.city)) return false;
      
      // Units range filter
      const minUnits = filters.minUnits ? parseInt(filters.minUnits) : null;
      const maxUnits = filters.maxUnits ? parseInt(filters.maxUnits) : null;
      if (minUnits && (!comp.units || comp.units < minUnits)) return false;
      if (maxUnits && (!comp.units || comp.units > maxUnits)) return false;
      
      // Rent PSF range filter
      const minRentPsf = filters.minRentPsf ? parseFloat(filters.minRentPsf) : null;
      const maxRentPsf = filters.maxRentPsf ? parseFloat(filters.maxRentPsf) : null;
      if (minRentPsf && (!comp.rentPsf || comp.rentPsf < minRentPsf)) return false;
      if (maxRentPsf && (!comp.rentPsf || comp.rentPsf > maxRentPsf)) return false;
      
      // Occupancy range filter
      const minOccupancy = filters.minOccupancy ? parseFloat(filters.minOccupancy) : null;
      const maxOccupancy = filters.maxOccupancy ? parseFloat(filters.maxOccupancy) : null;
      if (minOccupancy && (!comp.occupancyPct || comp.occupancyPct < minOccupancy)) return false;
      if (maxOccupancy && (!comp.occupancyPct || comp.occupancyPct > maxOccupancy)) return false;
      
      // Year built range filter
      const minYearBuilt = filters.minYearBuilt ? parseInt(filters.minYearBuilt) : null;
      const maxYearBuilt = filters.maxYearBuilt ? parseInt(filters.maxYearBuilt) : null;
      if (minYearBuilt && (!comp.yearBuilt || comp.yearBuilt < minYearBuilt)) return false;
      if (maxYearBuilt && (!comp.yearBuilt || comp.yearBuilt > maxYearBuilt)) return false;
      
      // Amenities filter
      if (filters.amenities.length > 0) {
        const compAmenities = comp.amenityTags || [];
        if (!filters.amenities.every(amenity => compAmenities.includes(amenity))) return false;
      }
      
      return true;
    });
  }, [rawComps, filters]);



  const scrapeMutation = useMutation({
    mutationFn: async (query: ScrapeQuery) => {
      const response = await fetch('/api/comps-annex/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      });
      if (!response.ok) throw new Error('Scrape failed');
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] });
      toast({ 
        title: 'Scrape job started', 
        description: `Job ID: ${data.id}` 
      });
      setScrapeDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Scrape failed to start', variant: 'destructive' });
    },
  });

  // Enhanced scraping agent mutation
  const agentScrapeMutation = useMutation({
    mutationFn: async (query: ScrapeQuery) => {
      const response = await fetch('/api/comps-annex/agent/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      });
      if (!response.ok) throw new Error('Enhanced scrape failed');
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] });
      toast({ 
        title: '🤖 Enhanced Scraping Agent Started', 
        description: `Job ID: ${data.id} - Using enterprise-grade scrapers` 
      });
      setAgentDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Enhanced scrape failed to start', variant: 'destructive' });
    },
  });

  // Export to CSV
  const handleExport = () => {
    window.open('/api/comps-annex/export.csv', '_blank');
  };



  return (
    <Chrome>
      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-bristol-maroon/10 rounded-xl">
                <Building2 className="h-8 w-8 text-bristol-maroon" />
              </div>
              <div>
                <h1 className="text-3xl font-cinzel font-bold text-bristol-maroon">
                  Comparables Annex
                </h1>
                <p className="text-bristol-stone text-lg">
                  Bristol Development Group's Intelligence Platform
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="bg-bristol-maroon/5 rounded-xl p-4 border border-bristol-maroon/10">
                <div className="text-2xl font-bold text-bristol-maroon">
                  {total.toLocaleString()}
                </div>
                <div className="text-bristol-stone text-sm font-medium">
                  Total Records
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Elite Firecrawl Operations Interface - Hero Section */}
        <div className="mb-8">
          <EliteFirecrawlInterface />
        </div>

        {/* Production Metrics */}
        <ProductionMetrics 
          totalRecords={total}
          lastUpdated={comps.length > 0 ? comps[0].updatedAt : undefined}
          dataQuality={95}
          systemHealth="excellent"
        />

        <div className="mb-8">
          <div className="mb-6">

            {/* Search and Actions Bar */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-xl border border-bristol-gold/20">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bristol-maroon/60 h-5 w-5" />
                  <Input
                    placeholder="Search by address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-12 border-bristol-gold/30 focus:border-bristol-maroon focus:ring-bristol-maroon/20 text-lg"
                  />
                </div>
            
                {/* Enhanced Scraping Agent */}
                <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-bristol-maroon to-bristol-gold hover:from-bristol-maroon/90 hover:to-bristol-gold/90 text-white h-12 px-6 rounded-xl shadow-xl border border-bristol-gold/50">
                      🤖 Enterprise Agent
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-bristol-maroon font-cinzel text-xl">
                        🤖 Enhanced Scraping Agent
                      </DialogTitle>
                      <DialogDescription>
                        Enterprise-grade property intelligence using Firecrawl, Apify, and advanced fallback systems
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right font-medium">Address:</label>
                        <Input
                          className="col-span-3"
                          placeholder="e.g., 123 Main St, Nashville, TN"
                          value={agentQuery.address}
                          onChange={(e) => setAgentQuery({...agentQuery, address: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right font-medium">Radius (mi):</label>
                        <Input
                          type="number"
                          className="col-span-3"
                          value={agentQuery.radius_mi}
                          onChange={(e) => setAgentQuery({...agentQuery, radius_mi: parseInt(e.target.value) || 5})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right font-medium">Asset Type:</label>
                        <select 
                          className="col-span-3 p-2 border rounded"
                          value={agentQuery.asset_type}
                          onChange={(e) => setAgentQuery({...agentQuery, asset_type: e.target.value})}
                        >
                          <option value="Multifamily">Multifamily</option>
                          <option value="Condo">Condo</option>
                          <option value="Mixed-Use">Mixed-Use</option>
                          <option value="Commercial">Commercial</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right font-medium">Amenities:</label>
                        <Input
                          className="col-span-3"
                          placeholder="pool, fitness, parking (comma-separated)"
                          value={agentQuery.amenities.join(', ')}
                          onChange={(e) => setAgentQuery({
                            ...agentQuery, 
                            amenities: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right font-medium">Keywords:</label>
                        <Input
                          className="col-span-3"
                          placeholder="luxury, renovated, new (comma-separated)"
                          value={agentQuery.keywords.join(', ')}
                          onChange={(e) => setAgentQuery({
                            ...agentQuery, 
                            keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setAgentDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => agentScrapeMutation.mutate(agentQuery)}
                        disabled={agentScrapeMutation.isPending || !agentQuery.address}
                        className="bg-bristol-maroon hover:bg-bristol-maroon/90"
                      >
                        {agentScrapeMutation.isPending ? 'Starting...' : '🚀 Run Enhanced Agent'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={scrapeDialogOpen} onOpenChange={setScrapeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-bristol-maroon to-bristol-maroon/80 hover:from-bristol-maroon/90 hover:to-bristol-maroon/70 text-white h-12 px-6 rounded-xl shadow-lg border border-bristol-gold/30">
                      <Play className="h-5 w-5 mr-2" />
                      Legacy Scraper
                    </Button>
                  </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Launch Comparables Scrape</DialogTitle>
                  <DialogDescription>
                    Configure and launch a web scraping job to find comparable properties
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Target Address</label>
                    <Input
                      placeholder="e.g. Atlanta, GA"
                      value={scrapeQuery.address}
                      onChange={(e) => setScrapeQuery({ ...scrapeQuery, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Radius (miles)</label>
                    <Input
                      type="number"
                      value={scrapeQuery.radius_mi}
                      onChange={(e) => setScrapeQuery({ ...scrapeQuery, radius_mi: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Asset Type</label>
                    <Input
                      value={scrapeQuery.asset_type}
                      onChange={(e) => setScrapeQuery({ ...scrapeQuery, asset_type: e.target.value })}
                    />
                  </div>
                  <Button 
                    onClick={() => scrapeMutation.mutate(scrapeQuery)}
                    disabled={scrapeMutation.isPending}
                    className="w-full"
                  >
                    {scrapeMutation.isPending ? 'Starting...' : 'Start Scrape Job'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

                <div className="flex items-center gap-4">
                  <BulkImport onImportComplete={() => queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] })} />
                  <ExportCompsTools data={comps} />
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <CompsFilters
            onFiltersChange={setFilters}
            availableOptions={availableOptions}
          />

          {/* Quick Analytics Cards */}
          {comps.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-white to-bristol-cream/30 border-bristol-gold/30 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-bristol-maroon/10 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-bristol-maroon" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-bristol-maroon/70">Avg Rent/SF</p>
                      <p className="text-2xl font-bold text-bristol-maroon">
                        ${(comps.filter(c => c.rentPsf).reduce((sum, c) => sum + (c.rentPsf || 0), 0) / comps.filter(c => c.rentPsf).length || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-bristol-cream/30 border-bristol-gold/30 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-bristol-maroon/10 rounded-xl">
                      <Building2 className="h-6 w-6 text-bristol-maroon" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-bristol-maroon/70">Total Units</p>
                      <p className="text-2xl font-bold text-bristol-maroon">
                        {comps.filter(c => c.units).reduce((sum, c) => sum + (c.units || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-bristol-cream/30 border-bristol-gold/30 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-bristol-maroon/10 rounded-xl">
                      <BarChart3 className="h-6 w-6 text-bristol-maroon" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-bristol-maroon/70">Avg Occupancy</p>
                      <p className="text-2xl font-bold text-bristol-maroon">
                        {(comps.filter(c => c.occupancyPct).reduce((sum, c) => sum + (c.occupancyPct || 0), 0) / comps.filter(c => c.occupancyPct).length || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white to-bristol-cream/30 border-bristol-gold/30 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-bristol-maroon/10 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-bristol-maroon" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-bristol-maroon/70">Avg Year Built</p>
                      <p className="text-2xl font-bold text-bristol-maroon">
                        {Math.round(comps.filter(c => c.yearBuilt).reduce((sum, c) => sum + (c.yearBuilt || 0), 0) / comps.filter(c => c.yearBuilt).length || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Data Table - Moved to Top Priority */}
          <Card className="bg-white/90 backdrop-blur border-bristol-gold/30 shadow-2xl mb-8">
            <CardHeader className="bg-gradient-to-r from-bristol-maroon/5 to-bristol-gold/5 border-b border-bristol-gold/20">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-bristol-maroon/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-bristol-maroon" />
                </div>
                <span className="text-bristol-maroon font-cinzel">Comparable Properties</span>
                <Badge variant="secondary" className="ml-auto text-bristol-maroon bg-bristol-gold/20">
                  {comps.length} filtered
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-bristol-maroon/60 text-lg">Loading comparables...</div>
                </div>
              ) : (
                <TanStackCompsTable data={comps} isLoading={isLoading} />
              )}
            </CardContent>
          </Card>

          {/* Scraper Job Manager */}
          <div className="mb-8">
            <ScraperJobManager />
          </div>

          {/* Analytics Panels - Redesigned Layout */}
          {/* AI Analytics gets full width for breathing room */}
          <div className="mb-8">
            <AIAnalyticsPanel data={comps} />
          </div>
          
          {/* Secondary Analytics - Two columns with more space */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <DataVisualization data={comps} />
            <CompAnalysisWidget data={comps} />
          </div>

          {/* Production Validation */}
          <div className="mb-8">
            <ProductionValidation />
          </div>
        </div>
      </div>
    </Chrome>
  );
}
