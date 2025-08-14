import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  Building2,
  DollarSign,
  Calendar,
  MapPin,
  Users
} from 'lucide-react';

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

interface CompsFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  availableOptions: {
    assetTypes: string[];
    subtypes: string[];
    sources: string[];
    cities: string[];
    amenities: string[];
  };
}

export function CompsFilters({ onFiltersChange, availableOptions }: CompsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const addToArrayFilter = (key: keyof FilterState, value: string) => {
    const current = filters[key] as string[];
    if (!current.includes(value)) {
      updateFilters({ [key]: [...current, value] });
    }
  };

  const removeFromArrayFilter = (key: keyof FilterState, value: string) => {
    const current = filters[key] as string[];
    updateFilters({ [key]: current.filter(v => v !== value) });
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
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
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    count += filters.assetType.length;
    count += filters.subtype.length;
    count += filters.source.length;
    count += filters.city.length;
    if (filters.minUnits || filters.maxUnits) count++;
    if (filters.minRentPsf || filters.maxRentPsf) count++;
    if (filters.minYearBuilt || filters.maxYearBuilt) count++;
    if (filters.minOccupancy || filters.maxOccupancy) count++;
    count += filters.amenities.length;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Always visible search */}
        <div className="mb-4">
          <Label htmlFor="search">Search Properties</Label>
          <Input
            id="search"
            placeholder="Search by name, address, or location..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="mt-1"
          />
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-6">
            {/* Property Type Filters */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4" />
                  Asset Type
                </Label>
                <Select onValueChange={(value) => addToArrayFilter('assetType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOptions.assetTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.assetType.map(type => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => removeFromArrayFilter('assetType', type)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Select onValueChange={(value) => addToArrayFilter('city', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOptions.cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.city.map(city => (
                    <Badge key={city} variant="secondary" className="text-xs">
                      {city}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => removeFromArrayFilter('city', city)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Numeric Range Filters */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  Units
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={filters.minUnits}
                    onChange={(e) => updateFilters({ minUnits: e.target.value })}
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={filters.maxUnits}
                    onChange={(e) => updateFilters({ maxUnits: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4" />
                  Rent/SF
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    step="0.01"
                    value={filters.minRentPsf}
                    onChange={(e) => updateFilters({ minRentPsf: e.target.value })}
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    step="0.01"
                    value={filters.maxRentPsf}
                    onChange={(e) => updateFilters({ maxRentPsf: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Year Built
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={filters.minYearBuilt}
                    onChange={(e) => updateFilters({ minYearBuilt: e.target.value })}
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={filters.maxYearBuilt}
                    onChange={(e) => updateFilters({ maxYearBuilt: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Source Filter */}
            <div>
              <Label className="mb-2 block">Data Sources</Label>
              <Select onValueChange={(value) => addToArrayFilter('source', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sources..." />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions.sources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.source.map(source => (
                  <Badge key={source} variant="secondary" className="text-xs">
                    {source}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => removeFromArrayFilter('source', source)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}