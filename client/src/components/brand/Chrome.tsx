import { ReactNode } from 'react';
import { Link } from 'wouter';

interface ChromeProps {
  children: ReactNode;
}

export default function Chrome({ children }: ChromeProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Bristol Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/bristol-logo.gif" 
                alt="Bristol" 
                className="h-8 w-auto"
                onError={(e) => {
                  // Fallback if logo doesn't exist
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h1 className="ml-3 text-xl font-serif font-bold text-gray-900" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>
                Bristol Site Intelligence
              </h1>
            </div>

            {/* Navigation */}
            <nav className="flex space-x-8">
              <Link href="/">
                <span className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium cursor-pointer">
                  Map
                </span>
              </Link>
              <Link href="/sites">
                <span className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium cursor-pointer">
                  Tables
                </span>
              </Link>
              <Link href="/sandbox">
                <span className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium cursor-pointer">
                  3D Sandbox
                </span>
              </Link>
              <Link href="/integrations">
                <span className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium cursor-pointer">
                  Integrations
                </span>
              </Link>
              <Link href="/tools">
                <span className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium cursor-pointer">
                  Tools
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