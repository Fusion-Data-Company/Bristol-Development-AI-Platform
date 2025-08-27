/**
 * Unified MCP Chat Hook
 * Provides consistent MCP integration for all Company AI agents
 * Handles model selection, tool execution, and conversation persistence
 */

import { useState, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Types for MCP Chat
export interface MCPChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    toolsExecuted?: string[];
    model?: string;
    processingTime?: number;
    sourceInstance?: string;
    [key: string]: any;
  };
  timestamp?: string;
}

export interface MCPChatRequest {
  message: string;
  sessionId?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
  sourceInstance?: 'main' | 'floating' | 'elevenlabs';
  
  // MCP Configuration
  mcpEnabled?: boolean;
  mcpTools?: string[];
  toolSharing?: boolean;
  
  // Model Management
  validateModel?: boolean;
  fallbackModel?: string;
  
  // Memory and Context
  enableAdvancedReasoning?: boolean;
  memoryEnabled?: boolean;
  crossSessionMemory?: boolean;
  realTimeData?: boolean;
  
  // Optional context
  systemPrompt?: string;
  messages?: MCPChatMessage[];
  dataContext?: Record<string, any>;
  
  // UI Configuration
  showToolExecution?: boolean;
  enableSuggestions?: boolean;
}

export interface MCPChatResponse {
  success: boolean;
  content: string;
  role: 'assistant';
  sessionId: string;
  model: string;
  metadata: {
    requestId: string;
    processingTime: number;
    mcpEnabled: boolean;
    toolsAvailable: number;
    toolsExecuted?: string[];
    modelValidation?: {
      valid: boolean;
      finalModel: string;
      issues?: string[];
      healthStatus?: any;
    };
    sourceInstance: string;
    features: {
      memoryEnabled: boolean;
      realTimeData: boolean;
      advancedReasoning: boolean;
      toolSharing: boolean;
    };
    [key: string]: any;
  };
  memoryStored?: {
    userMemory: string;
    assistantMemory: string;
    toolContexts: string[];
  };
}

export interface AvailableModel {
  id: string;
  name: string;
  provider: string;
  tier: 'free' | 'standard' | 'premium' | 'elite';
  category: 'chat' | 'reasoning' | 'coding' | 'research' | 'multimodal';
  features: string[];
  maxTokens: number;
  pricing: {
    prompt: number;
    completion: number;
  };
  status: 'active' | 'maintenance' | 'deprecated';
}

export interface ModelValidationResult {
  valid: boolean;
  model?: AvailableModel;
  openrouterModel?: any;
  healthStatus?: any;
  issues?: string[];
  recommendation?: string;
}

export interface UseMCPChatOptions {
  sourceInstance?: 'main' | 'floating' | 'elevenlabs';
  defaultModel?: string;
  defaultSessionId?: string;
  enableMCP?: boolean;
  autoValidateModel?: boolean;
  onModelSwitch?: (newModel: string) => void;
  onToolExecution?: (tools: string[]) => void;
  onError?: (error: Error) => void;
}

