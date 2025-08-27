import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Settings, 
  Play, 
  Pause, 
  Edit3, 
  Save, 
  RefreshCw, 
  Cpu, 
  Activity, 
  Users, 
  MessageSquare,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Brain,
  Network,
  Eye,
  Code,
  Database,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import type { Agent, AgentTask } from '@shared/schema';

interface EnhancedAgentManagementProps {
  className?: string;
}

interface AgentWithStats extends Agent {
  stats: {
    pendingTasks: number;
    runningTasks: number;
    recentTasks: number;
    avgResponseTime: number;
  };
}

interface AgentDetails {
  agent: Agent;
  prompts: any[];
  tasks: AgentTask[];
}

export function EnhancedAgentManagement({ className }: EnhancedAgentManagementProps) {
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [promptContent, setPromptContent] = useState('');
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);

  // Fetch all agents with stats
  const { data: agents, isLoading: agentsLoading } = useQuery<AgentWithStats[]>({
    queryKey: ['/api/enhanced-agents'],
    refetchInterval: 5000 // Real-time updates
  });

  // Fetch agent details
  const { data: agentDetails } = useQuery<AgentDetails>({
    queryKey: ['/api/enhanced-agents', selectedAgent],
    enabled: !!selectedAgent
  });

  // Fetch available models
  const { data: models } = useQuery({
    queryKey: ['/api/enhanced-agents/models']
  });

  // Fetch performance metrics
  const { data: performance } = useQuery({
    queryKey: ['/api/enhanced-agents/performance'],
    refetchInterval: 10000
  });

  // Initialize agents mutation
  const initializeAgents = useMutation({
    mutationFn: () => apiRequest('/api/enhanced-agents/initialize', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced-agents'] });
    }
  });

  // Update agent prompt mutation
  const updatePrompt = useMutation({
    mutationFn: ({ agentId, systemPrompt }: { agentId: string; systemPrompt: string }) =>
      apiRequest(`/api/enhanced-agents/${agentId}/prompt`, 'PUT', { systemPrompt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced-agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced-agents', selectedAgent] });
      setEditingPrompt(false);
    }
  });

  // Create agent task mutation
  const createTask = useMutation({
    mutationFn: ({ agentId, taskType, input }: { agentId: string; taskType: string; input: any }) =>
      apiRequest(`/api/enhanced-agents/${agentId}/tasks`, 'POST', { taskType, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced-agents', selectedAgent] });
    }
  });

  useEffect(() => {
    if (agentDetails?.agent.systemPrompt) {
      setPromptContent(agentDetails.agent.systemPrompt);
    }
  }, [agentDetails]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle2;
      case 'busy': return Activity;
      case 'inactive': return Pause;
      case 'error': return AlertCircle;
      default: return Clock;
    }
  };

  const handleSavePrompt = () => {
    if (selectedAgent && promptContent.trim()) {
      updatePrompt.mutate({ 
        agentId: selectedAgent, 
        systemPrompt: promptContent.trim() 
      });
    }
  };

  if (agentsLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-brand-maroon" />
            <span>Loading enhanced agent system...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="bg-gradient-to-r from-brand-maroon via-brand-ink to-brand-maroon text-white">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Enhanced Multi-Agent System
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="space-y-4">
            <Bot className="h-16 w-16 text-brand-maroon mx-auto opacity-50" />
            <div>
              <h3 className="text-lg font-semibold text-brand-ink mb-2">No Agents Initialized</h3>
              <p className="text-muted-foreground mb-4">
                Initialize the default Company agent swarm to get started with the enhanced multi-agent system.
              </p>
              <Button 
                onClick={() => initializeAgents.mutate()} 
                disabled={initializeAgents.isPending}
                className="bg-brand-maroon hover:bg-brand-ink text-white"
              >
                {initializeAgents.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Initializing Agents...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Initialize Agent Swarm
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Agent Swarm Overview */}
      <Card className="w-full">
        <CardHeader className="bg-gradient-to-r from-brand-maroon via-brand-ink to-brand-maroon text-white">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-6 w-6" />
              Company Enhanced Agent Swarm
              <Badge variant="secondary" className="bg-brand-gold text-brand-ink">
                {agents.length} Agents Active
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/enhanced-agents'] })}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents.map((agent) => {
              const StatusIcon = getStatusIcon(agent.status);
              return (
                <Card
                  key={agent.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-lg border-2",
                    selectedAgent === agent.id 
                      ? "border-brand-maroon bg-brand-maroon/5" 
                      : "border-gray-200 hover:border-brand-sky"
                  )}
                  onClick={() => setSelectedAgent(agent.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-brand-maroon" />
                        <div className={cn("w-2 h-2 rounded-full", getStatusColor(agent.status))} />
                      </div>
                      <StatusIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <h3 className="font-semibold text-sm mb-1 text-brand-ink">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 capitalize">{agent.role.replace('-', ' ')}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Model:</span>
                        <Badge variant="outline" className="text-xs">
                          {agent.model?.split('/')[1] || agent.model}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Tasks:</span>
                        <div className="flex gap-1">
                          {agent.stats.pendingTasks > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {agent.stats.pendingTasks} pending
                            </Badge>
                          )}
                          {agent.stats.runningTasks > 0 && (
                            <Badge variant="default" className="text-xs bg-brand-maroon">
                              {agent.stats.runningTasks} running
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Success Rate:</span>
                        <span className="font-medium text-green-600">
                          {((agent.successRate || 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agent Details Panel */}
      {selectedAgent && agentDetails && (
        <Card className="w-full">
          <CardHeader className="bg-gradient-to-r from-brand-sky via-brand-gold to-brand-sky text-white">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6" />
                {agentDetails.agent.name}
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {agentDetails.agent.role.replace('-', ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn("text-white border-white/20", getStatusColor(agentDetails.agent.status))}
                >
                  {agentDetails.agent.status}
                </Badge>
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="prompt" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="prompt" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  System Prompt
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="mcp" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  MCP Tools
                </TabsTrigger>
              </TabsList>

              <TabsContent value="prompt" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">System Prompt Management</h3>
                  <div className="flex gap-2">
                    {editingPrompt ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPrompt(false);
                            setPromptContent(agentDetails.agent.systemPrompt || '');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSavePrompt}
                          disabled={updatePrompt.isPending}
                          className="bg-brand-maroon hover:bg-brand-ink"
                        >
                          {updatePrompt.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save Prompt
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setEditingPrompt(true)}
                        variant="outline"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Prompt
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {editingPrompt ? (
                    <div className="space-y-2">
                      <Label htmlFor="prompt-editor">System Prompt</Label>
                      <Textarea
                        id="prompt-editor"
                        value={promptContent}
                        onChange={(e) => setPromptContent(e.target.value)}
                        rows={20}
                        className="font-mono text-sm"
                        placeholder="Enter the system prompt for this agent..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Define the agent's role, capabilities, and behavior patterns. This prompt will be used for all interactions.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Current System Prompt</Label>
                      <ScrollArea className="h-64 w-full border rounded-md p-4">
                        <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                          {agentDetails.agent.systemPrompt || 'No system prompt defined'}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Badge variant="outline" className="text-sm">
                      {agentDetails.agent.model}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Capabilities</Label>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(agentDetails.agent.capabilities) ? 
                        agentDetails.agent.capabilities.map((cap: string) => (
                          <Badge key={cap} variant="secondary" className="text-xs">
                            {cap}
                          </Badge>
                        )) : 
                        <span className="text-sm text-muted-foreground">No capabilities defined</span>
                      }
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Task Management</h3>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </div>

                <div className="space-y-3">
                  {agentDetails.tasks && agentDetails.tasks.length > 0 ? (
                    agentDetails.tasks.map((task) => (
                      <Card key={task.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              task.status === 'completed' ? 'default' :
                              task.status === 'running' ? 'secondary' :
                              task.status === 'failed' ? 'destructive' : 'outline'
                            }>
                              {task.status}
                            </Badge>
                            <span className="font-medium">{task.taskType}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {task.executionTime && (
                          <p className="text-xs text-muted-foreground">
                            Execution time: {task.executionTime}ms
                          </p>
                        )}
                        {task.errorMessage && (
                          <p className="text-xs text-red-600 mt-1">
                            Error: {task.errorMessage}
                          </p>
                        )}
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No tasks found for this agent</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <h3 className="text-lg font-semibold">Performance Metrics</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Success Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {((agentDetails.agent.successRate || 1) * 100).toFixed(1)}%
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Total Tasks</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {agentDetails.agent.totalTasks || 0}
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Avg Response</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {agentDetails.agent.averageResponseTime 
                        ? `${agentDetails.agent.averageResponseTime.toFixed(0)}ms`
                        : 'N/A'
                      }
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Last Active</span>
                    </div>
                    <div className="text-sm">
                      {agentDetails.agent.lastActive 
                        ? new Date(String(agentDetails.agent.lastActive)).toLocaleString()
                        : 'Never'
                      }
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="mcp" className="space-y-4">
                <h3 className="text-lg font-semibold">MCP Tool Integration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Available MCP Servers</h4>
                    <div className="space-y-2">
                      {['filesystem', 'memory', 'postgres', 'firecrawl', 'sequential-thinking', 'everything'].map((server) => (
                        <div key={server} className="flex items-center justify-between">
                          <span className="text-sm">{server}</span>
                          <Badge variant="outline" className="text-xs">
                            {Array.isArray(agentDetails.agent.capabilities) && 
                             agentDetails.agent.capabilities.includes(`mcp-${server}`) ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Tool Usage Statistics</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Real-time MCP tool usage metrics will be displayed here.</p>
                      <p>Integration with the Company MCP system provides comprehensive tool tracking.</p>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}