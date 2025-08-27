import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  MapPin, 
  Users, 
  Building, 
  DollarSign, 
  Shield, 
  Zap,
  Star,
  BarChart3,
  Calculator,
  FileText
} from 'lucide-react';
import type { Site, SiteMetric } from '@shared/schema';
import { cn } from '@/lib/utils';

interface SiteScoringProps {
  site: Site;
  metrics: SiteMetric[];
  onRecalculateScore?: () => void;
  className?: string;
}

// Company Scoring Categories and Weights
const COMPANY_SCORING_CATEGORIES = {
  demographics: { 
    weight: 25, 
    name: 'Demographics', 
    icon: Users,
    factors: ['Population Growth', 'Median Income', 'Age Distribution', 'Employment Rate']
  },
  location: { 
    weight: 20, 
    name: 'Location & Access', 
    icon: MapPin,
    factors: ['Transportation Access', 'Downtown Distance', 'Amenities Proximity', 'Traffic Patterns']
  },
  market: { 
    weight: 20, 
    name: 'Market Conditions', 
    icon: TrendingUp,
    factors: ['Rental Rates', 'Occupancy Rates', 'Competition Analysis', 'Absorption Rates']
  },
  development: { 
    weight: 15, 
    name: 'Development Potential', 
    icon: Building,
    factors: ['Zoning Compliance', 'Density Allowance', 'Development Costs', 'Timeline to Market']
  },
  financial: { 
    weight: 12, 
    name: 'Financial Metrics', 
    icon: DollarSign,
    factors: ['Land Cost', 'Construction Cost', 'IRR Projection', 'NOI Potential']
  },
  risk: { 
    weight: 8, 
    name: 'Risk Assessment', 
    icon: Shield,
    factors: ['Regulatory Risk', 'Environmental Risk', 'Market Risk', 'Construction Risk']
  }
};

const getScoreColor = (score: number): string => {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-lime-600';
  if (score >= 55) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
};

const getScoreGrade = (score: number): string => {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
};

const getScoreBadgeColor = (score: number): string => {
  if (score >= 85) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 70) return 'bg-lime-100 text-lime-800 border-lime-200';
  if (score >= 55) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (score >= 40) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200';
};

export function SiteScoring({ site, metrics, onRecalculateScore, className }: SiteScoringProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Calculate category scores based on available metrics
  const calculateCategoryScore = (categoryKey: string): number => {
    const categoryMetrics = metrics.filter(m => 
      m.metricType.toLowerCase().includes(categoryKey)
    );
    
    if (categoryMetrics.length === 0) return 50; // Default neutral score
    
    const avgScore = categoryMetrics.reduce((sum, m) => {
      // Convert metric value to 0-100 score based on metric type
      let score = 50;
      if (m.metricName.toLowerCase().includes('growth')) {
        score = Math.min(100, Math.max(0, (m.value + 2) * 25)); // Growth rate to score
      } else if (m.metricName.toLowerCase().includes('income')) {
        score = Math.min(100, Math.max(0, (m.value / 1000))); // Income to score
      } else if (m.metricName.toLowerCase().includes('rate')) {
        score = Math.min(100, m.value); // Already percentage
      }
      return sum + score;
    }, 0) / categoryMetrics.length;
    
    return Math.round(avgScore);
  };

  const categoryScores = Object.fromEntries(
    Object.keys(COMPANY_SCORING_CATEGORIES).map(key => [
      key, 
      calculateCategoryScore(key)
    ])
  );

  // Calculate overall Company Score
  const companyScore = site.companyScore || Math.round(
    Object.entries(COMPANY_SCORING_CATEGORIES).reduce((total, [key, config]) => {
      return total + (categoryScores[key] * config.weight / 100);
    }, 0)
  );

  const recommendations = [
    {
      category: 'High Priority',
      items: [
        'Conduct detailed demographic analysis for target market validation',
        'Perform geotechnical soil study for foundation requirements',
        'Complete traffic impact assessment for access planning'
      ]
    },
    {
      category: 'Medium Priority', 
      items: [
        'Evaluate utility capacity and connection costs',
        'Research local development incentives and tax benefits',
        'Analyze competitive landscape within 3-mile radius'
      ]
    },
    {
      category: 'Future Considerations',
      items: [
        'Monitor proposed infrastructure improvements',
        'Track zoning variance opportunities',
        'Assess climate resilience requirements'
      ]
    }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall Score Header */}
      <Card className="border-brand-maroon/20">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-maroon to-brand-maroon/80 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">{companyScore}</span>
              </div>
              <Badge className={cn("absolute -bottom-2 left-1/2 transform -translate-x-1/2", getScoreBadgeColor(companyScore))}>
                Grade {getScoreGrade(companyScore)}
              </Badge>
            </div>
            <div className="text-left">
              <CardTitle className="text-2xl font-serif text-brand-ink">
                Company Development Score
              </CardTitle>
              <p className="text-brand-stone mt-1">
                Comprehensive site feasibility analysis
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Star className="w-4 h-4 text-brand-gold fill-current" />
                <span className={cn("font-semibold", getScoreColor(companyScore))}>
                  {companyScore >= 85 ? 'Exceptional Opportunity' :
                   companyScore >= 70 ? 'Strong Development Potential' :
                   companyScore >= 55 ? 'Moderate Opportunity' :
                   companyScore >= 40 ? 'Challenges Present' : 'High Risk Development'}
                </span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={onRecalculateScore}
            variant="outline" 
            className="border-brand-maroon text-brand-maroon hover:bg-brand-maroon hover:text-white"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Recalculate Score
          </Button>
        </CardHeader>
      </Card>

      {/* Category Breakdown */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Score Breakdown</TabsTrigger>
          <TabsTrigger value="factors">Key Factors</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(COMPANY_SCORING_CATEGORIES).map(([key, config]) => {
              const score = categoryScores[key];
              const IconComponent = config.icon;
              
              return (
                <Card key={key} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-maroon/10 flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-brand-maroon" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-brand-ink">{config.name}</h4>
                        <p className="text-sm text-brand-stone">Weight: {config.weight}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-2xl font-bold", getScoreColor(score))}>
                        {score}
                      </div>
                      <Badge variant="outline" className={getScoreBadgeColor(score)}>
                        {getScoreGrade(score)}
                      </Badge>
                    </div>
                  </div>
                  
                  <Progress 
                    value={score} 
                    className="h-2"
                    style={{
                      backgroundColor: score >= 70 ? '#22c55e' : 
                                     score >= 55 ? '#eab308' : 
                                     score >= 40 ? '#f97316' : '#ef4444'
                    }}
                  />
                  
                  <div className="text-xs text-brand-stone mt-2">
                    Contributes {Math.round(score * config.weight / 100)} points to overall score
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="factors" className="space-y-4">
          <div className="grid gap-6">
            {Object.entries(COMPANY_SCORING_CATEGORIES).map(([key, config]) => (
              <Card key={key} className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <config.icon className="w-6 h-6 text-brand-maroon" />
                  <h4 className="font-semibold text-brand-ink text-lg">{config.name}</h4>
                  <Badge className={getScoreBadgeColor(categoryScores[key])}>
                    {categoryScores[key]}/100
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {config.factors.map((factor) => (
                    <div key={factor} className="flex items-center gap-2 p-2 bg-brand-fog rounded-lg">
                      <BarChart3 className="w-4 h-4 text-brand-stone" />
                      <span className="text-sm text-brand-ink">{factor}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.map((section) => (
            <Card key={section.category} className="p-4">
              <h4 className="font-semibold text-brand-ink mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-maroon" />
                {section.category}
              </h4>
              <ul className="space-y-2">
                {section.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-brand-stone">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-maroon mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}