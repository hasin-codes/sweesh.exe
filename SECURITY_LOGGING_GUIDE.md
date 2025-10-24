# 🔒 Security Logging System - Sweesh

## Overview

Sweesh includes a comprehensive security logging system that monitors and records all security-related events in real-time. The logging system helps detect suspicious activities, track failed authentication attempts, monitor rate limiting violations, and alert on potential security threats.

## Features

### 📊 Event Tracking
- **Failed Authentication Attempts**: Logs all failed login attempts with details
- **Rate Limit Violations**: Tracks when users exceed rate limits
- **Invalid Input Detection**: Records malformed or suspicious input
- **Suspicious Patterns**: Identifies potential security threats
- **JWT Validation Failures**: Logs token verification errors
- **Deduplication Blocking**: Records blocked duplicate requests
- **Unauthorized Access**: Tracks unauthorized resource access attempts
- **Command Injection Attempts**: Detects potential command injection
- **Malicious URL Blocking**: Logs blocked dangerous URLs
- **API Key Validation Failures**: Records invalid API key submissions

### 🎨 Severity Levels
- **INFO**: General informational events
- **WARNING**: Potentially suspicious activities
- **CRITICAL**: Serious security violations
- **ALERT**: Requires immediate attention

### 📁 Log Files

Security logs are stored in: `{userData}/logs/`

- **security.log**: All security events
- **security-alerts.log**: Critical and alert-level events only

## Log Format

Logs are stored in **JSON format** for easy parsing and analysis:

```json
{
  "timestamp": "2025-10-24T12:34:56.789Z",
  "level": "WARNING",
  "type": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded",
  "details": {
    "action": "transcribe-audio",
    "limit": "20 requests per minute",
    "service": "Groq Whisper API"
  },
  "ip": "192.168.1.100",
  "userId": "unknown"
}
```

## Usage Examples

### Failed Authentication
```typescript
securityLogger.logAuthFailed({
  reason: 'Invalid JWT token',
  userId: 'user_123',
  challenge: 'abc-def-ghi'
});
```

### Rate Limit Exceeded
```typescript
securityLogger.logRateLimitExceeded({
  action: 'transcribe-audio',
  limit: '20 requests per minute',
  service: 'Groq Whisper API'
});
```

### Suspicious Pattern
```typescript
securityLogger.logSuspiciousPattern({
  pattern: 'Invalid URL protocol',
  description: 'Attempted to use non-HTTPS protocol',
  protocol: 'http:',
  url: 'http://malicious.com'
});
```

### Malicious URL Blocked
```typescript
securityLogger.logMaliciousURLBlocked({
  url: 'http://evil.com/attack',
  reason: 'Domain not in allowed list',
  attemptedDomain: 'evil.com'
});
```

## Security Event Types

| Event Type | Description | Severity |
|------------|-------------|----------|
| `AUTH_FAILED` | Authentication attempt failed | WARNING |
| `RATE_LIMIT_EXCEEDED` | Rate limit violation | WARNING |
| `INVALID_INPUT` | Invalid or malformed input | INFO |
| `SUSPICIOUS_PATTERN` | Suspicious activity detected | WARNING |
| `JWT_VALIDATION_FAILED` | JWT token validation failed | CRITICAL |
| `DEDUPLICATION_BLOCKED` | Duplicate request blocked | WARNING |
| `UNAUTHORIZED_ACCESS` | Unauthorized resource access | CRITICAL |
| `COMMAND_INJECTION_ATTEMPT` | Command injection detected | CRITICAL |
| `MALICIOUS_URL_BLOCKED` | Dangerous URL blocked | WARNING |
| `API_KEY_VALIDATION_FAILED` | Invalid API key format | WARNING |

## Pattern Detection

The security logger includes automatic pattern detection that:

1. **Tracks Recent Events**: Maintains a 60-second window of security events
2. **Threshold Monitoring**: Alerts when 5+ suspicious events occur within the time window
3. **Event Grouping**: Groups events by type to detect attack patterns
4. **Auto-Cleanup**: Automatically removes old events to prevent memory leaks

### Alert Triggers

An **ALERT** is triggered when:
- 3+ events of the same type occur within 60 seconds
- Multiple security violations happen in quick succession
- Patterns indicating coordinated attacks are detected

## Log Rotation

Logs automatically rotate when they reach **10MB** to prevent disk space issues:
- Old log files are renamed with timestamp: `security.log.1698765432000`
- New log file is created automatically
- Alert logs are kept separate and never rotated

## Security Statistics API

Retrieve security statistics:

```typescript
const stats = securityLogger.getStatistics();
```

Returns:
```json
{
  "totalEvents": 42,
  "eventCounts": {
    "AUTH_FAILED": 5,
    "RATE_LIMIT_EXCEEDED": 10,
    "SUSPICIOUS_PATTERN": 3,
    ...
  },
  "recentEvents": 8,
  "logFile": "/path/to/security.log",
  "alertFile": "/path/to/security-alerts.log"
}
```

## Best Practices

### 1. Regular Monitoring
- Check security logs daily for suspicious patterns
- Review alert logs immediately when notified
- Set up automated monitoring tools if needed

### 2. Log Retention
- Keep logs for at least 90 days
- Archive old logs for compliance
- Back up critical alert logs

### 3. Incident Response
- Investigate CRITICAL and ALERT events immediately
- Document security incidents
- Update security measures based on patterns

### 4. Performance
- Logs are written asynchronously
- Minimal performance impact (<1ms per log entry)
- Automatic cleanup prevents memory leaks

## Integration

The security logger is automatically initialized and integrated throughout the application:

- ✅ Authentication handlers
- ✅ Rate limiting checks
- ✅ URL validation
- ✅ API key validation
- ✅ Input validation
- ✅ External link handlers

## Console Output

Security events are also logged to console with color coding:

- 🔵 **INFO**: Cyan
- 🟡 **WARNING**: Yellow
- 🔴 **CRITICAL**: Red
- 🟣 **ALERT**: Magenta

## Accessing Logs

### From Code
```typescript
import { securityLogger } from './lib/securityLogger';

// Get statistics
const stats = securityLogger.getStatistics();

// Clear counters (for testing)
securityLogger.clearCounters();
```

### From File System
**Windows**: `C:\Users\{Username}\AppData\Roaming\Sweesh\logs\`
**macOS**: `~/Library/Application Support/Sweesh/logs/`
**Linux**: `~/.config/Sweesh/logs/`

## Troubleshooting

### Logs Not Appearing
1. Check userData directory permissions
2. Verify log directory exists
3. Check disk space availability

### High Log Volume
1. Review rate limiting settings
2. Check for automated attack attempts
3. Consider adjusting threshold values

### Performance Issues
1. Check log file size (should auto-rotate at 10MB)
2. Verify disk I/O is not bottlenecked
3. Consider reducing log retention period

## Security Considerations

- **Log files contain sensitive information** - secure them appropriately
- **Never log full authentication tokens** - only log truncated versions
- **Implement log access controls** - restrict who can read logs
- **Regular audits** - review logs for compliance and security

## Future Enhancements

Planned improvements:
- [ ] Remote logging to SIEM systems
- [ ] Real-time dashboard for security events
- [ ] Email alerts for critical events
- [ ] Machine learning-based anomaly detection
- [ ] Geographic IP analysis
- [ ] Automatic threat response

## Support

For security-related questions or to report vulnerabilities:
- Email: [security@sweesh.app]
- Review logs: Check `{userData}/logs/security.log`
- Documentation: This file

---

**Last Updated**: October 24, 2025  
**Version**: 1.3.9

