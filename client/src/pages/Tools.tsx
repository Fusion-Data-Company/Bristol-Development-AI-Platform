import { useState } from "react";
import Chrome from "@/components/brand/SimpleChrome";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Home, MapPin, Shield, Cloud } from "lucide-react";
import { BLSTool } from "../components/tools/BLSTool";
import { BEATool } from "../components/tools/BEATool";
import { HUDTool } from "../components/tools/HUDTool";
import { FoursquareTool } from "../components/tools/FoursquareTool";
import { FBITool } from "../components/tools/FBITool";
import { NOAATool } from "../components/tools/NOAATool";
import bristolToolsBg from "@assets/Icon+1_1755405975901.webp";

export function Tools() {
  const [activeTab, setActiveTab] = useState("bls");

  return (
    <Chrome>
      <div className="min-h-screen relative overflow-hidden">
        {/* Bristol Background Image - Super HD Clear */}
        <div 
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url(${bristolToolsBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>

        <div className="container mx-auto px-4 py-8 relative z-10 bg-white/85 backdrop-blur-sm min-h-screen">
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
            <TabsList className="grid w-full grid-cols-6 relative overflow-hidden h-64 p-12 gap-6">
              {/* Premium multi-layer background with Bristol colors */}
              <div className="absolute inset-0 bg-gradient-to-r from-bristol-maroon/40 via-orange-600/35 via-blue-600/30 to-bristol-gold/50 backdrop-blur-xl border-4 border-bristol-gold/80 shadow-2xl rounded-3xl bristol-enterprise-card"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/25 to-transparent animate-pulse rounded-3xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-bristol-gold/20 via-transparent to-bristol-maroon/18 rounded-3xl"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/15 via-transparent to-white/8 rounded-3xl"></div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-bristol-gold/15 via-orange-500/8 to-transparent rounded-3xl"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-bristol-maroon/10 via-transparent to-blue-600/8 rounded-3xl"></div>
              <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,_var(--tw-gradient-stops))] from-bristol-gold/5 via-transparent to-bristol-maroon/5 rounded-3xl animate-pulse"></div>
              <TabsTrigger 
                value="bls" 
                className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl tools-tab-enhanced data-[state=active]:tools-tab-active text-black font-black transition-all duration-300 border-4 border-bristol-gold/70 shadow-xl bg-gradient-to-br from-white/98 to-slate-50/95 backdrop-blur-xl hover:border-bristol-gold/100 hover:shadow-2xl relative overflow-hidden"
              >
                {/* Premium multi-layer card background */}
                <div className="absolute inset-0 bg-gradient-to-br from-bristol-gold/25 via-bristol-maroon/12 to-orange-500/18 rounded-2xl"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/8 to-bristol-gold/8 rounded-2xl"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,_var(--tw-gradient-stops))] from-bristol-gold/15 via-transparent to-transparent rounded-2xl"></div>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.1)_45%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.1)_55%,transparent_100%)] rounded-2xl"></div>
                <div className="absolute inset-0 border border-white/20 rounded-2xl"></div>
                <div className="relative z-20 flex flex-col items-center gap-3">
                  <BarChart3 className="h-10 w-10 drop-shadow-xl text-bristol-gold filter brightness-110" />
                  <span className="text-xl font-black tracking-wide drop-shadow-sm">BLS</span>
                  <span className="text-base font-bold drop-shadow-sm opacity-90">Employment</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="bea"
                className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl tools-tab-enhanced data-[state=active]:tools-tab-active text-black font-black transition-all duration-300 border-4 border-bristol-gold/70 shadow-xl bg-gradient-to-br from-white/98 to-slate-50/95 backdrop-blur-xl hover:border-bristol-gold/100 hover:shadow-2xl relative overflow-hidden"
              >
                {/* Premium multi-layer card background */}
                <div className="absolute inset-0 bg-gradient-to-br from-bristol-gold/25 via-bristol-maroon/12 to-blue-600/18 rounded-2xl"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/8 to-green-500/8 rounded-2xl"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_var(--tw-gradient-stops))] from-green-500/15 via-transparent to-transparent rounded-2xl"></div>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.1)_45%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.1)_55%,transparent_100%)] rounded-2xl"></div>
                <div className="absolute inset-0 border border-white/20 rounded-2xl"></div>
                <div className="relative z-20 flex flex-col items-center gap-3">
                  <TrendingUp className="h-10 w-10 drop-shadow-xl text-green-600 filter brightness-110" />
                  <span className="text-xl font-black tracking-wide drop-shadow-sm">BEA</span>
                  <span className="text-base font-bold drop-shadow-sm opacity-90">GDP/Income</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="hud"
                className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl tools-tab-enhanced data-[state=active]:tools-tab-active text-black font-black transition-all duration-300 border-4 border-bristol-gold/70 shadow-xl bg-gradient-to-br from-white/98 to-slate-50/95 backdrop-blur-xl hover:border-bristol-gold/100 hover:shadow-2xl relative overflow-hidden"
              >
                {/* Premium multi-layer card background */}
                <div className="absolute inset-0 bg-gradient-to-br from-bristol-maroon/25 via-bristol-gold/12 to-orange-600/18 rounded-2xl"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/8 to-orange-500/8 rounded-2xl"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,_var(--tw-gradient-stops))] from-orange-500/15 via-transparent to-transparent rounded-2xl"></div>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.1)_45%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.1)_55%,transparent_100%)] rounded-2xl"></div>
                <div className="absolute inset-0 border border-white/20 rounded-2xl"></div>
                <div className="relative z-20 flex flex-col items-center gap-3">
                  <Home className="h-10 w-10 drop-shadow-xl text-orange-600 filter brightness-110" />
                  <span className="text-xl font-black tracking-wide drop-shadow-sm">HUD</span>
                  <span className="text-base font-bold drop-shadow-sm opacity-90">Vacancy</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="foursquare"
                className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl tools-tab-enhanced data-[state=active]:tools-tab-active text-black font-black transition-all duration-300 border-4 border-bristol-gold/70 shadow-xl bg-gradient-to-br from-white/98 to-slate-50/95 backdrop-blur-xl hover:border-bristol-gold/100 hover:shadow-2xl relative overflow-hidden"
              >
                {/* Premium multi-layer card background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/25 via-bristol-gold/12 to-bristol-maroon/18 rounded-2xl"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/8 to-blue-500/8 rounded-2xl"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_var(--tw-gradient-stops))] from-blue-500/15 via-transparent to-transparent rounded-2xl"></div>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.1)_45%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.1)_55%,transparent_100%)] rounded-2xl"></div>
                <div className="absolute inset-0 border border-white/20 rounded-2xl"></div>
                <div className="relative z-20 flex flex-col items-center gap-3">
                  <MapPin className="h-10 w-10 drop-shadow-xl text-blue-600 filter brightness-110" />
                  <span className="text-xl font-black tracking-wide drop-shadow-sm">Places</span>
                  <span className="text-base font-bold drop-shadow-sm opacity-90">Foursquare</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="fbi"
                className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl tools-tab-enhanced data-[state=active]:tools-tab-active text-black font-black transition-all duration-300 border-4 border-bristol-gold/70 shadow-xl bg-gradient-to-br from-white/98 to-slate-50/95 backdrop-blur-xl hover:border-bristol-gold/100 hover:shadow-2xl relative overflow-hidden"
              >
                {/* Premium multi-layer card background */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600/25 via-bristol-maroon/12 to-bristol-gold/18 rounded-2xl"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/8 to-bristol-maroon/8 rounded-2xl"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_60%,_var(--tw-gradient-stops))] from-bristol-maroon/15 via-transparent to-transparent rounded-2xl"></div>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.1)_45%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.1)_55%,transparent_100%)] rounded-2xl"></div>
                <div className="absolute inset-0 border border-white/20 rounded-2xl"></div>
                <div className="relative z-20 flex flex-col items-center gap-3">
                  <Shield className="h-10 w-10 drop-shadow-xl text-bristol-maroon filter brightness-110" />
                  <span className="text-xl font-black tracking-wide drop-shadow-sm">Crime</span>
                  <span className="text-base font-bold drop-shadow-sm opacity-90">FBI</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="noaa"
                className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl tools-tab-enhanced data-[state=active]:tools-tab-active text-black font-black transition-all duration-300 border-4 border-bristol-gold/70 shadow-xl bg-gradient-to-br from-white/98 to-slate-50/95 backdrop-blur-xl hover:border-bristol-gold/100 hover:shadow-2xl relative overflow-hidden"
              >
                {/* Premium multi-layer card background */}
                <div className="absolute inset-0 bg-gradient-to-br from-bristol-gold/25 via-blue-600/12 to-bristol-maroon/18 rounded-2xl"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/8 to-cyan-500/8 rounded-2xl"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,_var(--tw-gradient-stops))] from-cyan-500/15 via-transparent to-transparent rounded-2xl"></div>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.1)_45%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.1)_55%,transparent_100%)] rounded-2xl"></div>
                <div className="absolute inset-0 border border-white/20 rounded-2xl"></div>
                <div className="relative z-20 flex flex-col items-center gap-3">
                  <Cloud className="h-10 w-10 drop-shadow-xl text-cyan-600 filter brightness-110" />
                  <span className="text-xl font-black tracking-wide drop-shadow-sm">Climate</span>
                  <span className="text-base font-bold drop-shadow-sm opacity-90">NOAA</span>
                </div>
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