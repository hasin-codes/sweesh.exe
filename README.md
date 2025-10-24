# Sweesh - Voice Transcription Desktop App

<div align="center">
  <img src="public/icons/logo.png" alt="Sweesh Logo" width="64" height="64">
  <h3>Voice Transcription Made Simple</h3>
  <p>An elegant Electron-based desktop application for real-time voice transcription with automatic clipboard integration and beautiful visual effects.</p>
</div>

## 🌟 Features

### Core Functionality
- **Real-time Voice Transcription**: Convert speech to text instantly using Groq's Whisper API (whisper-large-v3 model)
- **Global Keyboard Shortcuts**: Hold `Ctrl+Shift+M`, `Alt+Shift+M`, or `F12` anywhere on your system to start recording
- **Automatic Clipboard Copy**: Every transcription is automatically copied to your system clipboard (works in background)
- **Hold-to-Talk Recording**: Press and hold shortcut keys to record, release to stop
- **Dual Window System**: Main application window and fullscreen transparent recording overlay
- **System Tray Integration**: Minimize to system tray for quick access with startup options
- **Transcription Management**: View, edit, copy, and delete your transcriptions
- **Persistent Storage**: All transcriptions saved locally in encrypted format with automatic loading on startup
- **Auto-Update System**: Automatic update checks and background downloads with seamless installation
- **Cross-platform**: Available for Windows, macOS, and Linux

### First-Run Experience
- **Onboarding Flow**: Guided 2-step setup for new users
- **API Key Configuration**: Secure setup of Groq API key with validation
- **Migration Support**: Automatic migration from legacy `.env` files to secure storage
- **Skip Option**: Users can skip onboarding and configure later via Settings
- **Status Tracking**: Tracks onboarding completion and API key configuration status

### Security & Privacy
- **OS-Level Encryption**: API keys encrypted with system secure storage (Keychain/DPAPI/libsecret)
- **AES-256-CBC Fallback**: Automatic fallback encryption when OS-level encryption unavailable
- **Secure Storage Management**: Complete API key lifecycle management (save, update, delete)
- **Privacy by Design**: API keys never stored in plain text; clipboard operations in main process
- **Encryption Status**: Real-time feedback on encryption method being used
- **Cross-Platform Security**: Platform-specific security implementations with fallbacks
- **Comprehensive Security Logging**: Enterprise-grade monitoring with 10+ security event types
- **Real-time Threat Detection**: Automatic pattern recognition and suspicious activity alerts
- **Rate Limiting Protection**: Multi-layer rate limiting for API calls and authentication
- **JWT Security**: Secure token validation with RS256 algorithm and JWKS verification
- **URL Validation**: Whitelist-based domain validation with dangerous pattern detection
- **Command Injection Prevention**: Secure command execution with argument arrays
- **Deduplication System**: Prevents duplicate authentication attempts and request replay
- **Security Statistics API**: Real-time security metrics and event tracking

### User Interface
- **Modern Dark Theme**: Sleek, professional dark interface with custom typography
- **Custom Titlebar**: Native-looking window controls with app branding
- **Aurora Border Effects**: Beautiful animated borders that respond to real audio levels during recording
- **Transparent Recording Overlay**: Fullscreen transparent window for recording without UI distractions
- **Audio Level Visualization**: Real-time audio level monitoring with visual feedback
- **Custom Font**: Elegant "EditorsNote" typography throughout the app
- **Responsive Design**: Optimized for different screen sizes
- **Compact Settings Modal**: Fixed-height modal with scrollable content to prevent screen overflow

