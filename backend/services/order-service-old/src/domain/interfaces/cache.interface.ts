export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(...keys: string[]): Promise<void>;
  exists(key: string): Promise<boolean>;
}
