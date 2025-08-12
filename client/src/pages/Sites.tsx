import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Download, Search, MapPin, Filter, Settings2, Loader2 } from "lucide-react";
import Chrome from "../components/brand/SimpleChrome";
import { SitesTable } from "../widgets/tables/SitesTableNew";
import { AddSiteForm } from "../widgets/forms/AddSiteForm";
import { SiteDetails } from "../widgets/details/SiteDetails";
import { SiteMapPreview } from "../widgets/maps/SiteMapPreview";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
// Bristol seed data
const bristolSeedData = `status,name,addr_line1,addr_line2,city,state,postal_code,country,latitude,longitude,acreage,units_total,units_1b,units_2b,units_3b,avg_sf,completion_year,parking_spaces,source_url,notes
"Completed","Vista Germantown","515 Madison St","","Nashville","TN","37208","USA","","","","242","","","","834","2012","316","https://www.bristoldevelopment.com/vista-germantown",""
"Completed","1700 Midtown","1700 State St","","Nashville","TN","37203","USA","","","","170","","","","776","2010","227","https://www.bristoldevelopment.com/1700-midtown",""
"Completed","Bristol Heights","","","Austin","TX","","USA","","","","351","","","","1056","2004","","https://www.bristoldevelopment.com/bristol-heights","22 acres per page"
"Completed","Bristol Park Oak Ridge","","","Oak Ridge","TN","","USA","","","","208","","","","916","2007","","https://www.bristoldevelopment.com/bristol-park-oak-ridge","11.08 acres per page"
"Newest","Mural at Stovehouse","2900 4th Ave NW","","Huntsville","AL","35805","USA","","","","","","","","","","","https://www.bristoldevelopment.com/new",""
"Pipeline","Jewel at Santa Rosa","","","Santa Rosa","FL","","USA","","","","","","","","","","","https://www.bristoldevelopment.com/new",""
"Pipeline","Telegraph Road","","","","","","USA","","","","","","","","","","","https://www.bristoldevelopment.com/new",""
"Newest","The Drake on The Square","","","","","","USA","","","","","","","","","","","https://www.bristoldevelopment.com/new",""`;

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

export default function Sites() {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: sites = [], isLoading, refetch } = useQuery<Site[]>({
    queryKey: ['/api/sites', { q: searchQuery, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      statusFilter.forEach(status => params.append('status', status));
      
      const response = await fetch(`/api/sites?${params}`);
      if (!response.ok) throw new Error('Failed to fetch sites');
      return response.json();
    }
  });

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const csvData = await file.text();
      const response = await apiRequest('POST', '/api/sites/import', { csvData });
      const result = await response.json();

      toast({
        title: "Import Complete",
        description: `${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped`,
      });

      refetch();
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import CSV data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLoadSeed = async () => {
    setIsImporting(true);
    try {
      const response = await apiRequest('POST', '/api/sites/import', { csvData: bristolSeedData });
      const result = await response.json();

      toast({
        title: "Seed Data Loaded",
        description: `${result.inserted} Bristol sites added, ${result.updated} updated`,
      });

      refetch();
    } catch (error) {
      toast({
        title: "Failed to Load Seed Data",
        description: "Could not load Bristol seed data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/sites/export.csv');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'bristol-sites.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: "Sites data exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export CSV data",
        variant: "destructive",
      });
    }
  };

  const handleGeocodeAll = async () => {
    setIsGeocoding(true);
    try {
      const response = await apiRequest('POST', '/api/sites/geocode', {});
      const result = await response.json();

      toast({
        title: "Geocoding Complete",
        description: `${result.updated} sites geocoded, ${result.failed} failed`,
      });

      refetch();
    } catch (error) {
      toast({
        title: "Geocoding Failed",
        description: "Failed to geocode sites",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const statusOptions = ["Newest", "Completed", "Pipeline", "Other"];

  return (
    <Chrome>
      <div className="h-screen flex flex-col bg-gradient-to-br from-bristol-cream via-white to-bristol-sky/10">
        {/* Header */}
        <div className="p-6 border-b bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-cinzel font-bold text-bristol-ink">Sites Intelligence</h1>
              <p className="text-bristol-stone mt-1">Bristol Development Portfolio Management</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                {sites.length} Sites
              </Badge>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setShowAddForm(true)} className="bg-bristol-maroon hover:bg-bristol-maroon/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Site
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
            
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Import CSV
            </Button>

            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>

            <Button 
              variant="outline" 
              onClick={handleLoadSeed}
              disabled={isImporting}
              className="border-bristol-gold text-bristol-gold hover:bg-bristol-gold/10"
            >
              {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings2 className="w-4 h-4 mr-2" />}
              Load Seed
            </Button>

            <Button 
              variant="outline" 
              onClick={handleGeocodeAll}
              disabled={isGeocoding}
            >
              {isGeocoding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
              Geocode All
            </Button>

            {/* Search */}
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search sites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-1">
              {statusOptions.map(status => (
                <Badge
                  key={status}
                  variant={statusFilter.includes(status) ? "default" : "secondary"}
                  className={`cursor-pointer ${statusFilter.includes(status) ? 'bg-bristol-maroon hover:bg-bristol-maroon/90' : ''}`}
                  onClick={() => {
                    setStatusFilter(prev => 
                      prev.includes(status) 
                        ? prev.filter(s => s !== status)
                        : [...prev, status]
                    );
                  }}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
            {/* Table */}
            <Card className="xl:col-span-2 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="font-cinzel text-bristol-ink">Sites Database</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <SitesTable 
                  data={sites} 
                  isLoading={isLoading}
                  onSelectSite={setSelectedSite}
                  selectedSite={selectedSite}
                  onRefresh={refetch}
                />
              </CardContent>
            </Card>

            {/* Details & Map */}
            <div className="space-y-6">
              {/* Site Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-cinzel text-bristol-ink">
                    {selectedSite ? selectedSite.name : 'Site Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSite ? (
                    <SiteDetails site={selectedSite} onRefresh={refetch} />
                  ) : (
                    <p className="text-bristol-stone">Select a site to view details</p>
                  )}
                </CardContent>
              </Card>

              {/* Map Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-cinzel text-bristol-ink">Map Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <SiteMapPreview site={selectedSite} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Add Site Modal */}
        <Sheet open={showAddForm} onOpenChange={setShowAddForm}>
          <SheetContent side="right" className="w-[600px] sm:max-w-[600px]">
            <SheetHeader>
              <SheetTitle className="font-cinzel text-bristol-ink">Add New Site</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <AddSiteForm 
                onSuccess={() => {
                  setShowAddForm(false);
                  refetch();
                }}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </Chrome>
  );
}