### Advanced Features
- **Groq Whisper Integration**: Uses Groq's `whisper-large-v3` model for high-quality transcription
- **Automatic Microphone Management**: Microphone is only active during recording, fully released when stopped
- **Audio Activation Sound**: Plays a sound indicator when recording starts to signal users to begin speaking
- **Settings Management**: Comprehensive settings with API key management, encryption status, and preferences
- **Microphone Permissions**: Built-in permission handling and OS settings access
- **Transcription Editing**: In-place editing of transcribed text
- **Persistent Transcription History**: All transcriptions automatically saved to `transcriptions.json` with search capability
- **Background Operation**: Clipboard copy works even when app is minimized or in background
- **Error Handling**: Robust error handling for API failures and microphone issues
- **Toast Notification System**: Real-time visual feedback for transcription success/failure, API operations, and encryption status
- **Auto-Update Management**: Checks for updates on startup, downloads in background, installs on app quit
- **Deep Link Authentication**: OAuth integration with Clerk for secure user authentication via `sweesh://` protocol
- **JWT Token Validation**: Secure token validation and storage for authenticated sessions with JWKS
- **Security Event Logging**: Comprehensive logging of authentication failures, rate limits, and suspicious activity
- **Pattern Detection**: Automatic alerts when suspicious patterns detected (5+ events in 60 seconds)
- **Rate Limit Monitoring**: Real-time tracking of API usage with 20 requests/minute for transcription
- **Security Statistics**: Detailed metrics on security events accessible via IPC
- **Data Export**: Clear all user data option for privacy and testing
- **Startup Management**: Optional system startup integration with tray menu controls

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Git
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sweesh.git
   cd sweesh
   ```

2. **Install dependencies**
```bash
npm install
```

3. **Configure your API key (Recommended: via Onboarding or Settings UI)**
   - Start the app: `npm run dev` (or `npm start` after build)
   - **New users**: Complete the onboarding flow to set up your API key securely
   - **Existing users**: Open Settings → enter your Groq API key (starts with `gsk_`) → Save
   - The key is encrypted locally using OS-level storage; if unavailable, AES‑256-CBC fallback is used automatically
   - **Legacy support**: Existing `.env` files are automatically migrated to secure storage on first launch

4. **Start development server**
```bash
npm run dev
```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 🛠️ Development

### Project Structure

```
sweesh/
├── src/
│   ├── components/           # React components
│   │   ├── layout/          # Layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── titlebar.tsx
│   │   │   └── transcription-card.tsx
│   │   └── ui/              # UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── onboarding-modal.tsx  # First-run setup
│   │       ├── settings-modal.tsx    # Settings configuration
│   │       └── transcription-modal.tsx
│   ├── font/                # Custom fonts
│   │   └── EditorsNote-Light.otf
│   ├── lib/                 # Utility functions and security
│   │   ├── utils.ts
│   │   ├── rateLimiter.ts   # Rate limiting implementation
│   │   └── securityLogger.ts # Security event logging
│   ├── main/                # Main process modules
│   │   └── autoUpdater.ts   # Auto-update configuration
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Preload script
│   ├── renderer/            # Renderer process
│   │   ├── App.tsx          # Main app component
│   │   ├── ActiveApp.tsx    # Active recording window
│   │   ├── index.tsx        # Renderer entry point
│   │   ├── index.html       # Main HTML template
│   │   └── active.html      # Active window HTML template
│   ├── sound/               # Audio files
│   │   └── active.mp3       # Recording activation sound
│   ├── styles/              # Global styles
│   │   └── globals.css
│   └── types/               # TypeScript type definitions
│       └── electron.d.ts    # Electron API types
├── public/                  # Static assets
│   └── icons/              # App icons
├── dist/                   # Built application
└── sweesh-*/              # Platform-specific builds
```

### Technology Stack

- **Frontend**: React 18 with TypeScript
- **Desktop Framework**: Electron 38.4.0 (Latest October 2025)
- **Styling**: Tailwind CSS 4 with custom components
- **Build Tool**: Webpack 5
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React
- **Animations**: Framer Motion for smooth UI transitions
- **Font**: Custom "EditorsNote" typography
- **Transcription**: Groq Whisper API via `groq-sdk` (whisper-large-v3 model)
- **Audio Processing**: Web Audio API with MediaRecorder
- **Global Shortcuts**: `node-global-key-listener` for system-wide key detection
- **Clipboard**: Electron's native clipboard API
- **Auto-Updates**: `electron-updater` with GitHub Releases
- **Logging**: `electron-log` for comprehensive security and application logging
- **Authentication**: Clerk with JWT validation and deep link OAuth
- **Encryption**: Electron `safeStorage` with AES-256-CBC fallback
- **Security Monitoring**: Custom security logger with real-time threat detection
- **Rate Limiting**: Token bucket rate limiter for API and authentication protection
- **Data Persistence**: JSON file storage with encryption

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the Electron app (requires prior build) |
| `npm run dev` | Start development with hot reload and watch mode |
| `npm run build` | Build renderer for production |
| `npm run build:watch` | Build renderer with file watching |
| `npm run build:main` | Build main process only |
| `npm run build:main:watch` | Build main process with watching |
| `npm run clean` | Clean dist directory |
| `npm run rebuild` | Clean and rebuild everything (main + renderer) |
| `npm run dist` | Build distributable for current platform |
| `npm run dist:win` | Build Windows distributable |
| `npm run dist:mac` | Build macOS distributable |
| `npm run dist:linux` | Build Linux distributable |
| `npm run release` | Build and publish to GitHub releases (requires GH_TOKEN) |

### Development Workflow

1. **Main Process Development**: The main Electron process is in `src/main.ts`
2. **Renderer Development**: React components are in `src/renderer/` and `src/components/`
3. **Styling**: Global styles in `src/styles/globals.css` with Tailwind utilities
4. **TypeScript**: Full TypeScript support with strict mode enabled
5. **Hot Reload**: Development server supports hot reloading for both main and renderer processes

## 🎨 UI Components

### Layout Components
- **Titlebar**: Custom window controls with app branding
- **Sidebar**: Quick access toolbar with settings and recording controls
- **TranscriptionCard**: Individual transcription display with actions

### UI Components
- **Button**: Customizable button component with variants
- **Card**: Container component for content organization
- **Input**: Form input component with validation
- **OnboardingModal**: First-run setup wizard with API key configuration
- **SettingsModal**: Comprehensive settings configuration with secure API key management
- **TranscriptionModal**: Detailed transcription view and editing

### Design System
- **Color Palette**: Dark theme with orange accents
- **Typography**: Custom "EditorsNote" font family
- **Spacing**: Consistent spacing using Tailwind's scale
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first responsive design

## ⚙️ Configuration

### Settings Options
- **Groq API Key**: Configure your Groq API key for Whisper transcription
- **API Key Management**: Save, update, and delete API keys with secure encryption
- **Encryption Status**: View current encryption method (OS-level or AES-256-CBC fallback)
- **Onboarding Status**: Track setup completion and configuration status
- **File Save Location**: Choose where to save audio files
- **Auto Save**: Enable/disable automatic file saving
- **Dark Mode**: Toggle between light and dark themes
- **Microphone Permissions**: Manage microphone access

### API Key Management (Secure)
- **Onboarding Flow**: New users get guided setup with secure API key configuration
- **Settings UI**: Existing users can manage API keys through the Settings modal
- **OS-Level Encryption**: Uses system secure storage (Keychain/DPAPI/libsecret) when available
- **AES-256-CBC Fallback**: Automatic fallback encryption when OS-level encryption unavailable
- **Migration Support**: Legacy `.env` files automatically migrated to secure storage
- **Status Feedback**: Real-time encryption method indicators and toast notifications
- **Privacy by Design**: Keys never stored in plain text; all operations in main process

### Environment Variables (Optional / Legacy)
If preferred, you can create a `.env` file (this is migrated to secure storage on first run):
```env
GROQ_API_KEY=your_actual_groq_api_key_here
NODE_ENV=development
```

**Getting a Groq API Key:**
1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Create an API key
4. Add it via Settings (recommended) or to your `.env` file (legacy)

Refer to `SETUP.md` for detailed setup instructions.

## 🔧 Building and Distribution

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Platform-specific Builds
The project includes pre-built executables for multiple platforms:
- **Windows**: `sweesh-win32-x64/` and `sweesh-win32-ia32/`
- **macOS**: `sweesh-mas-x64/`
- **Linux**: `sweesh-linux-x64/` and `sweesh-linux-arm64/`

## 🎯 Usage

### Getting Started

**For New Users:**
1. Launch the application
2. Complete the onboarding flow to set up your Groq API key securely
3. Grant microphone permissions when prompted
4. Hold `Ctrl+Shift+M`, `Alt+Shift+M`, or `F12` anywhere on your system to start recording
5. Speak into your microphone (you'll hear an activation sound)
6. Release the key combination to stop recording
7. View transcriptions in the main window (automatically copied to clipboard)

**For Existing Users:**
1. Launch the application (existing API keys are automatically migrated to secure storage)
2. Hold `Ctrl+Shift+M`, `Alt+Shift+M`, or `F12` anywhere on your system to start recording
3. Speak into your microphone (you'll hear an activation sound)
4. Release the key combination to stop recording
5. View transcriptions in the main window (automatically copied to clipboard)
6. Edit, copy, or delete transcriptions as needed

### Keyboard Shortcuts
- **Hold `Ctrl + Shift + M`**: Show voice widget and start recording; release to stop
- **Hold `Alt + Shift + M`**: Show voice widget and start recording; release to stop  
- **Hold `F12`**: Show voice widget and start recording; release to stop
  - Note: Some OS-level shortcuts (e.g., Alt+M on Windows) may conflict; use `F12` for testing
- **`Ctrl + N`**: Create new transcription (in app)
- **`Ctrl + ,`**: Open settings (in app)
- **`Escape`**: Close modals and windows

### Recording Workflow
1. **Hold** any of the global shortcuts (`Ctrl+Shift+M`, `Alt+Shift+M`, or `F12`)
2. The fullscreen transparent recording overlay appears with aurora border effects
3. You'll hear an activation sound indicating recording has started
4. Speak clearly into your microphone
5. **Release** the key combination to stop recording
6. The app automatically transcribes your speech using Groq Whisper
7. Transcription appears in the main window and is copied to your clipboard
8. You can immediately paste (`Ctrl+V`) the transcription anywhere in your system

## 🧱 Architecture

### Overview
- **Main Process** (`src/main.ts`): Creates windows, manages system tray, registers global keyboard listener, handles Groq Whisper API calls, manages clipboard operations, and orchestrates IPC communication
- **Preload** (`src/preload.ts`): Exposes a secure `electronAPI` bridge with window controls, recording controls, transcription methods, and event subscriptions
- **Renderer (Main Window)** (`src/renderer/App.tsx` and components): Displays and manages transcriptions; listens for `new-transcription` events from main process
- **Active Window** (`src/renderer/ActiveApp.tsx`): Fullscreen transparent overlay for hold-to-talk recording; handles audio capture, real-time level monitoring, and activation sounds

### Data Flow
1. **User holds global shortcut** (Ctrl+Shift+M/Alt+Shift+M/F12) → Main process detects key press
2. **Main process shows Active Window** and sends `start-recording` IPC message
3. **Active Window initializes microphone** → Requests `getUserMedia()` → Sets up MediaRecorder and AudioContext
4. **Audio recording starts** → Plays activation sound → Begins real-time audio level monitoring
5. **User releases shortcut** → Main process sends `stop-recording` → Active Window stops MediaRecorder
6. **Audio processing** → Active Window sends audio buffer to main via `transcribe-audio` IPC
7. **Main process calls Groq Whisper** → Writes temp file → Calls Groq API → Deletes temp file
8. **Automatic clipboard copy** → Main process copies transcription to system clipboard
9. **Transcription display** → Main process sends transcription to main window via `new-transcription` event
10. **UI update** → Main window displays new transcription card

### Security & Key Storage Flow
1. On startup, the main process checks for an encrypted key in `app.getPath('userData')`
2. If present, it decrypts using `safeStorage` (OS‑level) or AES‑256 fallback and initializes the Groq client
3. If absent, the UI shows “Not Configured” until a key is saved via Settings
4. Saving a key triggers encryption (OS‑level if available; otherwise AES‑256 fallback), stores metadata, and re‑initializes the Groq client without restart

### IPC Channels
- **Window Controls**: `window-minimize`, `window-toggle-maximize`, `window-close`
- **Active Window Controls**: `open-active-window`, `close-active-window`, `toggle-active-window`, `active-window-minimize`, `active-window-toggle-maximize`, `active-window-close`
- **Recording Control Events**: `start-recording`, `stop-recording`
- **Transcription**: `transcribe-audio`, `send-transcription-to-main`; renderer listens on `new-transcription`
- **API Key Management**: `save-api-key`, `get-api-key-status`, `update-api-key`, `delete-api-key`
- **Encryption Status**: `get-encryption-status`
- **Authentication**: `get-auth-status`, `start-auth-flow`, `logout`; renderer listens on `auth-success`, `auth-error`
- **Onboarding**: `check-onboarding-status`, `complete-onboarding`, `skip-onboarding`
- **Data Management**: `clear-all-data`, `load-transcriptions`, `save-transcriptions`
- **Auto-Update**: `check-for-updates`, `quit-and-install-update`; renderer listens on `update-status`
- **Security**: `get-security-statistics`; provides real-time security metrics and event counts
- **Notifications**: `show-toast`; renderer listens on `toast-notification`

### Key Technologies
- **Audio Processing**: Web Audio API, MediaRecorder, AudioContext
- **Global Shortcuts**: `node-global-key-listener` for system-wide key detection
- **Transcription**: Groq SDK with `whisper-large-v3` model
- **Clipboard**: Electron's native `clipboard` API for background clipboard access
- **UI Framework**: React 18 with TypeScript and Tailwind CSS
- **Desktop Framework**: Electron 38.4.0 with IPC communication
- **Security Logging**: `electron-log` with custom SecurityLogger class
- **Rate Limiting**: Token bucket algorithm with configurable limits
- **Pattern Detection**: Time-window based suspicious activity detection

## 🎨 Customization

### Themes
The app supports a dark theme by default. You can customize colors by modifying the CSS variables in `src/styles/globals.css`.

### Fonts
The app uses a custom "EditorsNote" font. You can replace it by:
1. Adding your font file to `src/font/`
2. Updating the `@font-face` declaration in `globals.css`
3. Modifying the font family references

### Styling
- Global styles: `src/styles/globals.css`
- Component styles: Individual component files
- Tailwind config: `tailwind.config.js`

## 🐛 Troubleshooting

### Common Issues

**Microphone not working:**
- Check system microphone permissions
- Use the "Request microphone permission" button in settings
- Verify microphone is not being used by another application
- Ensure microphone is not muted in system settings

**Transcription not working:**
- Verify your Groq API key is correctly configured via Settings or onboarding
- Check your internet connection
- Ensure microphone is working properly
- Check console logs for API errors
- **New users**: Complete the onboarding flow to set up your API key
- **Existing users**: Use Settings to update your API key if needed

**Toast notifications not appearing:**
- ✅ **Fixed in v1.0.9**: Enhanced toast styling with solid colors and higher z-index
- Check browser console for `🍞 Toast received:` debug messages
- Toasts appear in top-right corner for 5 seconds
- If still not visible, try refreshing the app (Ctrl+R in DevTools)

**Settings modal crashes with encryption error:**
- ✅ **Fixed in v1.0.9**: `safeStorage.getSelectedStorageBackend()` compatibility error resolved
- The app now works with all Electron versions (v28+)
- Encryption status displays correctly without crashes

**Encryption unavailable / security warnings:**
- The app automatically falls back to AES‑256-CBC encryption if OS‑level encryption isn't available
- On Linux, install `libsecret` to enable OS‑level encryption and restart the app:
  - Ubuntu/Debian: `sudo apt-get install libsecret-1-0`
  - Fedora: `sudo dnf install libsecret`
  - Arch: `sudo pacman -S libsecret`
- **Note**: The Settings UI shows which encryption method is active and provides guidance when OS‑level encryption is missing
- **Migration**: Existing `.env` files are automatically migrated to secure storage on first launch

**Auto-update not working:**
- Updates check automatically 3 seconds after app startup
- Requires internet connection
- Downloads happen in background
- Updates install when you quit and restart the app
- Check logs at `%APPDATA%\sweesh\logs\main.log` (Windows) for update status

**Security logs not generating:**
- Security logs are located at:
  - Windows: `%LOCALAPPDATA%\sweesh-security-logs\security.log`
  - macOS: `~/Library/Application Support/sweesh-security-logs/security.log`
  - Linux: `~/.config/sweesh-security-logs/security.log`
- Logs automatically rotate at 10MB
- Use `get-security-statistics` IPC to view stats programmatically
- Check console for color-coded security events during development

**Authentication issues:**
- Deep link OAuth requires default browser to open
- JWT tokens are validated and encrypted locally
- Check if `sweesh://` protocol is registered (automatic on first run)
- Clear auth data via Settings if experiencing issues

