import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Brain, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

interface ChatDockProps {
  className?: string;
  defaultOpen?: boolean;
}

export function ChatDock({ className, defaultOpen = false }: ChatDockProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isThinking, setIsThinking] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Send message mutation using Bristol Brain Elite
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('/api/bristol-brain-elite/chat', 'POST', {
        sessionId,
        message: content,
        enableAdvancedReasoning: true,
        dataContext: {} // Could include current app context here
      });
      return response;
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
    },
    onSuccess: (response: any) => {
      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: response?.content || response?.text || response?.message || 'I apologize, but I was unable to generate a response.',
        createdAt: response?.createdAt || new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsThinking(false);
    },
    onError: (error) => {
      console.error('Bristol Brain Error:', error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsThinking(false);
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = () => {
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-bristol-maroon hover:bg-bristol-maroon/90 z-50",
          className
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 shadow-2xl z-50 transition-all duration-200",
      isMinimized ? "w-80 h-14" : "w-96 h-[500px]",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-bristol-ink to-bristol-maroon text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Brain className="h-5 w-5" />
            {isThinking && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-bristol-gold rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <span className="font-bold text-sm">Bristol Brain Elite</span>
            <Badge variant="secondary" className="ml-2 bg-bristol-gold text-bristol-ink text-xs">
              GPT-5
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 h-[380px]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="relative mb-4">
                  <Brain className="h-16 w-16 text-bristol-maroon" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-bristol-gold rounded-full animate-pulse" />
                </div>
                <h4 className="font-bold text-bristol-ink mb-2">Bristol Brain Elite</h4>
                <p className="text-muted-foreground text-sm">
                  Your AI-powered real estate intelligence partner
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask about deals, market analysis, or property insights
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl px-4 py-3 shadow-sm",
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-bristol-maroon to-bristol-ink text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      {msg.createdAt && (
                        <p className="text-xs opacity-70 mt-2">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {isThinking && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-bristol-maroon animate-pulse" />
                        <span className="text-sm text-gray-600">Bristol Brain is thinking...</span>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-bristol-maroon rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-bristol-maroon rounded-full animate-bounce delay-100" />
                          <div className="w-1.5 h-1.5 bg-bristol-maroon rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t bg-gray-50/50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Bristol Brain about deals, markets, or properties..."
                disabled={sendMessageMutation.isPending}
                className="flex-1 border-gray-200 focus:border-bristol-maroon"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMessageMutation.isPending}
                size="icon"
                className="bg-gradient-to-r from-bristol-maroon to-bristol-ink hover:from-bristol-maroon/90 hover:to-bristol-ink/90 shadow-md"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}