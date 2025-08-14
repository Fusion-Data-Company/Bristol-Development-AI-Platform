import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Building, Map, BarChart3, MessageSquare, Settings, Wrench, Users, Building2 } from "lucide-react";
import bristolLogoPath from "@assets/bristol-logo_1754934306711.gif";

interface ChromeProps {
  children: ReactNode;
}

export default function Chrome({ children }: ChromeProps) {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Map", icon: Map },
    { path: "/sites", label: "Sites", icon: Building },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/demographics", label: "Demographics", icon: Users },
    { path: "/comparables", label: "Comparables", icon: Building2 },
    { path: "/chat", label: "Chat", icon: MessageSquare },
    { path: "/integrations", label: "Integrations", icon: Settings },
    { path: "/tools", label: "Tools", icon: Wrench },
  ];

  return (
    <div className="min-h-screen bg-bristol-ink">
      {/* Premium Bristol Header */}
      <header className="bg-gradient-to-r from-bristol-ink via-bristol-maroon/10 to-bristol-ink shadow-2xl border-b-2 border-bristol-gold/50 relative overflow-hidden">
        {/* Sophisticated background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-bristol-ink/98 via-bristol-maroon/8 to-bristol-ink/98"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-bristol-gold/80 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-bristol-gold/40 to-transparent"></div>
        </div>
        
        {/* Subtle animated glow */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bristol-gold/5 to-transparent animate-pulse"></div>
        </div>
        
        <div className="px-6 lg:px-8 py-4 lg:py-6 relative">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Left: Bristol Logo & Brand */}
            <div className="flex items-center space-x-4 lg:space-x-6">
              <div className="relative flex-shrink-0 group">
                <div className="absolute inset-0 bg-bristol-gold/10 rounded-lg blur-sm group-hover:bg-bristol-gold/20 transition-all duration-300"></div>
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
              <div className="border-l-2 border-bristol-gold/40 pl-4 lg:pl-6 hidden sm:block">
                <div className="flex flex-col">
                  <p className="text-bristol-gold text-xs lg:text-sm font-bold tracking-[0.15em] lg:tracking-[0.25em] uppercase drop-shadow-sm">
                    Site Intelligence Platform
                  </p>
                  <div className="w-full h-px bg-gradient-to-r from-bristol-gold/60 to-transparent mt-1"></div>
                </div>
              </div>
            </div>
            
            {/* Right: Elite Navigation */}
            <nav className="flex items-center space-x-1 lg:space-x-2">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} href={path}>
                  <button
                    className={`
                      group flex items-center space-x-2 px-3 lg:px-4 py-2 lg:py-3 rounded-xl font-medium transition-all duration-300 relative overflow-hidden backdrop-blur-sm
                      ${location === path 
                        ? 'bg-gradient-to-r from-bristol-gold to-bristol-gold/90 text-bristol-ink shadow-xl shadow-bristol-gold/40 font-bold border border-bristol-gold/50' 
                        : 'text-bristol-fog hover:text-white hover:bg-white/8 border border-transparent hover:border-bristol-gold/20'
                      }
                    `}
                  >
                    {location === path && (
                      <div className="absolute inset-0 bg-gradient-to-br from-bristol-gold/95 via-bristol-gold to-bristol-gold/95 animate-pulse"></div>
                    )}
                    <Icon className={`h-3.5 lg:h-4 w-3.5 lg:w-4 relative z-10 ${location === path ? 'text-bristol-ink drop-shadow-sm' : 'group-hover:text-bristol-gold'} transition-all duration-300`} />
                    <span className="text-xs lg:text-sm tracking-wide relative z-10 hidden sm:inline">{label}</span>
                    {location !== path && (
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-bristol-gold/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    )}
                    {location !== path && (
                      <div className="absolute inset-0 ring-1 ring-transparent group-hover:ring-bristol-gold/30 rounded-xl transition-all duration-300"></div>
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

      {/* Unified Footer */}
      <footer className="bg-bristol-ink border-t border-bristol-gold/30">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-6">
              <div className="text-bristol-fog text-sm">
                © 2024 Bristol Development Group. All rights reserved.
              </div>
              <div className="text-bristol-gold text-xs font-semibold tracking-wider">
                INSTITUTIONAL REAL ESTATE INTELLIGENCE
              </div>
            </div>
            <div className="flex items-center space-x-4 text-bristol-fog text-sm">
              <span>v2.0.1</span>
              <span className="text-bristol-gold">•</span>
              <span>Enterprise Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}