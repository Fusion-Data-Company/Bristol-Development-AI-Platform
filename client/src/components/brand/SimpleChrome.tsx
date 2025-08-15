import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Building, Map, BarChart3, MessageSquare, Settings, Wrench, Users, Building2 } from "lucide-react";
import bristolLogoPath from "@assets/bristol-logo_1754934306711.gif";

interface ChromeProps {
  children: ReactNode;
}

export default function SimpleChrome({ children }: ChromeProps) {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Map", icon: Map },
    { path: "/sites", label: "Sites", icon: Building },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/demographics", label: "Demographics", icon: Users },
    { path: "/comparables", label: "Comparables", icon: Building2 },
    { path: "/chat", label: "Chat", icon: MessageSquare },
    { path: "/enterprise", label: "Enterprise", icon: Settings },
    { path: "/integrations", label: "Integrations", icon: Settings },
    { path: "/tools", label: "Tools", icon: Wrench },
  ];

  return (
    <div className="min-h-screen bg-bristol-ink">
      {/* Premium Bristol Header with Real Stucco Texture */}
      <header className="relative overflow-hidden shadow-2xl border-b-2 border-cyan-400/50 bg-slate-800" style={{
        backgroundImage: `
          radial-gradient(circle at 12% 34%, #374151 0%, transparent 20%),
          radial-gradient(circle at 67% 23%, #475569 0%, transparent 18%),
          radial-gradient(circle at 89% 78%, #374151 0%, transparent 22%),
          radial-gradient(circle at 23% 89%, #475569 0%, transparent 19%),
          radial-gradient(circle at 45% 12%, #334155 0%, transparent 17%),
          radial-gradient(circle at 78% 45%, #374151 0%, transparent 21%),
          radial-gradient(circle at 34% 67%, #475569 0%, transparent 16%),
          conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.08) 0deg, transparent 45deg, rgba(0,0,0,0.12) 90deg, transparent 135deg, rgba(255,255,255,0.06) 180deg, transparent 225deg, rgba(0,0,0,0.10) 270deg, transparent 315deg, rgba(255,255,255,0.08) 360deg),
          repeating-conic-gradient(from 45deg at 30% 70%, transparent 0deg, rgba(255,255,255,0.03) 2deg, transparent 4deg, rgba(0,0,0,0.06) 6deg, transparent 8deg)
        `,
        backgroundSize: '45px 67px, 38px 52px, 51px 43px, 42px 59px, 36px 48px, 49px 41px, 33px 55px, 25px 25px, 18px 18px',
        backgroundPosition: '0 0, 12px 8px, 25px 15px, 8px 22px, 18px 5px, 32px 18px, 5px 28px, 0 0, 9px 14px'
      }}>
        {/* Fine stucco grain texture overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 15% 25%, rgba(255,255,255,0.15) 0.5px, transparent 0.6px),
            radial-gradient(circle at 85% 75%, rgba(0,0,0,0.20) 0.3px, transparent 0.4px),
            radial-gradient(circle at 45% 65%, rgba(255,255,255,0.12) 0.4px, transparent 0.5px),
            radial-gradient(circle at 75% 15%, rgba(0,0,0,0.18) 0.6px, transparent 0.7px),
            radial-gradient(circle at 25% 85%, rgba(255,255,255,0.10) 0.3px, transparent 0.4px),
            radial-gradient(circle at 65% 45%, rgba(0,0,0,0.16) 0.5px, transparent 0.6px),
            radial-gradient(circle at 35% 5%, rgba(255,255,255,0.14) 0.4px, transparent 0.5px),
            radial-gradient(circle at 95% 35%, rgba(0,0,0,0.22) 0.2px, transparent 0.3px)
          `,
          backgroundSize: '8px 11px, 6px 9px, 7px 10px, 9px 7px, 5px 8px, 10px 6px, 8px 9px, 4px 7px',
          backgroundPosition: '0 0, 3px 2px, 6px 5px, 2px 7px, 9px 1px, 1px 8px, 4px 3px, 7px 6px'
        }}></div>
        
        {/* Physical texture bumps and ridges */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.08) 49%, rgba(255,255,255,0.08) 50%, transparent 51%),
            linear-gradient(-45deg, transparent 48%, rgba(0,0,0,0.12) 49%, rgba(0,0,0,0.12) 50%, transparent 51%),
            linear-gradient(135deg, transparent 47%, rgba(255,255,255,0.06) 48%, rgba(255,255,255,0.06) 52%, transparent 53%),
            linear-gradient(-135deg, transparent 47%, rgba(0,0,0,0.10) 48%, rgba(0,0,0,0.10) 52%, transparent 53%)
          `,
          backgroundSize: '3px 3px, 3px 3px, 5px 5px, 5px 5px',
          backgroundPosition: '0 0, 1px 1px, 2px 0, 0 2px'
        }}></div>
        
        {/* Minimal accent lines only */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
        </div>
        
        <div className="pl-0 pr-6 lg:pr-8 py-4 lg:py-6 relative">
          <div className="flex items-center justify-start w-full space-x-6 lg:space-x-8">
            {/* Bristol Logo & Brand - Aligned to left edge */}
            <div className="flex items-center space-x-4 lg:space-x-6 pl-6">
              <div className="relative flex-shrink-0 group">
                <div className="absolute inset-0 rounded-lg blur-sm transition-all duration-300" style={{
                  backgroundColor: 'rgba(157, 23, 77, 0.2)'
                }} 
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(157, 23, 77, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(157, 23, 77, 0.2)'}></div>
                <img 
                  src={bristolLogoPath} 
                  alt="Bristol Development Group" 
                  className="relative h-10 lg:h-12 w-auto max-w-none object-contain drop-shadow-xl hover:drop-shadow-2xl transition-all duration-300 filter brightness-110 hover:brightness-125"
                  style={{ 
                    imageRendering: 'crisp-edges',
                    WebkitImageRendering: 'crisp-edges',
                    msInterpolationMode: 'nearest-neighbor'
                  } as React.CSSProperties}
                />
              </div>
              <div className="border-l-2 border-cyan-400/40 pl-4 lg:pl-6 hidden sm:block">
                <div className="flex flex-col">
                  <p className="text-cyan-400 text-xs lg:text-sm font-bold tracking-[0.15em] lg:tracking-[0.25em] uppercase drop-shadow-sm">
                    Site Intelligence Platform
                  </p>
                  <div className="w-full h-px bg-gradient-to-r from-cyan-400/60 to-transparent mt-1"></div>
                </div>
              </div>
            </div>
            
            {/* Elite Navigation */}
            <nav className="flex items-center space-x-1 lg:space-x-2 ml-auto">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} href={path}>
                  <button
                    className={`
                      group flex items-center space-x-2 px-3 lg:px-4 py-2 lg:py-3 rounded-xl font-medium transition-all duration-300 relative overflow-hidden backdrop-blur-sm
                      ${location === path 
                        ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-bristol-ink shadow-xl shadow-cyan-400/40 font-bold border border-cyan-400/50' 
                        : 'text-bristol-fog hover:text-white hover:bg-white/8 border border-transparent hover:border-cyan-400/20'
                      }
                    `}
                  >
                    {location === path && (
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/95 via-cyan-500 to-cyan-400/95 animate-pulse"></div>
                    )}
                    <Icon className={`h-3.5 lg:h-4 w-3.5 lg:w-4 relative z-10 ${location === path ? 'text-bristol-ink drop-shadow-sm' : 'group-hover:text-cyan-400'} transition-all duration-300`} />
                    <span className="text-xs lg:text-sm tracking-wide relative z-10 hidden sm:inline">{label}</span>
                    {location !== path && (
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-cyan-400/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    )}
                    {location !== path && (
                      <div className="absolute inset-0 ring-1 ring-transparent group-hover:ring-cyan-400/30 rounded-xl transition-all duration-300"></div>
                    )}
                  </button>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content with light theme */}
      <main className="flex-1 bg-gradient-to-br from-bristol-cream via-white to-bristol-sky/10">
        {children}
      </main>

      {/* Footer - Exact Header Match */}
      <footer className="relative overflow-hidden shadow-2xl border-t-2 border-cyan-400/50 bg-slate-800" style={{
        backgroundImage: `
          radial-gradient(circle at 12% 34%, #374151 0%, transparent 20%),
          radial-gradient(circle at 67% 23%, #475569 0%, transparent 18%),
          radial-gradient(circle at 89% 78%, #374151 0%, transparent 22%),
          radial-gradient(circle at 23% 89%, #475569 0%, transparent 19%),
          radial-gradient(circle at 45% 12%, #334155 0%, transparent 17%),
          radial-gradient(circle at 78% 45%, #374151 0%, transparent 21%),
          radial-gradient(circle at 34% 67%, #475569 0%, transparent 16%),
          conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.08) 0deg, transparent 45deg, rgba(0,0,0,0.12) 90deg, transparent 135deg, rgba(255,255,255,0.06) 180deg, transparent 225deg, rgba(0,0,0,0.10) 270deg, transparent 315deg, rgba(255,255,255,0.08) 360deg),
          repeating-conic-gradient(from 45deg at 30% 70%, transparent 0deg, rgba(255,255,255,0.03) 2deg, transparent 4deg, rgba(0,0,0,0.06) 6deg, transparent 8deg)
        `,
        backgroundSize: '45px 67px, 38px 52px, 51px 43px, 42px 59px, 36px 48px, 49px 41px, 33px 55px, 25px 25px, 18px 18px',
        backgroundPosition: '0 0, 12px 8px, 25px 15px, 8px 22px, 18px 5px, 32px 18px, 5px 28px, 0 0, 9px 14px'
      }}>
        {/* Fine stucco grain texture overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 15% 25%, rgba(255,255,255,0.15) 0.5px, transparent 0.6px),
            radial-gradient(circle at 85% 75%, rgba(0,0,0,0.20) 0.3px, transparent 0.4px),
            radial-gradient(circle at 45% 65%, rgba(255,255,255,0.12) 0.4px, transparent 0.5px),
            radial-gradient(circle at 75% 15%, rgba(0,0,0,0.18) 0.6px, transparent 0.7px),
            radial-gradient(circle at 25% 85%, rgba(255,255,255,0.10) 0.3px, transparent 0.4px),
            radial-gradient(circle at 65% 45%, rgba(0,0,0,0.16) 0.5px, transparent 0.6px),
            radial-gradient(circle at 35% 5%, rgba(255,255,255,0.14) 0.4px, transparent 0.5px),
            radial-gradient(circle at 95% 35%, rgba(0,0,0,0.22) 0.2px, transparent 0.3px)
          `,
          backgroundSize: '8px 11px, 6px 9px, 7px 10px, 9px 7px, 5px 8px, 10px 6px, 8px 9px, 4px 7px',
          backgroundPosition: '0 0, 3px 2px, 6px 5px, 2px 7px, 9px 1px, 1px 8px, 4px 3px, 7px 6px'
        }}></div>
        
        {/* Physical texture bumps and ridges */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.08) 49%, rgba(255,255,255,0.08) 50%, transparent 51%),
            linear-gradient(-45deg, transparent 48%, rgba(0,0,0,0.12) 49%, rgba(0,0,0,0.12) 50%, transparent 51%),
            linear-gradient(135deg, transparent 47%, rgba(255,255,255,0.06) 48%, rgba(255,255,255,0.06) 52%, transparent 53%),
            linear-gradient(-135deg, transparent 47%, rgba(0,0,0,0.10) 48%, rgba(0,0,0,0.10) 52%, transparent 53%)
          `,
          backgroundSize: '3px 3px, 3px 3px, 5px 5px, 5px 5px',
          backgroundPosition: '0 0, 1px 1px, 2px 0, 0 2px'
        }}></div>
        
        {/* Accent lines */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent"></div>
        </div>
        
        <div className="pl-0 pr-6 lg:pr-8 py-4 lg:py-6 relative">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6">
            {/* Bristol Logo & Brand */}
            <div className="flex items-center space-x-4 lg:space-x-6">
              <div className="relative flex-shrink-0 group">
                <div className="absolute inset-0 rounded-lg blur-sm transition-all duration-300" style={{
                  backgroundColor: 'rgba(157, 23, 77, 0.2)'
                }} 
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(157, 23, 77, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(157, 23, 77, 0.2)'}></div>
                <img 
                  src={bristolLogoPath} 
                  alt="Bristol Development Group" 
                  className="relative h-10 lg:h-12 w-auto max-w-none object-contain drop-shadow-xl hover:drop-shadow-2xl transition-all duration-300 filter brightness-110 hover:brightness-125"
                  style={{ 
                    imageRendering: 'crisp-edges',
                    WebkitImageRendering: 'crisp-edges',
                    msInterpolationMode: 'nearest-neighbor'
                  } as React.CSSProperties}
                />
              </div>
              <div className="border-l-2 border-cyan-400/40 pl-4 lg:pl-6">
                <div className="flex flex-col">
                  <p className="text-cyan-400 text-xs lg:text-sm font-bold tracking-[0.15em] lg:tracking-[0.25em] uppercase drop-shadow-sm">
                    Elite Intelligence Platform
                  </p>
                  <div className="w-full h-px bg-gradient-to-r from-cyan-400/60 to-transparent mt-1"></div>
                </div>
              </div>
            </div>
            
            {/* Copyright Info */}
            <div className="flex items-center space-x-6 text-bristol-fog text-sm">
              <div className="text-bristol-fog text-sm">
                © 2025 Bristol Development Group. All rights reserved.
              </div>
              <div className="text-bristol-gold text-xs font-semibold tracking-wider">
                INSTITUTIONAL REAL ESTATE INTELLIGENCE
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}