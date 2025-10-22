# Sweesh v1.1.2 Release Notes

**Release Date:** October 22, 2025

## 🔧 Critical Bug Fixes

### Auto-Updater Fix
- **Fixed update installation blocking**: Updates now install correctly without leaving zombie processes
- **Force quit mechanism**: Implemented proper force quit that kills all Electron processes (all 5 tasks) when exiting from system tray
- **Pending update detection**: App now checks for pending installers on startup and installs them automatically
- **Improved cleanup**: Enhanced cleanup routines to ensure all windows and listeners are properly destroyed on exit

### Installation Process
- **Automatic installer launch**: If a pending update is detected in `C:\Users\[User]\AppData\Local\sweesh-updater\pending\`, the installer launches automatically on next startup
- **Process termination**: All app processes are now properly terminated before update installation begins
- **No manual intervention needed**: Users no longer need to manually end tasks in Task Manager for updates to install

## 🎯 Technical Improvements

### Process Management
- Created `forceQuitApp()` function for complete app termination
- Added `checkAndInstallPendingUpdate()` that runs on app startup
- Enhanced `quitAndInstall` handler with proper window destruction
- Improved `will-quit` event handler for better cleanup

### Exit Behavior
- Changed tray "Exit" button from `app.quit()` to `forceQuitApp()`
- All windows are now destroyed (not just hidden) on exit
- Keyboard listener properly killed on exit
- All shortcuts unregistered before quitting

## 📝 Previous Updates (from v1.1.1)

### UI/UX Improvements
- Optimized onboarding modal for 1366×768 screens
- Compact spacing and unified API key setup
- White action buttons with hover effects
- Blue Groq Console link for better visibility
- Removed skip functionality from onboarding

### Bug Fixes from v1.1.1
- Fixed first-time recording bug after app startup
- Fixed external links to open in default browser
- Better toast positioning to prevent overlap with titlebar

---

**Full Changelog**: https://github.com/hasin-codes/sweesh.exe/compare/v1.1.1...v1.1.2

