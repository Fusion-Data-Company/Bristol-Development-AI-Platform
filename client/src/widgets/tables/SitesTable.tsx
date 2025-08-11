import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, MapPin, Building } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Site } from '@shared/schema';

interface SitesTableProps {
  onSiteSelect?: (site: Site) => void;
  selectedSiteId?: string;
}

const columnHelper = createColumnHelper<Site>();

export function SitesTable({ onSiteSelect, selectedSiteId }: SitesTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSite, setNewSite] = useState({
    name: "",
    city: "",
    state: ""
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sites
  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
    retry: false,
  });

  // Create site mutation
  const createSiteMutation = useMutation({
    mutationFn: async (siteData: any) => {
      return apiRequest("/api/sites", "POST", siteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      setIsAddDialogOpen(false);
      setNewSite({ name: "", city: "", state: "" });
      toast({ title: "Site Created" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create site", variant: "destructive" });
    },
  });

  // Delete site mutation
  const deleteSiteMutation = useMutation({
    mutationFn: async (siteId: string) => {
      return apiRequest(`/api/sites/${siteId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      toast({ title: "Site Deleted" });
    },
  });

  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => (
        <div className="font-medium">
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.display({
      id: 'location',
      header: 'City/State',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-gray-600">
          <MapPin className="h-3 w-3" />
          {row.original.city && row.original.state ? `${row.original.city}, ${row.original.state}` : 'Not set'}
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSiteSelect?.(row.original)}
          >
            Select
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => deleteSiteMutation.mutate(row.original.id)}
            className="text-red-600"
          >
            Delete
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: sites,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleCreateSite = () => {
    if (!newSite.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    createSiteMutation.mutate(newSite);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Sites
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Site
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Site</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name (required)</Label>
                  <Input
                    value={newSite.name}
                    onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={newSite.city}
                    onChange={(e) => setNewSite({ ...newSite, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={newSite.state}
                    onChange={(e) => setNewSite({ ...newSite, state: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSite} disabled={createSiteMutation.isPending}>
                  {createSiteMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading sites...</div>
        ) : sites.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No sites found</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Site
            </Button>
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
              {table.getRowModel().rows.map((row) => (
                <TableRow 
                  key={row.id}
                  className={selectedSiteId === row.original.id ? "bg-blue-50" : ""}
                >
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