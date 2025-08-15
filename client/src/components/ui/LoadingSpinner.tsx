import React from 'react';
import { Loader2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  variant?: 'default' | 'bristol' | 'minimal';
}

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  className,
  variant = 'default'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  if (variant === 'bristol') {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 space-y-4", className)}>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#8B1538] to-[#A01B4C] rounded-full blur-md opacity-75"></div>
          <div className="relative bg-white rounded-full p-4">
            <Building2 className={cn(sizeClasses[size], "text-[#8B1538] animate-pulse")} />
          </div>
        </div>
        {text && (
          <p className={cn(textSizeClasses[size], "text-gray-600 font-medium")}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Loader2 className={cn(sizeClasses[size], "animate-spin text-gray-500")} />
        {text && <span className={cn(textSizeClasses[size], "text-gray-600")}>{text}</span>}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center p-6 space-y-3", className)}>
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-blue-500")} />
      {text && (
        <p className={cn(textSizeClasses[size], "text-gray-600 font-medium text-center")}>
          {text}
        </p>
      )}
    </div>
  );
}

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  className?: string;
  variant?: 'default' | 'bristol' | 'minimal';
}

export function LoadingOverlay({ 
  isLoading, 
  text = "Loading...", 
  className,
  variant = 'bristol'
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50",
      className
    )}>
      <LoadingSpinner text={text} variant={variant} size="lg" />
    </div>
  );
}