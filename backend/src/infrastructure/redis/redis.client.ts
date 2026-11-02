import Redis from 'ioredis';
import { env } from '../../config/env.config';

class RedisManager {
  private client: Redis | null = null;
  private inMemoryFallback: Map<string, { value: string; expiresAt?: number }> = new Map();
  private inMemorySets: Map<string, Set<string>> = new Map();
  private isFallbackMode = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.client = new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Do not endlessly retry if offline in dev
        lazyConnect: true
      });

      this.client.on('error', (err) => {
        if (!this.isFallbackMode) {
          console.warn(`[Redis] Connection warning: ${err.message}. Operating with in-memory session cache.`);
          this.isFallbackMode = true;
        }
      });

      this.client.connect().catch(() => {
        this.isFallbackMode = true;
      });
    } catch {
      this.isFallbackMode = true;
    }
  }

  public async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (!this.isFallbackMode && this.client && this.client.status === 'ready') {
      try {
        if (expirySeconds) {
          await this.client.set(key, value, 'EX', expirySeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        this.isFallbackMode = true;
      }
    }

    // In-memory fallback
    const expiresAt = expirySeconds ? Date.now() + expirySeconds * 1000 : undefined;
    this.inMemoryFallback.set(key, { value, expiresAt });
  }

  public async get(key: string): Promise<string | null> {
    if (!this.isFallbackMode && this.client && this.client.status === 'ready') {
      try {
        return await this.client.get(key);
      } catch {
        this.isFallbackMode = true;
      }
    }

    // In-memory fallback
    const item = this.inMemoryFallback.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.inMemoryFallback.delete(key);
      return null;
    }
    return item.value;
  }

  public async del(key: string): Promise<void> {
    if (!this.isFallbackMode && this.client && this.client.status === 'ready') {
      try {
        await this.client.del(key);
        return;
      } catch {
        this.isFallbackMode = true;
      }
    }
    this.inMemoryFallback.delete(key);
    this.inMemorySets.delete(key);
  }

  public async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.isFallbackMode && this.client && this.client.status === 'ready') {
      try {
        return await this.client.sadd(key, ...members);
      } catch {
        this.isFallbackMode = true;
      }
    }
    let set = this.inMemorySets.get(key);
    if (!set) {
      set = new Set<string>();
      this.inMemorySets.set(key, set);
    }
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    return added;
  }

  public async srem(key: string, ...members: string[]): Promise<number> {
    if (!this.isFallbackMode && this.client && this.client.status === 'ready') {
      try {
        return await this.client.srem(key, ...members);
      } catch {
        this.isFallbackMode = true;
      }
    }
    const set = this.inMemorySets.get(key);
    if (!set) return 0;
    let removed = 0;
    for (const m of members) {
      if (set.delete(m)) {
        removed++;
      }
    }
    return removed;
  }

  public async smembers(key: string): Promise<string[]> {
    if (!this.isFallbackMode && this.client && this.client.status === 'ready') {
      try {
        return await this.client.smembers(key);
      } catch {
        this.isFallbackMode = true;
      }
    }
    const set = this.inMemorySets.get(key);
    return set ? Array.from(set) : [];
  }

  public async flushAll(): Promise<void> {
    if (!this.isFallbackMode && this.client && this.client.status === 'ready') {
      await this.client.flushall();
    }
    this.inMemoryFallback.clear();
    this.inMemorySets.clear();
  }

  public isHealthy(): boolean {
    return !this.isFallbackMode && this.client?.status === 'ready';
  }
}

export const redis = new RedisManager();
