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

// Enhanced Property Card Component with Ambient Glows
function EnhancedPropertyCard({ site, isSelected, onSelect, onViewDemographics }: PropertyCard) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operating': return 'from-emerald-500/40 to-green-600/40';
      case 'Completed': return 'from-green-500/40 to-emerald-600/40'; 
      case 'Newest': return 'from-bristol-gold/40 to-yellow-500/40';
      case 'Pipeline': return 'from-blue-500/40 to-purple-600/40';
      default: return 'from-gray-500/40 to-slate-600/40';
    }
  };

  const getStatusGlow = (status: string) => {
    switch (status) {
      case 'Operating': return 'shadow-emerald-500/30';
      case 'Completed': return 'shadow-green-500/30';
      case 'Newest': return 'shadow-bristol-gold/40';
      case 'Pipeline': return 'shadow-blue-500/30';
      default: return 'shadow-gray-500/20';
    }
  };

  return (
    <Card 
      className={`
        relative overflow-hidden transition-all duration-700 cursor-pointer group backdrop-blur-xl border
        ${isSelected 
          ? 'border-bristol-gold/60 shadow-2xl shadow-bristol-gold/40 bg-white/15' 
          : 'border-white/20 hover:border-bristol-gold/40 bg-white/10 hover:shadow-2xl hover:shadow-white/10'
        }
        ${isHovered ? 'scale-[1.03] shadow-3xl' : 'hover:scale-[1.02]'}
        rounded-3xl
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Premium Glass Morphism Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getStatusColor(site.status)} opacity-0 group-hover:opacity-100 transition-all duration-700`} />
      
      {/* Executive Glow Effect */}
      <div className={`absolute -inset-0.5 rounded-3xl bg-gradient-to-br ${getStatusColor(site.status)} opacity-0 group-hover:opacity-50 blur-xl transition-all duration-1000 ${getStatusGlow(site.status)}`} />
      
      <CardHeader className="relative z-20 pb-6">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <CardTitle className="text-2xl font-cinzel font-bold text-white group-hover:text-bristol-gold transition-colors duration-500 tracking-wide">
              {site.name}
            </CardTitle>
            <Badge 
              className={`
                relative font-bold text-sm px-4 py-2 rounded-2xl shadow-2xl transition-all duration-500
                bg-gradient-to-r ${getStatusColor(site.status)} text-white border border-white/30 backdrop-blur-xl
                ${getStatusGlow(site.status)} group-hover:shadow-2xl group-hover:scale-105
              `}
            >
              <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10">{site.status}</span>
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDemographics();
              }}
              className="text-white/80 hover:text-white hover:bg-gradient-to-r hover:from-bristol-gold/40 hover:to-yellow-500/40 hover:shadow-xl backdrop-blur-xl border border-white/20 rounded-xl px-4 py-2 transition-all duration-500"
            >
              <Eye className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            {site.latitude && site.longitude && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/40 hover:to-purple-600/40 hover:shadow-xl backdrop-blur-xl border border-white/20 rounded-xl p-2 transition-all duration-500"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-20 space-y-6 p-8">
        {/* Premium Location Info */}
        <div className="space-y-3">
          <div className="flex items-center text-white/80 group-hover:text-white transition-colors duration-500">
            <MapPin className="h-5 w-5 mr-3 text-bristol-gold" />
            <span className="font-medium text-lg">
              {site.addrLine1 && `${site.addrLine1}, `}{site.city}, {site.state} {site.postalCode}
            </span>
          </div>
          {site.country && site.country !== 'USA' && (
            <div className="text-base text-white/60">{site.country}</div>
          )}
        </div>

        {/* Executive Metrics Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Units */}
          <div className="space-y-2">
            <div className="flex items-center text-white/60 text-base">
              <Building2 className="h-5 w-5 mr-2" />
              <span>Total Units</span>
            </div>
            <div className="text-3xl font-bold text-white group-hover:text-bristol-gold transition-colors duration-500 tracking-tight">
              {site.unitsTotal?.toLocaleString() || 'TBD'}
            </div>
            {site.units1b || site.units2b || site.units3b ? (
              <div className="text-xs text-bristol-stone/60 space-x-2">
                {site.units1b && <span>1BR: {site.units1b}</span>}
                {site.units2b && <span>2BR: {site.units2b}</span>}
                {site.units3b && <span>3BR: {site.units3b}</span>}
              </div>
            ) : null}
          </div>

          {/* Acreage */}
          <div className="space-y-2">
            <div className="flex items-center text-white/60 text-base">
              <Layers className="h-5 w-5 mr-2" />
              <span>Acreage</span>
            </div>
            <div className="text-3xl font-bold text-white group-hover:text-bristol-gold transition-colors duration-500 tracking-tight">
              {site.acreage ? `${site.acreage}` : 'TBD'}
            </div>
            {site.acreage && site.unitsTotal && (
              <div className="text-xs text-bristol-stone/60">
                {Math.round((site.unitsTotal / site.acreage) * 10) / 10} units/acre
              </div>
            )}
          </div>

          {/* Completion Year */}
          {site.completionYear && (
            <div className="space-y-2">
              <div className="flex items-center text-white/60 text-base">
                <Calendar className="h-5 w-5 mr-2" />
                <span>Completed</span>
              </div>
              <div className="text-2xl font-bold text-white group-hover:text-bristol-gold transition-colors duration-500 tracking-tight">
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

        {/* Premium Details */}
        {site.parkingSpaces && (
          <div className="flex items-center text-base text-white/70">
            <div className="w-3 h-3 bg-bristol-gold rounded-full mr-3 shadow-lg shadow-bristol-gold/50"></div>
            <span>{site.parkingSpaces.toLocaleString()} parking spaces</span>
            {site.unitsTotal && (
              <span className="ml-2 text-bristol-gold">({(site.parkingSpaces / site.unitsTotal).toFixed(1)} per unit)</span>
            )}
          </div>
        )}

        {site.notes && (
          <div className="text-sm text-white/60 bg-black/20 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            {site.notes.length > 100 ? `${site.notes.substring(0, 100)}...` : site.notes}
          </div>
        )}

        {/* Executive Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center text-sm text-white/50">
              <Clock className="h-4 w-4 mr-2" />
              Updated {site.updatedAt ? new Date(site.updatedAt).toLocaleDateString() : 'N/A'}
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
                className="h-8 w-8 p-0 text-bristol-gold hover:text-white hover:bg-bristol-gold/20 rounded-xl transition-all duration-300"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <div className="text-bristol-gold">
              <Star className="h-4 w-4 drop-shadow-lg" />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Premium Selection Indicator */}
      {isSelected && (
        <div className="absolute top-6 right-6 z-30">
          <div className="bg-gradient-to-r from-bristol-gold to-yellow-500 text-black p-3 rounded-2xl shadow-2xl shadow-bristol-gold/60 backdrop-blur-xl border border-white/30">
            <CheckCircle className="h-6 w-6" />
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
    <div className="min-h-screen relative">
      {/* Fortune 500 Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url('/src/assets/Icon+1_1755370919284.webp')`
        }}
      />
      
      {/* Enterprise Glass Overlay */}
      <div className="relative z-10 min-h-screen backdrop-blur-sm">
        <div className="space-y-8 p-8">
          {/* Executive Header */}
          <div className="relative backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            {/* Premium Glass Morphism */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-bristol-gold/10 to-white/5" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />

            <div className="relative z-20 p-12">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-8">
                  <div className="p-6 bg-gradient-to-br from-bristol-gold/90 via-yellow-500/80 to-bristol-gold/90 rounded-3xl shadow-2xl shadow-bristol-gold/50 backdrop-blur-xl border border-white/30">
                    <Database className="h-12 w-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-6xl font-cinzel font-bold text-white mb-3 tracking-wide">
                      Elite Property Intelligence
                    </h1>
                    <p className="text-white/80 text-2xl font-light tracking-wide">
                      Bristol Development Group • Fortune 500 Analytics Platform
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)} className="w-auto">
                    <TabsList className="grid w-full grid-cols-3 bg-black/30 backdrop-blur-xl border border-white/20 p-2 rounded-2xl">
                      <TabsTrigger value="cards" className="data-[state=active]:bg-bristol-gold data-[state=active]:text-black text-white/80 text-lg px-6 py-3 rounded-xl font-medium transition-all">
                        <Layers className="h-5 w-5 mr-3" />
                        Portfolio
                      </TabsTrigger>
                      <TabsTrigger value="demographics" className="data-[state=active]:bg-bristol-gold data-[state=active]:text-black text-white/80 text-lg px-6 py-3 rounded-xl font-medium transition-all">
                        <Users className="h-5 w-5 mr-3" />
                        Demographics
                      </TabsTrigger>
                      <TabsTrigger value="analytics" className="data-[state=active]:bg-bristol-gold data-[state=active]:text-black text-white/80 text-lg px-6 py-3 rounded-xl font-medium transition-all">
                        <BarChart3 className="h-5 w-5 mr-3" />
                        Analytics
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
          </div>

              {/* Executive Analytics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8">
                <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-2xl overflow-hidden group">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-lg font-light mb-2">Portfolio</p>
                        <p className="text-4xl font-bold text-white tracking-tight">{analytics.totalProperties.toLocaleString()}</p>
                        <p className="text-bristol-gold font-medium text-sm mt-1">PROPERTIES</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-bristol-gold/40 to-yellow-500/30 rounded-2xl backdrop-blur-sm border border-white/20">
                        <Building2 className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-2xl overflow-hidden group">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-lg font-light mb-2">Total Units</p>
                        <p className="text-4xl font-bold text-white tracking-tight">{analytics.totalUnits.toLocaleString()}</p>
                        <p className="text-bristol-gold font-medium text-sm mt-1">RESIDENTIAL</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-blue-500/40 to-purple-600/30 rounded-2xl backdrop-blur-sm border border-white/20">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-2xl overflow-hidden group">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-lg font-light mb-2">Land Assets</p>
                        <p className="text-4xl font-bold text-white tracking-tight">{analytics.totalAcreage.toFixed(1)}</p>
                        <p className="text-bristol-gold font-medium text-sm mt-1">ACRES</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-bristol-gold/40 to-yellow-500/30 rounded-2xl backdrop-blur-sm border border-white/20">
                        <Layers className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-2xl overflow-hidden group">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-lg font-light mb-2">Avg Density</p>
                        <p className="text-4xl font-bold text-white tracking-tight">{Math.round(analytics.avgUnitsPerSite)}</p>
                        <p className="text-bristol-gold font-medium text-sm mt-1">UNITS/SITE</p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-purple-500/40 to-pink-600/30 rounded-2xl backdrop-blur-sm border border-white/20">
                        <TrendingUp className="h-8 w-8 text-white" />
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
                  <SelectTrigger className="h-14 bg-black/20 backdrop-blur-xl border-white/20 text-white text-lg rounded-2xl">
                    <SelectValue placeholder="All Asset Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 backdrop-blur-xl border-white/20 text-white">
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
                  <SelectTrigger className="h-14 bg-black/20 backdrop-blur-xl border-white/20 text-white text-lg rounded-2xl">
                    <SelectValue placeholder="All Markets" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 backdrop-blur-xl border-white/20 text-white">
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
                  <SelectTrigger className="h-14 bg-black/20 backdrop-blur-xl border-white/20 text-white text-lg rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 backdrop-blur-xl border-white/20 text-white">
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
    </div>
  );
}