# Release Notes - Sweesh v1.4.3

**Release Date:** October 24, 2025

## 🎉 Major Update: Cross-Platform Support!

This is a **major milestone** release that brings Sweesh to **macOS and Linux** users! Your voice transcription app is no longer Windows-only.

---

## ✨ What's New

### 🍎 macOS Support (MAJOR FEATURE)
- **Full macOS compatibility** for macOS 10.13 (High Sierra) and later
- **Universal builds** supporting both Intel x64 and Apple Silicon (M1/M2/M3)
- **Native macOS integration:**
  - System Keychain for API key storage
  - macOS-specific permissions handling
  - Global keyboard shortcuts using macOS APIs
  - System tray integration with macOS menu bar

### 🐧 Linux Support (Experimental)
- **AppImage format** for universal Linux compatibility
- **Debian packages** (.deb) for Ubuntu/Debian-based systems
- **X11 environment support** (Wayland not yet supported)

### 🤖 Automated Multi-Platform Builds
- **GitHub Actions CI/CD** for automatic builds on all platforms
- **Quality assurance** with automated testing on macOS, Windows, and Linux
- **Streamlined releases** with one-click multi-platform publishing

### 🏗️ Architecture Support
- **Windows:** x64 and x86 (32-bit)
- **macOS:** x64 (Intel) and arm64 (Apple Silicon)
- **Linux:** x64

---

## 📥 Downloads

### Windows Users
Download the Windows installer (unchanged from previous versions):
- **Recommended:** `Sweesh-Setup-1.4.3.exe`
- **Portable:** `Sweesh-1.4.3.zip`

### macOS Users (NEW!)
Choose the right version for your Mac:

| Mac Type | Download | Size | Notes |
|----------|----------|------|-------|
| **Apple Silicon (M1/M2/M3)** | `Sweesh-1.4.3-arm64.dmg` | ~40MB | Optimized for M-series chips |
| **Intel Mac** | `Sweesh-1.4.3-x64.dmg` | ~40MB | For Intel processors |
| **Universal (Any Mac)** | `Sweesh-1.4.3.dmg` | ~80MB | Works on both Intel & Apple Silicon |

### Linux Users (NEW! - Experimental)
- **AppImage (Universal):** `Sweesh-1.4.3.AppImage`
- **Debian/Ubuntu:** `Sweesh-1.4.3.deb`

---

## 🔧 Installation Instructions

### Windows (Same as Before)
1. Download `Sweesh-Setup-1.4.3.exe`
2. Run the installer
3. Follow the setup wizard
4. Launch from Start Menu

### macOS (NEW!)

#### First-Time Setup
1. Download the appropriate `.dmg` file for your Mac
2. Open the DMG file
3. Drag **Sweesh.app** to your **Applications** folder
4. **Important:** Right-click on Sweesh.app → Select **"Open"**
   - This bypasses the Gatekeeper warning for unsigned apps
   - Click **"Open"** in the security dialog

#### Grant Required Permissions
Sweesh needs two permissions to work properly:

**1. Microphone Access** (for voice recording)
- A prompt will appear automatically on first recording
- Or go to: **System Preferences → Security & Privacy → Privacy → Microphone**
- Check the box for **"Sweesh"**

**2. Accessibility Access** (for global keyboard shortcuts)
- Go to: **System Preferences → Security & Privacy → Privacy → Accessibility**
- Click the 🔒 lock icon to make changes
- Click the **"+"** button
- Navigate to Applications and add **Sweesh.app**
- Check the box for **"Sweesh"**

#### Troubleshooting macOS
See the comprehensive [MACOS_SUPPORT.md](MACOS_SUPPORT.md) guide for:
- Common issues and solutions
- Permission troubleshooting
- Build instructions
- Code signing information

### Linux (Experimental)

#### AppImage
```bash
# Make it executable
chmod +x Sweesh-1.4.3.AppImage

# Run it
./Sweesh-1.4.3.AppImage
```

#### Debian/Ubuntu
```bash
sudo dpkg -i Sweesh-1.4.3.deb
```

**Note:** Linux support is experimental. Please report issues!

---

## 🆕 Changes & Improvements

### New Files
- ✅ `entitlements.mac.plist` - macOS permission definitions
- ✅ `.github/workflows/release.yml` - Multi-platform build automation
- ✅ `.github/workflows/test-build.yml` - Continuous integration testing
- ✅ `MACOS_SUPPORT.md` - Comprehensive macOS documentation
- ✅ `scripts/generate-macos-icon.sh` - Icon generation utility

### Updated Files
- ✅ `package.json` - Enhanced build configurations for all platforms
- ✅ `README.md` - Updated with cross-platform installation instructions
- ✅ Platform-specific code already supports macOS (no changes needed!)

### Technical Improvements
- ✅ **Electron 38.4.0** - Latest stable version with full cross-platform support
- ✅ **Multi-architecture builds** - Separate optimized builds for each platform
- ✅ **Automated icon generation** - .icns files auto-generated during builds
- ✅ **Enhanced security** - Platform-specific encryption (Keychain on macOS, DPAPI on Windows)