**Transcriptions not persisting:**
- All transcriptions auto-save to `transcriptions.json` in app data folder
- Location: `app.getPath('userData')/transcriptions.json`
- Check file permissions in app data directory
- Use "Clear all data" option in Settings if corruption suspected

**Clipboard not working:**
- Clipboard copy happens automatically in the main process
- Works even when app is minimized or in background
- If clipboard fails, transcription still appears in the app
- Check console logs for clipboard errors

**Global shortcuts not working:**
- Try `F12` instead of `Ctrl+Shift+M` or `Alt+Shift+M` (some OS shortcuts may conflict)
- Ensure the app is running (check system tray)
- Check if other applications are using the same key combinations
- Restart app if shortcuts stop responding

**App won't start:**
- Make sure all dependencies are installed: `npm install`
- Check Node.js version compatibility (v18+)
- Try rebuilding: `npm run rebuild`
- **New users**: Complete onboarding to set up API key
- **Existing users**: Check if API key migration completed successfully
- Clear app data if persistent issues: `%APPDATA%\sweesh` (Windows)

**Build errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all required files are present
- **API Key Setup**: Use onboarding flow or Settings UI instead of `.env` files
- **Migration**: Check startup logs for API key migration status

**Deprecated crypto warning:**
- `crypto.createDecipher is deprecated` warning is non-critical
- Only appears when using AES-256-CBC fallback encryption
- Does not affect functionality
- Will be updated in future release

