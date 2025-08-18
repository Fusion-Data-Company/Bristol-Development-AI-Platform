import { useQuery } from '@tanstack/react-query';
import { InteractiveMap } from '@/components/maps/InteractiveMap';
import SimpleChrome from '@/components/brand/SimpleChrome';
import type { Site } from '@shared/schema';

export default function Map() {
  // Fetch sites data for the map
  const { data: sites = [], isLoading, error } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
    refetchInterval: 300000 // 5 minutes
  });

  const handleSiteSelect = (site: Site | null) => {
    if (site) {
      console.log('Selected site:', site.name);
      // Could navigate to site details or open sidebar
    }
  };

  const handleMapClick = (longitude: number, latitude: number) => {
    console.log('Map clicked at:', { longitude, latitude });
  };

  if (error) {
    return (
      <SimpleChrome>
        <div className="flex items-center justify-center h-[500px]">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Map</h2>
            <p className="text-gray-600">Failed to load site data for the map.</p>
          </div>
        </div>
      </SimpleChrome>
    );
  }

  return (
    <SimpleChrome>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-bristol-maroon to-bristol-gold text-white p-6 mb-6">
          <h1 className="text-3xl font-serif font-bold mb-2">Bristol Site Intelligence Map</h1>
          <p className="text-bristol-cream/90">
            Interactive map displaying live Bristol scores and property analytics across our portfolio
          </p>
          {isLoading && (
            <div className="mt-2 text-bristol-cream/80">
              Loading {sites.length} properties...
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 min-h-[600px] mx-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full">
            <InteractiveMap
              sites={sites}
              onSiteSelect={handleSiteSelect}
              onMapClick={handleMapClick}
              className="h-full"
              fullScreen={true}
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mx-6 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                <span className="font-semibold">{sites.length}</span> properties loaded
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Excellent (85+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                  <span>Good (70-84)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Average (55-69)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Below Average (40-54)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Poor (&lt;40)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SimpleChrome>
  );
}