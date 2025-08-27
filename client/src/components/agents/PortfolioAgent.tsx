import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, TrendingUp, Building2, MapPin, DollarSign, BarChart3, Search, Cpu, Brain, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AnalysisResult {
  id: string;
  title: string;
  category: 'market' | 'property' | 'amenity' | 'financial';
  status: 'analyzing' | 'completed' | 'pending';
  confidence: number;
  insights: string[];
  data?: any;
  timestamp: string;
}

interface PortfolioAgentProps {
  selectedSite?: any;
  portfolioData?: any;
  onAnalysisUpdate?: (results: AnalysisResult[]) => void;
}

export function PortfolioAgent({ selectedSite, portfolioData, onAnalysisUpdate }: PortfolioAgentProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);

  // Fetch Your Company market analysis
  const { data: marketAnalysis, isLoading: isLoadingMarket } = useQuery({
    queryKey: ['/api/brand-agent/market-analysis'],
    queryFn: async () => {
      const response = await fetch('/api/brand-agent/market-analysis');
      if (!response.ok) throw new Error('Failed to fetch market analysis');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const runPortfolioAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentAnalysis('Initializing Your Company Portfolio Analysis...');
    
    const analyses = [
      {
        id: '1',
        title: 'Sunbelt Market Positioning Analysis',
        category: 'market' as const,
        status: 'analyzing' as const,
        confidence: 0,
        insights: [],
        timestamp: new Date().toISOString()
      },
      {
        id: '2', 
        title: 'Multifamily Development Opportunity Assessment',
        category: 'property' as const,
        status: 'pending' as const,
        confidence: 0,
        insights: [],
        timestamp: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Premium Amenity Competitive Analysis',
        category: 'amenity' as const,
        status: 'pending' as const,
        confidence: 0,
        insights: [],
        timestamp: new Date().toISOString()
      },
      {
        id: '4',
        title: 'IRR & NPV Portfolio Optimization',
        category: 'financial' as const,
        status: 'pending' as const,
        confidence: 0,
        insights: [],
        timestamp: new Date().toISOString()
      }
    ];

    setAnalysisResults([...analyses]);

    // Simulate progressive analysis
    for (let i = 0; i < analyses.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCurrentAnalysis(`Analyzing ${analyses[i].title}...`);
      
      // Update analysis with insights
      const updatedAnalysis = {
        ...analyses[i],
        status: 'completed' as const,
        confidence: 85 + Math.floor(Math.random() * 15),
        insights: generateCompanyInsights(analyses[i].category)
      };

      setAnalysisResults(prev => 
        prev.map(item => item.id === analyses[i].id ? updatedAnalysis : item)
      );
    }

    setCurrentAnalysis(null);
    setIsAnalyzing(false);
  };

  const generateCompanyInsights = (category: string): string[] => {
    const insights = {
      market: [
        'Sunbelt markets showing 12% YoY multifamily rent growth',
        'Nashville & Austin submarkets demonstrate strongest institutional demand',
        'Class A multifamily occupancy rates averaging 94.2% across portfolio',
        'Company development strategy aligns with demographic migration patterns'
      ],
      property: [
        'Current portfolio weighted towards high-growth Sunbelt MSAs',
        'Average unit mix optimization: 35% 1BR, 45% 2BR, 20% 3BR recommended',
        'Development pipeline targeting 8,500+ additional units over 24 months',
        'Site selection criteria prioritizing transit-oriented locations'
      ],
      amenity: [
        'Premium amenity packages driving 15% rent premiums in Company markets',
        'Co-working spaces, fitness centers, and rooftop lounges most impactful',
        'Smart home technology adoption accelerating resident retention',
        'Pet-friendly amenities correlating with longer lease terms'
      ],
      financial: [
        'Portfolio-weighted average IRR target: 18-22% for new developments',
        'Stabilized cap rates trending 4.5-5.2% in target markets',
        'Construction cost inflation moderating to 6% annually',
        'LP/GP structures optimized for long-term value creation'
      ]
    };
    return insights[category as keyof typeof insights] || [];
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      market: TrendingUp,
      property: Building2,
      amenity: MapPin,
      financial: DollarSign
    };
    const Icon = icons[category as keyof typeof icons] || BarChart3;
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      market: 'from-blue-500/20 via-cyan-500/30 to-blue-600/40 border-blue-400/50 text-blue-800',
      property: 'from-emerald-500/20 via-green-500/30 to-emerald-600/40 border-emerald-400/50 text-emerald-800',
      amenity: 'from-violet-500/20 via-purple-500/30 to-violet-600/40 border-violet-400/50 text-violet-800',
      financial: 'from-amber-500/20 via-orange-500/30 to-amber-600/40 border-amber-400/50 text-amber-800'
    };
    return colors[category as keyof typeof colors] || '';
  };

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-white via-brand-cream/20 to-white border-2 border-brand-maroon/20 shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-brand-ink via-slate-800 to-brand-ink text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Brain className="h-6 w-6 text-brand-gold group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -inset-2 bg-brand-gold/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300"></div>
            </div>
            <div>
              <CardTitle className="font-cinzel text-lg tracking-wide">Company Portfolio Intelligence</CardTitle>
              <p className="text-brand-cream/80 text-sm">AI-Powered Development Analysis</p>
            </div>
          </div>
          <Badge className="bg-brand-gold/20 text-brand-cream border-brand-gold/40 font-bold">
            <Cpu className="h-3 w-3 mr-1" />
            Elite v5.0
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-6">
        <div className="space-y-4 h-full flex flex-col">
          {/* Analysis Trigger */}
          <Button
            onClick={runPortfolioAnalysis}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-brand-maroon to-brand-maroon/80 hover:from-brand-maroon/90 hover:to-brand-maroon text-white font-bold py-3 rounded-lg shadow-lg transition-all duration-300"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Portfolio...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Your Company Analysis
              </>
            )}
          </Button>

          {/* Current Analysis Status */}
          {currentAnalysis && (
            <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-brand-maroon animate-spin" />
                <span className="text-sm font-medium text-brand-ink">{currentAnalysis}</span>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          <ScrollArea className="flex-1">
            <div className="space-y-3">
              {analysisResults.map((result) => (
                <div
                  key={result.id}
                  className={`
                    p-4 rounded-lg backdrop-blur-sm border transition-all duration-300
                    bg-gradient-to-r ${getCategoryColor(result.category)}
                    ${result.status === 'completed' ? 'shadow-lg' : 'opacity-70'}
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(result.category)}
                      <h4 className="font-semibold text-sm">{result.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.status === 'completed' && (
                        <Badge className="text-xs bg-white/20 border-white/30">
                          {result.confidence}% confidence
                        </Badge>
                      )}
                      <div className={`w-2 h-2 rounded-full ${
                        result.status === 'completed' ? 'bg-green-500' :
                        result.status === 'analyzing' ? 'bg-yellow-500 animate-pulse' :
                        'bg-gray-400'
                      }`} />
                    </div>
                  </div>
                  
                  {result.insights.length > 0 && (
                    <div className="space-y-1">
                      {result.insights.map((insight, idx) => (
                        <div key={idx} className="text-xs bg-white/10 rounded px-2 py-1">
                          • {insight}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {analysisResults.length === 0 && !isAnalyzing && (
                <div className="text-center py-8 text-brand-stone">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Click above to start Company portfolio analysis</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}