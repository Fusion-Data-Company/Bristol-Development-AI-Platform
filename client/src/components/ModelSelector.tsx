import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X, RefreshCw, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ModelOption = { 
  id: string; 
  label: string; 
  context?: number;
  available?: boolean;
  tier?: string;
  provider?: string;
};

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  onConfirmChange?: (oldModel: string, newModel: string) => Promise<boolean>;
  modelList: ModelOption[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  className?: string;
  showConfirmation?: boolean;
}

export function ModelSelector({
  value,
  onChange,
  onConfirmChange,
  modelList,
  loading = false,
  error = "",
  onRefresh,
  className = "",
  showConfirmation = true
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingModel, setPendingModel] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [lastConfirmedModel, setLastConfirmedModel] = useState(value);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Update last confirmed model when value changes externally
  useEffect(() => {
    setLastConfirmedModel(value);
  }, [value]);

  // Calculate dropdown position when opened
  const updateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const position = {
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      };
      console.log('ModelSelector position calculated:', position);
      setDropdownPosition(position);
    }
  }, []);

  // Handle button click to open/close dropdown
  const handleButtonClick = useCallback(() => {
    console.log('ModelSelector button clicked, current isOpen:', isOpen, 'modelList length:', modelList.length);
    if (!isOpen) {
      updateDropdownPosition();
    }
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    console.log('ModelSelector dropdown state changed to:', newIsOpen);
    if (newIsOpen) {
      console.log('Portal will render with models:', modelList.length, 'position:', dropdownPosition);
    }
  }, [isOpen, updateDropdownPosition, modelList.length, dropdownPosition]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', () => setIsOpen(false));
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', () => setIsOpen(false));
    };
  }, [isOpen]);

  const getProviderEmoji = useCallback((modelId: string) => {
    if (modelId.includes('gpt') || modelId.includes('openai')) return '🟢';
    if (modelId.includes('claude') || modelId.includes('anthropic')) return '🔶';
    if (modelId.includes('grok') || modelId.includes('x-ai')) return '⚡';
    if (modelId.includes('gemini') || modelId.includes('google')) return '🔷';
    if (modelId.includes('perplexity') || modelId.includes('sonar')) return '🔍';
    if (modelId.includes('meta') || modelId.includes('llama')) return '🦙';
    return '🤖';
  }, []);

  const currentModel = modelList.find(m => m.id === value);
  const pendingModelData = pendingModel ? modelList.find(m => m.id === pendingModel) : null;

  const handleModelSelect = async (newModelId: string) => {
    if (newModelId === value) {
      setIsOpen(false);
      return;
    }

    console.log(`🎯 Model Selector: User selected ${newModelId} (current: ${value})`);

    if (!showConfirmation) {
      onChange(newModelId);
      setLastConfirmedModel(newModelId);
      setIsOpen(false);
      return;
    }

    setPendingModel(newModelId);
    setConfirming(true);
    setIsOpen(false);
  };

  const confirmModelChange = async () => {
    if (!pendingModel) return;

    setConfirming(true);
    console.log(`🔄 Model Selector: Confirming change from ${value} to ${pendingModel}`);

    try {
      let confirmed = true;
      
      if (onConfirmChange) {
        confirmed = await onConfirmChange(value, pendingModel);
        console.log(`✅ Model Selector: Change confirmation result: ${confirmed}`);
      }

      if (confirmed) {
        onChange(pendingModel);
        setLastConfirmedModel(pendingModel);
        console.log(`✅ Model Selector: Successfully changed to ${pendingModel}`);
        
        // Log model change for analytics
        try {
          await fetch('/api/analytics/model-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromModel: value,
              toModel: pendingModel,
              timestamp: new Date().toISOString(),
              sessionId: sessionStorage.getItem('sessionId') || 'unknown'
            })
          });
        } catch (error) {
          console.warn('Failed to log model change:', error);
        }
      } else {
        console.log(`❌ Model Selector: Change denied by confirmation handler`);
      }
    } catch (error) {
      console.error('Model Selector: Error during model change:', error);
    } finally {
      setPendingModel(null);
      setConfirming(false);
    }
  };

  const cancelModelChange = () => {
    console.log(`❌ Model Selector: User cancelled change to ${pendingModel}`);
    setPendingModel(null);
    setConfirming(false);
  };

  if (error) {
    return (
      <div className={cn("relative", className)}>
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="text-sm text-red-400">Model loading failed</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="ml-auto p-1 hover:bg-red-500/20 rounded"
              title="Retry loading models"
            >
              <RefreshCw className="h-3 w-3 text-red-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Main Model Selector */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleButtonClick}
          disabled={loading || modelList.length === 0}
          className="relative w-full text-sm font-bold transition-all duration-300 backdrop-blur-sm rounded-2xl px-5 py-3 border text-brand-cyan hover:text-white focus:text-white focus:outline-none focus:border-brand-electric focus:ring-2 focus:ring-brand-electric/40 disabled:opacity-50 text-left"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(69, 214, 202, 0.1) 30%, rgba(30, 41, 59, 0.9) 100%)',
            borderColor: pendingModel ? 'rgba(249, 115, 22, 0.6)' : 'rgba(69, 214, 202, 0.6)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 1px 3px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-lg">{getProviderEmoji(value)}</span>
              )}
              <span className="truncate">
                {loading ? 'Loading OpenRouter Models...' : 
                 pendingModel ? `${currentModel?.label || value} → ${pendingModelData?.label || pendingModel}` :
                 currentModel?.label || value}
              </span>
              {pendingModel && (
                <span className="text-xs text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full">
                  PENDING
                </span>
              )}
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
          </div>
        </button>

        {/* Dropdown Portal */}
        {isOpen && createPortal(
          <div 
            className="fixed bg-slate-900 border border-brand-cyan/30 rounded-xl shadow-2xl backdrop-blur-sm z-[99999] max-h-80 overflow-y-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: `calc(100vh - ${dropdownPosition.top + 20}px)`
            }}
          >
            <div className="p-2">
              <div className="text-xs text-brand-cyan/70 px-3 py-2 border-b border-brand-cyan/20 mb-2 flex items-center justify-between">
                <span>OpenRouter Models ({modelList.length})</span>
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="p-1 hover:bg-brand-cyan/10 rounded"
                    title="Refresh models from OpenRouter"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                )}
              </div>
              
              {modelList.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model.id)}
                  disabled={model.available === false}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-3",
                    model.id === value 
                      ? "bg-brand-cyan/20 text-white border border-brand-cyan/30" 
                      : "hover:bg-brand-cyan/10 text-slate-300 hover:text-white",
                    model.available === false && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span className="text-lg">{getProviderEmoji(model.id)}</span>
                  <div className="flex-1">
                    <div className={cn(
                      "font-medium",
                      model.id === value ? "text-white" : ""
                    )}>{model.label}</div>
                    {model.context && (
                      <div className={cn(
                        "text-xs",
                        model.id === value ? "text-slate-200" : "text-slate-400"
                      )}>
                        {model.context.toLocaleString()} tokens
                      </div>
                    )}
                  </div>
                  {model.id === value && (
                    <Check className="h-4 w-4 text-brand-cyan" />
                  )}
                  {model.tier === 'premium' && (
                    <Zap className="h-3 w-3 text-yellow-400" />
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* Model Change Confirmation Dialog */}
      {pendingModel && showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-brand-cyan/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-brand-cyan/20 rounded-full flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-brand-cyan" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Model Change</h3>
                <p className="text-sm text-slate-400">This will switch your AI model</p>
              </div>
            </div>
            
            <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-lg">{getProviderEmoji(value)}</span>
                <div className="flex-1">
                  <div className="text-sm text-slate-300">Current Model</div>
                  <div className="font-medium text-white">{currentModel?.label || value}</div>
                </div>
              </div>
              
              <div className="flex justify-center mb-3">
                <ChevronDown className="h-5 w-5 text-brand-cyan" />
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-lg">{getProviderEmoji(pendingModel)}</span>
                <div className="flex-1">
                  <div className="text-sm text-slate-300">New Model</div>
                  <div className="font-medium text-brand-cyan">{pendingModelData?.label || pendingModel}</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelModelChange}
                disabled={confirming}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModelChange}
                disabled={confirming}
                className="flex-1 px-4 py-2 bg-brand-cyan hover:bg-brand-cyan/80 text-brand-ink rounded-xl transition-colors font-bold flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Switching...
                  </>
                ) : (
                  'Confirm Change'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}