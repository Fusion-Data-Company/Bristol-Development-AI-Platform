import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Loader2, 
  Building2, 
  MapPin, 
  Settings, 
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ScrapeQuery {
  address: string;
  radius_mi: number;
  asset_type: string;
  amenities: string[];
  keywords: string[];
}

interface ScraperControlPanelProps {
  onScrapeComplete?: (data: any) => void;
}

const ASSET_TYPES = [
  'Multifamily',
  'Condo',
  'Office',
  'Retail',
  'Industrial',
  'Mixed Use'
];

const AMENITY_OPTIONS = [
  'pool', 'fitness', 'gym', 'parking', 'garage', 'balcony',
  'dishwasher', 'laundry', 'ac', 'heating', 'pet friendly',
  'elevator', 'concierge', 'doorman', 'rooftop', 'garden',
  'clubhouse', 'ev charging', 'dog park', 'coworking'
];

export default function ScraperControlPanel({ onScrapeComplete }: ScraperControlPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [scrapeQuery, setScrapeQuery] = useState<ScrapeQuery>({
    address: '',
    radius_mi: 5,
    asset_type: 'Multifamily',
    amenities: [],
    keywords: []
  });
  
  const [keywordsInput, setKeywordsInput] = useState('');
  const [lastScrapeResult, setLastScrapeResult] = useState<any>(null);

  const scrapeMutation = useMutation({
    mutationFn: async (query: ScrapeQuery) => {
      const response = await fetch('/api/scraper/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Scraping failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setLastScrapeResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/comps-annex'] });
      
      toast({
        title: "Scraping Completed",
        description: `Found ${data.inserted || 0} properties from ${data.source}`,
      });
      
      if (onScrapeComplete) {
        onScrapeComplete(data);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Scraping Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleScrape = () => {
    if (!scrapeQuery.address.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter an address to search near",
        variant: "destructive"
      });
      return;
    }

    const finalQuery = {
      ...scrapeQuery,
      keywords: keywordsInput.split(',').map(k => k.trim()).filter(Boolean)
    };

    scrapeMutation.mutate(finalQuery);
  };

  const handleAmenityToggle = (amenity: string) => {
    setScrapeQuery(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  return (
    <Card className="mb-6 bg-gradient-to-br from-brand-cream via-white to-brand-sky/10 border-2 border-brand-gold/30 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-brand-maroon/10 to-brand-gold/10 border-b border-brand-gold/20">
        <CardTitle className="flex items-center gap-2 text-brand-maroon">
          <Search className="h-5 w-5" />
          Elite Scraping Agent
          <Badge variant="secondary" className="bg-brand-gold/20 text-brand-maroon">
            Firecrawl + Apify + Fallback
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Primary Search Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="address" className="text-brand-maroon font-semibold">
              <MapPin className="h-4 w-4 inline mr-1" />
              Target Address
            </Label>
            <Input
              id="address"
              placeholder="123 Main St, Nashville, TN"
              value={scrapeQuery.address}
              onChange={(e) => setScrapeQuery(prev => ({ ...prev, address: e.target.value }))}
              className="border-brand-gold/30 focus:border-brand-maroon"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="radius" className="text-brand-maroon font-semibold">
              Search Radius (miles)
            </Label>
            <Input
              id="radius"
              type="number"
              min="1"
              max="50"
              value={scrapeQuery.radius_mi}
              onChange={(e) => setScrapeQuery(prev => ({ ...prev, radius_mi: parseInt(e.target.value) || 5 }))}
              className="border-brand-gold/30 focus:border-brand-maroon"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="asset-type" className="text-brand-maroon font-semibold">
              <Building2 className="h-4 w-4 inline mr-1" />
              Asset Type
            </Label>
            <Select
              value={scrapeQuery.asset_type}
              onValueChange={(value) => setScrapeQuery(prev => ({ ...prev, asset_type: value }))}
            >
              <SelectTrigger className="border-brand-gold/30 focus:border-brand-maroon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Amenities Selection */}
        <div className="space-y-2">
          <Label className="text-brand-maroon font-semibold">Target Amenities</Label>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map(amenity => (
              <Badge
                key={amenity}
                variant={scrapeQuery.amenities.includes(amenity) ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  scrapeQuery.amenities.includes(amenity)
                    ? 'bg-brand-maroon text-white'
                    : 'border-brand-gold/30 hover:bg-brand-gold/10'
                }`}
                onClick={() => handleAmenityToggle(amenity)}
              >
                {amenity}
              </Badge>
            ))}
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <Label htmlFor="keywords" className="text-brand-maroon font-semibold">
            Keywords (comma-separated)
          </Label>
          <Textarea
            id="keywords"
            placeholder="luxury, downtown, waterfront, new construction"
            value={keywordsInput}
            onChange={(e) => setKeywordsInput(e.target.value)}
            className="border-brand-gold/30 focus:border-brand-maroon h-20"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handleScrape}
            disabled={scrapeMutation.isPending || !scrapeQuery.address.trim()}
            className="bg-gradient-to-r from-brand-maroon to-brand-gold hover:from-brand-maroon/90 hover:to-brand-gold/90 text-white px-8 py-2 font-semibold"
          >
            {scrapeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scraping Properties...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Elite Scrape
              </>
            )}
          </Button>

          {lastScrapeResult && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Last: {lastScrapeResult.inserted} records
              </div>
              <Badge variant="outline" className="text-brand-maroon border-brand-gold/30">
                Source: {lastScrapeResult.source}
              </Badge>
            </div>
          )}
        </div>

        {/* Caveats/Warnings */}
        {lastScrapeResult?.caveats && lastScrapeResult.caveats.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-800">Scraping Notes:</p>
                <ul className="text-xs text-orange-700 mt-1 space-y-1">
                  {lastScrapeResult.caveats.map((caveat: string, idx: number) => (
                    <li key={idx}>• {caveat}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* API Configuration Status */}
        <div className="bg-brand-sky/10 border border-brand-gold/20 rounded-lg p-3">
          <div className="text-xs text-brand-maroon/70">
            <p className="font-medium mb-1">Scraping Sources Available:</p>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Firecrawl (Premium)
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Apify (Automation)
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                Fallback (Free)
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}