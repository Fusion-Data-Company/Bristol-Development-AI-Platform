import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ParallaxBackgroundProps {
  images: string[];
  className?: string;
  speed?: number;
  opacity?: number;
}

export function ParallaxBackground({ 
  images, 
  className, 
  speed = 0.5, 
  opacity = 0.2 
}: ParallaxBackgroundProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollY = () => {
      setScrollY(window.pageYOffset);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollY);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={cn("fixed inset-0 z-0", className)}>
      {images.map((image, index) => (
        <div
          key={index}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-75"
          style={{
            backgroundImage: `url(${image})`,
            transform: `translateY(${scrollY * speed * (index + 1)}px)`,
            opacity: opacity / (index + 1),
            zIndex: -index - 1,
          }}
        />
      ))}
      
      {/* Gradient overlay for better text readability */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-bristol-fog/50 to-bristol-fog"
        style={{ opacity: 0.8 }}
      />
    </div>
  );
}
