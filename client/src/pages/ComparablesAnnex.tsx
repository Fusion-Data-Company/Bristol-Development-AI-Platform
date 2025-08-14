import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import Chrome from '@/components/brand/Chrome';
import CompsTable from '@/components/comparables/CompsTable';
import AdvancedFilters from '@/components/comparables/AdvancedFilters';
import BulkImport from '@/components/comparables/BulkImport';
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
}

interface FilterState {
  assetType?: string;
  subtype?: string;
  minUnits?: number;
  maxUnits?: number;
  minRentPsf?: number;
  maxRentPsf?: number;
  minOccupancy?: number;
  maxOccupancy?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  amenities?: string[];
}

export default function ComparablesAnnex() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({});

  const [scrapeDialogOpen, setScrapeDialogOpen] = useState(false);
  const [scrapeQuery, setScrapeQuery] = useState<ScrapeQuery>({
    address: '',
    radius_mi: 5,
    asset_type: 'Multifamily',
    keywords: []
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

  // Apply client-side filters
  const comps = useMemo(() => {
    return rawComps.filter(comp => {
      // Asset type filter
      if (filters.assetType && comp.assetType !== filters.assetType) return false;
      
      // Subtype filter
      if (filters.subtype && comp.subtype !== filters.subtype) return false;
      
      // Units range filter
      if (filters.minUnits && (!comp.units || comp.units < filters.minUnits)) return false;
      if (filters.maxUnits && (!comp.units || comp.units > filters.maxUnits)) return false;
      
      // Rent PSF range filter
      if (filters.minRentPsf && (!comp.rentPsf || comp.rentPsf < filters.minRentPsf)) return false;
      if (filters.maxRentPsf && (!comp.rentPsf || comp.rentPsf > filters.maxRentPsf)) return false;
      
      // Occupancy range filter
      if (filters.minOccupancy && (!comp.occupancyPct || comp.occupancyPct < filters.minOccupancy)) return false;
      if (filters.maxOccupancy && (!comp.occupancyPct || comp.occupancyPct > filters.maxOccupancy)) return false;
      
      // Year built range filter
      if (filters.minYearBuilt && (!comp.yearBuilt || comp.yearBuilt < filters.minYearBuilt)) return false;
      if (filters.maxYearBuilt && (!comp.yearBuilt || comp.yearBuilt > filters.maxYearBuilt)) return false;
      
      // Amenities filter
      if (filters.amenities && filters.amenities.length > 0) {
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



  // Export to CSV
  const handleExport = () => {
    window.open('/api/comps-annex/export.csv', '_blank');
  };



  return (
    <Chrome>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Comparables Annex</h1>
              <p className="text-gray-600">Bristol Development Group's flagship comparables intelligence platform</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {total} Records
              </Badge>
            </div>
          </div>

          {/* Search and Actions Bar */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={scrapeDialogOpen} onOpenChange={setScrapeDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-bristol-maroon hover:bg-bristol-maroon/90">
                  <Play className="h-4 w-4 mr-2" />
                  Launch Scrape
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

            <AdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableAssetTypes={Array.from(new Set(rawComps.map(c => c.assetType).filter(Boolean)))}
              availableSubtypes={Array.from(new Set(rawComps.map(c => c.subtype).filter(Boolean)))}
              availableAmenities={Array.from(new Set(rawComps.flatMap(c => c.amenityTags || [])))}
            />

            <BulkImport onImportComplete={() => queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] })} />

            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Quick Analytics Cards */}
        {comps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-bristol-maroon" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Avg Rent/SF</p>
                    <p className="text-lg font-semibold">
                      ${(comps.filter(c => c.rentPsf).reduce((sum, c) => sum + (c.rentPsf || 0), 0) / comps.filter(c => c.rentPsf).length || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-bristol-maroon" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Total Units</p>
                    <p className="text-lg font-semibold">
                      {comps.filter(c => c.units).reduce((sum, c) => sum + (c.units || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-bristol-maroon" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Avg Occupancy</p>
                    <p className="text-lg font-semibold">
                      {(comps.filter(c => c.occupancyPct).reduce((sum, c) => sum + (c.occupancyPct || 0), 0) / comps.filter(c => c.occupancyPct).length || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-bristol-maroon" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Avg Year Built</p>
                    <p className="text-lg font-semibold">
                      {Math.round(comps.filter(c => c.yearBuilt).reduce((sum, c) => sum + (c.yearBuilt || 0), 0) / comps.filter(c => c.yearBuilt).length || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Comparable Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading comparables...</div>
              </div>
            ) : (
              <CompsTable comps={comps} isLoading={isLoading} />
            )}
          </CardContent>
        </Card>
      </div>
    </Chrome>
  );
}