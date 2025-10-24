# Where Are My Logs? 🔍

## Quick Answer

All your Sweesh logs are stored in:

```
C:\Users\<YourUsername>\AppData\Roaming\Sweesh\logs\
```

**To access quickly:**
1. Press `Windows + R`
2. Type: `%APPDATA%\Sweesh\logs`
3. Press Enter

---

## Log Files

### 1. Security Logs (`security.log`)
**Purpose:** Records all security-related events

**Location:**
```
C:\Users\<YourUsername>\AppData\Roaming\Sweesh\logs\security.log
```

**What's logged:**
- Authentication attempts and failures
- Rate limit violations (when you try to transcribe too fast)
- API key validation
- Suspicious activity detection
- URL validation
- Command injection attempts

**Example log entry:**
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

---

### 2. Security Alerts (`security-alerts.log`)
**Purpose:** Only CRITICAL and ALERT level security events

**Location:**
```
C:\Users\<YourUsername>\AppData\Roaming\Sweesh\logs\security-alerts.log
```

**What's logged:**
- JWT validation failures
- Unauthorized access attempts
- Command injection attempts
- Suspicious pattern alerts (when multiple security events occur rapidly)

---

### 3. Auto-Updater Logs (`updater.log`)
**Purpose:** Tracks update checks, downloads, and installations

**Location:**
```
C:\Users\<YourUsername>\AppData\Roaming\Sweesh\logs\updater.log
```

**What's logged:**
- Update check results
- Download progress
- Installation status
- Errors during update process

**Example log entries:**
```
[2025-10-24T12:00:00.000Z] Setting up auto-updater...
[2025-10-24T12:00:03.000Z] Initiating update check...
[2025-10-24T12:00:03.500Z] [INFO] Checking for updates from GitHub...
[2025-10-24T12:00:04.200Z] [INFO] Update available: 1.4.1
[2025-10-24T12:00:05.000Z] [INFO] Download speed: 2097152 - Downloaded 5% (524288/10485760)
[2025-10-24T12:00:10.000Z] [INFO] Download speed: 2097152 - Downloaded 100% (10485760/10485760)
[2025-10-24T12:00:11.000Z] Update downloaded: 1.4.1
[2025-10-24T12:00:11.100Z] Update will be installed on app restart
```

---

## How to View Logs

### Method 1: File Explorer
1. Open File Explorer
2. Navigate to `C:\Users\<YourUsername>\AppData\Roaming\Sweesh\logs\`
3. Double-click any `.log` file to open in Notepad

### Method 2: Run Dialog (Fastest)
1. Press `Windows + R`
2. Type: `notepad %APPDATA%\Sweesh\logs\security.log`
3. Press Enter

### Method 3: Command Line
```bash
# View security log
type "%APPDATA%\Sweesh\logs\security.log"

# View updater log
type "%APPDATA%\Sweesh\logs\updater.log"

# View alerts log
type "%APPDATA%\Sweesh\logs\security-alerts.log"
```

### Method 4: PowerShell (with real-time monitoring)
```powershell
# Monitor security log in real-time
Get-Content "$env:APPDATA\Sweesh\logs\security.log" -Wait

# Monitor updater log in real-time
Get-Content "$env:APPDATA\Sweesh\logs\updater.log" -Wait
```

---

## Log Rotation

**Security logs** are automatically rotated when they exceed **10 MB**:
- Old log is renamed to `security.log.1234567890` (timestamp)
- New `security.log` file is created
- No logs are deleted automatically

---

## Common Questions

### Q: Why are my logs empty?

**A:** Logs are only created when relevant events occur:
- **Security log:** Only when security events happen (rate limits, auth failures, etc.)
- **Updater log:** Only when update checks are performed
- If the app is working normally with no issues, logs may be minimal

### Q: How do I clear old logs?

**A:** You can safely delete log files from:
```
C:\Users\<YourUsername>\AppData\Roaming\Sweesh\logs\
```
New logs will be created automatically when needed.

### Q: Can I change the log location?

**A:** Not currently. Logs are stored in the standard AppData location for the app.

### Q: Why do I see "Security logger not initialized" messages?

**A:** This should only appear briefly at app startup. If you see this frequently, there may be a timing issue. Check the app console logs.

---

## Troubleshooting

### Security logs not appearing?

1. **Check if the directory exists:**
   ```
   C:\Users\<YourUsername>\AppData\Roaming\Sweesh\logs\
   ```
   If not, the logger hasn't initialized properly.

2. **Check console output:**
   Run the app with console open and look for:
   ```
   Security logger initialized
   ```

3. **Trigger a security event:**
   Try transcribing many times rapidly to trigger a rate limit warning.

### Updater logs not appearing?

1. **Check if app is packaged:**
   Auto-updater only works in production (packaged) builds, not in development mode.

2. **Wait for update check:**
   The app checks for updates 3 seconds after startup.

3. **Check internet connection:**
   The app needs internet to check GitHub for updates.

---

## Log Analysis Tips

### Finding rate limit violations:
```powershell
Select-String -Path "$env:APPDATA\Sweesh\logs\security.log" -Pattern "RATE_LIMIT_EXCEEDED"
```

### Finding authentication issues:
```powershell
Select-String -Path "$env:APPDATA\Sweesh\logs\security.log" -Pattern "AUTH_FAILED"
```

### Finding update checks:
```powershell
Select-String -Path "$env:APPDATA\Sweesh\logs\updater.log" -Pattern "Checking for updates"
```

---

## Summary

- **Security Logs:** `%APPDATA%\Sweesh\logs\security.log`
- **Security Alerts:** `%APPDATA%\Sweesh\logs\security-alerts.log`
- **Updater Logs:** `%APPDATA%\Sweesh\logs\updater.log`

**Quick Access:**
```
Windows + R → %APPDATA%\Sweesh\logs → Enter
```

✅ **All logs are working correctly now!**

