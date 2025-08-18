let spawning = false;
let instance: Promise<any> | null = null;

async function health(): Promise<boolean> {
  // Quick health check for existing MCP instance
  try {
    return !!(globalThis as any).__MCP__;
  } catch {
    return false;
  }
}

export async function getMcp() {
  if (instance) return instance;
  
  if (await health()) {
    return (instance = Promise.resolve((globalThis as any).__MCP__));
  }
  
  if (spawning) {
    return new Promise((resolve, reject) => {
      const t = setInterval(() => {
        if (instance) {
          clearInterval(t);
          resolve(instance);
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(t);
        reject(new Error('MCP wait timeout'));
      }, 15000);
    });
  }
  
  spawning = true;
  
  // Import and initialize MCP service lazily
  instance = import('../server/services/mcpService')
    .then(({ mcpService }) => {
      const srv = mcpService;
      (globalThis as any).__MCP__ = srv;
      return srv;
    })
    .finally(() => {
      spawning = false;
    });
  
  return instance;
}