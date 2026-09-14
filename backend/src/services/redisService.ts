import Redis from 'ioredis';
import EventEmitter from 'events';

class RedisCacheService {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private memoryCache: Map<string, { value: any; expiry: number }> = new Map();
  private localEmitter: EventEmitter = new EventEmitter();

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) {
            return null; // Stop retrying after 3 attempts, switch to fallback
          }
          return Math.min(times * 500, 2000);
        },
      });

      this.client.connect().then(() => {
        this.isConnected = true;
        console.log(`[Redis] Connected successfully to ${redisUrl}`);
      }).catch((err) => {
        console.warn(`[Redis] Failed to connect to Redis (${err.message}). Using high-performance in-memory fallback cache.`);
        this.isConnected = false;
      });

      this.client.on('error', (err) => {
        if (this.isConnected) {
          console.warn('[Redis] Connection error, switching to fallback mode:', err.message);
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
      });
    } catch (e: any) {
      console.warn('[Redis] Client initialization notice:', e.message);
      this.isConnected = false;
    }

    // Periodic sweep for expired in-memory keys every 60s
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.memoryCache.entries()) {
        if (item.expiry > 0 && item.expiry < now) {
          this.memoryCache.delete(key);
        }
      }
    }, 60000);
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      mode: this.isConnected ? 'Redis Server' : 'In-Memory Cache & Emitter (Fallback)',
      memoryKeysCount: this.memoryCache.size,
    };
  }

  public async get<T = any>(key: string): Promise<T | null> {
    if (this.isConnected && this.client) {
      try {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } catch (err) {
        // Fall back to memory cache
      }
    }

    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (item.expiry > 0 && item.expiry < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value as T;
  }

  public async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds > 0) {
          await this.client.setex(key, ttlSeconds, serialized);
        } else {
          await this.client.set(key, serialized);
        }
        return;
      } catch (err) {
        // Fall back to memory
      }
    }

    const expiry = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
    this.memoryCache.set(key, { value, expiry });
  }

  public async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (err) {}
    }
    this.memoryCache.delete(key);
  }

  public async invalidatePattern(pattern: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } catch (err) {}
    }

    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }
  }

  public async publishNotification(channel: string, payload: any): Promise<void> {
    const data = JSON.stringify(payload);
    if (this.isConnected && this.client) {
      try {
        await this.client.publish(channel, data);
      } catch (err) {}
    }
    this.localEmitter.emit(channel, payload);
  }

  public onNotification(channel: string, listener: (data: any) => void) {
    this.localEmitter.on(channel, listener);
  }
}

export const redisService = new RedisCacheService();
export default redisService;
