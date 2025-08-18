import { useEffect, useState } from 'react';
import BristolFloatingWidget from './BristolFloatingWidget';

export default function PopoutAgent(props: any) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check(); 
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Hard block on mobile devices
  if (isMobile) return null;

  return (
    <div className="PopoutAgentContainer bristol-floating-widget">
      <BristolFloatingWidget {...props} />
    </div>
  );
}