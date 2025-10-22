# Sweesh v1.3.0 Release Notes

**Release Date:** October 22, 2025

## 🎨 UI/UX Improvements

### Titlebar Enhancement
- **Version Display**: Titlebar now shows the current version number (`v1.3.0`) instead of the tagline "Speak it, Send it"
- Provides users with instant visibility of the installed version

### Sidebar Icon Update
- **Notification Bell**: Replaced the Download icon with a Bell icon for update notifications
- More intuitive representation of notification functionality
- Maintains the orange pulsing dot indicator when updates are available

## 🔧 Technical Improvements

### Auto-Update System Refinement
- **Enhanced Window Validation**: Added comprehensive checks to prevent "Object has been destroyed" errors
- **Improved Timing**: Auto-update now waits for window to be fully ready before checking for updates
- **Better Error Handling**: All window interactions wrapped in proper validation checks
- **Graceful Degradation**: If update process fails, app starts normally without crashes

### Bug Fixes
- Fixed race condition where IPC messages were sent to windows before they were ready
- Added try-catch blocks around critical window operations
- Improved main window initialization sequence

## 📝 About Dialog Updates
- Version number updated to 1.3.0 in the About dialog
- Consistent version display across the application

---

## What's Changed

### Files Modified
- `package.json` - Version bumped to 1.3.0
- `src/components/layout/titlebar.tsx` - Version display in titlebar
- `src/components/layout/sidebar.tsx` - Bell icon for notifications
- `src/main.ts` - About dialog version, improved window initialization
- `src/main/autoUpdater.ts` - Enhanced error handling and validation

### Previous Versions
- [v1.2.1](./RELEASE_NOTES_v1.2.1.md) - Forced auto-update system
- [v1.1.0](./RELEASE_NOTES_v1.1.0.md) - Update notification system
- [v1.0.9](./RELEASE_NOTES_v1.0.9.md) - Color scheme and modal improvements

---

## Installation

Download the latest installer:
- **Windows**: `Sweesh-Setup-1.3.0.exe`

The app will automatically check for updates and notify you when new versions are available.

---

**Full Changelog**: https://github.com/your-repo/sweesh/compare/v1.2.1...v1.3.0

