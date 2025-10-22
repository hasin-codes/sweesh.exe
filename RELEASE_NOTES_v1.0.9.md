# Sweesh v1.0.9 Release Notes

**Release Date**: October 22, 2025  
**Full Changelog**: https://github.com/hasin-codes/sweesh.exe/compare/v0.0.5...v1.0.9

---

## 🐛 Bug Fixes

### Critical Fixes
- **Fixed Electron compatibility error** - Resolved `TypeError: safeStorage.getSelectedStorageBackend is not a function` that caused crashes when opening Settings
  - Added backward compatibility for Electron v28 and earlier versions
  - Encryption status checks now work across all Electron versions
  - No more crashes when checking encryption backend

### UI/UX Fixes
- **Fixed toast notifications not displaying** - Toast messages now appear correctly in the top-right corner
  - Increased z-index to 9999 to ensure visibility above all other elements
  - Improved styling with solid colors instead of opacity for better contrast
  - Larger, bolder text for better readability
  - Added minimum width (300px) for consistent appearance

### Developer Experience
- **Added toast debugging** - Console now logs when toast notifications are received
  - Easier to debug notification issues
  - Look for `🍞 Toast received:` messages in DevTools console

---

## ✨ Improvements

### Encryption & Security
- **Better error handling for encryption backend detection**
  - Gracefully falls back to generic status if specific backend can't be determined
  - More robust encryption status reporting in Settings
  - No more console errors related to storage backend checks

### Notifications
- **Enhanced toast notification system**
  - Success toasts: Bright green with white text
  - Warning toasts: Yellow with white text  
  - Error toasts: Red with white text
  - All toasts now have solid backgrounds for maximum visibility
  - 5-second display duration with smooth appearance

---

## 🎯 What Works Now

✅ **Toast notifications display properly** for:
- Transcription success/failure
- API key save confirmation
- Encryption status warnings
- Startup status messages
- Auto-update notifications

✅ **Settings modal** opens without crashing

✅ **Encryption status** displays correctly on all systems

✅ **All Electron versions** (v28+) are now compatible

---

## 🚀 Key Features (Unchanged)

- **Hold-to-talk recording** with global shortcuts (Ctrl+Shift+M, Alt+Shift+M, F12)
- **Automatic clipboard copy** - Paste with Ctrl+V anywhere
- **Secure API key storage** with Windows DPAPI + AES-256 fallback
- **System tray integration** with startup on boot option
- **Auto-updates** - Download and install updates automatically
- **Transcription history** - Persistent storage with search
- **Authentication** - Deep-link OAuth with Clerk

---

## 📊 Technical Details

### Dependencies
- Electron: v28.1.0
- electron-updater: v6.6.2
- electron-log: v5.4.3
- groq-sdk: v0.33.0
- React: v18.2.0

### Platform Support
- Windows 10/11 (x64) ✅
- macOS (planned)
- Linux (planned)

---

## 🔄 Upgrade Notes

### From v0.0.5 → v1.0.9
- **Automatic update** - Just restart the app after download completes
- **No data loss** - All transcriptions, settings, and API keys are preserved
- **No reconfiguration needed** - Settings carry over automatically

### What to Expect
1. Launch v0.0.5
2. App checks for updates (3 seconds after launch)
3. "Update available" notification appears
4. Update downloads in background
5. Quit the app
6. Update installs automatically
7. Launch v1.0.9 - Done! ✅

---

## 🐛 Known Issues

### Minor Issues (Non-blocking)
- **Deprecated crypto warning** - `crypto.createDecipher is deprecated`
  - This is a fallback for systems without OS-level encryption
  - Doesn't affect functionality
  - Will be updated in a future release

### Workarounds Available
None needed - all critical bugs are fixed.

---

## 📝 Installation

### New Users
1. Download `Sweesh Setup 1.0.9.exe` from GitHub Releases
2. Run the installer
3. Complete onboarding with your Groq API key
4. Start recording with Ctrl+Shift+M

### Existing Users
- **Automatic update** when you restart the app
- Or manually download and install v1.0.9

---

## 🔒 Security

### What's Secure
- ✅ API keys encrypted with Windows DPAPI (when available)
- ✅ AES-256-CBC fallback encryption (when DPAPI unavailable)
- ✅ Machine-specific encryption keys
- ✅ No plain-text storage
- ✅ Authentication tokens encrypted

### Privacy
- ✅ No telemetry or tracking
- ✅ No data sent to third parties (except Groq API for transcription)
- ✅ All transcriptions stored locally
- ✅ Open-source codebase

---

## 🎮 Testing Checklist

If you're testing this release, verify:

- [ ] App launches without errors
- [ ] Settings modal opens without crashing
- [ ] Toast notifications appear on transcription success
- [ ] Toast notifications appear when saving API key
- [ ] Encryption status displays in Settings
- [ ] Hold Ctrl+Shift+M to record
- [ ] Transcription appears and copies to clipboard
- [ ] System tray icon works
- [ ] Auto-update check runs on startup

---

## 🙏 Acknowledgments

Thanks to all users who reported the toast notification and settings crash issues!

---

## 📚 Resources

- **GitHub Repository**: https://github.com/hasin-codes/sweesh.exe
- **Issue Tracker**: https://github.com/hasin-codes/sweesh.exe/issues
- **Groq API**: https://console.groq.com
- **Documentation**: See `README.md` in the repository

---

## 🎉 What's Next

### Planned for v1.1.0
- Custom keyboard shortcuts configuration
- Multiple language support for transcription
- Transcription formatting options
- Export transcriptions to file
- macOS and Linux builds

### Future Features
- Local model support (no internet required)
- Real-time streaming transcription
- Speaker diarization
- Custom hotkey configuration UI
- Dark/light theme toggle

---

**Enjoy Sweesh v1.0.9! 🎤✨**

If you encounter any issues, please open a GitHub issue with:
- Windows version
- Sweesh version
- Steps to reproduce
- Screenshots if applicable

