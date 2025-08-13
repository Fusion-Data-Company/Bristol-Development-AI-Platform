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
import darkEarthBg from "@assets/3d-rendering-dark-earth-space_23-2151051281_1755125083945.avif";

export function Tools() {
  const [activeTab, setActiveTab] = useState("bls");

  return (
    <Chrome>
      <div className="min-h-screen relative overflow-hidden">
        {/* Dark Earth Space Background */}
        <div 
          className="absolute inset-0 bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${darkEarthBg})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center'
          }}
        ></div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Enterprise Elite Header */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-bristol-gold/10 via-bristol-maroon/5 via-blue-600/8 to-orange-600/10 rounded-3xl blur-3xl animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-bristol-gold/5 via-transparent to-bristol-maroon/5 rounded-3xl blur-2xl"></div>
            <div className="relative bg-gradient-to-br from-white/95 via-white/90 to-slate-50/95 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border-2 border-bristol-gold/30 bristol-enterprise-card">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-bristol-gold via-bristol-maroon to-orange-600 rounded-t-3xl"></div>
              <h1 className="text-6xl font-black bg-gradient-to-r from-bristol-maroon via-bristol-gold via-orange-600 to-bristol-ink bg-clip-text text-transparent mb-6 drop-shadow-2xl tracking-tight leading-tight">
                ECONOMIC INTELLIGENCE TOOLS
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-bristol-gold to-bristol-maroon rounded-full mb-6"></div>
              <p className="text-2xl font-bold bg-gradient-to-r from-bristol-maroon via-bristol-ink to-orange-700 bg-clip-text text-transparent leading-relaxed">
                Enterprise-Grade Live Data Analytics Platform
              </p>
              <p className="text-lg font-semibold text-slate-600 mt-2 leading-relaxed">
                Access real-time data from BLS, BEA, HUD, Foursquare, FBI, and NOAA APIs for comprehensive property intelligence
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 relative overflow-hidden h-32">
              {/* Enhanced gradient background with Bristol colors */}
              <div className="absolute inset-0 bg-gradient-to-r from-bristol-maroon/25 via-orange-600/20 via-blue-600/15 to-bristol-gold/35 backdrop-blur-xl border-4 border-bristol-gold/60 shadow-2xl rounded-3xl bristol-enterprise-card"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/15 to-transparent animate-pulse rounded-3xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-bristol-gold/10 via-transparent to-bristol-maroon/8 rounded-3xl"></div>
              <TabsTrigger 
                value="bls" 
                className="flex flex-col items-center gap-3 p-6 rounded-xl tools-tab-enhanced data-[state=active]:tools-tab-active text-black font-black transition-all duration-300 border-2 border-bristol-gold/40 shadow-lg bg-gradient-to-br from-white/90 to-slate-100/80 backdrop-blur-sm hover:border-bristol-gold/70 hover:shadow-xl"
              >
                <BarChart3 className="h-8 w-8 drop-shadow-lg text-bristol-maroon" />
                <span className="text-lg font-black tracking-wide">BLS</span>
                <span className="text-sm font-bold">Employment</span>
              </TabsTrigger>
              <TabsTrigger 
                value="bea"
                className="flex flex-col items-center gap-3 p-6 rounded-xl tools-tab-enhanced data-[state=active]:tools-tab-active text-black font-black transition-all duration-300 border-2 border-bristol-gold/40 shadow-lg bg-gradient-to-br from-white/90 to-slate-100/80 backdrop-blur-sm hover:border-bristol-gold/70 hover:shadow-xl"
              >
                <TrendingUp className="h-8 w-8 drop-shadow-lg text-bristol-maroon" />
                <span className="text-lg font-black tracking-wide">BEA</span>
                <span className="text-sm font-bold">GDP/Income</span>
              </TabsTrigger>
              <TabsTrigger 
                value="hud"
                className="flex flex-col items-center gap-3 p-6 rounded-xl tools-tab-enhanced data-[state=active]:tools-tab-active text-black font-black transition-all duration-300 border-2 border-bristol-gold/40 shadow-lg bg-gradient-to-br from-white/90 to-slate-100/80 backdrop-blur-sm hover:border-bristol-gold/70 hover:shadow-xl"
              >
                <Home className="h-8 w-8 drop-shadow-lg text-bristol-maroon" />
                <span className="text-lg font-black tracking-wide">HUD</span>
                <span className="text-sm font-bold">Vacancy</span>
              </TabsTrigger>
              <TabsTrigger 
                value="foursquare"
                className="flex flex-col items-center gap-3 p-6 rounded-xl tools-tab-enhanced data-[state=active]:tools-tab-active text-black font-black transition-all duration-300 border-2 border-bristol-gold/40 shadow-lg bg-gradient-to-br from-white/90 to-slate-100/80 backdrop-blur-sm hover:border-bristol-gold/70 hover:shadow-xl"
              >
                <MapPin className="h-8 w-8 drop-shadow-lg text-bristol-maroon" />
                <span className="text-lg font-black tracking-wide">Places</span>
                <span className="text-sm font-bold">Foursquare</span>
              </TabsTrigger>
              <TabsTrigger 
                value="fbi"
                className="flex flex-col items-center gap-3 p-6 rounded-xl tools-tab-enhanced data-[state=active]:tools-tab-active text-black font-black transition-all duration-300 border-2 border-bristol-gold/40 shadow-lg bg-gradient-to-br from-white/90 to-slate-100/80 backdrop-blur-sm hover:border-bristol-gold/70 hover:shadow-xl"
              >
                <Shield className="h-8 w-8 drop-shadow-lg text-bristol-maroon" />
                <span className="text-lg font-black tracking-wide">Crime</span>
                <span className="text-sm font-bold">FBI</span>
              </TabsTrigger>
              <TabsTrigger 
                value="noaa"
                className="flex flex-col items-center gap-3 p-6 rounded-xl tools-tab-enhanced data-[state=active]:tools-tab-active text-black font-black transition-all duration-300 border-2 border-bristol-gold/40 shadow-lg bg-gradient-to-br from-white/90 to-slate-100/80 backdrop-blur-sm hover:border-bristol-gold/70 hover:shadow-xl"
              >
                <Cloud className="h-8 w-8 drop-shadow-lg text-bristol-maroon" />
                <span className="text-lg font-black tracking-wide">Climate</span>
                <span className="text-sm font-bold">NOAA</span>
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