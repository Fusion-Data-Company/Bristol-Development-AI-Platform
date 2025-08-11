import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Terminal, Play, Wifi, WifiOff } from "lucide-react";
import Chrome from "../components/brand/SimpleChrome";
import { apiRequest } from "@/lib/queryClient";

interface Tool {
  name: string;
  description?: string;
  inputSchema?: any;
}

interface Event {
  type: string;
  timestamp: Date;
  data: any;
}

export default function ToolsConsole() {
  const [payload, setPayload] = useState('{\n  "url": "https://httpbin.org/get"\n}');
  const [events, setEvents] = useState<Event[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedTool, setSelectedTool] = useState("");

  const { toast } = useToast();

  // Fetch MCP tools
  const { data: tools = [], isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: ["/api/mcp/tools"],
    retry: false,
  });

  // Run tool mutation
  const runToolMutation = useMutation({
    mutationFn: async (data: { tool: string; payload: any }) => {
      return apiRequest("/api/mcp/run", "POST", data);
    },
    onSuccess: (response) => {
      addEvent("tool-response", response);
      toast({ title: "Tool executed successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to run tool", variant: "destructive" });
    },
  });

  // Ping MCP
  const { data: pingResponse } = useQuery({
    queryKey: ["/api/mcp/ping"],
    refetchInterval: 30000, // Ping every 30 seconds
  });

  const addEvent = (type: string, data: any) => {
    setEvents(prev => [...prev, {
      type,
      timestamp: new Date(),
      data
    }].slice(-50)); // Keep only last 50 events
  };

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const port = window.location.port === '5173' ? '3000' : window.location.port; // Vite dev server fix
    const wsUrl = `${protocol}//${host.replace(/:5173$/, ':3000')}/api/mcp/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setWsConnected(true);
        addEvent('ws-connected', { url: wsUrl });
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addEvent('ws-message', data);
        } catch (e) {
          addEvent('ws-message', event.data);
        }
      };
      
      ws.onclose = () => {
        setWsConnected(false);
        addEvent('ws-disconnected', {});
      };
      
      ws.onerror = (error) => {
        setWsConnected(false);
        addEvent('ws-error', error);
      };

      return () => {
        ws.close();
      };
    } catch (error) {
      addEvent('ws-error', { message: 'Failed to connect to WebSocket' });
    }
  }, []);

  const handleRunTool = () => {
    if (!selectedTool) {
      toast({ title: "Please select a tool", variant: "destructive" });
      return;
    }

    try {
      const parsedPayload = JSON.parse(payload);
      runToolMutation.mutate({
        tool: selectedTool,
        payload: parsedPayload
      });
    } catch (error) {
      toast({ title: "Invalid JSON payload", variant: "destructive" });
    }
  };

  return (
    <Chrome>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Tools Console</h1>
            <div className="flex items-center gap-2">
              {wsConnected ? (
                <Badge className="bg-green-100 text-green-800">
                  <Wifi className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
              <Badge variant="outline">
                MCP: {pingResponse?.ok ? "Online" : "Offline"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tools List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Available Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              {toolsLoading ? (
                <div>Loading tools...</div>
              ) : tools.length === 0 ? (
                <div className="text-center py-8">
                  <Terminal className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No MCP tools available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tools.map((tool, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{tool.name}</TableCell>
                        <TableCell className="text-sm">{tool.description || 'No description'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={selectedTool === tool.name ? "default" : "outline"}
                            onClick={() => setSelectedTool(tool.name)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Tool Execution */}
          <Card>
            <CardHeader>
              <CardTitle>Execute Tool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Selected Tool: {selectedTool || "None"}
                </label>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">JSON Payload</label>
                <Textarea
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="Enter JSON payload..."
                />
              </div>

              <Button
                onClick={handleRunTool}
                disabled={runToolMutation.isPending || !selectedTool}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                {runToolMutation.isPending ? "Running..." : "Run Tool"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Events */}
        <Card>
          <CardHeader>
            <CardTitle>Live Events</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No events yet. WebSocket events will appear here.
                  </div>
                ) : (
                  events.map((event, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {event.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {event.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {typeof event.data === 'string' 
                          ? event.data 
                          : JSON.stringify(event.data, null, 2)
                        }
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </Chrome>
  );
}