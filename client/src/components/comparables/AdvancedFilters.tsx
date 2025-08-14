import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Filter, 
  X,
  SlidersHorizontal 
} from 'lucide-react';

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

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableAssetTypes: string[];
  availableSubtypes: string[];
  availableAmenities: string[];
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  availableAssetTypes,
  availableSubtypes,
  availableAmenities
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.values(filters).filter(v => 
    v !== undefined && v !== null && v !== '' && 
    (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  const addAmenityFilter = (amenity: string) => {
    const current = filters.amenities || [];
    if (!current.includes(amenity)) {
      updateFilter('amenities', [...current, amenity]);
    }
  };

  const removeAmenityFilter = (amenity: string) => {
    const current = filters.amenities || [];
    updateFilter('amenities', current.filter(a => a !== amenity));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Advanced Filters</h4>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>

          {/* Asset Type & Subtype */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Asset Type</Label>
              <Select 
                value={filters.assetType || ''} 
                onValueChange={(value) => updateFilter('assetType', value || undefined)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  {availableAssetTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">Subtype</Label>
              <Select 
                value={filters.subtype || ''} 
                onValueChange={(value) => updateFilter('subtype', value || undefined)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  {availableSubtypes.map(subtype => (
                    <SelectItem key={subtype} value={subtype}>{subtype}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Units Range */}
          <div className="space-y-1">
            <Label className="text-xs">Units</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                className="h-8"
                value={filters.minUnits || ''}
                onChange={(e) => updateFilter('minUnits', e.target.value ? Number(e.target.value) : undefined)}
              />
              <Input
                type="number"
                placeholder="Max"
                className="h-8"
                value={filters.maxUnits || ''}
                onChange={(e) => updateFilter('maxUnits', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Rent PSF Range */}
          <div className="space-y-1">
            <Label className="text-xs">Rent per SF ($)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Min"
                className="h-8"
                value={filters.minRentPsf || ''}
                onChange={(e) => updateFilter('minRentPsf', e.target.value ? Number(e.target.value) : undefined)}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Max"
                className="h-8"
                value={filters.maxRentPsf || ''}
                onChange={(e) => updateFilter('maxRentPsf', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Occupancy Range */}
          <div className="space-y-1">
            <Label className="text-xs">Occupancy (%)</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                className="h-8"
                value={filters.minOccupancy || ''}
                onChange={(e) => updateFilter('minOccupancy', e.target.value ? Number(e.target.value) : undefined)}
              />
              <Input
                type="number"
                placeholder="Max"
                className="h-8"
                value={filters.maxOccupancy || ''}
                onChange={(e) => updateFilter('maxOccupancy', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Year Built Range */}
          <div className="space-y-1">
            <Label className="text-xs">Year Built</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                className="h-8"
                value={filters.minYearBuilt || ''}
                onChange={(e) => updateFilter('minYearBuilt', e.target.value ? Number(e.target.value) : undefined)}
              />
              <Input
                type="number"
                placeholder="Max"
                className="h-8"
                value={filters.maxYearBuilt || ''}
                onChange={(e) => updateFilter('maxYearBuilt', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <Label className="text-xs">Amenities</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {(filters.amenities || []).map(amenity => (
                <Badge key={amenity} variant="secondary" className="text-xs">
                  {amenity}
                  <button
                    onClick={() => removeAmenityFilter(amenity)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Select onValueChange={addAmenityFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Add amenity filter" />
              </SelectTrigger>
              <SelectContent>
                {availableAmenities
                  .filter(amenity => !(filters.amenities || []).includes(amenity))
                  .map(amenity => (
                    <SelectItem key={amenity} value={amenity}>{amenity}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default AdvancedFilters;