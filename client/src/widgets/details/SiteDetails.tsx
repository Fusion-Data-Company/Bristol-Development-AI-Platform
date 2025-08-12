import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, ExternalLink, Calendar, Building, Car, Home, Ruler, Users, Loader2 } from "lucide-react";
import { useState } from "react";

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

interface SiteDetailsProps {
  site: Site;
  onRefresh: () => void;
}

export function SiteDetails({ site, onRefresh }: SiteDetailsProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { toast } = useToast();

  const handleGeocode = async () => {
    setIsGeocoding(true);
    try {
      const result = await apiRequest('/api/sites/geocode', {
        method: 'POST',
        body: { siteIds: [site.id] }
      });

      if (result.updated > 0) {
        toast({
          title: "Geocoding Successful",
          description: `${site.name} has been geocoded`,
        });
        onRefresh();
      } else {
        toast({
          title: "Geocoding Failed",
          description: "Unable to find coordinates for this address",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Geocoding Error",
        description: "Failed to geocode site",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const buildFullAddress = () => {
    const parts = [site.addrLine1, site.addrLine2, site.city, site.state, site.postalCode]
      .filter(Boolean);
    return parts.join(', ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Newest':
        return 'bg-bristol-gold/20 text-bristol-maroon';
      case 'Pipeline':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center justify-between">
        <Badge className={getStatusColor(site.status)}>
          {site.status}
        </Badge>
        {site.sourceUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(site.sourceUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Source
          </Button>
        )}
      </div>

      {/* Address */}
      {buildFullAddress() && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-bristol-maroon mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-bristol-ink">Address</p>
                <p className="text-sm text-bristol-stone mt-1">{buildFullAddress()}</p>
                {site.country && site.country !== 'USA' && (
                  <p className="text-sm text-bristol-stone">{site.country}</p>
                )}
                
                {!site.latitude || !site.longitude ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGeocode}
                    disabled={isGeocoding}
                    className="mt-2"
                  >
                    {isGeocoding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Geocoding...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 mr-2" />
                        Geocode Address
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="mt-2 text-xs text-bristol-stone">
                    {site.latitude?.toFixed(6)}, {site.longitude?.toFixed(6)}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Property Details */}
      <div className="space-y-4">
        {site.acreage && (
          <div className="flex items-center gap-3">
            <Ruler className="w-5 h-5 text-bristol-maroon" />
            <div>
              <p className="text-sm font-medium text-bristol-ink">Site Size</p>
              <p className="text-sm text-bristol-stone">{site.acreage} acres</p>
            </div>
          </div>
        )}

        {site.unitsTotal && (
          <div className="flex items-center gap-3">
            <Building className="w-5 h-5 text-bristol-maroon" />
            <div>
              <p className="text-sm font-medium text-bristol-ink">Total Units</p>
              <p className="text-sm text-bristol-stone">{site.unitsTotal} units</p>
            </div>
          </div>
        )}

        {(site.units1b || site.units2b || site.units3b) && (
          <div className="flex items-center gap-3">
            <Home className="w-5 h-5 text-bristol-maroon" />
            <div>
              <p className="text-sm font-medium text-bristol-ink">Unit Mix</p>
              <div className="text-sm text-bristol-stone space-y-1">
                {site.units1b && <div>1BR: {site.units1b} units</div>}
                {site.units2b && <div>2BR: {site.units2b} units</div>}
                {site.units3b && <div>3BR: {site.units3b} units</div>}
              </div>
            </div>
          </div>
        )}

        {site.avgSf && (
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-bristol-maroon" />
            <div>
              <p className="text-sm font-medium text-bristol-ink">Average Size</p>
              <p className="text-sm text-bristol-stone">{site.avgSf} sq ft</p>
            </div>
          </div>
        )}

        {site.completionYear && (
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-bristol-maroon" />
            <div>
              <p className="text-sm font-medium text-bristol-ink">Completion Year</p>
              <p className="text-sm text-bristol-stone">{site.completionYear}</p>
            </div>
          </div>
        )}

        {site.parkingSpaces && (
          <div className="flex items-center gap-3">
            <Car className="w-5 h-5 text-bristol-maroon" />
            <div>
              <p className="text-sm font-medium text-bristol-ink">Parking</p>
              <p className="text-sm text-bristol-stone">{site.parkingSpaces} spaces</p>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {site.notes && (
        <>
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-bristol-ink mb-2">Notes</p>
            <p className="text-sm text-bristol-stone whitespace-pre-wrap">{site.notes}</p>
          </div>
        </>
      )}

      {/* Metadata */}
      {(site.createdAt || site.updatedAt) && (
        <>
          <div className="border-t pt-4">
            <div className="text-xs text-bristol-stone space-y-1">
              {site.createdAt && (
                <div>Created: {new Date(site.createdAt).toLocaleDateString()}</div>
              )}
              {site.updatedAt && (
                <div>Updated: {new Date(site.updatedAt).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}