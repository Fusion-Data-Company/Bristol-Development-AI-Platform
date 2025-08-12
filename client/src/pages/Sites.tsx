import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Download, Search, MapPin, Filter, Settings2, Loader2, Building, Map } from "lucide-react";
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
      <div className="h-screen flex flex-col bg-gradient-to-br from-bristol-ink via-bristol-maroon/10 to-bristol-ink">
        {/* Upgraded Sites Intelligence Header */}
        <div className="p-8 border-b-2 border-bristol-gold/20 bg-gradient-to-r from-bristol-ink via-bristol-maroon/10 to-bristol-ink backdrop-blur-sm relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,_theme(colors.bristol.gold)_2px,_transparent_0)] bg-[size:32px_32px]"></div>
          </div>
          
          <div className="flex items-center justify-between mb-6 relative">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Building className="h-10 w-10 text-bristol-gold drop-shadow-lg" />
                  <div className="absolute -inset-1 bg-bristol-gold/20 rounded-full blur-sm animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-4xl font-cinzel font-bold text-bristol-fog tracking-wide drop-shadow-lg">
                    Sites Intelligence
                  </h1>
                  <p className="text-bristol-gold mt-1 font-medium tracking-wider">
                    Bristol Development Portfolio Management
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                variant="outline" 
                className="px-4 py-2 text-bristol-fog border-bristol-gold/50 bg-bristol-gold/10 backdrop-blur-sm font-bold text-lg"
              >
                {sites.length} Properties
              </Badge>
              <Badge 
                variant="outline" 
                className="px-4 py-2 text-bristol-gold border-bristol-gold/50 bg-bristol-ink/50 backdrop-blur-sm font-medium"
              >
                46 Total Units: 9,953
              </Badge>
            </div>
          </div>

          {/* Premium Action Toolbar */}
          <div className="flex flex-wrap items-center gap-4 relative">
            <Button 
              onClick={() => setShowAddForm(true)} 
              className="bg-gradient-to-r from-bristol-gold to-bristol-gold/80 text-bristol-ink hover:from-bristol-gold/90 hover:to-bristol-gold/70 font-bold shadow-xl shadow-bristol-gold/25 hover:shadow-bristol-gold/40 transition-all duration-300"
            >
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
              className="border-bristol-fog/30 text-bristol-fog hover:bg-bristol-fog/10 hover:border-bristol-fog/50 backdrop-blur-sm transition-all duration-300"
            >
              {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Import CSV
            </Button>

            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              className="border-bristol-fog/30 text-bristol-fog hover:bg-bristol-fog/10 hover:border-bristol-fog/50 backdrop-blur-sm transition-all duration-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>

            <Button 
              variant="outline" 
              onClick={handleLoadSeed}
              disabled={isImporting}
              className="border-bristol-gold/50 text-bristol-gold hover:bg-bristol-gold/20 hover:border-bristol-gold backdrop-blur-sm shadow-lg transition-all duration-300"
            >
              {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings2 className="w-4 h-4 mr-2" />}
              Load Seed
            </Button>

            <Button 
              variant="outline" 
              onClick={handleGeocodeAll}
              disabled={isGeocoding}
              className="border-bristol-fog/30 text-bristol-fog hover:bg-bristol-fog/10 hover:border-bristol-fog/50 backdrop-blur-sm transition-all duration-300"
            >
              {isGeocoding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
              Geocode All
            </Button>

            {/* Premium Search */}
            <div className="flex-1 max-w-md">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-bristol-gold w-5 h-5 group-focus-within:text-bristol-gold/80 transition-colors" />
                <Input
                  placeholder="Search Bristol properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-bristol-ink/60 border-bristol-gold/30 text-bristol-fog placeholder:text-bristol-stone focus:border-bristol-gold focus:ring-bristol-gold/20 backdrop-blur-sm rounded-xl transition-all duration-300"
                />
              </div>
            </div>

            {/* Premium Status Filters */}
            <div className="flex gap-2">
              {statusOptions.map(status => (
                <Badge
                  key={status}
                  variant="outline"
                  className={`cursor-pointer px-3 py-2 rounded-lg font-medium transition-all duration-300 backdrop-blur-sm ${
                    statusFilter.includes(status) 
                      ? 'bg-bristol-gold text-bristol-ink border-bristol-gold shadow-lg shadow-bristol-gold/25 hover:shadow-bristol-gold/40' 
                      : 'bg-bristol-ink/40 text-bristol-fog border-bristol-fog/30 hover:bg-bristol-gold/20 hover:text-bristol-gold hover:border-bristol-gold/50'
                  }`}
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

        {/* Premium Content Area */}
        <div className="flex-1 p-8 overflow-hidden">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-full">
            {/* Premium Sites Database Table */}
            <Card className="xl:col-span-2 overflow-hidden bg-bristol-ink/80 border-bristol-gold/20 backdrop-blur-md shadow-2xl">
              <CardHeader className="pb-4 bg-gradient-to-r from-bristol-ink to-bristol-maroon/10 border-b border-bristol-gold/20">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Building className="h-6 w-6 text-bristol-gold" />
                    <div className="absolute -inset-1 bg-bristol-gold/20 rounded blur-sm"></div>
                  </div>
                  <CardTitle className="font-cinzel text-bristol-fog text-xl tracking-wide">
                    Bristol Portfolio Database
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className="ml-auto px-3 py-1 text-bristol-gold border-bristol-gold/50 bg-bristol-gold/10 font-bold"
                  >
                    46 Properties
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-full bg-bristol-ink/60">
                <SitesTable 
                  data={sites} 
                  isLoading={isLoading}
                  onSelectSite={setSelectedSite}
                  selectedSite={selectedSite}
                  onRefresh={refetch}
                />
              </CardContent>
            </Card>

            {/* Premium Details & Analytics Sidebar */}
            <div className="space-y-6">
              {/* Site Details Card */}
              <Card className="bg-bristol-ink/80 border-bristol-gold/20 backdrop-blur-md shadow-2xl">
                <CardHeader className="pb-4 bg-gradient-to-r from-bristol-ink to-bristol-maroon/10 border-b border-bristol-gold/20">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Building className="h-5 w-5 text-bristol-gold" />
                      <div className="absolute -inset-1 bg-bristol-gold/20 rounded blur-sm"></div>
                    </div>
                    <CardTitle className="font-cinzel text-bristol-fog text-lg">
                      {selectedSite ? selectedSite.name : 'Property Details'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="bg-bristol-ink/60 text-bristol-fog">
                  {selectedSite ? (
                    <SiteDetails site={selectedSite} onRefresh={refetch} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <div className="relative">
                        <Building className="h-12 w-12 text-bristol-stone/50" />
                        <div className="absolute -inset-1 bg-bristol-stone/10 rounded-full blur-sm"></div>
                      </div>
                      <p className="text-bristol-stone font-medium">Select a property to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Map Preview Card */}
              <Card className="bg-bristol-ink/80 border-bristol-gold/20 backdrop-blur-md shadow-2xl">
                <CardHeader className="pb-4 bg-gradient-to-r from-bristol-ink to-bristol-maroon/10 border-b border-bristol-gold/20">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Map className="h-5 w-5 text-bristol-gold" />
                      <div className="absolute -inset-1 bg-bristol-gold/20 rounded blur-sm"></div>
                    </div>
                    <CardTitle className="font-cinzel text-bristol-fog text-lg">
                      Location Intelligence
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="bg-bristol-ink/60">
                  <SiteMapPreview site={selectedSite} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Premium Add Site Modal */}
        <Sheet open={showAddForm} onOpenChange={setShowAddForm}>
          <SheetContent 
            side="right" 
            className="w-[600px] sm:max-w-[600px] bg-gradient-to-br from-bristol-ink via-bristol-maroon/10 to-bristol-ink border-l-2 border-bristol-gold/30 backdrop-blur-md"
          >
            <SheetHeader className="pb-6 border-b border-bristol-gold/20">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Plus className="h-6 w-6 text-bristol-gold" />
                  <div className="absolute -inset-1 bg-bristol-gold/20 rounded blur-sm"></div>
                </div>
                <SheetTitle className="font-cinzel text-bristol-fog text-2xl tracking-wide">
                  Add New Bristol Property
                </SheetTitle>
              </div>
            </SheetHeader>
            <div className="mt-8 text-bristol-fog">
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