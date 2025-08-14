import React, { useState, useMemo, useCallback } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
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
}

interface VirtualizedTableProps {
  data: CompRecord[];
  isLoading?: boolean;
}

const columnHelper = createColumnHelper<CompRecord>();

export function VirtualizedTable({ data, isLoading }: VirtualizedTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const parentRef = React.useRef<HTMLDivElement>(null);

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
  const EditableCell = ({ getValue, row, column }: any) => {
    const initialValue = getValue();
    const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id;

    const handleEdit = () => {
      setEditingCell({ rowId: row.id, columnId: column.id });
      setEditValue(String(initialValue || ''));
    };

    const handleSave = () => {
      let value: any = editValue;
      
      // Parse numeric fields
      if (['units', 'yearBuilt', 'rentPsf', 'rentPu', 'occupancyPct', 'concessionPct'].includes(column.id)) {
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
        <div className="flex items-center gap-1 w-full">
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
        className="cursor-pointer hover:bg-muted p-1 rounded text-xs min-h-[20px] transition-colors w-full"
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
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          <Building2 className="h-4 w-4 mr-1" />
          Property
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ getValue, row, column }) => (
        <div className="space-y-1 w-48">
          <EditableCell getValue={getValue} row={row} column={column} />
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
      size: 220,
    }),
    columnHelper.accessor('address', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          <MapPin className="h-4 w-4 mr-1" />
          Address
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ getValue, row, column }) => (
        <div className="space-y-1 w-64">
          <EditableCell getValue={getValue} row={row} column={column} />
          <div className="text-xs text-gray-500">
            {row.original.city}, {row.original.state} {row.original.zip}
          </div>
        </div>
      ),
      size: 280,
    }),
    columnHelper.accessor('units', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          <Users className="h-4 w-4 mr-1" />
          Units
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: EditableCell,
      size: 100,
    }),
    columnHelper.accessor('yearBuilt', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Year
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: EditableCell,
      size: 100,
    }),
    columnHelper.accessor('rentPsf', {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold"
        >
          <DollarSign className="h-4 w-4 mr-1" />
          Rent/SF
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ getValue, row, column }) => (
        <EditableCell 
          getValue={() => getValue() ? `$${Number(getValue()).toFixed(2)}` : null} 
          row={row} 
          column={column} 
        />
      ),
      size: 120,
    }),
    columnHelper.accessor('rentPu', {
      header: 'Rent/Unit',
      cell: ({ getValue, row, column }) => (
        <EditableCell 
          getValue={() => getValue() ? `$${Number(getValue()).toLocaleString()}` : null} 
          row={row} 
          column={column} 
        />
      ),
      size: 120,
    }),
    columnHelper.accessor('occupancyPct', {
      header: 'Occ%',
      cell: ({ getValue, row, column }) => (
        <EditableCell 
          getValue={() => getValue() ? `${Number(getValue())}%` : null} 
          row={row} 
          column={column} 
        />
      ),
      size: 80,
    }),
    columnHelper.accessor('amenityTags', {
      header: 'Amenities',
      cell: ({ getValue }) => {
        const amenities = getValue() as string[] | undefined;
        return (
          <div className="flex flex-wrap gap-1 w-40">
            {amenities?.slice(0, 2).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {amenities && amenities.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{amenities.length - 2}
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
      size: 180,
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
      size: 100,
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
      size: 80,
    }),
  ], [editingCell, editValue, updateCompMutation, deleteCompMutation]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
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
      {/* Controls */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search all columns..."
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-gray-500">
          {table.getFilteredRowModel().rows.length} of {table.getCoreRowModel().rows.length} rows
        </div>
      </div>

      {/* Virtualized Table */}
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto border rounded-md"
      >
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          {/* Header */}
          <div className="bg-gray-50 sticky top-0 z-10 border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <div key={headerGroup.id} className="flex">
                {headerGroup.headers.map((header) => (
                  <div
                    key={header.id}
                    className="px-4 py-3 text-left font-medium text-gray-900 border-r last:border-r-0"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Virtual Rows */}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={row.id}
                className="flex items-center hover:bg-gray-50/50 transition-colors absolute w-full border-b"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="px-4 py-2 border-r last:border-r-0 flex items-center"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Empty State */}
          {rows.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No comparable properties found</p>
              <p className="text-sm">Try launching a scrape job to populate data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VirtualizedTable;