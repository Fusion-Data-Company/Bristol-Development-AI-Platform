// Production-safe logging utility
export const log = {
  debug: (...args: any[]) => { 
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[Bristol Debug]', ...args); 
    }
  },
  info: (...args: any[]) => console.info('[Bristol Info]', ...args),
  warn: (...args: any[]) => console.warn('[Bristol Warning]', ...args),
  error: (...args: any[]) => console.error('[Bristol Error]', ...args),
};

// Performance logger for production monitoring
export const perfLog = {
  measure: (name: string, fn: () => any) => {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  },
  
  measureAsync: async (name: string, fn: () => Promise<any>) => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }
};