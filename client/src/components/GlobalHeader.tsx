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

export function GlobalHeader() {
  const [location] = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 backdrop-blur-xl">
      {/* Background texture effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-cyan-600/5" />
      <div className="absolute inset-0" style={{
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.08) 0%, transparent 50%)
        `
      }} />
      
      <div className="relative container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Brand */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg blur-sm" />
                <div className="relative bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">
                  bristol
                </h1>
                <p className="text-xs text-blue-400 uppercase tracking-widest font-medium">
                  Site Intelligence Platform
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location === '/' 
                    ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}>
                  <Map className="h-4 w-4" />
                  <span className="text-sm font-medium">Map</span>
                </a>
              </Link>
              
              <Link href="/sites">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location === '/sites' 
                    ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}>
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">Sites</span>
                </a>
              </Link>
              
              <Link href="/analytics">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location === '/analytics' 
                    ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}>
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">Analytics</span>
                </a>
              </Link>
              
              <Link href="/demographics">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location === '/demographics' 
                    ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}>
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Demographics</span>
                </a>
              </Link>
              
              <Link href="/comparables">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location === '/comparables' 
                    ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}>
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-sm font-medium">Comparables</span>
                </a>
              </Link>
              
              <Link href="/chat">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location === '/chat' 
                    ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}>
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Chat</span>
                </a>
              </Link>
              
              <Link href="/integrations">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location === '/integrations' 
                    ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}>
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Integrations</span>
                </a>
              </Link>
              
              <Link href="/tools">
                <a className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location === '/tools' 
                    ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}>
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">Tools</span>
                </a>
              </Link>
            </nav>
          </div>

          {/* Right side - Search, Notifications, User */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-slate-800/50 border border-slate-600/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:bg-slate-700/50 transition-all duration-200 w-64"
                />
              </div>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 transition-all duration-200 cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-white hidden md:block">Admin</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}