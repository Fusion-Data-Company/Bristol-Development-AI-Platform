import React, { useState, useEffect, useMemo } from "react";
import { X, BarChart3, Activity, Database, Globe, Zap, Terminal, Eye, Settings, 
         Code, Download, Upload, RefreshCw, Play, Pause, Filter, Search,
         TrendingUp, Users, MapPin, Building2, DollarSign, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface EnhancedLiveDataContextProps {
  appData: any;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'database' | 'websocket' | 'file' | 'external';
  status: 'active' | 'inactive' | 'error' | 'connecting';
  endpoint?: string;
  icon: React.ReactNode;
  lastUpdate?: Date;
  metrics?: {
    responseTime: string;
    successRate: string;
    dataPoints: number;
  };
}

interface InjectionRule {
  id: string;
  name: string;
  source: string;
  target: string;
  transform?: string;
  enabled: boolean;
  frequency: 'realtime' | '1s' | '5s' | '15s' | '30s' | '1m' | '5m';
}

export function EnhancedLiveDataContext({ appData, isOpen, onClose, className }: EnhancedLiveDataContextProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'injections' | 'analytics' | 'console'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(15);
  const [globalFilter, setGlobalFilter] = useState('');
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Mock data sources - in real implementation, these would be fetched from backend
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: 'portfolio-api',
      name: 'Portfolio API',
      type: 'api',
      status: 'active',
      endpoint: '/api/analytics/overview',
      icon: <Building2 className="h-4 w-4" />,
      lastUpdate: new Date(),
      metrics: { responseTime: '125ms', successRate: '99.9%', dataPoints: 1247 }
    },
    {
      id: 'demographics-api',
      name: 'Census Demographics',
      type: 'external',
      status: 'active',
      endpoint: '/api/address-demographics',
      icon: <Users className="h-4 w-4" />,
      lastUpdate: new Date(),
      metrics: { responseTime: '89ms', successRate: '98.7%', dataPoints: 856 }
    },
    {
      id: 'market-data',
      name: 'Market Intelligence',
      type: 'websocket',
      status: 'active',
      icon: <TrendingUp className="h-4 w-4" />,
      lastUpdate: new Date(),
      metrics: { responseTime: '45ms', successRate: '99.5%', dataPoints: 2341 }
    },
    {
      id: 'geospatial',
      name: 'Geospatial Engine',
      type: 'database',
      status: 'active',
      icon: <MapPin className="h-4 w-4" />,
      lastUpdate: new Date(),
      metrics: { responseTime: '156ms', successRate: '99.1%', dataPoints: 4129 }
    }
  ]);

  const [injectionRules, setInjectionRules] = useState<InjectionRule[]>([
    {
      id: 'portfolio-to-analytics',
      name: 'Portfolio → Analytics Dashboard',
      source: 'portfolio-api',
      target: 'analytics-dashboard',
      transform: 'aggregateByState()',
      enabled: true,
      frequency: '5s'
    },
    {
      id: 'demographics-to-map',
      name: 'Demographics → Map Layer',
      source: 'demographics-api',
      target: 'map-overlay',
      transform: 'formatForMapbox()',
      enabled: true,
      frequency: '15s'
    },
    {
      id: 'market-to-alerts',
      name: 'Market Data → Alert System',
      source: 'market-data',
      target: 'notification-center',
      transform: 'filterByCriteria(threshold > 0.15)',
      enabled: false,
      frequency: 'realtime'
    }
  ]);

  // Real-time metrics calculation
  const systemMetrics = useMemo(() => {
    const totalDataPoints = dataSources.reduce((sum, source) => sum + (source.metrics?.dataPoints || 0), 0);
    const avgResponseTime = dataSources.reduce((sum, source) => 
      sum + parseInt(source.metrics?.responseTime?.replace('ms', '') || '0'), 0
    ) / dataSources.length;
    const activeInjections = injectionRules.filter(rule => rule.enabled).length;
    
    return {
      totalDataPoints,
      avgResponseTime: Math.round(avgResponseTime),
      activeSources: dataSources.filter(s => s.status === 'active').length,
      activeInjections,
      systemHealth: dataSources.every(s => s.status === 'active') ? 'optimal' : 'degraded'
    };
  }, [dataSources, injectionRules]);

  // Execute console commands
  const executeConsoleCommand = (command: string) => {
    const timestamp = format(new Date(), 'HH:mm:ss.SSS');
    setConsoleOutput(prev => [...prev, `[${timestamp}] > ${command}`]);
    
    // Simulate command execution
    setTimeout(() => {
      let result = '';
      if (command.startsWith('inject ')) {
        result = '✅ Injection rule activated successfully';
      } else if (command.startsWith('query ')) {
        result = '📊 Query executed: 1,247 records returned';
      } else if (command === 'status') {
        result = `System Status: ${systemMetrics.activeSources}/${dataSources.length} sources active`;
      } else {
        result = '❓ Unknown command. Type "help" for available commands.';
      }
      
      setConsoleOutput(prev => [...prev, `[${timestamp}] ${result}`]);
    }, 500);
    
    setConsoleInput('');
  };

  if (!isOpen) return null;

  return (
    <div className={`${className}`}>
      {/* Full-width Enhanced Panel */}
      <div 
        className="w-full h-[500px] text-neutral-100 shadow-2xl rounded-2xl border overflow-hidden font-inter"
        style={{
          background: 'linear-gradient(135deg, rgba(5, 10, 20, 0.98) 0%, rgba(15, 25, 45, 0.95) 25%, rgba(69, 214, 202, 0.12) 50%, rgba(212, 175, 55, 0.08) 75%, rgba(10, 15, 30, 0.98) 100%)',
          backdropFilter: 'blur(40px) saturate(200%) brightness(1.15)',
          borderColor: 'rgba(69, 214, 202, 0.4)',
          boxShadow: `
            0 0 60px rgba(69, 214, 202, 0.4),
            0 0 120px rgba(212, 175, 55, 0.15),
            inset 0 0 40px rgba(69, 214, 202, 0.08),
            inset 0 2px 0 rgba(255, 255, 255, 0.15)
          `,
        }}
      >
        {/* Enhanced Header with Controls */}
        <div className="flex items-center justify-between p-4 border-b border-brand-cyan/30 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <BarChart3 className="h-6 w-6 text-brand-cyan animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            </div>
            <h3 className="font-bold text-brand-cyan text-lg">Live Data Context</h3>
            <div className="flex items-center gap-2 text-xs">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                systemMetrics.systemHealth === 'optimal' 
                  ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                  : 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
              }`}>
                {systemMetrics.systemHealth.toUpperCase()}
              </div>
              <span className="text-brand-cyan/60">
                {systemMetrics.activeSources}/{dataSources.length} Sources Active
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Global Controls */}
            <div className="flex items-center gap-2">
              <Switch
                checked={autoRefresh && !isPaused}
                onCheckedChange={(checked) => {
                  if (checked && isPaused) setIsPaused(false);
                  setAutoRefresh(checked);
                }}
                className="data-[state=checked]:bg-brand-cyan"
              />
              <Label className="text-xs text-brand-cyan">Auto-refresh</Label>
            </div>
            
            <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
              <SelectTrigger className="w-16 h-7 text-xs border-brand-cyan/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1s</SelectItem>
                <SelectItem value="5">5s</SelectItem>
                <SelectItem value="15">15s</SelectItem>
                <SelectItem value="30">30s</SelectItem>
                <SelectItem value="60">1m</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsPaused(!isPaused)}
              className="h-7 px-2 text-brand-cyan hover:bg-brand-cyan/10"
            >
              {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </Button>
            
            <Input
              placeholder="Global filter..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-32 h-7 text-xs border-brand-cyan/30 bg-black/20"
            />
            
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-brand-cyan/10 transition-colors"
            >
              <X className="h-4 w-4 text-brand-cyan/70" />
            </button>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="flex border-b border-brand-cyan/20 bg-black/10">
          {[
            { id: 'overview', label: 'Overview', icon: <Activity className="h-3 w-3" /> },
            { id: 'sources', label: 'Data Sources', icon: <Database className="h-3 w-3" /> },
            { id: 'injections', label: 'Injections', icon: <Zap className="h-3 w-3" /> },
            { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="h-3 w-3" /> },
            { id: 'console', label: 'Console', icon: <Terminal className="h-3 w-3" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-cyan/20 text-brand-cyan border-b-2 border-brand-cyan'
                  : 'text-brand-cyan/60 hover:text-brand-cyan hover:bg-brand-cyan/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Real-time Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-brand-cyan/10 rounded-xl p-3 border border-brand-cyan/20">
                  <div className="text-xl font-bold text-brand-cyan">{systemMetrics.totalDataPoints.toLocaleString()}</div>
                  <div className="text-xs text-brand-cyan/80">Data Points</div>
                </div>
                <div className="bg-green-400/10 rounded-xl p-3 border border-green-400/20">
                  <div className="text-xl font-bold text-green-400">{systemMetrics.avgResponseTime}ms</div>
                  <div className="text-xs text-green-400/80">Avg Response</div>
                </div>
                <div className="bg-purple-400/10 rounded-xl p-3 border border-purple-400/20">
                  <div className="text-xl font-bold text-purple-400">{systemMetrics.activeSources}</div>
                  <div className="text-xs text-purple-400/80">Active Sources</div>
                </div>
                <div className="bg-yellow-400/10 rounded-xl p-3 border border-yellow-400/20">
                  <div className="text-xl font-bold text-yellow-400">{systemMetrics.activeInjections}</div>
                  <div className="text-xs text-yellow-400/80">Active Injections</div>
                </div>
                <div className="bg-red-400/10 rounded-xl p-3 border border-red-400/20">
                  <div className="text-xl font-bold text-red-400">99.8%</div>
                  <div className="text-xs text-red-400/80">Uptime</div>
                </div>
              </div>

              {/* Live Activity Feed */}
              <div className="bg-black/40 rounded-xl p-4 border border-brand-cyan/20">
                <h4 className="text-brand-cyan font-semibold mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4 animate-pulse" />
                  Live Activity Feed
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {dataSources.slice(0, 4).map((source, i) => (
                    <div key={source.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {source.icon}
                        <span className="text-white">{source.name}</span>
                        <span className="text-green-400">• {source.metrics?.dataPoints} points</span>
                      </div>
                      <div className="text-brand-cyan/60">
                        {format(source.lastUpdate || new Date(), 'HH:mm:ss')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sources' && (
            <div className="space-y-3">
              {dataSources.map((source) => (
                <div key={source.id} className="bg-black/30 rounded-xl p-4 border border-brand-cyan/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {source.icon}
                      <div>
                        <h4 className="text-white font-medium">{source.name}</h4>
                        <p className="text-xs text-brand-cyan/60">{source.endpoint}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      source.status === 'active' 
                        ? 'bg-green-400/20 text-green-400'
                        : 'bg-red-400/20 text-red-400'
                    }`}>
                      {source.status.toUpperCase()}
                    </div>
                  </div>
                  
                  {source.metrics && (
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-brand-cyan/60">Response: </span>
                        <span className="text-white">{source.metrics.responseTime}</span>
                      </div>
                      <div>
                        <span className="text-brand-cyan/60">Success: </span>
                        <span className="text-green-400">{source.metrics.successRate}</span>
                      </div>
                      <div>
                        <span className="text-brand-cyan/60">Points: </span>
                        <span className="text-white">{source.metrics.dataPoints.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'injections' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-brand-cyan font-semibold">Data Injection Rules</h4>
                <Button size="sm" className="bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan">
                  + Add Rule
                </Button>
              </div>
              
              {injectionRules.map((rule) => (
                <div key={rule.id} className="bg-black/30 rounded-xl p-4 border border-brand-cyan/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => {
                          setInjectionRules(prev => 
                            prev.map(r => r.id === rule.id ? {...r, enabled: checked} : r)
                          );
                        }}
                        className="data-[state=checked]:bg-brand-cyan"
                      />
                      <div>
                        <h4 className="text-white font-medium">{rule.name}</h4>
                        <p className="text-xs text-brand-cyan/60">{rule.source} → {rule.target}</p>
                      </div>
                    </div>
                    <div className="text-xs text-brand-cyan/60">
                      {rule.frequency}
                    </div>
                  </div>
                  
                  {rule.transform && (
                    <div className="mt-2 p-2 bg-black/40 rounded-lg">
                      <span className="text-xs text-brand-cyan/60">Transform: </span>
                      <code className="text-xs text-yellow-400">{rule.transform}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/30 rounded-xl p-4 border border-brand-cyan/20">
                  <h4 className="text-brand-cyan font-semibold mb-3">Portfolio Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(appData?.analytics?.stateDistribution || {}).slice(0, 5).map(([state, count]) => (
                      <div key={state} className="flex justify-between text-sm">
                        <span className="text-white">{state}</span>
                        <span className="text-brand-cyan font-medium">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-black/30 rounded-xl p-4 border border-brand-cyan/20">
                  <h4 className="text-brand-cyan font-semibold mb-3">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white">Total Properties</span>
                      <span className="text-brand-cyan">{appData?.sites?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">Total Units</span>
                      <span className="text-brand-cyan">{appData?.analytics?.totalUnits || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">Avg Company Score</span>
                      <span className="text-green-400">{appData?.analytics?.avgCompanyScore || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'console' && (
            <div className="space-y-4">
              <div className="bg-black/50 rounded-xl p-4 border border-brand-cyan/20 min-h-[200px]">
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="h-4 w-4 text-brand-cyan" />
                  <h4 className="text-brand-cyan font-semibold">Data Console</h4>
                </div>
                
                <div className="bg-black/70 rounded-lg p-3 min-h-32 max-h-32 overflow-y-auto mb-3 font-mono text-xs">
                  {consoleOutput.length === 0 ? (
                    <div className="text-brand-cyan/60">Console ready. Type "help" for commands.</div>
                  ) : (
                    consoleOutput.map((line, i) => (
                      <div key={i} className="text-green-400">{line}</div>
                    ))
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter command (e.g., 'inject demographics-api', 'query portfolio', 'status')"
                    value={consoleInput}
                    onChange={(e) => setConsoleInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && consoleInput.trim()) {
                        executeConsoleCommand(consoleInput.trim());
                      }
                    }}
                    className="flex-1 h-8 text-xs border-brand-cyan/30 bg-black/20 font-mono"
                  />
                  <Button
                    size="sm"
                    onClick={() => consoleInput.trim() && executeConsoleCommand(consoleInput.trim())}
                    className="h-8 px-3 bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan"
                  >
                    Execute
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Status Bar */}
        <div className="p-3 border-t border-brand-cyan/20 bg-black/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-brand-cyan font-medium">System Online</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-brand-cyan/60" />
                <span className="text-brand-cyan/60">
                  Last Update: {format(new Date(), 'HH:mm:ss')}
                </span>
              </div>
              <div className="text-brand-cyan/60">
                {isPaused ? 'PAUSED' : `Refreshing every ${refreshInterval}s`}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-brand-cyan/60">
                Memory: {Math.round(Math.random() * 30 + 40)}%
              </div>
              <div className="text-brand-cyan/60">
                CPU: {Math.round(Math.random() * 20 + 10)}%
              </div>
              <div className="text-green-400">
                Network: {Math.round(Math.random() * 100 + 500)}ms
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}