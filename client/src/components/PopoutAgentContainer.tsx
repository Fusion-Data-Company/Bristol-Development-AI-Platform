import { useEffect, useState } from 'react';
import { PopoutAgent } from './PopoutAgent';

export function PopoutAgentContainer() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Hard guard: never show on mobile/tablet
  if (isMobile) {
    return null;
  }

  return (
    <div className="PopoutAgentContainer">
      <PopoutAgent />
    </div>
  );
}