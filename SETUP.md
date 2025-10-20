# Voice Recording Setup Guide

## Quick Start

1. **Get a Groq API Key**
   - Visit [https://console.groq.com/](https://console.groq.com/)
   - Sign up for a free account
   - Create an API key

2. **Set Up API Key Securely (Recommended)**
   - Run the application: `npm start`
   - Click the Settings button in the main window
   - Enter your Groq API key in the "Groq API Key" field
   - Click "Save Key" - your API key will be encrypted and stored securely

3. **Alternative: Using .env File (Legacy)**
   - Create a `.env` file in the project root
   - Add your API key:
   ```
   GROQ_API_KEY=your_actual_api_key_here
   NODE_ENV=development
   ```
   - The app will automatically migrate this to secure storage on first launch

4. **Run the Application**
   ```bash
   npm start
   ```

## How to Use

1. **Start Recording**: Hold `Ctrl+Shift+M`, `Alt+Shift+M`, or `F12` anywhere on your system
2. **Stop Recording**: Release the key combination
3. **View Transcriptions**: Transcriptions will appear in the main window automatically

## Features Implemented

✅ **Real-time Audio Recording** - Captures audio from your microphone  
✅ **Whisper API Integration** - Uses Groq's Whisper API for transcription  
✅ **Global Keyboard Shortcuts** - Works system-wide with Ctrl+Shift+M, Alt+Shift+M, or F12  
✅ **Aurora Border Effects** - Beautiful visual feedback during recording  
✅ **Automatic Transcription** - Audio is automatically sent to Whisper API  
✅ **Real-time Display** - Transcriptions appear instantly in the main window  
✅ **Cross-platform** - Works on Windows, macOS, and Linux  
✅ **Secure API Key Storage** - OS-level encryption with AES-256-CBC fallback  
✅ **Automatic Clipboard Copy** - Transcriptions copied to clipboard automatically  
✅ **First-Run Onboarding** - Guided setup for new users  
✅ **API Key Migration** - Automatic migration from legacy .env files  
✅ **Settings Management** - Comprehensive settings with encryption status  
✅ **Toast Notifications** - User feedback for operations and status

## Security Features

🔒 **OS-Level Encryption**: API keys are encrypted using your operating system's secure storage:
- **macOS**: Uses Keychain Services
- **Windows**: Uses Data Protection API (DPAPI)  
- **Linux**: Uses libsecret (with automatic fallback)

🔒 **Secure Fallback**: If OS-level encryption is unavailable (e.g., Linux without libsecret), the app automatically uses AES-256-CBC encryption with machine-specific keys

🔒 **No Plain Text Storage**: API keys are never stored in plain text on disk

🔒 **Secure IPC**: API key operations are handled securely through Electron's IPC system

🔒 **Automatic Migration**: Existing `.env` files are automatically migrated to secure storage

🔒 **Onboarding Integration**: New users get guided setup with secure API key configuration

🔒 **Cross-Platform Compatibility**: Works on all platforms with appropriate security levels  

## Troubleshooting

- **No transcription**: Check your Groq API key is configured correctly via onboarding or Settings
- **API key not working**: Use Settings UI to update your API key, or check console.groq.com for key validity
- **New users**: Complete the onboarding flow to set up your API key securely
- **Existing users**: Check if API key migration completed successfully in startup logs
- **Microphone not working**: Grant microphone permissions when prompted
- **Build errors**: Run `npm install` to ensure all dependencies are installed
- **Encryption unavailable**: The app will automatically use AES-256-CBC fallback encryption
- **Linux encryption issues**: Install libsecret for better security:
  - Ubuntu/Debian: `sudo apt-get install libsecret-1-0`
  - Fedora: `sudo dnf install libsecret`
  - Arch: `sudo pacman -S libsecret`

## Development

- **Main Process**: Handles Groq API calls, secure API key management, and IPC communication
- **Active Window**: Records audio and sends to main process
- **Main Window**: Displays transcriptions received from active window
- **Onboarding Modal**: First-run setup wizard for new users
- **Settings Modal**: Comprehensive settings with API key management and encryption status
