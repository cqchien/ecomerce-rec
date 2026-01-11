/**
 * Cache Service Interface (Domain Layer)
 * Abstracts caching operations for dependency inversion
 */
export interface ICacheService {
  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Parsed value of type T or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache (will be serialized)
   * @param ttl Time to live in seconds (optional)
   */
  set(key: string, value: any, ttl?: number): Promise<void>;

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  del(key: string): Promise<void>;

  /**
   * Check if a key exists in cache
   * @param key Cache key
   * @returns True if key exists, false otherwise
   */
  exists(key: string): Promise<boolean>;
}
