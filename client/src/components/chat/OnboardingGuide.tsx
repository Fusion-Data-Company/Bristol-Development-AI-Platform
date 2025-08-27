import React, { useState } from "react";
import { X, Brain, Cpu, Zap, Target, Shield, TrendingUp, Building2, BarChart3, Database, Users, MapPin, ChevronRight, ChevronLeft } from "lucide-react";

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
  appData?: any;
}

export function OnboardingGuide({ isOpen, onClose, appData }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to Company A.I. Elite",
      icon: <Brain className="h-8 w-8 text-brand-cyan animate-pulse" />,
      content: (
        <div className="space-y-4">
          <p className="text-brand-cyan/90 leading-relaxed">
            You're now connected to Company A.I. Elite v5.0 - the most advanced AI system for real estate development analysis. 
            I'm engineered exclusively for Your Company with over three decades of institutional expertise.
          </p>
          <div className="bg-brand-cyan/10 rounded-xl p-4 border border-brand-cyan/20">
            <h4 className="text-brand-cyan font-semibold mb-2 flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              System Capabilities
            </h4>
            <ul className="text-sm text-brand-cyan/80 space-y-1">
              <li>• $200M+ institutional-grade deal analysis</li>
              <li>• Real-time DCF, IRR, and NPV modeling</li>
              <li>• Comprehensive market intelligence</li>
              <li>• Risk-adjusted investment recommendations</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Live Data Access",
      icon: <Database className="h-8 w-8 text-brand-gold animate-pulse" />,
      content: (
        <div className="space-y-4">
          <p className="text-brand-cyan/90 leading-relaxed">
            I have real-time access to your complete property portfolio and external market data sources.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-brand-cyan/10 rounded-lg p-3 border border-brand-cyan/20">
              <Building2 className="h-5 w-5 text-brand-cyan mb-2" />
              <div className="text-lg font-bold text-brand-cyan">{appData?.sites?.length || 0}</div>
              <div className="text-xs text-brand-cyan/80">Properties</div>
            </div>
            <div className="bg-brand-gold/10 rounded-lg p-3 border border-brand-gold/20">
              <Users className="h-5 w-5 text-brand-gold mb-2" />
              <div className="text-lg font-bold text-brand-gold">{appData?.analytics?.totalUnits || 0}</div>
              <div className="text-xs text-brand-gold/80">Total Units</div>
            </div>
          </div>
          <div className="bg-green-400/10 rounded-xl p-4 border border-green-400/20">
            <h4 className="text-green-400 font-semibold mb-2">Connected APIs</h4>
            <div className="text-xs text-green-400/80 grid grid-cols-2 gap-1">
              <span>• BLS Employment Data</span>
              <span>• HUD Housing Markets</span>
              <span>• FBI Crime Statistics</span>
              <span>• NOAA Climate Data</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "How to Interact",
      icon: <Zap className="h-8 w-8 text-brand-electric animate-pulse" />,
      content: (
        <div className="space-y-4">
          <p className="text-brand-cyan/90 leading-relaxed">
            Ask me anything about your properties, market conditions, or investment opportunities. I understand natural language and provide detailed analysis.
          </p>
          <div className="space-y-3">
            <div className="bg-brand-cyan/10 rounded-xl p-3 border border-brand-cyan/20">
              <h5 className="text-brand-cyan font-semibold text-sm mb-2">Property Analysis</h5>
              <div className="text-xs text-brand-cyan/80 space-y-1">
                <div>"Analyze 123 Main Street Charlotte"</div>
                <div>"What's the IRR for our Atlanta portfolio?"</div>
                <div>"Show me cap rates by market"</div>
              </div>
            </div>
            <div className="bg-brand-gold/10 rounded-xl p-3 border border-brand-gold/20">
              <h5 className="text-brand-gold font-semibold text-sm mb-2">Market Intelligence</h5>
              <div className="text-xs text-brand-gold/80 space-y-1">
                <div>"What's the employment trend in Charlotte?"</div>
                <div>"Compare demographic data for our markets"</div>
                <div>"Show me vacancy rates by MSA"</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Advanced Features",
      icon: <Target className="h-8 w-8 text-purple-400 animate-pulse" />,
      content: (
        <div className="space-y-4">
          <p className="text-brand-cyan/90 leading-relaxed">
            Explore advanced features for comprehensive investment analysis and portfolio optimization.
          </p>
          <div className="space-y-3">
            <div className="bg-purple-400/10 rounded-xl p-3 border border-purple-400/20">
              <h5 className="text-purple-400 font-semibold text-sm mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Data Visualization Panel
              </h5>
              <div className="text-xs text-purple-400/80">
                Click the chart icon in the header to view live portfolio metrics, market distribution, and performance data in an interactive panel.
              </div>
            </div>
            <div className="bg-brand-electric/10 rounded-xl p-3 border border-brand-electric/20">
              <h5 className="text-brand-electric font-semibold text-sm mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Financial Modeling
              </h5>
              <div className="text-xs text-brand-electric/80">
                Request detailed financial models, sensitivity analysis, stress testing, and scenario planning for any property or portfolio.
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Ready to Begin",
      icon: <Shield className="h-8 w-8 text-green-400 animate-pulse" />,
      content: (
        <div className="space-y-4">
          <p className="text-brand-cyan/90 leading-relaxed">
            Company A.I. Elite is now fully operational and ready to assist with institutional-grade real estate analysis.
          </p>
          <div className="bg-green-400/10 rounded-xl p-4 border border-green-400/20">
            <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              System Status: Fully Operational
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-green-400/80">✓ Portfolio Database Connected</div>
              <div className="text-green-400/80">✓ Market APIs Active</div>
              <div className="text-green-400/80">✓ Financial Models Ready</div>
              <div className="text-green-400/80">✓ Real-time Analytics Online</div>
            </div>
          </div>
          <div className="bg-brand-gold/10 rounded-xl p-3 border border-brand-gold/20">
            <h5 className="text-brand-gold font-semibold text-sm mb-2">Pro Tip</h5>
            <div className="text-xs text-brand-gold/80">
              Start with "Analyze our portfolio performance" or ask about a specific property address for comprehensive analysis.
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div 
        className="relative w-[600px] max-h-[90vh] text-neutral-100 shadow-2xl rounded-3xl border overflow-hidden font-cinzel"
        style={{
          background: 'linear-gradient(135deg, rgba(5, 10, 20, 0.98) 0%, rgba(15, 25, 45, 0.95) 25%, rgba(69, 214, 202, 0.08) 50%, rgba(212, 175, 55, 0.06) 75%, rgba(10, 15, 30, 0.98) 100%)',
          backdropFilter: 'blur(30px) saturate(200%) brightness(1.1)',
          borderColor: 'rgba(69, 214, 202, 0.3)',
          boxShadow: `
            0 0 100px rgba(69, 214, 202, 0.4),
            0 0 200px rgba(212, 175, 55, 0.2),
            inset 0 0 60px rgba(69, 214, 202, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)
          `,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-cyan/30">
          <div className="flex items-center gap-3">
            {currentStepData.icon}
            <div>
              <h2 className="text-xl font-bold text-brand-cyan">{currentStepData.title}</h2>
              <p className="text-sm text-brand-cyan/60">Step {currentStep + 1} of {steps.length}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-brand-cyan/10 transition-colors"
          >
            <X className="h-5 w-5 text-brand-cyan/70" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2">
          <div className="w-full bg-brand-cyan/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-brand-cyan to-brand-electric h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
          {currentStepData.content}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-brand-cyan/30">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              currentStep === 0
                ? 'opacity-50 cursor-not-allowed text-brand-cyan/50'
                : 'text-brand-cyan hover:bg-brand-cyan/10 border border-brand-cyan/30'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="text-sm text-brand-cyan/60">
            {currentStep + 1} / {steps.length}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-brand-cyan hover:bg-brand-cyan/10 border border-brand-cyan/30 transition-all"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-2 rounded-xl font-medium bg-gradient-to-r from-brand-cyan/20 to-brand-electric/20 text-brand-cyan border border-brand-cyan/50 hover:from-brand-cyan/30 hover:to-brand-electric/30 transition-all"
            >
              Get Started
              <Zap className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}