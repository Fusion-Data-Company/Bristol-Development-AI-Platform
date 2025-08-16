import React, { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, Trash2 } from "lucide-react";

interface Site {
  id: string;
  status: string;
  name: string;
  addrLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  unitsTotal?: number;
  avgSf?: number;
  completionYear?: number;
  sourceUrl?: string;
}

interface NewTanStackTableProps {
  data: Site[];
  isLoading?: boolean;
  onSelectSite?: (site: Site | null) => void;
  selectedSite?: Site | null;
}

const columnHelper = createColumnHelper<Site>();

export function NewTanStackTable({ data, isLoading, onSelectSite, selectedSite }: NewTanStackTableProps) {
  
  // Create exactly 50 rows of data (fill with empty rows if needed)
  const tableData = useMemo(() => {
    const rows = [...data];
    while (rows.length < 50) {
      rows.push({
        id: `empty-${rows.length}`,
        status: '',
        name: '',
      });
    }
    return rows.slice(0, 50); // Ensure exactly 50 rows
  }, [data]);

  const columns = useMemo(() => [
    columnHelper.accessor('status', {
      header: 'Status',
      size: 120,
      cell: info => {
        const status = info.getValue();
        if (!status) return <div className="h-16 flex items-center text-gray-300">—</div>;
        return (
          <div className="h-16 flex items-center">
            <Badge
              variant="outline"
              className={`font-bold text-xs px-3 py-1.5 border-2 rounded-full ${
                status === 'Operating' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-400' :
                status === 'Completed' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400' :
                status === 'Newest' ? 'bg-gradient-to-r from-bristol-gold to-yellow-500 text-bristol-ink border-bristol-gold' :
                status === 'Pipeline' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400' :
                'bg-gradient-to-r from-gray-500 to-slate-600 text-white border-gray-400'
              }`}
            >
              {status}
            </Badge>
          </div>
        );
      },
    }),
    columnHelper.accessor('name', {
      header: 'Site Name',
      size: 250,
      cell: info => {
        const name = info.getValue();
        if (!name) return <div className="h-16 flex items-center text-gray-300">—</div>;
        return (
          <div 
            className="h-16 flex items-center group cursor-pointer relative overflow-hidden"
            onClick={() => onSelectSite && onSelectSite(info.row.original)}
          >
            <div className="font-bold text-bristol-ink group-hover:text-bristol-maroon transition-all duration-300">
              {name}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('addrLine1', {
      header: 'Address',
      size: 200,
      cell: info => {
        const address = info.getValue();
        return (
          <div className="h-16 flex items-center text-bristol-ink">
            {address || <span className="text-gray-300">—</span>}
          </div>
        );
      },
    }),
    columnHelper.accessor('city', {
      header: 'City',
      size: 120,
      cell: info => {
        const city = info.getValue();
        return (
          <div className="h-16 flex items-center text-bristol-ink">
            {city || <span className="text-gray-300">—</span>}
          </div>
        );
      },
    }),
    columnHelper.accessor('state', {
      header: 'State',
      size: 80,
      cell: info => {
        const state = info.getValue();
        return (
          <div className="h-16 flex items-center text-bristol-ink">
            {state || <span className="text-gray-300">—</span>}
          </div>
        );
      },
    }),
    columnHelper.accessor('postalCode', {
      header: 'ZIP',
      size: 80,
      cell: info => {
        const zip = info.getValue();
        return (
          <div className="h-16 flex items-center text-bristol-ink">
            {zip || <span className="text-gray-300">—</span>}
          </div>
        );
      },
    }),
    columnHelper.accessor('unitsTotal', {
      header: 'Units',
      size: 80,
      cell: info => {
        const units = info.getValue();
        return (
          <div className="h-16 flex items-center text-bristol-ink">
            {units || <span className="text-gray-300">—</span>}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      size: 120,
      cell: ({ row }) => {
        const site = row.original;
        if (!site.name) return <div className="h-16 flex items-center"></div>;
        
        return (
          <div className="h-16 flex items-center gap-2">
            {site.latitude && site.longitude && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectSite && onSelectSite(site)}
                className="h-8 w-8 p-0 text-bristol-maroon hover:text-white hover:bg-bristol-maroon"
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
                className="h-8 w-8 p-0 text-blue-600 hover:text-white hover:bg-blue-500"
                title="Open Source URL"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-white hover:bg-red-500"
              title="Delete Site"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    }),
  ], [onSelectSite, selectedSite]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // No pagination - show all 50 rows at once
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '3200px' }}>
        <div className="text-bristol-stone">Loading sites...</div>
      </div>
    );
  }

  return (
    <div style={{ height: '3200px', minHeight: '3200px' }}>
      <div className="bg-white border border-bristol-gold/30 rounded-lg">
        <div className="p-4 bg-gradient-to-r from-bristol-cream/20 to-white border-b border-bristol-gold/20">
          <h3 className="text-lg font-semibold text-bristol-maroon">
            New TanStack Table - 50 Fixed Rows
          </h3>
        </div>
        
        {/* Table Container - Fixed height for exactly 50 rows */}
        <div style={{ height: '3200px', overflow: 'visible' }}>
          <table className="w-full">
            <thead className="bg-gradient-to-r from-bristol-maroon/5 to-bristol-gold/5 sticky top-0">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="text-left p-4 font-semibold text-bristol-maroon border-b border-bristol-gold/30"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`border-b border-bristol-gold/10 transition-colors
                    ${index % 2 === 0 ? 'bg-white' : 'bg-bristol-cream/10'}
                    ${selectedSite?.id === row.original.id ? 'bg-bristol-gold/20' : ''}
                    hover:bg-bristol-gold/5
                  `}
                  style={{ height: '64px', minHeight: '64px' }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="p-4 border-r border-bristol-gold/10"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-bristol-cream/10 border-t border-bristol-gold/20">
          <div className="text-sm text-bristol-stone">
            Fixed 50 rows displayed | {data.length} actual sites loaded
          </div>
        </div>
      </div>
    </div>
  );
}