export interface IRateLimitStore {
  increment(key: string, windowSeconds: number): Promise<number>;
  reset(key: string): Promise<void>;
}
