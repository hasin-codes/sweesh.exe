/**
 * Rate Limiter for IPC Handlers
 * Prevents DoS attacks and resource exhaustion
 */

import { RateLimiter } from 'limiter';

// Rate limiters for different operations
export const rateLimiters = {
  // Transcription: Max 20 requests per minute (BYOK system, user manages their own costs)
  transcription: new RateLimiter({ 
    tokensPerInterval: 20, 
    interval: 'minute' 
  }),
  
  // Authentication: Max 3 attempts per minute (security critical)
  authentication: new RateLimiter({ 
    tokensPerInterval: 3, 
    interval: 'minute' 
  }),
  
  // Window operations: Max 30 per minute (more permissive for UI responsiveness)
  windowOps: new RateLimiter({ 
    tokensPerInterval: 30, 
    interval: 'minute' 
  }),
};

/**
 * Check if an operation is allowed based on rate limit
 * @param limiter - The rate limiter to check
 * @param action - Name of the action (for logging)
 * @returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  limiter: RateLimiter, 
  action: string
): Promise<boolean> {
  try {
    const remainingTokens = await limiter.removeTokens(1);
    
    if (remainingTokens < 0) {
      console.warn(`⚠️ Rate limit exceeded for: ${action}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Rate limiter error:', error);
    // On error, allow the request to proceed (fail-open for better UX)
    return true;
  }
}

/**
 * Track recent attempts with timestamps for deduplication
 * Automatically cleans up old entries to prevent memory leaks
 */
export class DeduplicationTracker {
  private attempts: Map<string, number> = new Map();
  private windowMs: number;
  
  constructor(windowMs: number = 60000) {
    this.windowMs = windowMs;
  }
  
  /**
   * Check if an attempt is a duplicate within the time window
   * @param key - Unique identifier for the attempt
   * @returns true if duplicate, false if new/allowed
   */
  isDuplicate(key: string): boolean {
    const now = Date.now();
    const lastAttempt = this.attempts.get(key);
    
    if (lastAttempt && (now - lastAttempt) < this.windowMs) {
      console.warn(`🔁 Duplicate attempt blocked: ${key}`);
      return true;
    }
    
    // Record this attempt
    this.attempts.set(key, now);
    
    // Clean up old attempts (prevent memory leak)
    this.cleanup(now);
    
    return false;
  }
  
  /**
   * Clean up attempts older than the time window
   */
  private cleanup(now: number): void {
    for (const [key, timestamp] of this.attempts.entries()) {
      if (now - timestamp > this.windowMs) {
        this.attempts.delete(key);
      }
    }
  }
  
  /**
   * Force clear all tracked attempts
   */
  clear(): void {
    this.attempts.clear();
  }
  
  /**
   * Get the number of tracked attempts (for debugging)
   */
  size(): number {
    return this.attempts.size;
  }
}

