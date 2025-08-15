import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import SimpleChrome from '@/components/brand/SimpleChrome';
import { BristolFooter } from "@/components/ui/BristolFooter";
import { 
  Send, 
  MessageCircle, 
  Brain,
  Loader2,
  Building2,
  TrendingUp,
  DollarSign,
  BarChart3,
  Users,
  Settings,
  Database,
  Activity,
  Cpu,
  Zap,
  ChevronDown,
  HelpCircle
} from 'lucide-react';

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  sessionId?: string;
  metadata?: any;
}

export default function Chat() {
  const [message, setMessage] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [model, setModel] = useState("openai/gpt-4o");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your AI assistant. How can I help you today?",
      createdAt: new Date().toISOString()
    }
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get available models
  const { data: modelData } = useQuery({
    queryKey: ['/api/chat/models'],
  });

  // Get chat sessions
  const { data: sessions } = useQuery({
    queryKey: ['/api/chat/sessions'],
    enabled: false // Disable for now until auth is working
  });

  // Get messages for selected session
  const { data: sessionMessages } = useQuery({
    queryKey: [`/api/chat/sessions/${selectedSession}/messages`],
    enabled: !!selectedSession
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: [
            ...messages.filter(m => m.role !== 'assistant' || m.id !== 'welcome'),
            { role: 'user', content }
          ],
          temperature: 0.7,
          maxTokens: 4000
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onMutate: (content) => {
      // Add user message immediately
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      setIsThinking(true);
    },
    onSuccess: (data) => {
      // Add assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || data.content?.[0]?.text || 'Sorry, I could not process your request.',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsThinking(false);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsThinking(false);
    }
  });

  const handleSend = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const modelOptions: ModelOption[] = (modelData as any)?.models || [
    { id: "openai/gpt-4o", name: "GPT-4o", provider: "openai", description: "Most capable GPT-4 model" },
    { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "anthropic", description: "Anthropic's most capable model" },
    { id: "google/gemini-pro", name: "Gemini Pro", provider: "google", description: "Google's advanced model" }
  ];

  return (
    <SimpleChrome>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Chat</h1>
                <p className="text-sm text-gray-500">Powered by advanced language models</p>
              </div>
            </div>
            
            {/* Model Selector */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Model:</span>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.name}</span>
                          <span className="text-xs text-gray-500">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-6 py-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    <div className="flex items-start gap-3">
                      {msg.role === 'assistant' && (
                        <div className="p-1 bg-blue-100 rounded">
                          <Brain className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-2 ${
                          msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-blue-100 rounded">
                        <Brain className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={sendMessageMutation.isPending}
                  className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Data Presentation Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            onClick={() => {
              // Add data presentation functionality
              console.log('Data presentation clicked');
            }}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Data Presentation
          </Button>
        </div>

        {/* Instructions Button */}
        <div className="fixed bottom-6 right-48 z-50">
          <Button
            variant="outline"
            className="bg-white shadow-lg border-gray-300 hover:bg-gray-50"
            onClick={() => {
              // Add instructions functionality
              console.log('Instructions clicked');
            }}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Instructions
          </Button>
        </div>
        
        <BristolFooter />
      </div>
    </SimpleChrome>
  );
}