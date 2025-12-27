/**
 * Cache Service - Client-side caching layer
 * 
 * Provides in-memory caching with TTL support to reduce API calls
 * and improve application performance.
 */

interface CacheEntry {
  data: any;
  timestamp: number;
}

/**
 * Cache TTL (Time To Live) constants in milliseconds
 */
export const CACHE_TTL = {
  /** Balances: 5 minutes - financial data changes moderately */
  BALANCES: 300000,
  
  /** Strategies: 2 minutes - user strategies change frequently */
  STRATEGIES: 120000,
  
  /** Exchanges: 5 minutes - exchange connections are stable */
  EXCHANGES: 300000,
  
  /** Portfolio Evolution: 5 minutes - historical data is stable */
  PORTFOLIO: 300000,
  
  /** Token Details: 1 minute - prices change frequently */
  TOKEN_DETAILS: 60000,
  
  /** Exchange Details: 1 hour - fees and markets rarely change */
  EXCHANGE_DETAILS: 3600000,
} as const;

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private enabled = true;

  /**
   * Get value from cache if not expired
   * @param key Cache key
   * @param ttl Time to live in milliseconds
   * @returns Cached data or null if not found/expired
   */
  get<T>(key: string, ttl: number): T | null {
    if (!this.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > ttl) {
      this.cache.delete(key);
      console.log(`⏱️ Cache EXPIRED: ${key} (age: ${Math.round(age / 1000)}s)`);
      return null;
    }

    console.log(`✅ Cache HIT: ${key} (age: ${Math.round(age / 1000)}s / ${Math.round(ttl / 1000)}s)`);
    return entry.data as T;
  }

  /**
   * Store value in cache
   * @param key Cache key
   * @param data Data to cache
   */
  set<T>(key: string, data: T): void {
    if (!this.enabled) return;

    console.log(`💾 Cache SET: ${key}`);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Delete cache entries matching a pattern
   * @param pattern String pattern to match against keys
   */
  invalidate(pattern: string): void {
    console.log(`🗑️ Cache INVALIDATE: ${pattern}`);
    
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log(`   - Deleted: ${key}`);
    });

    console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries`);
  }

  /**
   * Invalidate all cache entries for a specific user
   * @param userId User ID
   * @param types Specific cache types to invalidate (default: all)
   */
  invalidateUser(
    userId: string,
    types: ('balances' | 'strategies' | 'exchanges' | 'portfolio' | 'all')[] = ['all']
  ): void {
    console.log(`🗑️ Cache INVALIDATE USER: ${userId} (types: ${types.join(', ')})`);

    types.forEach(type => {
      if (type === 'all' || type === 'balances') {
        this.invalidate(`balances_${userId}`);
        this.invalidate(`balance_summary_${userId}`);
      }
      if (type === 'all' || type === 'strategies') {
        this.invalidate(`strategies_${userId}`);
      }
      if (type === 'all' || type === 'exchanges') {
        this.invalidate(`exchanges_${userId}`);
        this.invalidate(`linked_exchanges_${userId}`);
        this.invalidate(`available_exchanges_${userId}`);
      }
      if (type === 'all' || type === 'portfolio') {
        this.invalidate(`portfolio_evolution_${userId}`);
      }
    });
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    console.log(`🗑️ Cache CLEAR ALL (${this.cache.size} entries)`);
    this.cache.clear();
  }

  /**
   * Delete a specific cache entry
   * @param key Cache key to delete
   */
  delete(key: string): void {
    if (this.cache.delete(key)) {
      console.log(`🗑️ Cache DELETE: ${key}`);
    }
  }

  /**
   * Enable or disable caching
   * @param enabled Whether caching should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
    console.log(`⚙️ Cache ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Check if caching is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Math.round((Date.now() - entry.timestamp) / 1000), // in seconds
      size: JSON.stringify(entry.data).length, // approximate size in bytes
    }));

    return {
      enabled: this.enabled,
      size: this.cache.size,
      entries,
      totalSize: entries.reduce((sum, e) => sum + e.size, 0),
    };
  }

  /**
   * Generate cache key for balances
   */
  static balanceKey(userId: string): string {
    return `balances_${userId}`;
  }

  /**
   * Generate cache key for balance summary
   */
  static balanceSummaryKey(userId: string): string {
    return `balance_summary_${userId}`;
  }

  /**
   * Generate cache key for strategies
   */
  static strategiesKey(
    userId: string,
    filters?: {
      exchange_id?: string;
      token?: string;
      is_active?: boolean;
    }
  ): string {
    let key = `strategies_${userId}`;
    if (filters?.exchange_id) key += `_ex_${filters.exchange_id}`;
    if (filters?.token) key += `_tk_${filters.token}`;
    if (filters?.is_active !== undefined) key += `_act_${filters.is_active}`;
    return key;
  }

  /**
   * Generate cache key for single strategy
   */
  static strategyKey(strategyId: string): string {
    return `strategy_${strategyId}`;
  }

  /**
   * Generate cache key for available exchanges
   */
  static availableExchangesKey(userId: string): string {
    return `available_exchanges_${userId}`;
  }

  /**
   * Generate cache key for linked exchanges
   */
  static linkedExchangesKey(userId: string): string {
    return `linked_exchanges_${userId}`;
  }

  /**
   * Generate cache key for portfolio evolution
   */
  static portfolioEvolutionKey(userId: string, days: number): string {
    return `portfolio_evolution_${userId}_${days}`;
  }

  /**
   * Generate cache key for exchange details
   */
  static exchangeDetailsKey(
    exchangeId: string,
    includeFees: boolean = true,
    includeMarkets: boolean = true
  ): string {
    return `exchange_details_${exchangeId}_${includeFees}_${includeMarkets}`;
  }

  /**
   * Generate cache key for token details
   */
  static tokenDetailsKey(exchangeId: string, symbol: string): string {
    return `token_${exchangeId}_${symbol}`;
  }
}

// Export class for type checking and static methods
export { CacheService };

// Export singleton instance
export const cacheService = new CacheService();

// Export for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).__cacheService = cacheService;
}
