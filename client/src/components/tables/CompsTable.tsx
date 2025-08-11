import { useState } from 'react';
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
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { 
  Building,
  DollarSign,
  Home,
  Star,
  MapPin,
  Calendar,
  TrendingUp,
  Eye,
  RotateCw
} from 'lucide-react';
import { type Comp } from '@shared/schema';
import { format } from 'date-fns';

interface CompsTableProps {
  comps: Comp[];
  loading?: boolean;
  onCompView?: (comp: Comp) => void;
  onCompRescore?: (comp: Comp) => void;
}

export function CompsTable({ 
  comps, 
  loading = false,
  onCompView,
  onCompRescore
}: CompsTableProps) {
  const [expandedComp, setExpandedComp] = useState<string | null>(null);

  const getScoreColor = (score: number | null) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    if (score >= 40) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const formatRentRange = (min?: number | null, max?: number | null, avg?: number | null) => {
    if (avg) {
      return `$${avg.toLocaleString()}/mo`;
    }
    if (min && max) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-bristol-maroon"></div>
          Loading comparable properties...
        </div>
      </div>
    );
  }

  if (comps.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No comparable properties found for this site.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search criteria or location.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Rent</TableHead>
              <TableHead>Occupancy</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comps.map((comp) => (
              <>
                <TableRow 
                  key={comp.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setExpandedComp(expandedComp === comp.id ? null : comp.id)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{comp.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {comp.address}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {comp.distance ? (
                      <Badge variant="outline">
                        {comp.distance.toFixed(1)} mi
                      </Badge>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {comp.units ? (
                      <div className="flex items-center gap-1">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        {comp.units}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatRentRange(comp.rentMin, comp.rentMax, comp.rentAvg)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {comp.occupancyRate ? (
                      <div className="flex items-center gap-2">
                        <Progress value={comp.occupancyRate} className="w-16 h-2" />
                        <span className="text-sm font-medium">
                          {comp.occupancyRate.toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getScoreColor(comp.score)}>
                      <Star className="h-3 w-3 mr-1" />
                      {comp.score || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompView?.(comp);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompRescore?.(comp);
                        }}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Expanded Details Row */}
                {expandedComp === comp.id && (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-muted/20">
                      <div className="p-4 space-y-4">
                        {/* Score Breakdown */}
                        {comp.scoreBreakdown && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Score Breakdown
                            </h4>
                            <div className="grid grid-cols-4 gap-2">
                              {Object.entries(comp.scoreBreakdown as Record<string, number>).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <span className="text-muted-foreground capitalize">
                                    {key.replace('_', ' ')}:
                                  </span>
                                  <span className="ml-1 font-medium">{value}/100</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Amenities */}
                        {comp.amenities && Array.isArray(comp.amenities) && comp.amenities.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Amenities</h4>
                            <div className="flex flex-wrap gap-1">
                              {(comp.amenities as string[]).map((amenity, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Concessions */}
                        {comp.concessions && Array.isArray(comp.concessions) && comp.concessions.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Current Concessions</h4>
                            <ul className="text-sm space-y-1">
                              {(comp.concessions as any[]).map((concession, i) => (
                                <li key={i} className="text-muted-foreground">
                                  • {concession.description || concession}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Additional Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {comp.yearBuilt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Built {comp.yearBuilt}
                            </span>
                          )}
                          {comp.dataDate && (
                            <span>
                              Data from {format(new Date(comp.dataDate), 'MMM d, yyyy')}
                            </span>
                          )}
                          {comp.source && (
                            <Badge variant="outline" className="text-xs">
                              Source: {comp.source}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Average Score</div>
          <div className="text-2xl font-bold">
            {comps.filter(c => c.score).length > 0
              ? Math.round(
                  comps.reduce((sum, c) => sum + (c.score || 0), 0) / 
                  comps.filter(c => c.score).length
                )
              : 'N/A'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg Occupancy</div>
          <div className="text-2xl font-bold">
            {comps.filter(c => c.occupancyRate).length > 0
              ? Math.round(
                  comps.reduce((sum, c) => sum + (c.occupancyRate || 0), 0) / 
                  comps.filter(c => c.occupancyRate).length
                ) + '%'
              : 'N/A'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg Rent</div>
          <div className="text-2xl font-bold">
            {comps.filter(c => c.rentAvg).length > 0
              ? '$' + Math.round(
                  comps.reduce((sum, c) => sum + (c.rentAvg || 0), 0) / 
                  comps.filter(c => c.rentAvg).length
                ).toLocaleString()
              : 'N/A'}
          </div>
        </Card>
      </div>
    </div>
  );
}