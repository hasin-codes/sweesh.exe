# 🍎 macOS Support Guide

## Overview

As of version 1.4.3, Sweesh fully supports macOS alongside Windows. This document covers everything you need to know about building, distributing, and troubleshooting the macOS version.

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Building for macOS](#building-for-macos)
3. [Required Files](#required-files)
4. [Permissions & Entitlements](#permissions--entitlements)
5. [Distribution](#distribution)
6. [Troubleshooting](#troubleshooting)
7. [Known Limitations](#known-limitations)

---

## System Requirements

### Development
- **macOS 10.13+** (High Sierra or later) for local builds
- **Node.js 18+**
- **Xcode Command Line Tools** (on macOS): `xcode-select --install`
- **ImageMagick** (optional, for icon generation): `brew install imagemagick`

### User Requirements
- **macOS 10.13+** (High Sierra or later)
- **Intel x64** or **Apple Silicon (M1/M2/M3)** processor
- **~200MB** disk space
- **Microphone** for voice recording
- **Internet connection** for transcription (Groq API)

---

## Building for macOS

### Method 1: Using GitHub Actions (Recommended - No Mac Needed!)

The easiest way to build for macOS is using GitHub Actions, which provides free macOS build servers:

1. **Push a version tag:**
   ```bash
   npm version patch  # or minor, or major
   git push origin --tags
   ```

2. **Wait for builds to complete** (~15-20 minutes)
   - Go to your repository → Actions tab
   - Watch the "Build & Release" workflow

3. **Download from Releases**
   - Artifacts will be automatically uploaded to GitHub Releases
   - Look for `.dmg` files

### Method 2: Local Build (Requires macOS)

```bash
# Generate the .icns icon (first time only)
chmod +x scripts/generate-macos-icon.sh
./scripts/generate-macos-icon.sh

# Build for macOS
npm run dist:mac

# Output will be in dist/
# - Sweesh-1.4.3.dmg (universal)
# - Sweesh-1.4.3-arm64.dmg (Apple Silicon)
# - Sweesh-1.4.3-x64.dmg (Intel)
# - Sweesh-1.4.3-mac.zip
```

---

## Required Files

### 1. `entitlements.mac.plist`

**Location:** Project root  
**Status:** ✅ Already created

This file defines the permissions your app needs on macOS:

- `com.apple.security.device.audio-input` - Microphone access
- `com.apple.security.automation.apple-events` - Global shortcuts
- `com.apple.security.personal-information.accessibility` - System-wide keyboard listening

### 2. `public/icons/logo.icns`

**Location:** `public/icons/logo.icns`  
**Status:** ⚠️ Needs to be generated

**Three ways to create it:**

#### Option A: Use the provided script (macOS or Linux with ImageMagick)
```bash
chmod +x scripts/generate-macos-icon.sh
./scripts/generate-macos-icon.sh
```

#### Option B: Online converter
1. Go to https://cloudconvert.com/png-to-icns
2. Upload `public/icons/logo.png`
3. Download `logo.icns`
4. Place in `public/icons/`

#### Option C: GitHub Actions will auto-generate
If `logo.icns` is missing, the GitHub Actions workflow will automatically generate it during the build process.

---

## Permissions & Entitlements

### What Users Will See

On first launch, macOS users will need to grant two permissions:

#### 1. Microphone Permission
**Prompt:** "Sweesh would like to access the microphone"

**Why:** Required for voice recording

**How to grant manually:**
```
System Preferences → Security & Privacy → Privacy → Microphone
→ Check "Sweesh"
```

#### 2. Accessibility Permission
**Prompt:** May not appear automatically

**Why:** Required for global keyboard shortcuts (Ctrl+Shift+M, Alt+Shift+M)

**How to grant manually:**
```
System Preferences → Security & Privacy → Privacy → Accessibility
→ Click 🔒 to unlock
→ Click "+" and add Sweesh.app
→ Check "Sweesh"
```

### Gatekeeper Warning

Since the app is not code-signed (unsigned builds), users will see:

> "Sweesh.app" cannot be opened because the developer cannot be verified.

**Solution for Users:**
1. Right-click on Sweesh.app
2. Select "Open"
3. Click "Open" in the dialog

**Long-term Solution:** Get an Apple Developer account ($99/year) and code-sign the app.

---

## Distribution

### Build Artifacts

Each macOS build creates:

| File | Description | Size | Architecture |
|------|-------------|------|--------------|
| `Sweesh-1.4.3.dmg` | Universal installer | ~80MB | Intel + Apple Silicon |
| `Sweesh-1.4.3-arm64.dmg` | Apple Silicon only | ~40MB | M1/M2/M3 |
| `Sweesh-1.4.3-x64.dmg` | Intel only | ~40MB | Intel x64 |
| `Sweesh-1.4.3-mac.zip` | Portable version | ~80MB | Universal |

### Which File to Recommend?

**For most users:** `Sweesh-1.4.3.dmg` (universal)  
**For M1/M2/M3 Macs:** `Sweesh-1.4.3-arm64.dmg` (smaller, optimized)  
**For Intel Macs:** `Sweesh-1.4.3-x64.dmg`

### Release Notes Template

```markdown
## macOS Users

**Apple Silicon (M1/M2/M3):** Download `Sweesh-1.4.3-arm64.dmg`  
**Intel Macs:** Download `Sweesh-1.4.3-x64.dmg`  
**Universal:** Download `Sweesh-1.4.3.dmg`

### First-Time Setup
1. Open the DMG file
2. Drag Sweesh to Applications
3. Right-click Sweesh → Open (bypass Gatekeeper)
4. Grant Microphone permission
5. Grant Accessibility permission (System Preferences → Security & Privacy → Privacy → Accessibility)
```

---

## Troubleshooting

### Issue: "App is damaged and can't be opened"

**Cause:** Gatekeeper quarantine attribute

**Solution:**
```bash
xattr -cr /Applications/Sweesh.app
```

Then try opening again.

---

### Issue: Global shortcuts don't work

**Cause:** Accessibility permission not granted

**Solution:**
1. System Preferences → Security & Privacy
2. Privacy → Accessibility
3. Click 🔒 to unlock
4. Add Sweesh.app
5. Restart Sweesh

---

### Issue: Microphone not working

**Cause:** Microphone permission not granted

**Solution:**
1. System Preferences → Security & Privacy
2. Privacy → Microphone
3. Check "Sweesh"
4. Restart Sweesh if needed

---

### Issue: "logo.icns not found" during build

**Cause:** Icon file hasn't been generated

**Solution:**
```bash
# Option 1: Run the generation script
./scripts/generate-macos-icon.sh

# Option 2: Let GitHub Actions generate it automatically
git push origin --tags
```

---

### Issue: Build fails with "xcode-select: error"

**Cause:** Xcode Command Line Tools not installed

**Solution:**
```bash
xcode-select --install
```

---

### Issue: "Cannot find module 'electron-builder'"

**Cause:** Dependencies not installed

**Solution:**
```bash
npm clean-install
npm run dist:mac
```

---

## Known Limitations

### 1. Unsigned Builds
**Impact:** Users see Gatekeeper warning  
**Workaround:** Right-click → Open  
**Long-term Fix:** Apple Developer account + code signing

### 2. No Auto-Updates (Yet)
**Impact:** electron-updater requires code signing for macOS  
**Workaround:** Manual updates  
**Long-term Fix:** Implement code signing

### 3. Accessibility Permission Required
**Impact:** Users must manually grant permission for global shortcuts  
**Workaround:** Clear documentation  
**Alternative:** None - required by macOS for system-wide keyboard hooks

### 4. First Launch Delay
**Impact:** macOS scans the app on first launch (may take 30-60 seconds)  
**Workaround:** None - normal macOS behavior  
**Note:** Only happens once per app version

---

## Code Signing (Optional - For Production)

If you want to distribute via the Mac App Store or avoid Gatekeeper warnings:

### Requirements
- Apple Developer Account ($99/year)
- Developer ID Application certificate
- Provisioning profile

### Steps

1. **Get Apple Developer Account**
   - Sign up at https://developer.apple.com

2. **Create Certificates**
   - Xcode → Preferences → Accounts → Manage Certificates
   - Create "Developer ID Application" certificate

3. **Update package.json**
   ```json
   "mac": {
     "identity": "Developer ID Application: Your Name (TEAM_ID)",
     "notarize": {
       "teamId": "YOUR_TEAM_ID"
     }
   }
   ```

4. **Add environment variables (GitHub Actions)**
   ```yaml
   env:
     APPLE_ID: ${{ secrets.APPLE_ID }}
     APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
     APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
   ```

5. **Build**
   ```bash
   npm run dist:mac
   ```

The app will be automatically signed and notarized.

---

## Testing Checklist

Before releasing a macOS build, test:

- [ ] App launches without errors
- [ ] Microphone permission prompt appears
- [ ] Microphone recording works
- [ ] Global shortcuts work (Ctrl+Shift+M, Alt+Shift+M, F12)
- [ ] Accessibility permission can be granted
- [ ] Transcription works (Groq API connection)
- [ ] Clipboard auto-copy works
- [ ] Settings save/persist
- [ ] Authentication works
- [ ] System tray icon appears
- [ ] App survives restart
- [ ] Both Intel and Apple Silicon versions work

---

## Platform-Specific Code

The codebase already handles macOS-specific paths and behaviors:

### User Data Directories
```typescript
// Windows: C:\Users\<user>\AppData\Roaming\Sweesh
// macOS:   /Users/<user>/Library/Application Support/Sweesh
app.getPath('userData')
```

### Startup on Boot
```typescript
// macOS uses AppleScript for login items
if (process.platform === 'darwin') {
  execFile('osascript', ['-e', script], ...)
}
```

### Encryption
```typescript
// macOS uses Keychain via safeStorage
safeStorage.encryptString(apiKey)  // Uses Keychain on macOS
```

---

## Resources

- **Electron Documentation:** https://www.electronjs.org/docs/latest/tutorial/macos-specific-issues
- **electron-builder macOS:** https://www.electron.build/configuration/mac
- **Apple Developer:** https://developer.apple.com/
- **Code Signing Guide:** https://www.electron.build/code-signing

---

## Support

For macOS-specific issues:

1. Check this guide
2. Check the main [README.md](README.md)
3. Open an issue on GitHub with:
   - macOS version
   - Processor type (Intel/Apple Silicon)
   - App version
   - Steps to reproduce

---

**Last Updated:** October 24, 2025  
**App Version:** 1.4.3+

