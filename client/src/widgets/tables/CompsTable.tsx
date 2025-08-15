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
import { Building, Plus, Info, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Comp {
  id: string;
  siteId: string;
  propertyName: string;
  address: string;
  rents: any;
  concessions: string;
  score: number;
  scoreBreakdown?: {
    amenities: number;
    rent: number;
    concessions: number;
    distance: number;
  };
}

interface CompsTableProps {
  siteId?: string;
}

const columnHelper = createColumnHelper<Comp>();

export function CompsTable({ siteId }: CompsTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [selectedComp, setSelectedComp] = useState<Comp | null>(null);
  const [newComp, setNewComp] = useState({
    propertyName: "",
    address: "",
    rents: { min: 0, max: 0 },
    concessions: ""
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comps for selected site
  const { data: comps = [], isLoading } = useQuery<Comp[]>({
    queryKey: ["/api/comps", siteId],
    queryFn: () => apiRequest(`/api/comps/sites/${siteId}/comps`),
    enabled: !!siteId,
    retry: false,
  });

  // Create comp mutation
  const createCompMutation = useMutation({
    mutationFn: async (compData: any) => {
      return apiRequest("/api/comps", "POST", {
        ...compData,
        siteId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comps"] });
      setIsAddDialogOpen(false);
      setNewComp({
        propertyName: "",
        address: "",
        rents: { min: 0, max: 0 },
        concessions: ""
      });
      toast({ title: "Comp Added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add comp", variant: "destructive" });
    },
  });

  const handleShowExplanation = (comp: Comp) => {
    setSelectedComp(comp);
    setExplainModalOpen(true);
  };

  const columns = [
    columnHelper.accessor('propertyName', {
      header: 'Property',
      cell: info => (
        <div className="font-medium">
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('address', {
      header: 'Address',
      cell: info => (
        <div className="text-gray-600">
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('rents', {
      header: 'Rents',
      cell: ({ getValue }) => {
        const rents = getValue();
        return (
          <div className="text-sm">
            ${rents?.min || 0} - ${rents?.max || 0}
          </div>
        );
      },
    }),
    columnHelper.accessor('concessions', {
      header: 'Concessions',
      cell: info => (
        <div className="text-sm">
          {info.getValue() || 'None'}
        </div>
      ),
    }),
    columnHelper.accessor('score', {
      header: 'Score',
      cell: ({ row, getValue }) => {
        const score = getValue();
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="font-bold text-lg">{score || 0}</span>
            </div>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'explain',
      header: 'Explain',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleShowExplanation(row.original)}
        >
          <Info className="h-3 w-3" />
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: comps,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleCreateComp = () => {
    if (!newComp.propertyName.trim()) {
      toast({ title: "Property name is required", variant: "destructive" });
      return;
    }
    createCompMutation.mutate(newComp);
  };

  if (!siteId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Site Selected</h3>
            <p className="text-gray-500">
              Select a site from the table above to view and manage comparable properties.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Comparable Properties
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Comp
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Comparable Property</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Property Name (required)</Label>
                  <Input
                    value={newComp.propertyName}
                    onChange={(e) => setNewComp({ ...newComp, propertyName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={newComp.address}
                    onChange={(e) => setNewComp({ ...newComp, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Rent</Label>
                    <Input
                      type="number"
                      value={newComp.rents.min}
                      onChange={(e) => setNewComp({ 
                        ...newComp, 
                        rents: { ...newComp.rents, min: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Max Rent</Label>
                    <Input
                      type="number"
                      value={newComp.rents.max}
                      onChange={(e) => setNewComp({ 
                        ...newComp, 
                        rents: { ...newComp.rents, max: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Concessions</Label>
                  <Input
                    value={newComp.concessions}
                    onChange={(e) => setNewComp({ ...newComp, concessions: e.target.value })}
                    placeholder="e.g., First month free"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateComp} disabled={createCompMutation.isPending}>
                  {createCompMutation.isPending ? "Adding..." : "Add Comp"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading comps...</div>
        ) : comps.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No comparable properties found</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Comp
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

        {/* Explanation Modal */}
        <Dialog open={explainModalOpen} onOpenChange={setExplainModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Score Breakdown - {selectedComp?.propertyName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{selectedComp?.score || 0}/100</div>
                <div className="text-gray-500">Overall Score</div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Amenities (40%)</span>
                  <span className="font-semibold">{selectedComp?.scoreBreakdown?.amenities || 40}/40</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Rent Comparison (30%)</span>
                  <span className="font-semibold">{selectedComp?.scoreBreakdown?.rent || 30}/30</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Concessions (20%)</span>
                  <span className="font-semibold">{selectedComp?.scoreBreakdown?.concessions || 20}/20</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Distance (10%)</span>
                  <span className="font-semibold">{selectedComp?.scoreBreakdown?.distance || 10}/10</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setExplainModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}