import React from 'react';
import luxuryInteriorBg from '@assets/thumbnail-2_1755400030789.jpg';

interface BackgroundProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'dashboard' | 'data' | 'tools';
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
    
    // Now using luxury interior image as base for all variants
    return `${base}`;
  };

  const getPatternClasses = () => {
    const patterns = {
      primary: "bg-[radial-gradient(circle_at_25%_25%,rgba(255,215,0,0.08)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(0,206,209,0.08)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(136,0,32,0.04)_0%,transparent_50%)]",
      secondary: "bg-[radial-gradient(circle_at_30%_40%,rgba(0,206,209,0.06)_0%,transparent_50%),radial-gradient(circle_at_70%_60%,rgba(255,215,0,0.06)_0%,transparent_50%)]",
      accent: "bg-[radial-gradient(circle_at_20%_80%,rgba(136,0,32,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(255,215,0,0.08)_0%,transparent_50%)]",
      dashboard: "bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.08)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(255,215,0,0.06)_0%,transparent_50%)]",
      data: "bg-[radial-gradient(circle_at_30%_70%,rgba(34,197,94,0.08)_0%,transparent_50%),radial-gradient(circle_at_70%_30%,rgba(0,206,209,0.06)_0%,transparent_50%)]",
      tools: "bg-[radial-gradient(circle_at_40%_60%,rgba(147,51,234,0.08)_0%,transparent_50%),radial-gradient(circle_at_60%_40%,rgba(255,215,0,0.06)_0%,transparent_50%)]"
    };

    return patterns[variant];
  };

  const getFloatingOrbs = () => {
    const orbConfigs = {
      primary: [
        { size: "w-32 h-32", color: "bg-brand-gold/5", position: "top-20 left-10", blur: "blur-3xl" },
        { size: "w-24 h-24", color: "bg-brand-cyan/5", position: "bottom-20 right-10", blur: "blur-2xl", delay: "delay-1000" },
        { size: "w-40 h-40", color: "bg-brand-maroon/3", position: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2", blur: "blur-3xl", delay: "delay-2000" }
      ],
      secondary: [
        { size: "w-28 h-28", color: "bg-blue-500/5", position: "top-32 right-20", blur: "blur-3xl" },
        { size: "w-36 h-36", color: "bg-cyan-500/4", position: "bottom-32 left-20", blur: "blur-2xl", delay: "delay-1500" }
      ],
      accent: [
        { size: "w-44 h-44", color: "bg-brand-maroon/6", position: "top-40 left-1/4", blur: "blur-3xl" },
        { size: "w-32 h-32", color: "bg-brand-gold/8", position: "bottom-40 right-1/4", blur: "blur-2xl", delay: "delay-2000" }
      ],
      dashboard: [
        { size: "w-48 h-48", color: "bg-blue-500/4", position: "top-20 left-20", blur: "blur-3xl" },
        { size: "w-36 h-36", color: "bg-brand-gold/5", position: "bottom-20 right-20", blur: "blur-2xl", delay: "delay-1000" },
        { size: "w-28 h-28", color: "bg-cyan-500/4", position: "top-1/3 right-1/3", blur: "blur-xl", delay: "delay-2500" }
      ],
      data: [
        { size: "w-40 h-40", color: "bg-emerald-500/5", position: "top-24 right-24", blur: "blur-3xl" },
        { size: "w-32 h-32", color: "bg-brand-cyan/5", position: "bottom-24 left-24", blur: "blur-2xl", delay: "delay-1500" }
      ],
      tools: [
        { size: "w-44 h-44", color: "bg-purple-500/5", position: "top-16 left-16", blur: "blur-3xl" },
        { size: "w-36 h-36", color: "bg-brand-gold/5", position: "bottom-16 right-16", blur: "blur-2xl", delay: "delay-1000" },
        { size: "w-28 h-28", color: "bg-pink-500/4", position: "top-2/3 left-2/3", blur: "blur-xl", delay: "delay-2000" }
      ]
    };

    return orbConfigs[variant] || orbConfigs.primary;
  };

  return (
    <>
      {/* Luxury interior background image */}
      <div className={getBackgroundClasses()}>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${luxuryInteriorBg})`,
            filter: 'brightness(0.8) contrast(1.1) saturate(0.9)',
          }}
        />
        
        {/* Professional overlay for crystal clarity */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-transparent to-slate-800/20" />
        
        <div className={`absolute inset-0 ${getPatternClasses()}`}>
          {/* Animated grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.005)_25%,rgba(255,255,255,0.005)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.005)_75%)] bg-[length:60px_60px]">
            {animated && (
              <div 
                className="absolute inset-0 animate-pulse"
                style={{
                  animation: 'enterpriseFloat 25s ease-in-out infinite',
                }}
              />
            )}
          </div>
          
          {/* Subtle mesh pattern for enterprise sophistication */}
          <div className="absolute inset-0 opacity-8">
            <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="mesh" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,215,0,0.2)" strokeWidth="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mesh)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dynamic floating orbs */}
      {animated && (
        <>
          {getFloatingOrbs().map((orb, index) => (
            <div 
              key={index}
              className={`absolute ${orb.size} ${orb.color} ${orb.position} ${orb.blur} rounded-full animate-pulse ${orb.delay || ''}`}
              style={{
                animation: `enterprisePulse ${6 + index * 2}s ease-in-out infinite`,
                animationDelay: `${index * 0.5}s`
              }}
            />
          ))}
        </>
      )}

      <style>{`
        @keyframes enterpriseFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          33% { transform: translateY(-40px) rotate(1deg) scale(1.02); }
          66% { transform: translateY(20px) rotate(-1deg) scale(0.98); }
        }
        
        @keyframes enterprisePulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </>
  );
};

// Specialized backgrounds for different page types
export const ChatBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative min-h-screen overflow-x-hidden">
    <EnterpriseBackground variant="primary" intensity="medium" animated />
    <div className="relative z-10">{children}</div>
  </div>
);

export const DashboardBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative min-h-screen overflow-x-hidden">
    <EnterpriseBackground variant="dashboard" intensity="medium" animated />
    <div className="relative z-10">{children}</div>
  </div>
);

export const DataBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative min-h-screen overflow-x-hidden">
    <EnterpriseBackground variant="data" intensity="medium" animated />
    <div className="relative z-10">{children}</div>
  </div>
);

export const ToolsBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative min-h-screen overflow-x-hidden">
    <EnterpriseBackground variant="tools" intensity="medium" animated />
    <div className="relative z-10">{children}</div>
  </div>
);

export const PageBackground: React.FC<{ children: React.ReactNode; variant?: string }> = ({ 
  children, 
  variant = 'primary' 
}) => {
  const BackgroundComponent = {
    chat: ChatBackground,
    dashboard: DashboardBackground,
    data: DataBackground,
    tools: ToolsBackground,
  }[variant] || ChatBackground;

  return <BackgroundComponent>{children}</BackgroundComponent>;
};