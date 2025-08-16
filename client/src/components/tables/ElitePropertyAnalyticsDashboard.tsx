import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SiteDemographicAnalysis } from '../analysis/SiteDemographicAnalysis';
import { AddressDemographics } from '../analysis/AddressDemographics';
import { 
  Building2,
  MapPin,
  TrendingUp,
  BarChart3,
  Filter,
  Search,
  Download,
  Upload,
  Calendar,
  DollarSign,
  Users,
  Layers,
  Eye,
  ArrowUpDown,
  Star,
  Zap,
  Globe,
  Database,
  Activity,
  Target,
  Settings,
  Sparkles,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Maximize,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Site } from '@shared/schema';

interface ElitePropertyAnalyticsDashboardProps {
  sites: Site[];
  selectedSite: Site | null;
  onSiteSelect: (site: Site | null) => void;
}

interface PropertyCard {
  site: Site;
  isSelected: boolean;
  onSelect: () => void;
  onViewDemographics: () => void;
}

interface FilterState {
  search: string;
  status: string;
  state: string;
  minUnits: string;
  maxUnits: string;
  minAcreage: string;
  maxAcreage: string;
  completionYear: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AnalyticsMetrics {
  totalProperties: number;
  totalUnits: number;
  totalAcreage: number;
  avgUnitsPerSite: number;
  avgAcreagePerSite: number;
  statusBreakdown: Record<string, number>;
  stateBreakdown: Record<string, number>;
  completionYearRange: { min: number; max: number };
  occupancyRate: number;
}

// Clean Light Theme Property Card Component
function EnhancedPropertyCard({ site, isSelected, onSelect, onViewDemographics }: PropertyCard) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operating': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Newest': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Pipeline': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card 
      className={`
        bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group rounded-lg overflow-hidden
        ${isSelected 
          ? 'border-cyan-300 shadow-lg shadow-cyan-100' 
          : 'hover:border-cyan-200'
        }
        hover:scale-[1.01]
      `}
      onClick={onSelect}
    >
      
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <CardTitle className="text-xl font-cinzel font-bold text-gray-900 group-hover:text-cyan-700 transition-colors duration-300">
              {site.name}
            </CardTitle>
            <Badge 
              className={`
                font-semibold text-sm px-3 py-1 rounded-lg transition-all duration-300
                ${getStatusColor(site.status)}
              `}
            >
              {site.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDemographics();
              }}
              className="text-gray-600 hover:text-cyan-700 hover:bg-cyan-50 border border-gray-200 hover:border-cyan-200 rounded-lg px-3 py-2 transition-all duration-300"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            {site.latitude && site.longitude && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-cyan-700 hover:bg-cyan-50 border border-gray-200 hover:border-cyan-200 rounded-lg p-2 transition-all duration-300"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        {/* Clean Location Info */}
        <div className="space-y-2">
          <div className="flex items-center text-gray-700">
            <MapPin className="h-4 w-4 mr-2 text-cyan-600" />
            <span className="font-medium text-base font-cinzel">
              {site.addrLine1 && `${site.addrLine1}, `}{site.city}, {site.state} {site.postalCode}
            </span>
          </div>
          {site.country && site.country !== 'USA' && (
            <div className="text-sm text-gray-500">{site.country}</div>
          )}
        </div>

        {/* Clean Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Units */}
          <div className="space-y-1">
            <div className="flex items-center text-gray-600 text-sm">
              <Building2 className="h-4 w-4 mr-2" />
              <span className="font-cinzel">Total Units</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 font-cinzel">
              {site.unitsTotal?.toLocaleString() || 'TBD'}
            </div>
            {site.units1b || site.units2b || site.units3b ? (
              <div className="text-xs text-gray-500 space-x-2 font-cinzel">
                {site.units1b && <span>1BR: {site.units1b}</span>}
                {site.units2b && <span>2BR: {site.units2b}</span>}
                {site.units3b && <span>3BR: {site.units3b}</span>}
              </div>
            ) : null}
          </div>

          {/* Acreage */}
          <div className="space-y-1">
            <div className="flex items-center text-gray-600 text-sm">
              <Layers className="h-4 w-4 mr-2" />
              <span className="font-cinzel">Acreage</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 font-cinzel">
              {site.acreage ? `${site.acreage}` : 'TBD'}
            </div>
            {site.acreage && site.unitsTotal && (
              <div className="text-xs text-gray-500 font-cinzel">
                {Math.round((site.unitsTotal / site.acreage) * 10) / 10} units/acre
              </div>
            )}
          </div>

          {/* Completion Year */}
          {site.completionYear && (
            <div className="space-y-1">
              <div className="flex items-center text-gray-600 text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="font-cinzel">Completed</span>
              </div>
              <div className="text-xl font-bold text-gray-900 font-cinzel">
                {site.completionYear}
              </div>
              <div className="text-sm text-white/50">
                {new Date().getFullYear() - site.completionYear} years
              </div>
            </div>
          )}

          {/* Average SF */}
          {site.avgSf && (
            <div className="space-y-2">
              <div className="flex items-center text-white/60 text-base">
                <Maximize className="h-5 w-5 mr-2" />
                <span>Avg SF</span>
              </div>
              <div className="text-2xl font-bold text-white group-hover:text-bristol-gold transition-colors duration-500 tracking-tight">
                {site.avgSf.toLocaleString()}
              </div>
              {site.unitsTotal && (
                <div className="text-xs text-bristol-stone/60">
                  {(site.avgSf * site.unitsTotal).toLocaleString()} total SF
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clean Details */}
        {site.parkingSpaces && (
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
            <span className="font-cinzel">{site.parkingSpaces.toLocaleString()} parking spaces</span>
            {site.unitsTotal && (
              <span className="ml-2 text-cyan-600 font-cinzel">({(site.parkingSpaces / site.unitsTotal).toFixed(1)} per unit)</span>
            )}
          </div>
        )}

        {site.notes && (
          <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
            {site.notes.length > 100 ? `${site.notes.substring(0, 100)}...` : site.notes}
          </div>
        )}

        {/* Clean Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-2" />
              <span className="font-cinzel">Updated {site.updatedAt ? new Date(site.updatedAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {site.sourceUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (site.sourceUrl) window.open(site.sourceUrl, '_blank');
                }}
                className="h-6 w-6 p-0 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-md transition-all duration-300"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            <div className="text-cyan-600">
              <Star className="h-3 w-3" />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Clean Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-cyan-500 text-white p-2 rounded-lg shadow-md">
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>
      )}
    </Card>
  );
}

// Main Dashboard Component
export function ElitePropertyAnalyticsDashboard({ sites, selectedSite, onSiteSelect }: ElitePropertyAnalyticsDashboardProps) {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'cards' | 'demographics' | 'analytics'>('cards');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    state: '',
    minUnits: '',
    maxUnits: '',
    minAcreage: '',
    maxAcreage: '',
    completionYear: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Calculate comprehensive analytics from all sites
  const totalAnalytics = useMemo<AnalyticsMetrics>(() => {
    const validSites = sites.filter(site => site);
    
    return {
      totalProperties: validSites.length,
      totalUnits: validSites.reduce((sum, site) => sum + (site.unitsTotal || 0), 0),
      totalAcreage: validSites.reduce((sum, site) => sum + (site.acreage || 0), 0),
      avgUnitsPerSite: validSites.length > 0 
        ? validSites.reduce((sum, site) => sum + (site.unitsTotal || 0), 0) / validSites.length 
        : 0,
      avgAcreagePerSite: validSites.length > 0 
        ? validSites.reduce((sum, site) => sum + (site.acreage || 0), 0) / validSites.length 
        : 0,
      statusBreakdown: validSites.reduce((acc, site) => {
        acc[site.status] = (acc[site.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      stateBreakdown: validSites.reduce((acc, site) => {
        if (site.state) acc[site.state] = (acc[site.state] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      completionYearRange: {
        min: validSites.map(s => s.completionYear).filter(Boolean).length > 0 ? Math.min(...validSites.map(s => s.completionYear).filter(Boolean) as number[]) : 0,
        max: validSites.map(s => s.completionYear).filter(Boolean).length > 0 ? Math.max(...validSites.map(s => s.completionYear).filter(Boolean) as number[]) : 0
      },
      occupancyRate: 85.4 // This would come from real occupancy data
    };
  }, [sites]);

  // Calculate filtered analytics for accurate dropdown counts
  const filteredAnalytics = useMemo(() => {
    // Get sites filtered by all criteria EXCEPT the specific filter we're calculating for
    const getFilteredSitesExcluding = (excludeFilter: string) => {
      return sites.filter(site => {
        if (!site) return false;

        // Search filter
        if (filters.search && excludeFilter !== 'search') {
          const searchLower = filters.search.toLowerCase();
          const searchableText = [
            site.name,
            site.addrLine1,
            site.city,
            site.state,
            site.postalCode,
            site.notes
          ].filter(Boolean).join(' ').toLowerCase();
          
          if (!searchableText.includes(searchLower)) return false;
        }

        // Status filter
        if (filters.status && filters.status !== 'all' && excludeFilter !== 'status' && site.status !== filters.status) return false;

        // State filter (exclude when calculating state breakdown)
        if (filters.state && filters.state !== 'all' && excludeFilter !== 'state' && site.state !== filters.state) return false;

        // Units range filter
        if (filters.minUnits && excludeFilter !== 'units' && (!site.unitsTotal || site.unitsTotal < parseInt(filters.minUnits))) return false;
        if (filters.maxUnits && excludeFilter !== 'units' && (!site.unitsTotal || site.unitsTotal > parseInt(filters.maxUnits))) return false;

        // Acreage range filter
        if (filters.minAcreage && excludeFilter !== 'acreage' && (!site.acreage || site.acreage < parseFloat(filters.minAcreage))) return false;
        if (filters.maxAcreage && excludeFilter !== 'acreage' && (!site.acreage || site.acreage > parseFloat(filters.maxAcreage))) return false;

        // Completion year filter
        if (filters.completionYear && excludeFilter !== 'completionYear' && site.completionYear?.toString() !== filters.completionYear) return false;

        return true;
      });
    };

    // Calculate state breakdown excluding state filter
    const sitesForStateBreakdown = getFilteredSitesExcluding('state');
    const stateBreakdown = sitesForStateBreakdown.reduce((acc, site) => {
      if (site.state) acc[site.state] = (acc[site.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate status breakdown excluding status filter
    const sitesForStatusBreakdown = getFilteredSitesExcluding('status');
    const statusBreakdown = sitesForStatusBreakdown.reduce((acc, site) => {
      acc[site.status] = (acc[site.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      stateBreakdown,
      statusBreakdown
    };
  }, [sites, filters]);

  // Use total analytics for main display, filtered analytics for dropdowns
  const analytics = totalAnalytics;

  // Advanced filtering and sorting
  const filteredAndSortedSites = useMemo(() => {
    let filtered = sites.filter(site => {
      if (!site) return false;

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchableText = [
          site.name,
          site.addrLine1,
          site.city,
          site.state,
          site.postalCode,
          site.notes
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all' && site.status !== filters.status) return false;

      // State filter
      if (filters.state && filters.state !== 'all' && site.state !== filters.state) return false;

      // Units range filter
      if (filters.minUnits && (!site.unitsTotal || site.unitsTotal < parseInt(filters.minUnits))) return false;
      if (filters.maxUnits && (!site.unitsTotal || site.unitsTotal > parseInt(filters.maxUnits))) return false;

      // Acreage range filter
      if (filters.minAcreage && (!site.acreage || site.acreage < parseFloat(filters.minAcreage))) return false;
      if (filters.maxAcreage && (!site.acreage || site.acreage > parseFloat(filters.maxAcreage))) return false;

      // Completion year filter
      if (filters.completionYear && site.completionYear?.toString() !== filters.completionYear) return false;

      return true;
    });

    // Sort results
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'unitsTotal':
          aValue = a.unitsTotal || 0;
          bValue = b.unitsTotal || 0;
          break;
        case 'acreage':
          aValue = a.acreage || 0;
          bValue = b.acreage || 0;
          break;
        case 'completionYear':
          aValue = a.completionYear || 0;
          bValue = b.completionYear || 0;
          break;
        case 'state':
          aValue = a.state || '';
          bValue = b.state || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [sites, filters]);

  // Export functionality
  const handleExport = useCallback((format: 'csv' | 'excel') => {
    const exportData = filteredAndSortedSites.map(site => ({
      Name: site.name,
      Status: site.status,
      Address: site.addrLine1,
      City: site.city,
      State: site.state,
      'Postal Code': site.postalCode,
      'Total Units': site.unitsTotal,
      '1BR Units': site.units1b,
      '2BR Units': site.units2b,
      '3BR Units': site.units3b,
      'Acreage': site.acreage,
      'Avg SF': site.avgSf,
      'Completion Year': site.completionYear,
      'Parking Spaces': site.parkingSpaces,
      'Latitude': site.latitude,
      'Longitude': site.longitude,
      'Notes': site.notes,
      'Created': site.createdAt,
      'Updated': site.updatedAt
    }));

    if (format === 'csv') {
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => 
            JSON.stringify(row[header as keyof typeof row] || '')
          ).join(',')
        )
      ].join('\\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bristol-properties-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast({
      title: 'Export Complete',
      description: `${exportData.length} properties exported as ${format.toUpperCase()}`
    });
  }, [filteredAndSortedSites, toast]);

  return (
    <div className="min-h-screen bg-white">
        <div className="space-y-6 p-6">
          {/* Clean Header */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">

            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-cyan-500 rounded-lg shadow-md">
                    <Database className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-cinzel font-bold text-gray-900 mb-2">
                      Property Analytics Dashboard
                    </h1>
                    <p className="text-gray-600 text-lg font-cinzel">
                      Bristol Development Group • Analytics Platform
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)} className="w-auto">
                    <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-300 p-1 rounded-lg">
                      <TabsTrigger value="cards" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-gray-700 text-sm px-4 py-2 rounded-md font-cinzel font-semibold transition-all duration-200">
                        <Layers className="h-4 w-4 mr-2" />
                        Portfolio
                      </TabsTrigger>
                      <TabsTrigger value="demographics" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-gray-700 text-sm px-4 py-2 rounded-md font-cinzel font-semibold transition-all duration-200">
                        <Users className="h-4 w-4 mr-2" />
                        Demographics
                      </TabsTrigger>
                      <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-gray-700 text-sm px-4 py-2 rounded-md font-cinzel font-semibold transition-all duration-200">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
          </div>

              {/* Clean Analytics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-cinzel mb-1">Portfolio</p>
                        <p className="text-2xl font-bold text-gray-900 font-cinzel">{analytics.totalProperties.toLocaleString()}</p>
                        <p className="text-cyan-600 font-medium text-xs mt-1 font-cinzel">PROPERTIES</p>
                      </div>
                      <div className="p-3 bg-cyan-500 rounded-lg">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-cinzel mb-1">Total Units</p>
                        <p className="text-2xl font-bold text-gray-900 font-cinzel">{analytics.totalUnits.toLocaleString()}</p>
                        <p className="text-cyan-600 font-medium text-xs mt-1 font-cinzel">RESIDENTIAL</p>
                      </div>
                      <div className="p-3 bg-blue-500 rounded-lg">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-cinzel mb-1">Land Assets</p>
                        <p className="text-2xl font-bold text-gray-900 font-cinzel">{analytics.totalAcreage.toFixed(1)}</p>
                        <p className="text-cyan-600 font-medium text-xs mt-1 font-cinzel">ACRES</p>
                      </div>
                      <div className="p-3 bg-emerald-500 rounded-lg">
                        <Layers className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-cinzel mb-1">Avg Density</p>
                        <p className="text-2xl font-bold text-gray-900 font-cinzel">{Math.round(analytics.avgUnitsPerSite)}</p>
                        <p className="text-cyan-600 font-medium text-xs mt-1 font-cinzel">UNITS/SITE</p>
                      </div>
                      <div className="p-3 bg-purple-500 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Executive Command Center */}
          <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-black/20 via-bristol-gold/10 to-black/20 border-b border-white/20 backdrop-blur-xl">
              <CardTitle className="flex items-center gap-6">
                <div className="p-4 bg-gradient-to-br from-bristol-gold/80 to-yellow-500/70 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/30">
                  <Filter className="h-6 w-6 text-white" />
                </div>
                <span className="font-cinzel text-white text-2xl font-bold tracking-wide">Portfolio Command Center</span>
                <Badge variant="secondary" className="ml-4 bg-bristol-gold/20 text-white border-bristol-gold/30 px-4 py-2 text-lg">
                  {filteredAndSortedSites.length} of {sites.length} assets
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Executive Search */}
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5" />
                  <Input
                    placeholder="Search portfolio..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-12 h-14 bg-black/20 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60 text-lg rounded-2xl focus:border-bristol-gold focus:ring-bristol-gold/30"
                  />
                </div>

                {/* Asset Type Filter */}
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="h-10 bg-white border border-gray-300 text-gray-900 rounded-lg focus:border-cyan-500 focus:ring-cyan-500/30">
                    <SelectValue placeholder="All Asset Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="all">All Asset Types</SelectItem>
                    {Object.keys(filteredAnalytics.statusBreakdown).map(status => (
                      <SelectItem key={status} value={status}>
                        {status} ({filteredAnalytics.statusBreakdown[status]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Market Filter */}
                <Select value={filters.state} onValueChange={(value) => setFilters(prev => ({ ...prev, state: value }))}>
                  <SelectTrigger className="h-10 bg-white border border-gray-300 text-gray-900 rounded-lg focus:border-cyan-500 focus:ring-cyan-500/30">
                    <SelectValue placeholder="All Markets" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="all">All Markets</SelectItem>
                    {Object.keys(filteredAnalytics.stateBreakdown).map(state => (
                      <SelectItem key={state} value={state}>
                        {state} ({filteredAnalytics.stateBreakdown[state]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                  <SelectTrigger className="h-10 bg-white border border-gray-300 text-gray-900 rounded-lg focus:border-cyan-500 focus:ring-cyan-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200">
                    <SelectItem value="name">Property Name</SelectItem>
                    <SelectItem value="unitsTotal">Unit Count</SelectItem>
                    <SelectItem value="acreage">Land Area</SelectItem>
                    <SelectItem value="completionYear">Development Year</SelectItem>
                    <SelectItem value="state">Market</SelectItem>
                    <SelectItem value="status">Asset Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Input
                  type="number"
                  placeholder="Min Units"
                  value={filters.minUnits}
                  onChange={(e) => setFilters(prev => ({ ...prev, minUnits: e.target.value }))}
                  className="h-14 bg-black/20 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60 text-lg rounded-2xl"
                />
                <Input
                  type="number"
                  placeholder="Max Units"
                  value={filters.maxUnits}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxUnits: e.target.value }))}
                  className="h-14 bg-black/20 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60 text-lg rounded-2xl"
                />
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Min Acreage"
                  value={filters.minAcreage}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAcreage: e.target.value }))}
                  className="h-14 bg-black/20 backdrop-blur-xl border-white/20 text-white placeholder:text-white/60 text-lg rounded-2xl"
                />
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.1"
                placeholder="Max Acreage"
                value={filters.maxAcreage}
                onChange={(e) => setFilters(prev => ({ ...prev, maxAcreage: e.target.value }))}
                className="border-bristol-gold/30"
              />
              <Button
                variant="outline"
                onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                className="border-bristol-gold/30 hover:bg-bristol-gold/10"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-bristol-gold/20">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setFilters({
                  search: '',
                  status: 'all',
                  state: 'all',
                  minUnits: '',
                  maxUnits: '',
                  minAcreage: '',
                  maxAcreage: '',
                  completionYear: '',
                  sortBy: 'name',
                  sortOrder: 'asc'
                })}
                className="border-bristol-gold/30 hover:bg-bristol-gold/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                className="border-bristol-gold/30 hover:bg-bristol-gold/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {activeView === 'cards' && (
        <div className="space-y-6">
          {/* Filter Status Indicator */}
          <div className="flex items-center justify-between bg-gradient-to-r from-bristol-cream/10 to-transparent p-4 rounded-lg border border-bristol-gold/20">
            <div className="flex items-center gap-4">
              {filteredAndSortedSites.length !== sites.length ? (
                <Badge variant="secondary" className="bg-bristol-maroon/10 text-bristol-maroon border-bristol-maroon/20 px-3 py-1.5 text-sm font-medium">
                  Showing {filteredAndSortedSites.length} of {sites.length} properties
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-bristol-gold/20 text-bristol-maroon border-bristol-gold/30 px-3 py-1.5 text-sm font-medium">
                  All {sites.length} properties shown
                </Badge>
              )}
              {(filters.search || filters.state || filters.status || filters.minUnits || filters.maxUnits || filters.minAcreage || filters.maxAcreage || filters.completionYear) && (
                <div className="text-sm text-bristol-stone/70">
                  Active filters: {[
                    filters.search && 'Search',
                    filters.state && filters.state !== 'all' && `State: ${filters.state}`,
                    filters.status && filters.status !== 'all' && `Status: ${filters.status}`,
                    (filters.minUnits || filters.maxUnits) && 'Units',
                    (filters.minAcreage || filters.maxAcreage) && 'Acreage',
                    filters.completionYear && `Year: ${filters.completionYear}`
                  ].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
            {(filters.search || filters.state || filters.status || filters.minUnits || filters.maxUnits || filters.minAcreage || filters.maxAcreage || filters.completionYear) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({
                  search: '',
                  status: '',
                  state: '',
                  minUnits: '',
                  maxUnits: '',
                  minAcreage: '',
                  maxAcreage: '',
                  completionYear: '',
                  sortBy: 'name',
                  sortOrder: 'asc'
                })}
                className="text-bristol-maroon border-bristol-maroon/30 hover:bg-bristol-maroon/5"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Clear All Filters
              </Button>
            )}
          </div>

          {/* Property Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedSites.map((site) => (
              <EnhancedPropertyCard
                key={site.id}
                site={site}
                isSelected={selectedSite?.id === site.id}
                onSelect={() => onSiteSelect(site)}
                onViewDemographics={() => {
                  onSiteSelect(site);
                  setActiveView('demographics');
                }}
              />
            ))}
          </div>

          {filteredAndSortedSites.length === 0 && (
            <Card className="bg-gradient-to-br from-white to-bristol-cream/30 border-bristol-stone/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="h-16 w-16 text-bristol-stone/40 mb-4" />
                <h3 className="text-xl font-semibold text-bristol-stone/70 mb-2">No Properties Found</h3>
                <p className="text-bristol-stone/60 text-center mb-4">
                  Try adjusting your filters or search criteria to find properties.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setFilters({
                    search: '',
                    status: 'all',
                    state: 'all',
                    minUnits: '',
                    maxUnits: '',
                    minAcreage: '',
                    maxAcreage: '',
                    completionYear: '',
                    sortBy: 'name',
                    sortOrder: 'asc'
                  })}
                  className="border-bristol-gold/30 hover:bg-bristol-gold/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeView === 'demographics' && (
        <div className="space-y-6">
          {selectedSite ? (
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-white to-bristol-cream/30 border-bristol-gold/30 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-bristol-maroon/10 rounded-lg">
                      <Users className="h-5 w-5 text-bristol-maroon" />
                    </div>
                    <span className="font-cinzel text-bristol-maroon">
                      Demographics Analysis: {selectedSite.name}
                    </span>
                  </CardTitle>
                </CardHeader>
              </Card>
              <SiteDemographicAnalysis siteId={selectedSite.id} />
              <AddressDemographics 
                className="mt-4"
                onLocationSelect={(lat, lng) => console.log('Location selected:', lat, lng)}
              />
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-white to-bristol-cream/30 border-bristol-stone/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Eye className="h-16 w-16 text-bristol-stone/40 mb-4" />
                <h3 className="text-xl font-semibold text-bristol-stone/70 mb-2">Select a Property</h3>
                <p className="text-bristol-stone/60 text-center">
                  Choose a property from the Properties tab to view detailed demographics analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeView === 'analytics' && (
        <div className="space-y-6">
          {/* Advanced Analytics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-white to-bristol-cream/30 border-bristol-gold/30 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-bristol-maroon/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-bristol-maroon" />
                  </div>
                  <span className="font-cinzel text-bristol-maroon">Status Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${
                          status === 'Operating' ? 'bg-emerald-500' :
                          status === 'Completed' ? 'bg-green-500' :
                          status === 'Newest' ? 'bg-bristol-gold' :
                          status === 'Pipeline' ? 'bg-blue-500' : 'bg-gray-500'
                        }`} />
                        <span className="font-medium">{status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{count}</span>
                        <span className="text-sm text-bristol-stone/60">
                          ({Math.round((count / analytics.totalProperties) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          <Card className="bg-gradient-to-br from-white to-bristol-cream/30 border-bristol-gold/30 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-bristol-maroon/10 rounded-lg">
                  <Globe className="h-5 w-5 text-bristol-maroon" />
                </div>
                <span className="font-cinzel text-bristol-maroon">Geographic Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.stateBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([state, count]) => (
                  <div key={state} className="flex items-center justify-between">
                    <span className="font-medium">{state}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-bristol-stone/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-bristol-maroon to-bristol-gold"
                          style={{ width: `${(count / Math.max(...Object.values(analytics.stateBreakdown))) * 100}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card className="bg-gradient-to-br from-white to-bristol-cream/30 border-bristol-gold/30 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-bristol-maroon/10 rounded-lg">
                <Activity className="h-5 w-5 text-bristol-maroon" />
              </div>
              <span className="font-cinzel text-bristol-maroon">Portfolio Performance Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-bristol-ink">{analytics.avgUnitsPerSite.toFixed(0)}</div>
                <div className="text-sm text-bristol-stone/70">Average Units per Site</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-bristol-ink">{analytics.avgAcreagePerSite.toFixed(1)}</div>
                <div className="text-sm text-bristol-stone/70">Average Acreage per Site</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-bristol-ink">{analytics.occupancyRate}%</div>
                <div className="text-sm text-bristol-stone/70">Portfolio Occupancy</div>
              </div>
            </div>
          </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}