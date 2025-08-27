import { useState, useRef, useEffect, useMemo } from "react";
import apartmentBackgroundImage from "@assets/thumbnail-1_1755367673202.jpg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Download, Search, MapPin, Filter, Settings2, Loader2, Building, Map, Users } from "lucide-react";
import Chrome from "../components/brand/SimpleChrome";
import { DataBackground } from "../components/EnterpriseBackgrounds";
import { SitesTable } from "../widgets/tables/SitesTableBasic";
import { AddSiteForm } from "../widgets/forms/AddSiteForm";
import { SiteDetails } from "../widgets/details/SiteDetails";
import { SiteMapPreview } from "../widgets/maps/SiteMapPreview";
import { PortfolioAgent } from "@/components/agents/PortfolioAgent";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import type { Site } from "@shared/schema";
// Company seed data
const companySeedData = `status,name,addr_line1,addr_line2,city,state,postal_code,country,latitude,longitude,acreage,units_total,units_1b,units_2b,units_3b,avg_sf,completion_year,parking_spaces,source_url,notes
"Completed","Vista Germantown","515 Madison St","","Nashville","TN","37208","USA","","","","242","","","","834","2012","316","https://www.yourcompany.com/vista-germantown",""
"Completed","1700 Midtown","1700 State St","","Nashville","TN","37203","USA","","","","170","","","","776","2010","227","https://www.yourcompany.com/1700-midtown",""
"Completed","Company Heights","","","Austin","TX","","USA","","","","351","","","","1056","2004","","https://www.yourcompany.com/company-heights","22 acres per page"
"Completed","Company Park Oak Ridge","","","Oak Ridge","TN","","USA","","","","208","","","","916","2007","","https://www.yourcompany.com/company-park-oak-ridge","11.08 acres per page"
"Newest","Mural at Stovehouse","2900 4th Ave NW","","Huntsville","AL","35805","USA","","","","","","","","","","","https://www.yourcompany.com/new",""
"Pipeline","Jewel at Santa Rosa","","","Santa Rosa","FL","","USA","","","","","","","","","","","https://www.yourcompany.com/new",""
"Pipeline","Telegraph Road","","","","","","USA","","","","","","","","","","","https://www.yourcompany.com/new",""
"Newest","The Drake on The Square","","","","","","USA","","","","","","","","","","","https://www.yourcompany.com/new",""`;

// Using Site type from shared schema

