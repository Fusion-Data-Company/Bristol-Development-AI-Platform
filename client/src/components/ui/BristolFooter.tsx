import React from 'react';

interface BristolFooterProps {
  className?: string;
}

export function BristolFooter({ className = "" }: BristolFooterProps) {
  return (
    <div className={`h-32 bg-gray-900 mt-8 ${className}`}>
      <div className="flex items-center justify-center h-full">
        <p className="text-white/70 text-sm">Bristol Development Group - Enterprise Intelligence Platform</p>
      </div>
    </div>
  );
}