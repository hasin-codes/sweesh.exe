# Voice Recording Setup Guide

## Quick Start

1. **Get a Groq API Key**
   - Visit [https://console.groq.com/](https://console.groq.com/)
   - Sign up for a free account
   - Create an API key

2. **Set Environment Variable**
   - Create a `.env` file in the project root
   - Add your API key:
   ```
   GROQ_API_KEY=your_actual_api_key_here
   NODE_ENV=development
   ```

3. **Run the Application**
   ```bash
   npm run dev
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

## Troubleshooting

- **No transcription**: Check your Groq API key is correct
- **Microphone not working**: Grant microphone permissions when prompted
- **Build errors**: Run `npm install` to ensure all dependencies are installed

## Development

- **Main Process**: Handles Groq API calls and IPC communication
- **Active Window**: Records audio and sends to main process
- **Main Window**: Displays transcriptions received from active window
