import { ThreeDEffectLoader } from "./3d-effect-loader";
import { cn } from "@/lib/utils";

interface AuthenticationLoadingCardProps {
  className?: string;
  message?: string;
  isVisible?: boolean;
}

export function AuthenticationLoadingCard({ 
  className, 
  message = "Authenticating with Bristol Site Intelligence Platform...",
  isVisible = true 
}: AuthenticationLoadingCardProps) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      "bg-black/60 backdrop-blur-sm",
      className
    )}>
      <div className="chrome-metallic-panel mx-4 max-w-md w-full p-8 text-center">
        {/* Bristol Logo Area */}
        <div className="mb-6">
          <div className="inline-flex items-center space-x-3 mb-3">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-bold text-bristol-maroon font-serif tracking-wide">
              Bristol Site Intelligence
            </h2>
            <div className="w-3 h-3 bg-bristol-gold rounded-full animate-pulse animation-delay-300"></div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-bristol-maroon/30 to-transparent"></div>
        </div>

        {/* 3D Effect Loader */}
        <div className="mb-6">
          <ThreeDEffectLoader />
        </div>

        {/* Loading Message */}
        <div className="space-y-3">
          <p className="text-bristol-stone text-sm font-medium leading-relaxed">
            {message}
          </p>
          
          {/* Status Indicators */}
          <div className="flex justify-center space-x-4 text-xs text-bristol-stone/70">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Secure Connection</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse animation-delay-200"></div>
              <span>Verifying Access</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-bristol-maroon to-bristol-gold animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Elite Branding */}
        <div className="mt-6 pt-4 border-t border-bristol-maroon/10">
          <p className="text-xs text-bristol-stone/60 font-medium tracking-wider uppercase">
            Elite Enterprise Authentication
          </p>
        </div>
      </div>
    </div>
  );
}

// Variant for inline loading (not overlay)
export function InlineAuthenticationLoader({ 
  className,
  message = "Signing you in..."
}: Omit<AuthenticationLoadingCardProps, 'isVisible'>) {
  return (
    <div className={cn(
      "chrome-metallic-panel p-6 text-center max-w-sm mx-auto",
      className
    )}>
      <ThreeDEffectLoader className="mb-4" />
      <p className="text-bristol-stone text-sm font-medium">
        {message}
      </p>
      <div className="mt-3 flex justify-center space-x-2">
        <div className="w-2 h-2 bg-bristol-maroon rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-bristol-gold rounded-full animate-pulse animation-delay-200"></div>
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse animation-delay-400"></div>
      </div>
    </div>
  );
}