import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Send, Paperclip, Mic, X, MapPin, BarChart, Brain, Settings, Cpu, Lightbulb, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  metadata?: any;
}

interface ChatSession {
  id: string;
  title?: string;
  lastMessageAt: string;
  createdAt: string;
}

interface PremiumModel {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  features: string[];
  contextLength: number;
  pricing: { input: string; output: string; images?: string; search?: string };
  bestFor: string[];
  status: 'active' | 'byok-required';
}

interface PremiumModelsResponse {
  models: PremiumModel[];
  default: string;
  categories: string[];
}

interface ChatInterfaceProps {
  sessionId?: string;
  onSessionCreate?: (session: ChatSession) => void;
  className?: string;
}

export function ChatInterface({ sessionId, onSessionCreate, className }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>(["search"]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState("gpt-5"); // Default to GPT-5 with BYOK
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  // Enhanced AI features
  const [realTimeInsights, setRealTimeInsights] = useState<any>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);
  const [conversationAnalytics, setConversationAnalytics] = useState<any>(null);
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState(true);
  const [userProfile, setUserProfile] = useState({
    role: 'Portfolio Manager',
    experience: 'Senior',
    preferredDetail: 'balanced',
    preferredFormality: 'professional'
  });

  // WebSocket for real-time updates
  const { isConnected, sendMessage: sendWsMessage } = useWebSocket({
    onMessage: (wsMessage) => {
      if (wsMessage.type === "chat_typing" && wsMessage.data?.typing === false) {
        setIsThinking(false);
      }
      if (wsMessage.type === "real_time_insights") {
        setRealTimeInsights(wsMessage.data);
      }
      if (wsMessage.type === "smart_suggestions") {
        setSmartSuggestions(wsMessage.data?.suggestions || []);
      }
    }
  });

  // State for messages - using local state since Bristol A.I. Elite handles persistence 
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSessionId] = useState(() => 
    sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  // Fetch premium models
  const { data: premiumModelsData } = useQuery<PremiumModelsResponse>({
    queryKey: ['/api/premium-models'],
    queryFn: async () => {
      const response = await apiRequest('/api/premium-models', 'GET');
      return response as unknown as PremiumModelsResponse;
    },
  });

  // Enhanced message mutation with AI analytics
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Run enhanced chat analysis in parallel
      const [chatResponse, insights, recommendations] = await Promise.all([
        apiRequest('/api/bristol-brain-elite/chat', 'POST', {
          sessionId: currentSessionId,
          message: content,
          enableAdvancedReasoning: true,
          selectedModel,
          dataContext: { userProfile, conversationHistory: messages }
        }),
        apiRequest('/api/enhanced-chat/real-time-insights', 'POST', {
          currentMessage: content,
          conversationHistory: messages,
          userContext: { portfolio: {}, role: userProfile.role }
        }),
        apiRequest('/api/intelligent-recommendations/next-actions', 'POST', {
          context: {
            currentTask: 'Chat conversation',
            userProfile,
            conversationHistory: messages
          },
          urgency: 'medium'
        })
      ]);
      
      return { chatResponse, insights, recommendations };
    },
    onMutate: async (content: string) => {
      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      setIsThinking(true);
      
      // Send typing indicator via WebSocket
      sendWsMessage({
        type: "chat_typing", 
        data: { sessionId: currentSessionId, typing: true }
      });
    },
    onSuccess: (data: any) => {
      const { chatResponse, insights, recommendations } = data;
      
      // Add AI response with enhanced metadata
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: chatResponse?.content || chatResponse?.text || chatResponse?.message || 'I apologize, but I was unable to generate a response.',
        createdAt: chatResponse?.createdAt || new Date().toISOString(),
        metadata: {
          ...chatResponse?.metadata,
          insights,
          recommendations,
          confidence: insights?.confidence || 0.8
        }
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsThinking(false);
      
      // Update real-time insights
      setRealTimeInsights(insights);
      
      // Generate smart suggestions
      if (insights?.suggestions) {
        setSmartSuggestions(insights.suggestions);
      }
      
      // Send typing stop indicator
      sendWsMessage({
        type: "chat_typing",
        data: { sessionId: currentSessionId, typing: false }
      });
    },
    onError: (error) => {
      console.error('Bristol A.I. Error:', error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsThinking(false);
      
      sendWsMessage({
        type: "chat_typing",
        data: { sessionId: currentSessionId, typing: false }
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate(message.trim());
  };

  const toggleTool = (tool: string) => {
    setActiveTools(prev => 
      prev.includes(tool) 
        ? prev.filter(t => t !== tool)
        : [...prev, tool]
    );
  };

  const removeFile = (fileIndex: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== fileIndex));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time typing analysis
  const handleMessageChange = async (value: string) => {
    setMessage(value);
    
    // Trigger real-time insights for longer messages
    if (value.length > 20 && adaptiveMode) {
      try {
        const insights = await apiRequest('/api/conversation-intelligence/real-time-insights', 'POST', {
          currentMessage: value,
          conversationHistory: messages,
          userContext: { portfolio: {}, role: userProfile.role }
        });
        setRealTimeInsights(insights);
      } catch (error) {
        // Silently handle real-time insight errors
      }
    }
  };

  // Generate conversation analytics
  useEffect(() => {
    if (messages.length >= 4) {
      const analyzeConversation = async () => {
        try {
          const analytics = await apiRequest('/api/conversation-analytics/comprehensive-insights', 'POST', {
            conversationHistory: messages,
            includeRecommendations: true
          });
          setConversationAnalytics(analytics);
        } catch (error) {
          console.warn('Failed to generate conversation analytics:', error);
        }
      };
      
      analyzeConversation();
    }
  }, [messages.length]);

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  return (
    <Card className={cn("flex flex-col h-full bg-white/90 backdrop-blur-sm border-bristol-sky shadow-xl", className)}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-6 border-b border-bristol-sky bg-bristol-ink text-white rounded-t-xl">
        <div className="flex items-center gap-3">
          <ThinkingIndicator isThinking={isThinking} />
          <div>
            <h3 className="font-serif text-xl font-semibold">Bristol Site Intelligence</h3>
            <p className="text-sm text-bristol-stone">
              {isConnected ? "Live connection active" : "Connecting..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-400" : "bg-red-400"
          )} />
          <span className="text-sm">
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-6 py-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative mb-4">
                <Brain className="h-16 w-16 text-bristol-maroon mx-auto" />
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-bristol-gold rounded-full animate-pulse" />
              </div>
              <h4 className="font-bold text-bristol-ink mb-2">Bristol Site Intelligence AI</h4>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                I'm the proprietary AI intelligence system engineered exclusively for Bristol Development Group. Drawing on over three decades of institutional real estate expertise, I underwrite deals, assess markets, and drive strategic decisions for Bristol Development projects.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Think of me as your elite senior partner: I model complex financial scenarios (DCF, IRR waterfalls, stress-tested NPVs), analyze demographic and economic data in real-time, and deliver risk-adjusted recommendations with the precision of a principal investor. What's the opportunity on the table?
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg: ChatMessage) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-full",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-xl px-4 py-3",
                      msg.role === "user"
                        ? "bg-bristol-maroon text-white"
                        : "bg-bristol-sky text-bristol-ink border border-bristol-sky"
                    )}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </div>
                    <div className={cn(
                      "text-xs mt-2 opacity-70",
                      msg.role === "user" ? "text-white/70" : "text-bristol-stone"
                    )}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-bristol-sky border border-bristol-sky rounded-xl px-4 py-3">
                    <ThinkingIndicator isThinking={true} />
                    <span className="text-sm text-bristol-stone ml-2">
                      Analyzing your request...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Input Area */}
      <div className="border-t border-bristol-sky bg-white">
        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="px-6 pt-4">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-bristol-sky py-2 px-3 rounded-lg border">
                  <Paperclip className="w-4 h-4 text-bristol-maroon" />
                  <span className="text-sm text-bristol-ink">{file.name}</span>
                  <button onClick={() => removeFile(index)} className="text-bristol-stone hover:text-bristol-maroon">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Engine Selector */}
        <div className="px-6 py-4 border-b border-bristol-sky">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-bristol-maroon/5 to-bristol-gold/5 rounded-xl border border-bristol-maroon/20">
            <Cpu className="h-5 w-5 text-bristol-maroon" />
            <div className="flex-1">
              <label className="text-sm font-medium text-bristol-ink mb-1 block">AI Engine</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-full bg-white border-bristol-maroon/20 text-bristol-ink">
                  <SelectValue placeholder="Select AI model..." />
                </SelectTrigger>
                <SelectContent>
                  {premiumModelsData?.models?.map((model: PremiumModel) => (
                    <SelectItem key={model.id} value={model.id} className="cursor-pointer">
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{model.name}</span>
                            <Badge 
                              variant={model.status === 'active' ? 'default' : 'secondary'} 
                              className={cn(
                                "text-xs",
                                model.status === 'active' 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-yellow-100 text-yellow-800"
                              )}
                            >
                              {model.status === 'byok-required' ? 'BYOK' : 'Active'}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{model.provider} • {model.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Enhanced AI Features Panel */}
        {(realTimeInsights || smartSuggestions.length > 0 || conversationAnalytics) && (
          <div className="px-6 py-4 border-b border-bristol-sky bg-gradient-to-r from-bristol-gold/5 to-bristol-maroon/5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-bristol-ink flex items-center gap-2">
                <Brain className="h-4 w-4 text-bristol-maroon" />
                AI Insights
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInsightsPanel(!showInsightsPanel)}
                className="text-bristol-stone hover:text-bristol-maroon"
              >
                {showInsightsPanel ? 'Hide' : 'Show'}
              </Button>
            </div>
            
            {showInsightsPanel && (
              <div className="space-y-3">
                {/* Real-time Insights */}
                {realTimeInsights && (
                  <div className="p-3 bg-white rounded-lg border border-bristol-sky">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-bristol-gold" />
                      <span className="text-sm font-medium text-bristol-ink">Real-time Analysis</span>
                    </div>
                    <div className="text-sm text-bristol-stone">
                      <div className="flex items-center gap-2 mb-1">
                        <span>Urgency:</span>
                        <Badge variant={realTimeInsights.urgency === 'critical' ? 'destructive' : 'secondary'}>
                          {realTimeInsights.urgency}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Complexity:</span>
                        <Badge variant="outline">{realTimeInsights.complexity}</Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Smart Suggestions */}
                {smartSuggestions.length > 0 && (
                  <div className="p-3 bg-white rounded-lg border border-bristol-sky">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-bristol-maroon" />
                      <span className="text-sm font-medium text-bristol-ink">Smart Suggestions</span>
                    </div>
                    <div className="space-y-2">
                      {smartSuggestions.slice(0, 3).map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion.text)}
                          className="w-full text-left text-xs p-2 h-auto bg-bristol-sky/50 hover:bg-bristol-maroon hover:text-white text-bristol-stone"
                        >
                          <div className="flex items-start gap-2">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.priority}
                            </Badge>
                            <span className="flex-1">{suggestion.text}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation Analytics */}
                {conversationAnalytics && (
                  <div className="p-3 bg-white rounded-lg border border-bristol-sky">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-bristol-gold" />
                      <span className="text-sm font-medium text-bristol-ink">Conversation Analytics</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-bristol-stone">Engagement:</span>
                        <Badge variant="secondary">{conversationAnalytics.comprehensive?.metrics?.engagementScore > 0.7 ? 'High' : 'Medium'}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-bristol-stone">Topics:</span>
                        <span className="text-bristol-ink">{conversationAnalytics.comprehensive?.topics?.primaryTopics?.[0] || 'General'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Function Toggles */}
        <div className="px-6 py-4 flex items-center gap-3 border-b border-bristol-sky">
          <button
            onClick={() => toggleTool("search")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeTools.includes("search")
                ? "bg-bristol-maroon text-white hover:bg-bristol-maroon/90"
                : "bg-bristol-sky text-bristol-stone hover:bg-bristol-maroon hover:text-white"
            )}
          >
            <MapPin className="w-4 h-4" />
            <span>Market Search</span>
          </button>
          
          <button
            onClick={() => toggleTool("analysis")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeTools.includes("analysis")
                ? "bg-bristol-maroon text-white hover:bg-bristol-maroon/90"
                : "bg-bristol-sky text-bristol-stone hover:bg-bristol-maroon hover:text-white"
            )}
          >
            <BarChart className="w-4 h-4" />
            <span>Deep Analysis</span>
          </button>
          
          <button
            onClick={() => toggleTool("bristol")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeTools.includes("bristol")
                ? "bg-bristol-maroon text-white hover:bg-bristol-maroon/90"
                : "bg-bristol-sky text-bristol-stone hover:bg-bristol-maroon hover:text-white"
            )}
          >
            <Brain className="w-4 h-4" />
            <span>Bristol Mode</span>
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 relative z-50">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                value={message}
                onChange={(e) => handleMessageChange(e.target.value)}
                placeholder="Ask about properties, market trends, demographics, investment opportunities..."
                className="pr-4 py-3 text-lg border-bristol-sky focus:ring-bristol-maroon focus:border-bristol-maroon bg-white text-bristol-ink cursor-text"
                disabled={sendMessageMutation.isPending}
                autoFocus
                tabIndex={0}
                style={{ pointerEvents: 'auto' }}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-bristol-stone hover:text-bristol-maroon"
              >
                <Mic className="w-5 h-5" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-bristol-stone hover:text-bristol-maroon"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              
              <Button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="w-12 h-12 bg-bristol-maroon text-white rounded-full hover:bg-bristol-maroon/90 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
}
