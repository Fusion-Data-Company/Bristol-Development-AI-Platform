import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface ElevenLabsWidgetProps {
  agentId?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const ElevenLabsWidget: React.FC<ElevenLabsWidgetProps> = ({ 
  agentId = 'agent_8801k2t62y9qehhsqqdmzmp10kt9',
  position = 'bottom-right' 
}) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = React.useState(true);
  const [isListening, setIsListening] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6', 
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  useEffect(() => {
    // Load ElevenLabs ConvAI script
    const script = document.createElement('script');
    script.src = 'https://elevenlabs.io/convai-widget/index.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ ElevenLabs ConvAI script loaded');
      setIsConnected(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load ElevenLabs ConvAI script');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://elevenlabs.io/convai-widget/index.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Initialize ElevenLabs widget when script is loaded
    if (isConnected && widgetRef.current) {
      try {
        // Create ElevenLabs widget element
        const widgetElement = document.createElement('elevenlabs-convai');
        widgetElement.setAttribute('agent-id', agentId);
        widgetRef.current.appendChild(widgetElement);
        console.log('✅ ElevenLabs widget initialized with agent:', agentId);
      } catch (error) {
        console.error('❌ Error initializing ElevenLabs widget:', error);
      }
    }
  }, [isConnected, agentId]);

  if (isMinimized) {
    return (
      <div 
        className={`fixed ${positionClasses[position]} z-50 cursor-pointer`}
        onClick={() => setIsMinimized(false)}
      >
        <div className="bg-bristol-dark hover:bg-bristol-dark/80 text-gold p-3 rounded-full shadow-2xl border border-gold/20 transition-all duration-300 hover:scale-110">
          <div className="flex items-center gap-2">
            <Mic size={24} />
            <span className="text-sm font-medium hidden sm:block">Bristol Voice</span>
          </div>
          {!isConnected && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl p-4 w-80 max-h-96">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-bristol-dark rounded-full flex items-center justify-center">
              <Mic size={16} className="text-gold" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Bristol A.I. Voice</div>
              <div className="text-xs text-gray-500">
                {isConnected ? 'Connected' : 'Connecting...'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            ×
          </button>
        </div>

        {/* ElevenLabs Widget Container */}
        <div 
          ref={widgetRef}
          className="min-h-[200px] flex items-center justify-center bg-gray-50 rounded-lg"
        >
          {!isConnected ? (
            <div className="text-center">
              <div className="animate-spin w-6 h-6 border-2 border-bristol-dark border-t-transparent rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-gray-600">Loading ElevenLabs...</div>
            </div>
          ) : (
            <div className="text-center text-gray-600">
              <Mic size={32} className="mx-auto mb-2 text-bristol-dark" />
              <div className="text-sm">Voice chat ready</div>
            </div>
          )}
        </div>

        {/* Status Footer */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Agent: {agentId.slice(-8)}</span>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElevenLabsWidget;