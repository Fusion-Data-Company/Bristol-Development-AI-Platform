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
import { ArrowUpDown, Edit, Trash2, MapPin, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Site {
  id: string;
  status: string;
  name: string;
  addrLine1?: string;
  addrLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  acreage?: number;
  unitsTotal?: number;
  units1b?: number;
  units2b?: number;
  units3b?: number;
  avgSf?: number;
  completionYear?: number;
  parkingSpaces?: number;
  sourceUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

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
          className="cursor-pointer hover:bg-gradient-to-r hover:from-bristol-gold/10 hover:to-bristol-maroon/10 p-2 rounded-lg transition-all duration-300 hover:shadow-lg border-2 border-transparent hover:border-bristol-gold/30"
          onClick={() => {
            setEditingCell({ rowId: site.id, columnId: column.id });
            setEditValue(value?.toString() || '');
          }}
        >
          <span className="font-medium text-bristol-ink hover:text-bristol-maroon transition-colors duration-200">
            {value || <span className="text-bristol-stone/60 italic">—</span>}
          </span>
        </div>
      );
    };

  const columns: ColumnDef<Site>[] = useMemo(() => [
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge
            variant="outline"
            className={`
              relative font-bold text-xs px-3 py-1.5 border-2 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl
              ${status === 'Operating' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-400 shadow-emerald-500/30 hover:shadow-emerald-500/50' :
              status === 'Completed' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400 shadow-green-500/30 hover:shadow-green-500/50' :
              status === 'Newest' ? 'bg-gradient-to-r from-bristol-gold to-yellow-500 text-bristol-ink border-bristol-gold shadow-bristol-gold/40 hover:shadow-bristol-gold/60' :
              status === 'Pipeline' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400 shadow-blue-500/30 hover:shadow-blue-500/50' :
              'bg-gradient-to-r from-gray-500 to-slate-600 text-white border-gray-400 shadow-gray-500/30 hover:shadow-gray-500/50'}
            `}
          >
            <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Site Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      size: 200,
      cell: ({ row }) => (
        <div 
          className="group cursor-pointer relative overflow-hidden"
          onClick={() => onSelectSite(row.original)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-bristol-maroon/0 via-bristol-gold/10 to-bristol-maroon/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
          <div className="relative font-bold text-bristol-ink group-hover:text-bristol-maroon transition-all duration-300 p-2 rounded-lg group-hover:bg-gradient-to-r group-hover:from-bristol-gold/5 group-hover:to-bristol-maroon/5 group-hover:shadow-lg">
            {row.getValue('name')}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'addrLine1',
      header: 'Address',
      size: 200,
      cell: createEditableCell('addrLine1'),
    },
    {
      accessorKey: 'city',
      header: 'City',
      size: 120,
      cell: createEditableCell('city'),
    },
    {
      accessorKey: 'state',
      header: 'State',
      size: 80,
      cell: createEditableCell('state'),
    },
    {
      accessorKey: 'postalCode',
      header: 'ZIP',
      size: 80,
      cell: createEditableCell('postalCode'),
    },
    {
      accessorKey: 'latitude',
      header: 'Latitude',
      size: 100,
      cell: createEditableCell('latitude', 'number'),
    },
    {
      accessorKey: 'longitude',
      header: 'Longitude',
      size: 100,
      cell: createEditableCell('longitude', 'number'),
    },
    {
      accessorKey: 'acreage',
      header: 'Acreage',
      size: 80,
      cell: createEditableCell('acreage', 'number'),
    },
    {
      accessorKey: 'unitsTotal',
      header: 'Total Units',
      size: 100,
      cell: createEditableCell('unitsTotal', 'number'),
    },
    {
      accessorKey: 'units1b',
      header: '1BR Units',
      size: 90,
      cell: createEditableCell('units1b', 'number'),
    },
    {
      accessorKey: 'units2b',
      header: '2BR Units',
      size: 90,
      cell: createEditableCell('units2b', 'number'),
    },
    {
      accessorKey: 'units3b',
      header: '3BR Units',
      size: 90,
      cell: createEditableCell('units3b', 'number'),
    },
    {
      accessorKey: 'avgSf',
      header: 'Avg SF',
      size: 80,
      cell: createEditableCell('avgSf', 'number'),
    },
    {
      accessorKey: 'completionYear',
      header: 'Completion Year',
      size: 120,
      cell: createEditableCell('completionYear', 'number'),
    },
    {
      accessorKey: 'parkingSpaces',
      header: 'Parking Spaces',
      size: 120,
      cell: createEditableCell('parkingSpaces', 'number'),
    },
    {
      accessorKey: 'sourceUrl',
      header: 'Source URL',
      size: 200,
      cell: createEditableCell('sourceUrl'),
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      size: 250,
      cell: createEditableCell('notes'),
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 120,
      cell: ({ row }) => {
        const site = row.original;
        return (
          <div className="flex items-center gap-2">
            {site.latitude && site.longitude && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectSite(site)}
                className="h-8 w-8 p-0 text-bristol-maroon hover:text-white hover:bg-gradient-to-r hover:from-bristol-maroon hover:to-bristol-maroon/80 hover:shadow-lg hover:shadow-bristol-maroon/30 transition-all duration-300 hover:scale-110"
                title="View on Map"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            )}
            {site.sourceUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(site.sourceUrl, '_blank')}
                className="h-8 w-8 p-0 text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-110"
                title="Open Source URL"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(site)}
              className="h-8 w-8 p-0 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-600 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 hover:scale-110"
              title="Delete Site"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], [editingCell, editValue, onSelectSite, handleDelete, selectedSite]);

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
        pageSize: 50,
      },
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-bristol-stone">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading sites...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-white">
        <div className="min-w-max">
          <Table className="w-full">
            <TableHeader className="sticky top-0 bg-gradient-to-r from-white to-bristol-cream/50 z-10 shadow-lg border-b-2 border-bristol-stone/20">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-bristol-stone/10">
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id} 
                      className="font-medium text-bristol-ink whitespace-nowrap px-4 py-3 border-r border-bristol-stone/10 hover:bg-bristol-stone/5 transition-all duration-300"
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
              {Array.from({ length: 50 }, (_, index) => {
                const row = table.getRowModel().rows[index];
                if (row) {
                  // Render actual data row
                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={`
                        transition-all duration-300 border-b border-bristol-stone/10
                        ${row.index % 2 === 0 ? 'bg-gradient-to-r from-white to-bristol-cream/20' : 'bg-gradient-to-r from-bristol-cream/10 to-white'}
                        ${selectedSite?.id === row.original.id ? 'bg-gradient-to-r from-bristol-gold/20 via-bristol-gold/10 to-bristol-gold/20 shadow-lg shadow-bristol-gold/20 border-bristol-gold/30' : ''}
                        hover:bg-gradient-to-r hover:from-bristol-maroon/5 hover:via-bristol-gold/5 hover:to-bristol-maroon/5 hover:shadow-lg hover:shadow-bristol-maroon/10
                      `}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id} 
                          className="px-4 py-2 whitespace-nowrap border-r"
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                } else {
                  // Render empty placeholder row
                  return (
                    <TableRow
                      key={`empty-${index}`}
                      className={`
                        transition-all duration-300 border-b border-bristol-stone/10 h-12
                        ${index % 2 === 0 ? 'bg-gradient-to-r from-white to-bristol-cream/20' : 'bg-gradient-to-r from-bristol-cream/10 to-white'}
                      `}
                    >
                      {columns.map((column, colIndex) => (
                        <TableCell 
                          key={`empty-${index}-${colIndex}`} 
                          className="px-4 py-2 whitespace-nowrap border-r text-bristol-stone/30"
                          style={{ width: column.size || 100 }}
                        >
                          —
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                }
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-bristol-stone">
            {table.getFilteredRowModel().rows.length} site(s) total
          </div>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="text-sm border rounded px-2 py-1"
          >
            {[50].map(size => (
              <option key={size} value={size}>{size} per page</option>
            ))}
          </select>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}