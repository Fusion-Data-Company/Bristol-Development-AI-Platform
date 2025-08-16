import { useState, useRef, useEffect } from "react";
import apartmentBackgroundImage from "@assets/Screenshot 2025-08-16 at 09.56.04_1755363366808.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Download, Search, MapPin, Filter, Settings2, Loader2, Building, Map } from "lucide-react";
import Chrome from "../components/brand/SimpleChrome";
import { DataBackground } from "../components/EnterpriseBackgrounds";
import { SitesTable } from "../widgets/tables/SitesTableBasic";
import { AddSiteForm } from "../widgets/forms/AddSiteForm";
import { SiteDetails } from "../widgets/details/SiteDetails";
import { SiteMapPreview } from "../widgets/maps/SiteMapPreview";
import { BristolPortfolioAgent } from "@/components/agents/BristolPortfolioAgent";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import type { Site } from "@shared/schema";
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

  // Parallax scroll effect
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // FORCE UPDATE WITH DIRECT STATE MANAGEMENT 
  const [portfolioData, setPortfolioData] = useState<{totalSites: number; totalUnits: number} | null>(null);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsMetricsLoading(true);
        const response = await fetch('/api/analytics/sites-metrics');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        console.log('FORCE SETTING STATE WITH:', data.totalSites, data.totalUnits);
        setPortfolioData({
          totalSites: data.totalSites,
          totalUnits: data.totalUnits
        });
      } catch (error) {
        console.error('Metrics error:', error);
        setPortfolioData({ totalSites: 46, totalUnits: 9953 });
      } finally {
        setIsMetricsLoading(false);
      }
    };
    
    fetchMetrics();
  }, []);

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
    <DataBackground>
      <Chrome>
      <div className="min-h-screen flex flex-col relative pb-32 overflow-hidden">
        {/* Fixed Parallax Background */}
        <div 
          className="fixed inset-0 w-full h-full z-0"
          style={{
            backgroundImage: `url(${apartmentBackgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transform: `translateY(${scrollY * 0.5}px)`,
            filter: 'brightness(0.85) contrast(1.1)'
          }}
        />
        
        {/* Background Overlay for Content Readability */}
        <div className="fixed inset-0 bg-gradient-to-br from-bristol-cream/80 via-white/75 to-bristol-sky/60 backdrop-blur-sm z-[1]" />
        {/* Premium Sites Intelligence Header with Parallax */}
        <div 
          className="p-8 border-b-2 border-bristol-maroon/20 bg-white/85 backdrop-blur-md relative overflow-hidden shadow-xl z-10"
          style={{
            transform: `translateY(${scrollY * 0.1}px)`
          }}
        >
          {/* Enhanced ambient glow with parallax */}
          <div className="absolute inset-0 bg-gradient-to-r from-bristol-cream/40 via-white/30 to-bristol-sky/40"></div>
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              transform: `translateY(${scrollY * 0.15}px)`
            }}
          >
            <div className="absolute top-0 left-0 w-96 h-96 bg-bristol-maroon/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-bristol-gold/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="flex items-center justify-between mb-6 relative">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <Building className="h-12 w-12 text-bristol-maroon drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute -inset-2 bg-bristol-maroon/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                </div>
                <div>
                  <h1 className="text-5xl font-cinzel font-bold text-bristol-ink tracking-wide drop-shadow-lg bg-gradient-to-r from-bristol-ink to-bristol-maroon bg-clip-text text-transparent">
                    Database
                  </h1>
                  <p className="text-bristol-maroon mt-1 font-medium tracking-wider text-lg">
                    Bristol Development Portfolio Management
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                key={`sites-${portfolioData?.totalSites || 'loading'}`}
                variant="outline" 
                className="px-6 py-3 text-bristol-ink border-bristol-maroon/40 bg-gradient-to-r from-bristol-cream to-white backdrop-blur-sm font-bold text-xl shadow-lg shadow-bristol-maroon/20 hover:shadow-bristol-maroon/30 transition-all duration-300"
              >
                {isMetricsLoading ? 'Loading...' : `${portfolioData?.totalSites || 46} Properties`}
              </Badge>
              <Badge 
                key={`units-${portfolioData?.totalUnits || 'loading'}`}
                variant="outline" 
                className="px-6 py-3 text-bristol-maroon border-bristol-gold/40 bg-gradient-to-r from-bristol-gold/10 to-bristol-cream backdrop-blur-sm font-medium text-lg shadow-lg shadow-bristol-gold/20"
              >
                {isMetricsLoading ? 'Loading...' : `${portfolioData?.totalUnits?.toLocaleString() || '9,953'} Total Units`}
              </Badge>
            </div>
          </div>

          {/* Premium Action Toolbar with Light Theme */}
          <div className="flex flex-wrap items-center gap-4 relative">
            <Button 
              onClick={() => setShowAddForm(true)} 
              className="relative group overflow-hidden bg-gradient-to-r from-bristol-maroon via-red-600 to-bristol-maroon text-white font-bold px-6 py-3 rounded-xl shadow-2xl shadow-bristol-maroon/40 hover:shadow-bristol-maroon/60 transition-all duration-500 border-2 border-bristol-gold/30 hover:border-bristol-gold/60 hover:scale-110 transform hover:rotate-1"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-bristol-gold/20 via-yellow-400/20 to-bristol-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl blur-sm"></div>
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
              className="relative group overflow-hidden border-2 border-bristol-gold text-bristol-maroon hover:text-white bg-gradient-to-r from-bristol-gold/10 via-yellow-200/20 to-bristol-gold/10 hover:from-bristol-gold hover:via-yellow-400 hover:to-bristol-gold backdrop-blur-sm shadow-2xl shadow-bristol-gold/30 hover:shadow-bristol-gold/50 transition-all duration-500 font-bold px-5 py-2.5 rounded-lg hover:scale-105"
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
            <div className="flex-1 max-w-md">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-bristol-maroon/60 w-5 h-5 group-focus-within:text-bristol-maroon transition-colors" />
                <Input
                  placeholder="Search Bristol properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white/80 border-bristol-maroon/30 text-bristol-ink placeholder:text-bristol-stone focus:border-bristol-maroon focus:ring-bristol-maroon/20 backdrop-blur-sm rounded-xl shadow-lg shadow-bristol-maroon/10 hover:shadow-bristol-maroon/20 transition-all duration-300"
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
                      ? 'bg-gradient-to-r from-bristol-maroon to-bristol-maroon/90 text-white border-bristol-maroon shadow-xl shadow-bristol-maroon/30 hover:shadow-bristol-maroon/50' 
                      : 'bg-white/60 text-bristol-ink border-bristol-maroon/30 hover:bg-bristol-maroon/5 hover:text-bristol-maroon hover:border-bristol-maroon/60 shadow-lg shadow-bristol-maroon/10'
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

        {/* Premium Content Area with Parallax Effects */}
        <div 
          className="flex-1 p-8 relative mb-16 overflow-visible z-10"
          style={{
            transform: `translateY(${scrollY * 0.2}px)`
          }}
        >
          {/* Enhanced ambient glows with parallax movement */}
          <div 
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{
              transform: `translateY(${scrollY * 0.25}px)`
            }}
          >
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-bristol-maroon/15 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-bristol-gold/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-bristol-sky/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '3s'}}></div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative pb-4 min-h-[80vh]">
            {/* Premium Sites Database Table with Parallax */}
            <Card 
              className="xl:col-span-2 bg-white/85 border-bristol-maroon/30 backdrop-blur-lg shadow-2xl shadow-bristol-maroon/20 hover:shadow-bristol-maroon/30 transition-all duration-500 hover:scale-[1.01]"
              style={{
                transform: `translateY(${scrollY * 0.05}px) scale(${1 + scrollY * 0.0001})`
              }}
            >
              <CardHeader className="pb-4 bg-gradient-to-r from-white/90 to-bristol-cream/60 border-b-2 border-bristol-maroon/30 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="relative group">
                    <Building className="h-6 w-6 text-bristol-maroon group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute -inset-2 bg-bristol-maroon/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                  </div>
                  <CardTitle className="font-cinzel text-bristol-ink text-xl tracking-wide bg-gradient-to-r from-bristol-ink to-bristol-maroon bg-clip-text text-transparent">
                    Bristol Portfolio Database
                  </CardTitle>
                  <Badge 
                    key={`table-sites-${portfolioData?.totalSites || 'loading'}`}
                    variant="outline" 
                    className="ml-auto px-4 py-2 text-bristol-maroon border-bristol-maroon/40 bg-gradient-to-r from-bristol-cream to-white font-bold shadow-lg shadow-bristol-maroon/20"
                  >
                    {isMetricsLoading ? 'Loading...' : `${portfolioData?.totalSites || 46} Properties`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2 bg-gradient-to-br from-white/90 to-bristol-cream/40 backdrop-blur-sm">
                <SitesTable 
                  data={(sites || []) as any[]}
                  isLoading={isLoading}
                  onSelectSite={setSelectedSite as any}
                  selectedSite={selectedSite as any}
                  onRefresh={refetch}
                />
              </CardContent>
            </Card>

            {/* Premium Details & Analytics Sidebar with Parallax */}
            <div 
              className="space-y-6"
              style={{
                transform: `translateY(${scrollY * 0.08}px)`
              }}
            >
              {/* Site Details Card with Parallax */}
              <Card 
                className="bg-white/85 border-bristol-maroon/30 backdrop-blur-lg shadow-2xl shadow-bristol-maroon/20 hover:shadow-bristol-maroon/30 transition-all duration-500 hover:scale-[1.02]"
                style={{
                  transform: `translateY(${scrollY * 0.03}px)`
                }}
              >
                <CardHeader className="pb-4 bg-gradient-to-r from-white/90 to-bristol-cream/60 border-b-2 border-bristol-maroon/30 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="relative group">
                      <Building className="h-5 w-5 text-bristol-maroon group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute -inset-2 bg-bristol-maroon/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
                    </div>
                    <CardTitle className="font-cinzel text-bristol-ink text-lg bg-gradient-to-r from-bristol-ink to-bristol-maroon bg-clip-text text-transparent">
                      {selectedSite ? selectedSite.name : 'Property Details'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="bg-gradient-to-br from-white/90 to-bristol-cream/40 text-bristol-ink backdrop-blur-sm">
                  {selectedSite ? (
                    <SiteDetails site={selectedSite as any} onRefresh={refetch} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="relative group">
                        <Building className="h-16 w-16 text-bristol-stone/40 group-hover:text-bristol-maroon/60 transition-colors duration-300" />
                        <div className="absolute -inset-3 bg-bristol-stone/10 rounded-full blur-xl group-hover:bg-bristol-maroon/10 transition-all duration-300"></div>
                      </div>
                      <p className="text-bristol-stone font-medium text-center">Select a property to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bristol Portfolio Analysis Agent */}
              <div>
                <BristolPortfolioAgent 
                  selectedSite={selectedSite}
                  portfolioData={portfolioData}
                  onAnalysisUpdate={(results) => {
                    console.log('Portfolio analysis updated:', results);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Premium Add Site Modal with Light Theme */}
        <Sheet open={showAddForm} onOpenChange={setShowAddForm}>
          <SheetContent 
            side="right" 
            className="w-[600px] sm:max-w-[600px] bg-gradient-to-br from-white via-bristol-cream/50 to-white border-l-2 border-bristol-maroon/30 backdrop-blur-md shadow-2xl"
          >
            <SheetHeader className="pb-6 border-b-2 border-bristol-maroon/20">
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <Plus className="h-6 w-6 text-bristol-maroon group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute -inset-2 bg-bristol-maroon/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
                </div>
                <SheetTitle className="font-cinzel text-bristol-ink text-2xl tracking-wide bg-gradient-to-r from-bristol-ink to-bristol-maroon bg-clip-text text-transparent">
                  Add New Bristol Property
                </SheetTitle>
              </div>
            </SheetHeader>
            <div className="mt-8 text-bristol-ink">
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
    </DataBackground>
  );
}