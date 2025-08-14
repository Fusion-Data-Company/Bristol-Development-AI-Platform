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
          background: "linear-gradient(135deg, #8B1538, #6B1229)",
          animation: "none"
        }}
      />
      
      {/* Inner Logo/Icon */}
      <div className={cn(
        "absolute inset-1 bg-gradient-to-br from-bristol-maroon to-bristol-maroon rounded-full flex items-center justify-center shadow-lg transition-transform duration-300",
        innerSizeClasses[size],
        "scale-100"
      )}>
        <span className={cn(
          "text-white font-serif font-bold",
          size === "sm" ? "text-xs" : size === "md" ? "text-lg" : "text-2xl"
        )}>
          B
        </span>
      </div>

      {/* Bristol gold metallic details on the button face */}
      <div className="absolute inset-2 rounded-full">
        {/* Metallic ridges and details */}
        <div className="absolute top-1 left-1/2 w-3 h-0.5 bg-gradient-to-r from-transparent via-bristol-gold/60 to-transparent rounded-full transform -translate-x-1/2"></div>
        <div className="absolute bottom-1 left-1/2 w-3 h-0.5 bg-gradient-to-r from-transparent via-bristol-gold/60 to-transparent rounded-full transform -translate-x-1/2"></div>
        <div className="absolute left-1 top-1/2 w-0.5 h-3 bg-gradient-to-b from-transparent via-bristol-gold/60 to-transparent rounded-full transform -translate-y-1/2"></div>
        <div className="absolute right-1 top-1/2 w-0.5 h-3 bg-gradient-to-b from-transparent via-bristol-gold/60 to-transparent rounded-full transform -translate-y-1/2"></div>
        {/* Central metallic highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-bristol-gold/20 via-transparent to-bristol-gold/20"></div>
      </div>
    </div>
  );
}
