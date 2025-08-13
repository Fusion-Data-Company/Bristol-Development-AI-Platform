import { useState } from "react";
import Chrome from "@/components/brand/Chrome";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Home, MapPin, Shield, Cloud } from "lucide-react";
import { BLSTool } from "../components/tools/BLSTool";
import { BEATool } from "../components/tools/BEATool";
import { HUDTool } from "../components/tools/HUDTool";
import { FoursquareTool } from "../components/tools/FoursquareTool";
import { FBITool } from "../components/tools/FBITool";
import { NOAATool } from "../components/tools/NOAATool";

export function Tools() {
  const [activeTab, setActiveTab] = useState("bls");

  return (
    <Chrome>
      <div className="min-h-screen relative overflow-hidden">
        {/* AI Circuit Board Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/attached_assets/Screenshot 2025-08-13 at 15.34.14_1755124461851.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.25) contrast(1.3) saturate(0.9)'
          }}
        ></div>
        {/* Dark overlay for content readability */}
        <div className="absolute inset-0 bg-black/75"></div>
        {/* Subtle tech gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 via-purple-500/5 to-pink-500/8"></div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Enterprise Elite Header */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-bristol-gold/10 via-bristol-maroon/5 via-blue-600/8 to-purple-600/10 rounded-3xl blur-3xl animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-bristol-gold/5 via-transparent to-bristol-maroon/5 rounded-3xl blur-2xl"></div>
            <div className="relative bg-gradient-to-br from-white/95 via-white/90 to-slate-50/95 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border-2 border-bristol-gold/30 bristol-enterprise-card">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-bristol-gold via-bristol-maroon to-purple-600 rounded-t-3xl"></div>
              <h1 className="text-6xl font-black bg-gradient-to-r from-bristol-maroon via-bristol-gold via-purple-600 to-bristol-ink bg-clip-text text-transparent mb-6 drop-shadow-2xl tracking-tight leading-tight">
                ECONOMIC INTELLIGENCE TOOLS
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-bristol-gold to-bristol-maroon rounded-full mb-6"></div>
              <p className="text-2xl font-bold bg-gradient-to-r from-bristol-maroon via-bristol-ink to-purple-700 bg-clip-text text-transparent leading-relaxed">
                Enterprise-Grade Live Data Analytics Platform
              </p>
              <p className="text-lg font-semibold text-slate-600 mt-2 leading-relaxed">
                Access real-time data from BLS, BEA, HUD, Foursquare, FBI, and NOAA APIs for comprehensive property intelligence
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-bristol-maroon/20 via-purple-600/15 via-blue-600/15 to-bristol-gold/30 backdrop-blur-xl border-4 border-bristol-gold/50 shadow-2xl rounded-3xl h-auto p-6 bristol-enterprise-card relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
              <TabsTrigger 
                value="bls" 
                className="flex flex-col items-center gap-2 p-4 rounded-xl tools-tab-enhanced data-[state=active]:tools-tab-active text-slate-700 transition-all duration-300 border border-transparent"
              >
                <BarChart3 className="h-6 w-6 drop-shadow-lg" />
                <span className="text-sm font-black tracking-wide">BLS</span>
                <span className="text-xs font-bold opacity-90">Employment</span>
              </TabsTrigger>
              <TabsTrigger 
                value="bea"
                className="flex flex-col items-center gap-2 p-4 rounded-xl tools-tab-enhanced data-[state=active]:tools-tab-active text-slate-700 transition-all duration-300 border border-transparent"
              >
                <TrendingUp className="h-6 w-6 drop-shadow-lg" />
                <span className="text-sm font-black tracking-wide">BEA</span>
                <span className="text-xs font-bold opacity-90">GDP/Income</span>
              </TabsTrigger>
              <TabsTrigger 
                value="hud"
                className="flex flex-col items-center gap-2 p-4 rounded-xl tools-tab-enhanced data-[state=active]:tools-tab-active text-slate-700 transition-all duration-300 border border-transparent"
              >
                <Home className="h-6 w-6 drop-shadow-lg" />
                <span className="text-sm font-black tracking-wide">HUD</span>
                <span className="text-xs font-bold opacity-90">Vacancy</span>
              </TabsTrigger>
              <TabsTrigger 
                value="foursquare"
                className="flex flex-col items-center gap-2 p-4 rounded-xl tools-tab-enhanced data-[state=active]:tools-tab-active text-slate-700 transition-all duration-300 border border-transparent"
              >
                <MapPin className="h-6 w-6 drop-shadow-lg" />
                <span className="text-sm font-black tracking-wide">Places</span>
                <span className="text-xs font-bold opacity-90">Foursquare</span>
              </TabsTrigger>
              <TabsTrigger 
                value="fbi"
                className="flex flex-col items-center gap-2 p-4 rounded-xl tools-tab-enhanced data-[state=active]:tools-tab-active text-slate-700 transition-all duration-300 border border-transparent"
              >
                <Shield className="h-6 w-6 drop-shadow-lg" />
                <span className="text-sm font-black tracking-wide">Crime</span>
                <span className="text-xs font-bold opacity-90">FBI</span>
              </TabsTrigger>
              <TabsTrigger 
                value="noaa"
                className="flex flex-col items-center gap-2 p-4 rounded-xl tools-tab-enhanced data-[state=active]:tools-tab-active text-slate-700 transition-all duration-300 border border-transparent"
              >
                <Cloud className="h-6 w-6 drop-shadow-lg" />
                <span className="text-sm font-black tracking-wide">Climate</span>
                <span className="text-xs font-bold opacity-90">NOAA</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-8">
              <TabsContent value="bls" className="space-y-6">
                <BLSTool />
              </TabsContent>

              <TabsContent value="bea" className="space-y-6">
                <BEATool />
              </TabsContent>

              <TabsContent value="hud" className="space-y-6">
                <HUDTool />
              </TabsContent>

              <TabsContent value="foursquare" className="space-y-6">
                <FoursquareTool />
              </TabsContent>

              <TabsContent value="fbi" className="space-y-6">
                <FBITool />
              </TabsContent>

              <TabsContent value="noaa" className="space-y-6">
                <NOAATool />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </Chrome>
  );
}