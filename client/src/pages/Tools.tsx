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
          {/* Header with gradient background */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-bristol-gold/5 via-blue-500/5 to-purple-500/5 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-bristol-maroon via-bristol-gold via-purple-600 to-bristol-ink bg-clip-text text-transparent mb-4 drop-shadow-2xl">
                Economic Intelligence Tools
              </h1>
              <p className="text-xl font-semibold bg-gradient-to-r from-bristol-maroon to-purple-700 bg-clip-text text-transparent">
                Access live data from BLS, BEA, HUD, Foursquare, FBI, and NOAA for comprehensive property analysis
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-bristol-maroon/10 via-purple-500/10 to-bristol-gold/20 backdrop-blur-sm border-2 border-bristol-gold/30 shadow-2xl rounded-2xl h-auto p-3">
              <TabsTrigger 
                value="bls" 
                className="flex flex-col items-center gap-2 p-4 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-bristol-gold/90 data-[state=active]:to-yellow-400/80 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:scale-105 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="text-sm font-medium">BLS</span>
                <span className="text-xs opacity-70">Employment</span>
              </TabsTrigger>
              <TabsTrigger 
                value="bea"
                className="flex flex-col items-center gap-2 p-4 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-bristol-gold/90 data-[state=active]:to-yellow-400/80 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:scale-105 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">BEA</span>
                <span className="text-xs opacity-70">GDP/Income</span>
              </TabsTrigger>
              <TabsTrigger 
                value="hud"
                className="flex flex-col items-center gap-2 p-4 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-bristol-gold/90 data-[state=active]:to-yellow-400/80 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:scale-105 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200"
              >
                <Home className="h-5 w-5" />
                <span className="text-sm font-medium">HUD</span>
                <span className="text-xs opacity-70">Vacancy</span>
              </TabsTrigger>
              <TabsTrigger 
                value="foursquare"
                className="flex flex-col items-center gap-2 p-4 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-bristol-gold/90 data-[state=active]:to-yellow-400/80 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:scale-105 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200"
              >
                <MapPin className="h-5 w-5" />
                <span className="text-sm font-medium">Places</span>
                <span className="text-xs opacity-70">Foursquare</span>
              </TabsTrigger>
              <TabsTrigger 
                value="fbi"
                className="flex flex-col items-center gap-2 p-4 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-bristol-gold/90 data-[state=active]:to-yellow-400/80 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:scale-105 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200"
              >
                <Shield className="h-5 w-5" />
                <span className="text-sm font-medium">Crime</span>
                <span className="text-xs opacity-70">FBI</span>
              </TabsTrigger>
              <TabsTrigger 
                value="noaa"
                className="flex flex-col items-center gap-2 p-4 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-bristol-gold/90 data-[state=active]:to-yellow-400/80 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg data-[state=active]:scale-105 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200"
              >
                <Cloud className="h-5 w-5" />
                <span className="text-sm font-medium">Climate</span>
                <span className="text-xs opacity-70">NOAA</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-8">
              <TabsContent value="bls" className="space-y-6">
                <Card className="bg-white/90 backdrop-blur-sm border-white/50 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-blue-100/50">
                    <CardTitle className="text-slate-900 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-bristol-gold/20 to-yellow-400/20">
                        <BarChart3 className="h-5 w-5 text-bristol-gold" />
                      </div>
                      Bureau of Labor Statistics - Employment Data
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Access unemployment rates, employment trends, and labor market conditions for counties and metropolitan areas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="bg-gradient-to-br from-slate-50/50 to-blue-50/30 p-6">
                    <BLSTool />
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