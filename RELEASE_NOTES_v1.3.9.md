# Sweesh v1.3.9 Release Notes

**Release Date:** October 23, 2025

## 🎨 Major UI/UX Improvements

### Update Required Modal - Complete Redesign
- **Modern Design**: Brand new update modal with clean, centered layout and backdrop blur
- **Visual Instructions**: Three-step visual guide using instruction images from system tray
- **Custom Font**: Full integration of EditorsNote font throughout the modal
- **Escape Key Support**: Close modal easily with Escape key
- **Manual Download Option**: Added alternative download link to sweesh.vercel.app for manual updates

### New Modal Components
- **Notification Modal**: Enhanced notification system for in-app alerts
- **Profile Modal**: User profile management interface
- **Update Required Modal**: Dedicated modal for update instructions with visual guides

## 🔧 Technical Improvements

### Enhanced Update Detection System
- **Simplified Update Flow**: Removed electron-updater dependency for reliability
- **Pending Directory Detection**: Checks for pending updates in dedicated folder on app startup
- **Version Comparison**: Uses semver to compare installer version with current app version
- **Smart Modal Triggering**: Automatically shows update modal only when newer version is detected

### Developer Experience
- **Comprehensive Console Logging**: Emoji-prefixed logs for easy debugging
  - 🔍 Checking for updates
  - ⬇️ Downloading update
  - ✅ Update downloaded/found
  - 🔔 Modal decision logs
  - ℹ️ Info messages
  - ❌ Error occurred
  - 📦 Update status changed

### Build Configuration
- **Windows-Only Release**: Optimized release script to build only for Windows
- Removed unnecessary macOS and Linux builds from release process
- Faster build and deployment times

## 🐛 Bug Fixes
- **CRITICAL**: Removed orphaned auto-updater methods from preload.ts and electron.d.ts that prevented app startup
- Fixed IPC handler mismatch between main process and renderer process
- Added missing `skipOnboarding` method to preload bridge
- Enhanced error handling for update failures
- Better window state validation before update operations

## 📦 Component Updates

### Modified Files
- `package.json` - Version bumped to 1.3.9, Windows-only release script
- `src/components/ui/update-required-modal.tsx` - Complete redesign with new UI
- `src/renderer/App.tsx` - Enhanced update detection and console logging
- `src/components/layout/sidebar.tsx` - UI improvements
- `src/components/ui/notification-modal.tsx` - Notification system implementation
- `src/components/ui/settings-modal.tsx` - Settings enhancements
- `src/components/ui/transcription-modal.tsx` - Modal improvements
- `src/main.ts` - Update logic improvements, removed auto-updater
- `src/preload.ts` - **FIXED**: Removed orphaned auto-updater methods, added skipOnboarding
- `src/types/electron.d.ts` - **FIXED**: Updated type definitions to match actual IPC handlers
- `RELEASE_NOTES_v1.3.9.md` - Updated to reflect actual changes

### New Files Added
- `src/components/ui/notification-modal.tsx` - New notification system
- `src/components/ui/profile-modal.tsx` - User profile management
- `public/Instruction/Step 1.png` - Update instruction visual
- `public/Instruction/Step 2.png` - Update instruction visual
- `public/Instruction/Step 3.png` - Update instruction visual

## 🎯 Update Flow

1. **Automatic Detection**: App checks for updates on startup and periodically
2. **Background Download**: Updates download automatically in the background
3. **User Notification**: Update Required Modal appears when ready
4. **Clear Instructions**: Visual 3-step guide shows how to complete installation
5. **Alternative Option**: Manual download link for troubleshooting

## 🔍 Debugging Updates

Check console for detailed update status:
- Modal shows when: `🔔 Update Required Modal: NEEDED`
- Modal skips when: `🔔 Update Required Modal: NOT NEEDED`
- Full status tracking for all update phases

---

## Installation

Download the latest installer:
- **Windows**: `Sweesh-Setup-1.3.9.exe`

The app will automatically check for updates and guide you through the installation process with visual instructions.

---

## Previous Versions
- [v1.3.0](./RELEASE_NOTES_v1.3.0.md) - Titlebar and sidebar improvements

---

**Full Changelog**: https://github.com/hasin-codes/sweesh.exe/compare/v1.3.0...v1.3.9

---

## Notes

This release focuses on improving the update experience with better visual feedback and more reliable update detection. The new Update Required Modal provides clear, step-by-step instructions to ensure users can easily install updates.

For support or issues, visit [sweesh.vercel.app](https://sweesh.vercel.app)
