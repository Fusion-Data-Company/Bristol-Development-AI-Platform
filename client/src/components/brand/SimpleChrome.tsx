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
      {/* Dark Bristol Header with Logo */}
      <header className="bg-bristol-ink shadow-2xl border-b-2 border-bristol-gold/30 backdrop-blur-md relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-bristol-ink via-bristol-maroon/5 to-bristol-ink"></div>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_theme(colors.bristol.gold)_1px,_transparent_0)] bg-[size:24px_24px]"></div>
        </div>
        
        <div className="container mx-auto px-8 py-6 relative">
          <div className="flex items-center justify-between">
            {/* Left: Bristol Branding */}
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="absolute -inset-2 bg-bristol-gold/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300 animate-pulse"></div>
                <Building className="h-12 w-12 text-bristol-gold relative z-10 drop-shadow-lg" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-cinzel font-bold text-bristol-fog tracking-widest drop-shadow-lg">
                  BRISTOL
                </h1>
                <p className="text-bristol-gold text-sm font-semibold tracking-[0.3em] uppercase opacity-90">
                  Site Intelligence Platform
                </p>
              </div>
            </div>
            
            {/* Right: Navigation & Bristol Logo */}
            <div className="flex items-center space-x-6">
              <nav className="flex items-center space-x-2">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link key={path} href={path}>
                    <Button
                      variant="ghost"
                      className={`
                        flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm border
                        ${location === path 
                          ? 'bg-bristol-gold text-bristol-ink shadow-xl shadow-bristol-gold/25 hover:shadow-bristol-gold/40 border-bristol-gold/50 font-bold scale-105' 
                          : 'text-bristol-fog hover:text-bristol-gold hover:bg-bristol-gold/10 hover:shadow-lg border-bristol-stone/20 hover:border-bristol-gold/30'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm tracking-wide">{label}</span>
                    </Button>
                  </Link>
                ))}
              </nav>
              
              {/* Bristol Logo in top right */}
              <div className="relative group ml-6">
                <div className="absolute -inset-3 bg-bristol-gold/20 rounded-2xl blur-md group-hover:bg-bristol-gold/30 transition-all duration-300"></div>
                <img 
                  src={bristolLogoPath} 
                  alt="Bristol Development Group" 
                  className="h-16 w-auto relative z-10 drop-shadow-2xl group-hover:scale-105 transition-transform duration-300 rounded-lg border border-bristol-gold/30"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with dark theme */}
      <main className="flex-1 bg-gradient-to-br from-bristol-ink via-bristol-maroon/5 to-bristol-ink min-h-screen">
        {children}
      </main>
    </div>
  );
}