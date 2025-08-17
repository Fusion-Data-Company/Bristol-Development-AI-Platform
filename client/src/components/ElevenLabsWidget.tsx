import React, { useEffect, useState } from 'react';
import { useConversation } from '@elevenlabs/react';

interface ElevenLabsWidgetProps {
  agentId?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const ElevenLabsWidget: React.FC<ElevenLabsWidgetProps> = ({ 
  agentId = 'agent_8801k2t62y9qehhsqqdmzmp10kt9',
  position = 'bottom-right' 
}) => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [hasError, setHasError] = useState(false);

  const positionStyles = {
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' }
  };

  // Use ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ ElevenLabs conversation connected');
      setIsSessionActive(true);
    },
    onDisconnect: () => {
      console.log('🔌 ElevenLabs conversation disconnected');
      setIsSessionActive(false);
    },
    onError: (error) => {
      console.error('❌ ElevenLabs conversation error:', error);
      setHasError(true);
    },
    onMessage: (message) => {
      console.log('💬 ElevenLabs message:', message);
    }
  });

  const startConversation = async () => {
    if (!isSessionActive) {
      try {
        await conversation.startSession({ agentId });
      } catch (error) {
        console.error('Failed to start ElevenLabs session:', error);
        setHasError(true);
      }
    } else {
      conversation.endSession();
    }
  };

  // Fallback widget when SDK fails or no session
  if (hasError) {
    return (
      <div
        style={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 9999,
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #8B1538 0%, #D4AF37 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '18px',
          boxShadow: '0 4px 20px rgba(139, 21, 56, 0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        onClick={() => {
          alert(`Bristol A.I. Elite Chat\n\nAgent ID: ${agentId}\n\nNote: ElevenLabs widget is currently unavailable.\n\nTroubleshooting:\n1. Ensure agent is public with authentication disabled\n2. Add domain to agent allowlist\n3. Check network connectivity`);
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(139, 21, 56, 0.6)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 21, 56, 0.4)';
        }}
        title="Bristol A.I. Elite - ElevenLabs ConvAI (Error)"
      >
        ⚠️
      </div>
    );
  }

  // Main widget UI
  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 9999,
        width: '60px',
        height: '60px',
        background: isSessionActive 
          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' // Green when active
          : 'linear-gradient(135deg, #8B1538 0%, #D4AF37 100%)', // Bristol colors when inactive
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '18px',
        boxShadow: isSessionActive 
          ? '0 4px 20px rgba(16, 185, 129, 0.4)' 
          : '0 4px 20px rgba(139, 21, 56, 0.4)',
        transition: 'all 0.2s ease',
        border: isSessionActive ? '2px solid rgba(16, 185, 129, 0.3)' : 'none'
      }}
      onClick={startConversation}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = isSessionActive 
          ? '0 6px 25px rgba(16, 185, 129, 0.6)'
          : '0 6px 25px rgba(139, 21, 56, 0.6)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = isSessionActive 
          ? '0 4px 20px rgba(16, 185, 129, 0.4)'
          : '0 4px 20px rgba(139, 21, 56, 0.4)';
      }}
      title={isSessionActive 
        ? "Bristol A.I. Elite - Active (Click to end)" 
        : "Bristol A.I. Elite - Click to start conversation"
      }
    >
      {isSessionActive ? '🎙️' : '🎤'}
    </div>
  );
};

export default ElevenLabsWidget;