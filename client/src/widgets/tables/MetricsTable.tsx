import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Edit, Save, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { SiteMetric } from '@shared/schema';

interface MetricsTableProps {
  siteId?: string;
}

const columnHelper = createColumnHelper<SiteMetric & { isEditing?: boolean }>();

export function MetricsTable({ siteId }: MetricsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch metrics for selected site
  const { data: metrics = [], isLoading } = useQuery<SiteMetric[]>({
    queryKey: ["/api/sites/metrics", siteId],
    queryFn: () => apiRequest(`/api/sites/metrics${siteId ? `?siteId=${siteId}` : ''}`),
    enabled: !!siteId,
    retry: false,
  });

  // Update metric mutation
  const updateMetricMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/metrics", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites/metrics"] });
      setEditingId(null);
      setEditValues({});
      toast({ title: "Metric Updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update metric", variant: "destructive" });
    },
  });

  const handleEdit = (metric: SiteMetric) => {
    setEditingId(metric.id);
    setEditValues({
      metricName: metric.metricName || '',
      value: metric.value || 0,
    });
  };

  const handleSave = () => {
    if (!editingId) return;
    updateMetricMutation.mutate({
      id: editingId,
      siteId,
      ...editValues,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const columns = [
    columnHelper.accessor('metricName', {
      header: 'Metric Name',
      cell: ({ row, getValue }) => {
        const isEditing = editingId === row.original.id;
        return isEditing ? (
          <Input
            value={editValues.metricName || ''}
            onChange={(e) => setEditValues({ ...editValues, metricName: e.target.value })}
            className="w-full"
          />
        ) : (
          <div className="font-medium">{getValue()}</div>
        );
      },
    }),
    columnHelper.accessor('value', {
      header: 'Value',
      cell: ({ row, getValue }) => {
        const isEditing = editingId === row.original.id;
        return isEditing ? (
          <Input
            type="number"
            value={editValues.value || 0}
            onChange={(e) => setEditValues({ ...editValues, value: parseFloat(e.target.value) || 0 })}
            className="w-full"
          />
        ) : (
          <span className="text-lg font-semibold">{getValue()?.toLocaleString() || 'N/A'}</span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const isEditing = editingId === row.original.id;
        return (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} disabled={updateMetricMutation.isPending}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => handleEdit(row.original)}>
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: metrics,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!siteId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Site Selected</h3>
            <p className="text-gray-500">
              Select a site from the table above to view and manage its metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Site Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading metrics...</div>
        ) : metrics.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No metrics found for this site</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}