### Debug Mode
Run with debug logging:
```bash
DEBUG=* npm run dev
```

### Getting Help
1. Check the console logs for error messages
2. Verify your Groq API key is valid at [console.groq.com](https://console.groq.com)
3. Test microphone permissions in system settings
4. Try the `F12` shortcut if others don't work

## 📄 License & Copyright

### © COPYRIGHT & LICENSE

**Copyright (c) 2025 Hasin Raiyan. All rights reserved.**

This software and associated documentation files (the "Software") are the property of Hasin Raiyan. Unauthorized copying, modification, distribution, or use of the Software, via any medium, is strictly prohibited.

**Commercial, personal, or educational use requires explicit written permission from the author.**

### Usage Terms
- ❌ **No Contributions**: This is proprietary software. Pull requests and forks are not accepted.
- ❌ **No Redistribution**: You may not distribute, modify, or create derivative works.
- ❌ **No Commercial Use**: Commercial use is strictly prohibited without written permission.
- ✅ **Personal Use Only**: Licensed users may use the software for personal purposes only.
- 📧 **Contact**: For licensing inquiries, contact via [hasin.vercel.app](https://hasin.vercel.app)

## 🙏 Acknowledgments

- **Electron**: For the desktop app framework and IPC communication
- **React**: For the UI library and component architecture
- **Tailwind CSS**: For the styling system and responsive design
- **Groq**: For providing fast Whisper API access via `groq-sdk`
- **OpenAI Whisper**: For the powerful speech recognition model
- **Lucide React**: For the icon library
- **Radix UI**: For accessible UI primitives
- **Framer Motion**: For smooth animations and transitions
- **Web Audio API**: For real-time audio processing and level monitoring

## 📞 Support

If you encounter issues or have questions:

1. Open an issue in your repository's Issues tab
2. Include OS, app version, and reproduction steps

## 🔮 Roadmap

### Completed Features ✅
- [x] Comprehensive security logging system (v1.4.0)
- [x] Rate limiting and threat detection (v1.4.0)
- [x] Electron security updates (v1.4.0)
- [x] Auto-update system with GitHub Releases (v1.3.9)
- [x] Deep link authentication with OAuth (v1.3.9)
- [x] Secure API key management with OS-level encryption (v1.3.6)
- [x] First-run onboarding flow (v1.3.7)
- [x] Real-time audio level monitoring (v1.3.5)
- [x] System tray integration
- [x] Global keyboard shortcuts
- [x] Automatic clipboard integration

### Upcoming Features (v1.5.0+)
- [ ] **Remote Security Monitoring**: SIEM integration for enterprise logging
- [ ] **Real-time Security Dashboard**: Visual security metrics and alerts
- [ ] **Email/Slack Alerts**: Critical security event notifications
- [ ] **ML-Based Anomaly Detection**: Advanced threat pattern recognition
- [ ] **Geographic IP Analysis**: Location-based security insights
- [ ] Custom keyboard shortcuts configuration UI
- [ ] Multiple language support for transcription
- [ ] Transcription formatting options (capitalize, punctuation)
- [ ] Export transcriptions to file (TXT, MD, JSON)
- [ ] Real-time transcription streaming
- [ ] Speaker diarization (identify different speakers)
- [ ] Local model support (offline transcription)
- [ ] Cloud sync capabilities
- [ ] Advanced audio processing (noise reduction)
- [ ] Plugin system for extensions
- [ ] Mobile companion app
- [ ] Team collaboration features
- [ ] Dark/light theme toggle
- [ ] Advanced export options

### Version History
- **v1.0.0**: Initial release with core transcription features
- **v1.1.0**: Added settings management and UI improvements
- **v1.2.0**: Enhanced recording interface and file management
- **v1.3.0**: Added automatic clipboard copy and hold-to-talk functionality
- **v1.3.5**: Implemented real-time audio level monitoring and activation sounds
- **v1.3.6**: Added secure API key management with OS-level encryption and AES-256-CBC fallback
- **v1.3.7**: Implemented first-run onboarding flow with guided API key setup
- **v1.3.8**: Enhanced Settings modal with compact design and improved user experience
- **v1.3.9**: Added auto-update system with GitHub Releases integration and deep link authentication
  - ✅ Fixed `safeStorage.getSelectedStorageBackend()` compatibility error
  - ✅ Fixed toast notifications not appearing with enhanced styling
  - ✅ Added toast debugging for better error tracking
  - ✅ Improved encryption status handling across Electron versions
  - ✅ Implemented deep link authentication with Clerk OAuth and JWT validation
- **v1.4.0** (Current): Major Security Update - October 2025
  - ✅ **Upgraded Electron to v38.4.0** (from v28.3.3) - Latest stable release
  - ✅ **Fixed ASAR Integrity Bypass vulnerability** (GHSA-vmqv-hx8q-j7mg)
  - ✅ **Comprehensive Security Logging System** with 10+ event types
  - ✅ **Real-time Threat Detection** with automatic pattern recognition
  - ✅ **Rate Limiting Implementation** (20 requests/min transcription, 3/min auth)
  - ✅ **Security Statistics API** for monitoring and analytics
  - ✅ **Enhanced Authentication Security** with JWT validation and deduplication
  - ✅ **URL Validation System** with whitelist and dangerous pattern detection
  - ✅ **Command Injection Prevention** with secure execution patterns
  - ✅ **Privacy Policy Integration** in About dialog
  - ✅ **Security Documentation** (SECURITY_LOGGING_GUIDE.md, SECURITY_UPDATE_SUMMARY.md)
  - ✅ **Log Management** with automatic rotation (10MB limit) and JSON statistics
  - ✅ **Color-Coded Security Events** in console for better debugging
  - 📈 **Security Score**: Improved from 8.5/10 to 9.5/10

---

<div align="center">
  <p>Made with ❤️ by Hasin Raiyan</p>
  <p>© 2025 Sweesh. All rights reserved.</p>
</div>
