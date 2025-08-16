import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Map, 
  BarChart3, 
  Users, 
  MessageCircle, 
  Settings,
  Brain,
  Search,
  Bell,
  User,
  ChevronDown
} from 'lucide-react';

interface GlobalHeaderProps {
  showNavigation?: boolean;
}

export function GlobalHeader({ showNavigation = true }: GlobalHeaderProps) {
  const [location] = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 border-b border-cyan-400/30 backdrop-blur-xl">
      {/* Grey Stucco Texture with Cyan Highlights */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-gray-500/20 to-cyan-400/10" />
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
          repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px)
        `
      }} />
      
      <div className="relative container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Brand */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-500/20 to-cyan-500/20 rounded-lg blur-sm" />
                <div className="relative bg-gradient-to-r from-gray-600 to-cyan-600 p-2 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide font-serif">
                  bristol
                </h1>
                <p className="text-xs text-cyan-400 uppercase tracking-widest font-medium font-serif">
                  Site Intelligence Platform
                </p>
              </div>
            </div>

            {/* Navigation - only show if showNavigation is true */}
            {showNavigation && (
              <nav className="hidden md:flex items-center space-x-1">
              <Link href="/">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-serif ${
                  location === '/' 
                    ? 'bg-cyan-600/20 text-cyan-400 shadow-lg shadow-cyan-500/20' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}>
                  <Map className="h-4 w-4" />
                  <span className="text-sm font-medium">Map</span>
                </a>
              </Link>
              
              <Link href="/sites">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-serif ${
                  location === '/sites' 
                    ? 'bg-cyan-600/20 text-cyan-400 shadow-lg shadow-cyan-500/20' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}>
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">Database</span>
                </a>
              </Link>
              
              <Link href="/analytics">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-serif ${
                  location === '/analytics' 
                    ? 'bg-cyan-600/20 text-cyan-400 shadow-lg shadow-cyan-500/20' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}>
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">Analytics</span>
                </a>
              </Link>
              
              <Link href="/enterprise">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-serif ${
                  location === '/enterprise' 
                    ? 'bg-cyan-600/20 text-cyan-400 shadow-lg shadow-cyan-500/20' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}>
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Enterprise</span>
                </a>
              </Link>
              
              <Link href="/demographics">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-serif ${
                  location === '/demographics' 
                    ? 'bg-cyan-600/20 text-cyan-400 shadow-lg shadow-cyan-500/20' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}>
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Demographics</span>
                </a>
              </Link>
              
              <Link href="/comparables">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-serif ${
                  location === '/comparables' 
                    ? 'bg-cyan-600/20 text-cyan-400 shadow-lg shadow-cyan-500/20' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}>
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">Comparables</span>
                </a>
              </Link>
              
              <Link href="/agents">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-serif ${
                  location === '/agents' || location === '/enhanced-agents'
                    ? 'bg-cyan-600/20 text-cyan-400 shadow-lg shadow-cyan-500/20' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}>
                  <Brain className="h-4 w-4" />
                  <span className="text-sm font-medium">Agents</span>
                </a>
              </Link>
              
              <Link href="/chat">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-serif ${
                  location === '/chat' 
                    ? 'bg-cyan-600/20 text-cyan-400 shadow-lg shadow-cyan-500/20' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}>
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Chat</span>
                </a>
              </Link>
              
              <Link href="/integrations">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-serif ${
                  location === '/integrations' 
                    ? 'bg-cyan-600/20 text-cyan-400 shadow-lg shadow-cyan-500/20' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}>
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Integrations</span>
                </a>
              </Link>
              
              <Link href="/tools">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-serif ${
                  location === '/tools' 
                    ? 'bg-cyan-600/20 text-cyan-400 shadow-lg shadow-cyan-500/20' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-600/50'
                }`}>
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Tools</span>
                </a>
              </Link>
            </nav>
            )}
          </div>

          {/* Right side - Search, Notifications, User - only show if showNavigation is true */}
          {showNavigation && (
            <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-gray-700/50 border border-gray-500/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:bg-gray-600/50 transition-all duration-200 w-64 font-serif"
                />
              </div>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-600/50 rounded-lg transition-all duration-200">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-cyan-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-700/50 rounded-lg border border-gray-500/50 hover:bg-gray-600/50 transition-all duration-200 cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-cyan-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-white hidden md:block font-serif">Admin</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          )}
        </div>
      </div>
    </header>
  );
}