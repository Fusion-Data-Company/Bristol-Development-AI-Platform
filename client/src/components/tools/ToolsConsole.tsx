import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Square, 
  Settings, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Database,
  Globe,
  Webhook
} from "lucide-react";
import { cn } from "@/lib/utils";

interface McpTool {
  id: string;
  name: string;
  description: string;
  schema: any;
  enabled: boolean;
}

interface ToolExecution {
  id: string;
  tool: string;
  status: "pending" | "running" | "completed" | "error";
  payload: any;
  result?: any;
  error?: string;
  timestamp: number;
}

interface LiveEvent {
  id: string;
  type: "tool_status" | "integration_update" | "chat_typing";
  message: string;
  status: "success" | "error" | "info";
  timestamp: number;
}

export function ToolsConsole() {
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [payload, setPayload] = useState<string>("{\n  \"siteId\": \"franklin-main\",\n  \"task\": \"pull-acs\"\n}");
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket for real-time updates
  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    onMessage: (message) => {
      if (message.type === "tool_status") {
        handleToolStatusUpdate(message.data);
      } else if (message.type === "integration_update") {
        handleIntegrationUpdate(message.data);
      }
    }
  });

  // Subscribe to tool updates when connected
  useEffect(() => {
    if (isConnected) {
      subscribe("tools");
      subscribe("integrations");
    }
    
    return () => {
      unsubscribe("tools");
      unsubscribe("integrations");
    };
  }, [isConnected, subscribe, unsubscribe]);

  // Fetch available tools
  const { data: tools = [], isLoading: toolsLoading } = useQuery({
    queryKey: ["/api/mcp/tools"],
  });

  // Execute tool mutation
  const executeToolMutation = useMutation({
    mutationFn: async ({ tool, payload }: { tool: string; payload: any }) => {
      const response = await apiRequest("POST", "/api/mcp/execute", { tool, payload });
      return response.json();
    },
    onSuccess: (result, variables) => {
      toast({
        title: "Tool Executed",
        description: `${variables.tool} completed successfully`,
      });
      
      // Add to executions
      const execution: ToolExecution = {
        id: Date.now().toString(),
        tool: variables.tool,
        status: result.success ? "completed" : "error",
        payload: variables.payload,
        result: result.data,
        error: result.error,
        timestamp: Date.now()
      };
      
      setExecutions(prev => [execution, ...prev.slice(0, 19)]); // Keep last 20
    },
    onError: (error, variables) => {
      toast({
        title: "Execution Failed",
        description: `Failed to execute ${variables.tool}`,
        variant: "destructive",
      });
    }
  });

  const handleToolStatusUpdate = (data: any) => {
    const event: LiveEvent = {
      id: Date.now().toString(),
      type: "tool_status",
      message: `${data.tool}: ${data.status}`,
      status: data.status === "error" ? "error" : data.status === "completed" ? "success" : "info",
      timestamp: Date.now()
    };
    
    setLiveEvents(prev => [event, ...prev.slice(0, 49)]); // Keep last 50 events
  };

  const handleIntegrationUpdate = (data: any) => {
    const event: LiveEvent = {
      id: Date.now().toString(),
      type: "integration_update", 
      message: `${data.service}.${data.action}: ${data.status}`,
      status: data.status === "error" ? "error" : data.status === "success" ? "success" : "info",
      timestamp: Date.now()
    };
    
    setLiveEvents(prev => [event, ...prev.slice(0, 49)]);
  };

  const handleExecuteTool = () => {
    if (!selectedTool || !payload.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please select a tool and provide payload",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsedPayload = JSON.parse(payload);
      executeToolMutation.mutate({ tool: selectedTool, payload: parsedPayload });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your payload format",
        variant: "destructive",
      });
    }
  };

  const getToolIcon = (toolName: string) => {
    if (toolName.includes("n8n")) return <Webhook className="w-4 h-4" />;
    if (toolName.includes("apify")) return <Globe className="w-4 h-4" />;
    if (toolName.includes("metrics")) return <Database className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "running":
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Activity className="w-4 h-4 text-brand-stone" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="bg-white border-brand-sky shadow-lg">
      <CardHeader className="p-6 border-b border-brand-sky bg-brand-ink text-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif text-xl font-semibold">MCP Tools Console</CardTitle>
            <p className="text-brand-stone text-sm">Universal webhook integration and real-time processing</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
            )} />
            <span className="text-sm">
              {isConnected ? "Live WebSocket" : "Disconnected"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-brand-fog">
            <TabsTrigger value="tools" className="data-[state=active]:bg-white">Available Tools</TabsTrigger>
            <TabsTrigger value="execute" className="data-[state=active]:bg-white">Execute</TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-white">Live Events</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="p-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-brand-ink mb-3">Available Tools</h4>
              {toolsLoading ? (
                <div className="text-center py-8 text-brand-stone">Loading tools...</div>
              ) : tools.length === 0 ? (
                <div className="text-center py-8 text-brand-stone">No tools available</div>
              ) : (
                tools.map((tool: McpTool) => (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.name)}
                    className={cn(
                      "w-full p-3 border rounded-lg hover:bg-brand-sky transition-colors text-left",
                      selectedTool === tool.name ? "border-brand-maroon bg-brand-sky" : "border-brand-sky"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        selectedTool === tool.name ? "bg-brand-maroon text-white" : "bg-brand-fog text-brand-maroon"
                      )}>
                        {getToolIcon(tool.name)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-brand-ink">{tool.name}</div>
                        <div className="text-xs text-brand-stone">{tool.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={tool.enabled ? "default" : "secondary"}
                            className={cn(
                              "text-xs",
                              tool.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                            )}
                          >
                            {tool.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="execute" className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-brand-ink mb-3">Tool Execution</h4>
                <p className="text-sm text-brand-stone mb-4">
                  Select a tool and provide the payload to execute
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">
                  Selected Tool
                </label>
                <div className="p-3 bg-brand-fog rounded-lg border border-brand-sky">
                  {selectedTool || "No tool selected"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-ink mb-2">
                  Payload (JSON)
                </label>
                <Textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  className="h-32 font-mono text-sm border-brand-sky focus:ring-brand-maroon focus:border-brand-maroon"
                  placeholder='{\n  "site_id": "franklin-main",\n  "task": "pull-acs"\n}'
                />
              </div>

              <Button
                onClick={handleExecuteTool}
                disabled={!selectedTool || !payload.trim() || executeToolMutation.isPending}
                className="w-full bg-brand-maroon text-white hover:bg-brand-maroon/90"
              >
                <Play className="w-4 h-4 mr-2" />
                {executeToolMutation.isPending ? "Executing..." : "Execute Tool"}
              </Button>

              {/* Recent Executions */}
              {executions.length > 0 && (
                <div className="mt-6">
                  <h5 className="font-medium text-brand-ink mb-3">Recent Executions</h5>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {executions.map((execution) => (
                        <div key={execution.id} className="p-3 bg-brand-fog rounded-lg border border-brand-sky">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(execution.status)}
                              <span className="font-medium text-sm">{execution.tool}</span>
                              <Badge variant="outline" className="text-xs">
                                {execution.status}
                              </Badge>
                            </div>
                            <span className="text-xs text-brand-stone">
                              {formatTimestamp(execution.timestamp)}
                            </span>
                          </div>
                          {execution.error && (
                            <div className="text-xs text-red-600 mt-1">{execution.error}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events" className="p-6">
            <div>
              <h4 className="font-semibold text-brand-ink mb-3">Live Events</h4>
              <div className="h-64 p-3 bg-brand-fog rounded-lg overflow-auto font-mono text-xs">
                {liveEvents.length === 0 ? (
                  <div className="text-brand-stone text-center py-8">
                    No events yet. Start executing tools to see live updates.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {liveEvents.map((event) => (
                      <div key={event.id} className="flex items-center gap-2">
                        {getStatusIcon(event.status)}
                        <span className={cn(
                          event.status === "error" ? "text-red-600" :
                          event.status === "success" ? "text-green-600" :
                          "text-brand-stone"
                        )}>
                          {formatTimestamp(event.timestamp)} - {event.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
