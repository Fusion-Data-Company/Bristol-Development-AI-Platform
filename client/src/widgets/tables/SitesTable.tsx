import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Edit, Trash2, MapPin, ExternalLink, Loader2, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Site } from '@shared/schema';

interface SitesTableProps {
  data: Site[];
  isLoading: boolean;
  onSelectSite: (site: Site | null) => void;
  selectedSite: Site | null;
  onRefresh: () => void;
}

export function SitesTable({ data, isLoading, onSelectSite, selectedSite, onRefresh }: SitesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ siteId, updateData }: { siteId: string; updateData: any }) => {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error('Update failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sites'] });
      onRefresh();
      setEditingCell(null);
      toast({ title: "Site Updated", description: "Site has been updated" });
    },
    onError: () => {
      toast({ title: "Update Failed", description: "Failed to update site", variant: "destructive" });
    },
  });

  const handleCellEdit = async (site: Site, field: string, value: any) => {
    const updateData: any = {};
    
    // Parse value based on field type
    if (['latitude', 'longitude', 'acreage', 'avgSf'].includes(field)) {
      updateData[field] = value ? parseFloat(value) : null;
    } else if (['unitsTotal', 'units1b', 'units2b', 'units3b', 'completionYear', 'parkingSpaces'].includes(field)) {
      updateData[field] = value ? parseInt(value) : null;
    } else {
      updateData[field] = value || null;
    }

    updateMutation.mutate({ siteId: site.id, updateData });
  };

  const deleteMutation = useMutation({
    mutationFn: async (siteId: string) => {
      const response = await fetch(`/api/sites/${siteId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },
    onSuccess: (_, siteId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sites'] });
      onRefresh();
      if (selectedSite?.id === siteId) onSelectSite(null);
      toast({ title: "Site Deleted", description: "Site has been deleted" });
    },
    onError: () => {
      toast({ title: "Delete Failed", description: "Failed to delete site", variant: "destructive" });
    },
  });

  const handleDelete = async (site: Site) => {
    if (!confirm(`Are you sure you want to delete ${site.name}?`)) return;
    deleteMutation.mutate(site.id);
  };

  const createEditableCell = (field: string, type: 'text' | 'number' = 'text') => 
    ({ row, column }: any) => {
      const site = row.original;
      const isEditing = editingCell?.rowId === site.id && editingCell?.columnId === column.id;
      const value = row.getValue(field);
      
      if (isEditing) {
        return (
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleCellEdit(site, field, editValue)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCellEdit(site, field, editValue);
              if (e.key === 'Escape') setEditingCell(null);
            }}
            className="h-8 w-full"
            autoFocus
          />
        );
      }
      
      return (
        <div 
          className="cursor-pointer hover:bg-bristol-cream/20 p-1 rounded min-w-[80px]"
          onClick={() => {
            setEditingCell({ rowId: site.id, columnId: column.id });
            setEditValue(value?.toString() || '');
          }}
        >
          {value || '—'}
        </div>
      );
    };

  const columns: ColumnDef<Site>[] = useMemo(() => [
    {
      accessorKey: 'status',
      header: 'STATUS',
      size: 120,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusLower = status?.toLowerCase() || 'active';
        
        const getStatusStyle = () => {
          switch (statusLower) {
            case 'completed':
              return 'bg-gradient-to-r from-emerald-400/20 via-green-500/30 to-emerald-600/40 backdrop-blur-sm border border-emerald-400/50 text-emerald-800 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-105';
            case 'newest':
              return 'bg-gradient-to-r from-violet-400/20 via-purple-500/30 to-violet-600/40 backdrop-blur-sm border border-violet-400/50 text-violet-800 shadow-xl shadow-violet-500/30 hover:shadow-violet-500/40 hover:scale-105';
            case 'pipeline':
              return 'bg-gradient-to-r from-blue-400/20 via-cyan-500/30 to-blue-600/40 backdrop-blur-sm border border-blue-400/50 text-blue-800 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105';
            default:
              return 'bg-gradient-to-r from-amber-400/20 via-orange-500/30 to-amber-600/40 backdrop-blur-sm border border-amber-400/50 text-amber-800 shadow-xl shadow-amber-500/30 hover:shadow-amber-500/40 hover:scale-105';
          }
        };

        return (
          <div className="relative">
            <Badge
              variant="outline"
              className={`
                ${getStatusStyle()}
                font-bold text-xs px-3 py-1 rounded-full transition-all duration-300 cursor-default
                relative overflow-hidden
              `}
            >
              <div className="absolute inset-0 bg-white/10 rounded-full"></div>
              <span className="relative z-10 font-semibold tracking-wide">
                {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Active'}
              </span>
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-cinzel font-bold text-white hover:text-bristol-gold hover:bg-bristol-gold/20 transition-all duration-300"
        >
          PROPERTY NAME
          <ArrowUpDown className="ml-2 h-4 w-4 text-bristol-gold" />
        </Button>
      ),
      size: 200,
      cell: ({ row }) => (
        <div 
          className="font-bold text-bristol-ink cursor-pointer hover:text-bristol-maroon min-w-[200px] transition-all duration-300 hover:scale-105"
          onClick={() => onSelectSite(row.original)}
        >
          {row.getValue('name')}
        </div>
      ),
    },
    {
      accessorKey: 'city',
      header: 'LOCATION',
      size: 180,
      cell: ({ row }) => {
        const city = row.original.city as string;
        const state = row.original.state as string;
        return (
          <div className="font-medium text-bristol-ink">
            <div className="font-bold">{city || 'Unknown City'}</div>
            <div className="text-sm text-bristol-stone">{state || 'Unknown State'}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'addrLine1',
      header: 'ADDRESS',
      size: 200,
      cell: ({ row }) => {
        const addr1 = row.original.addrLine1 as string;
        const addr2 = row.original.addrLine2 as string;
        return (
          <div className="font-medium text-bristol-ink text-sm">
            <div>{addr1 || 'Address Not Available'}</div>
            {addr2 && <div className="text-bristol-stone">{addr2}</div>}
          </div>
        );
      },
    },
    {
      accessorKey: 'unitsTotal',
      header: 'UNITS',
      size: 100,
      cell: ({ row }) => {
        const units = row.getValue('unitsTotal') as number;
        return (
          <div className="text-center">
            <div className="font-bold text-bristol-maroon text-lg">
              {units?.toLocaleString() || '—'}
            </div>
            <div className="text-xs text-bristol-stone">Total Units</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'completionYear',
      header: 'YEAR BUILT',
      size: 120,
      cell: ({ row }) => {
        const year = row.getValue('completionYear') as number;
        const currentYear = new Date().getFullYear();
        const age = year ? currentYear - year : null;
        return (
          <div className="text-center">
            <div className="font-bold text-bristol-ink">
              {year || '—'}
            </div>
            {age && (
              <div className="text-xs text-bristol-stone">
                {age} years old
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'postalCode',
      header: 'ZIP CODE',
      size: 100,
      cell: ({ row }) => (
        <div className="text-center font-medium text-bristol-ink">
          {row.getValue('postalCode') || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'latitude',
      header: 'LATITUDE',
      size: 120,
      cell: ({ row }) => {
        const lat = row.getValue('latitude') as number;
        return (
          <div className="text-center text-sm font-mono text-bristol-ink">
            {lat ? lat.toFixed(6) : '—'}
          </div>
        );
      },
    },
    {
      accessorKey: 'longitude',
      header: 'LONGITUDE',
      size: 120,
      cell: ({ row }) => {
        const lng = row.getValue('longitude') as number;
        return (
          <div className="text-center text-sm font-mono text-bristol-ink">
            {lng ? lng.toFixed(6) : '—'}
          </div>
        );
      },
    },
    {
      accessorKey: 'acreage',
      header: 'ACREAGE',
      size: 100,
      cell: ({ row }) => {
        const acreage = row.getValue('acreage') as number;
        return (
          <div className="text-center">
            <div className="font-bold text-bristol-maroon">
              {acreage ? `${acreage.toFixed(1)}` : '—'}
            </div>
            {acreage && (
              <div className="text-xs text-bristol-stone">acres</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'units1b',
      header: '1BR UNITS',
      size: 100,
      cell: ({ row }) => (
        <div className="text-center font-medium text-bristol-ink">
          {row.getValue('units1b') || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'units2b',
      header: '2BR UNITS',
      size: 100,
      cell: ({ row }) => (
        <div className="text-center font-medium text-bristol-ink">
          {row.getValue('units2b') || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'units3b',
      header: '3BR UNITS',
      size: 100,
      cell: ({ row }) => (
        <div className="text-center font-medium text-bristol-ink">
          {row.getValue('units3b') || '—'}
        </div>
      ),
    },
    {
      accessorKey: 'avgSf',
      header: 'AVG SQ FT',
      size: 120,
      cell: ({ row }) => {
        const avgSf = row.getValue('avgSf') as number;
        return (
          <div className="text-center">
            <div className="font-bold text-bristol-maroon">
              {avgSf ? avgSf.toLocaleString() : '—'}
            </div>
            {avgSf && (
              <div className="text-xs text-bristol-stone">sq ft</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'parkingSpaces',
      header: 'PARKING',
      size: 100,
      cell: ({ row }) => {
        const parking = row.getValue('parkingSpaces') as number;
        return (
          <div className="text-center">
            <div className="font-medium text-bristol-ink">
              {parking || '—'}
            </div>
            {parking && (
              <div className="text-xs text-bristol-stone">spaces</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'sourceUrl',
      header: 'SOURCE',
      size: 100,
      cell: ({ row }) => {
        const url = row.getValue('sourceUrl') as string;
        return url ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(url, '_blank')}
            className="h-8 w-8 p-0 text-bristol-gold hover:text-white hover:bg-bristol-gold/80 transition-all duration-300"
            title="View Source URL"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        ) : (
          <div className="text-center text-bristol-stone">—</div>
        );
      },
    },
    {
      accessorKey: 'notes',
      header: 'NOTES',
      size: 200,
      cell: ({ row }) => {
        const notes = row.getValue('notes') as string;
        return notes ? (
          <div className="relative group">
            <div className="text-sm text-bristol-ink max-w-[200px] truncate cursor-help">
              {notes}
            </div>
            <div className="absolute bottom-full left-0 mb-2 p-3 bg-white border-2 border-bristol-gold shadow-xl rounded-lg text-sm text-bristol-ink max-w-xs z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-normal">
              <div className="font-medium text-bristol-maroon mb-1">Notes:</div>
              {notes}
              <div className="absolute top-full left-4 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-bristol-gold"></div>
            </div>
          </div>
        ) : (
          <div className="text-center text-bristol-stone">—</div>
        );
      },
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      size: 120,
      cell: ({ row }) => {
        const site = row.original;
        return (
          <div className="flex items-center justify-center gap-1">
            {site.latitude && site.longitude && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectSite(site)}
                className="h-8 w-8 p-0 text-bristol-maroon hover:text-white hover:bg-bristol-maroon/80 transition-all duration-300 rounded-full shadow-lg shadow-bristol-maroon/20"
                title="View on Map"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            )}
            {site.sourceUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => site.sourceUrl && window.open(site.sourceUrl, '_blank')}
                className="h-8 w-8 p-0 text-bristol-gold hover:text-white hover:bg-bristol-gold/80 transition-all duration-300 rounded-full shadow-lg shadow-bristol-gold/20"
                title="View Source"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(site)}
              className="h-8 w-8 p-0 text-red-600 hover:text-white hover:bg-red-600 transition-all duration-300 rounded-full shadow-lg shadow-red-600/20"
              title="Delete Property"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], [editingCell, editValue, onSelectSite, onRefresh, selectedSite, toast]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 30,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-white to-bristol-cream/30">
        <div className="flex items-center gap-3 text-bristol-ink">
          <div className="relative">
            <Loader2 className="h-6 w-6 animate-spin text-bristol-maroon" />
            <div className="absolute -inset-2 bg-bristol-maroon/20 rounded-full blur-lg animate-pulse"></div>
          </div>
          <span className="font-cinzel text-lg">Loading Bristol Portfolio Intelligence...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Premium Search & Filter Bar */}
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <div className="relative">
          <Input
            placeholder="Search properties by name, location, or status..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-12 pr-4 py-3 bg-gradient-to-r from-white to-bristol-cream/30 border-bristol-maroon/30 focus:border-bristol-maroon focus:ring-bristol-maroon/20 font-medium text-bristol-ink placeholder:text-bristol-stone/60 shadow-lg shadow-bristol-maroon/10"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <div className="relative group">
              <MapPin className="h-5 w-5 text-bristol-maroon group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -inset-2 bg-bristol-maroon/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-2 border-bristol-maroon/20 bg-gradient-to-br from-white via-bristol-cream/20 to-white flex-1 shadow-2xl shadow-bristol-maroon/15 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          <Table className="w-full relative">
            <TableHeader className="sticky top-0 bg-gradient-to-r from-bristol-ink via-slate-800 to-bristol-ink z-10 shadow-lg shadow-bristol-ink/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-bristol-gold/50">
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id} 
                      className="font-cinzel text-white font-bold whitespace-nowrap px-6 py-4 text-sm tracking-wider bg-gradient-to-b from-transparent to-black/20"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`
                      transition-all duration-300 cursor-pointer
                      ${selectedSite?.id === row.original.id ? 
                        'bg-gradient-to-r from-bristol-gold/20 via-bristol-cream/40 to-bristol-gold/20 shadow-lg shadow-bristol-gold/20 border-l-4 border-bristol-gold' : 
                        index % 2 === 0 ? 'bg-white hover:bg-gradient-to-r hover:from-bristol-cream/30 hover:to-bristol-gold/10' : 
                        'bg-bristol-cream/10 hover:bg-gradient-to-r hover:from-bristol-cream/40 hover:to-bristol-gold/15'
                      }
                      hover:shadow-lg hover:shadow-bristol-maroon/10
                    `}
                    onClick={() => onSelectSite(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id} 
                        className="px-6 py-4 whitespace-nowrap font-medium text-bristol-ink"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-4 text-bristol-stone py-8">
                      <div className="relative group">
                        <Building className="h-12 w-12 text-bristol-maroon/40 group-hover:text-bristol-maroon/60 transition-colors duration-300" />
                        <div className="absolute -inset-3 bg-bristol-maroon/10 rounded-full blur-xl group-hover:bg-bristol-maroon/20 transition-all duration-300"></div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-cinzel text-lg text-bristol-ink">No Properties Found</p>
                        <p className="text-sm text-bristol-stone">Refine your search criteria or add new properties to your portfolio</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Premium Pagination & Controls */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-white via-bristol-cream/30 to-white border-t-2 border-bristol-maroon/20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 bg-bristol-maroon text-white border-bristol-maroon font-cinzel font-bold">
              {table.getFilteredRowModel().rows.length}
            </Badge>
            <span className="text-sm font-medium text-bristol-ink">Properties in Portfolio</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-bristol-ink">Show:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="text-sm border-bristol-maroon/30 rounded-lg px-3 py-1 bg-gradient-to-r from-white to-bristol-cream/50 font-medium text-bristol-ink focus:border-bristol-maroon focus:ring-bristol-maroon/20"
            >
              {[10, 20, 30, 50, 100].map(size => (
                <option key={size} value={size}>{size} properties</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-bristol-stone mr-2">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="bg-gradient-to-r from-white to-bristol-cream/30 border-bristol-maroon/30 text-bristol-ink hover:bg-gradient-to-r hover:from-bristol-cream/40 hover:to-bristol-gold/20 hover:border-bristol-maroon font-medium"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="bg-gradient-to-r from-white to-bristol-cream/30 border-bristol-maroon/30 text-bristol-ink hover:bg-gradient-to-r hover:from-bristol-cream/40 hover:to-bristol-gold/20 hover:border-bristol-maroon font-medium"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}