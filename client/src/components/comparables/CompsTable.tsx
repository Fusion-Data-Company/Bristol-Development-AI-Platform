import React, { useState, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  X,
  Trash2, 
  Edit3,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  Users
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface CompsTableProps {
  comps: CompRecord[];
  isLoading?: boolean;
}

export function CompsTable({ comps, isLoading }: CompsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

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
        className="cursor-pointer hover:bg-muted p-1 rounded text-xs min-h-[20px] transition-colors"
        onClick={() => handleCellEdit(comp.id, field, displayValue)}
        title="Click to edit"
      >
        {displayValue || '-'}
      </div>
    );
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return null;
    return `$${value.toLocaleString()}`;
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (!value) return null;
    return `${value}%`;
  };

  const formatPsf = (value: number | null | undefined) => {
    if (!value) return null;
    return `$${value.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading comparables...</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-[200px] font-semibold">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Property
              </div>
            </TableHead>
            <TableHead className="w-[300px] font-semibold">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </div>
            </TableHead>
            <TableHead className="w-[80px] font-semibold">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Units
              </div>
            </TableHead>
            <TableHead className="w-[80px] font-semibold">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Year
              </div>
            </TableHead>
            <TableHead className="w-[100px] font-semibold">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Rent/SF
              </div>
            </TableHead>
            <TableHead className="w-[100px] font-semibold">Rent/Unit</TableHead>
            <TableHead className="w-[80px] font-semibold">Occ%</TableHead>
            <TableHead className="w-[100px] font-semibold">Concession%</TableHead>
            <TableHead className="w-[150px] font-semibold">Amenities</TableHead>
            <TableHead className="w-[100px] font-semibold">Source</TableHead>
            <TableHead className="w-[80px] font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comps.map((comp) => (
            <TableRow key={comp.id} className="hover:bg-gray-50/50 transition-colors">
              <TableCell>
                <div className="space-y-1">
                  {renderEditableCell(comp, 'name', comp.name)}
                  <div className="text-xs text-gray-500">
                    <Badge variant="outline" className="text-xs">
                      {comp.assetType}
                    </Badge>
                    {comp.subtype && (
                      <span className="ml-1 text-gray-400">• {comp.subtype}</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {renderEditableCell(comp, 'address', comp.address)}
                  <div className="text-xs text-gray-500">
                    {comp.city}, {comp.state} {comp.zip}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {renderEditableCell(comp, 'units', comp.units)}
              </TableCell>
              <TableCell>
                {renderEditableCell(comp, 'yearBuilt', comp.yearBuilt)}
              </TableCell>
              <TableCell>
                {renderEditableCell(comp, 'rentPsf', formatPsf(comp.rentPsf))}
              </TableCell>
              <TableCell>
                {renderEditableCell(comp, 'rentPu', formatCurrency(comp.rentPu))}
              </TableCell>
              <TableCell>
                {renderEditableCell(comp, 'occupancyPct', formatPercentage(comp.occupancyPct))}
              </TableCell>
              <TableCell>
                {renderEditableCell(comp, 'concessionPct', formatPercentage(comp.concessionPct))}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {comp.amenityTags?.slice(0, 2).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {comp.amenityTags && comp.amenityTags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{comp.amenityTags.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={comp.source === 'sample-data' ? 'secondary' : 'default'} 
                  className="text-xs"
                >
                  {comp.source}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteCompMutation.mutate(comp.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    title="Delete record"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {comps.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No comparable properties found</p>
          <p className="text-sm">Try launching a scrape job to populate data</p>
        </div>
      )}
    </div>
  );
}

export default CompsTable;