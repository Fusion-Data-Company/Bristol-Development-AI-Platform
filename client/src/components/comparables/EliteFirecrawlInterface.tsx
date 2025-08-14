import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Temporary inline checkbox to avoid React hook issues
const SimpleCheckbox = ({ checked, onCheckedChange, id }: { checked: boolean; onCheckedChange: (checked: boolean) => void; id: string }) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    onChange={(e) => onCheckedChange(e.target.checked)}
    className="w-4 h-4 text-bristol-maroon border-gray-300 rounded focus:ring-bristol-maroon"
  />
);
import { 
  Search, 
  Globe, 
  Target, 
  Download,
  Settings,
  Building2,
  DollarSign,
  Home,
  MapPin,
  Users,
  Car,
  Waves,
  Zap,
  Coffee
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EliteSearchConfig {
  query: string;
  location: string;
  propertyType: string;
  priceRange: string;
  amenities: string[];
  limit: number;
}

interface EliteCrawlConfig {
  url: string;
  maxDepth: number;
  maxUrls: number;
  includeSubdomains: boolean;
  targetPropertyTypes: string[];
}

interface EliteExtractConfig {
  urls: string[];
  extractionFocus: string;
  propertyClass: string;
  dataPoints: string[];
}

interface EliteMapConfig {
  query: string;
  location: string;
  radius: number;
  mapType: string;
}

const PROPERTY_TYPES = [
  'Multifamily', 'Apartment Complex', 'Garden Style', 'High-Rise', 
  'Mid-Rise', 'Townhomes', 'Student Housing', 'Senior Living'
];

const AMENITIES = [
  'Pool', 'Fitness Center', 'Parking Garage', 'In-Unit Laundry', 
  'Balcony/Patio', 'Air Conditioning', 'Dishwasher', 'Walk-in Closets',
  'Business Center', 'Clubhouse', 'Playground', 'Pet-Friendly',
  'Concierge', 'Rooftop Deck', 'Tennis Court', 'Hot Tub'
];

const EXTRACTION_FOCUSES = [
  'financial', 'units', 'amenities', 'location', 'management', 'comprehensive'
];

const PROPERTY_CLASSES = ['A', 'B', 'C', 'D'];

export function EliteFirecrawlInterface() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'search' | 'crawl' | 'extract' | 'map'>('search');

  // Search Configuration
  const [searchConfig, setSearchConfig] = useState<EliteSearchConfig>({
    query: 'luxury multifamily apartments',
    location: 'Austin, TX',
    propertyType: 'Multifamily',
    priceRange: '$1500-$3000',
    amenities: [],
    limit: 20
  });

  // Crawl Configuration
  const [crawlConfig, setCrawlConfig] = useState<EliteCrawlConfig>({
    url: 'https://www.apartments.com',
    maxDepth: 3,
    maxUrls: 50,
    includeSubdomains: true,
    targetPropertyTypes: ['Multifamily']
  });

  // Extract Configuration
  const [extractConfig, setExtractConfig] = useState<EliteExtractConfig>({
    urls: [],
    extractionFocus: 'financial',
    propertyClass: 'A',
    dataPoints: ['rent', 'units', 'amenities', 'location']
  });

  // Map Configuration
  const [mapConfig, setMapConfig] = useState<EliteMapConfig>({
    query: 'apartment complexes',
    location: 'Austin, TX',
    radius: 10,
    mapType: 'property_density'
  });

  const [urlInput, setUrlInput] = useState('');

  // Elite Search Mutation
  const eliteSearchMutation = useMutation({
    mutationFn: async (config: EliteSearchConfig) => {
      const response = await fetch('/api/bristol-elite/elite-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${config.query} ${config.location} ${config.propertyType}`,
          location: config.location,
          propertyType: config.propertyType,
          priceRange: config.priceRange,
          amenities: config.amenities,
          limit: config.limit
        }),
      });
      if (!response.ok) throw new Error('Elite search failed');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] });
      toast({ 
        title: '🔍 Elite Search Completed', 
        description: `Found ${data.propertiesFound} properties matching your criteria` 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Elite Search Failed', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    },
  });

  // Elite Crawl Mutation
  const eliteCrawlMutation = useMutation({
    mutationFn: async (config: EliteCrawlConfig) => {
      const response = await fetch('/api/bristol-elite/elite-crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: config.url,
          maxDepth: config.maxDepth,
          maxUrls: config.maxUrls,
          includeSubdomains: config.includeSubdomains,
          targetPropertyTypes: config.targetPropertyTypes
        }),
      });
      if (!response.ok) throw new Error('Elite crawl failed');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] });
      toast({ 
        title: '🕷️ Elite Crawl Initiated', 
        description: `Discovering properties across ${data.urlsCrawled} pages` 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Elite Crawl Failed', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    },
  });

  // Elite Extract Mutation
  const eliteExtractMutation = useMutation({
    mutationFn: async (config: EliteExtractConfig) => {
      const response = await fetch('/api/bristol-elite/elite-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: config.urls,
          extractionFocus: config.extractionFocus,
          propertyClass: config.propertyClass,
          dataPoints: config.dataPoints
        }),
      });
      if (!response.ok) throw new Error('Elite extract failed');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] });
      toast({ 
        title: '🎯 Elite Extraction Completed', 
        description: `Extracted data from ${data.propertiesFound} properties` 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Elite Extract Failed', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    },
  });

  // Elite Map Mutation
  const eliteMapMutation = useMutation({
    mutationFn: async (config: EliteMapConfig) => {
      const response = await fetch('/api/bristol-elite/elite-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `${config.query} near ${config.location} within ${config.radius} miles`,
          mapType: config.mapType,
          location: config.location,
          radius: config.radius
        }),
      });
      if (!response.ok) throw new Error('Elite map research failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: '🗺️ Elite Map Research Completed', 
        description: `Generated comprehensive market analysis` 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Elite Map Research Failed', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    },
  });

  const addUrlToExtract = () => {
    if (urlInput.trim() && !extractConfig.urls.includes(urlInput.trim())) {
      setExtractConfig(prev => ({
        ...prev,
        urls: [...prev.urls, urlInput.trim()]
      }));
      setUrlInput('');
    }
  };

  const removeUrlFromExtract = (url: string) => {
    setExtractConfig(prev => ({
      ...prev,
      urls: prev.urls.filter(u => u !== url)
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setSearchConfig(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  return (
    <div className="w-full">
      {/* Elite Header */}
      <div className="bg-gradient-to-r from-bristol-maroon via-bristol-gold to-bristol-maroon p-6 rounded-t-lg">
        <h2 className="text-2xl font-bold text-white mb-2">Elite Firecrawl Operations Center</h2>
        <p className="text-white/90">Enterprise-grade property intelligence with precision targeting</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b bg-white">
        {[
          { id: 'search', label: 'Elite Search', icon: Search },
          { id: 'crawl', label: 'Deep Crawl', icon: Globe },
          { id: 'extract', label: 'Data Extract', icon: Target },
          { id: 'map', label: 'Map Research', icon: MapPin }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-bristol-gold text-bristol-maroon bg-bristol-gold/10'
                  : 'text-gray-600 hover:text-bristol-maroon hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6 bg-white rounded-b-lg">
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search-query">Search Query</Label>
                  <Input
                    id="search-query"
                    value={searchConfig.query}
                    onChange={(e) => setSearchConfig(prev => ({ ...prev, query: e.target.value }))}
                    placeholder="luxury multifamily apartments"
                  />
                </div>
                <div>
                  <Label htmlFor="search-location">Target Location</Label>
                  <Input
                    id="search-location"
                    value={searchConfig.location}
                    onChange={(e) => setSearchConfig(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Austin, TX"
                  />
                </div>
                <div>
                  <Label htmlFor="property-type">Property Type</Label>
                  <Select value={searchConfig.propertyType} onValueChange={(value) => setSearchConfig(prev => ({ ...prev, propertyType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price-range">Price Range</Label>
                  <Input
                    id="price-range"
                    value={searchConfig.priceRange}
                    onChange={(e) => setSearchConfig(prev => ({ ...prev, priceRange: e.target.value }))}
                    placeholder="$1500-$3000"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Target Amenities</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                    {AMENITIES.map(amenity => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <SimpleCheckbox
                          id={amenity}
                          checked={searchConfig.amenities.includes(amenity)}
                          onCheckedChange={() => toggleAmenity(amenity)}
                        />
                        <Label htmlFor={amenity} className="text-sm">{amenity}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="search-limit">Results Limit</Label>
                  <Input
                    id="search-limit"
                    type="number"
                    value={searchConfig.limit}
                    onChange={(e) => setSearchConfig(prev => ({ ...prev, limit: parseInt(e.target.value) || 20 }))}
                    min="5"
                    max="100"
                  />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => eliteSearchMutation.mutate(searchConfig)}
              disabled={eliteSearchMutation.isPending}
              className="w-full bg-gradient-to-r from-bristol-maroon to-bristol-gold hover:from-bristol-gold hover:to-bristol-maroon"
            >
              <Search className="w-4 h-4 mr-2" />
              {eliteSearchMutation.isPending ? 'Executing Elite Search...' : 'Launch Elite Property Search'}
            </Button>
          </div>
        )}

        {activeTab === 'crawl' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="crawl-url">Target Website</Label>
                  <Input
                    id="crawl-url"
                    value={crawlConfig.url}
                    onChange={(e) => setCrawlConfig(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://www.apartments.com"
                  />
                </div>
                <div>
                  <Label htmlFor="crawl-depth">Maximum Crawl Depth</Label>
                  <Input
                    id="crawl-depth"
                    type="number"
                    value={crawlConfig.maxDepth}
                    onChange={(e) => setCrawlConfig(prev => ({ ...prev, maxDepth: parseInt(e.target.value) || 3 }))}
                    min="1"
                    max="5"
                  />
                </div>
                <div>
                  <Label htmlFor="crawl-urls">Maximum URLs</Label>
                  <Input
                    id="crawl-urls"
                    type="number"
                    value={crawlConfig.maxUrls}
                    onChange={(e) => setCrawlConfig(prev => ({ ...prev, maxUrls: parseInt(e.target.value) || 50 }))}
                    min="10"
                    max="500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <SimpleCheckbox
                    id="include-subdomains"
                    checked={crawlConfig.includeSubdomains}
                    onCheckedChange={(checked) => setCrawlConfig(prev => ({ ...prev, includeSubdomains: !!checked }))}
                  />
                  <Label htmlFor="include-subdomains">Include Subdomains</Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Target Property Types</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {PROPERTY_TYPES.slice(0, 6).map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <SimpleCheckbox
                          id={`crawl-${type}`}
                          checked={crawlConfig.targetPropertyTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCrawlConfig(prev => ({ ...prev, targetPropertyTypes: [...prev.targetPropertyTypes, type] }));
                            } else {
                              setCrawlConfig(prev => ({ ...prev, targetPropertyTypes: prev.targetPropertyTypes.filter(t => t !== type) }));
                            }
                          }}
                        />
                        <Label htmlFor={`crawl-${type}`} className="text-sm">{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => eliteCrawlMutation.mutate(crawlConfig)}
              disabled={eliteCrawlMutation.isPending}
              className="w-full bg-gradient-to-r from-bristol-maroon to-bristol-gold hover:from-bristol-gold hover:to-bristol-maroon"
            >
              <Globe className="w-4 h-4 mr-2" />
              {eliteCrawlMutation.isPending ? 'Executing Deep Crawl...' : 'Launch Deep Property Crawl'}
            </Button>
          </div>
        )}

        {activeTab === 'extract' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="url-input">Add Target URLs</Label>
                  <div className="flex gap-2">
                    <Input
                      id="url-input"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://www.example.com/property"
                    />
                    <Button onClick={addUrlToExtract} variant="outline">Add</Button>
                  </div>
                </div>
                <div>
                  <Label>URLs to Extract ({extractConfig.urls.length})</Label>
                  <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                    {extractConfig.urls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span className="truncate">{url}</span>
                        <Button onClick={() => removeUrlFromExtract(url)} variant="ghost" size="sm">×</Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="extraction-focus">Extraction Focus</Label>
                  <Select value={extractConfig.extractionFocus} onValueChange={(value) => setExtractConfig(prev => ({ ...prev, extractionFocus: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXTRACTION_FOCUSES.map(focus => (
                        <SelectItem key={focus} value={focus}>
                          {focus.charAt(0).toUpperCase() + focus.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="property-class">Property Class</Label>
                  <Select value={extractConfig.propertyClass} onValueChange={(value) => setExtractConfig(prev => ({ ...prev, propertyClass: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_CLASSES.map(cls => (
                        <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Data Points to Extract</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['rent', 'units', 'amenities', 'location', 'management', 'financial', 'occupancy'].map(point => (
                      <div key={point} className="flex items-center space-x-2">
                        <SimpleCheckbox
                          id={point}
                          checked={extractConfig.dataPoints.includes(point)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setExtractConfig(prev => ({ ...prev, dataPoints: [...prev.dataPoints, point] }));
                            } else {
                              setExtractConfig(prev => ({ ...prev, dataPoints: prev.dataPoints.filter(p => p !== point) }));
                            }
                          }}
                        />
                        <Label htmlFor={point} className="text-sm capitalize">{point}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => eliteExtractMutation.mutate(extractConfig)}
              disabled={eliteExtractMutation.isPending || extractConfig.urls.length === 0}
              className="w-full bg-gradient-to-r from-bristol-maroon to-bristol-gold hover:from-bristol-gold hover:to-bristol-maroon"
            >
              <Target className="w-4 h-4 mr-2" />
              {eliteExtractMutation.isPending ? 'Executing Data Extraction...' : `Extract Data from ${extractConfig.urls.length} URLs`}
            </Button>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="map-query">Research Query</Label>
                  <Input
                    id="map-query"
                    value={mapConfig.query}
                    onChange={(e) => setMapConfig(prev => ({ ...prev, query: e.target.value }))}
                    placeholder="apartment complexes"
                  />
                </div>
                <div>
                  <Label htmlFor="map-location">Center Location</Label>
                  <Input
                    id="map-location"
                    value={mapConfig.location}
                    onChange={(e) => setMapConfig(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Austin, TX"
                  />
                </div>
                <div>
                  <Label htmlFor="map-radius">Search Radius (miles)</Label>
                  <Input
                    id="map-radius"
                    type="number"
                    value={mapConfig.radius}
                    onChange={(e) => setMapConfig(prev => ({ ...prev, radius: parseInt(e.target.value) || 10 }))}
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <Label htmlFor="map-type">Analysis Type</Label>
                  <Select value={mapConfig.mapType} onValueChange={(value) => setMapConfig(prev => ({ ...prev, mapType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="property_density">Property Density</SelectItem>
                      <SelectItem value="market_analysis">Market Analysis</SelectItem>
                      <SelectItem value="competitive_landscape">Competitive Landscape</SelectItem>
                      <SelectItem value="demographic_overlay">Demographic Overlay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-bristol-gold/10 rounded-lg">
                  <h4 className="font-medium text-bristol-maroon mb-2">Map Research Features</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Comprehensive market mapping</li>
                    <li>• Property density analysis</li>
                    <li>• Competitive positioning</li>
                    <li>• Demographic overlays</li>
                    <li>• Investment opportunity identification</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => eliteMapMutation.mutate(mapConfig)}
              disabled={eliteMapMutation.isPending}
              className="w-full bg-gradient-to-r from-bristol-maroon to-bristol-gold hover:from-bristol-gold hover:to-bristol-maroon"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {eliteMapMutation.isPending ? 'Executing Map Research...' : 'Launch Elite Map Research'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}