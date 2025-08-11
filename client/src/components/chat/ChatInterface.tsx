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
import { Send, Paperclip, Mic, X, MapPin, BarChart, Brain } from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // WebSocket for real-time updates
  const { isConnected, sendMessage: sendWsMessage } = useWebSocket({
    onMessage: (wsMessage) => {
      if (wsMessage.type === "chat_typing" && wsMessage.data?.typing === false) {
        setIsThinking(false);
      }
    }
  });

  // Fetch messages for the session
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/chat/sessions", sessionId, "messages"],
    enabled: !!sessionId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!sessionId) {
        throw new Error("No active session");
      }
      const response = await apiRequest("POST", `/api/chat/sessions/${sessionId}/messages`, {
        content,
      });
      return response.json();
    },
    onMutate: () => {
      setIsThinking(true);
      // Send typing indicator via WebSocket
      if (sessionId) {
        sendWsMessage({
          type: "chat_typing",
          data: { sessionId, typing: true }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/sessions", sessionId, "messages"] });
      setMessage("");
      setIsThinking(false);
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      setIsThinking(false);
    },
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/chat/sessions", {
        title: "New Chat Session",
      });
      return response.json();
    },
    onSuccess: (newSession) => {
      onSessionCreate?.(newSession);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (!sessionId) {
      // Create a new session first
      await createSessionMutation.mutateAsync();
      return;
    }

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
          {messagesLoading ? (
            <div className="flex items-center justify-center h-32">
              <ThinkingIndicator isThinking={true} />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-bristol-maroon/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-bristol-maroon" />
              </div>
              <h4 className="font-serif text-lg font-semibold text-bristol-ink mb-2">
                Welcome to Bristol Site Intelligence
              </h4>
              <p className="text-bristol-stone max-w-md mx-auto">
                Ask me about site feasibility, market comparables, demographic analysis, or development metrics for your multifamily projects.
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
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about site feasibility, market comps, or development metrics..."
                className="pr-4 py-3 text-lg border-bristol-sky focus:ring-bristol-maroon focus:border-bristol-maroon"
                disabled={sendMessageMutation.isPending || !sessionId}
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
                disabled={!message.trim() || sendMessageMutation.isPending || !sessionId}
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
