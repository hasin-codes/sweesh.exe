/**
 * Security Logger Module for Sweesh
 * 
 * Monitors and logs security events:
 * - Failed authentication attempts
 * - Rate limit violations
 * - Suspicious patterns and anomalies
 * - Command injection attempts
 * - Invalid input patterns
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { app } from 'electron';

// Security event severity levels
export enum SecurityLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  ALERT = 'ALERT'
}

// Security event types
export enum SecurityEventType {
  AUTH_FAILED = 'AUTH_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT = 'INVALID_INPUT',
  SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN',
  JWT_VALIDATION_FAILED = 'JWT_VALIDATION_FAILED',
  DEDUPLICATION_BLOCKED = 'DEDUPLICATION_BLOCKED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  COMMAND_INJECTION_ATTEMPT = 'COMMAND_INJECTION_ATTEMPT',
  MALICIOUS_URL_BLOCKED = 'MALICIOUS_URL_BLOCKED',
  API_KEY_VALIDATION_FAILED = 'API_KEY_VALIDATION_FAILED'
}

interface SecurityEvent {
  timestamp: string;
  level: SecurityLevel;
  type: SecurityEventType;
  message: string;
  details?: Record<string, any>;
  ip?: string;
  userId?: string;
}

class SecurityLogger {
  private logFilePath: string = '';
  private alertLogPath: string = '';
  private maxLogSize: number = 10 * 1024 * 1024; // 10MB
  private eventCounts: Map<SecurityEventType, number> = new Map();
  private suspiciousActivityThreshold = 5; // Alert after 5 suspicious events within time window
  private timeWindow = 60000; // 1 minute
  private recentEvents: Array<{ type: SecurityEventType; timestamp: number }> = [];
  private initialized: boolean = false;

  constructor() {
    // Don't initialize paths here - wait for app to be ready
    // Initialize event counters
    Object.values(SecurityEventType).forEach(type => {
      this.eventCounts.set(type as SecurityEventType, 0);
    });
  }

  /**
   * Initialize the security logger (must be called after app is ready)
   */
  public initialize(): void {
    if (this.initialized) {
      console.warn('Security logger already initialized');
      return;
    }

    try {
      // Initialize log file paths
      const logDir = path.join(app.getPath('userData'), 'logs');
      
      // Ensure log directory exists
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      this.logFilePath = path.join(logDir, 'security.log');
      this.alertLogPath = path.join(logDir, 'security-alerts.log');
      this.initialized = true;

      // Log initialization
      this.log(SecurityLevel.INFO, SecurityEventType.SUSPICIOUS_PATTERN, 'Security logger initialized', {
        logPath: this.logFilePath,
        alertPath: this.alertLogPath,
        hostname: os.hostname(),
        platform: os.platform()
      });
    } catch (error) {
      console.error('Failed to initialize security logger:', error);
      this.initialized = false;
    }
  }

  /**
   * Main logging function
   */
  private log(
    level: SecurityLevel,
    type: SecurityEventType,
    message: string,
    details?: Record<string, any>
  ): void {
    // Skip logging if not initialized (fail gracefully)
    if (!this.initialized) {
      console.warn(`Security logger not initialized. Skipping log: ${level} - ${message}`);
      return;
    }

    const event: SecurityEvent = {
      timestamp: new Date().toISOString(),
      level,
      type,
      message,
      details: details || {},
      ip: this.getLocalIP(),
      userId: details?.userId || 'unknown'
    };

    // Format log entry
    const logEntry = this.formatLogEntry(event);

    // Write to main security log
    this.writeToLog(this.logFilePath, logEntry);

    // Write to alert log if critical or alert level
    if (level === SecurityLevel.CRITICAL || level === SecurityLevel.ALERT) {
      this.writeToLog(this.alertLogPath, logEntry);
    }

    // Console output with color coding
    this.consoleLog(level, logEntry);

    // Increment event counter
    const currentCount = this.eventCounts.get(type) || 0;
    this.eventCounts.set(type, currentCount + 1);

    // Track recent events for pattern detection
    this.trackRecentEvent(type);

    // Check for suspicious patterns
    this.detectSuspiciousPatterns();

    // Rotate log if needed
    this.rotateLogIfNeeded();
  }

  /**
   * Format log entry as JSON for easy parsing
   */
  private formatLogEntry(event: SecurityEvent): string {
    return JSON.stringify(event) + '\n';
  }

  /**
   * Write log entry to file
   */
  private writeToLog(filePath: string, entry: string): void {
    try {
      fs.appendFileSync(filePath, entry, { encoding: 'utf8', mode: 0o600 }); // Secure file permissions
    } catch (error) {
      console.error('Failed to write security log:', error);
    }
  }

  /**
   * Console output with color coding based on severity
   */
  private consoleLog(level: SecurityLevel, entry: string): void {
    const colors = {
      [SecurityLevel.INFO]: '\x1b[36m',      // Cyan
      [SecurityLevel.WARNING]: '\x1b[33m',   // Yellow
      [SecurityLevel.CRITICAL]: '\x1b[31m',  // Red
      [SecurityLevel.ALERT]: '\x1b[35m'      // Magenta
    };
    const reset = '\x1b[0m';
    
    console.log(`${colors[level]}[SECURITY ${level}]${reset} ${entry.trim()}`);
  }

  /**
   * Get local IP address (for logging purposes)
   */
  private getLocalIP(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (iface) {
        for (const alias of iface) {
          if (alias.family === 'IPv4' && !alias.internal) {
            return alias.address;
          }
        }
      }
    }
    return '127.0.0.1';
  }

  /**
   * Track recent events for pattern detection
   */
  private trackRecentEvent(type: SecurityEventType): void {
    const now = Date.now();
    this.recentEvents.push({ type, timestamp: now });

    // Clean up old events outside time window
    this.recentEvents = this.recentEvents.filter(
      event => now - event.timestamp < this.timeWindow
    );
  }

  /**
   * Detect suspicious patterns in recent events
   */
  private detectSuspiciousPatterns(): void {
    const now = Date.now();
    const recentSuspiciousEvents = this.recentEvents.filter(
      event => now - event.timestamp < this.timeWindow
    );

    // Check if threshold exceeded
    if (recentSuspiciousEvents.length >= this.suspiciousActivityThreshold) {
      // Group by event type
      const eventTypeCounts = new Map<SecurityEventType, number>();
      recentSuspiciousEvents.forEach(event => {
        eventTypeCounts.set(event.type, (eventTypeCounts.get(event.type) || 0) + 1);
      });

      // Alert if multiple events of same type
      eventTypeCounts.forEach((count, type) => {
        if (count >= 3) {
          this.logAlert(
            `SUSPICIOUS ACTIVITY DETECTED: ${count} ${type} events in ${this.timeWindow / 1000}s`,
            {
              eventType: type,
              count,
              timeWindow: `${this.timeWindow / 1000}s`,
              recentEvents: recentSuspiciousEvents.map(e => ({
                type: e.type,
                timestamp: new Date(e.timestamp).toISOString()
              }))
            }
          );
        }
      });
    }
  }

  /**
   * Rotate log file if it exceeds max size
   */
  private rotateLogIfNeeded(): void {
    try {
      const stats = fs.statSync(this.logFilePath);
      if (stats.size >= this.maxLogSize) {
        const rotatedPath = `${this.logFilePath}.${Date.now()}`;
        fs.renameSync(this.logFilePath, rotatedPath);
        this.log(SecurityLevel.INFO, SecurityEventType.SUSPICIOUS_PATTERN, 'Log file rotated', {
          oldFile: rotatedPath,
          newFile: this.logFilePath
        });
      }
    } catch (error) {
      // Ignore if file doesn't exist yet
    }
  }

  /**
   * Public API: Log failed authentication attempt
   */
  public logAuthFailed(details: { reason: string; userId?: string; challenge?: string; [key: string]: any }): void {
    this.log(
      SecurityLevel.WARNING,
      SecurityEventType.AUTH_FAILED,
      'Authentication attempt failed',
      details
    );
  }

  /**
   * Public API: Log rate limit exceeded
   */
  public logRateLimitExceeded(details: { action: string; limit: string; [key: string]: any }): void {
    this.log(
      SecurityLevel.WARNING,
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      details
    );
  }

  /**
   * Public API: Log invalid input
   */
  public logInvalidInput(details: { field: string; value?: string; reason: string; [key: string]: any }): void {
    this.log(
      SecurityLevel.INFO,
      SecurityEventType.INVALID_INPUT,
      'Invalid input detected',
      details
    );
  }

  /**
   * Public API: Log suspicious pattern
   */
  public logSuspiciousPattern(details: { pattern: string; description: string; [key: string]: any }): void {
    this.log(
      SecurityLevel.WARNING,
      SecurityEventType.SUSPICIOUS_PATTERN,
      'Suspicious pattern detected',
      details
    );
  }

  /**
   * Public API: Log JWT validation failure
   */
  public logJWTValidationFailed(details: { error: string; token?: string; [key: string]: any }): void {
    this.log(
      SecurityLevel.CRITICAL,
      SecurityEventType.JWT_VALIDATION_FAILED,
      'JWT validation failed',
      {
        ...details,
        // Don't log full token for security
        token: details.token ? `${details.token.substring(0, 20)}...` : undefined
      }
    );
  }

  /**
   * Public API: Log deduplication blocked event
   */
  public logDeduplicationBlocked(details: { key: string; action: string; [key: string]: any }): void {
    this.log(
      SecurityLevel.WARNING,
      SecurityEventType.DEDUPLICATION_BLOCKED,
      'Duplicate request blocked',
      details
    );
  }

  /**
   * Public API: Log unauthorized access attempt
   */
  public logUnauthorizedAccess(details: { resource: string; reason: string; [key: string]: any }): void {
    this.log(
      SecurityLevel.CRITICAL,
      SecurityEventType.UNAUTHORIZED_ACCESS,
      'Unauthorized access attempt',
      details
    );
  }

  /**
   * Public API: Log command injection attempt
   */
  public logCommandInjectionAttempt(details: { command: string; blocked: boolean; [key: string]: any }): void {
    this.log(
      SecurityLevel.CRITICAL,
      SecurityEventType.COMMAND_INJECTION_ATTEMPT,
      'Potential command injection attempt detected',
      details
    );
  }

  /**
   * Public API: Log malicious URL blocked
   */
  public logMaliciousURLBlocked(details: { url: string; reason: string; [key: string]: any }): void {
    this.log(
      SecurityLevel.WARNING,
      SecurityEventType.MALICIOUS_URL_BLOCKED,
      'Malicious URL blocked',
      details
    );
  }

  /**
   * Public API: Log API key validation failure
   */
  public logAPIKeyValidationFailed(details: { reason: string; [key: string]: any }): void {
    this.log(
      SecurityLevel.WARNING,
      SecurityEventType.API_KEY_VALIDATION_FAILED,
      'API key validation failed',
      details
    );
  }

  /**
   * Public API: Log critical alert
   */
  public logAlert(message: string, details?: Record<string, any>): void {
    this.log(
      SecurityLevel.ALERT,
      SecurityEventType.SUSPICIOUS_PATTERN,
      message,
      details
    );
  }

  /**
   * Public API: Get security statistics
   */
  public getStatistics(): Record<string, any> {
    const stats: Record<string, any> = {
      totalEvents: 0,
      eventCounts: {},
      recentEvents: this.recentEvents.length,
      logFile: this.logFilePath,
      alertFile: this.alertLogPath
    };

    this.eventCounts.forEach((count, type) => {
      stats.eventCounts[type] = count;
      stats.totalEvents += count;
    });

    return stats;
  }

  /**
   * Public API: Clear event counters (for testing)
   */
  public clearCounters(): void {
    this.eventCounts.clear();
    this.recentEvents = [];
    Object.values(SecurityEventType).forEach(type => {
      this.eventCounts.set(type as SecurityEventType, 0);
    });
  }
}

// Singleton instance
export const securityLogger = new SecurityLogger();


