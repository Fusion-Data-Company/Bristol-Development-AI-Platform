import React from 'react';
import { Building2, MapPin, Phone, Mail, Globe, Cpu, BarChart3, Shield } from 'lucide-react';

interface CompanyFooterProps {
  className?: string;
  variant?: 'standard' | 'thick' | 'enterprise';
}

export function CompanyFooter({ className = '', variant = 'thick' }: CompanyFooterProps) {
  const currentYear = new Date().getFullYear();
  
  const getFooterHeight = () => {
    switch (variant) {
      case 'thick':
        return 'min-h-[800px] py-48';
      case 'enterprise':
        return 'min-h-[1000px] py-64';
      default:
        return 'min-h-[480px] py-32';
    }
  };

  return (
    <footer className={`bg-gradient-to-r from-brand-maroon via-brand-maroon to-brand-dark text-white ${getFooterHeight()} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-between">
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-brand-gold" />
              <h3 className="text-lg font-bold text-brand-gold font-cinzel">
                Real Estate Intelligence
              </h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Elite real estate intelligence platform delivering institutional-grade site analytics 
              and AI-powered market intelligence for strategic development decisions.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <MapPin className="h-4 w-4 text-brand-gold" />
              <span>Enterprise Headquarters</span>
            </div>
          </div>

          {/* Platform Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-gold font-cinzel">
              Platform Intelligence
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center space-x-2">
                <Cpu className="h-3 w-3 text-brand-gold" />
                <span>Bristol A.I. Elite v5.0</span>
              </li>
              <li className="flex items-center space-x-2">
                <BarChart3 className="h-3 w-3 text-brand-gold" />
                <span>Real-Time Analytics</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-3 w-3 text-brand-gold" />
                <span>Interactive Mapping</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield className="h-3 w-3 text-brand-gold" />
                <span>Enterprise Security</span>
              </li>
            </ul>
          </div>

          {/* Technology Stack */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-gold font-cinzel">
              Technology
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Advanced AI Processing</li>
              <li>Multi-Agent Architecture</li>
              <li>Real-Time Data Streams</li>
              <li>Enterprise APIs</li>
              <li>Predictive Analytics</li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-gold font-cinzel">
              Enterprise Support
            </h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-brand-gold" />
                <span>elite@bristol.dev</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-brand-gold" />
                <span>Enterprise Hotline</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-brand-gold" />
                <span>24/7 AI Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-brand-gold/20 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            
            {/* Copyright */}
            <div className="text-sm text-gray-400">
              <p>© {currentYear} Real Estate Intelligence Group. All rights reserved.</p>
              <p className="text-xs mt-1">
                Powered by Bristol A.I. Elite v5.0 • Enterprise Intelligence Platform
              </p>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center space-x-6 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>AI Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>MCP Connected</span>
              </div>
            </div>

            {/* Legal Links */}
            <div className="flex space-x-4 text-xs text-gray-400">
              <button className="hover:text-brand-gold transition-colors">Privacy</button>
              <button className="hover:text-brand-gold transition-colors">Terms</button>
              <button className="hover:text-brand-gold transition-colors">Security</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}