export default function Sites() {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();


  // Fetch sites data - API is working fine based on logs
  const { data: sites = [], isLoading, refetch, error } = useQuery<Site[]>({
    queryKey: ['/api/sites', { q: searchQuery, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      statusFilter.forEach(status => params.append('status', status));
      
      const response = await fetch(`/api/sites?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sites');
      }
      return response.json();
    },
    retry: 3 // Allow retries
  });

  // Calculate live metrics from table data - using useMemo for performance
  const liveMetrics = useMemo(() => {
    if (!sites || sites.length === 0) return { totalProperties: 0, totalUnits: 0 };
    
    // Count properties with names in SITE NAME column
    const totalProperties = sites.filter(site => site.name && site.name.trim() !== '').length;
    
    // Sum all TOTAL UNITS column values
    const totalUnits = sites.reduce((sum, site) => sum + (site.unitsTotal || 0), 0);
    
    return { totalProperties, totalUnits };
  }, [sites]);

  // Debugging removed - using direct values

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
      const response = await apiRequest('POST', '/api/sites/import', { csvData: companySeedData });
      const result = await response.json();

      toast({
        title: "Seed Data Loaded",
        description: `${result.inserted} Company sites added, ${result.updated} updated`,
      });

      refetch();
    } catch (error) {
      toast({
        title: "Failed to Load Seed Data",
        description: "Could not load Company seed data",
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
      a.download = 'brand-sites.csv';
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

  const statusOptions = ["Operating", "Pipeline", "Other"];

  return (
    <Chrome>
      <div className="min-h-screen relative z-10">
        {/* Premium Sites Intelligence Header */}
        <div className="bg-white/90 backdrop-blur-md border-b-2 border-brand-maroon/20 shadow-xl">
        <div className="px-8 py-6 relative overflow-hidden">
          {/* Enhanced ambient glow - Static for Header */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-cream/40 via-white/30 to-brand-sky/40"></div>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-brand-maroon/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-gold/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="flex items-center justify-between mb-4 relative">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <Building className="h-12 w-12 text-brand-maroon drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute -inset-2 bg-brand-maroon/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                </div>
                <div>
                  <h1 className="text-5xl font-cinzel font-bold text-brand-ink tracking-wide drop-shadow-lg bg-gradient-to-r from-brand-ink to-brand-maroon bg-clip-text text-transparent">
                    Database
                  </h1>
                  <p className="text-brand-maroon mt-1 font-medium tracking-wider text-lg">
                    Company Development Portfolio Management
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                variant="outline" 
                className="px-8 py-4 text-brand-ink border-brand-maroon/50 bg-gradient-to-br from-white via-brand-cream/30 to-brand-maroon/10 backdrop-blur-sm font-bold text-2xl shadow-xl shadow-brand-maroon/25 hover:shadow-brand-maroon/40 transition-all duration-500 hover:scale-105 border-2"
              >
                <Building className="w-6 h-6 mr-3 text-brand-maroon" />
                {liveMetrics.totalProperties} Properties
              </Badge>
              <Badge 
                variant="outline" 
                className="px-8 py-4 text-brand-maroon border-brand-gold/50 bg-gradient-to-br from-brand-gold/20 via-brand-cream/40 to-white backdrop-blur-sm font-bold text-xl shadow-xl shadow-brand-gold/25 hover:shadow-brand-gold/40 transition-all duration-500 hover:scale-105 border-2"
              >
                <Users className="w-6 h-6 mr-3 text-brand-gold" />
                {liveMetrics.totalUnits.toLocaleString()} Total Units
              </Badge>
            </div>
          </div>

          {/* Premium Action Toolbar with Light Theme */}
          <div className="flex flex-wrap items-center gap-4 relative">
            <Button 
              onClick={() => setShowAddForm(true)} 
              className="relative group overflow-hidden bg-gradient-to-r from-brand-maroon via-red-600 to-brand-maroon text-white font-bold px-6 py-3 rounded-xl shadow-2xl shadow-brand-maroon/40 hover:shadow-brand-maroon/60 transition-all duration-500 border-2 border-brand-gold/30 hover:border-brand-gold/60 hover:scale-110 transform hover:rotate-1"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-gold/20 via-yellow-400/20 to-brand-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl blur-sm"></div>
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="relative flex items-center">
                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-extrabold text-lg tracking-wide">Add Site</span>
              </div>
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
              className="relative group overflow-hidden border-2 border-green-400 text-green-700 hover:text-white bg-gradient-to-r from-green-100 via-emerald-100 to-green-100 hover:from-green-500 hover:via-emerald-500 hover:to-green-500 backdrop-blur-sm shadow-xl shadow-green-500/20 hover:shadow-green-500/40 transition-all duration-500 font-bold px-4 py-2.5 rounded-lg hover:scale-105"
            >
              {/* Upload arrow animation */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full animate-bounce"></div>
              </div>
              <div className="relative flex items-center">
                {isImporting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Upload className="w-5 h-5 mr-2 group-hover:-translate-y-1 transition-transform duration-300" />}
                Import CSV
              </div>
            </Button>

            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              className="relative group overflow-hidden border-2 border-orange-400 text-orange-700 hover:text-white bg-gradient-to-r from-orange-100 via-yellow-100 to-orange-100 hover:from-orange-500 hover:via-yellow-500 hover:to-orange-500 backdrop-blur-sm shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-500 font-bold px-4 py-2.5 rounded-lg hover:scale-105"
            >
              {/* Download arrow animation */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full animate-bounce"></div>
              </div>
              <div className="relative flex items-center">
                <Download className="w-5 h-5 mr-2 group-hover:translate-y-1 transition-transform duration-300" />
                Export CSV
              </div>
            </Button>

            <Button 
              variant="outline" 
              onClick={handleLoadSeed}
              disabled={isImporting}
              className="relative group overflow-hidden border-2 border-brand-gold text-brand-maroon hover:text-white bg-gradient-to-r from-brand-gold/10 via-yellow-200/20 to-brand-gold/10 hover:from-brand-gold hover:via-yellow-400 hover:to-brand-gold backdrop-blur-sm shadow-2xl shadow-brand-gold/30 hover:shadow-brand-gold/50 transition-all duration-500 font-bold px-5 py-2.5 rounded-lg hover:scale-105"
            >
              {/* Sparkle effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute top-1 left-2 w-1 h-1 bg-white rounded-full animate-ping"></div>
                <div className="absolute bottom-1 right-2 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute top-2 right-4 w-0.5 h-0.5 bg-white rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
              </div>
              <div className="relative flex items-center">
                {isImporting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Settings2 className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />}
                Load Seed Data
              </div>
            </Button>

            <Button 
              variant="outline" 
              onClick={handleGeocodeAll}
              disabled={isGeocoding}
              className="relative group overflow-hidden border-2 border-purple-400 text-purple-700 hover:text-white bg-gradient-to-r from-purple-100 via-blue-100 to-purple-100 hover:from-purple-600 hover:via-blue-600 hover:to-purple-600 backdrop-blur-sm shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-500 font-bold px-4 py-2.5 rounded-lg hover:scale-105"
            >
              {/* Pulsing border effect */}
              <div className="absolute inset-0 rounded-lg border-2 border-purple-400 opacity-75 group-hover:animate-pulse"></div>
              <div className="relative flex items-center">
                {isGeocoding ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <MapPin className="w-5 h-5 mr-2 group-hover:animate-bounce" />}
                Geocode All
              </div>
            </Button>

            {/* Premium Search with Light Theme */}
            <div className="flex-1 max-w-xl">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brand-maroon/60 w-5 h-5 group-focus-within:text-brand-maroon transition-colors" />
                <Input
                  placeholder="Search Company properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white/80 border-brand-maroon/30 text-brand-ink placeholder:text-brand-stone focus:border-brand-maroon focus:ring-brand-maroon/20 backdrop-blur-sm rounded-xl shadow-lg shadow-brand-maroon/10 hover:shadow-brand-maroon/20 transition-all duration-300"
                />
              </div>
            </div>

            {/* Premium Status Filters with Light Theme */}
            <div className="flex gap-2">
              {statusOptions.map(status => (
                <Badge
                  key={status}
                  variant="outline"
                  className={`cursor-pointer px-4 py-2 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm border-2 hover:scale-105 ${
                    statusFilter.includes(status) 
                      ? 'bg-gradient-to-r from-brand-maroon to-brand-maroon/90 text-white border-brand-maroon shadow-xl shadow-brand-maroon/30 hover:shadow-brand-maroon/50' 
                      : 'bg-white/60 text-brand-ink border-brand-maroon/30 hover:bg-brand-maroon/5 hover:text-brand-maroon hover:border-brand-maroon/60 shadow-lg shadow-brand-maroon/10'
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

        {/* Main Content Area - With Background Starting Below Hero Header */}
        <DataBackground>
        {/* Background Image Layer - Positioned below header */}
        <div 
          className="fixed top-[200px] left-0 right-0 bottom-0 bg-cover bg-center bg-no-repeat z-0"
          style={{
            backgroundImage: `url(${apartmentBackgroundImage})`,
            filter: 'brightness(0.85) contrast(1.1)',
            imageRendering: 'crisp-edges',
            backgroundAttachment: 'fixed'
          }}
        />
        {/* Background Overlay for Content Readability - Positioned below header */}
        <div className="fixed top-[200px] left-0 right-0 bottom-0 bg-gradient-to-br from-brand-cream/70 via-white/60 to-brand-sky/50 z-0" />

        {/* Premium Content Area */}
        <div className="flex-1 p-8 relative mb-16 z-10">
          {/* Enhanced ambient glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-maroon/15 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-gold/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-brand-sky/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '3s'}}></div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative pb-4 min-h-[80vh]">
            {/* Premium Sites Database Table */}
            <Card className="xl:col-span-2 bg-white/85 border-brand-maroon/30 backdrop-blur-lg shadow-2xl shadow-brand-maroon/20 hover:shadow-brand-maroon/30 transition-all duration-500">
              <CardHeader className="pb-4 bg-gradient-to-r from-white/90 to-brand-cream/60 border-b-2 border-brand-maroon/30 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="relative group">
                    <Building className="h-6 w-6 text-brand-maroon group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute -inset-2 bg-brand-maroon/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                  </div>
                  <CardTitle className="font-cinzel text-brand-ink text-xl tracking-wide bg-gradient-to-r from-brand-ink to-brand-maroon bg-clip-text text-transparent">
                    Company Portfolio Database
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className="ml-auto px-4 py-2 text-brand-maroon border-brand-maroon/40 bg-gradient-to-r from-brand-cream to-white font-bold shadow-lg shadow-brand-maroon/20"
                  >
                    {liveMetrics.totalProperties} Properties
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2 bg-gradient-to-br from-white/90 to-brand-cream/40 backdrop-blur-sm">
                <SitesTable 
                  data={(sites || []) as any[]}
                  isLoading={isLoading}
                  onSelectSite={setSelectedSite as any}
                  selectedSite={selectedSite as any}
                  onRefresh={refetch}
                />
              </CardContent>
            </Card>

            {/* Premium Details & Analytics Sidebar */}
            <div className="space-y-6">
              {/* Site Details Card */}
              <Card className="bg-white/85 border-brand-maroon/30 backdrop-blur-lg shadow-2xl shadow-brand-maroon/20 hover:shadow-brand-maroon/30 transition-all duration-500">
                <CardHeader className="pb-4 bg-gradient-to-r from-white/90 to-brand-cream/60 border-b-2 border-brand-maroon/30 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="relative group">
                      <Building className="h-5 w-5 text-brand-maroon group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute -inset-2 bg-brand-maroon/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                    </div>
                    <CardTitle className="font-cinzel text-brand-ink text-lg bg-gradient-to-r from-brand-ink to-brand-maroon bg-clip-text text-transparent">
                      {selectedSite ? selectedSite.name : 'Property Details'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="bg-gradient-to-br from-white/90 to-brand-cream/40 text-brand-ink backdrop-blur-sm">
                  {selectedSite ? (
                    <SiteDetails site={selectedSite as any} onRefresh={refetch} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="relative group">
                        <Building className="h-16 w-16 text-brand-stone/40 group-hover:text-brand-maroon/60 transition-colors duration-300" />
                        <div className="absolute -inset-3 bg-brand-stone/10 rounded-full blur-xl group-hover:bg-brand-maroon/10 transition-all duration-300"></div>
                      </div>
                      <p className="text-brand-stone font-medium text-center">Select a property to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Company Portfolio Analysis Agent */}
              <div>
                <PortfolioAgent 
                  selectedSite={selectedSite}
                  portfolioData={sites || []}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Premium Add Site Modal with Light Theme */}
        <Sheet open={showAddForm} onOpenChange={setShowAddForm}>
          <SheetContent 
            side="right" 
            className="w-[600px] sm:max-w-[600px] bg-gradient-to-br from-white via-brand-cream/50 to-white border-l-2 border-brand-maroon/30 backdrop-blur-md shadow-2xl"
          >
            <SheetHeader className="pb-6 border-b-2 border-brand-maroon/20">
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <Plus className="h-6 w-6 text-brand-maroon group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute -inset-2 bg-brand-maroon/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                </div>
                <SheetTitle className="font-cinzel text-brand-ink text-2xl tracking-wide bg-gradient-to-r from-brand-ink to-brand-maroon bg-clip-text text-transparent">
                  Add New Property
                </SheetTitle>
              </div>
            </SheetHeader>
            <div className="py-6">
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
        </DataBackground>
      </div>
      </div>
    </Chrome>
  );
}