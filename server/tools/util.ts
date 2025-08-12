// Utility functions for date handling and number parsing

export function parseYearMonth(dateStr: string): { year: number; month: number } {
  const [year, month] = dateStr.split('-');
  return { year: parseInt(year), month: parseInt(month) };
}

export function formatYearMonth(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, '0')}`;
}

export function getCurrentYearMonth(): string {
  const now = new Date();
  return formatYearMonth(now.getFullYear(), now.getMonth() + 1);
}

export function getDateRange(startYear: number, endYear: number): string {
  return `${startYear}-${endYear}`;
}

export function safeParseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove commas and parse
    const cleaned = value.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

export function calculateYoYChange(currentValue: number, previousValue: number): number {
  if (previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}