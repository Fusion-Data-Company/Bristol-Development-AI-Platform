import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DCFInput {
  propertyValue: number;
  downPayment: number;
  loanTerm: number;
  interestRate: number;
  currentRent: number;
  rentGrowth: number;
  expenses: number;
  exitCapRate: number;
  holdPeriod: number;
}

interface DCFResults {
  monthlyPayment: number;
  cashFlow: number[];
  netPresentValue: number;
  internalRateOfReturn: number;
  cashOnCashReturn: number;
  equityMultiple: number;
  profitabilityIndex: number;
}

export function FinancialModelingDashboard() {
  const [dcfInputs, setDCFInputs] = useState<DCFInput>({
    propertyValue: 2500000,
    downPayment: 25,
    loanTerm: 30,
    interestRate: 6.5,
    currentRent: 185000,
    rentGrowth: 4.2,
    expenses: 65000,
    exitCapRate: 5.75,
    holdPeriod: 7
  });

  const [results, setResults] = useState<DCFResults | null>(null);

  const calculateDCF = () => {
    const loanAmount = dcfInputs.propertyValue * (1 - dcfInputs.downPayment / 100);
    const monthlyRate = dcfInputs.interestRate / 100 / 12;
    const totalPayments = dcfInputs.loanTerm * 12;
    
    // Monthly payment calculation
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                          (Math.pow(1 + monthlyRate, totalPayments) - 1);

    // Annual cash flows
    const cashFlows = [];
    let currentRent = dcfInputs.currentRent;
    
    for (let year = 1; year <= dcfInputs.holdPeriod; year++) {
      currentRent *= (1 + dcfInputs.rentGrowth / 100);
      const annualDebtService = monthlyPayment * 12;
      const netOperatingIncome = currentRent - dcfInputs.expenses;
      const cashFlow = netOperatingIncome - annualDebtService;
      cashFlows.push(cashFlow);
    }

    // Exit value calculation
    const finalYearNOI = currentRent - dcfInputs.expenses;
    const exitValue = finalYearNOI / (dcfInputs.exitCapRate / 100);
    
    // Remaining loan balance
    const paymentsRemaining = (dcfInputs.loanTerm - dcfInputs.holdPeriod) * 12;
    const remainingBalance = loanAmount * 
      (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, dcfInputs.holdPeriod * 12)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1);
    
    const netExitProceeds = exitValue - remainingBalance;
    cashFlows[cashFlows.length - 1] += netExitProceeds;

    // NPV calculation (10% discount rate)
    const discountRate = 0.10;
    let npv = -dcfInputs.propertyValue * (dcfInputs.downPayment / 100);
    
    cashFlows.forEach((cf, index) => {
      npv += cf / Math.pow(1 + discountRate, index + 1);
    });

    // IRR calculation (simplified Newton-Raphson method)
    let irr = 0.15; // Initial guess
    for (let i = 0; i < 20; i++) {
      let f = -dcfInputs.propertyValue * (dcfInputs.downPayment / 100);
      let df = 0;
      
      cashFlows.forEach((cf, index) => {
        const period = index + 1;
        f += cf / Math.pow(1 + irr, period);
        df -= cf * period / Math.pow(1 + irr, period + 1);
      });
      
      if (Math.abs(f) < 0.01) break;
      irr = irr - f / df;
    }

    // Other metrics
    const initialInvestment = dcfInputs.propertyValue * (dcfInputs.downPayment / 100);
    const firstYearCashFlow = cashFlows[0];
    const cashOnCashReturn = (firstYearCashFlow / initialInvestment) * 100;
    const totalCashReceived = cashFlows.reduce((sum, cf) => sum + cf, 0);
    const equityMultiple = totalCashReceived / initialInvestment;
    const profitabilityIndex = npv / initialInvestment;

    setResults({
      monthlyPayment,
      cashFlow: cashFlows,
      netPresentValue: npv,
      internalRateOfReturn: irr * 100,
      cashOnCashReturn,
      equityMultiple,
      profitabilityIndex
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: value > 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number, decimals = 1) => {
    return `${value.toFixed(decimals)}%`;
  };

  return (
    <div className="space-y-6">
      {/* DCF Header */}
      <Card className="bg-white border-brand-cyan/30 shadow-lg">
        <CardHeader>
          <CardTitle className="text-brand-cyan text-xl flex items-center gap-3">
            <Calculator className="h-6 w-6 text-brand-gold" />
            Elite Financial Modeling Suite
            <Badge className="bg-brand-maroon text-white border-brand-gold">
              <Zap className="h-3 w-3 mr-1" />
              Real-Time DCF
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <Card className="bg-white border-brand-cyan/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-brand-cyan flex items-center gap-3">
              <Building2 className="h-5 w-5 text-brand-gold" />
              Investment Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-brand-cyan mb-2 block">Property Value</label>
                <Input
                  type="number"
                  value={dcfInputs.propertyValue}
                  onChange={(e) => setDCFInputs({...dcfInputs, propertyValue: Number(e.target.value)})}
                  className="bg-white border-brand-cyan/30 text-brand-maroon"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-cyan mb-2 block">Down Payment (%)</label>
                <Input
                  type="number"
                  value={dcfInputs.downPayment}
                  onChange={(e) => setDCFInputs({...dcfInputs, downPayment: Number(e.target.value)})}
                  className="bg-white border-brand-cyan/30 text-brand-maroon"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-cyan mb-2 block">Interest Rate (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={dcfInputs.interestRate}
                  onChange={(e) => setDCFInputs({...dcfInputs, interestRate: Number(e.target.value)})}
                  className="bg-white border-brand-cyan/30 text-brand-maroon"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-cyan mb-2 block">Loan Term (years)</label>
                <Input
                  type="number"
                  value={dcfInputs.loanTerm}
                  onChange={(e) => setDCFInputs({...dcfInputs, loanTerm: Number(e.target.value)})}
                  className="bg-white border-brand-cyan/30 text-brand-maroon"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-cyan mb-2 block">Annual Rent</label>
                <Input
                  type="number"
                  value={dcfInputs.currentRent}
                  onChange={(e) => setDCFInputs({...dcfInputs, currentRent: Number(e.target.value)})}
                  className="bg-white border-brand-cyan/30 text-brand-maroon"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-cyan mb-2 block">Rent Growth (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={dcfInputs.rentGrowth}
                  onChange={(e) => setDCFInputs({...dcfInputs, rentGrowth: Number(e.target.value)})}
                  className="bg-white border-brand-cyan/30 text-brand-maroon"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-cyan mb-2 block">Annual Expenses</label>
                <Input
                  type="number"
                  value={dcfInputs.expenses}
                  onChange={(e) => setDCFInputs({...dcfInputs, expenses: Number(e.target.value)})}
                  className="bg-white border-brand-cyan/30 text-brand-maroon"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-cyan mb-2 block">Exit Cap Rate (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={dcfInputs.exitCapRate}
                  onChange={(e) => setDCFInputs({...dcfInputs, exitCapRate: Number(e.target.value)})}
                  className="bg-white border-brand-cyan/30 text-brand-maroon"
                />
              </div>
            </div>
            
            <Button 
              onClick={calculateDCF}
              className="w-full bg-gradient-to-r from-brand-maroon to-brand-cyan hover:from-brand-cyan hover:to-brand-gold"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculate DCF Analysis
            </Button>
          </CardContent>
        </Card>

        {/* Results Dashboard */}
        {results && (
          <Card className="bg-white border-brand-gold/30 shadow-lg">
            <CardHeader>
              <CardTitle className="text-brand-gold flex items-center gap-3">
                <Target className="h-5 w-5" />
                Investment Returns Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-100 rounded-xl border border-brand-cyan/20">
                  <div className="text-2xl font-bold text-brand-cyan mb-1">
                    {formatCurrency(results.netPresentValue)}
                  </div>
                  <div className="text-xs text-brand-stone">Net Present Value</div>
                  <div className="flex items-center justify-center mt-2">
                    {results.netPresentValue > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-400" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-brand-ink/60 rounded-xl border border-brand-gold/20">
                  <div className="text-2xl font-bold text-brand-gold mb-1">
                    {formatPercentage(results.internalRateOfReturn)}
                  </div>
                  <div className="text-xs text-brand-stone">Internal Rate of Return</div>
                  <div className="flex items-center justify-center mt-2">
                    {results.internalRateOfReturn > 15 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-400" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-brand-ink/60 rounded-xl border border-brand-maroon/20">
                  <div className="text-2xl font-bold text-brand-maroon mb-1">
                    {formatPercentage(results.cashOnCashReturn)}
                  </div>
                  <div className="text-xs text-brand-stone">Cash-on-Cash Return</div>
                  <div className="flex items-center justify-center mt-2">
                    <Percent className="h-4 w-4 text-brand-maroon" />
                  </div>
                </div>
                
                <div className="text-center p-4 bg-brand-ink/60 rounded-xl border border-green-600/20">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {results.equityMultiple.toFixed(2)}x
                  </div>
                  <div className="text-xs text-brand-stone">Equity Multiple</div>
                  <div className="flex items-center justify-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </div>
                </div>
              </div>
              
              {/* Cash Flow Projection */}
              <div className="mt-6 p-4 bg-gray-100 rounded-xl border border-brand-cyan/20">
                <div className="text-brand-cyan font-medium mb-3">Annual Cash Flow Projection</div>
                <div className="space-y-2">
                  {results.cashFlow.map((cf, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-brand-stone text-sm">Year {index + 1}:</span>
                      <span className={cn(
                        "font-medium",
                        cf > 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {formatCurrency(cf)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Investment Decision Matrix */}
      {results && (
        <Card className="bg-white border-brand-cyan/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-brand-cyan flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-brand-gold" />
              Investment Decision Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="text-brand-maroon font-medium">Profitability Assessment</h4>
                  <div className="mt-4">
                    <Badge className={cn(
                      "text-lg px-4 py-2",
                      results.netPresentValue > 0 && results.internalRateOfReturn > 15
                        ? "bg-green-100 text-green-800 border-green-600"
                        : results.netPresentValue > 0
                        ? "bg-yellow-100 text-yellow-800 border-yellow-600"
                        : "bg-red-100 text-red-800 border-red-600"
                    )}>
                      {results.netPresentValue > 0 && results.internalRateOfReturn > 15
                        ? "Strong Buy"
                        : results.netPresentValue > 0
                        ? "Consider"
                        : "Pass"
                      }
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <h4 className="text-brand-maroon font-medium mb-3">Key Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-brand-stone">Monthly Payment:</span>
                      <span className="text-brand-maroon">{formatCurrency(results.monthlyPayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-stone">Profitability Index:</span>
                      <span className="text-brand-gold">{results.profitabilityIndex.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brand-stone">Break-even IRR:</span>
                      <span className="text-brand-cyan">12.0%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <h4 className="text-brand-maroon font-medium mb-3">Risk Assessment</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-gray-100 rounded-lg border-l-4 border-green-400">
                      <div className="text-xs text-green-300">Interest Rate: Favorable</div>
                    </div>
                    <div className="p-2 bg-brand-ink/60 rounded-lg border-l-4 border-yellow-400">
                      <div className="text-xs text-yellow-300">Market: Moderate Risk</div>
                    </div>
                    <div className="p-2 bg-brand-ink/60 rounded-lg border-l-4 border-brand-cyan">
                      <div className="text-xs text-brand-cyan">Liquidity: Good</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}