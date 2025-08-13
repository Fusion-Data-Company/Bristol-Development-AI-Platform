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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/20">
        <div className="container mx-auto px-4 py-8">
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
                <Card className="bristol-enterprise-card shadow-2xl rounded-3xl overflow-hidden border-2 border-bristol-gold/30 relative">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-bristol-gold via-blue-500 to-purple-600"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl pointer-events-none"></div>
                  <CardHeader className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 border-b-2 border-bristol-gold/20 relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <CardTitle className="text-slate-900 flex items-center gap-4 relative z-10">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-bristol-gold/30 to-yellow-400/30 shadow-lg border border-bristol-gold/30 backdrop-blur-sm">
                        <BarChart3 className="h-8 w-8 text-bristol-gold drop-shadow-lg" />
                      </div>

                    </CardTitle>

                  </CardHeader>
                  <CardContent className="bg-gradient-to-br from-slate-50/80 via-blue-50/40 to-purple-50/30 p-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-white/20 pointer-events-none"></div>
                    <div className="relative z-10">
                      <BLSTool />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bea" className="space-y-6">
                <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-green-50/50 border-b border-emerald-100/50">
                    <CardTitle className="text-slate-900 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-bristol-gold/20 to-yellow-400/20">
                        <TrendingUp className="h-5 w-5 text-bristol-gold" />
                      </div>
                      Bureau of Economic Analysis - GDP & Income
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Analyze regional GDP growth, personal income trends, and economic performance indicators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="bg-gradient-to-br from-slate-50/50 to-emerald-50/30 p-6">
                    <BEATool />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hud" className="space-y-6">
                <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50/50 to-violet-50/50 border-b border-purple-100/50">
                    <CardTitle className="text-slate-900 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-bristol-gold/20 to-yellow-400/20">
                        <Home className="h-5 w-5 text-bristol-gold" />
                      </div>
                      HUD USPS Vacancy Data
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Monitor residential vacancy rates and address stability trends using USPS delivery data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="bg-gradient-to-br from-slate-50/50 to-purple-50/30 p-6">
                    <HUDTool />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="foursquare" className="space-y-6">
                <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-rose-50/50 to-pink-50/50 border-b border-rose-100/50">
                    <CardTitle className="text-slate-900 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-bristol-gold/20 to-yellow-400/20">
                        <MapPin className="h-5 w-5 text-bristol-gold" />
                      </div>
                      Foursquare Places - Amenity Analysis
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Analyze nearby amenities, calculate Bristol Amenity Score, and assess walkability for properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="bg-gradient-to-br from-slate-50/50 to-rose-50/30 p-6">
                    <FoursquareTool />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fbi" className="space-y-6">
                <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border-b border-amber-100/50">
                    <CardTitle className="text-slate-900 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-bristol-gold/20 to-yellow-400/20">
                        <Shield className="h-5 w-5 text-bristol-gold" />
                      </div>
                      FBI Crime Statistics - Safety Analysis
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Access violent and property crime data by state to assess neighborhood safety trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="bg-gradient-to-br from-slate-50/50 to-amber-50/30 p-6">
                    <FBITool />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="noaa" className="space-y-6">
                <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-cyan-50/50 to-teal-50/50 border-b border-cyan-100/50">
                    <CardTitle className="text-slate-900 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-bristol-gold/20 to-yellow-400/20">
                        <Cloud className="h-5 w-5 text-bristol-gold" />
                      </div>
                      NOAA Climate Data - Environmental Analysis
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Access climate normals, precipitation, temperature data for property location assessment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="bg-gradient-to-br from-slate-50/50 to-cyan-50/30 p-6">
                    <NOAATool />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </Chrome>
  );
}