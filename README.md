# Sweesh - Voice Transcription Desktop App

<div align="center">
  <img src="public/icons/logo.png" alt="Sweesh Logo" width="64" height="64">
  <h3>Professional Voice Transcription Made Simple</h3>
  <p>An elegant Electron-based desktop application for real-time voice transcription with a beautiful, modern interface.</p>
</div>

## 🌟 Features

### Core Functionality
- **Real-time Voice Transcription**: Convert speech to text instantly using advanced speech recognition
- **Dual Window System**: Main application window and fullscreen active recording window
- **System Tray Integration**: Minimize to system tray for quick access
- **Transcription Management**: View, edit, copy, and delete your transcriptions
- **Auto-save**: Automatically save audio files and transcriptions locally
- **Keyboard Shortcuts**: Quick access with `Alt + M` to open the voice widget

### User Interface
- **Modern Dark Theme**: Sleek, professional dark interface with custom typography
- **Custom Titlebar**: Native-looking window controls with app branding
- **Aurora Border Effects**: Beautiful animated borders during recording
- **Responsive Design**: Optimized for different screen sizes
- **Glass Morphism**: Modern UI elements with backdrop blur effects
- **Custom Font**: Elegant "EditorsNote" typography throughout the app

### Advanced Features
- **Settings Management**: Configure API keys (Groq), save locations, and preferences
- **Microphone Permissions**: Built-in permission handling and OS settings access
- **Transcription Editing**: In-place editing of transcribed text
- **Export Functionality**: Copy transcriptions to clipboard
- **File Management**: Organized storage of audio files and transcriptions
- **Cross-platform**: Available for Windows, macOS, and Linux

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Git

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

