import { useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building,
  MapPin,
  Users,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Site {
  id: string;
  name: string;
  status?: string;
  addrLine1?: string;
  city?: string;
  state?: string;
  unitsTotal?: number;
  completionYear?: number;
  latitude?: number;
  longitude?: number;
  notes?: string;
  updatedAt?: string;
}

interface SitesTableProps {
  data: Site[];
  isLoading?: boolean;
  onSelectSite?: (site: Site) => void;
  selectedSite?: Site | null;
  onRefresh?: () => void;
}

export function SitesTable({
  data,
  isLoading = false,
  onSelectSite,
  selectedSite,
  onRefresh
}: SitesTableProps) {
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortColumn as keyof Site] || "";
    const bValue = b[sortColumn as keyof Site] || "";
    
    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Operating":
        return "bg-green-100 text-green-800 border-green-300";
      case "Pipeline":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "Newest":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Building className="h-8 w-8 mx-auto mb-4 text-bristol-maroon/40 animate-pulse" />
        <p className="text-bristol-stone">Loading portfolio data...</p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="p-8 text-center">
        <Building className="h-12 w-12 mx-auto mb-4 text-bristol-maroon/40" />
        <p className="text-lg font-medium text-bristol-stone">No sites found</p>
        <p className="text-sm text-bristol-stone/60">Add your first property to get started</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <Table>
        <TableHeader className="bg-bristol-cream/30">
          <TableRow className="border-b border-bristol-maroon/20">
            <TableHead 
              className="font-bold text-bristol-ink cursor-pointer hover:bg-bristol-cream/50 transition-colors"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Property Name
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead 
              className="font-bold text-bristol-ink cursor-pointer hover:bg-bristol-cream/50 transition-colors"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center gap-2">
                Status
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead className="font-bold text-bristol-ink">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </div>
            </TableHead>
            <TableHead 
              className="font-bold text-bristol-ink cursor-pointer hover:bg-bristol-cream/50 transition-colors text-right"
              onClick={() => handleSort("unitsTotal")}
            >
              <div className="flex items-center justify-end gap-2">
                <Users className="h-4 w-4" />
                Units
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead 
              className="font-bold text-bristol-ink cursor-pointer hover:bg-bristol-cream/50 transition-colors text-right"
              onClick={() => handleSort("completionYear")}
            >
              <div className="flex items-center justify-end gap-2">
                <Calendar className="h-4 w-4" />
                Year
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
            <TableHead className="font-bold text-bristol-ink w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((site) => (
            <TableRow
              key={site.id}
              className={`cursor-pointer hover:bg-bristol-cream/30 transition-colors border-b border-bristol-maroon/10 ${
                selectedSite?.id === site.id ? "bg-bristol-cream/50" : ""
              }`}
              onClick={() => onSelectSite?.(site)}
            >
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="text-bristol-ink font-semibold">{site.name}</span>
                  {site.notes && (
                    <span className="text-xs text-bristol-stone/60 mt-1 line-clamp-1">
                      {site.notes}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(site.status)} font-medium`}>
                  {site.status || "Other"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  {site.addrLine1 && (
                    <span className="text-bristol-ink text-sm">{site.addrLine1}</span>
                  )}
                  {(site.city || site.state) && (
                    <span className="text-bristol-stone/70 text-xs">
                      {[site.city, site.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {site.latitude && site.longitude && (
                    <span className="text-bristol-stone/50 text-xs mt-1">
                      {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-semibold text-bristol-ink">
                  {site.unitsTotal?.toLocaleString() || "N/A"}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-bristol-ink">
                  {site.completionYear || "N/A"}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSite?.(site);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add edit functionality here
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Property
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add delete functionality here
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Property
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

export default SitesTable;