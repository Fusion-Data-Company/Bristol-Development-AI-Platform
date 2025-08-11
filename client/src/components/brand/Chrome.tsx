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
                <a className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Map
                </a>
              </Link>
              <Link href="/sites">
                <a className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Tables
                </a>
              </Link>
              <Link href="/sandbox">
                <a className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  3D Sandbox
                </a>
              </Link>
              <Link href="/integrations">
                <a className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Integrations
                </a>
              </Link>
              <Link href="/tools">
                <a className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                  Tools
                </a>
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