import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Box, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move3D,
  Building,
  Eye,
  Settings,
  Play,
  Pause,
  RotateCw
} from 'lucide-react';
import type { Site } from '@shared/schema';

interface ThreeJSSandboxProps {
  selectedSite?: Site | null;
  onSiteSelect?: (site: Site | null) => void;
}

export function ThreeJSSandbox({ selectedSite, onSiteSelect }: ThreeJSSandboxProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>();
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [viewMode, setViewMode] = useState<'city' | 'portfolio' | 'site'>('portfolio');
  const [zoom, setZoom] = useState(50);

  // Fetch sites data for 3D visualization
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
    retry: false,
  });

  // Simple 3D scene setup without external dependencies
  const setupScene = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    return ctx;
  };

  // 3D visualization rendering using Canvas 2D (pseudo-3D)
  const render3DScene = (ctx: CanvasRenderingContext2D, timestamp: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Clear canvas with Bristol gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1e293b'); // Dark slate
    gradient.addColorStop(0.5, '#334155'); // Medium slate  
    gradient.addColorStop(1, '#0f172a'); // Very dark slate
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Grid lines for 3D effect
    ctx.strokeStyle = 'rgba(99, 184, 255, 0.2)'; // Cyan grid
    ctx.lineWidth = 1;
    
    const gridSize = 40;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Horizontal grid lines with perspective
    for (let i = -10; i <= 10; i++) {
      const y = centerY + (i * gridSize) / (1 + Math.abs(i) * 0.05);
      const startX = centerX - (200 - Math.abs(i) * 10);
      const endX = centerX + (200 - Math.abs(i) * 10);
      
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
    
    // Vertical grid lines with perspective
    for (let j = -10; j <= 10; j++) {
      const x = centerX + (j * gridSize) / (1 + Math.abs(j) * 0.05);
      const startY = centerY - (150 - Math.abs(j) * 8);
      const endY = centerY + (150 - Math.abs(j) * 8);
      
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Render Bristol properties as 3D buildings
    const rotation = isAutoRotating ? timestamp * 0.0005 : 0;
    
    sites.forEach((site, index) => {
      if (!site.latitude || !site.longitude) return;
      
      const angle = (index / sites.length) * Math.PI * 2 + rotation;
      const radius = 120 + (index % 3) * 40;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * 0.5; // Perspective
      
      // Building height based on units
      const height = Math.max(20, (site.unitsTotal || 50) / 10);
      const buildingWidth = 12 + (index % 3) * 4;
      
      // Building base (foundation)
      ctx.fillStyle = '#8B1538'; // Bristol maroon
      ctx.fillRect(x - buildingWidth/2, y, buildingWidth, 8);
      
      // Building main structure
      const gradient3D = ctx.createLinearGradient(x - buildingWidth/2, y - height, x + buildingWidth/2, y);
      
      if (selectedSite?.id === site.id) {
        gradient3D.addColorStop(0, '#60a5fa'); // Blue highlight
        gradient3D.addColorStop(1, '#3b82f6');
      } else if (site.status === 'Pipeline') {
        gradient3D.addColorStop(0, '#f59e0b'); // Amber for pipeline
        gradient3D.addColorStop(1, '#d97706');
      } else {
        gradient3D.addColorStop(0, '#06b6d4'); // Cyan for operating
        gradient3D.addColorStop(1, '#0891b2');
      }
      
      ctx.fillStyle = gradient3D;
      ctx.fillRect(x - buildingWidth/2, y - height, buildingWidth, height);
      
      // Building outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - buildingWidth/2, y - height, buildingWidth, height);
      
      // Windows (simple rectangles)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let floor = 1; floor < height / 8; floor++) {
        for (let window = 0; window < Math.floor(buildingWidth / 4); window++) {
          const windowX = x - buildingWidth/2 + 2 + window * 4;
          const windowY = y - height + floor * 8 + 1;
          ctx.fillRect(windowX, windowY, 2, 3);
        }
      }
      
      // Site label
      if (buildingWidth > 12) { // Only show labels for larger buildings
        ctx.font = '10px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(
          site.name.substring(0, 8) + (site.name.length > 8 ? '...' : ''), 
          x, 
          y + 18
        );
      }
    });

    // Center focal point
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24'; // Bristol gold
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Title and stats overlay
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('Bristol 3D Portfolio Visualization', 20, 30);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${sites.length} Properties • ${sites.filter(s => s.status === 'Pipeline').length} Pipeline • ${sites.filter(s => s.status !== 'Pipeline').length} Operating`, 20, 50);
  };

  // Animation loop
  const animate = (timestamp: number) => {
    const ctx = setupScene();
    if (ctx) {
      render3DScene(ctx, timestamp);
    }
    animationIdRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    animationIdRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [sites, isAutoRotating, selectedSite]);

  // Handle canvas clicks for site selection
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Simple hit detection logic here
    console.log('Clicked at:', x, y);
    // In a real implementation, you'd calculate which building was clicked
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden">
      {/* 3D Canvas */}
      <div className="relative h-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-pointer"
          onClick={handleCanvasClick}
          style={{ background: 'transparent' }}
        />
        
        {/* Control Panel Overlay */}
        <Card className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm shadow-xl border-bristol-maroon/20 w-80">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-bristol-ink">
              <Box className="w-5 h-5 text-bristol-maroon" />
              3D Visualization Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* View Mode */}
            <div>
              <label className="text-sm font-medium text-bristol-stone mb-2 block">View Mode</label>
              <div className="grid grid-cols-3 gap-1">
                {['portfolio', 'city', 'site'].map((mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode(mode as any)}
                    className={`text-xs ${viewMode === mode ? 'bg-bristol-maroon text-white' : ''}`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Animation Controls */}
            <div>
              <label className="text-sm font-medium text-bristol-stone mb-2 block">Animation</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  className="flex-1"
                >
                  {isAutoRotating ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                  {isAutoRotating ? 'Pause' : 'Play'}
                </Button>
                <Button variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Site Information */}
            <div>
              <label className="text-sm font-medium text-bristol-stone mb-2 block">Portfolio Stats</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-bristol-cream/20 rounded">
                  <div className="text-lg font-bold text-bristol-maroon">{sites.length}</div>
                  <div className="text-xs text-bristol-stone">Total Sites</div>
                </div>
                <div className="text-center p-2 bg-bristol-gold/20 rounded">
                  <div className="text-lg font-bold text-bristol-maroon">
                    {sites.reduce((sum, site) => sum + (site.unitsTotal || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-bristol-stone">Total Units</div>
                </div>
              </div>
            </div>

            {/* Status Legend */}
            <div>
              <label className="text-sm font-medium text-bristol-stone mb-2 block">Legend</label>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                  <span className="text-xs">Operating Properties</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded"></div>
                  <span className="text-xs">Pipeline Properties</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-xs">Selected Property</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Instructions */}
            <div className="text-xs text-bristol-stone bg-blue-50 p-3 rounded border border-blue-200">
              <div className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-blue-800">How to Use:</strong>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>Buildings represent Bristol properties in 3D space</li>
                    <li>Height corresponds to unit count</li>
                    <li>Colors indicate property status</li>
                    <li>Auto-rotation provides 360° portfolio view</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Site Info */}
        {selectedSite && (
          <Card className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm shadow-xl border-bristol-maroon/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-bristol-maroon" />
                <div>
                  <h3 className="font-semibold text-bristol-ink">{selectedSite.name}</h3>
                  <p className="text-sm text-bristol-stone">{selectedSite.city}, {selectedSite.state}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {selectedSite.unitsTotal || 'TBD'} units
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedSite.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}