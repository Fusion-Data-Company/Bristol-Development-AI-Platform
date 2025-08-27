import React, { useState, useEffect } from "react";
import { X, BarChart3, PieChart, TrendingUp, Database, MapPin, Building2, Users, DollarSign, Activity } from "lucide-react";

interface DataVisualizationPanelProps {
  appData: any;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function DataVisualizationPanel({ appData, isOpen, onClose, className }: DataVisualizationPanelProps) {
  const [selectedMetric, setSelectedMetric] = useState("overview");

  if (!isOpen) return null;

  const metrics = {
    overview: {
      title: "Portfolio Overview",
      icon: <Building2 className="h-4 w-4" />,
      data: {
        totalProperties: appData?.sites?.length || 0,
        totalUnits: appData?.analytics?.totalUnits || 0,
        avgCompanyScore: appData?.analytics?.avgCompanyScore || 0,
        markets: Object.keys(appData?.analytics?.stateDistribution || {}).length
      }
    },
    markets: {
      title: "Market Distribution",
      icon: <MapPin className="h-4 w-4" />,
      data: appData?.analytics?.stateDistribution || {}
    },
    demographics: {
      title: "Demographics",
      icon: <Users className="h-4 w-4" />,
      data: {
        avgIncome: "$65,000",
        avgAge: "34",
        population: "2.5M",
        growth: "+3.2%"
      }
    },
    performance: {
      title: "Performance",
      icon: <TrendingUp className="h-4 w-4" />,
      data: {
        avgCap: "5.8%",
        avgNOI: "$485K",
        occupancy: "94.2%",
        revenue: "$12.8M"
      }
    }
  };

  const currentMetric = metrics[selectedMetric as keyof typeof metrics];

  return (
    <div className={`${className}`}>
      {/* Glass Panel */}
      <div 
        className="w-80 h-96 text-neutral-100 shadow-2xl rounded-3xl border overflow-hidden font-cinzel"
        style={{
          background: 'linear-gradient(135deg, rgba(5, 10, 20, 0.95) 0%, rgba(15, 25, 45, 0.92) 25%, rgba(69, 214, 202, 0.08) 50%, rgba(212, 175, 55, 0.06) 75%, rgba(10, 15, 30, 0.95) 100%)',
          backdropFilter: 'blur(30px) saturate(200%) brightness(1.1)',
          borderColor: 'rgba(69, 214, 202, 0.3)',
          boxShadow: `
            0 0 50px rgba(69, 214, 202, 0.3),
            0 0 100px rgba(212, 175, 55, 0.1),
            inset 0 0 30px rgba(69, 214, 202, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brand-cyan/30">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand-cyan animate-pulse" />
            <h3 className="font-bold text-brand-cyan">Live Data Context</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-brand-cyan/10 transition-colors"
          >
            <X className="h-4 w-4 text-brand-cyan/70" />
          </button>
        </div>

        {/* Metric Tabs */}
        <div className="flex p-2 space-x-1 border-b border-brand-cyan/20">
          {Object.entries(metrics).map(([key, metric]) => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                selectedMetric === key
                  ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30'
                  : 'text-brand-cyan/60 hover:text-brand-cyan hover:bg-brand-cyan/10'
              }`}
            >
              {metric.icon}
              {metric.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <h4 className="text-brand-cyan font-semibold mb-4 flex items-center gap-2">
            {currentMetric.icon}
            {currentMetric.title}
          </h4>

          {selectedMetric === "overview" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-cyan/10 rounded-xl p-3 border border-brand-cyan/20">
                <div className="text-2xl font-bold text-brand-cyan">{currentMetric.data.totalProperties}</div>
                <div className="text-xs text-brand-cyan/80">Properties</div>
              </div>
              <div className="bg-brand-gold/10 rounded-xl p-3 border border-brand-gold/20">
                <div className="text-2xl font-bold text-brand-gold">{currentMetric.data.totalUnits}</div>
                <div className="text-xs text-brand-gold/80">Total Units</div>
              </div>
              <div className="bg-green-400/10 rounded-xl p-3 border border-green-400/20">
                <div className="text-2xl font-bold text-green-400">{currentMetric.data.avgCompanyScore}</div>
                <div className="text-xs text-green-400/80">Avg Score</div>
              </div>
              <div className="bg-purple-400/10 rounded-xl p-3 border border-purple-400/20">
                <div className="text-2xl font-bold text-purple-400">{currentMetric.data.markets}</div>
                <div className="text-xs text-purple-400/80">Markets</div>
              </div>
            </div>
          )}

          {selectedMetric === "markets" && (
            <div className="space-y-2">
              {Object.entries(currentMetric.data).map(([state, count]) => (
                <div key={state} className="flex items-center justify-between p-2 bg-brand-cyan/5 rounded-lg border border-brand-cyan/20">
                  <span className="text-brand-cyan text-sm font-medium">{state}</span>
                  <span className="text-brand-gold font-bold">{count as number}</span>
                </div>
              ))}
            </div>
          )}

          {(selectedMetric === "demographics" || selectedMetric === "performance") && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(currentMetric.data).map(([key, value]) => (
                <div key={key} className="bg-brand-cyan/5 rounded-lg p-3 border border-brand-cyan/20">
                  <div className="text-lg font-bold text-brand-cyan">{value as string}</div>
                  <div className="text-xs text-brand-cyan/80 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Status */}
        <div className="p-3 border-t border-brand-cyan/20 bg-brand-cyan/5">
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-green-400 animate-pulse" />
            <span className="text-xs text-brand-cyan font-medium">Live Data • Updated {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}