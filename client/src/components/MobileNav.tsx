import { useState } from 'react';
import { Link } from 'wouter';
import { Menu, X, Home, Map, BarChart3, Users, Settings } from 'lucide-react';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNav = () => setIsOpen(!isOpen);
  const closeNav = () => setIsOpen(false);

  // Lock body scroll when drawer is open
  if (typeof document !== 'undefined') {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleNav}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-bristol-dark text-gold hover:bg-bristol-dark/80 transition-colors"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <nav
        className={`
          md:hidden fixed top-0 left-0 h-full w-80 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            closeNav();
          }
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-bristol-dark text-gold">
            <h2 className="text-xl font-serif font-bold">Bristol Intelligence</h2>
            <button
              onClick={closeNav}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              aria-label="Close navigation menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 py-6">
            <div className="space-y-2 px-6">
              <NavLink
                href="/"
                icon={<Home size={20} />}
                label="Dashboard"
                onClick={closeNav}
              />
              <NavLink
                href="/sites"
                icon={<Map size={20} />}
                label="Sites"
                onClick={closeNav}
              />
              <NavLink
                href="/analytics"
                icon={<BarChart3 size={20} />}
                label="Analytics"
                onClick={closeNav}
              />
              <NavLink
                href="/comparables"
                icon={<Users size={20} />}
                label="Comparables"
                onClick={closeNav}
              />
              <NavLink
                href="/chat"
                icon={<Settings size={20} />}
                label="Bristol AI Chat"
                onClick={closeNav}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600 text-center">
              Bristol Development Group
            </p>
          </div>
        </div>
      </nav>
    </>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function NavLink({ href, icon, label, onClick }: NavLinkProps) {
  return (
    <Link href={href}>
      <button
        onClick={onClick}
        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-bristol-dark">{icon}</span>
        <span className="font-medium text-gray-900">{label}</span>
      </button>
    </Link>
  );
}