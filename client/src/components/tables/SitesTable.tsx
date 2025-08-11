import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  TrendingUp, 
  Edit, 
  Trash2, 
  Search,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { type Site } from '@shared/schema';
import { format } from 'date-fns';

interface SitesTableProps {
  sites: Site[];
  onSiteSelect?: (site: Site) => void;
  onSiteEdit?: (site: Site) => void;
  onSiteDelete?: (site: Site) => void;
  loading?: boolean;
}

export function SitesTable({ 
  sites, 
  onSiteSelect, 
  onSiteEdit, 
  onSiteDelete,
  loading = false 
}: SitesTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Site>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter sites based on search
  const filteredSites = sites.filter(site => {
    const query = searchQuery.toLowerCase();
    return (
      site.name.toLowerCase().includes(query) ||
      site.address?.toLowerCase().includes(query) ||
      site.city?.toLowerCase().includes(query) ||
      site.state?.toLowerCase().includes(query)
    );
  });

  // Sort sites
  const sortedSites = [...filteredSites].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: keyof Site) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sites by name, address, city, or state..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Site Name
                  {sortField === 'name' && (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Location</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('bristolScore')}
              >
                <div className="flex items-center gap-1">
                  Bristol Score
                  {sortField === 'bristolScore' && (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortField === 'status' && (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Acreage</TableHead>
              <TableHead>Zoning</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                  Added
                  {sortField === 'createdAt' && (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-bristol-maroon"></div>
                    Loading sites...
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedSites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No sites found matching your search.' : 'No sites added yet.'}
                </TableCell>
              </TableRow>
            ) : (
              sortedSites.map((site) => (
                <TableRow 
                  key={site.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSiteSelect?.(site)}
                >
                  <TableCell className="font-medium">{site.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {site.city}, {site.state}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`h-4 w-4 ${getScoreColor(site.bristolScore)}`} />
                      <span className={`font-semibold ${getScoreColor(site.bristolScore)}`}>
                        {site.bristolScore || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(site.status)}`} />
                      {site.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{site.acreage ? `${site.acreage} acres` : 'N/A'}</TableCell>
                  <TableCell>{site.zoning || 'N/A'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(site.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSiteEdit?.(site);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSiteDelete?.(site);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedSites.length} of {sites.length} sites
      </div>
    </div>
  );
}