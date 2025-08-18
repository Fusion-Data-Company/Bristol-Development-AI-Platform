import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { X, Menu, Home, MessageSquare, Building, BarChart3, Zap, Settings } from 'lucide-react';

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { 
      document.body.style.overflow = ''; 
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { 
      if (e.key === 'Escape') setOpen(false); 
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setOpen(false);
  }, [location]);

  // Focus trap - move focus to panel when opened
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  const navigationItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    { path: '/sites', label: 'Properties', icon: Building },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/enterprise', label: 'Enterprise', icon: Zap },
    { path: '/tools', label: 'Tools', icon: Settings },
    { path: '/competitor-watch', label: 'Competitors', icon: BarChart3 },
  ];

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button 
        aria-label="Open navigation menu" 
        onClick={() => setOpen(true)}
        className="p-2 text-white hover:text-yellow-400 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Menu Overlay */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="fixed inset-0 z-50"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Menu Panel */}
          <div
            className="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white dark:bg-gray-900 shadow-2xl focus:outline-none border-r border-gray-200 dark:border-gray-700"
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-900 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-400 rounded-md flex items-center justify-center">
                    <Building className="w-5 h-5 text-gray-900" />
                  </div>
                  <span className="font-semibold text-lg">Bristol</span>
                </div>
                <button 
                  aria-label="Close navigation menu" 
                  onClick={() => setOpen(false)}
                  className="p-1 text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="px-4 py-6 space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = location === item.path;
                
                return (
                  <Link key={item.path} to={item.path}>
                    <div className={`
                      flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors cursor-pointer
                      ${isActive 
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-400 font-medium' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}>
                      <IconComponent size={20} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Bristol Development Group
                <br />
                Elite Intelligence Platform
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}