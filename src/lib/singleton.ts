import fs from 'fs';
import path from 'path';

export function assertSingleton(name: string) {
  const pidFile = path.join(process.cwd(), `.lock.${name}.pid`);
  if (fs.existsSync(pidFile)) {
    throw new Error(`${name} already running`);
  }
  fs.writeFileSync(pidFile, String(process.pid));
  
  const clean = () => {
    try {
      fs.unlinkSync(pidFile);
    } catch {}
  };
  
  process.on('exit', clean);
  process.on('SIGINT', clean);
  process.on('SIGTERM', clean);
}