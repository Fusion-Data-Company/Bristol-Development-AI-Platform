import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { type ChatMessage, type ChatSession } from '@shared/schema';

interface ChatDockProps {
  className?: string;
  defaultOpen?: boolean;
}

export function ChatDock({ className, defaultOpen = false }: ChatDockProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get or create chat session
  const { data: sessions } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions'],
    enabled: isOpen
  });

  // Get messages for current session
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/sessions/${sessionId}/messages`],
    enabled: !!sessionId
  });

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/chat/sessions', {
        method: 'POST',
        body: { title: 'Quick Chat' }
      });
    },
    onSuccess: (newSession) => {
      setSessionId(newSession.id);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!sessionId) throw new Error('No session');
      return apiRequest(`/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: { content }
      });
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ 
        queryKey: [`/api/chat/sessions/${sessionId}/messages`] 
      });
    }
  });

  // Initialize session when dock opens
  useEffect(() => {
    if (isOpen && !sessionId && sessions) {
      if (sessions.length > 0) {
        setSessionId(sessions[0].id);
      } else {
        createSessionMutation.mutate();
      }
    }
  }, [isOpen, sessionId, sessions]);

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
      <div className="flex items-center justify-between p-3 border-b bg-bristol-maroon text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold">Bristol AI Assistant</span>
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
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Hi! I'm your Bristol AI assistant.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  How can I help you today?
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
                        "max-w-[80%] rounded-lg px-3 py-2",
                        msg.role === 'user'
                          ? 'bg-bristol-maroon text-white'
                          : 'bg-gray-100 text-gray-900'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={sendMessageMutation.isPending || !sessionId}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMessageMutation.isPending || !sessionId}
                size="icon"
                className="bg-bristol-maroon hover:bg-bristol-maroon/90"
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