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
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Economic Intelligence Tools</h1>
            <p className="text-xl text-gray-700">
              Access live data from BLS, BEA, HUD, Foursquare, FBI, and NOAA for comprehensive property analysis
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-gray-100 border-gray-300 h-auto p-2">
              <TabsTrigger 
                value="bls" 
                className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-bristol-gold data-[state=active]:text-black text-gray-700 hover:bg-gray-200"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="text-sm font-medium">BLS</span>
                <span className="text-xs opacity-80">Employment</span>
              </TabsTrigger>
              <TabsTrigger 
                value="bea"
                className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-bristol-gold data-[state=active]:text-black text-gray-700 hover:bg-gray-200"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">BEA</span>
                <span className="text-xs opacity-80">GDP/Income</span>
              </TabsTrigger>
              <TabsTrigger 
                value="hud"
                className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-bristol-gold data-[state=active]:text-black text-gray-700 hover:bg-gray-200"
              >
                <Home className="h-5 w-5" />
                <span className="text-sm font-medium">HUD</span>
                <span className="text-xs opacity-80">Vacancy</span>
              </TabsTrigger>
              <TabsTrigger 
                value="foursquare"
                className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-bristol-gold data-[state=active]:text-black text-gray-700 hover:bg-gray-200"
              >
                <MapPin className="h-5 w-5" />
                <span className="text-sm font-medium">Places</span>
                <span className="text-xs opacity-80">Foursquare</span>
              </TabsTrigger>
              <TabsTrigger 
                value="fbi"
                className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-bristol-gold data-[state=active]:text-black text-gray-700 hover:bg-gray-200"
              >
                <Shield className="h-5 w-5" />
                <span className="text-sm font-medium">Crime</span>
                <span className="text-xs opacity-80">FBI</span>
              </TabsTrigger>
              <TabsTrigger 
                value="noaa"
                className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-bristol-gold data-[state=active]:text-black text-gray-700 hover:bg-gray-200"
              >
                <Cloud className="h-5 w-5" />
                <span className="text-sm font-medium">Climate</span>
                <span className="text-xs opacity-80">NOAA</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-8">
              <TabsContent value="bls" className="space-y-6">
                <Card className="bg-white border-gray-300 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-bristol-gold" />
                      Bureau of Labor Statistics - Employment Data
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Access unemployment rates, employment trends, and labor market conditions for counties and metropolitan areas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="bg-gray-50">
                    <BLSTool />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bea" className="space-y-6">
                <Card className="bg-white border-gray-300 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-bristol-gold" />
                      Bureau of Economic Analysis - GDP & Income
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Analyze regional GDP growth, personal income trends, and economic performance indicators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="bg-gray-50">
                    <BEATool />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hud" className="space-y-6">
                <Card className="bg-white border-gray-300 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <Home className="h-5 w-5 text-bristol-gold" />
                      HUD USPS Vacancy Data
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Monitor residential vacancy rates and address stability trends using USPS delivery data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="bg-gray-50">
                    <HUDTool />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="foursquare" className="space-y-6">
                <Card className="bg-white border-gray-300 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-bristol-gold" />
                      Foursquare Places - Amenity Analysis
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Analyze nearby amenities, calculate Bristol Amenity Score, and assess walkability for properties
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="bg-gray-50">
                    <FoursquareTool />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fbi" className="space-y-6">
                <Card className="bg-white border-gray-300 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-bristol-gold" />
                      FBI Crime Statistics - Safety Analysis
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Access violent and property crime data by state to assess neighborhood safety trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="bg-gray-50">
                    <FBITool />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="noaa" className="space-y-6">
                <Card className="bg-white border-gray-300 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-gray-900 flex items-center gap-2">
                      <Cloud className="h-5 w-5 text-bristol-gold" />
                      NOAA Climate Data - Environmental Analysis
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Access climate normals, precipitation, temperature data for property location assessment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="bg-gray-50">
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