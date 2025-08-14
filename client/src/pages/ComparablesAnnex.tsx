import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import Chrome from '@/components/brand/Chrome';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, 
  Download, 
  Upload, 
  Play, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Settings
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

export default function ComparablesAnnex() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
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

  const comps: CompRecord[] = compsData?.rows || [];
  const total = compsData?.total || 0;

  // Mutations
  const updateCompMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const response = await fetch(`/api/comps-annex/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) throw new Error('Update failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] });
      toast({ title: 'Updated successfully' });
    },
    onError: () => {
      toast({ title: 'Update failed', variant: 'destructive' });
    },
  });

  const deleteCompMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/comps-annex/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] });
      toast({ title: 'Deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Delete failed', variant: 'destructive' });
    },
  });

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

  // Handle inline editing
  const handleCellEdit = useCallback((id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditValue(String(currentValue || ''));
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingCell) return;
    
    let value: any = editValue;
    
    // Parse numeric fields
    if (['units', 'yearBuilt', 'rentPsf', 'rentPu', 'occupancyPct', 'concessionPct', 'lat', 'lng'].includes(editingCell.field)) {
      value = editValue ? Number(editValue) : null;
    }
    
    updateCompMutation.mutate({ 
      id: editingCell.id, 
      field: editingCell.field, 
      value 
    });
    
    setEditingCell(null);
  }, [editingCell, editValue, updateCompMutation]);

  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Export to CSV
  const handleExport = () => {
    window.open('/api/comps-annex/export.csv', '_blank');
  };

  // Render editable cell
  const renderEditableCell = (comp: CompRecord, field: keyof CompRecord, displayValue: any) => {
    const isEditing = editingCell?.id === comp.id && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-6 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') handleCancelEdit();
            }}
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-6 w-6 p-0">
            <Save className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }
    
    return (
      <div 
        className="cursor-pointer hover:bg-muted p-1 rounded text-xs min-h-[20px]"
        onClick={() => handleCellEdit(comp.id, field, displayValue)}
      >
        {displayValue || '-'}
      </div>
    );
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

            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Property</TableHead>
                      <TableHead className="w-[300px]">Address</TableHead>
                      <TableHead className="w-[80px]">Units</TableHead>
                      <TableHead className="w-[80px]">Year</TableHead>
                      <TableHead className="w-[100px]">Rent/SF</TableHead>
                      <TableHead className="w-[100px]">Rent/Unit</TableHead>
                      <TableHead className="w-[80px]">Occ%</TableHead>
                      <TableHead className="w-[100px]">Concession%</TableHead>
                      <TableHead className="w-[150px]">Amenities</TableHead>
                      <TableHead className="w-[100px]">Source</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comps.map((comp) => (
                      <TableRow key={comp.id}>
                        <TableCell>
                          {renderEditableCell(comp, 'name', comp.name)}
                          <div className="text-xs text-gray-500 mt-1">
                            {comp.assetType} {comp.subtype && `• ${comp.subtype}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(comp, 'address', comp.address)}
                          <div className="text-xs text-gray-500 mt-1">
                            {comp.city}, {comp.state} {comp.zip}
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(comp, 'units', comp.units)}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(comp, 'yearBuilt', comp.yearBuilt)}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(comp, 'rentPsf', comp.rentPsf ? `$${comp.rentPsf.toFixed(2)}` : null)}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(comp, 'rentPu', comp.rentPu ? `$${comp.rentPu.toLocaleString()}` : null)}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(comp, 'occupancyPct', comp.occupancyPct ? `${comp.occupancyPct}%` : null)}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell(comp, 'concessionPct', comp.concessionPct ? `${comp.concessionPct}%` : null)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {comp.amenityTags?.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {comp.amenityTags && comp.amenityTags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{comp.amenityTags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {comp.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCompMutation.mutate(comp.id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Chrome>
  );
}