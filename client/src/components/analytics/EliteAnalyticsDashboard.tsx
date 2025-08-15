import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Cpu, 
  Zap, 
  Target, 
  TrendingUp, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  data_sources: string[];
  timestamp: string;
}

interface AIAnalyticsEngineProps {
  insights: AnalyticsInsight[];
  processingStatus: 'active' | 'idle' | 'analyzing';
  modelsActive: number;
  queriesProcessed: number;
  accuracy: number;
}

export function AIAnalyticsEngine({ 
  insights, 
  processingStatus, 
  modelsActive, 
  queriesProcessed, 
  accuracy 
}: AIAnalyticsEngineProps) {
  
  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'risk': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'trend': return <Activity className="h-4 w-4 text-bristol-cyan" />;
      case 'recommendation': return <Target className="h-4 w-4 text-bristol-gold" />;
      default: return <Brain className="h-4 w-4 text-bristol-stone" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-bristol-cyan';
    if (confidence >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-900/50 text-red-300 border-red-600';
      case 'medium': return 'bg-yellow-900/50 text-yellow-300 border-yellow-600';
      case 'low': return 'bg-blue-900/50 text-blue-300 border-blue-600';
      default: return 'bg-bristol-stone/50 text-bristol-stone border-bristol-stone';
    }
  };

  return (
    <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-bristol-cyan text-xl flex items-center gap-3">
            <div className="relative">
              <Brain className="h-6 w-6 text-bristol-gold" />
              {processingStatus === 'analyzing' && (
                <div className="absolute -inset-1 rounded-full bg-bristol-gold/30 animate-ping" />
              )}
            </div>
            AI Analytics Engine
          </CardTitle>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{modelsActive}</div>
              <div className="text-xs text-bristol-stone">Models Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-bristol-cyan">{queriesProcessed}</div>
              <div className="text-xs text-bristol-stone">Queries Processed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-bristol-gold">{accuracy}%</div>
              <div className="text-xs text-bristol-stone">Accuracy</div>
            </div>
            
            <Badge className={cn(
              "flex items-center gap-1",
              processingStatus === 'active' ? 'bg-green-900/50 text-green-300 border-green-600' :
              processingStatus === 'analyzing' ? 'bg-bristol-cyan/50 text-bristol-cyan border-bristol-cyan' :
              'bg-bristol-stone/50 text-bristol-stone border-bristol-stone'
            )}>
              {processingStatus === 'analyzing' ? (
                <Cpu className="h-3 w-3 animate-spin" />
              ) : processingStatus === 'active' ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {processingStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {insights.length > 0 ? (
            insights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 bg-bristol-ink/60 rounded-xl border border-bristol-cyan/20 hover:border-bristol-gold/40 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getInsightIcon(insight.category)}
                    <div>
                      <h4 className="text-white font-medium">{insight.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getImpactBadge(insight.impact)}>
                          {insight.impact} impact
                        </Badge>
                        <Badge variant="outline" className="text-xs border-bristol-stone text-bristol-stone">
                          {insight.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={cn("text-lg font-bold", getConfidenceColor(insight.confidence))}>
                      {(insight.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-bristol-stone">confidence</div>
                  </div>
                </div>
                
                <p className="text-bristol-stone text-sm leading-relaxed mb-3">
                  {insight.description}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-bristol-stone">Data sources:</span>
                    {insight.data_sources.map((source, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-bristol-cyan/30 text-bristol-cyan">
                        {source}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-bristol-stone">{insight.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 text-bristol-stone mx-auto mb-4" />
              <p className="text-bristol-stone">No insights available</p>
              <p className="text-bristol-stone/60 text-sm mt-1">AI models are analyzing data...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ModelPerformanceProps {
  models: Array<{
    name: string;
    type: string;
    status: 'active' | 'training' | 'idle';
    accuracy: number;
    last_update: string;
    queries_handled: number;
  }>;
}

export function ModelPerformanceDashboard({ models }: ModelPerformanceProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'training': return 'text-bristol-cyan';
      case 'idle': return 'text-bristol-stone';
      default: return 'text-bristol-stone';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'training': return <Cpu className="h-4 w-4 animate-pulse" />;
      case 'idle': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-bristol-ink/40 border-bristol-cyan/30 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-bristol-cyan flex items-center gap-3">
          <Zap className="h-5 w-5 text-bristol-gold" />
          Model Performance Monitor
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((model, index) => (
            <div
              key={index}
              className="p-4 bg-bristol-ink/60 rounded-lg border border-bristol-cyan/20"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-white font-medium">{model.name}</h4>
                  <p className="text-bristol-stone text-xs">{model.type}</p>
                </div>
                
                <div className={cn("flex items-center gap-1", getStatusColor(model.status))}>
                  {getStatusIcon(model.status)}
                  <span className="text-sm font-medium">{model.status}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-bristol-gold">
                    {model.accuracy.toFixed(1)}%
                  </div>
                  <div className="text-xs text-bristol-stone">Accuracy</div>
                </div>
                
                <div>
                  <div className="text-lg font-bold text-bristol-cyan">
                    {model.queries_handled}
                  </div>
                  <div className="text-xs text-bristol-stone">Queries</div>
                </div>
                
                <div>
                  <div className="text-xs text-bristol-stone">Updated</div>
                  <div className="text-xs text-white">{model.last_update}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}