import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Lightbulb,
  Star,
  Clock,
  ArrowRight,
  BarChart3,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortfolioInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'performance' | 'market_shift';
  title: string;
  description: string;
  impact_score: number;
  confidence: number;
  data_points: string[];
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  created_at: string;
}

interface MarketComparative {
  market: string;
  bristol_performance: number;
  market_average: number;
  competitive_advantage: number;
  risk_factors: string[];
  opportunities: string[];
}

interface EliteInsightsDashboardProps {
  insights: PortfolioInsight[];
  marketComparatives: MarketComparative[];
  analysisTimestamp: string;
  confidenceScore: number;
}

export function EliteInsightsDashboard({ 
  insights, 
  marketComparatives, 
  analysisTimestamp, 
  confidenceScore 
}: EliteInsightsDashboardProps) {
  
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-green-400" />;
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'performance': return <Star className="h-5 w-5 text-brand-gold" />;
      case 'market_shift': return <Activity className="h-5 w-5 text-brand-cyan" />;
      default: return <Lightbulb className="h-5 w-5 text-brand-stone" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-100';
      case 'medium': return 'border-yellow-500 bg-yellow-100';
      case 'low': return 'border-blue-500 bg-blue-100';
      default: return 'border-brand-stone bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'text-green-400 border-green-600';
      case 'risk': return 'text-red-400 border-red-600';
      case 'performance': return 'text-brand-gold border-brand-gold';
      case 'market_shift': return 'text-brand-cyan border-brand-cyan';
      default: return 'text-brand-stone border-brand-stone';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <Card className="bg-white border-brand-cyan/30 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-brand-cyan text-xl flex items-center gap-3">
              <Brain className="h-6 w-6 text-brand-gold" />
              Elite Portfolio Intelligence
            </CardTitle>
            
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-brand-gold">
                  {(confidenceScore * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-brand-stone">Confidence</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-brand-cyan">
                  {insights.length}
                </div>
                <div className="text-xs text-brand-stone">Active Insights</div>
              </div>
              
              <Badge className="bg-green-900/50 text-green-300 border-green-600">
                <Clock className="h-3 w-3 mr-1" />
                Live Analysis
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insights.map((insight) => (
          <Card 
            key={insight.id} 
            className={cn(
              "bg-white border-2 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-all duration-300",
              getPriorityColor(insight.priority)
            )}
          >
            {/* Animated glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/5 via-transparent to-brand-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getInsightIcon(insight.type)}
                  <div>
                    <CardTitle className="text-brand-maroon text-lg">{insight.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={cn("text-xs", getTypeColor(insight.type))}>
                        {insight.type.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        insight.priority === 'high' ? 'border-red-400 text-red-300' :
                        insight.priority === 'medium' ? 'border-yellow-400 text-yellow-300' :
                        'border-blue-400 text-blue-300'
                      )}>
                        {insight.priority} priority
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-brand-gold">
                    {insight.impact_score.toFixed(1)}
                  </div>
                  <div className="text-xs text-brand-stone">Impact Score</div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="space-y-4">
                <p className="text-brand-stone text-sm leading-relaxed">
                  {insight.description}
                </p>
                
                {/* Data Sources */}
                <div className="flex flex-wrap gap-1">
                  {insight.data_points.map((source, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-xs border-brand-cyan/30 text-brand-cyan"
                    >
                      {source}
                    </Badge>
                  ))}
                </div>
                
                {/* Recommendation */}
                <div className="p-3 bg-gray-100 rounded-lg border border-brand-gold/20">
                  <div className="text-xs font-medium text-brand-gold mb-1">Recommendation:</div>
                  <div className="text-xs text-brand-stone leading-relaxed">
                    {insight.recommendation}
                  </div>
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-brand-stone">
                      Confidence: {(insight.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-1">
                      <div 
                        className="h-1 bg-brand-gold rounded-full transition-all duration-500"
                        style={{ width: `${insight.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-brand-stone">
                    {formatTimeAgo(insight.created_at)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Market Comparative Analysis */}
      <Card className="bg-white border-brand-cyan/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-brand-cyan flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-brand-gold" />
            Company vs Market Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {marketComparatives.map((market, index) => (
              <div key={index} className="space-y-4">
                <div className="text-center">
                  <h4 className="text-brand-maroon font-medium text-lg">{market.market}</h4>
                  <div className="text-3xl font-bold text-brand-gold mt-2">
                    +{market.competitive_advantage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-brand-stone">Competitive Advantage</div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <div className="text-xs font-medium text-green-400 mb-2">Opportunities</div>
                    <div className="space-y-1">
                      {market.opportunities.map((opp, idx) => (
                        <div key={idx} className="text-xs text-brand-stone flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 text-green-400" />
                          {opp}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <div className="text-xs font-medium text-red-400 mb-2">Risk Factors</div>
                    <div className="space-y-1">
                      {market.risk_factors.map((risk, idx) => (
                        <div key={idx} className="text-xs text-brand-stone flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-red-400" />
                          {risk}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}