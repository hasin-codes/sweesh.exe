# Sweesh v1.2.1 Release Notes

**Release Date:** October 22, 2025

## 🚀 Major Feature: Forced Auto-Update System

This release introduces a comprehensive **forced auto-update system** that automatically detects, installs, and restarts the app with newer versions on startup - ensuring users always have the latest features and fixes.

---

## ✨ New Features

### Automatic Update Installation
- **Smart Version Detection**: Automatically detects installer files in the pending directory
- **Semantic Version Comparison**: Uses semver to properly compare versions (e.g., 1.2.1 > 1.1.2)
- **Silent Installation**: Installers run silently in the background with no user interaction required
- **Update Modal**: Beautiful dark-themed modal shows update progress with animated progress bar
- **Process Management**: Cleanly kills all app processes before updating to prevent conflicts
- **Comprehensive Logging**: All update operations logged to `C:\Users\{Username}\AppData\Local\sweesh-updater\update.log`

### Update Detection Flow
```
App Startup → Check Pending Directory → Found Newer Version? 
→ Show Update Modal (3s) → Kill Processes → Install → Restart
```

### Update Notification System
- **Sidebar Update Icon**: Orange download icon with pulsing dot when updates are available
- **Manual Installation**: Users can click the update icon to manually trigger installation
- **Dual System**: Both automatic (on startup) and manual (via sidebar) update methods work together

---

## 🔧 Technical Improvements

### Auto-Updater Module (`src/main/autoUpdater.ts`)
- New dedicated module for handling forced auto-updates
- Parses installer filenames to extract version numbers
- Finds the newest installer if multiple versions exist
- Launches installers with `/S` flag for NSIS silent installation
- Error handling with graceful fallback to normal app start

### Update Modal Component (`src/components/ui/update-modal.tsx`)
- Modern dark-themed UI matching app design
- Shows version being installed
- 3-second animated progress bar
- Automatically closes after installation begins

### Development Mode Improvements
- Standard auto-updater disabled in development (no more ENOENT errors)
- Forced auto-update from pending folder enabled for testing
- Better development experience with proper error handling

---

## 🐛 Bug Fixes

### Auto-Update Configuration
- Fixed `dev-app-update.yml` missing file error in development mode
- Disabled standard auto-updater checks in development
- Enabled pending directory checks for both dev and production modes

### Process Management
- Improved process cleanup before updates
- Enhanced force quit functionality for clean exits
- Better window destruction during update installation

---

## 📁 Update Directory Structure

Updates are stored in:
```
C:\Users\{Username}\AppData\Local\sweesh-updater\pending\
```

Installer filename format:
```
Sweesh-Setup-X.Y.Z.exe
```

---

## 🔄 Update Behavior

### On App Startup
1. Check for installer in pending directory
2. Parse filename to extract version
3. Compare with current version (1.2.1)
4. If newer version found:
   - Show update modal for 3 seconds
   - Kill all Sweesh processes
   - Launch installer silently
   - Exit current app
   - Installer runs → Replaces old version → Launches new version

### Sidebar Update Icon
- Checks for pending updates every 30 seconds
- Orange icon with pulsing dot when update available
- Click to manually install update
- Confirmation dialog before installation

---

## 📦 Dependencies

### New Dependencies
- **semver** (^7.x): Semantic version comparison for proper update detection
- **@types/semver**: TypeScript types for semver

---

## 🛠️ Development Changes

### New Files
- `src/main/autoUpdater.ts`: Core auto-update module
- `src/components/ui/update-modal.tsx`: Update progress modal component
- `RELEASE_NOTES_v1.2.1.md`: This file

### Modified Files
- `src/main.ts`: Integrated auto-updater on startup
- `src/preload.ts`: Added `onUpdateStarting` IPC channel
- `src/types/electron.d.ts`: Added update modal event type
- `src/renderer/App.tsx`: Added update modal listener and rendering
- `package.json`: Updated version to 1.2.1, added semver dependency

---

## 📊 Version Information

- **Previous Version**: 1.1.2
- **Current Version**: 1.2.1
- **Build Date**: October 22, 2025

---

## 🧪 Testing

### Test Scenarios Covered
✅ No update available - app starts normally  
✅ Same version in pending - skips update  
✅ Newer version in pending - triggers update  
✅ Multiple installers - selects newest  
✅ Invalid filename - graceful handling  
✅ Missing pending directory - creates it  
✅ Process cleanup - all processes killed before update  
✅ Silent installation - installer runs without UI  
✅ Error handling - app starts normally on update failure  

---

## 📝 Notes

- Updates are checked on every app startup
- Sidebar also checks for updates every 30 seconds
- Both automatic and manual update methods available
- All update operations logged for debugging
- Silent installation ensures seamless user experience

---

## 🔐 Security

- Installer files validated before execution
- Version comparison prevents downgrade attacks
- Comprehensive logging for audit trails
- Proper error handling prevents malicious file execution

---

## 🎯 What's Next

Future enhancements may include:
- Digital signature verification for installers
- Checksum validation (SHA-256)
- Update rollback mechanism
- Update download progress indicator
- Configurable update check intervals

---

**For support or questions, please visit our GitHub repository.**

