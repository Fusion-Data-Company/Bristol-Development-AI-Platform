import React from 'react';

interface BackgroundProps {
  variant?: 'primary' | 'secondary' | 'accent';
  intensity?: 'subtle' | 'medium' | 'strong';
  animated?: boolean;
}

export const EnterpriseBackground: React.FC<BackgroundProps> = ({
  variant = 'primary',
  intensity = 'medium',
  animated = true,
}) => {
  const getBackgroundClasses = () => {
    const base = "absolute inset-0 pointer-events-none";
    
    const gradients = {
      primary: "bg-gradient-to-br from-gray-900 via-slate-900 to-black",
      secondary: "bg-gradient-to-br from-slate-800 via-gray-800 to-gray-900", 
      accent: "bg-gradient-to-br from-bristol-maroon/10 via-black to-bristol-cyan/5"
    };

    const overlays = {
      subtle: "opacity-20",
      medium: "opacity-30", 
      strong: "opacity-40"
    };

    return `${base} ${gradients[variant]} ${overlays[intensity]}`;
  };

  const getPatternClasses = () => {
    const patterns = {
      primary: "bg-[radial-gradient(circle_at_25%_25%,rgba(255,215,0,0.08)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(0,206,209,0.08)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(136,0,32,0.04)_0%,transparent_50%)]",
      secondary: "bg-[radial-gradient(circle_at_30%_40%,rgba(0,206,209,0.06)_0%,transparent_50%),radial-gradient(circle_at_70%_60%,rgba(255,215,0,0.06)_0%,transparent_50%)]",
      accent: "bg-[radial-gradient(circle_at_20%_80%,rgba(136,0,32,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(255,215,0,0.08)_0%,transparent_50%)]"
    };

    return patterns[variant];
  };

  return (
    <>
      {/* Base gradient background */}
      <div className={getBackgroundClasses()}>
        <div className={`absolute inset-0 ${getPatternClasses()}`}>
          {/* Animated grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.015)_25%,rgba(255,255,255,0.015)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.015)_75%)] bg-[length:40px_40px]">
            {animated && (
              <div 
                className="absolute inset-0 animate-pulse"
                style={{
                  animation: 'float 20s ease-in-out infinite',
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating orbs for ambiance */}
      {animated && (
        <>
          <div className="absolute top-20 left-10 w-32 h-32 bg-bristol-gold/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-bristol-cyan/5 rounded-full blur-2xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-bristol-maroon/3 rounded-full blur-3xl animate-pulse delay-2000" />
        </>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-30px) rotate(1deg); }
          66% { transform: translateY(15px) rotate(-1deg); }
        }
      `}</style>
    </>
  );
};

export const PageBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <EnterpriseBackground variant="primary" intensity="medium" animated />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};