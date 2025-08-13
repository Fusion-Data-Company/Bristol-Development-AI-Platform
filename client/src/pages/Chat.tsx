import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Plus, 
  MessageCircle, 
  Brain,
  Sparkles,
  History,
  Settings,
  Trash2
} from 'lucide-react';
import { type ChatSession, type ChatMessage } from '@shared/schema';
import { format } from 'date-fns';
import Chrome from '@/components/brand/SimpleChrome';

export default function Chat() {
  const [message, setMessage] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Get chat sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions']
  });

  // Get messages for selected session
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/sessions/${selectedSession}/messages`],
    enabled: !!selectedSession
  });

  // Create new session
  const createSessionMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: (newSession: any) => {
      setSelectedSession(newSession.id);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
    }
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedSession) throw new Error('No session selected');
      const response = await fetch(`/api/chat/sessions/${selectedSession}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ 
        queryKey: [`/api/chat/sessions/${selectedSession}/messages`] 
      });
    }
  });

  // Auto-select first session or create one
  useEffect(() => {
    if (!selectedSession && sessions.length > 0) {
      setSelectedSession(sessions[0].id);
    }
  }, [sessions, selectedSession]);

  // Auto-scroll to bottom
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

  return (
    <Chrome>
      <div className="container mx-auto p-6 h-[calc(100vh-6rem)]">
      <div className="grid gap-6 lg:grid-cols-4 h-full">
        {/* Sessions Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Conversations</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => createSessionMutation.mutate('New Chat')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-2">
                  {sessionsLoading ? (
                    <div className="text-center text-muted-foreground py-4">
                      Loading sessions...
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>No conversations yet</p>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => createSessionMutation.mutate('New Chat')}
                      >
                        Start New Chat
                      </Button>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <Button
                        key={session.id}
                        variant={selectedSession === session.id ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => setSelectedSession(session.id)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        <div className="flex-1 text-left">
                          <p className="truncate">{session.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.createdAt ? format(new Date(session.createdAt), 'MMM d, h:mm a') : ''}
                          </p>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Bristol AI Assistant
              </CardTitle>
              <CardDescription>
                Intelligent insights for your development projects
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Tabs defaultValue="chat" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="chat">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="insights">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Insights
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chat" className="flex-1 flex flex-col mt-4">
                  {/* Messages */}
                  <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Brain className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="text-lg font-medium mb-1">
                          How can I assist you today?
                        </p>
                        <p className="text-sm text-muted-foreground max-w-md">
                          I can help analyze sites, provide market insights, generate reports, 
                          and answer questions about your development projects.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 pb-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-3 ${
                                msg.role === 'user'
                                  ? 'bg-bristol-maroon text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                        {sendMessageMutation.isPending && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-3">
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
                  <div className="flex gap-2 mt-4">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      disabled={sendMessageMutation.isPending || !selectedSession}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim() || sendMessageMutation.isPending || !selectedSession}
                      className="bg-bristol-maroon hover:bg-bristol-maroon/90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="insights" className="flex-1 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Market Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Charlotte market showing 12% YoY growth in multifamily demand
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Top Opportunity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          South End district: High Bristol Score sites with favorable zoning
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Risk Alert</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Rising construction costs may impact Q2 project viability
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Recommendation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Consider accelerating pre-development on high-score sites
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="flex-1 mt-4">
                  <ScrollArea className="h-[calc(100vh-20rem)]">
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <Card key={session.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{session.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {session.createdAt ? format(new Date(session.createdAt), 'MMMM d, yyyy h:mm a') : ''}
                                </p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </Chrome>
  );
}