3. **Configure environment**
```bash
cp .env.example .env  # if available, otherwise create .env
```
Then set your Groq API key in `.env` (see Configuration below).

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
│   │       ├── settings-modal.tsx
│   │       └── transcription-modal.tsx
│   ├── font/                # Custom fonts
│   ├── lib/                 # Utility functions
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Preload script
│   ├── renderer/            # Renderer process
│   │   ├── App.tsx          # Main app component
│   │   ├── ActiveApp.tsx    # Active recording window
│   │   ├── index.tsx        # Renderer entry point
│   │   ├── index.html       # Main HTML template
│   │   └── active.html      # Active window HTML template
│   ├── styles/              # Global styles
│   │   └── globals.css
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
│   ├── icons/              # App icons
│   └── sound/              # Audio files
├── dist/                   # Built application
└── sweesh-*/              # Platform-specific builds
```

### Technology Stack

- **Frontend**: React 18 with TypeScript
- **Desktop Framework**: Electron 28
- **Styling**: Tailwind CSS 4 with custom components
- **Build Tool**: Webpack 5
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React
- **Font**: Custom "EditorsNote" typography
- **Transcription**: Groq Whisper via `groq-sdk`

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the Electron app |
| `npm run dev` | Start development with hot reload |
| `npm run build` | Build for production |
| `npm run build:watch` | Build with file watching |
| `npm run build:main` | Build main process only |
| `npm run build:main:watch` | Build main process with watching |
| `npm run clean` | Clean build directory |
| `npm run rebuild` | Clean and rebuild everything |

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
- **SettingsModal**: Comprehensive settings configuration
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
- **File Save Location**: Choose where to save audio files
- **Auto Save**: Enable/disable automatic file saving
- **Dark Mode**: Toggle between light and dark themes
- **Microphone Permissions**: Manage microphone access

### Environment Variables
Create a `.env` file in the root directory (the app loads it at runtime):
```env
GROQ_API_KEY=your_actual_api_key_here
NODE_ENV=development
```
Refer to `SETUP.md` for a quick start guide to obtaining a Groq API key.

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
1. Launch the application
2. Grant microphone permissions when prompted
3. Click "Open Active Window" to start recording
4. Speak into your microphone
5. View transcriptions in the main window
6. Edit, copy, or delete transcriptions as needed

### Keyboard Shortcuts
- Hold `Ctrl + Shift + M`: Show voice widget and start recording; release to stop
- Hold `Alt + Shift + M`: Show voice widget and start recording; release to stop
- Press `F12`: Show voice widget and start recording; release to stop
  - Note: Some OS-level shortcuts (e.g., Alt+M on Windows) may conflict; use `F12` for testing.
- `Ctrl + N`: Create new transcription (in app)
- `Ctrl + ,`: Open settings (in app)
- `Escape`: Close modals and windows

## 🧱 Architecture

### Overview
- **Main Process** (`src/main.ts`): Creates windows, manages tray, registers global keyboard listener, handles transcription via Groq Whisper, and orchestrates IPC.
- **Preload** (`src/preload.ts`): Exposes a safe `electronAPI` bridge with window controls, active window controls, transcription methods, and event subscriptions.
- **Renderer (Main Window)** (`src/renderer/App.tsx` and components): Displays and manages transcriptions; listens for `new-transcription` events sent from main.
- **Active Window** (`src/renderer/active.html` + logic): Fullscreen, frameless overlay used for hold-to-talk recording UX; receives `start-recording`/`stop-recording` events from main.

### Data Flow
1. User holds a global shortcut (e.g., Ctrl+Shift+M/F12). The main process shows the Active Window and sends `start-recording`.
2. The Active Window records audio and sends the audio buffer to main via `electronAPI.transcribeAudio` (IPC `transcribe-audio`).
3. Main process writes a temp file, calls Groq Whisper (`groq-sdk`) to transcribe, deletes the temp file, and returns `{ success, text }`.
4. Main process forwards successful transcription to the main window via `new-transcription` event; renderer updates UI.

### IPC Channels (high-level)
- Window controls: `window-minimize`, `window-toggle-maximize`, `window-close`
- Active window controls: `open-active-window`, `close-active-window`, `toggle-active-window`, `active-window-minimize`, `active-window-toggle-maximize`, `active-window-close`
- Recording control events: `start-recording`, `stop-recording`
- Transcription: `transcribe-audio`, `send-transcription-to-main`; renderer listens on `new-transcription`

### Recording Workflow
1. Click the "Open Active Window" button
2. The fullscreen recording window will appear
3. Speak clearly into your microphone
4. The app will automatically transcribe your speech
5. Transcriptions appear in the main window
6. Use the sidebar to manage your recordings

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

**Transcription not working:**
- Verify your Groq API key is correctly configured
- Check your internet connection
- Ensure microphone is working properly

**App won't start:**
- Make sure all dependencies are installed: `npm install`
- Check Node.js version compatibility
- Try rebuilding: `npm run rebuild`

**Build errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all required files are present

### Debug Mode
Run with debug logging:
```bash
DEBUG=* npm run dev
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and patterns
- Add TypeScript types for new features
- Include tests for new functionality
- Update documentation as needed
- Test on multiple platforms when possible

## 📄 License

This project is licensed under the MIT License. Include a `LICENSE` file if distributing.

## 🙏 Acknowledgments

- **Electron**: For the desktop app framework
- **React**: For the UI library
- **Tailwind CSS**: For the styling system
- **OpenAI Whisper**: For speech recognition capabilities
- **Lucide React**: For the icon library
- **Radix UI**: For accessible UI primitives

## 📞 Support

If you encounter issues or have questions:

1. Open an issue in your repository's Issues tab
2. Include OS, app version, and reproduction steps

## 🔮 Roadmap

### Upcoming Features
- [ ] Real-time transcription streaming
- [ ] Multiple language support
- [ ] Cloud sync capabilities
- [ ] Advanced audio processing
- [ ] Plugin system for extensions
- [ ] Mobile companion app
- [ ] Team collaboration features
- [ ] Advanced export options

### Version History
- **v1.0.0**: Initial release with core transcription features
- **v1.1.0**: Added settings management and UI improvements
- **v1.2.0**: Enhanced recording interface and file management

---

<div align="center">
  <p>Made with ❤️ by the Sweesh Team</p>
  <p>© 2024 Sweesh. All rights reserved.</p>
</div>