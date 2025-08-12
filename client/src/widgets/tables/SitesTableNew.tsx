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
          className="cursor-pointer hover:bg-bristol-cream/20 p-1 rounded"
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
      header: 'Status',
      size: 120,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge
            variant={
              status === 'Completed' ? 'default' :
              status === 'Newest' ? 'secondary' :
              status === 'Pipeline' ? 'outline' : 'outline'
            }
            className={
              status === 'Completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
              status === 'Newest' ? 'bg-bristol-gold/20 text-bristol-maroon hover:bg-bristol-gold/30' :
              status === 'Pipeline' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
              'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }
          >
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
          className="font-medium text-bristol-ink cursor-pointer hover:text-bristol-maroon"
          onClick={() => onSelectSite(row.original)}
        >
          {row.getValue('name')}
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
                className="h-8 w-8 p-0 text-bristol-maroon hover:text-bristol-maroon hover:bg-bristol-cream/20"
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
                className="h-8 w-8 p-0"
                title="Open Source URL"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(site)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
        pageSize: 30,
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
    <div className="space-y-4 h-full flex flex-col">
      <div className="rounded-md border bg-white flex-1 overflow-x-auto">
        <div className="min-w-max">
          <Table className="w-full">
            <TableHeader className="sticky top-0 bg-white z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id} 
                      className="font-cinzel text-bristol-ink whitespace-nowrap px-4 py-2 border-r"
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
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`hover:bg-bristol-fog/20 ${selectedSite?.id === row.original.id ? 'bg-bristol-gold/10' : ''}`}
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-bristol-stone">
                    No sites found.
                  </TableCell>
                </TableRow>
              )}
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
            {[10, 20, 30, 50, 100].map(size => (
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