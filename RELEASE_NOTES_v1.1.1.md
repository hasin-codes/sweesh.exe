# Sweesh v1.1.1 Release Notes

**Release Date:** October 22, 2025

## 🎨 UI/UX Improvements

### Onboarding Modal Enhancements
- **Optimized for 1366×768 screens**: Complete redesign to fit perfectly without scrolling
- **Compact spacing**: Reduced vertical spacing throughout for better space efficiency
- **Unified API key setup**: Combined info card with input field for cleaner layout
- **Inline encryption status**: Moved encryption info to compact inline display
- **Smaller step indicators**: Reduced size from 48px to 32px for better proportion
- **Improved color scheme**: Switched from blue accents to neutral grays for cleaner look
- **White action buttons**: Updated all buttons with white background and hover effects
- **Blue Groq Console link**: Changed "Open Groq Console" link to light blue for better visibility
- **Removed skip option**: Streamlined onboarding flow by removing skip functionality
- **Better toast positioning**: Increased top margin to prevent overlap with titlebar

### Modal Sizing
- Width: 512px (reduced from 640px)
- Max height: 600px
- Fixed content height: 400px
- Consistent size across all steps

## 🐛 Bug Fixes

### Recording Window
- **Fixed first-time recording bug**: Recording now works correctly on the very first keyboard shortcut press after app startup
- **Improved window initialization**: Recording event is now sent only after the active window is fully ready
- **Better event timing**: Added 100ms delay to ensure webContents are ready before starting recording

### External Links
- **Fixed Groq Console link**: Now opens in user's default browser instead of inside the app
- **Added URL validation**: Implemented security checks for external URLs (only allows groq.com domains)

## 🔧 Technical Changes

### Architecture
- Added `startRecording` parameter to `createActiveWindow()` function
- Implemented `ready-to-show` event handling for reliable recording start
- Enhanced IPC handler for external URL opening with domain whitelist
- Removed skip onboarding functionality from type definitions and preload

### Code Quality
- Cleaned up unused code
- Improved error handling
- Better TypeScript type definitions

## 📦 What's Next

- Performance optimizations
- Additional keyboard shortcuts
- Enhanced transcription features

---

**Full Changelog**: https://github.com/yourusername/sweesh/compare/v1.1.0...v1.1.1

