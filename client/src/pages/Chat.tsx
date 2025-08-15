import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  Send, 
  Plus, 
  MessageCircle, 
  Brain,
  Loader2,
  Building2,
  TrendingUp,
  DollarSign,
  BarChart3,
  Users
} from 'lucide-react';
import { type ChatSession, type ChatMessage } from '@shared/schema';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PremiumModel {
  id: string;
  label: string;
  provider: string;
  category: string;
  description: string;
  features: string[];
  contextLength: number;
  pricing: { input: string; output: string; images?: string; search?: string };
  bestFor: string[];
  status: 'active' | 'byok-required';
}

export default function Chat() {
  const [message, setMessage] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gpt-5');
  const [isThinking, setIsThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // WebSocket for real-time updates
  const { isConnected: wsConnected } = useWebSocket({
    onMessage: (wsMessage) => {
      if (wsMessage.type === "chat_typing") {
        setIsThinking(wsMessage.data?.typing || false);
      }
    }
  });

  // Get chat sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions']
  });

  // Get messages for selected session
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/sessions/${selectedSession}/messages`],
    enabled: !!selectedSession
  });

  // Get premium models
  const { data: premiumModels } = useQuery<PremiumModel[]>({
    queryKey: ['/api/openrouter-models'],
    select: (data: any) => data || []
  });

  // Create new session
  const createSessionMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest('/api/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({ title })
      });
      return response.json();
    },
    onSuccess: (newSession) => {
      setSelectedSession(newSession.id);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedSession) throw new Error('No session selected');
      
      setIsThinking(true);
      
      const response = await fetch('/api/bristol-brain-elite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId: selectedSession,
          model: selectedModel,
          mcpEnabled: true,
          realTimeData: true
        })
      });
      
      if (!response.ok) {
        const fallbackResponse = await fetch(`/api/chat/sessions/${selectedSession}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
        if (!fallbackResponse.ok) throw new Error('Failed to send message');
        return fallbackResponse.json();
      }
      
      return response.json();
    },
    onSuccess: () => {
      setMessage('');
      setIsThinking(false);
      queryClient.invalidateQueries({ 
        queryKey: [`/api/chat/sessions/${selectedSession}/messages`] 
      });
    },
    onError: () => {
      setIsThinking(false);
    }
  });

  // Auto-select first session or create one
  useEffect(() => {
    if (!selectedSession && sessions.length > 0) {
      setSelectedSession(sessions[0].id);
    }
  }, [sessions, selectedSession]);

  const handleSend = () => {
    if (message.trim() && !sendMessageMutation.isPending && !isThinking) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden flex">
      {/* Left Sidebar - Conversations */}
      <div className="w-80 h-full chrome-metallic-panel border-r border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="mb-4">
            <h2 className="text-slate-700 font-bold text-xl flex items-center gap-3">
              <MessageCircle className="h-6 w-6" />
              Conversations
            </h2>
          </div>
        </div>
        
        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessionsLoading ? (
            <div className="text-center text-slate-500 py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading conversations...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2 text-slate-700">No conversations yet</p>
              <p className="text-sm mb-4">Start your first chat with Bristol A.I.</p>
              <button
                onClick={() => createSessionMutation.mutate('New Bristol AI Chat')}
                className="chrome-metallic-button px-6 py-3 rounded-xl font-bold"
              >
                Start New Chat
              </button>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session.id)}
                className={cn(
                  "w-full p-4 rounded-xl text-left transition-all duration-200 group",
                  selectedSession === session.id 
                    ? "bg-bristol-cyan/20 border border-bristol-cyan/50 text-white"
                    : "bg-white/5 border border-bristol-cyan/20 text-bristol-cyan/80 hover:bg-bristol-cyan/10 hover:border-bristol-cyan/40"
                )}
              >
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm">{session.title}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {session.createdAt ? format(new Date(session.createdAt), 'MMM d, h:mm a') : ''}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 h-full chrome-metallic-panel flex flex-col">
        {/* Chat Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-bristol-cyan/20 to-bristol-electric/20 rounded-full blur-sm animate-pulse" />
              <div className="relative bg-gradient-to-r from-bristol-cyan/10 to-bristol-electric/10 p-3 rounded-full border border-bristol-cyan/40 backdrop-blur-sm">
                <Brain className="h-8 w-8 text-bristol-cyan" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-bristol-cyan via-white to-bristol-gold bg-clip-text text-transparent">
                BRISTOL A.I. ELITE v5.0
              </h1>
              <p className="text-bristol-cyan/80 font-semibold">
                Fortune 500-Grade Real Estate Intelligence System
              </p>
            </div>
          </div>
          
          {/* Model Selector & Status */}
          <div className="flex items-center gap-4">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="chrome-metallic-input w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {premiumModels?.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{model.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {model.provider}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className={cn(
              "px-3 py-2 rounded-lg border text-sm font-semibold flex items-center gap-2",
              wsConnected 
                ? "bg-green-500/20 border-green-500/40 text-green-400" 
                : "bg-red-500/20 border-red-500/40 text-red-400"
            )}>
              <div className={cn("w-2 h-2 rounded-full", wsConnected ? "bg-green-400 animate-pulse" : "bg-red-400")} />
              {wsConnected ? "CONNECTED" : "DISCONNECTED"}
            </div>
          </div>
        </div>
        
        {/* Messages Area */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-4"
          style={{
            backgroundImage: `url('/attached_assets/generated_images/Elite_enterprise_tech_background_5f20b14a.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {!selectedSession ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="relative mb-6">
                <div className="absolute -inset-2 bg-gradient-to-r from-bristol-cyan/15 to-bristol-electric/15 rounded-full blur-lg animate-pulse" />
                <Brain className="h-16 w-16 text-bristol-cyan relative" />
              </div>
              <h2 className="text-3xl font-bold text-bristol-cyan mb-2">
                Bristol A.I. Elite Ready
              </h2>
              <p className="text-bristol-cyan/80 max-w-md mb-6 text-lg">
                I'm your Fortune 500-grade real estate intelligence partner. Create a new conversation to get started.
              </p>
              <button
                onClick={() => createSessionMutation.mutate('New Bristol AI Chat')}
                className="chrome-metallic-button px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3"
              >
                <Plus className="h-5 w-5" />
                Start New Conversation
              </button>
            </div>
          ) : messagesLoading ? (
            <div className="flex items-center justify-center h-full text-bristol-cyan/60">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Brain className="h-16 w-16 text-bristol-cyan mb-4 opacity-50" />
              <h3 className="text-2xl font-bold text-bristol-cyan mb-2">Ready to Analyze</h3>
              <p className="text-bristol-cyan/80 max-w-md mb-6">
                Ask me about property analysis, market trends, demographics, or investment opportunities.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm w-full max-w-lg">
                <div className="chrome-metallic-panel p-4 rounded-lg">
                  <Building2 className="h-5 w-5 text-bristol-cyan mb-2" />
                  <div className="text-slate-700 font-semibold">Property Analysis</div>
                  <div className="text-bristol-cyan/70 text-xs">IRR, NPV, Cap Rates</div>
                </div>
                <div className="chrome-metallic-panel p-4 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-bristol-gold mb-2" />
                  <div className="text-slate-700 font-semibold">Market Intelligence</div>
                  <div className="text-bristol-gold/70 text-xs">Demographics & Trends</div>
                </div>
                <div className="chrome-metallic-panel p-4 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-500 mb-2" />
                  <div className="text-slate-700 font-semibold">Investment Metrics</div>
                  <div className="text-green-500/70 text-xs">LP/GP Structures</div>
                </div>
                <div className="chrome-metallic-panel p-4 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-500 mb-2" />
                  <div className="text-slate-700 font-semibold">Risk Assessment</div>
                  <div className="text-purple-500/70 text-xs">Stress Testing</div>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex gap-4 p-4 rounded-xl backdrop-blur transition-all duration-200",
                  msg.role === "assistant" 
                    ? "bg-bristol-cyan/5 border border-bristol-cyan/20" 
                    : "bg-white/80 border border-bristol-cyan/15 ml-12"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  msg.role === "assistant" 
                    ? "bg-bristol-cyan/20 text-bristol-cyan" 
                    : "bg-bristol-gold/20 text-bristol-gold"
                )}>
                  {msg.role === "assistant" ? <Brain className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      msg.role === "assistant" ? "text-bristol-cyan" : "text-bristol-gold"
                    )}>
                      {msg.role === "assistant" ? "Bristol A.I. Elite" : "You"}
                    </span>
                    {msg.createdAt && (
                      <span className="text-xs text-gray-400">
                        {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {(isThinking || sendMessageMutation.isPending) && (
            <div className="flex gap-4 p-4 rounded-xl bg-bristol-cyan/5 border border-bristol-cyan/20 backdrop-blur">
              <div className="w-8 h-8 rounded-full bg-bristol-cyan/20 text-bristol-cyan flex items-center justify-center flex-shrink-0">
                <Brain className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-bristol-cyan">
                    Bristol A.I. Elite
                  </span>
                </div>
                <div className="flex items-center gap-2 text-bristol-cyan/80">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-bounce [animation-delay:-0.6s]" />
                    <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-bristol-cyan rounded-full animate-bounce" />
                  </div>
                  <span>Analyzing your request...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Message Input */}
        {selectedSession && (
          <div className="p-6 border-t border-slate-200">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about properties, market analysis, demographics, investment opportunities..."
                  disabled={sendMessageMutation.isPending || isThinking}
                  className="chrome-metallic-input text-lg py-4 pr-16"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!message.trim() || sendMessageMutation.isPending || isThinking}
                className="chrome-metallic-button px-6 py-4 rounded-xl font-bold flex items-center gap-2"
              >
                {sendMessageMutation.isPending || isThinking ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}