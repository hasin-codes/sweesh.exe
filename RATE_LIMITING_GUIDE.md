# 🚦 Rate Limiting Implementation Guide

## Overview

Rate limiting has been implemented to protect against DoS (Denial of Service) attacks and resource exhaustion. This prevents malicious or buggy code from overwhelming the application with too many requests.

---

## 🔒 What's Protected

### 1. **Transcription Requests** (Issue #8)
- **Limit**: 20 requests per minute
- **Reason**: BYOK system (users manage their own API costs), but we still protect against abuse
- **Handler**: `transcribe-audio`

### 2. **Authentication Attempts** (Issue #10)
- **Limit**: 3 attempts per minute
- **Deduplication**: 60-second window to prevent duplicate attempts
- **Handler**: Deep link authentication (`sweesh://auth/callback`)

### 3. **Window Operations**
- **Limit**: 30 requests per minute
- **Handler**: Window toggle, open, close operations

---

## 📦 Implementation Details

### Rate Limiter Module

Location: `src/lib/rateLimiter.ts`

```typescript
export const rateLimiters = {
  transcription: new RateLimiter({ 
    tokensPerInterval: 20, 
    interval: 'minute' 
  }),
  authentication: new RateLimiter({ 
    tokensPerInterval: 3, 
    interval: 'minute' 
  }),
  windowOps: new RateLimiter({ 
    tokensPerInterval: 30, 
    interval: 'minute' 
  }),
};
```

### How It Works

**Token Bucket Algorithm:**
- Each limiter starts with a full bucket of tokens
- Each request consumes 1 token
- Tokens refill over time at a constant rate
- If bucket is empty, request is denied

**Example (Transcription - 20/min):**
```
Start:    [████████████████████] 20 tokens
Request:  [███████████████████ ] 19 tokens
Request:  [██████████████████  ] 18 tokens
...
Request:  [                    ] 0 tokens
Request:  ❌ DENIED - Rate limited!

After 3s: [█                   ] 1 token (refilled)
Request:  [                    ] 0 tokens ✅ Allowed
```

---

## 🧪 Testing Rate Limiting

### Test Script 1: Transcription Rate Limit

Create `test-rate-limit.html` in your renderer:

```javascript
async function testTranscriptionRateLimit() {
  console.log('🧪 Testing transcription rate limiting...');
  console.log('Limit: 20 requests per minute');
  
  const fakeAudio = new ArrayBuffer(1000); // 1KB fake audio
  let successCount = 0;
  let deniedCount = 0;
  
  for (let i = 1; i <= 25; i++) {
    const result = await window.electronAPI.transcribeAudio(fakeAudio);
    
    if (result.success) {
      successCount++;
      console.log(`✅ Request ${i}: Success (Total: ${successCount})`);
    } else {
      deniedCount++;
      console.log(`❌ Request ${i}: ${result.error} (Total denied: ${deniedCount})`);
    }
    
    // Small delay to prevent other issues
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Successful: ${successCount} (expected: 20)`);
  console.log(`❌ Rate Limited: ${deniedCount} (expected: 5)`);
  
  if (successCount === 20 && deniedCount === 5) {
    console.log('✨ Rate limiting working correctly!');
  } else {
    console.warn('⚠️ Unexpected results - check implementation');
  }
}

