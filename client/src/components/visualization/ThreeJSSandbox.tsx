import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  RotateCw,
  Camera,
  Layers,
  Sun,
  Moon,
  Sparkles,
  Target,
  Navigation,
  TrendingUp
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
  const [rotationSpeed, setRotationSpeed] = useState([1]);
  const [buildingScale, setBuildingScale] = useState([1]);
  const [showParticles, setShowParticles] = useState(true);
  const [cameraAngle, setCameraAngle] = useState([0]);
  const [perspective, setPerspective] = useState([0.5]);
  const [lightingMode, setLightingMode] = useState<'day' | 'night' | 'golden'>('day');
  const [showStats, setShowStats] = useState(true);
  const [animationMode, setAnimationMode] = useState<'orbit' | 'fly' | 'wave'>('orbit');
  const [particles, setParticles] = useState<Array<{x: number; y: number; vx: number; vy: number; life: number}>>([]);

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

  // Enhanced particle system
  const updateParticles = (width: number, height: number) => {
    if (!showParticles) return;

    // Add new particles occasionally
    if (Math.random() < 0.02 && particles.length < 50) {
      setParticles(prev => [...prev, {
        x: Math.random() * width,
        y: height + 10,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 3 - 1,
        life: 1
      }]);
    }

    // Update existing particles
    setParticles(prev => prev
      .map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        life: p.life - 0.008
      }))
      .filter(p => p.life > 0 && p.y > -50)
    );
  };

  // Enhanced lighting based on mode
  const getLightingColors = () => {
    switch (lightingMode) {
      case 'night':
        return {
          bg: ['#0f0f23', '#1a1a2e', '#16213e'],
          grid: 'rgba(99, 184, 255, 0.3)',
          building: { primary: '#1e40af', secondary: '#3b82f6' },
          accent: '#60a5fa'
        };
      case 'golden':
        return {
          bg: ['#7c2d12', '#ea580c', '#fed7aa'],
          grid: 'rgba(251, 191, 36, 0.4)',
          building: { primary: '#f59e0b', secondary: '#fbbf24' },
          accent: '#fcd34d'
        };
      default: // day
        return {
          bg: ['#1e293b', '#334155', '#475569'],
          grid: 'rgba(99, 184, 255, 0.2)',
          building: { primary: '#06b6d4', secondary: '#0891b2' },
          accent: '#22d3ee'
        };
    }
  };

  // Enhanced 3D visualization rendering
  const render3DScene = (ctx: CanvasRenderingContext2D, timestamp: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const colors = getLightingColors();

    // Dynamic background with lighting
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors.bg[0]);
    gradient.addColorStop(0.5, colors.bg[1]);
    gradient.addColorStop(1, colors.bg[2]);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Update particle system
    updateParticles(width, height);

    // Enhanced dynamic grid with perspective
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    
    const gridSize = 40 + zoom * 0.5;
    const centerX = width / 2;
    const centerY = height / 2 + cameraAngle[0] * 100;
    const perspectiveFactor = 0.05 + perspective[0] * 0.1;
    
    // Enhanced horizontal grid lines with dynamic perspective
    for (let i = -15; i <= 15; i++) {
      const y = centerY + (i * gridSize) / (1 + Math.abs(i) * perspectiveFactor);
      const lineWidth = 200 - Math.abs(i) * 12;
      const startX = centerX - lineWidth;
      const endX = centerX + lineWidth;
      
      // Fade distant lines
      const alpha = Math.max(0.1, 1 - Math.abs(i) * 0.08);
      ctx.globalAlpha = alpha;
      
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }
    
    // Enhanced vertical grid lines with dynamic perspective
    for (let j = -15; j <= 15; j++) {
      const x = centerX + (j * gridSize) / (1 + Math.abs(j) * perspectiveFactor);
      const lineHeight = 150 - Math.abs(j) * 10;
      const startY = centerY - lineHeight;
      const endY = centerY + lineHeight;
      
      // Fade distant lines
      const alpha = Math.max(0.1, 1 - Math.abs(j) * 0.08);
      ctx.globalAlpha = alpha;
      
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    // Reset alpha
    ctx.globalAlpha = 1;

    // Enhanced building rendering with multiple animation modes
    let rotation = 0;
    let waveOffset = 0;
    
    if (isAutoRotating) {
      switch (animationMode) {
        case 'orbit':
          rotation = timestamp * 0.0005 * rotationSpeed[0];
          break;
        case 'fly':
          rotation = timestamp * 0.001 * rotationSpeed[0];
          waveOffset = Math.sin(timestamp * 0.002) * 20;
          break;
        case 'wave':
          rotation = timestamp * 0.0002 * rotationSpeed[0];
          waveOffset = Math.sin(timestamp * 0.003) * 30;
          break;
      }
    }
    
    // Render particles first (background layer)
    if (showParticles) {
      particles.forEach(particle => {
        ctx.globalAlpha = particle.life * 0.6;
        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    
    // Sort buildings by depth for proper rendering order
    const buildingsWithDepth = sites
      .map((site, index) => {
        if (!site.latitude || !site.longitude) return null;
        
        const angle = (index / sites.length) * Math.PI * 2 + rotation + cameraAngle[0] * 0.1;
        const baseRadius = 120 + (index % 3) * 40;
        const radius = baseRadius + waveOffset * Math.sin(angle * 2);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius * (0.5 + perspective[0] * 0.3);
        const depth = Math.sin(angle) * radius; // For depth sorting
        
        return { site, index, x, y, depth, angle, radius };
      })
      .filter(Boolean)
      .sort((a, b) => a!.depth - b!.depth); // Back to front rendering
    
    buildingsWithDepth.forEach((building) => {
      if (!building) return;
      const { site, index, x, y, depth } = building;
      
      // Enhanced building dimensions with scaling
      const height = Math.max(20, (site.unitsTotal || 50) / 10) * buildingScale[0];
      const buildingWidth = (12 + (index % 3) * 4) * buildingScale[0];
      const depthScale = 1 + depth * 0.001; // Perspective scaling
      
      // Enhanced 3D building with isometric perspective
      const scaledWidth = buildingWidth * depthScale;
      const scaledHeight = height * depthScale;
      const baseHeight = 8 * depthScale;
      
      // Building shadow (depth effect)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(x - scaledWidth/2 + 3, y + 3, scaledWidth, baseHeight);
      
      // Building base (foundation) with gradient
      const baseGradient = ctx.createLinearGradient(x - scaledWidth/2, y, x + scaledWidth/2, y + baseHeight);
      baseGradient.addColorStop(0, '#8B1538');
      baseGradient.addColorStop(1, '#6B1126');
      ctx.fillStyle = baseGradient;
      ctx.fillRect(x - scaledWidth/2, y, scaledWidth, baseHeight);
      
      // Enhanced building main structure with dynamic lighting
      const gradient3D = ctx.createLinearGradient(x - scaledWidth/2, y - scaledHeight, x + scaledWidth/2, y);
      
      // Dynamic building colors based on status and lighting mode
      let primaryColor, secondaryColor;
      if (selectedSite?.id === site.id) {
        primaryColor = lightingMode === 'night' ? '#60a5fa' : '#3b82f6';
        secondaryColor = lightingMode === 'night' ? '#3b82f6' : '#1d4ed8';
      } else if (site.status === 'Pipeline') {
        primaryColor = lightingMode === 'golden' ? '#fbbf24' : '#f59e0b';
        secondaryColor = lightingMode === 'golden' ? '#f59e0b' : '#d97706';
      } else {
        primaryColor = colors.building.primary;
        secondaryColor = colors.building.secondary;
      }
      
      gradient3D.addColorStop(0, primaryColor);
      gradient3D.addColorStop(0.7, secondaryColor);
      gradient3D.addColorStop(1, primaryColor);
      
      ctx.fillStyle = gradient3D;
      ctx.fillRect(x - scaledWidth/2, y - scaledHeight, scaledWidth, scaledHeight);
      
      // Enhanced building outline with glow effect
      ctx.strokeStyle = selectedSite?.id === site.id ? 
        `rgba(96, 165, 250, 0.8)` : 
        `rgba(255, 255, 255, 0.3)`;
      ctx.lineWidth = selectedSite?.id === site.id ? 2 : 1;
      ctx.strokeRect(x - scaledWidth/2, y - scaledHeight, scaledWidth, scaledHeight);
      
      // Enhanced windows with random lighting
      const windowBrightness = lightingMode === 'night' ? 0.9 : 0.6;
      ctx.fillStyle = `rgba(255, 255, 255, ${windowBrightness})`;
      
      const floors = Math.floor(scaledHeight / 12);
      const windowsPerFloor = Math.floor(scaledWidth / 6);
      
      for (let floor = 1; floor < floors; floor++) {
        for (let window = 0; window < windowsPerFloor; window++) {
          // Random window lighting for night mode
          if (lightingMode === 'night' && Math.random() > 0.3) {
            ctx.fillStyle = Math.random() > 0.7 ? 
              'rgba(255, 255, 150, 0.9)' : 
              'rgba(150, 200, 255, 0.8)';
          }
          
          const windowX = x - scaledWidth/2 + 3 + window * 6;
          const windowY = y - scaledHeight + floor * 12 + 2;
          const windowWidth = Math.max(2, scaledWidth / 8);
          const windowHeight = Math.max(3, scaledHeight / 15);
          
          ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
        }
      }
      
      // Building top highlight for 3D effect
      ctx.fillStyle = `rgba(255, 255, 255, 0.4)`;
      ctx.fillRect(x - scaledWidth/2, y - scaledHeight, scaledWidth, 2);
      
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

    // Enhanced stats overlay with dynamic information
    if (showStats) {
      // Title with enhanced styling
      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = colors.accent;
      ctx.textAlign = 'left';
      ctx.fillText('Bristol Elite 3D Portfolio', 20, 35);
      
      // Dynamic subtitle based on lighting mode
      ctx.font = '12px Arial';
      ctx.fillStyle = '#94a3b8';
      const subtitle = lightingMode === 'night' ? 'Night Vision Mode' : 
                      lightingMode === 'golden' ? 'Golden Hour Mode' : 
                      'Day Vision Mode';
      ctx.fillText(`${subtitle} • ${animationMode.charAt(0).toUpperCase() + animationMode.slice(1)} Animation`, 20, 55);
      
      // Enhanced property statistics
      const operatingCount = sites.filter(s => s.status === 'Operating').length;
      const pipelineCount = sites.filter(s => s.status === 'Pipeline').length;
      const totalUnits = sites.reduce((sum, site) => sum + (site.unitsTotal || 0), 0);
      
      ctx.fillText(`${sites.length} Properties • ${operatingCount} Operating • ${pipelineCount} Pipeline • ${totalUnits.toLocaleString()} Units`, 20, 75);
      
      // Performance indicator
      ctx.font = '10px Arial';
      ctx.fillStyle = isAutoRotating ? '#22c55e' : '#ef4444';
      ctx.fillText(`● ${isAutoRotating ? 'LIVE' : 'PAUSED'} • Speed: ${rotationSpeed[0].toFixed(1)}x • Scale: ${buildingScale[0].toFixed(1)}x`, 20, 95);
    }
    
    // Enhanced center focal point with pulsing effect
    const pulseSize = 5 + Math.sin(timestamp * 0.005) * 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = colors.accent;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add center glow effect
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseSize + 3, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
    ctx.lineWidth = 1;
    ctx.stroke();
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
            {/* Enhanced View Mode */}
            <div>
              <label className="text-sm font-medium text-bristol-stone mb-2 block flex items-center gap-2">
                <Camera className="w-4 h-4" />
                View Mode
              </label>
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

            {/* Enhanced Animation Controls */}
            <div>
              <label className="text-sm font-medium text-bristol-stone mb-2 block flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Animation Mode
              </label>
              <div className="grid grid-cols-3 gap-1 mb-3">
                {[
                  { key: 'orbit', label: 'Orbit', icon: Target },
                  { key: 'fly', label: 'Fly', icon: Navigation },
                  { key: 'wave', label: 'Wave', icon: TrendingUp }
                ].map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={animationMode === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAnimationMode(key as any)}
                    className={`text-xs ${animationMode === key ? 'bg-cyan-600 text-white' : ''}`}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>
              
              <div className="flex gap-2 mb-3">
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

              <div>
                <Label className="text-xs text-bristol-stone">Speed: {rotationSpeed[0].toFixed(1)}x</Label>
                <Slider
                  value={rotationSpeed}
                  onValueChange={setRotationSpeed}
                  max={3}
                  min={0.1}
                  step={0.1}
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            {/* Camera & Perspective Controls */}
            <div>
              <label className="text-sm font-medium text-bristol-stone mb-2 block flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Camera & View
              </label>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-bristol-stone">Camera Angle: {cameraAngle[0].toFixed(1)}°</Label>
                  <Slider
                    value={cameraAngle}
                    onValueChange={setCameraAngle}
                    max={45}
                    min={-45}
                    step={1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-bristol-stone">Perspective: {perspective[0].toFixed(1)}</Label>
                  <Slider
                    value={perspective}
                    onValueChange={setPerspective}
                    max={1}
                    min={0}
                    step={0.1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-bristol-stone">Building Scale: {buildingScale[0].toFixed(1)}x</Label>
                  <Slider
                    value={buildingScale}
                    onValueChange={setBuildingScale}
                    max={2}
                    min={0.5}
                    step={0.1}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Lighting & Effects */}
            <div>
              <label className="text-sm font-medium text-bristol-stone mb-2 block flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Lighting & Effects
              </label>
              <div className="grid grid-cols-3 gap-1 mb-3">
                {[
                  { key: 'day', label: 'Day', icon: Sun },
                  { key: 'night', label: 'Night', icon: Moon },
                  { key: 'golden', label: 'Golden', icon: Sparkles }
                ].map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={lightingMode === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLightingMode(key as any)}
                    className={`text-xs ${lightingMode === key ? 'bg-orange-600 text-white' : ''}`}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-bristol-stone">Particles</Label>
                <Switch checked={showParticles} onCheckedChange={setShowParticles} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs text-bristol-stone">Statistics</Label>
                <Switch checked={showStats} onCheckedChange={setShowStats} />
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