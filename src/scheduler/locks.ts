import { storage } from '../../server/storage';

interface Lock {
  key: string;
  acquired: Date;
  ttl: number;
}

const locks = new Map<string, Lock>();

export async function withDedupLock(key: string, ttlSec: number, fn: () => Promise<void>) {
  const lockKey = `scheduler:${key}`;
  
  // Check if lock already exists and is still valid
  const existingLock = locks.get(lockKey);
  if (existingLock) {
    const elapsed = Date.now() - existingLock.acquired.getTime();
    if (elapsed < existingLock.ttl * 1000) {
      console.log(`Lock ${lockKey} already held, skipping execution`);
      return;
    }
    // Lock expired, remove it
    locks.delete(lockKey);
  }
  
  // Acquire lock
  const lock: Lock = {
    key: lockKey,
    acquired: new Date(),
    ttl: ttlSec
  };
  
  locks.set(lockKey, lock);
  console.log(`Acquired lock ${lockKey} for ${ttlSec}s`);
  
  try {
    await fn();
  } finally {
    locks.delete(lockKey);
    console.log(`Released lock ${lockKey}`);
  }
}

// Cleanup expired locks periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, lock] of locks.entries()) {
    const elapsed = now - lock.acquired.getTime();
    if (elapsed > lock.ttl * 1000) {
      locks.delete(key);
      console.log(`Cleaned up expired lock ${key}`);
    }
  }
}, 30000); // Check every 30 seconds