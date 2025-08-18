export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel;

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG': this.level = LogLevel.DEBUG; break;
      case 'INFO': this.level = LogLevel.INFO; break;
      case 'WARN': this.level = LogLevel.WARN; break;
      case 'ERROR': this.level = LogLevel.ERROR; break;
      default: 
        this.level = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();

// Heap snapshot functionality
export function setupHeapSnapshot() {
  process.on('SIGUSR2', () => {
    const v8 = require('v8');
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `/tmp/heap-${timestamp}.heapsnapshot`;
    
    try {
      const heapSnapshot = v8.getHeapSnapshot();
      const writeStream = fs.createWriteStream(filename);
      heapSnapshot.pipe(writeStream);
      console.log(`Heap snapshot written to ${filename}`);
    } catch (error) {
      console.error('Failed to create heap snapshot:', error);
    }
  });
}