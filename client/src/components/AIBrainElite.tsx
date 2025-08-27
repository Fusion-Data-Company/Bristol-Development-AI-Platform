import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Send,
  Upload,
  FileText,
  Settings,
  Sparkles,
  Zap,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  EyeOff,
  MessageSquare,
  Database,
  Activity,
  Target,
  DollarSign,
  Building,
  MapPin,
  Users,
  BarChart3,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface AIBrainEliteProps {
  sessionId: string;
  dataContext?: Record<string, any>;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  metadata?: any;
}

interface AgentPrompt {
  id: string;
  name: string;
  type: string;
  content: string;
  active: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface AgentAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  content?: string;
  processedAt?: string;
  createdAt: string;
}

interface AgentDecision {
  id: string;
  decisionType: string;
  decision: any;
  reasoning: string;
  confidence: number;
  impactValue?: number;
  createdAt: string;
}

export function AIBrainElite({ 
  sessionId, 
  dataContext,
  onClose 
}: AIBrainEliteProps) {
  const [message, setMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [newPrompt, setNewPrompt] = useState({ name: "", type: "project", content: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/chat/sessions", sessionId, "messages"],
    enabled: !!sessionId,
  });

  // Fetch prompts
  const { data: prompts = [], isLoading: promptsLoading } = useQuery({
    queryKey: ["/api/bristol-brain-elite/prompts"],
  });

  // Fetch attachments
  const { data: attachments = [] } = useQuery({
    queryKey: ["/api/bristol-brain-elite/attachments", sessionId],
    enabled: !!sessionId,
  });

  // Fetch decisions
  const { data: decisions = [] } = useQuery({
    queryKey: ["/api/bristol-brain-elite/decisions"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/bristol-brain-elite/decisions?limit=10");
      return response.json();
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/bristol-brain-elite/chat", {
        sessionId,
        message: content,
        enableAdvancedReasoning: true,
        dataContext,
      });
      return response.json();
    },
    onMutate: () => {
      setIsThinking(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions", sessionId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bristol-brain-elite/decisions"] });
      setMessage("");
      setIsThinking(false);
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
      setIsThinking(false);
    },
  });

  // Create/update prompt mutation
  const savePromptMutation = useMutation({
    mutationFn: async (prompt: Partial<AgentPrompt> & { id?: string }) => {
      if (prompt.id) {
        const response = await apiRequest("PUT", `/api/bristol-brain-elite/prompts/${prompt.id}`, prompt);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/bristol-brain-elite/prompts", prompt);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bristol-brain-elite/prompts"] });
      toast({
        title: "Success",
        description: "Prompt saved successfully",
      });
      setEditingPrompt(null);
      setNewPrompt({ name: "", type: "project", content: "" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save prompt",
        variant: "destructive",
      });
    },
  });

  // Delete prompt mutation
  const deletePromptMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/bristol-brain-elite/prompts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bristol-brain-elite/prompts"] });
      toast({
        title: "Success",
        description: "Prompt deleted successfully",
      });
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(`/api/bristol-brain-elite/attachments/${sessionId}`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload file");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bristol-brain-elite/attachments", sessionId] });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/bristol-brain-elite/attachments/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bristol-brain-elite/attachments", sessionId] });
      toast({
        title: "Success",
        description: "Attachment removed",
      });
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim() && !isThinking) {
      sendMessageMutation.mutate(message);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
    }
  };

  const getDecisionIcon = (type: string) => {
    switch (type) {
      case "investment":
        return <DollarSign className="w-4 h-4" />;
      case "risk":
        return <AlertCircle className="w-4 h-4" />;
      case "recommendation":
        return <Target className="w-4 h-4" />;
      case "strategy":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 dark:text-green-400";
    if (confidence >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card className="w-full h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-bristol-maroon/20">
      <CardHeader className="pb-3 bg-gradient-to-r from-bristol-maroon to-bristol-gold text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 animate-pulse" />
            <div>
              <CardTitle className="text-xl font-bold">Bristol A.I. Elite</CardTitle>
              <p className="text-sm opacity-90">$200M+ Deal Intelligence System</p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <Tabs defaultValue="chat" className="h-full">
          <TabsList className="w-full rounded-none border-b bg-white/50 dark:bg-slate-800/50">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Prompts
            </TabsTrigger>
            <TabsTrigger value="attachments" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Files ({attachments.length})
            </TabsTrigger>
            <TabsTrigger value="decisions" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Decisions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="h-[calc(100%-48px)] p-0 m-0">
            <div className="flex flex-col h-full">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg: ChatMessage) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          msg.role === 'user'
                            ? 'bg-bristol-maroon text-white'
                            : 'bg-white dark:bg-slate-700 shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {msg.role === 'assistant' && (
                            <Brain className="w-5 h-5 mt-1 text-bristol-gold" />
                          )}
                          <div className="flex-1">
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            {msg.metadata?.decision && (
                              <div className="mt-3 p-2 bg-black/10 dark:bg-white/10 rounded">
                                <div className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline">
                                    Decision Recorded
                                  </Badge>
                                  <span className={getConfidenceColor(msg.metadata.decision.confidence)}>
                                    {(msg.metadata.decision.confidence * 100).toFixed(0)}% Confidence
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isThinking && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white dark:bg-slate-700 rounded-lg p-4 shadow-md">
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-bristol-maroon" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Analyzing with elite financial models...
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-white/50 dark:bg-slate-800/50">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isThinking}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.txt,.csv,.xlsx,.xls,.json"
                  />
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask about cap rates, IRR, market analysis, deal structure..."
                    className="flex-1 min-h-[60px] resize-none"
                    disabled={isThinking}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isThinking}
                    className="bg-bristol-maroon hover:bg-bristol-maroon/90"
                  >
                    {isThinking ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="prompts" className="h-[calc(100%-48px)] p-4 overflow-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">System & Project Prompts</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-bristol-maroon hover:bg-bristol-maroon/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Prompt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Prompt</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Input
                        placeholder="Prompt Name"
                        value={newPrompt.name}
                        onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                      />
                      <Select
                        value={newPrompt.type}
                        onValueChange={(value) => setNewPrompt({ ...newPrompt, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">System Prompt</SelectItem>
                          <SelectItem value="project">Project Prompt</SelectItem>
                          <SelectItem value="context">Context Prompt</SelectItem>
                          <SelectItem value="persona">Persona Prompt</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="Enter prompt content..."
                        value={newPrompt.content}
                        onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                        className="min-h-[200px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setNewPrompt({ name: "", type: "project", content: "" })}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => savePromptMutation.mutate(newPrompt)}
                          disabled={!newPrompt.name || !newPrompt.content}
                          className="bg-bristol-maroon hover:bg-bristol-maroon/90"
                        >
                          Create Prompt
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {promptsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {prompts.map((prompt: AgentPrompt) => (
                    <Card key={prompt.id} className="border-bristol-maroon/10">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={prompt.active ? "default" : "secondary"}>
                              {prompt.type}
                            </Badge>
                            <span className="font-medium">{prompt.name}</span>
                            {prompt.priority > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Priority: {prompt.priority}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newExpanded = new Set(expandedPrompts);
                                if (newExpanded.has(prompt.id)) {
                                  newExpanded.delete(prompt.id);
                                } else {
                                  newExpanded.add(prompt.id);
                                }
                                setExpandedPrompts(newExpanded);
                              }}
                            >
                              {expandedPrompts.has(prompt.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingPrompt(prompt.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletePromptMutation.mutate(prompt.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {expandedPrompts.has(prompt.id) && (
                        <CardContent>
                          {editingPrompt === prompt.id ? (
                            <div className="space-y-3">
                              <Textarea
                                defaultValue={prompt.content}
                                className="min-h-[150px]"
                                onChange={(e) => {
                                  // Store the value for saving
                                  (e.target as any)._value = e.target.value;
                                }}
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingPrompt(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-bristol-maroon hover:bg-bristol-maroon/90"
                                  onClick={(e) => {
                                    const textarea = e.currentTarget.parentElement?.parentElement?.querySelector('textarea');
                                    if (textarea) {
                                      savePromptMutation.mutate({
                                        id: prompt.id,
                                        content: (textarea as any)._value || textarea.value,
                                      });
                                    }
                                  }}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <pre className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300 font-mono">
                              {prompt.content}
                            </pre>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="h-[calc(100%-48px)] p-4 overflow-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Session Attachments</h3>
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-bristol-maroon hover:bg-bristol-maroon/90"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </div>

              {attachments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No files attached to this session</p>
                  <p className="text-sm mt-1">Upload PDFs, Excel files, or documents for analysis</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {attachments.map((attachment: AgentAttachment) => (
                    <Card key={attachment.id} className="border-bristol-maroon/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-bristol-maroon" />
                            <div>
                              <p className="font-medium">{attachment.fileName}</p>
                              <p className="text-sm text-gray-500">
                                {(attachment.fileSize / 1024).toFixed(1)} KB • {attachment.fileType}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {attachment.content && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-800 rounded text-sm">
                            <p className="text-xs text-gray-500 mb-1">Content Preview:</p>
                            <p className="line-clamp-3 font-mono text-xs">
                              {attachment.content}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="decisions" className="h-[calc(100%-48px)] p-4 overflow-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Recent Investment Decisions</h3>
              
              {decisions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No decisions recorded yet</p>
                  <p className="text-sm mt-1">Ask about specific deals to generate decision logs</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {decisions.map((decision: AgentDecision) => (
                    <Card key={decision.id} className="border-bristol-maroon/10">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getDecisionIcon(decision.decisionType)}
                            <Badge variant="outline">
                              {decision.decisionType}
                            </Badge>
                            <span className={getConfidenceColor(decision.confidence)}>
                              {(decision.confidence * 100).toFixed(0)}% Confidence
                            </span>
                          </div>
                          {decision.impactValue && (
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Impact Value</p>
                              <p className="font-semibold text-bristol-maroon">
                                ${(decision.impactValue / 1000000).toFixed(1)}M
                              </p>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {decision.reasoning}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(decision.createdAt).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}