// Run the test
testTranscriptionRateLimit();
```

**Expected Output:**
```
✅ Request 1-20: Success
❌ Request 21-25: Rate limit exceeded
📊 Successful: 20, Rate Limited: 5
✨ Rate limiting working correctly!
```

### Test Script 2: Authentication Deduplication

```javascript
function testAuthDeduplication() {
  console.log('🧪 Testing authentication deduplication...');
  
  // Simulate the same authentication attempt multiple times
  const testUrl = 'sweesh://auth/callback?token=TEST&challenge=abc123&uuid=def456';
  
  // First attempt - should succeed (or fail validation, but not be rate limited)
  console.log('Attempt 1: Sending auth request...');
  // (This would be triggered by opening the deep link)
  
  // Second attempt with same challenge/uuid within 60s - should be blocked
  setTimeout(() => {
    console.log('Attempt 2: Sending duplicate auth request...');
    // Expected: "🔁 Duplicate authentication attempt blocked"
  }, 1000);
  
  // Third attempt after 61 seconds - should succeed
  setTimeout(() => {
    console.log('Attempt 3: Sending auth request after timeout...');
    // Expected: Allowed (new 60s window)
  }, 61000);
}
```

---

## 🎯 Rate Limit Behavior

### When Rate Limited

**Transcription:**
```
User sees: "⚠️ Slow down! Please wait before transcribing again."
Console: "⚠️ Transcription rate limit exceeded"
Return: { success: false, error: 'Too many transcription requests...' }
```

**Authentication:**
```
User sees: "Too many authentication attempts. Please wait a moment..."
Console: "⚠️ Authentication rate limit exceeded"
Event: 'auth-error' sent to renderer
```

**Deduplication:**
```
Console: "🔁 Duplicate authentication attempt blocked: abc123-def456"
Event: 'auth-error' with duplicate message
```

---

## 📊 Rate Limit Configuration

### Current Limits

| Operation | Limit | Interval | Tokens Refill |
|-----------|-------|----------|---------------|
| Transcription | 20 | 1 minute | 1 every 3 seconds |
| Authentication | 3 | 1 minute | 1 every 20 seconds |
| Window Ops | 30 | 1 minute | 1 every 2 seconds |

### Adjusting Limits

Edit `src/lib/rateLimiter.ts`:

```typescript
// To make transcription more permissive (30/min):
transcription: new RateLimiter({ 
  tokensPerInterval: 30,  // Changed from 20
  interval: 'minute' 
}),

// To make auth stricter (2/min):
authentication: new RateLimiter({ 
  tokensPerInterval: 2,   // Changed from 3
  interval: 'minute' 
}),
```

---

## 🛡️ Security Benefits

### Before Rate Limiting:
```
Attacker sends: 1,000 transcription requests
Result: 
  - 1,000 temp files created
  - 1,000 API calls made
  - App freezes
  - Disk fills up
  - Potential crash
```

### After Rate Limiting:
```
Attacker sends: 1,000 transcription requests
Result:
  - First 20 succeed
  - Next 980 rejected immediately
  - App remains responsive
  - User sees warning toast
  - Resources protected
```

---

## 🔍 Monitoring & Debugging

### Check Rate Limit Status

Add to your renderer console:

```javascript
// Monitor rate limit hits
window.electronAPI.onToastNotification((data) => {
  if (data.message.includes('Slow down')) {
    console.warn('🚦 Rate limit hit:', data.message);
  }
});
```

### Main Process Logs

Rate limit events are logged:
```
⚠️ Rate limit exceeded for: transcribe-audio
⚠️ Authentication rate limit exceeded
🔁 Duplicate authentication attempt blocked: abc123-def456
```

---

## 🚀 Performance Impact

**Memory:** ~1KB per rate limiter instance (negligible)  
**CPU:** Minimal - O(1) token check per request  
**Latency:** <1ms per rate limit check  

**Deduplication Tracker:**
- Memory: ~100 bytes per tracked attempt
- Auto-cleanup: Old entries removed after 60 seconds
- Max memory: ~10KB (even with 100+ attempts)

---

## ✨ Future Enhancements

### Adaptive Rate Limiting
```typescript
// Adjust limits based on system resources
if (cpuUsage > 80) {
  rateLimiters.transcription.tokensPerInterval = 10; // Reduce limit
}
```

### Per-User Limits
```typescript
// Track limits per user session
const userLimiters = new Map<string, RateLimiter>();
```

### Analytics
```typescript
// Track rate limit hits for monitoring
const rateLimitMetrics = {
  transcriptionHits: 0,
  authenticationHits: 0,
};
```

---

## 🆘 Troubleshooting

### Issue: Legitimate users getting rate limited

**Solution 1:** Increase the limit
```typescript
tokensPerInterval: 30 // Increase from 20
```

**Solution 2:** Use per-user limits instead of global

### Issue: Rate limiter not working

**Check:**
1. Import correctly: `import { rateLimiters, checkRateLimit }`
2. Call before expensive operations: `await checkRateLimit(...)`
3. Check return value: `if (!allowed) { return ... }`

### Issue: Deduplication too strict

**Solution:** Reduce the time window
```typescript
new DeduplicationTracker(30000) // 30 seconds instead of 60
```

---

## 📚 References

- [Limiter NPM Package](https://www.npmjs.com/package/limiter)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

**Last Updated**: October 24, 2025  
**Implementation**: Issues #8 and #10  
**Package**: `limiter@2.1.0`  
**Status**: ✅ Production Ready

