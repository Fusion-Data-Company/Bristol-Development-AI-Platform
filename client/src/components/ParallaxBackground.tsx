import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ParallaxBackgroundProps {
  className?: string;
  speed?: number;
  children?: React.ReactNode;
}

export function ParallaxBackground({ 
  className, 
  speed = 0.5, 
  children 
}: ParallaxBackgroundProps) {
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!backgroundRef.current) return;
      
      const scrolled = window.pageYOffset;
      const parallax = scrolled * speed;
      
      backgroundRef.current.style.transform = `translateY(${parallax}px)`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Parallax Background */}
      <div
        ref={backgroundRef}
        className="absolute inset-0 w-full h-[120%] bg-gradient-to-br from-bristol-maroon/5 via-bristol-sky/10 to-bristol-gold/5"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(139, 21, 56, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(3, 105, 161, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 178, 0, 0.05) 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Property Images Background */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url('/assets/property-bg-1.jpg'), url('/assets/property-bg-2.jpg')`,
          backgroundSize: 'cover, cover',
          backgroundPosition: 'center top, center bottom',
          backgroundRepeat: 'no-repeat, no-repeat',
          filter: 'blur(2px) brightness(0.3)',
        }}
      />
      
      {/* Animated Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-bristol-maroon/5 rounded-full animate-float" />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-bristol-gold/10 rounded-lg rotate-45 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-3/4 w-20 h-20 bg-bristol-sky/8 rounded-full animate-float" style={{ animationDelay: '4s' }} />
        
        {/* Bristol Development Pattern */}
        <div className="absolute top-0 left-0 w-full h-full">
          <svg className="w-full h-full opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="bristol-grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-bristol-maroon"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bristol-grid)" />
          </svg>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Enhanced parallax section for hero areas
export function ParallaxHero({ 
  className, 
  children,
  backgroundImage,
  height = 'h-screen'
}: ParallaxBackgroundProps & { 
  backgroundImage?: string;
  height?: string;
}) {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.3;
      
      heroRef.current.style.transform = `translateY(${rate}px)`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={cn("relative overflow-hidden", height, className)}>
      {/* Hero Background */}
      <div
        ref={heroRef}
        className="absolute inset-0 w-full h-[120%]"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-bristol-ink/80 via-bristol-maroon/60 to-bristol-ink/90" />
        
        {/* Luxury property aesthetic overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center text-center text-white">
        {children}
      </div>
    </div>
  );
}