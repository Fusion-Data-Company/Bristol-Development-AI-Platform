import React from 'react';

interface ElevenLabsWidgetProps {
  agentId?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const ElevenLabsWidget: React.FC<ElevenLabsWidgetProps> = ({ 
  agentId = 'agent_8801k2t62y9qehhsqqdmzmp10kt9',
  position = 'bottom-right' 
}) => {
  // Simple informational display that references the HTML embed
  return (
    <div className="text-center p-4">
      <div className="text-lg font-semibold mb-2">Bristol A.I. Elite Voice Chat</div>
      <div className="text-sm text-zinc-600 mb-4">
        ElevenLabs ConvAI widget is embedded in the page HTML.
        <br />
        Agent ID: {agentId}
      </div>
      <div className="text-xs text-zinc-500">
        The voice chat widget should appear globally on all pages.
        <br />
        If you don't see it, check your browser console for loading errors.
      </div>
    </div>
  );
};

export default ElevenLabsWidget;