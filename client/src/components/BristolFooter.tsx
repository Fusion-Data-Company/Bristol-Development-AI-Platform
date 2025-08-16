import React from 'react';
import { Building2, MapPin, Phone, Mail, Globe, Cpu, BarChart3, Shield } from 'lucide-react';

interface BristolFooterProps {
  className?: string;
  variant?: 'standard' | 'thick' | 'enterprise';
}

export function BristolFooter({ className = '' }: BristolFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 text-white ${className}`} style={{
        margin: '0 !important',
        padding: '0 !important',
        minHeight: 'auto !important',
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
          repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px)
        `
      }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{paddingTop: '4px !important', paddingBottom: '4px !important', margin: '0 !important'}}>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{gap: '8px !important', marginBottom: '4px !important'}}>
          
          {/* Company Info */}
          <div className="space-y-1" style={{margin: '0 !important', padding: '0 !important'}}>
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-cyan-400" />
              <h3 className="text-lg font-bold text-cyan-400 font-serif">
                Bristol Development
              </h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed font-serif">
              Elite real estate intelligence platform delivering institutional-grade site analytics 
              and AI-powered market intelligence for strategic development decisions.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <MapPin className="h-4 w-4 text-cyan-400" />
              <span className="font-serif">Enterprise Headquarters</span>
            </div>
          </div>

          {/* Platform Features */}
          <div className="space-y-1" style={{margin: '0 !important', padding: '0 !important'}}>
            <h3 className="text-lg font-semibold text-cyan-400 font-serif">
              Platform Intelligence
            </h3>
            <ul className="space-y-0 text-sm text-gray-300" style={{margin: '0 !important', padding: '0 !important'}}>
              <li className="flex items-center space-x-2" style={{margin: '0 !important', padding: '0 !important'}}>
                <Cpu className="h-3 w-3 text-cyan-400" />
                <span className="font-serif">Bristol A.I. Elite v5.0</span>
              </li>
              <li className="flex items-center space-x-2" style={{margin: '0 !important', padding: '0 !important'}}>
                <BarChart3 className="h-3 w-3 text-cyan-400" />
                <span className="font-serif">Real-Time Analytics</span>
              </li>
              <li className="flex items-center space-x-2" style={{margin: '0 !important', padding: '0 !important'}}>
                <MapPin className="h-3 w-3 text-cyan-400" />
                <span className="font-serif">Interactive Mapping</span>
              </li>
              <li className="flex items-center space-x-2" style={{margin: '0 !important', padding: '0 !important'}}>
                <Shield className="h-3 w-3 text-cyan-400" />
                <span className="font-serif">Enterprise Security</span>
              </li>
            </ul>
          </div>

          {/* Technology Stack */}
          <div className="space-y-1" style={{margin: '0 !important', padding: '0 !important'}}>
            <h3 className="text-lg font-semibold text-cyan-400 font-serif">
              Technology
            </h3>
            <ul className="space-y-0 text-sm text-gray-300" style={{margin: '0 !important', padding: '0 !important'}}>
              <li className="font-serif" style={{margin: '0 !important', padding: '0 !important'}}>Advanced AI Processing</li>
              <li className="font-serif" style={{margin: '0 !important', padding: '0 !important'}}>Multi-Agent Architecture</li>
              <li className="font-serif" style={{margin: '0 !important', padding: '0 !important'}}>Real-Time Data Streams</li>
              <li className="font-serif" style={{margin: '0 !important', padding: '0 !important'}}>Enterprise APIs</li>
              <li className="font-serif" style={{margin: '0 !important', padding: '0 !important'}}>Predictive Analytics</li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-1" style={{margin: '0 !important', padding: '0 !important'}}>
            <h3 className="text-lg font-semibold text-cyan-400 font-serif">
              Enterprise Support
            </h3>
            <div className="space-y-0 text-sm text-gray-300" style={{margin: '0 !important', padding: '0 !important'}}>
              <div className="flex items-center space-x-2" style={{margin: '0 !important', padding: '0 !important'}}>
                <Mail className="h-4 w-4 text-cyan-400" />
                <span className="font-serif">elite@bristol.dev</span>
              </div>
              <div className="flex items-center space-x-2" style={{margin: '0 !important', padding: '0 !important'}}>
                <Phone className="h-4 w-4 text-cyan-400" />
                <span className="font-serif">Enterprise Hotline</span>
              </div>
              <div className="flex items-center space-x-2" style={{margin: '0 !important', padding: '0 !important'}}>
                <Globe className="h-4 w-4 text-cyan-400" />
                <span className="font-serif">24/7 AI Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-cyan-400/20" style={{paddingTop: '4px !important', margin: '0 !important'}}>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-0" style={{margin: '0 !important', padding: '0 !important'}}>
            
            {/* Copyright */}
            <div className="text-sm text-gray-400">
              <p className="font-serif">© {currentYear} Bristol Development Group. All rights reserved.</p>
              <p className="text-xs font-serif" style={{margin: '0 !important', padding: '0 !important'}}>
                Powered by Bristol A.I. Elite v5.0 • Enterprise Intelligence Platform
              </p>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center space-x-6 text-xs text-gray-400" style={{margin: '0 !important', padding: '0 !important'}}>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="font-serif">System Online</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="font-serif">AI Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="font-serif">MCP Connected</span>
              </div>
            </div>

            {/* Legal Links */}
            <div className="flex space-x-4 text-xs text-gray-400" style={{margin: '0 !important', padding: '0 !important'}}>
              <button className="hover:text-cyan-400 transition-colors font-serif">Privacy</button>
              <button className="hover:text-cyan-400 transition-colors font-serif">Terms</button>
              <button className="hover:text-cyan-400 transition-colors font-serif">Security</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}