import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Building, Map, BarChart3, MessageSquare, Settings, Wrench } from "lucide-react";

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
    <div className="min-h-screen bg-bristol-fog">
      {/* Header */}
      <header className="bg-bristol-ink shadow-xl border-b border-bristol-maroon/20 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Building className="h-10 w-10 text-bristol-gold" />
                <div className="absolute -inset-1 bg-bristol-maroon/20 rounded-full blur-sm animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-cinzel font-bold text-bristol-fog tracking-wide">
                  Bristol
                </h1>
                <p className="text-bristol-stone text-sm font-medium tracking-wider">
                  SITE INTELLIGENCE
                </p>
              </div>
            </div>
            
            <nav className="flex items-center space-x-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} href={path}>
                  <Button
                    variant={location === path ? "default" : "ghost"}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                      ${location === path 
                        ? 'bg-bristol-maroon text-white shadow-lg shadow-bristol-maroon/25 hover:bg-bristol-maroon/90' 
                        : 'text-bristol-stone hover:text-bristol-fog hover:bg-bristol-maroon/10 hover:shadow-md'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm tracking-wide">{label}</span>
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}