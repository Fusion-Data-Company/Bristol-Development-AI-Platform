import { useState } from "react";
import Chrome from "@/components/brand/Chrome";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Home } from "lucide-react";
import { BLSTool } from "../components/tools/BLSTool";
import { BEATool } from "../components/tools/BEATool";
import { HUDTool } from "../components/tools/HUDTool";

export function Tools() {
  const [activeTab, setActiveTab] = useState("bls");

  return (
    <Chrome>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Economic Intelligence Tools</h1>
          <p className="text-gray-300">
            Access real-time economic data from Bureau of Labor Statistics, Bureau of Economic Analysis, and HUD
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger 
              value="bls" 
              className="flex items-center gap-2 data-[state=active]:bg-bristol-gold data-[state=active]:text-black"
            >
              <BarChart3 className="h-4 w-4" />
              BLS Employment
            </TabsTrigger>
            <TabsTrigger 
              value="bea"
              className="flex items-center gap-2 data-[state=active]:bg-bristol-gold data-[state=active]:text-black"
            >
              <TrendingUp className="h-4 w-4" />
              BEA GDP/Income
            </TabsTrigger>
            <TabsTrigger 
              value="hud"
              className="flex items-center gap-2 data-[state=active]:bg-bristol-gold data-[state=active]:text-black"
            >
              <Home className="h-4 w-4" />
              HUD Vacancy
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="bls" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-bristol-gold" />
                    Bureau of Labor Statistics - Employment Data
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Access unemployment rates, employment trends, and labor market conditions for counties and metropolitan areas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BLSTool />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bea" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-bristol-gold" />
                    Bureau of Economic Analysis - GDP & Income
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Analyze regional GDP growth, personal income trends, and economic performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BEATool />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hud" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Home className="h-5 w-5 text-bristol-gold" />
                    HUD USPS Vacancy Data
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Monitor residential vacancy rates and address stability trends using USPS delivery data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HUDTool />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Chrome>
  );
}