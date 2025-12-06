import Redis, { RedisOptions } from 'ioredis';

export interface CacheServiceOptions {
  redis?: {
    url?: string;
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
  keyPrefix?: string;
  defaultTTL?: number;
  enabled?: boolean;
}

/**
 * Redis-based cache service with graceful degradation
 *
 * Features:
 * - Automatic connection management
 * - Graceful degradation (works without Redis)
 * - TTL support
 * - Pattern-based deletion
 * - Key prefixing
 */
export class CacheService {
  private redis: Redis | null = null;
  private keyPrefix: string;
  private defaultTTL: number;
  private enabled: boolean;
  private isConnected: boolean = false;

  constructor(options: CacheServiceOptions = {}) {
    this.keyPrefix = options.keyPrefix || 'allium:';
    this.defaultTTL = options.defaultTTL || 300; // 5 minutes default
    this.enabled = options.enabled !== false;

    if (!this.enabled) {
      console.log('ℹ️  Cache is disabled');
      return;
    }

    try {
      const redisConfig = this.buildRedisConfig(options.redis);

      if (redisConfig) {
        // Handle string URL or RedisOptions object
        if (typeof redisConfig === 'string') {
          this.redis = new Redis(redisConfig);
        } else {
          this.redis = new Redis(redisConfig);
        }

        this.redis.on('connect', () => {
          this.isConnected = true;
          console.log('✅ Redis cache connected');
        });

        this.redis.on('error', (error) => {
          this.isConnected = false;
          console.warn('⚠️  Redis connection error:', error.message);
          console.warn('   Cache will be disabled, using database directly');
        });

        this.redis.on('close', () => {
          this.isConnected = false;
          console.warn('⚠️  Redis connection closed');
        });
      } else {
        console.log('ℹ️  No Redis configuration provided, caching disabled');
      }
    } catch (error) {
      console.warn('⚠️  Failed to initialize Redis:', (error as Error).message);
      console.warn('   Cache will be disabled, using database directly');
      this.redis = null;
    }
  }

  private buildRedisConfig(
    config?: CacheServiceOptions['redis']
  ): RedisOptions | string | null {
    if (!config) return null;

    // If URL is provided, use it directly
    if (config.url) {
      return config.url;
    }

    // Build config from individual options
    if (config.host) {
      return {
        host: config.host,
        port: config.port || 6379,
        password: config.password,
        db: config.db || 0,
        retryStrategy: (times) => {
          // Stop retrying after 3 attempts
          if (times > 3) {
            console.warn(
              '⚠️  Redis connection failed after 3 attempts, disabling cache'
            );
            return null;
          }
          // Exponential backoff
          return Math.min(times * 100, 3000);
        },
      };
    }

    return null;
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.redis || !this.isConnected) {
      return null;
    }

    try {
      const fullKey = this.keyPrefix + key;
      const value = await this.redis.get(fullKey);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.warn('Cache read error:', (error as Error).message);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.redis || !this.isConnected) {
      return;
    }

    try {
      const fullKey = this.keyPrefix + key;
      const serialized = JSON.stringify(value);
      const cacheTTL = ttl || this.defaultTTL;

      if (cacheTTL > 0) {
        await this.redis.setex(fullKey, cacheTTL, serialized);
      } else {
        await this.redis.set(fullKey, serialized);
      }
    } catch (error) {
      console.warn('Cache write error:', (error as Error).message);
      // Silently fail - don't break the application
    }
  }

  /**
   * Delete a specific key from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.redis || !this.isConnected) {
      return;
    }

    try {
      const fullKey = this.keyPrefix + key;
      await this.redis.del(fullKey);
    } catch (error) {
      console.warn('Cache delete error:', (error as Error).message);
    }
  }

  /**
   * Delete all keys matching a pattern
   * Example: deletePattern('user:*') deletes all user-related keys
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.redis || !this.isConnected) {
      return;
    }

    try {
      const fullPattern = this.keyPrefix + pattern;
      const keys = await this.redis.keys(fullPattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.warn('Cache pattern delete error:', (error as Error).message);
    }
  }

  /**
   * Clear all cache keys with the configured prefix
   */
  async clear(): Promise<void> {
    if (!this.redis || !this.isConnected) {
      return;
    }

    try {
      const keys = await this.redis.keys(this.keyPrefix + '*');

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.warn('Cache clear error:', (error as Error).message);
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.enabled && this.redis !== null && this.isConnected;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memoryUsage?: string;
  }> {
    if (!this.redis || !this.isConnected) {
      return {
        connected: false,
        keyCount: 0,
      };
    }

    try {
      const keys = await this.redis.keys(this.keyPrefix + '*');
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);

      return {
        connected: true,
        keyCount: keys.length,
        memoryUsage: memoryMatch ? memoryMatch[1].trim() : undefined,
      };
    } catch (error) {
      return {
        connected: false,
        keyCount: 0,
      };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isConnected = false;
    }
  }
}

// Singleton instance
let cacheInstance: CacheService | null = null;

/**
 * Get or create cache service instance
 */
export function getCacheService(options?: CacheServiceOptions): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService(options);
  }
  return cacheInstance;
}

/**
 * Reset cache service instance (useful for testing)
 */
export function resetCacheService(): void {
  if (cacheInstance) {
    cacheInstance.disconnect();
    cacheInstance = null;
  }
}
