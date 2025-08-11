import { cn } from "@/lib/utils";

interface ThinkingIndicatorProps {
  isThinking: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ThinkingIndicator({ isThinking, size = "md", className }: ThinkingIndicatorProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10", 
    lg: "w-16 h-16"
  };

  const innerSizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Thinking Ring */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full transition-opacity duration-300",
          sizeClasses[size],
          isThinking ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: "conic-gradient(from 0deg, transparent, #8B1538, transparent)",
          animation: isThinking ? "spin 2s linear infinite" : "none"
        }}
      />
      
      {/* Inner Logo/Icon */}
      <div className={cn(
        "absolute inset-1 bg-gradient-to-br from-bristol-maroon to-bristol-gold rounded-full flex items-center justify-center shadow-lg transition-transform duration-300",
        innerSizeClasses[size],
        isThinking ? "animate-pulse scale-110" : "scale-100"
      )}>
        <span className={cn(
          "text-white font-serif font-bold",
          size === "sm" ? "text-xs" : size === "md" ? "text-lg" : "text-2xl"
        )}>
          B
        </span>
      </div>

      {/* Floating particles effect when thinking */}
      {isThinking && (
        <>
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-bristol-gold rounded-full animate-ping opacity-75" />
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-bristol-maroon rounded-full animate-ping opacity-60" style={{ animationDelay: "0.5s" }} />
          <div className="absolute top-0 -left-2 w-1 h-1 bg-bristol-gold rounded-full animate-ping opacity-50" style={{ animationDelay: "1s" }} />
        </>
      )}
    </div>
  );
}
