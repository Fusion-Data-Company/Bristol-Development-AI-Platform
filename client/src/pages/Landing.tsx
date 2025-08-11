import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThinkingIndicator } from "@/components/chat/ThinkingIndicator";
import { ParallaxBackground } from "@/components/ParallaxBackground";
import { 
  MapPin, 
  Building, 
  BarChart3, 
  Search, 
  Brain, 
  Mic, 
  Paperclip, 
  Send,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const backgroundImages = [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080", // Modern luxury apartments
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080", // Aerial development view
  ];

  return (
    <div className="min-h-screen bg-bristol-fog font-sans relative overflow-x-hidden">
      {/* Parallax Background */}
      <ParallaxBackground images={backgroundImages} />

      {/* Navigation Header */}
      <header className="relative z-10 bg-bristol-ink text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-bristol-maroon rounded-lg flex items-center justify-center">
                <span className="text-white font-serif font-bold text-xl">B</span>
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold">Bristol Development</h1>
                <p className="text-bristol-stone text-sm">Site Intelligence Platform</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="hover:text-bristol-gold transition-colors">Features</a>
              <a href="#analytics" className="hover:text-bristol-gold transition-colors">Analytics</a>
              <a href="#integrations" className="hover:text-bristol-gold transition-colors">Integrations</a>
              <Button 
                onClick={handleLogin}
                className="bg-bristol-maroon hover:bg-bristol-maroon/90 text-white"
              >
                Sign In
              </Button>
            </nav>
            
            <div className="md:hidden">
              <Button 
                onClick={handleLogin}
                size="sm"
                className="bg-bristol-maroon hover:bg-bristol-maroon/90 text-white"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section with AI Assistant */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4">
            {/* AI Assistant Interface */}
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
              {/* Logo with Thinking Animation */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <ThinkingIndicator isThinking={false} size="lg" />
                </div>
              </div>

              {/* Welcome Message */}
              <div className="text-center mb-10">
                <h2 className="text-4xl font-serif font-bold bg-gradient-to-r from-bristol-maroon to-bristol-gold bg-clip-text text-transparent mb-4">
                  Bristol Site Intelligence
                </h2>
                <p className="text-bristol-stone text-lg max-w-2xl mx-auto">
                  Advanced AI-powered analysis for multifamily development opportunities across the Sunbelt markets
                </p>
              </div>

              {/* Chat Input Interface Preview */}
              <div className="bg-white rounded-xl shadow-lg border border-bristol-sky overflow-hidden mb-6">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <input 
                      type="text" 
                      placeholder="Ask about site feasibility, market comps, or development metrics..."
                      className="flex-1 text-bristol-ink text-lg outline-none placeholder:text-bristol-stone"
                      disabled
                    />
                  </div>
                </div>

                {/* Function Toggles Preview */}
                <div className="px-6 py-4 flex items-center justify-between border-t border-bristol-sky">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-bristol-maroon text-white hover:bg-bristol-maroon/90">
                      <Search className="w-4 h-4 mr-1" />
                      Market Search
                    </Badge>
                    
                    <Badge variant="outline" className="border-bristol-sky text-bristol-stone hover:bg-bristol-maroon hover:text-white hover:border-bristol-maroon">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Deep Analysis
                    </Badge>
                    
                    <Badge variant="outline" className="border-bristol-sky text-bristol-stone hover:bg-bristol-maroon hover:text-white hover:border-bristol-maroon">
                      <Brain className="w-4 h-4 mr-1" />
                      Bristol Mode
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button className="p-3 text-bristol-stone hover:text-bristol-maroon transition-colors">
                      <Mic className="w-5 h-5" />
                    </button>
                    <button className="p-3 text-bristol-stone hover:text-bristol-maroon transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button className="w-12 h-12 bg-bristol-maroon text-white rounded-full flex items-center justify-center hover:bg-bristol-maroon/90 transition-all shadow-lg">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="bg-bristol-maroon hover:bg-bristol-maroon/90 text-white shadow-xl hover:shadow-2xl transition-all"
                >
                  Get Started with Bristol Intelligence
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 bg-gradient-to-b from-transparent to-bristol-sky/50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif font-bold text-bristol-ink mb-4">
                Comprehensive Site Intelligence
              </h2>
              <p className="text-bristol-stone text-lg">
                Enterprise-grade analytics for multifamily development decisions
              </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-bristol-sky hover:shadow-xl transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-bristol-maroon/10 rounded-lg flex items-center justify-center group-hover:bg-bristol-maroon/20 transition-all">
                      <MapPin className="w-6 h-6 text-bristol-maroon" />
                    </div>
                    <div>
                      <h3 className="font-serif font-semibold text-bristol-ink">Site Analysis</h3>
                      <p className="text-sm text-bristol-stone">Comprehensive feasibility study</p>
                    </div>
                  </div>
                  <p className="text-bristol-stone text-sm">
                    Analyze demographic trends, zoning compliance, and development potential for target sites
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-bristol-sky hover:shadow-xl transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-bristol-maroon/10 rounded-lg flex items-center justify-center group-hover:bg-bristol-maroon/20 transition-all">
                      <Building className="w-6 h-6 text-bristol-maroon" />
                    </div>
                    <div>
                      <h3 className="font-serif font-semibold text-bristol-ink">Comp Analysis</h3>
                      <p className="text-sm text-bristol-stone">1-100 Bristol scoring methodology</p>
                    </div>
                  </div>
                  <p className="text-bristol-stone text-sm">
                    Compare amenities, rent performance, and market positioning against target properties
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-bristol-sky hover:shadow-xl transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-bristol-maroon/10 rounded-lg flex items-center justify-center group-hover:bg-bristol-maroon/20 transition-all">
                      <BarChart3 className="w-6 h-6 text-bristol-maroon" />
                    </div>
                    <div>
                      <h3 className="font-serif font-semibold text-bristol-ink">Market Intelligence</h3>
                      <p className="text-sm text-bristol-stone">Real-time data integration</p>
                    </div>
                  </div>
                  <p className="text-bristol-stone text-sm">
                    Access Census ACS, HUD FMR, BLS employment data, and ArcGIS market insights
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Integration Status Section */}
        <section id="integrations" className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-white/20">
              <h2 className="text-2xl font-serif font-bold text-bristol-ink mb-8 text-center">
                Platform Integrations
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 border border-bristol-sky rounded-lg hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-bristol-ink mb-1">Microsoft 365</h3>
                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                    Ready
                  </Badge>
                </div>

                <div className="text-center p-4 border border-bristol-sky rounded-lg hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-bristol-ink mb-1">Apify</h3>
                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                    Active
                  </Badge>
                </div>

                <div className="text-center p-4 border border-bristol-sky rounded-lg hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-bristol-ink mb-1">n8n</h3>
                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                    Connected
                  </Badge>
                </div>

                <div className="text-center p-4 border border-bristol-sky rounded-lg hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-bristol-ink mb-1">ArcGIS</h3>
                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                    Online
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-bristol-ink text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-8 h-8 bg-bristol-maroon rounded-lg flex items-center justify-center">
              <span className="text-white font-serif font-bold">B</span>
            </div>
            <span className="font-serif text-lg">Bristol Development Group</span>
          </div>
          <p className="text-bristol-stone text-sm">
            Enterprise Site Intelligence Platform • Powered by Advanced AI Analytics
          </p>
        </div>
      </footer>
    </div>
  );
}
