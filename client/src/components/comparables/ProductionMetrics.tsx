import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Database,
  Clock,
  Zap,
  Shield
} from 'lucide-react';

interface ProductionMetricsProps {
  totalRecords: number;
  lastUpdated?: string;
  dataQuality?: number;
  systemHealth?: 'excellent' | 'good' | 'warning' | 'error';
}

export default function ProductionMetrics({ 
  totalRecords, 
  lastUpdated, 
  dataQuality = 95,
  systemHealth = 'excellent'
}: ProductionMetricsProps) {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': 
      case 'good': 
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default: 
        return <Database className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Records */}
      <Card className="bg-gradient-to-br from-bristol-maroon/5 to-bristol-gold/5 border-bristol-maroon/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-bristol-stone">Total Records</p>
              <p className="text-2xl font-bold text-bristol-maroon">
                {totalRecords.toLocaleString()}
              </p>
            </div>
            <Database className="h-8 w-8 text-bristol-maroon/60" />
          </div>
        </CardContent>
      </Card>

      {/* Data Quality */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Quality</p>
              <p className="text-2xl font-bold text-green-700">
                {dataQuality}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <Badge className={`mt-1 ${getHealthColor(systemHealth)}`}>
                <span className="flex items-center gap-1">
                  {getHealthIcon(systemHealth)}
                  {systemHealth.charAt(0).toUpperCase() + systemHealth.slice(1)}
                </span>
              </Badge>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-sm font-semibold text-purple-700">
                {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Real-time'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}