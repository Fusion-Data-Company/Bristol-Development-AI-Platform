import React from 'react';
import { Building2, MapPin, Phone, Mail, Globe, Cpu, BarChart3, Shield } from 'lucide-react';

interface BristolFooterProps {
  className?: string;
  variant?: 'standard' | 'thick' | 'enterprise';
}

export function BristolFooter({ className = '', variant = 'thick' }: BristolFooterProps) {
  const currentYear = new Date().getFullYear();
  
  const getFooterHeight = () => {
    // Force minimal height with no padding
    return 'h-auto py-0';
  };

  return (
    <footer className={`bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 text-white ${getFooterHeight()} ${className}`} style={{
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
          repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px)
        `
      }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-2">
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          
          {/* Company Info */}
          <div className="space-y-4">
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400 font-serif">
              Platform Intelligence
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center space-x-2">
                <Cpu className="h-3 w-3 text-cyan-400" />
                <span className="font-serif">Bristol A.I. Elite v5.0</span>
              </li>
              <li className="flex items-center space-x-2">
                <BarChart3 className="h-3 w-3 text-cyan-400" />
                <span className="font-serif">Real-Time Analytics</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-3 w-3 text-cyan-400" />
                <span className="font-serif">Interactive Mapping</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield className="h-3 w-3 text-cyan-400" />
                <span className="font-serif">Enterprise Security</span>
              </li>
            </ul>
          </div>

          {/* Technology Stack */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400 font-serif">
              Technology
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="font-serif">Advanced AI Processing</li>
              <li className="font-serif">Multi-Agent Architecture</li>
              <li className="font-serif">Real-Time Data Streams</li>
              <li className="font-serif">Enterprise APIs</li>
              <li className="font-serif">Predictive Analytics</li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400 font-serif">
              Enterprise Support
            </h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-cyan-400" />
                <span className="font-serif">elite@bristol.dev</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-cyan-400" />
                <span className="font-serif">Enterprise Hotline</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-cyan-400" />
                <span className="font-serif">24/7 AI Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-cyan-400/20 pt-2">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright */}
            <div className="text-sm text-gray-400">
              <p className="font-serif">© {currentYear} Bristol Development Group. All rights reserved.</p>
              <p className="text-xs mt-1 font-serif">
                Powered by Bristol A.I. Elite v5.0 • Enterprise Intelligence Platform
              </p>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center space-x-6 text-xs text-gray-400">
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
            <div className="flex space-x-4 text-xs text-gray-400">
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