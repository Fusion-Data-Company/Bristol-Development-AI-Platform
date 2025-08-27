import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';

interface ChromeProps {
  children: ReactNode;
}

export default function Chrome({ children }: ChromeProps) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Company Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/brand-logo.gif" 
                alt="Company" 
                className="h-8 w-auto"
                onError={(e) => {
                  // Fallback if logo doesn't exist
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h1 className="ml-3 text-xl font-serif font-bold text-gray-900" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>
                Company Site Intelligence
              </h1>
            </div>

            {/* Navigation */}
            <nav className="flex space-x-8">
              <Link href="/">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer rounded transition-colors ${
                  isActive('/') ? 'bg-brand-maroon text-white' : 'text-gray-700 hover:text-gray-900'
                }`}>
                  Map
                </span>
              </Link>
              <Link href="/sites">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer rounded transition-colors ${
                  isActive('/sites') ? 'bg-brand-maroon text-white' : 'text-gray-700 hover:text-gray-900'
                }`}>
                  Tables
                </span>
              </Link>
              <Link href="/sandbox">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer rounded transition-colors ${
                  isActive('/sandbox') ? 'bg-brand-maroon text-white' : 'text-gray-700 hover:text-gray-900'
                }`}>
                  3D Sandbox
                </span>
              </Link>
              <Link href="/integrations">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer rounded transition-colors ${
                  isActive('/integrations') ? 'bg-brand-maroon text-white' : 'text-gray-700 hover:text-gray-900'
                }`}>
                  Integrations
                </span>
              </Link>
              <Link href="/tools">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer rounded transition-colors ${
                  isActive('/tools') ? 'bg-brand-maroon text-white' : 'text-gray-700 hover:text-gray-900'
                }`}>
                  Tools
                </span>
              </Link>
              <Link href="/comparables">
                <span className={`px-3 py-2 text-sm font-medium cursor-pointer rounded transition-colors ${
                  isActive('/comparables') ? 'bg-brand-maroon text-white' : 'text-gray-700 hover:text-gray-900'
                }`}>
                  Comparables
                </span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}