import { useEffect, useRef, useState } from 'react';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // open only on mobile screens
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // trap focus + scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!isMobile) return null;

  return (
    <div className="MobileNavRoot">
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        style={{ height: 44, minWidth: 44 }}
      >☰</button>

      {open && (
        <>
          <div className="mobile-nav-overlay" onClick={() => setOpen(false)} />
          <div
            className="mobile-nav-panel"
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px' }}>
              <strong>Menu</strong>
              <button aria-label="Close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <nav style={{ display:'grid', gap: 8, padding: '8px 16px 16px' }}>
              {/* Update links to match your app's routes */}
              <a href="/" onClick={()=>setOpen(false)}>Home</a>
              <a href="/map" onClick={()=>setOpen(false)}>Map</a>
              <a href="/data" onClick={()=>setOpen(false)}>Data</a>
              <a href="/analytics" onClick={()=>setOpen(false)}>Analytics</a>
              <a href="/intel" onClick={()=>setOpen(false)}>Intel</a>
              <a href="/chat" onClick={()=>setOpen(false)}>Chat</a>
              <a href="/dashboard" onClick={()=>setOpen(false)}>Dashboard</a>
              <a href="/api" onClick={()=>setOpen(false)}>API</a>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}