---

## 🔒 Security

All existing security features work across all platforms:

- ✅ **OS-level encryption:**
  - Windows: DPAPI (Data Protection API)
  - macOS: Keychain
  - Linux: libsecret (with AES-256-CBC fallback)
  
- ✅ **Comprehensive security logging** (10+ event types)
- ✅ **Rate limiting** (20 req/min transcription, 3 req/min auth)
- ✅ **JWT validation** with JWKS
- ✅ **Command injection prevention**
- ✅ **URL validation system**

---

## 📊 Compatibility

### Minimum Requirements

| Platform | Version | Architecture |
|----------|---------|--------------|
| **Windows** | 10/11 | x64, x86 |
| **macOS** | 10.13+ (High Sierra) | x64, arm64 |
| **Linux** | Ubuntu 18.04+ or equivalent | x64 |

### Tested Platforms
- ✅ Windows 10 (x64)
- ✅ Windows 11 (x64)
- ✅ macOS 14 Sonoma (Apple Silicon) - via GitHub Actions
- ✅ macOS 13 Ventura (Intel) - via GitHub Actions
- ⚠️ Linux (Ubuntu 22.04) - Experimental

---

## 🐛 Known Issues

### All Platforms
- Auto-updater only works in packaged (production) builds
- Development mode skips update checks

### macOS-Specific
- **Unsigned builds** show Gatekeeper warning
  - **Workaround:** Right-click → Open
  - **Long-term fix:** Code signing (requires Apple Developer account)
  
- **Accessibility permission** must be granted manually
  - Required for global keyboard shortcuts
  - No automatic prompt
  - Users must go to System Preferences
  
- **First launch delay** (30-60 seconds)
  - macOS scans the app for security
  - Only happens once per version
  - Normal macOS behavior

### Linux-Specific
- **X11 only** - Wayland not yet supported
- **Experimental status** - May have undiscovered issues
- **Community support** - Please report bugs!

---

## 🔄 Migration Guide

### Upgrading from v1.4.2 (Windows Users)
- ✅ No changes required
- ✅ All settings and transcriptions preserved
- ✅ Install as usual

### First-Time macOS Users
- Follow the macOS installation instructions above
- Set up your Groq API key in Settings
- Complete the onboarding flow
- Grant required permissions

---

## 📝 Version History

- **v1.4.3** (Current) - October 24, 2025
  - ✨ macOS support (Intel & Apple Silicon)
  - ✨ Linux support (experimental)
  - ✨ Multi-platform automated builds
  - ✨ Enhanced cross-platform documentation
  
- **v1.4.2** - October 24, 2025
  - UI cleanup: Removed F12 reference
  
- **v1.4.1** - October 24, 2025
  - Fixed security logger initialization
  - Implemented electron-updater
  
- **v1.4.0** - October 2025
  - Major security update
  - Comprehensive security logging
  - Rate limiting implementation

---

## 🚀 What's Next?

### Planned for v1.5.0
- [ ] macOS code signing and notarization
- [ ] Auto-updates for macOS
- [ ] Improved Linux support (Wayland)
- [ ] Custom keyboard shortcuts configuration UI
- [ ] Multi-language transcription support
- [ ] Export transcriptions (TXT, MD, JSON)

### Future Features
- [ ] Real-time security dashboard
- [ ] SIEM integration for enterprise
- [ ] ML-based anomaly detection
- [ ] Geographic IP analysis

---

## 🙏 Credits

**Developed by:** Hasin Raiyan  
**License:** Proprietary - All rights reserved  
**Website:** [hasin.vercel.app](https://hasin.vercel.app)

**Special Thanks:**
- Groq team for the fast Whisper API
- Electron community for cross-platform support
- node-global-key-listener maintainers
- All beta testers and early adopters

---

## 📞 Support & Feedback

### For Issues or Questions
1. Check the [README.md](README.md)
2. Check [MACOS_SUPPORT.md](MACOS_SUPPORT.md) (macOS users)
3. Search existing [GitHub Issues](https://github.com/hasin-codes/sweesh.exe/issues)
4. Open a new issue with:
   - Your OS (Windows/macOS/Linux) and version
   - App version (1.4.3)
   - Processor type (for macOS: Intel/Apple Silicon)
   - Detailed steps to reproduce

### Community
- Report bugs on GitHub Issues
- Share feedback and suggestions
- Help test new platforms
- Contribute to documentation

---

## 📜 License

Copyright (c) 2025 Hasin Raiyan. All rights reserved.

This software and associated documentation files (the "Software") are proprietary. Unauthorized copying, modification, distribution, or use of the Software is strictly prohibited.

---

<div align="center">

### 🎉 Enjoy Sweesh on Your Platform of Choice!

**Windows** | **macOS** | **Linux**

Made with ❤️ by [Hasin Raiyan](https://hasin.vercel.app)

© 2025 Sweesh. All rights reserved.

</div>

