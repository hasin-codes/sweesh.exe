# Release Notes - Sweesh v1.4.2

**Release Date:** October 24, 2025

## 🎯 Minor UI Updates

This is a minor release focused on cleaning up the user interface and removing unnecessary shortcuts.

---

## ✨ Changes

### UI Improvements

**Removed F12 Shortcut Reference**
- Removed "F12" from the keyboard shortcuts display in the main app
- Simplified instructions to show only `Ctrl+Shift+M` and `Alt+Shift+M`
- F12 functionality still works internally but is no longer documented to users

**Simplified About Dialog**
- Removed the "Quick Shortcuts" box from the About dialog
- Cleaner, more focused About page
- Version updated to 1.4.2

### Version Updates
- Updated app version display in titlebar: `v1.4.2`
- Updated About dialog version: `Version 1.4.2`
- Updated package.json version: `1.4.2`

---

## 📦 What's Included

### Core Features (Unchanged)
- ✅ Real-time voice transcription with Groq Whisper API
- ✅ Global keyboard shortcuts: `Ctrl+Shift+M` and `Alt+Shift+M`
- ✅ Automatic clipboard integration
- ✅ Security logging with 10+ event types
- ✅ Rate limiting and threat detection
- ✅ Electron-updater for automatic GitHub updates
- ✅ OS-level encryption for API keys
- ✅ Persistent transcription history

### Technical Stack
- Electron 38.4.0
- React 18 with TypeScript
- Tailwind CSS 4
- Groq SDK (whisper-large-v3)
- electron-updater for auto-updates

---

## 🔧 Technical Details

### Modified Files
- `src/renderer/App.tsx` - Removed F12 reference from UI
- `src/main.ts` - Removed Quick Shortcuts box from About HTML
- `src/components/layout/titlebar.tsx` - Updated version to v1.4.2
- `package.json` - Updated version to 1.4.2

### Build Information
- Build time: ~58 seconds
- Webpack compilation: Successful
- TypeScript compilation: No errors
- Asset size: ~12.5 MB (dist folder)

---

## 📥 Installation

### For New Users
1. Download `Sweesh-Setup-1.4.2.exe` from the release page
2. Run the installer
3. Complete the onboarding flow to set up your Groq API key
4. Start using voice transcription!

### For Existing Users
**Automatic Update:**
- The app will automatically detect and download this update
- Update installs when you close and restart the app
- Your settings and transcriptions are preserved

**Manual Update:**
1. Download `Sweesh-Setup-1.4.2.exe`
2. Run the installer (it will update over your existing installation)
3. Your API key and transcriptions are preserved

---

## 🔒 Security

No security changes in this release. All existing security features remain active:
- ✅ Comprehensive security logging
- ✅ Rate limiting (20 req/min transcription, 3 req/min auth)
- ✅ JWT validation with JWKS
- ✅ OS-level encryption (DPAPI/AES-256-CBC fallback)
- ✅ Command injection prevention
- ✅ URL validation system

---

## 📝 Upgrade Notes

### From v1.4.1 to v1.4.2
- No breaking changes
- No database migrations required
- No configuration changes needed
- All existing features work exactly as before

### Keyboard Shortcuts
While F12 is no longer documented in the UI, it still works internally. The documented shortcuts are:
- `Ctrl+Shift+M` - Hold to record, release to stop
- `Alt+Shift+M` - Hold to record, release to stop

---

## 🐛 Known Issues

No new issues introduced in this release. Existing known issues from v1.4.1:
- Auto-updater only works in packaged (production) builds
- Development mode skips update checks
- Manual update directory still supported for backward compatibility

---

## 📊 Version History

- **v1.4.2** (Current) - October 24, 2025
  - UI cleanup: Removed F12 reference and Quick Shortcuts box
  
- **v1.4.1** - October 24, 2025
  - Fixed security logger initialization
  - Implemented electron-updater for GitHub releases
  - Added comprehensive documentation

- **v1.4.0** - October 2025
  - Major security update
  - Upgraded Electron to v38.4.0
  - Comprehensive security logging system
  - Rate limiting implementation
  - Enhanced authentication security

---

## 🙏 Credits

**Developed by:** Hasin Raiyan
**License:** Proprietary - All rights reserved
**Website:** [hasin.vercel.app](https://hasin.vercel.app)

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section in README.md
2. Visit the GitHub repository
3. Contact via [hasin.vercel.app](https://hasin.vercel.app)

---

<div align="center">
  <p>Made with ❤️ by Hasin Raiyan</p>
  <p>© 2025 Sweesh. All rights reserved.</p>
</div>

