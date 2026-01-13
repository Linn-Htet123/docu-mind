export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix: string;
  defaultTtl: number; // In Seconds (Standard)
}

export abstract class ICacheService {
  abstract get<T>(key: string): Promise<T | null>;
  abstract set(key: string, value: any, ttl?: number): Promise<void>;
  abstract del(key: string): Promise<void>;
  abstract clear(): Promise<void>;
}
