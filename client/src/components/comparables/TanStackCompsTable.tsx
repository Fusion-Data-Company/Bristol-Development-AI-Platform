import React, { useState, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type PaginationState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  Edit3,
  Save,
  X,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompRecord {
  id: string;
  source: string;
  sourceUrl?: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
  assetType: string;
  subtype?: string;
  units?: number;
  yearBuilt?: number;
  rentPsf?: number;
  rentPu?: number;
  occupancyPct?: number;
  concessionPct?: number;
  amenityTags?: string[];
  notes?: string;
  canonicalAddress: string;
  unitPlan?: string;
  scrapedAt?: string;
  createdAt: string;
  updatedAt: string;
  jobId?: string;
  // Enhanced comparable fields
  capRate?: number;
  noi?: number;
  pricePerUnit?: number;
  pricePerSqft?: number;
  totalSqft?: number;
  parkingRatio?: number;
  lotSize?: number;
  stories?: number;
  constructionType?: string;
  unitMix?: Record<string, number>;
  marketRentPsf?: number;
  effectiveRentPsf?: number;
  leaseUpStatus?: string;
  developer?: string;
  propertyManager?: string;
}

interface TanStackCompsTableProps {
  data: CompRecord[];
  isLoading?: boolean;
}

const columnHelper = createColumnHelper<CompRecord>();

export function TanStackCompsTable({ data, isLoading }: TanStackCompsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Mutations
  const updateCompMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: any }) => {
      const response = await fetch(`/api/comps-annex/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) throw new Error('Update failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] });
      toast({ title: 'Updated successfully' });
    },
    onError: () => {
      toast({ title: 'Update failed', variant: 'destructive' });
    },
  });

  const deleteCompMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/comps-annex/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] });
      toast({ title: 'Deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Delete failed', variant: 'destructive' });
    },
  });

  // Editable cell component
  const EditableCell = ({ getValue, row, column, table }: any) => {
    const initialValue = getValue();
    const cellId = `${row.id}-${column.id}`;
    const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;

    const handleEdit = () => {
      setEditingCell({ rowId: row.id, columnId: column.id });
      setEditValue(String(initialValue || ''));
    };

    const handleSave = () => {
      let value: any = editValue;
      
      // Parse numeric fields
      if (['units', 'yearBuilt', 'rentPsf', 'rentPu', 'occupancyPct', 'concessionPct', 'lat', 'lng', 'capRate', 'noi', 'pricePerUnit', 'pricePerSqft', 'totalSqft', 'parkingRatio', 'lotSize', 'stories', 'marketRentPsf', 'effectiveRentPsf'].includes(column.id)) {
        value = editValue ? Number(editValue) : null;
      }
      
      updateCompMutation.mutate({ 
        id: row.original.id, 
        field: column.id, 
        value 
      });
      
      setEditingCell(null);
    };

    const handleCancel = () => {
      setEditingCell(null);
      setEditValue('');
    };

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-6 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={handleSave} className="h-6 w-6 p-0">
            <Save className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        className="cursor-pointer hover:bg-muted p-1 rounded text-xs min-h-[20px] transition-colors"
        onClick={handleEdit}
        title="Click to edit"
      >
        {initialValue || '-'}
      </div>
    );
  };

  // Column definitions
  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold"
          >
            Property
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      ),
      cell: ({ getValue, row, column, table }) => (
        <div className="space-y-1">
          <EditableCell getValue={getValue} row={row} column={column} table={table} />
          <div className="text-xs text-gray-500">
            <Badge variant="outline" className="text-xs">
              {row.original.assetType}
            </Badge>
            {row.original.subtype && (
              <span className="ml-1 text-gray-400">• {row.original.subtype}</span>
            )}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('address', {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold"
          >
            Address
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      ),
      cell: ({ getValue, row, column, table }) => (
        <div className="space-y-1">
          <EditableCell getValue={getValue} row={row} column={column} table={table} />
          <div className="text-xs text-gray-500">
            {row.original.city}, {row.original.state} {row.original.zip}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('units', {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold"
          >
            Units
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      ),
      cell: EditableCell,
    }),
    columnHelper.accessor('yearBuilt', {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold"
          >
            Year
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      ),
      cell: EditableCell,
    }),
    columnHelper.accessor('rentPsf', {
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-semibold"
          >
            Rent/SF
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      ),
      cell: ({ getValue, row, column, table }) => (
        <EditableCell 
          getValue={() => getValue() ? `$${Number(getValue()).toFixed(2)}` : null} 
          row={row} 
          column={column} 
          table={table} 
        />
      ),
    }),
    columnHelper.accessor('rentPu', {
      header: 'Rent/Unit',
      cell: ({ getValue, row, column, table }) => (
        <EditableCell 
          getValue={() => getValue() ? `$${Number(getValue()).toLocaleString()}` : null} 
          row={row} 
          column={column} 
          table={table} 
        />
      ),
    }),
    columnHelper.accessor('occupancyPct', {
      header: 'Occ%',
      cell: ({ getValue, row, column, table }) => (
        <EditableCell 
          getValue={() => getValue() ? `${Number(getValue())}%` : null} 
          row={row} 
          column={column} 
          table={table} 
        />
      ),
    }),
    // Cap Rate
    columnHelper.accessor('capRate', {
      header: 'Cap Rate',
      cell: ({ getValue, row, column, table }) => (
        <EditableCell 
          getValue={() => getValue() ? `${Number(getValue()).toFixed(2)}%` : null} 
          row={row} 
          column={column} 
          table={table} 
        />
      ),
    }),
    // NOI
    columnHelper.accessor('noi', {
      header: 'NOI',
      cell: ({ getValue, row, column, table }) => (
        <EditableCell 
          getValue={() => getValue() ? `$${Number(getValue()).toLocaleString()}` : null} 
          row={row} 
          column={column} 
          table={table} 
        />
      ),
    }),
    // Price per Unit
    columnHelper.accessor('pricePerUnit', {
      header: 'Price/Unit',
      cell: ({ getValue, row, column, table }) => (
        <EditableCell 
          getValue={() => getValue() ? `$${Number(getValue()).toLocaleString()}` : null} 
          row={row} 
          column={column} 
          table={table} 
        />
      ),
    }),
    // Total Square Feet
    columnHelper.accessor('totalSqft', {
      header: 'Total SF',
      cell: ({ getValue, row, column, table }) => (
        <EditableCell 
          getValue={() => getValue() ? Number(getValue()).toLocaleString() : null} 
          row={row} 
          column={column} 
          table={table} 
        />
      ),
    }),
    // Construction Type
    columnHelper.accessor('constructionType', {
      header: 'Construction',
      cell: ({ getValue, row, column, table }) => (
        <EditableCell getValue={getValue} row={row} column={column} table={table} />
      ),
    }),
    // Lease-Up Status
    columnHelper.accessor('leaseUpStatus', {
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue();
        const variant = status === 'Stabilized' ? 'default' : status === 'Lease-Up' ? 'secondary' : 'outline';
        return (
          <Badge variant={variant} className="text-xs">
            {status || 'Unknown'}
          </Badge>
        );
      },
    }),
    columnHelper.accessor('amenityTags', {
      header: 'Amenities',
      cell: ({ getValue }) => {
        const amenities = getValue() as string[] | undefined;
        if (!amenities || amenities.length === 0) {
          return <span className="text-gray-400 text-xs">No amenities listed</span>;
        }
        
        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="cursor-pointer hover:bg-bristol-gold/10 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  {/* Show first 2 amenities as badges */}
                  {amenities.slice(0, 2).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs bg-bristol-gold/20 text-bristol-maroon border-bristol-gold/30">
                      {tag}
                    </Badge>
                  ))}
                  {/* Show count for remaining amenities */}
                  {amenities.length > 2 && (
                    <Badge variant="outline" className="text-xs text-bristol-stone border-bristol-stone/30">
                      +{amenities.length - 2} more
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-bristol-stone/60 mt-1">
                  {amenities.length} total amenities
                </div>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-96 bg-white/95 backdrop-blur border-bristol-gold/30 shadow-xl">
              <div className="space-y-4">
                <div className="border-b border-bristol-gold/20 pb-2">
                  <h4 className="font-semibold text-bristol-maroon flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Property Amenities
                  </h4>
                  <p className="text-sm text-bristol-stone">
                    {amenities.length} premium amenities available
                  </p>
                </div>
                
                {/* Premium Amenities */}
                <div>
                  <h5 className="text-sm font-medium text-bristol-maroon mb-2">Premium Features</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {amenities.slice(0, 8).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs bg-bristol-gold/20 text-bristol-maroon border-bristol-gold/30">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Additional Amenities */}
                {amenities.length > 8 && (
                  <div>
                    <h5 className="text-sm font-medium text-bristol-stone mb-2">Additional Amenities</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {amenities.slice(8).map((tag, i) => (
                        <Badge key={i + 8} variant="outline" className="text-xs text-bristol-stone border-bristol-stone/30">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Summary */}
                <div className="border-t border-bristol-gold/20 pt-2">
                  <div className="text-xs text-bristol-stone/80">
                    This property offers a comprehensive amenity package designed for luxury multifamily living.
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      },
      enableSorting: false,
    }),
    columnHelper.accessor('source', {
      header: 'Source',
      cell: ({ getValue }) => (
        <Badge 
          variant={getValue() === 'sample-data' ? 'secondary' : 'default'} 
          className="text-xs"
        >
          {getValue()}
        </Badge>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => deleteCompMutation.mutate(row.original.id)}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          title="Delete record"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      ),
    }),
  ], [editingCell, editValue, updateCompMutation, deleteCompMutation]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      pagination,
      columnFilters,
      globalFilter,
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading comparables...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Global Search */}
      <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-bristol-cream/20 to-white border-b border-bristol-gold/20">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm pl-8 border-bristol-gold/30"
            />
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
              <Building2 className="h-4 w-4 text-bristol-maroon/50" />
            </div>
          </div>
          <Badge variant="secondary" className="px-3 py-1 bg-bristol-gold/20 text-bristol-maroon border-bristol-gold/30">
            {table.getFilteredRowModel().rows.length} of {table.getCoreRowModel().rows.length} records
          </Badge>
        </div>
        <div className="text-sm text-bristol-maroon/60 font-medium">
          Bristol Comparables Database
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-bristol-gold/30 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gradient-to-r from-bristol-maroon/5 to-bristol-gold/5 border-b border-bristol-gold/30">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-bristol-maroon">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                  className="hover:bg-gray-50/50 transition-colors"
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No comparable properties found</p>
                    <p className="text-sm">Try launching a scrape job to populate data</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="h-8 w-[70px] rounded border border-input px-2 text-sm"
          >
            {[10, 25, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[120px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TanStackCompsTable;