export function useMCPChat(options: UseMCPChatOptions = {}) {
  const {
    sourceInstance = 'main',
    defaultModel = 'gpt-4o',
    defaultSessionId,
    enableMCP = true,
    autoValidateModel = true,
    onModelSwitch,
    onToolExecution,
    onError
  } = options;

  const [currentModel, setCurrentModel] = useState(defaultModel);
  const [sessionId, setSessionId] = useState(defaultSessionId);
  const [messages, setMessages] = useState<MCPChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastResponse, setLastResponse] = useState<MCPChatResponse | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get available models with health status
  const { 
    data: modelsData, 
    isLoading: modelsLoading,
    error: modelsError,
    refetch: refetchModels 
  } = useQuery({
    queryKey: ['/api/mcp-unified/models', { includeHealth: autoValidateModel }],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/mcp-unified/models');
      return await response.json() as {
        success: boolean;
        models: AvailableModel[];
        totalCount: number;
        categories: string[];
        providers: string[];
        healthStatus?: Record<string, any>;
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Send message mutation with comprehensive MCP support
  const sendMessageMutation = useMutation({
    mutationFn: async (request: MCPChatRequest) => {
      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const mcpRequest: MCPChatRequest = {
        model: currentModel,
        sourceInstance,
        mcpEnabled: enableMCP,
        validateModel: autoValidateModel,
        memoryEnabled: true,
        crossSessionMemory: true,
        realTimeData: true,
        enableAdvancedReasoning: true,
        toolSharing: true,
        showToolExecution: true,
        enableSuggestions: true,
        ...request,
        sessionId: sessionId || request.sessionId
      };

      const response = await apiRequest(
        'POST',
        '/api/mcp-unified/chat', 
        mcpRequest
      );

      return response as MCPChatResponse;
    },
    onMutate: (request) => {
      setIsThinking(true);
      
      // Add user message to UI immediately
      const userMessage: MCPChatMessage = {
        role: 'user',
        content: request.message,
        timestamp: new Date().toISOString(),
        metadata: {
          sourceInstance,
          model: currentModel
        }
      };
      
      setMessages(prev => [...prev, userMessage]);
    },
    onSuccess: (response, request) => {
      setIsThinking(false);
      setLastResponse(response);
      
      // Update session ID if new
      if (response.sessionId && response.sessionId !== sessionId) {
        setSessionId(response.sessionId);
      }

      // Add assistant response to messages
      const assistantMessage: MCPChatMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        metadata: response.metadata
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Handle callbacks
      if (response.metadata.toolsExecuted && response.metadata.toolsExecuted.length > 0) {
        onToolExecution?.(response.metadata.toolsExecuted);
      }

      if (response.metadata.modelValidation && 
          response.metadata.modelValidation.finalModel !== currentModel) {
        const newModel = response.metadata.modelValidation.finalModel;
        setCurrentModel(newModel);
        onModelSwitch?.(newModel);
        
        toast({
          title: "Model Switched",
          description: `Switched to ${newModel} for better performance`,
          duration: 3000
        });
      }

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/mcp-unified'] });
    },
    onError: (error: Error, request) => {
      setIsThinking(false);
      console.error('[MCPChat] Send message error:', error);
      
      onError?.(error);
      
      toast({
        title: "Chat Error", 
        description: error.message || "Failed to send message",
        variant: "destructive",
        duration: 5000
      });
      
      // Remove the failed user message
      setMessages(prev => prev.slice(0, -1));
    }
  });

  // Model validation mutation
  const validateModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      const response = await apiRequest('/api/mcp-unified/validate-model', 'POST', {
        modelId,
        checkHealth: true
      });
      return response as { success: boolean; validation: ModelValidationResult };
    },
    onSuccess: (response, modelId) => {
      if (!response.validation.valid) {
        toast({
          title: "Model Issue",
          description: response.validation.issues?.join(', ') || "Model validation failed",
          variant: "destructive",
          duration: 5000
        });
      }
    }
  });

  // Model switching mutation
  const switchModelMutation = useMutation({
    mutationFn: async ({ fromModel, toModel }: { fromModel?: string; toModel: string }) => {
      const response = await apiRequest('/api/mcp-unified/switch-model', 'POST', {
        fromModel: fromModel || currentModel,
        toModel,
        sessionId
      });
      return response as { success: boolean; switchResult: any };
    },
    onSuccess: (response, variables) => {
      if (response.success) {
        const oldModel = currentModel;
        setCurrentModel(variables.toModel);
        onModelSwitch?.(variables.toModel);
        
        toast({
          title: "Model Switched",
          description: `Successfully switched from ${oldModel} to ${variables.toModel}`,
          duration: 3000
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Model Switch Failed",
        description: error.message || "Failed to switch model",
        variant: "destructive",
        duration: 5000
      });
    }
  });

  // Utility functions
  const sendMessage = useCallback((message: string, options?: Partial<MCPChatRequest>) => {
    return sendMessageMutation.mutate({
      message,
      ...options
    });
  }, [sendMessageMutation]);

  const validateModel = useCallback((modelId?: string) => {
    return validateModelMutation.mutate(modelId || currentModel);
  }, [validateModelMutation, currentModel]);

  const switchModel = useCallback((toModel: string) => {
    return switchModelMutation.mutate({ 
      fromModel: currentModel, 
      toModel 
    });
  }, [switchModelMutation, currentModel]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastResponse(null);
  }, []);

  const abortCurrentRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsThinking(false);
    }
  }, []);

  // Get available models grouped by category
  const availableModels = modelsData?.models || [];
  const modelsByCategory = availableModels.reduce((acc, model) => {
    if (!acc[model.category]) {
      acc[model.category] = [];
    }
    acc[model.category].push(model);
    return acc;
  }, {} as Record<string, AvailableModel[]>);

  const modelsByTier = availableModels.reduce((acc, model) => {
    if (!acc[model.tier]) {
      acc[model.tier] = [];
    }
    acc[model.tier].push(model);
    return acc;
  }, {} as Record<string, AvailableModel[]>);

  return {
    // State
    currentModel,
    sessionId,
    messages,
    isThinking,
    lastResponse,
    
    // Data
    availableModels,
    modelsByCategory,
    modelsByTier,
    modelsLoading,
    modelsError,
    
    // Actions
    sendMessage,
    validateModel,
    switchModel,
    clearMessages,
    abortCurrentRequest,
    refetchModels,
    
    // Mutation states
    isSending: sendMessageMutation.isPending,
    isValidating: validateModelMutation.isPending,
    isSwitching: switchModelMutation.isPending,
    
    // Errors
    sendError: sendMessageMutation.error,
    validationError: validateModelMutation.error,
    switchError: switchModelMutation.error
  };
}