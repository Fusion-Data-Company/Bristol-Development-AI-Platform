import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Building, Map, BarChart3, MessageSquare, Settings, Wrench } from "lucide-react";
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
    { path: "/chat", label: "Chat", icon: MessageSquare },
    { path: "/integrations", label: "Integrations", icon: Settings },
    { path: "/tools", label: "Tools", icon: Wrench },
  ];

  return (
    <div className="min-h-screen bg-bristol-ink">
      {/* Premium Bristol Header */}
      <header className="bg-gradient-to-r from-bristol-ink via-bristol-maroon/20 to-bristol-ink shadow-2xl border-b border-bristol-gold/40 relative overflow-hidden">
        {/* Elegant background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-bristol-ink/95 via-bristol-maroon/10 to-bristol-ink/95"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-bristol-gold/60 to-transparent"></div>
        </div>
        
        <div className="px-8 py-5 relative">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Left: Bristol Logo & Brand */}
            <div className="flex items-center space-x-5">
              <div className="relative">
                <img 
                  src={bristolLogoPath} 
                  alt="Bristol Development Group" 
                  className="h-14 w-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300 filter brightness-110"
                />
              </div>
              <div className="border-l border-bristol-gold/30 pl-5">
                <h1 className="text-3xl font-cinzel font-bold text-white tracking-wide drop-shadow-lg">
                  BRISTOL
                </h1>
                <p className="text-bristol-gold text-xs font-semibold tracking-[0.4em] uppercase mt-0.5">
                  Site Intelligence Platform
                </p>
              </div>
            </div>
            
            {/* Right: Premium Navigation */}
            <nav className="flex items-center space-x-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} href={path}>
                  <button
                    className={`
                      group flex items-center space-x-2 px-5 py-3 rounded-lg font-medium transition-all duration-300 relative overflow-hidden
                      ${location === path 
                        ? 'bg-bristol-gold text-bristol-ink shadow-lg shadow-bristol-gold/30 font-bold' 
                        : 'text-bristol-fog hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    {location === path && (
                      <div className="absolute inset-0 bg-gradient-to-r from-bristol-gold via-bristol-gold/90 to-bristol-gold"></div>
                    )}
                    <Icon className={`h-4 w-4 relative z-10 ${location === path ? 'text-bristol-ink' : 'group-hover:text-bristol-gold'} transition-colors duration-300`} />
                    <span className="text-sm tracking-wide relative z-10">{label}</span>
                    {location !== path && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-bristol-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </button>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content with light theme */}
      <main className="flex-1 bg-gradient-to-br from-bristol-cream via-white to-bristol-sky/10 min-h-screen">
        {children}
      </main>
    </div>
  );
}