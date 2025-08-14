import React from 'react';
import { CompsFilters } from './CompsFilters';

// Legacy wrapper for backward compatibility
interface AdvancedFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  availableAssetTypes: string[];
  availableSubtypes: string[];
  availableAmenities: string[];
}

export default function AdvancedFilters({ filters, onFiltersChange, availableAssetTypes, availableSubtypes, availableAmenities }: AdvancedFiltersProps) {
  const availableOptions = {
    assetTypes: availableAssetTypes,
    subtypes: availableSubtypes,
    sources: [],
    cities: [],
    amenities: availableAmenities,
  };

  return (
    <CompsFilters
      onFiltersChange={onFiltersChange}
      availableOptions={availableOptions}
    />
  );
}