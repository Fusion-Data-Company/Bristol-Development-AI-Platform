import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Settings, CheckCircle, XCircle, Loader2, Plus, Trash2, Eye, EyeOff, Plug } from "lucide-react";
import Chrome from "../components/brand/SimpleChrome";
import { apiRequest } from "@/lib/queryClient";
import bristolIntegrationsBg from "@assets/Icon+5_1755405970384.webp";

interface Tool {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  notes?: string;
}

export default function Integrations() {
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [newTool, setNewTool] = useState({
    name: '',
    baseUrl: '',
    apiKey: '',
    notes: ''
  });
  const [isAddingTool, setIsAddingTool] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tools registry
  const { data: tools = [], isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: ["/api/tools"],
    retry: false,
  });

  // Microsoft Graph API mutations
  const testOneDriveMutation = useMutation({
    mutationFn: () => apiRequest("/api/microsoft/graph/list-drive", "GET"),
    onSuccess: (data) => {
      toast({
        title: data.ok ? "OneDrive Connected" : "OneDrive Error",
        description: data.ok ? `Found ${(data as any).data?.value?.length || 0} items` : ((data as any).message || "MS keys not configured"),
        variant: data.ok ? "default" : "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: () => apiRequest("/api/microsoft/graph/list-mail", "GET"),
    onSuccess: (data) => {
      toast({
        title: data.ok ? "Email Connected" : "Email Error", 
        description: data.ok ? `Retrieved ${(data as any).data?.value?.length || 0} emails` : ((data as any).message || "MS keys not configured"),
        variant: data.ok ? "default" : "destructive",
      });
    },
  });

  // Tool registry mutations
  const addToolMutation = useMutation({
    mutationFn: (toolData: Omit<Tool, 'id'>) => apiRequest("/api/tools", "POST", toolData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      setNewTool({ name: '', baseUrl: '', apiKey: '', notes: '' });
      setIsAddingTool(false);
      toast({ title: "Tool Added" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add tool", variant: "destructive" });
    },
  });

  const deleteToolMutation = useMutation({
    mutationFn: (toolId: string) => apiRequest(`/api/tools/${toolId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      toast({ title: "Tool Deleted" });
    },
  });

  const toggleApiKeyVisibility = (toolId: string) => {
    setShowApiKey(prev => ({ ...prev, [toolId]: !prev[toolId] }));
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  const handleAddTool = () => {
    if (!newTool.name || !newTool.baseUrl) {
      toast({ title: "Name and Base URL are required", variant: "destructive" });
      return;
    }
    addToolMutation.mutate(newTool);
  };

  return (
    <Chrome>
      <div className="min-h-screen relative overflow-hidden">
        {/* Bristol Background Image */}
        <div 
          className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-30"
          style={{
            backgroundImage: `url(${bristolIntegrationsBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        <div className="absolute inset-0 bg-white/20"></div>
        
        <div className="container mx-auto px-4 py-6 space-y-6 relative z-10">
          <h1 className="text-3xl font-bold">Integrations</h1>

        {/* Microsoft 365 Section */}
        <Card>
          <CardHeader>
            <CardTitle>Microsoft 365</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">OneDrive</h4>
                <p className="text-sm text-gray-500 mb-3">
                  MS keys not set
                </p>
                <Button
                  onClick={() => testOneDriveMutation.mutate()}
                  disabled={testOneDriveMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {testOneDriveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  List OneDrive Root
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Outlook</h4>
                <p className="text-sm text-gray-500 mb-3">
                  MS keys not set
                </p>
                <Button
                  onClick={() => testEmailMutation.mutate()}
                  disabled={testEmailMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {testEmailMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  List 10 Emails
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tools Registry Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tools Registry</CardTitle>
              <Button onClick={() => setIsAddingTool(!isAddingTool)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tool
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Tool Form */}
            {isAddingTool && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newTool.name}
                      onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Base URL</Label>
                    <Input
                      value={newTool.baseUrl}
                      onChange={(e) => setNewTool({ ...newTool, baseUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={newTool.apiKey}
                      onChange={(e) => setNewTool({ ...newTool, apiKey: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={newTool.notes}
                      onChange={(e) => setNewTool({ ...newTool, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddTool} disabled={addToolMutation.isPending}>
                    {addToolMutation.isPending ? "Adding..." : "Add Tool"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingTool(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Tools List */}
            {toolsLoading ? (
              <div>Loading tools...</div>
            ) : tools.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No tools registered</p>
                <Button onClick={() => setIsAddingTool(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tool
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Base URL</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.map((tool) => (
                    <TableRow key={tool.id}>
                      <TableCell>{tool.name}</TableCell>
                      <TableCell className="font-mono text-sm">{tool.baseUrl}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {showApiKey[tool.id] ? tool.apiKey : maskApiKey(tool.apiKey)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleApiKeyVisibility(tool.id)}
                          >
                            {showApiKey[tool.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{tool.notes || 'No notes'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteToolMutation.mutate(tool.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        </div>
      </div>
    </Chrome>
  );
}