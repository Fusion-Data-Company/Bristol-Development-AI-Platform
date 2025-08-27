import React, { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Users, 
  Calendar,
  Search,
  TrendingUp,
  Home,
  BarChart3,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Site {
  id: string;
  name: string;
  addrLine1: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  status: string;
  unitsTotal: number;
  units1b?: number;
  units2b?: number;
  units3b?: number;
  avgSf?: number;
  completionYear?: number;
  acreage?: number;
  parkingSpaces?: number;
  acsProfile?: {
    population?: number;
    median_income?: number;
    median_rent?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ElitePropertyAnalyticsDashboardProps {
  sites: Site[];
  selectedSite?: Site | null;
  onSiteSelect?: (site: Site | null) => void;
}

export function ElitePropertyAnalyticsDashboard({ 
  sites, 
  selectedSite, 
  onSiteSelect 
}: ElitePropertyAnalyticsDashboardProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const validSites = sites.filter(site => site);
    const totalUnits = validSites.reduce((sum, site) => sum + (site.unitsTotal || 0), 0);
    const totalAcreage = validSites.reduce((sum, site) => sum + (site.acreage || 0), 0);
    
    const statusCounts = validSites.reduce((acc, site) => {
      acc[site.status] = (acc[site.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stateCounts = validSites.reduce((acc, site) => {
      if (site.state) acc[site.state] = (acc[site.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProperties: validSites.length,
      totalUnits,
      totalAcreage: Math.round(totalAcreage * 100) / 100,
      avgUnitsPerProperty: validSites.length > 0 ? Math.round(totalUnits / validSites.length) : 0,
      avgCompletionYear: validSites.length > 0 ? 
        Math.round(validSites.reduce((sum, site) => sum + (site.completionYear || 2020), 0) / validSites.length) : 0,
      statusCounts,
      stateCounts
    };
  }, [sites]);

  // Filter and paginate sites
  const filteredSites = useMemo(() => {
    return sites.filter(site => {
      const matchesSearch = !searchTerm || 
        site.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.addrLine1?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || site.status === statusFilter;
      const matchesState = stateFilter === 'all' || site.state === stateFilter;
      
      return matchesSearch && matchesStatus && matchesState;
    });
  }, [sites, searchTerm, statusFilter, stateFilter]);

  const paginatedSites = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSites.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSites, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSites.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'operating': return 'bg-green-100 text-green-800 border-green-200';
      case 'development': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              Company Property Analytics
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive portfolio analysis and property insights</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Portfolio Overview</div>
            <div className="text-lg font-bold text-gray-900">{portfolioMetrics.totalProperties} Properties</div>
          </div>
        </div>

        {/* Portfolio Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Home className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{portfolioMetrics.totalProperties}</div>
                  <div className="text-sm text-gray-600">Total Properties</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{portfolioMetrics.totalUnits.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Units</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{portfolioMetrics.totalAcreage}</div>
                  <div className="text-sm text-gray-600">Total Acres</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{portfolioMetrics.avgUnitsPerProperty}</div>
                  <div className="text-sm text-gray-600">Avg Units/Property</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 min-w-[250px]">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by property name, city, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] border-gray-300">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.keys(portfolioMetrics.statusCounts).map(status => (
                <SelectItem key={status} value={status}>
                  {status} ({portfolioMetrics.statusCounts[status]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[140px] border-gray-300">
              <SelectValue placeholder="Filter by State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {Object.keys(portfolioMetrics.stateCounts).map(state => (
                <SelectItem key={state} value={state}>
                  {state} ({portfolioMetrics.stateCounts[state]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchTerm || statusFilter !== 'all' || stateFilter !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setStateFilter('all');
                setCurrentPage(1);
              }}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {paginatedSites.length} of {filteredSites.length} properties
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-left font-semibold text-gray-900">Property</TableHead>
              <TableHead className="text-left font-semibold text-gray-900">Location</TableHead>
              <TableHead className="text-center font-semibold text-gray-900">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-900">Units</TableHead>
              <TableHead className="text-right font-semibold text-gray-900">Avg SF</TableHead>
              <TableHead className="text-right font-semibold text-gray-900">Year Built</TableHead>
              <TableHead className="text-right font-semibold text-gray-900">Market Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSites.map((site) => (
              <TableRow 
                key={site.id} 
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedSite?.id === site.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => onSiteSelect?.(site)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{site.name}</div>
                      <div className="text-sm text-gray-500">{site.addrLine1}</div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-gray-900">{site.city}, {site.state}</div>
                      <div className="text-sm text-gray-500">{site.postalCode}</div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <Badge className={getStatusColor(site.status)}>
                    {site.status}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <div className="text-gray-900 font-medium">{site.unitsTotal?.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">
                    {site.units1b && `${site.units1b} • 1BR`}
                    {site.units2b && ` | ${site.units2b} • 2BR`}
                    {site.units3b && ` | ${site.units3b} • 3BR`}
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <div className="text-gray-900">{site.avgSf?.toLocaleString() || '—'}</div>
                  <div className="text-sm text-gray-500">sq ft</div>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{site.completionYear || '—'}</span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  {site.acsProfile ? (
                    <div className="text-sm">
                      <div className="text-gray-900 font-medium">
                        {formatCurrency(site.acsProfile.median_income)}
                      </div>
                      <div className="text-gray-500">
                        Rent: {formatCurrency(site.acsProfile.median_rent)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="border-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="border-gray-300"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-sm text-gray-500">
          Your Company Name • Property Analytics Dashboard
        </div>
      </div>
    </div>
  );
}