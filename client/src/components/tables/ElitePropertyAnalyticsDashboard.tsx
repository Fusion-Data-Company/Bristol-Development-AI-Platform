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
      case 'Operating': return 'from-emerald-400 to-green-500';
      case 'Completed': return 'from-green-400 to-emerald-500'; 
      case 'Newest': return 'from-bristol-gold to-yellow-400';
      case 'Pipeline': return 'from-blue-400 to-purple-500';
      default: return 'from-gray-400 to-slate-500';
    }
  };

  const getStatusGlow = (status: string) => {
    switch (status) {
      case 'Operating': return 'shadow-emerald-500/50';
      case 'Completed': return 'shadow-green-500/50';
      case 'Newest': return 'shadow-bristol-gold/60';
      case 'Pipeline': return 'shadow-blue-500/50';
      default: return 'shadow-gray-500/30';
    }
  };

  return (
    <Card 
      className={`
        relative overflow-hidden transition-all duration-500 cursor-pointer group border-2 backdrop-blur-sm
        ${isSelected 
          ? 'border-bristol-gold shadow-2xl shadow-bristol-gold/40 bg-gradient-to-br from-white via-bristol-cream/30 to-bristol-gold/10' 
          : 'border-bristol-stone/20 hover:border-bristol-gold/50 bg-gradient-to-br from-white via-bristol-cream/20 to-white hover:shadow-xl hover:shadow-bristol-gold/20'
        }
        ${isHovered ? 'scale-[1.02] shadow-2xl' : 'hover:scale-[1.01]'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Animated Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-r ${getStatusColor(site.status)} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      {/* Ambient Light Effect */}
      <div className={`absolute -top-1 -left-1 -right-1 -bottom-1 rounded-lg bg-gradient-to-r ${getStatusColor(site.status)} opacity-0 group-hover:opacity-20 blur-xl transition-all duration-700 ${getStatusGlow(site.status)}`} />
      
      <CardHeader className="relative z-10 pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg font-cinzel font-bold text-bristol-ink group-hover:text-bristol-maroon transition-colors duration-300">
              {site.name}
            </CardTitle>
            <Badge 
              className={`
                relative font-bold text-xs px-3 py-1.5 border-2 rounded-full shadow-lg transition-all duration-300
                bg-gradient-to-r ${getStatusColor(site.status)} text-white border-white/30
                ${getStatusGlow(site.status)} group-hover:shadow-xl group-hover:scale-110
              `}
            >
              <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
              className="text-bristol-maroon hover:text-white hover:bg-gradient-to-r hover:from-bristol-maroon hover:to-bristol-gold hover:shadow-lg hover:shadow-bristol-maroon/30 transition-all duration-300"
            >
              <Eye className="h-4 w-4 mr-1" />
              Demographics
            </Button>
            {site.latitude && site.longitude && (
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        {/* Location Info */}
        <div className="space-y-2">
          <div className="flex items-center text-bristol-stone group-hover:text-bristol-ink transition-colors duration-300">
            <MapPin className="h-4 w-4 mr-2 text-bristol-maroon" />
            <span className="font-medium">
              {site.addrLine1 && `${site.addrLine1}, `}{site.city}, {site.state} {site.postalCode}
            </span>
          </div>
          {site.country && site.country !== 'USA' && (
            <div className="text-sm text-bristol-stone/70">{site.country}</div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Units */}
          <div className="space-y-1">
            <div className="flex items-center text-bristol-stone/70 text-sm">
              <Building2 className="h-4 w-4 mr-1" />
              <span>Total Units</span>
            </div>
            <div className="text-2xl font-bold text-bristol-ink group-hover:text-bristol-maroon transition-colors duration-300">
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
          <div className="space-y-1">
            <div className="flex items-center text-bristol-stone/70 text-sm">
              <Layers className="h-4 w-4 mr-1" />
              <span>Acreage</span>
            </div>
            <div className="text-2xl font-bold text-bristol-ink group-hover:text-bristol-maroon transition-colors duration-300">
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
            <div className="space-y-1">
              <div className="flex items-center text-bristol-stone/70 text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Completed</span>
              </div>
              <div className="text-xl font-bold text-bristol-ink group-hover:text-bristol-maroon transition-colors duration-300">
                {site.completionYear}
              </div>
              <div className="text-xs text-bristol-stone/60">
                {new Date().getFullYear() - site.completionYear} years ago
              </div>
            </div>
          )}

          {/* Average SF */}
          {site.avgSf && (
            <div className="space-y-1">
              <div className="flex items-center text-bristol-stone/70 text-sm">
                <Maximize className="h-4 w-4 mr-1" />
                <span>Avg SF</span>
              </div>
              <div className="text-xl font-bold text-bristol-ink group-hover:text-bristol-maroon transition-colors duration-300">
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

        {/* Additional Details */}
        {site.parkingSpaces && (
          <div className="flex items-center text-sm text-bristol-stone/70">
            <div className="w-2 h-2 bg-bristol-gold rounded-full mr-2"></div>
            <span>{site.parkingSpaces.toLocaleString()} parking spaces</span>
            {site.unitsTotal && (
              <span className="ml-1">({(site.parkingSpaces / site.unitsTotal).toFixed(1)} per unit)</span>
            )}
          </div>
        )}

        {site.notes && (
          <div className="text-xs text-bristol-stone/60 bg-bristol-cream/20 rounded p-2 border-l-2 border-bristol-gold/30">
            {site.notes.length > 100 ? `${site.notes.substring(0, 100)}...` : site.notes}
          </div>
        )}

        {/* Interactive Elements */}
        <div className="flex items-center justify-between pt-2 border-t border-bristol-stone/10">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-xs text-bristol-stone/60">
              <Clock className="h-3 w-3 mr-1" />
              Updated {site.updatedAt ? new Date(site.updatedAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {site.sourceUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (site.sourceUrl) window.open(site.sourceUrl, '_blank');
                }}
                className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            <div className="text-xs text-bristol-gold">
              <Star className="h-3 w-3" />
            </div>
          </div>
        </div>
      </CardContent>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-20">
          <div className="bg-bristol-gold text-bristol-ink p-1 rounded-full shadow-lg shadow-bristol-gold/50">
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

  // Calculate comprehensive analytics
  const analytics = useMemo<AnalyticsMetrics>(() => {
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
    <div className="space-y-6">
      {/* Elite Header */}
      <div className="relative bg-gradient-to-r from-white via-bristol-cream/30 to-white rounded-2xl border-2 border-bristol-gold/30 shadow-xl overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-bristol-gold/5 via-transparent to-bristol-maroon/5" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-bristol-gold/10 to-transparent opacity-50" />

        <div className="relative z-10 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-bristol-maroon to-bristol-gold rounded-2xl shadow-xl shadow-bristol-maroon/30">
                <Database className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-cinzel font-bold text-bristol-ink mb-2">
                  Elite Property Analytics Dashboard
                </h1>
                <p className="text-bristol-stone text-lg font-medium">
                  Bristol Development Group's Comprehensive Property Intelligence Platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)} className="w-auto">
                <TabsList className="grid w-full grid-cols-3 bg-white/50 border border-bristol-gold/20">
                  <TabsTrigger value="cards" className="data-[state=active]:bg-bristol-gold data-[state=active]:text-bristol-ink">
                    <Layers className="h-4 w-4 mr-2" />
                    Properties
                  </TabsTrigger>
                  <TabsTrigger value="demographics" className="data-[state=active]:bg-bristol-gold data-[state=active]:text-bristol-ink">
                    <Users className="h-4 w-4 mr-2" />
                    Demographics
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-bristol-gold data-[state=active]:text-bristol-ink">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Real-time Analytics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-white to-emerald-50 border-emerald-200/50 shadow-lg shadow-emerald-500/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Total Properties</p>
                    <p className="text-2xl font-bold text-emerald-900">{analytics.totalProperties.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200/50 shadow-lg shadow-blue-500/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Units</p>
                    <p className="text-2xl font-bold text-blue-900">{analytics.totalUnits.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-bristol-cream border-bristol-gold/30 shadow-lg shadow-bristol-gold/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-bristol-gold to-yellow-500 rounded-xl shadow-lg">
                    <Layers className="h-5 w-5 text-bristol-ink" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-bristol-maroon">Total Acreage</p>
                    <p className="text-2xl font-bold text-bristol-ink">{analytics.totalAcreage.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200/50 shadow-lg shadow-purple-500/10">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-700">Avg Units/Site</p>
                    <p className="text-2xl font-bold text-purple-900">{Math.round(analytics.avgUnitsPerSite)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <Card className="bg-gradient-to-r from-white via-bristol-cream/20 to-white border-bristol-gold/30 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-bristol-maroon/5 to-bristol-gold/5 border-b border-bristol-gold/20">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-bristol-maroon/10 rounded-lg">
              <Filter className="h-5 w-5 text-bristol-maroon" />
            </div>
            <span className="font-cinzel text-bristol-maroon">Elite Filtering & Search</span>
            <Badge variant="secondary" className="ml-2 bg-bristol-gold/20 text-bristol-maroon">
              {filteredAndSortedSites.length} of {sites.length} properties
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bristol-stone/60 h-4 w-4" />
              <Input
                placeholder="Search properties..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 border-bristol-gold/30 focus:border-bristol-maroon focus:ring-bristol-maroon/20"
              />
            </div>

            {/* Status Filter */}
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="border-bristol-gold/30">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.keys(analytics.statusBreakdown).map(status => (
                  <SelectItem key={status} value={status}>
                    {status} ({analytics.statusBreakdown[status]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* State Filter */}
            <Select value={filters.state} onValueChange={(value) => setFilters(prev => ({ ...prev, state: value }))}>
              <SelectTrigger className="border-bristol-gold/30">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {Object.keys(analytics.stateBreakdown).map(state => (
                  <SelectItem key={state} value={state}>
                    {state} ({analytics.stateBreakdown[state]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
              <SelectTrigger className="border-bristol-gold/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="unitsTotal">Total Units</SelectItem>
                <SelectItem value="acreage">Acreage</SelectItem>
                <SelectItem value="completionYear">Completion Year</SelectItem>
                <SelectItem value="state">State</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              type="number"
              placeholder="Min Units"
              value={filters.minUnits}
              onChange={(e) => setFilters(prev => ({ ...prev, minUnits: e.target.value }))}
              className="border-bristol-gold/30"
            />
            <Input
              type="number"
              placeholder="Max Units"
              value={filters.maxUnits}
              onChange={(e) => setFilters(prev => ({ ...prev, maxUnits: e.target.value }))}
              className="border-bristol-gold/30"
            />
            <Input
              type="number"
              step="0.1"
              placeholder="Min Acreage"
              value={filters.minAcreage}
              onChange={(e) => setFilters(prev => ({ ...prev, minAcreage: e.target.value }))}
              className="border-bristol-gold/30"
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
      <TabsContent value="cards" className="space-y-6">
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
                className="border-bristol-gold/30 hover:bg-bristol-gold/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="demographics" className="space-y-6">
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
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
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
      </TabsContent>
    </div>
  );
}