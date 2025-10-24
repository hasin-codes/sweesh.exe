import { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, clipboard, safeStorage, shell } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { GlobalKeyboardListener } from 'node-global-key-listener';
import { exec, execFile } from 'child_process';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { rateLimiters, checkRateLimit, DeduplicationTracker } from './lib/rateLimiter';
import { securityLogger } from './lib/securityLogger';
import { setupAutoUpdater, checkForUpdates, installUpdateAndRestart } from './main/autoUpdater';

// Lightweight .env loader (no external deps). Ensures GROQ_API_KEY is available at runtime.
function loadEnvFromFile(): void {
  try {
    // Try dist/.env (when running built code) then project root .env as fallback
    const candidates = [
      path.join(__dirname, '..', '.env'),
      path.join(process.cwd(), '.env'),
    ];
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        content.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const eqIndex = trimmed.indexOf('=');
          if (eqIndex === -1) return;
          const key = trimmed.slice(0, eqIndex).trim();
          const value = trimmed.slice(eqIndex + 1).trim();
          if (!(key in process.env)) {
            process.env[key] = value;
          }
        });
        break;
      }
    }
  } catch (e) {
    console.log('Warning: failed to load .env file', e);
  }
}

// Load env before initializing API clients
loadEnvFromFile();

// Function to get the pending updates directory path
// Use Local AppData instead of Roaming on Windows
function getUpdaterPendingDir(): string {
  if (process.platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Local', 'sweesh-updater', 'pending');
  } else {
    return path.join(app.getPath('userData'), '..', 'sweesh-updater', 'pending');
  }
}

// Function to force quit all app processes
function forceQuitApp(): void {
  try {
    console.log('Force quitting application...');
    
    // Cleanup
    if (keyListener) {
      keyListener.kill();
    }
    globalShortcut.unregisterAll();
    
    // Close all windows
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        win.destroy();
      }
    });
    
    // Force exit
    process.exit(0);
  } catch (error) {
    console.error('Error during force quit:', error);
    process.exit(1);
  }
}

// Auto-updater removed - using only pending directory check with version comparison

let mainWindow: BrowserWindow;
let activeWindow: BrowserWindow;
let tray: Tray;
let keyListener: GlobalKeyboardListener;
let isActiveWindowVisible = false;

// Secure API Key Management
const CREDENTIALS_FILE = path.join(app.getPath('userData'), 'credentials.enc');

// Authentication Management
const AUTH_FILE = path.join(app.getPath('userData'), 'auth.enc');
const PROTOCOL_NAME = 'sweesh'; // Deep link protocol name
const CLERK_JWKS_URL = 'https://mighty-bulldog-76.clerk.accounts.dev/.well-known/jwks.json';
const AUTH_LANDING_URL = 'https://sweesh.vercel.app/auth/desktop'; // Landing page URL

// Onboarding and Persistence
const ONBOARDING_FILE = path.join(app.getPath('userData'), 'onboarding.json');
const TRANSCRIPTIONS_FILE = path.join(app.getPath('userData'), 'transcriptions.json');

// Check if encryption is available (will be set after app ready)
let isEncryptionAvailable = false;
let encryptionBackend = 'unknown';

// Check encryption availability after app is ready
function checkEncryptionAvailability(): void {
  try {
    isEncryptionAvailable = safeStorage.isEncryptionAvailable();
    
    // getSelectedStorageBackend is only available in newer Electron versions
    try {
      const anySafe: any = safeStorage as any;
      if (typeof anySafe.getSelectedStorageBackend === 'function') {
        encryptionBackend = anySafe.getSelectedStorageBackend();
      } else {
        encryptionBackend = isEncryptionAvailable ? 'available' : 'unavailable';
      }
    } catch {
      encryptionBackend = isEncryptionAvailable ? 'available' : 'unavailable';
    }
    
    console.log(`Encryption availability: ${isEncryptionAvailable}`);
    console.log(`Encryption backend: ${encryptionBackend}`);
    
    if (!isEncryptionAvailable) {
      console.warn('OS-level encryption is not available. API keys will be stored with fallback encryption.');
      if (encryptionBackend === 'basic_text') {
        console.warn('Linux: No secret store available. Consider installing libsecret for better security.');
      }
    }
  } catch (error) {
    console.error('Error checking encryption availability:', error);
    isEncryptionAvailable = false;
    encryptionBackend = 'error';
  }
}

// Generate a machine-specific encryption key for fallback
function generateMachineKey(): Buffer {
  try {
    // Use machine-specific identifiers to create a consistent key
    const machineId = os.hostname() + os.platform() + os.arch();
    // Generate a 32-byte (256-bit) key for AES-256
    const hash = crypto.createHash('sha256').update(machineId).digest();
    return hash; // Returns 32 bytes Buffer
  } catch (error) {
    console.error('Error generating machine key:', error);
    // Fallback to a default key derived from a known string (less secure but functional)
    return crypto.createHash('sha256').update('default-fallback-key-for-sweesh-app').digest();
  }
}

// Secure fallback encryption using AES-256-CBC with proper IV handling
function encryptWithFallback(text: string): string {
  try {
    const key = generateMachineKey(); // 32 bytes for AES-256
    const iv = crypto.randomBytes(16); // 16 bytes IV for AES
    
    // Use createCipheriv (secure) instead of createCipher (deprecated)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Store IV with encrypted data (IV doesn't need to be secret)
    const result = {
      iv: iv.toString('hex'),
      encrypted: encrypted,
      method: 'aes-256-cbc-secure'
    };
    
    return JSON.stringify(result);
  } catch (error) {
    console.error('Error in fallback encryption:', error);
    throw error;
  }
}

// Secure fallback decryption using AES-256-CBC with proper IV handling
function decryptWithFallback(encryptedData: string): string {
  try {
    const data = JSON.parse(encryptedData);
    const key = generateMachineKey(); // 32 bytes for AES-256
    
    // Extract IV from the encrypted data
    const iv = Buffer.from(data.iv, 'hex');
    
    // Use createDecipheriv (secure) instead of createDecipher (deprecated)
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error in fallback decryption:', error);
    throw error;
  }
}

// Secure API key storage functions
function saveApiKeySecurely(apiKey: string): boolean {
  try {
    // Check encryption availability at the time of saving
    const encryptionAvailable = safeStorage.isEncryptionAvailable();
    
    if (encryptionAvailable) {
      // Use OS-level encryption
      const encryptedBuffer = safeStorage.encryptString(apiKey);
      fs.writeFileSync(CREDENTIALS_FILE, encryptedBuffer);
      console.log('API key saved with OS-level encryption');
      return true;
    } else {
      // Fallback: Use secure crypto encryption
      console.warn('OS-level encryption not available, using AES-256-CBC fallback');
      console.log('Attempting to encrypt with fallback method...');
      const encryptedData = encryptWithFallback(apiKey);
      console.log('Fallback encryption successful, writing to file...');
      fs.writeFileSync(CREDENTIALS_FILE, encryptedData);
      console.log('API key saved with AES-256-CBC fallback encryption');
      return true;
    }
  } catch (error) {
    console.error('Failed to save API key:', error);
    return false;
  }
}

function loadApiKeySecurely(): string | null {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) {
      return null;
    }
    
    const fileContent = fs.readFileSync(CREDENTIALS_FILE);
    
    // Check encryption availability at the time of loading
    const encryptionAvailable = safeStorage.isEncryptionAvailable();
    
    if (encryptionAvailable) {
      // Try to decrypt with OS-level encryption
      try {
        const decryptedKey = safeStorage.decryptString(fileContent);
        console.log('API key loaded with OS-level decryption');
        return decryptedKey;
      } catch (decryptError) {
        // If decryption fails, try crypto fallback
        console.warn('OS-level decryption failed, trying AES-256-CBC fallback');
        try {
          const decryptedKey = decryptWithFallback(fileContent.toString());
          console.log('API key loaded with AES-256-CBC fallback');
          return decryptedKey;
        } catch (fallbackError) {
          console.error('Both OS-level and AES-256-CBC fallback decryption failed');
          return null;
        }
      }
    } else {
      // Use crypto fallback
      console.warn('OS-level encryption not available, using AES-256-CBC fallback');
      try {
        const decryptedKey = decryptWithFallback(fileContent.toString());
        console.log('API key loaded with AES-256-CBC fallback');
        return decryptedKey;
      } catch (fallbackError) {
        console.error('AES-256-CBC fallback decryption failed');
        return null;
      }
    }
  } catch (error) {
    console.error('Failed to load API key:', error);
    return null;
  }
}

function deleteApiKeySecurely(): boolean {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      fs.unlinkSync(CREDENTIALS_FILE);
      console.log('API key deleted securely');
    }
    return true;
  } catch (error) {
    console.error('Failed to delete API key:', error);
    return false;
  }
}

function getApiKeyStatus(): { hasKey: boolean; maskedKey?: string } {
  try {
    const apiKey = loadApiKeySecurely();
    if (!apiKey) {
      return { hasKey: false };
    }
    
    // Create masked version for display (show first 4 and last 4 characters)
    const maskedKey = apiKey.length > 8 
      ? `${apiKey.substring(0, 4)}${'•'.repeat(apiKey.length - 8)}${apiKey.substring(apiKey.length - 4)}`
      : `${apiKey.substring(0, 2)}${'•'.repeat(apiKey.length - 2)}`;
    
    return { hasKey: true, maskedKey };
  } catch (error) {
    console.error('Failed to get API key status:', error);
    return { hasKey: false };
  }
}

// Authentication Storage Functions
function saveAuthSecurely(authData: any): boolean {
  try {
    const encryptionAvailable = safeStorage.isEncryptionAvailable();
    
    if (encryptionAvailable) {
      const encryptedBuffer = safeStorage.encryptString(JSON.stringify(authData));
      fs.writeFileSync(AUTH_FILE, encryptedBuffer);
      console.log('Auth data saved with OS-level encryption');
      return true;
    } else {
      const encryptedData = encryptWithFallback(JSON.stringify(authData));
      fs.writeFileSync(AUTH_FILE, encryptedData);
      console.log('Auth data saved with AES-256-CBC fallback encryption');
      return true;
    }
  } catch (error) {
    console.error('Failed to save auth data:', error);
    return false;
  }
}

function loadAuthSecurely(): any | null {
  try {
    if (!fs.existsSync(AUTH_FILE)) {
      return null;
    }
    
    const fileContent = fs.readFileSync(AUTH_FILE);
    const encryptionAvailable = safeStorage.isEncryptionAvailable();
    
    if (encryptionAvailable) {
      try {
        const decryptedData = safeStorage.decryptString(fileContent);
        return JSON.parse(decryptedData);
      } catch (decryptError) {
        try {
          const decryptedData = decryptWithFallback(fileContent.toString());
          return JSON.parse(decryptedData);
        } catch (fallbackError) {
          console.error('Both OS-level and fallback decryption failed for auth data');
          return null;
        }
      }
    } else {
      try {
        const decryptedData = decryptWithFallback(fileContent.toString());
        return JSON.parse(decryptedData);
      } catch (fallbackError) {
        console.error('Fallback decryption failed for auth data');
        return null;
      }
    }
  } catch (error) {
    console.error('Failed to load auth data:', error);
    return null;
  }
}

function deleteAuthSecurely(): boolean {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      fs.unlinkSync(AUTH_FILE);
      console.log('Auth data deleted securely');
    }
    return true;
  } catch (error) {
    console.error('Failed to delete auth data:', error);
    return false;
  }
}

function getAuthStatus(): { isAuthenticated: boolean; user?: any } {
  try {
    const authData = loadAuthSecurely();
    if (!authData || !authData.user) {
      return { isAuthenticated: false };
    }
    
    // Check if token is expired
    if (authData.expiresAt && new Date() > new Date(authData.expiresAt)) {
      console.log('Auth token expired, clearing auth data');
      deleteAuthSecurely();
      return { isAuthenticated: false };
    }
    
    return { isAuthenticated: true, user: authData.user };
  } catch (error) {
    console.error('Failed to get auth status:', error);
    return { isAuthenticated: false };
  }
}

// Onboarding Management Functions
function checkOnboardingStatus(): { completed: boolean; hasApiKey: boolean; isAuthenticated: boolean; userInfo?: any } {
  try {
    let completed = false;
    
    if (fs.existsSync(ONBOARDING_FILE)) {
      const data = JSON.parse(fs.readFileSync(ONBOARDING_FILE, 'utf8'));
      completed = data.completed || false;
    }
    
    const hasApiKey = loadApiKeySecurely() !== null;
    const authStatus = getAuthStatus();
    const isAuthenticated = authStatus.isAuthenticated;
    const userInfo = authStatus.user || undefined;
    
    // Onboarding is only truly complete if user has both auth AND API key
    // Override completed flag if either is missing
    if (!isAuthenticated || !hasApiKey) {
      completed = false;
    }
    
    return { completed, hasApiKey, isAuthenticated, userInfo };
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
    return { completed: false, hasApiKey: false, isAuthenticated: false };
  }
}

function completeOnboarding(): boolean {
  try {
    const data = { completed: true, completedAt: new Date().toISOString() };
    fs.writeFileSync(ONBOARDING_FILE, JSON.stringify(data, null, 2));
    console.log('Onboarding completed');
    return true;
  } catch (error) {
    console.error('Failed to complete onboarding:', error);
    return false;
  }
}

function skipOnboarding(): boolean {
  try {
    const data = { completed: true, skipped: true, completedAt: new Date().toISOString() };
    fs.writeFileSync(ONBOARDING_FILE, JSON.stringify(data, null, 2));
    console.log('Onboarding skipped');
    return true;
  } catch (error) {
    console.error('Failed to skip onboarding:', error);
    return false;
  }
}

// Function to clear all user data (for testing/reset)
function clearAllUserData(): boolean {
  try {
    console.log('Clearing all user data...');
    
    // Delete all data files
    if (fs.existsSync(AUTH_FILE)) {
      fs.unlinkSync(AUTH_FILE);
      console.log('Auth data cleared');
    }
    
    if (fs.existsSync(CREDENTIALS_FILE)) {
      fs.unlinkSync(CREDENTIALS_FILE);
      console.log('API key cleared');
    }
    
    if (fs.existsSync(ONBOARDING_FILE)) {
      fs.unlinkSync(ONBOARDING_FILE);
      console.log('Onboarding status cleared');
    }
    
    if (fs.existsSync(TRANSCRIPTIONS_FILE)) {
      fs.unlinkSync(TRANSCRIPTIONS_FILE);
      console.log('Transcriptions cleared');
    }
    
    // Clear Groq client
    groq = null;
    
    console.log('All user data cleared successfully');
    return true;
  } catch (error) {
    console.error('Failed to clear user data:', error);
    return false;
  }
}

// Transcription Persistence Functions
function loadTranscriptions(): any[] {
  try {
    if (fs.existsSync(TRANSCRIPTIONS_FILE)) {
      const data = fs.readFileSync(TRANSCRIPTIONS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed to load transcriptions:', error);
    return [];
  }
}

function saveTranscriptions(transcriptions: any[]): { success: boolean } {
  try {
    fs.writeFileSync(TRANSCRIPTIONS_FILE, JSON.stringify(transcriptions, null, 2));
    console.log('Transcriptions saved successfully');
    
    // Send toast notification to main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('toast-notification', {
        message: `💾 Transcription saved to ${path.basename(TRANSCRIPTIONS_FILE)}`,
        type: 'success'
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to save transcriptions:', error);
    
    // Send error toast to main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('toast-notification', {
        message: '✗ Failed to save transcription',
        type: 'error'
      });
    }
    
    return { success: false };
  }
}

// Initialize Groq client with secure storage
let groq: Groq | null = null;

function initializeGroqClient(apiKey?: string): boolean {
  try {
    const key = apiKey || loadApiKeySecurely();
    if (!key) {
      console.log('No API key available for Groq client initialization');
      return false;
    }
    
    groq = new Groq({
      apiKey: key,
    });
    console.log('Groq client initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Groq client:', error);
    return false;
  }
}

// NOTE: Groq client initialization moved to after app.whenReady() 
// because safeStorage is only available after the app is ready

// Migration from .env to secure storage
function migrateFromEnv(): void {
  try {
    // Check if we already have a secure API key
    const existingKey = loadApiKeySecurely();
    if (existingKey) {
      console.log('API key already exists in secure storage, skipping migration');
      return;
    }
    
    // Check if .env file exists and has GROQ_API_KEY
    const envFilePath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envFilePath)) {
      const envContent = fs.readFileSync(envFilePath, 'utf8');
      const envLines = envContent.split('\n');
      
      for (const line of envLines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('GROQ_API_KEY=')) {
          const apiKey = trimmed.substring('GROQ_API_KEY='.length).trim();
          if (apiKey && apiKey.startsWith('gsk_')) {
            console.log('Migrating API key from .env to secure storage...');
            const saved = saveApiKeySecurely(apiKey);
            if (saved) {
              console.log('API key migrated successfully');
              // Optionally remove from .env (commented out for safety)
              // const newEnvContent = envLines.filter(l => !l.trim().startsWith('GROQ_API_KEY=')).join('\n');
              // fs.writeFileSync(envFilePath, newEnvContent);
            } else {
              console.error('Failed to migrate API key to secure storage');
            }
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during migration from .env:', error);
  }
}

// Run migration on startup
migrateFromEnv();

function createWindow(): void {
  // Create the browser window with custom title bar
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    // Remove the default title bar completely
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Enable sandbox for extra security
      sandbox: true,
    },
  });

  // Set Content Security Policy headers
  // Note: For production, consider implementing nonces or building without inline scripts
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self'",
            // Script CSP: unsafe-inline limited by unsafe-eval removed, strict-dynamic could be added in future
            "script-src 'self' 'unsafe-inline'",
            // Style CSP: unsafe-inline needed for React styled-components, but restricted to self
            "style-src 'self' 'unsafe-inline'",
            // Image sources: limited to self, data URIs, and HTTPS only
            "img-src 'self' data: https:",
            // Font sources: limited to self and data URIs only
            "font-src 'self' data:",
            // Network connections: whitelist only required APIs
            "connect-src 'self' https://api.groq.com https://mighty-bulldog-76.clerk.accounts.dev",
            // Media: only self (for audio recording)
            "media-src 'self' blob:",
            // Explicitly block objects, embeds, applets
            "object-src 'none'",
            "embed-src 'none'",
            // Base URI: prevent base tag injection
            "base-uri 'self'",
            // Forms: only allow submission to self
            "form-action 'self'",
            // Prevent framing entirely
            "frame-ancestors 'none'",
            "frame-src 'none'",
            // Block plugins
            "plugin-types ''",
            // Upgrade insecure requests
            "upgrade-insecure-requests",
            // Require Trusted Types (future enhancement)
            // "require-trusted-types-for 'script'",
            // Prevent MIME sniffing
            "block-all-mixed-content"
          ].join('; ')
        ],
        // Additional security headers
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'X-XSS-Protection': ['1; mode=block'],
        'Referrer-Policy': ['no-referrer']
      }
    });
  });

  // and load the index.html of the app.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    // Only open DevTools in development AND not in production build
    // Extra safety: check if app is packaged
    if (!app.isPackaged) {
      mainWindow.webContents.openDevTools();
      console.log('DevTools enabled (development mode, unpacked app)');
    } else {
      console.warn('DevTools disabled (app is packaged)');
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    // Ensure DevTools is never accessible in production
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
      console.warn('DevTools blocked in production mode');
    });
  }

  // Create system tray
  createTray();

  // Handle window control events
  ipcMain.handle('window-minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.handle('window-toggle-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('window-close', () => {
    // Hide to tray instead of closing
    mainWindow.hide();
  });

  // Handle opening active window
  ipcMain.handle('open-active-window', () => {
    createActiveWindow();
  });

  // Handle closing active window
  ipcMain.handle('close-active-window', () => {
    if (activeWindow && !activeWindow.isDestroyed()) {
      activeWindow.hide();
    }
  });

  // Handle toggling active window
  ipcMain.handle('toggle-active-window', () => {
    if (!activeWindow || activeWindow.isDestroyed()) {
      createActiveWindow();
    } else if (activeWindow.isVisible()) {
      activeWindow.hide();
    } else {
      activeWindow.show();
    }
  });

  // Handle transcription with Groq Whisper API
  ipcMain.handle('transcribe-audio', async (event, audioBuffer: ArrayBuffer) => {
    // Rate limiting: Max 20 requests per minute
    const allowed = await checkRateLimit(rateLimiters.transcription, 'transcribe-audio');
    
    if (!allowed) {
      const errorMsg = 'Too many transcription requests. Please wait a moment before trying again.';
      console.warn('⚠️ Transcription rate limit exceeded');
      
      // Log rate limit violation
      securityLogger.logRateLimitExceeded({
        action: 'transcribe-audio',
        limit: '20 requests per minute',
        service: 'Groq Whisper API'
      });
      
      // Send warning toast to main window
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('toast-notification', {
          message: '⚠️ Slow down! Please wait before transcribing again.',
          type: 'warning'
        });
      }
      
      return { success: false, error: errorMsg };
    }
    
    let tempFilePath: string | null = null;
    
    try {
      // Check if Groq client is initialized
      if (!groq) {
        console.error('Groq client not initialized. Please configure API key in settings.');
        const errorMsg = 'API key not configured. Please set your Groq API key in Settings.';
        
        // Send error toast to main window
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('toast-notification', {
            message: `✗ Transcription failed: ${errorMsg}`,
            type: 'error'
          });
        }
        
        return { success: false, error: errorMsg };
      }
      
      console.log('Starting transcription with Groq Whisper API...');
      
      // Create temporary file for audio with cryptographically random name
      const tempDir = os.tmpdir();
      const randomName = crypto.randomBytes(16).toString('hex');
      tempFilePath = path.join(tempDir, `sweesh_recording_${randomName}.webm`);
      
      // Write audio buffer to file
      fs.writeFileSync(tempFilePath, Buffer.from(audioBuffer));
      
      // Read file as stream for Groq API
      const audioFile = fs.createReadStream(tempFilePath);
      
      // Call Groq Whisper API
      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-large-v3",
        response_format: "text"
      });
      
      console.log('Transcription completed:', transcription);
      
      // Automatically copy transcription to clipboard (works even when app is in background)
      try {
        // Groq API returns the transcription text directly when response_format is "text"
        const transcriptionText = typeof transcription === 'string' ? transcription : String(transcription);
        clipboard.writeText(transcriptionText);
        console.log('Transcription copied to clipboard automatically');
      } catch (clipboardError) {
        console.error('Failed to copy to clipboard:', clipboardError);
        // Continue with transcription even if clipboard fails
      }
      
      // Send success toast to main window (no sound, just silent notification)
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('toast-notification', {
          message: '✓ Transcription successful',
          type: 'success'
        });
      }
      
      return { success: true, text: transcription };
      
    } catch (error) {
      console.error('Transcription failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // Send error toast to main window
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('toast-notification', {
          message: `✗ Transcription failed: ${errorMsg}`,
          type: 'error'
        });
      }
      
      return { success: false, error: errorMsg };
    } finally {
      // Always clean up temporary file, even on error
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          console.log('Temporary audio file cleaned up:', tempFilePath);
        } catch (cleanupError) {
          console.error('Failed to clean up temporary file:', cleanupError);
          // Don't throw - just log the error
        }
      }
    }
  });

  // Handle sending transcription to main window
  ipcMain.handle('send-transcription-to-main', (event, transcriptionData) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('new-transcription', transcriptionData);
    }
  });

  // API Key Management IPC Handlers
  ipcMain.handle('save-api-key', async (event, apiKey: string) => {
    try {
      // Basic validation
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        securityLogger.logAPIKeyValidationFailed({
          reason: 'Invalid API key format (empty or non-string)',
          provided: typeof apiKey
        });
        return { success: false, error: 'Invalid API key format' };
      }
      
      if (!apiKey.startsWith('gsk_')) {
        securityLogger.logAPIKeyValidationFailed({
          reason: 'API key does not start with required prefix',
          expected: 'gsk_',
          providedPrefix: apiKey.substring(0, 4)
        });
        return { success: false, error: 'API key must start with "gsk_"' };
      }
      
      // Check encryption method before saving
      const encryptionAvailable = safeStorage.isEncryptionAvailable();
      const platform = os.platform();
      
      const saved = saveApiKeySecurely(apiKey.trim());
      if (!saved) {
        return { success: false, error: 'Failed to save API key securely' };
      }
      
      // Show toast notification about encryption method
      if (encryptionAvailable) {
        let backend: string = 'unknown';
        try {
          const anySafe: any = safeStorage as unknown as any;
          if (typeof anySafe.getSelectedStorageBackend === 'function') {
            backend = anySafe.getSelectedStorageBackend();
          }
        } catch {}
        mainWindow?.webContents.send('toast-notification', {
          message: `API key saved with OS-level encryption (${backend})`,
          type: 'success'
        });
      } else {
        mainWindow?.webContents.send('toast-notification', {
          message: 'OS-level encryption not available. Using AES-256-CBC fallback.',
          type: 'warning'
        });
      }
      
      // Re-initialize Groq client with new key
      const initialized = initializeGroqClient(apiKey.trim());
      if (!initialized) {
        return { success: false, error: 'Failed to initialize Groq client with new API key' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error saving API key:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  });

  ipcMain.handle('get-api-key-status', () => {
    return getApiKeyStatus();
  });

  ipcMain.handle('update-api-key', async (event, apiKey: string) => {
    try {
      // Basic validation
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
        securityLogger.logAPIKeyValidationFailed({
          reason: 'Invalid API key format during update',
          provided: typeof apiKey
        });
        return { success: false, error: 'Invalid API key format' };
      }
      
      if (!apiKey.startsWith('gsk_')) {
        securityLogger.logAPIKeyValidationFailed({
          reason: 'API key update failed - invalid prefix',
          expected: 'gsk_',
          providedPrefix: apiKey.substring(0, 4)
        });
        return { success: false, error: 'API key must start with "gsk_"' };
      }
      
      // Delete old key and save new one
      deleteApiKeySecurely();
      const saved = saveApiKeySecurely(apiKey.trim());
      if (!saved) {
        return { success: false, error: 'Failed to update API key securely' };
      }
      
      // Re-initialize Groq client with new key
      const initialized = initializeGroqClient(apiKey.trim());
      if (!initialized) {
        return { success: false, error: 'Failed to initialize Groq client with updated API key' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating API key:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  });

  ipcMain.handle('delete-api-key', () => {
    try {
      const deleted = deleteApiKeySecurely();
      if (!deleted) {
        return { success: false, error: 'Failed to delete API key' };
      }
      
      // Clear Groq client
      groq = null;
      console.log('API key deleted and Groq client cleared');
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting API key:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  });

  ipcMain.handle('get-encryption-status', () => {
    const platform = os.platform();
    const currentEncryptionAvailable = safeStorage.isEncryptionAvailable();
    
    // getSelectedStorageBackend is only available in newer Electron versions
    let currentBackend = 'unknown';
    try {
      const anySafe: any = safeStorage as any;
      if (typeof anySafe.getSelectedStorageBackend === 'function') {
        currentBackend = anySafe.getSelectedStorageBackend();
      } else {
        currentBackend = currentEncryptionAvailable ? 'available' : 'unavailable';
      }
    } catch {
      currentBackend = currentEncryptionAvailable ? 'available' : 'unavailable';
    }
    
    let warningMessage = null;
    let setupInstructions = null;
    
    if (!currentEncryptionAvailable) {
      if (platform === 'linux') {
        warningMessage = 'OS-level encryption is not available. API keys will be stored with AES-256-CBC fallback.';
        setupInstructions = {
          title: 'Linux Setup Instructions',
          steps: [
            'Install libsecret for better security:',
            '• Ubuntu/Debian: sudo apt-get install libsecret-1-0',
            '• Fedora: sudo dnf install libsecret',
            '• Arch: sudo pacman -S libsecret',
            '• After installation, restart the application'
          ]
        };
      } else {
        warningMessage = 'OS-level encryption is not available. API keys will be stored with AES-256-CBC fallback.';
      }
    }
    
    return { 
      isEncryptionAvailable: currentEncryptionAvailable,
      encryptionBackend: currentBackend,
      platform,
      warningMessage,
      setupInstructions
    };
  });

  // Toast notification handler
  ipcMain.handle('show-toast', (event, message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('toast-notification', { message, type });
    }
  });

  // Authentication IPC Handlers
  ipcMain.handle('get-auth-status', () => {
    return getAuthStatus();
  });

  ipcMain.handle('start-auth-flow', () => {
    try {
      // Generate a unique challenge and UUID for this auth session
      const challenge = crypto.randomUUID();
      const uuid = crypto.randomUUID();
      
      // Construct the auth URL with parameters
      const authUrl = `${AUTH_LANDING_URL}?challenge=${challenge}&uuid=${uuid}&mode=login`;
      
      console.log('Starting auth flow with URL:', authUrl);
      
      // Validate URL before opening (security check)
      if (!validateExternalUrl(authUrl, AUTH_LANDING_URL)) {
        console.error('URL validation failed for auth flow');
        securityLogger.logMaliciousURLBlocked({
          url: authUrl,
          reason: 'Failed external URL validation for auth flow',
          expectedBase: AUTH_LANDING_URL
        });
        return { success: false, error: 'Invalid authentication URL' };
      }
      
      // Open the browser to the auth page
      shell.openExternal(authUrl);
      
      return { success: true, challenge, uuid };
    } catch (error) {
      console.error('Error starting auth flow:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('logout', () => {
    try {
      const deleted = deleteAuthSecurely();
      if (deleted) {
        console.log('User logged out successfully');
        return { success: true };
      } else {
        return { success: false, error: 'Failed to delete auth data' };
      }
    } catch (error) {
      console.error('Error during logout:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Onboarding IPC Handlers
  ipcMain.handle('check-onboarding-status', () => {
    return checkOnboardingStatus();
  });

  ipcMain.handle('complete-onboarding', () => {
    return completeOnboarding();
  });

  ipcMain.handle('skip-onboarding', () => {
    return skipOnboarding();
  });

  ipcMain.handle('clear-all-data', () => {
    try {
      const cleared = clearAllUserData();
      return { success: cleared };
    } catch (error) {
      console.error('Error clearing data:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Auto-updater IPC handlers (electron-updater for GitHub releases)
  ipcMain.handle('check-for-updates', async () => {
    try {
      await checkForUpdates();
      return { success: true };
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('install-update-and-restart', () => {
    try {
      installUpdateAndRestart();
      return { success: true };
    } catch (error) {
      console.error('Failed to install update:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Persistence IPC Handlers
  ipcMain.handle('load-transcriptions', () => {
    return loadTranscriptions();
  });

  ipcMain.handle('save-transcriptions', (event, transcriptions: any[]) => {
    return saveTranscriptions(transcriptions);
  });

  // Security Statistics IPC Handler
  ipcMain.handle('get-security-statistics', () => {
    try {
      return securityLogger.getStatistics();
    } catch (error) {
      console.error('Failed to get security statistics:', error);
      return { error: 'Failed to retrieve security statistics' };
    }
  });

  // External links handler
  ipcMain.handle('open-external', async (event, url: string) => {
    try {
      // Validate that the URL is safe to open
      const allowedDomains = ['console.groq.com', 'groq.com'];
      const parsedUrl = new URL(url);
      
      // Check if the domain is in the allowed list
      const isAllowed = allowedDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowed) {
        console.error('Attempted to open disallowed URL:', url);
        securityLogger.logMaliciousURLBlocked({
          url,
          reason: 'Domain not in allowed list',
          attemptedDomain: parsedUrl.hostname,
          allowedDomains: allowedDomains.join(', ')
        });
        return;
      }
      
      // Open the URL in the user's default browser
      await shell.openExternal(url);
      console.log('Opened external URL:', url);
    } catch (error) {
      console.error('Failed to open external URL:', error);
    }
  });

  // Pending update check (non-intrusive, compares versions)
  ipcMain.handle('check-pending-update', () => {
    try {
      const currentVersion = app.getVersion();
      const UPDATER_PENDING_DIR = getUpdaterPendingDir();
      console.log('🔍 Checking for pending updates...');
      console.log('📌 Current app version:', currentVersion);
      
      if (!fs.existsSync(UPDATER_PENDING_DIR)) {
        console.log('📂 No pending update directory found');
        console.log('🔔 Update Required Modal: NOT NEEDED - No directory');
        return { hasUpdate: false, currentVersion };
      }

      const files = fs.readdirSync(UPDATER_PENDING_DIR);
      console.log('📂 Files in pending directory:', files.length > 0 ? files.join(', ') : 'none');
      
      // Only match files with pattern: Sweesh-Setup-x.x.x.exe (not temp or partial downloads)
      const installerFile = files.find(file => {
        const match = file.match(/^Sweesh-Setup-\d+\.\d+\.\d+\.exe$/i);
        return match !== null;
      });
      
      if (installerFile) {
        console.log('📦 Valid installer file found:', installerFile);
        
        // Parse version from filename
        const versionMatch = installerFile.match(/(\d+\.\d+\.\d+)/);
        const installerVersion = versionMatch ? versionMatch[1] : null;
        
        if (!installerVersion) {
          console.log('❌ Could not parse version from filename');
          console.log('🔔 Update Required Modal: NOT NEEDED - Invalid version format');
          return { hasUpdate: false, currentVersion };
        }
        
        console.log('📦 Installer version:', installerVersion);
        
        // Compare versions using semver
        const semver = require('semver');
        const isNewer = semver.gt(installerVersion, currentVersion);
        
        console.log('🔍 Version comparison:');
        console.log('   Current:', currentVersion);
        console.log('   Installer:', installerVersion);
        console.log('   Is installer newer?', isNewer);
        
        if (isNewer) {
          console.log('✅ NEWER version found in directory!');
          console.log('🔔 Update Required Modal: NEEDED - Installer is newer');
          return { 
            hasUpdate: true, 
            version: installerVersion,
            currentVersion: currentVersion,
            filename: installerFile 
          };
        } else {
          console.log('ℹ️ Installer version is not newer than current version');
          console.log('🔔 Update Required Modal: NOT NEEDED - Same or older version');
          return { hasUpdate: false, currentVersion, installerVersion };
        }
      }
      
      console.log('📂 No valid installer file found (only Sweesh-Setup-x.x.x.exe pattern accepted)');
      console.log('🔔 Update Required Modal: NOT NEEDED - No valid installer');
      return { hasUpdate: false, currentVersion };
    } catch (error) {
      console.error('❌ Error checking for pending update:', error);
      console.log('🔔 Update Required Modal: NOT NEEDED - Error occurred');
      return { hasUpdate: false };
    }
  });

  // Open pending updates directory in file explorer
  ipcMain.handle('open-pending-directory', async () => {
    try {
      const UPDATER_PENDING_DIR = getUpdaterPendingDir();
      // Create directory if it doesn't exist
      if (!fs.existsSync(UPDATER_PENDING_DIR)) {
        fs.mkdirSync(UPDATER_PENDING_DIR, { recursive: true });
        console.log('📂 Created pending updates directory');
      }
      
      // Open directory in file explorer
      await shell.openPath(UPDATER_PENDING_DIR);
      console.log('📂 Opened pending updates directory:', UPDATER_PENDING_DIR);
      return { success: true, path: UPDATER_PENDING_DIR };
    } catch (error) {
      console.error('❌ Failed to open pending directory:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Handle window close event
  mainWindow.on('close', (event) => {
    // Prevent default close behavior
    event.preventDefault();
    // Hide to tray instead
    mainWindow.hide();
  });
}

// Deep Link Protocol Registration
function registerDeepLinkProtocol(): void {
  // Register the protocol for deep linking
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL_NAME, process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL_NAME);
  }
}

// URL validation function to prevent malicious URL manipulation
function validateExternalUrl(urlToValidate: string, expectedBaseUrl: string): boolean {
  try {
    const parsedUrl = new URL(urlToValidate);
    const parsedBaseUrl = new URL(expectedBaseUrl);
    
    // Check protocol (only allow https)
    if (parsedUrl.protocol !== 'https:') {
      console.warn('Invalid protocol detected:', parsedUrl.protocol);
      securityLogger.logSuspiciousPattern({
        pattern: 'Invalid URL protocol',
        description: 'Attempted to use non-HTTPS protocol',
        protocol: parsedUrl.protocol,
        url: urlToValidate
      });
      return false;
    }
    
    // Check that the origin matches the expected base URL
    if (parsedUrl.origin !== parsedBaseUrl.origin) {
      console.warn('Origin mismatch. Expected:', parsedBaseUrl.origin, 'Got:', parsedUrl.origin);
      securityLogger.logSuspiciousPattern({
        pattern: 'Origin mismatch',
        description: 'URL origin does not match expected base',
        expected: parsedBaseUrl.origin,
        received: parsedUrl.origin
      });
      return false;
    }
    
    // Check that the pathname starts with the expected base path
    if (!parsedUrl.pathname.startsWith(parsedBaseUrl.pathname)) {
      console.warn('Path mismatch. Expected path to start with:', parsedBaseUrl.pathname, 'Got:', parsedUrl.pathname);
      securityLogger.logSuspiciousPattern({
        pattern: 'Path mismatch',
        description: 'URL path does not start with expected base path',
        expectedPath: parsedBaseUrl.pathname,
        receivedPath: parsedUrl.pathname
      });
      return false;
    }
    
    // Additional check: ensure no unusual characters in the URL
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /<iframe/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(urlToValidate)) {
        console.warn('Dangerous pattern detected in URL:', pattern);
        securityLogger.logSuspiciousPattern({
          pattern: 'Dangerous URL pattern',
          description: 'Malicious pattern detected in URL',
          detectedPattern: pattern.toString(),
          url: urlToValidate
        });
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('URL validation error:', error);
    securityLogger.logInvalidInput({
      field: 'url-validation',
      reason: 'URL parsing error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

// Initialize JWKS client for JWT verification
const jwksClientInstance = jwksClient({
  jwksUri: CLERK_JWKS_URL,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

// Initialize deduplication tracker for authentication attempts
// Prevents duplicate auth requests within 60 seconds
const authDeduplicator = new DeduplicationTracker(60000);

// Helper function to get signing key from JWKS
function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// JWT Validation Functions with proper signature verification
async function validateJWTToken(token: string): Promise<any> {
  try {
    console.log('Starting JWT validation with signature verification...');
    
    // First decode to check structure (without verification)
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded || typeof decoded === 'string') {
      throw new Error('Invalid JWT token format');
    }
    
    if (!decoded.header.kid) {
      throw new Error('JWT token missing kid (key ID) in header');
    }
    
    // Verify the JWT signature using Clerk's JWKS
    const verified = await new Promise<any>((resolve, reject) => {
      jwt.verify(
        token,
        getSigningKey,
        {
          algorithms: ['RS256'], // Clerk uses RS256 algorithm
          complete: false
        },
        (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded);
          }
        }
      );
    });
    
    const payload = verified as any;
    
    // Validate token expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('JWT token has expired');
    }
    
    // Validate token not-before time
    if (payload.nbf && Date.now() < payload.nbf * 1000) {
      throw new Error('JWT token not yet valid');
    }
    
    // Extract user information from verified JWT claims
    const userData = {
      userId: payload.userId || payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      imageUrl: payload.imageUrl,
      expiresAt: new Date(payload.exp * 1000).toISOString()
    };
    
    console.log('JWT token verified and validated successfully');
    return userData;
  } catch (error) {
    console.error('JWT validation failed:', error);
    if (error instanceof Error) {
      throw new Error(`JWT validation failed: ${error.message}`);
    }
    throw error;
  }
}

// Handle Deep Link Authentication with rate limiting and deduplication
function handleDeepLinkAuth(url: string): void {
  try {
    console.log('Received deep link:', url);
    
    // Parse the deep link URL: sweesh://auth/callback?token=...&challenge=...&uuid=...
    const urlObj = new URL(url);
    
    // Handle both /auth/callback and /callback paths
    const validPaths = ['/auth/callback', '/callback', 'auth/callback', 'callback'];
    if (!validPaths.includes(urlObj.pathname)) {
      console.log('Invalid deep link path:', urlObj.pathname);
      securityLogger.logSuspiciousPattern({
        pattern: 'Invalid deep link path',
        description: 'Received deep link with unauthorized path',
        path: urlObj.pathname,
        validPaths: validPaths.join(', ')
      });
      return;
    }
    
    const token = urlObj.searchParams.get('token');
    const challenge = urlObj.searchParams.get('challenge');
    const uuid = urlObj.searchParams.get('uuid');
    
    if (!token || !challenge || !uuid) {
      console.log('Missing required parameters in deep link');
      securityLogger.logInvalidInput({
        field: 'deep-link-parameters',
        reason: 'Missing required authentication parameters',
        hasToken: !!token,
        hasChallenge: !!challenge,
        hasUuid: !!uuid
      });
      return;
    }
    
    // Deduplication check: Prevent duplicate auth attempts
    const attemptKey = `${challenge}-${uuid}`;
    if (authDeduplicator.isDuplicate(attemptKey)) {
      console.warn('🔁 Duplicate authentication attempt blocked:', attemptKey);
      securityLogger.logDeduplicationBlocked({
        key: attemptKey,
        action: 'authentication',
        challenge,
        uuid
      });
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('auth-error', 'Duplicate authentication attempt detected. Please wait.');
      }
      return;
    }
    
    // Rate limiting check: Max 3 attempts per minute
    checkRateLimit(rateLimiters.authentication, 'deep-link-auth')
      .then(allowed => {
        if (!allowed) {
          console.warn('⚠️ Authentication rate limit exceeded');
          securityLogger.logRateLimitExceeded({
            action: 'deep-link-auth',
            limit: '3 attempts per minute',
            challenge,
            uuid
          });
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('auth-error', 
              'Too many authentication attempts. Please wait a moment before trying again.'
            );
          }
          return;
        }
        
        // Proceed with JWT validation
        validateJWTToken(token)
          .then((userData) => {
            // Save authentication data
            const authData = {
              user: userData,
              challenge,
              uuid,
              authenticatedAt: new Date().toISOString()
            };
            
            const saved = saveAuthSecurely(authData);
            if (saved) {
              console.log('Authentication successful, user data saved');
              
              // Notify the renderer process
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('auth-success', userData);
              }
            } else {
              console.error('Failed to save authentication data');
              securityLogger.logAuthFailed({
                reason: 'Failed to save authentication data',
                userId: userData.userId,
                challenge
              });
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('auth-error', 'Failed to save authentication data');
              }
            }
          })
          .catch((error) => {
            console.error('Authentication failed:', error);
            securityLogger.logJWTValidationFailed({
              error: error.message,
              challenge,
              uuid
            });
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('auth-error', 'Authentication failed: ' + error.message);
            }
          });
      })
      .catch((error) => {
        console.error('Rate limit check error:', error);
        // Fail-open: allow the auth attempt if rate limiter errors
        validateJWTToken(token)
          .then((userData) => {
            const authData = {
              user: userData,
              challenge,
              uuid,
              authenticatedAt: new Date().toISOString()
            };
            const saved = saveAuthSecurely(authData);
            if (saved && mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('auth-success', userData);
            }
          })
          .catch((validationError) => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('auth-error', 'Authentication failed: ' + validationError.message);
            }
          });
      });
  } catch (error) {
    console.error('Error handling deep link auth:', error);
  }
}

function createTray(): void {
  // Create tray icon
  const trayIconPath = path.join(__dirname, 'icons', '32x32.png');
  tray = new Tray(trayIconPath);
  
  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Sweesh',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Start on boot',
      type: 'checkbox',
      checked: false, // We'll check this dynamically
      click: (menuItem) => {
        toggleStartup(menuItem.checked);
      }
    },
    {
      label: 'About',
      click: () => {
        showAboutDialog();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Exit',
      click: () => {
        forceQuitApp();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.setToolTip('Sweesh Voice Transcription');
  
  // Double click to show window
  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
  
  // Check startup status on creation
  checkStartupStatus();
}

function createActiveWindow(startRecording: boolean = false): void {
  // Create the active window as a separate independent window
  activeWindow = new BrowserWindow({
    fullscreen: true, // Always fullscreen
    frame: false, // Remove window frame (frameless)
    resizable: false, // Non-resizable
    transparent: true, // Make window transparent
    backgroundColor: '#00000000', // Transparent background color
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Enable sandbox for extra security
      sandbox: true,
    },
    // No parent property - this makes it a separate independent window
    modal: false, // Not modal so both windows can be used
    show: false, // Don't show immediately
    skipTaskbar: true, // Don't show in taskbar
    alwaysOnTop: true, // Always on top
  });

  // Set Content Security Policy headers for active window (stricter for recording window)
  activeWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self'",
            // Script CSP: inline needed for React but no eval
            "script-src 'self' 'unsafe-inline'",
            // Style CSP: inline needed for styled components
            "style-src 'self' 'unsafe-inline'",
            // Image sources: limited to self and data URIs
            "img-src 'self' data:",
            // Font sources: limited to self and data URIs
            "font-src 'self' data:",
            // Network: only Groq API for transcription
            "connect-src 'self' https://api.groq.com",
            // Media: self and blob for audio recording
            "media-src 'self' blob:",
            // Block all object types
            "object-src 'none'",
            "embed-src 'none'",
            // Prevent base tag injection
            "base-uri 'self'",
            // No form submissions from active window
            "form-action 'none'",
            // Prevent any framing
            "frame-ancestors 'none'",
            "frame-src 'none'",
            // Block plugins
            "plugin-types ''",
            // Block mixed content
            "block-all-mixed-content"
          ].join('; ')
        ],
        // Additional security headers for active window
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'Referrer-Policy': ['no-referrer']
      }
    });
  });

  // Load the active HTML file
  if (process.env.NODE_ENV === 'development') {
    activeWindow.loadFile(path.join(__dirname, 'active.html'));
    // Only open DevTools in development AND not in production build
    if (!app.isPackaged) {
      activeWindow.webContents.openDevTools();
      console.log('Active window DevTools enabled (development mode, unpacked app)');
    } else {
      console.warn('Active window DevTools disabled (app is packaged)');
    }
  } else {
    activeWindow.loadFile(path.join(__dirname, 'active.html'));
    // Ensure DevTools is never accessible in production
    activeWindow.webContents.on('devtools-opened', () => {
      activeWindow.webContents.closeDevTools();
      console.warn('Active window DevTools blocked in production mode');
    });
  }

  // Show active window when ready
  activeWindow.once('ready-to-show', () => {
    activeWindow.show();
    isActiveWindowVisible = true;
    
    // If recording should start immediately, send the event after the window is ready
    if (startRecording && activeWindow && !activeWindow.isDestroyed()) {
      // Wait a tiny bit for webContents to be fully ready
      setTimeout(() => {
        if (activeWindow && !activeWindow.isDestroyed()) {
          activeWindow.webContents.send('start-recording');
          console.log('Recording started after window ready');
        }
      }, 100);
    }
  });

  // Handle active window close
  activeWindow.on('closed', () => {
    activeWindow = null as any;
  });

  // Handle active window control events (since it's frameless)
  ipcMain.handle('active-window-minimize', () => {
    if (activeWindow) {
      activeWindow.minimize();
    }
  });

  ipcMain.handle('active-window-toggle-maximize', () => {
    if (activeWindow) {
      if (activeWindow.isMaximized()) {
        activeWindow.unmaximize();
      } else {
        activeWindow.maximize();
      }
    }
  });

  ipcMain.handle('active-window-close', () => {
    if (activeWindow) {
      activeWindow.close();
    }
  });
}

// Helper function to escape shell arguments (defense in depth)
function escapeShellArg(arg: string): string {
  // Replace any potentially dangerous characters
  // This is a defense-in-depth measure alongside using execFile
  return arg.replace(/["'`$\\]/g, '\\$&');
}

// Function to toggle startup on boot (secure implementation)
function toggleStartup(enabled: boolean): void {
  const appName = 'Sweesh';
  const appPath = process.execPath;
  
  if (process.platform === 'win32') {
    // Windows: Use execFile with argument array to prevent command injection
    const regKey = 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
    
    if (enabled) {
      // Use execFile with separate arguments (no string interpolation)
      execFile('reg', [
        'add',
        regKey,
        '/v',
        appName,
        '/t',
        'REG_SZ',
        '/d',
        appPath,
        '/f'
      ], (error) => {
        if (error) {
          console.log('Failed to enable startup:', error);
        } else {
          console.log('Startup enabled');
          updateTrayMenu();
        }
      });
    } else {
      // Use execFile with separate arguments
      execFile('reg', [
        'delete',
        regKey,
        '/v',
        appName,
        '/f'
      ], (error) => {
        if (error) {
          console.log('Failed to disable startup:', error);
        } else {
          console.log('Startup disabled');
          updateTrayMenu();
        }
      });
    }
  } else if (process.platform === 'darwin') {
    // macOS: Use execFile with proper escaping for AppleScript
    if (enabled) {
      // Use POSIX path format which is safer for AppleScript
      // Escape single quotes and backslashes to prevent script injection
      const safePath = appPath
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/'/g, "\\'");   // Then escape single quotes
      const script = `tell application "System Events" to make login item at end with properties {path:"${safePath}", hidden:false}`;
      
      execFile('osascript', ['-e', script], (error) => {
        if (error) {
          console.log('Failed to enable startup:', error);
        } else {
          console.log('Startup enabled');
          updateTrayMenu();
        }
      });
    } else {
      // Hardcoded app name to prevent injection
      const script = 'tell application "System Events" to delete login item "Sweesh"';
      
      execFile('osascript', ['-e', script], (error) => {
        if (error) {
          console.log('Failed to disable startup:', error);
        } else {
          console.log('Startup disabled');
          updateTrayMenu();
        }
      });
    }
  } else {
    // Linux: Use fs.writeFileSync instead of shell commands (most secure)
    const autostartDir = path.join(process.env.HOME || os.homedir(), '.config', 'autostart');
    const desktopFile = path.join(autostartDir, 'sweesh.desktop');
    
    try {
      if (enabled) {
        // Create directory if it doesn't exist (synchronous for safety)
        if (!fs.existsSync(autostartDir)) {
          fs.mkdirSync(autostartDir, { recursive: true });
        }
        
        // Write desktop file directly using fs (no shell command)
        const desktopContent = `[Desktop Entry]
Type=Application
Name=Sweesh
Exec=${appPath}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true`;
        
        fs.writeFileSync(desktopFile, desktopContent, { mode: 0o644 });
        console.log('Startup enabled');
        updateTrayMenu();
      } else {
        // Delete file directly using fs (no shell command)
        if (fs.existsSync(desktopFile)) {
          fs.unlinkSync(desktopFile);
        }
        console.log('Startup disabled');
        updateTrayMenu();
      }
    } catch (error) {
      console.log('Failed to toggle startup:', error);
    }
  }
}

// Function to check startup status (secure implementation)
function checkStartupStatus(): void {
  const appName = 'Sweesh';
  
  if (process.platform === 'win32') {
    // Windows: Use execFile with argument array
    const regKey = 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
    
    execFile('reg', ['query', regKey, '/v', appName], (error) => {
      const isEnabled = !error;
      updateTrayMenu(isEnabled);
    });
  } else if (process.platform === 'darwin') {
    // macOS: Use execFile for osascript
    const script = 'tell application "System Events" to get the name of every login item';
    
    execFile('osascript', ['-e', script], (error, stdout) => {
      const isEnabled = !error && stdout.includes('Sweesh');
      updateTrayMenu(isEnabled);
    });
  } else {
    // Linux: Use fs.existsSync instead of shell command (most secure)
    const desktopFile = path.join(process.env.HOME || os.homedir(), '.config', 'autostart', 'sweesh.desktop');
    const isEnabled = fs.existsSync(desktopFile);
    updateTrayMenu(isEnabled);
  }
}

// Function to update tray menu with current startup status
function updateTrayMenu(isStartupEnabled?: boolean): void {
  if (!tray) return;
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Sweesh',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Start on boot',
      type: 'checkbox',
      checked: isStartupEnabled !== undefined ? isStartupEnabled : false,
      click: (menuItem) => {
        toggleStartup(menuItem.checked);
      }
    },
    {
      label: 'About',
      click: () => {
        showAboutDialog();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Exit',
      click: () => {
        forceQuitApp();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

// Function to show about dialog
function showAboutDialog(): void {
  const aboutWindow = new BrowserWindow({
    width: 650,
    height: 720,
    minWidth: 400,
    minHeight: 500,
    maxHeight: 720,
    resizable: true,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Open external links in browser
  aboutWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Get font path - use a web-compatible path
  const fontPath = path.join(__dirname, 'fonts', 'EditorsNote-Light.otf');
  const fontUrl = url.pathToFileURL(fontPath).href;

  const aboutHTML = `<!DOCTYPE html>
<html lang="en">
    <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>About Sweesh</title>
      <style>
    @font-face {
      font-family: 'Editors Note';
      src: url('${fontUrl}') format('opentype');
      font-weight: 300;
      font-style: normal;
    }

    * {
          margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Editors Note', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto Mono', 'Courier New', monospace;
          background: #0a0a0a;
      color: #ffffff;
      line-height: 1.6;
      overflow: hidden;
      -webkit-app-region: no-drag;
      height: 100vh;
    }

    /* Custom Titlebar */
    .titlebar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: #0a0a0a;
      border-bottom: 1px solid #1a1a1a;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      -webkit-app-region: drag;
      z-index: 1000;
    }

    .titlebar-title {
      font-size: 13px;
      color: #888;
      font-weight: 500;
    }

    .titlebar-buttons {
      display: flex;
      gap: 8px;
      -webkit-app-region: no-drag;
    }

    .titlebar-button {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: #888;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .titlebar-button:hover {
      background: #1a1a1a;
      color: #ffffff;
    }

    .titlebar-button.close:hover {
      background: #ff6b35;
      color: #ffffff;
    }

    /* Gradient background accent */
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 20% 50%, rgba(255, 107, 53, 0.05) 0%, transparent 50%);
      pointer-events: none;
      z-index: -1;
    }

    .container {
      max-width: min(900px, 95vw);
      margin: 0 auto;
      padding: 60px clamp(16px, 4vw, 20px) 20px;
          display: flex;
      flex-direction: column;
          align-items: center;
      text-align: center;
      height: calc(100vh - 40px);
      overflow-y: auto;
    }

    /* Custom Scrollbar */
    .container::-webkit-scrollbar {
      width: 6px;
    }

    .container::-webkit-scrollbar-track {
      background: transparent;
    }

    .container::-webkit-scrollbar-thumb {
      background: #2a2a2a;
      border-radius: 3px;
      transition: background 0.2s ease;
    }

    .container::-webkit-scrollbar-thumb:hover {
      background: #ff6b35;
    }

    /* Logo Section */
    .logo-container {
      margin-bottom: 16px;
      animation: fadeInDown 0.6s ease-out;
    }

        .logo {
      width: clamp(60px, 12vw, 70px);
      height: clamp(60px, 12vw, 70px);
          object-fit: contain;
      border-radius: clamp(12px, 2.5vw, 16px);
      border: 2px solid #1a1a1a;
      transition: transform 0.3s ease, border-color 0.3s ease;
    }

    .logo:hover {
      transform: translateY(-4px);
      border-color: #ff6b35;
    }

    /* Header Section */
    h1 {
      font-family: 'Editors Note', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: clamp(28px, 6vw, 36px);
      font-weight: 300;
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -1px;
      animation: fadeInUp 0.6s ease-out 0.1s both;
    }

        .tagline {
      font-size: clamp(11px, 2.5vw, 14px);
      color: #ff6b35;
      font-weight: 500;
      letter-spacing: clamp(1px, 0.3vw, 2px);
      text-transform: uppercase;
      margin-bottom: 16px;
      animation: fadeInUp 0.6s ease-out 0.2s both;
    }

    .version-badge {
      display: inline-block;
      padding: 6px 12px;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      font-size: clamp(10px, 2vw, 12px);
          color: #888;
      font-weight: 500;
      margin-bottom: 16px;
      animation: fadeInUp 0.6s ease-out 0.3s both;
    }

    /* Added author section styling */
    .author-section {
          font-size: clamp(11px, 2.5vw, 13px);
      color: #aaa;
      margin-bottom: 16px;
      animation: fadeInUp 0.6s ease-out 0.35s both;
    }

    .author-section a {
      color: #ff6b35;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s ease;
    }

    .author-section a:hover {
      color: #ff8555;
    }

    /* Added social links styling */
    .social-links {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-bottom: 16px;
      animation: fadeInUp 0.6s ease-out 0.4s both;
      flex-wrap: wrap;
    }

    .social-links a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
          background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 8px;
      color: #888;
      transition: all 0.3s ease;
      text-decoration: none;
    }

    .social-links a:hover {
      background: #ff6b35;
      border-color: #ff6b35;
      color: #ffffff;
      transform: translateY(-2px);
    }

    .social-links svg {
      width: 16px;
      height: 16px;
    }

    /* Privacy Policy Link */
    .privacy-policy-link {
      font-size: clamp(11px, 2.5vw, 12px);
      color: #888;
      margin-bottom: 16px;
      animation: fadeInUp 0.6s ease-out 0.45s both;
    }

    .privacy-policy-link a {
      color: #ff6b35;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s ease;
      border-bottom: 1px solid transparent;
    }

    .privacy-policy-link a:hover {
      color: #ff8555;
      border-bottom-color: #ff8555;
    }

    /* Features Section */
        .features {
      background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
          text-align: left;
      animation: fadeInUp 0.6s ease-out 0.5s both;
      backdrop-filter: blur(10px);
      width: 100%;
    }

    .features h3 {
      font-size: clamp(13px, 2.8vw, 14px);
      color: #ffffff;
      margin-bottom: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .features h3::before {
      content: '';
      width: 4px;
      height: 4px;
      background: #ff6b35;
      border-radius: 50%;
    }

        .features ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .features li {
      padding: 4px 0;
          color: #aaa;
          font-size: clamp(10px, 2.2vw, 12px);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .features li::before {
      content: '→';
      color: #ff6b35;
      font-weight: bold;
      min-width: 16px;
    }

    .features strong {
      color: #ffffff;
      font-weight: 600;
    }

    /* Description */
    .description {
      font-size: clamp(12px, 2.5vw, 13px);
      color: #bbb;
      margin-bottom: 16px;
      max-width: min(600px, 95%);
      animation: fadeInUp 0.6s ease-out 0.6s both;
      line-height: 1.6;
    }

    /* Copyright Section */
    .copyright-section {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 16px;
      text-align: left;
      animation: fadeInUp 0.6s ease-out 0.7s both;
      max-width: min(700px, 95%);
      width: 100%;
    }

    .copyright-section h2 {
      font-size: clamp(11px, 2.5vw, 12px);
      color: #ff6b35;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .copyright-text {
      font-size: clamp(10px, 2.2vw, 11px);
      color: #999;
      line-height: 1.6;
      font-family: 'Courier New', monospace;
    }

    .copyright-text strong {
      color: #ffffff;
      font-weight: 600;
    }

    /* Button */
        .close-btn {
      padding: 8px 24px;
          background: #ff6b35;
      color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: clamp(11px, 2.5vw, 12px);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      letter-spacing: 0.5px;
      animation: fadeInUp 0.6s ease-out 0.8s both;
    }

        .close-btn:hover {
          background: #ff8555;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(255, 107, 53, 0.3);
    }

    .close-btn:active {
      transform: translateY(0);
    }

    /* Animations */
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

      </style>
    </head>
    <body>
  <!-- Custom Titlebar -->
  <div class="titlebar">
    <div class="titlebar-title">About Sweesh</div>
    <div class="titlebar-buttons">
      <button class="titlebar-button close" onclick="window.close()" title="Close">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>

  <div class="container">
      <div class="logo-container">
      <img src="https://raw.githubusercontent.com/hasin-codes/sweesh.exe/main/public/icons/logo.svg" alt="Sweesh Logo" class="logo">
      </div>

      <h1>Sweesh</h1>
      <p class="tagline">Speak it, Send it</p>
    <p class="version-badge">Version 1.4.1</p>

    <!-- Added author section with link -->
    <p class="author-section">
      Created by <a href="https://hasin.vercel.app" target="_blank" rel="noopener noreferrer">Hasin Raiyan</a>
    </p>

    <!-- Added social media links -->
    <div class="social-links">
      <a href="https://x.com/hasin_innit" target="_blank" rel="noopener noreferrer" title="X/Twitter" aria-label="X/Twitter">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M10.488 14.651L15.25 21h7l-7.858-10.478L20.93 3h-2.65l-5.117 5.886L8.75 3h-7l7.51 10.015L2.32 21h2.65zM16.25 19L5.75 5h2l10.5 14z"></path></svg>
      </a>
      <a href="https://www.linkedin.com/in/hasin-raiyan/" target="_blank" rel="noopener noreferrer" title="LinkedIn" aria-label="LinkedIn">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z"></path></svg>
      </a>
      <a href="https://www.facebook.com/hasin.innit" target="_blank" rel="noopener noreferrer" title="Facebook" aria-label="Facebook">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95"></path></svg>
      </a>
      <a href="https://www.instagram.com/hasin_productions/" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8a3.6 3.6 0 0 0 3.6 3.6h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6a3.6 3.6 0 0 0-3.6-3.6zm4.4 2a4.4 4.4 0 1 1 0 8.8a4.4 4.4 0 0 1 0-8.8m0 2a2.4 2.4 0 1 0 0 4.8a2.4 2.4 0 0 0 0-4.8m5.5-1a1 1 0 1 1 0 2a1 1 0 0 1 0-2"></path></svg>
      </a>
    </div>

    <!-- Privacy Policy Link -->
    <p class="privacy-policy-link">
      <a href="https://sweesh.vercel.app/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
    </p>

      <div class="features">
      <h3>Quick Shortcuts</h3>
      <ul>
        <li><strong>Ctrl+Shift+M</strong></li>
        <li><strong>Alt+Shift+M</strong></li>
        </ul>
      </div>

    <p class="description">A Gnostic Product</p>

    <div class="copyright-section">
      <h2>© Copyright & License</h2>
      <p class="copyright-text">
        <strong>Copyright (c) 2025 Hasin Raiyan. All rights reserved.</strong><br><br>
        This software and associated documentation files (the "Software") are the property of Hasin Raiyan. Unauthorized copying, modification, distribution, or use of the Software, via any medium, is strictly prohibited.<br><br>
        Commercial, personal, or educational use requires explicit written permission from the author.
      </p>
    </div>

      <button class="close-btn" onclick="window.close()">Close</button>
  </div>
    </body>
</html>`;

  // Write HTML to a temporary file to ensure proper font and resource loading
  const tempDir = app.getPath('temp');
  const aboutFilePath = path.join(tempDir, 'sweesh-about.html');
  
  try {
    fs.writeFileSync(aboutFilePath, aboutHTML, 'utf-8');
    aboutWindow.loadFile(aboutFilePath);
    
    // Clean up the temp file when window is closed
    aboutWindow.on('closed', () => {
      try {
        if (fs.existsSync(aboutFilePath)) {
          fs.unlinkSync(aboutFilePath);
        }
      } catch (err) {
        console.error('Failed to clean up about file:', err);
      }
    });
  } catch (error) {
    console.error('Failed to create about window:', error);
    aboutWindow.close();
  }
}

// Prevent multiple instances of the app
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
  // Check encryption availability after app is ready
  checkEncryptionAvailability();
  
  // Initialize security logger (must be done after app is ready)
  securityLogger.initialize();
  
  // Register deep link protocol
  registerDeepLinkProtocol();
  
  createWindow();
  
  // Show the window
  mainWindow.show();
  
  // Setup auto-updater (electron-updater for GitHub releases)
  try {
    setupAutoUpdater(mainWindow);
    
    // Check for updates after 3 seconds (give the app time to fully load)
    setTimeout(() => {
      checkForUpdates().catch(error => {
        console.error('Auto-update check failed:', error);
      });
    }, 3000);
  } catch (error) {
    console.error('Auto-updater setup failed:', error);
    // Continue with normal startup even if auto-updater fails
  }
  
  // Initialize Groq client with saved API key (after app is ready so safeStorage is available)
  setTimeout(() => {
    const apiKeyLoaded = initializeGroqClient();
    const transcriptions = loadTranscriptions();
    const transcriptionCount = transcriptions.length;
    
    // Send startup status toast to main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (apiKeyLoaded) {
        mainWindow.webContents.send('toast-notification', {
          message: `✓ API key loaded | ${transcriptionCount} transcription${transcriptionCount !== 1 ? 's' : ''} retrieved from ${TRANSCRIPTIONS_FILE}`,
          type: 'success'
        });
      } else {
        mainWindow.webContents.send('toast-notification', {
          message: `⚠ No API key found. Please configure in Settings | ${transcriptionCount} transcription${transcriptionCount !== 1 ? 's' : ''} retrieved`,
          type: 'warning'
        });
      }
    }
  }, 1500); // Wait for window to be ready to receive messages
  
  // Auto-updater removed - using only pending directory check
  
  // Wait a bit for the window to be ready
  setTimeout(() => {
    console.log('Setting up global keyboard listener for hold/release...');
    
    // Initialize the global keyboard listener
    keyListener = new GlobalKeyboardListener();
    
    // Track which keys are currently pressed to prevent rapid firing
    let pressedKeys = new Set<string>();
    let isShowing = false;
    
    // Listen for key events
    keyListener.addListener((e, down) => {
      const keyName = e.name;
      const isKeyDown = e.state === "DOWN";
      const isKeyUp = e.state === "UP";
      
      // Track pressed keys (only if keyName exists)
      if (keyName) {
        if (isKeyDown) {
          pressedKeys.add(keyName);
        } else if (isKeyUp) {
          pressedKeys.delete(keyName);
        }
      }
      
      // Check for Ctrl+Shift+M combination
      if (isKeyDown && keyName && keyName === "M" && (pressedKeys.has("LEFT CTRL") || pressedKeys.has("RIGHT CTRL")) && (pressedKeys.has("LEFT SHIFT") || pressedKeys.has("RIGHT SHIFT"))) {
        if (!isShowing) {
          console.log('Ctrl+Shift+M held down - showing active window and starting recording');
          isShowing = true;
          if (!activeWindow || activeWindow.isDestroyed()) {
            createActiveWindow(true); // Pass true to start recording immediately
          } else {
            activeWindow.show();
            isActiveWindowVisible = true;
            // Trigger recording start in active window
            if (activeWindow && !activeWindow.isDestroyed()) {
              activeWindow.webContents.send('start-recording');
            }
          }
        }
      }
      
      // Check for Alt+Shift+M combination
      if (isKeyDown && keyName && keyName === "M" && (pressedKeys.has("LEFT ALT") || pressedKeys.has("RIGHT ALT")) && (pressedKeys.has("LEFT SHIFT") || pressedKeys.has("RIGHT SHIFT"))) {
        if (!isShowing) {
          console.log('Alt+Shift+M held down - showing active window and starting recording');
          isShowing = true;
          if (!activeWindow || activeWindow.isDestroyed()) {
            createActiveWindow(true); // Pass true to start recording immediately
          } else {
            activeWindow.show();
            isActiveWindowVisible = true;
            // Trigger recording start in active window
            if (activeWindow && !activeWindow.isDestroyed()) {
              activeWindow.webContents.send('start-recording');
            }
          }
        }
      }
      
      // Check for F12 (simple test)
      if (isKeyDown && keyName && keyName === "F12") {
        if (!isShowing) {
          console.log('F12 held down - showing active window and starting recording');
          isShowing = true;
          if (!activeWindow || activeWindow.isDestroyed()) {
            createActiveWindow(true); // Pass true to start recording immediately
          } else {
            activeWindow.show();
            isActiveWindowVisible = true;
            // Trigger recording start in active window
            if (activeWindow && !activeWindow.isDestroyed()) {
              activeWindow.webContents.send('start-recording');
            }
          }
        }
      }
      
      // Handle key releases
      if (isKeyUp) {
        // Check for M key release (when Ctrl+Shift+M or Alt+Shift+M was held)
        if (keyName && keyName === "M" && ((pressedKeys.has("LEFT CTRL") || pressedKeys.has("RIGHT CTRL")) || (pressedKeys.has("LEFT ALT") || pressedKeys.has("RIGHT ALT")))) {
          if (isShowing) {
            console.log('M key released - stopping recording and hiding active window');
            // Stop recording first
            if (activeWindow && !activeWindow.isDestroyed()) {
              activeWindow.webContents.send('stop-recording');
            }
            isShowing = false;
            if (activeWindow && !activeWindow.isDestroyed() && isActiveWindowVisible) {
              activeWindow.hide();
              isActiveWindowVisible = false;
            }
          }
        }
        
        // Check for F12 release
        if (keyName && keyName === "F12") {
          if (isShowing) {
            console.log('F12 released - stopping recording and hiding active window');
            // Stop recording first
            if (activeWindow && !activeWindow.isDestroyed()) {
              activeWindow.webContents.send('stop-recording');
            }
            isShowing = false;
            if (activeWindow && !activeWindow.isDestroyed() && isActiveWindowVisible) {
              activeWindow.hide();
              isActiveWindowVisible = false;
            }
          }
        }
        
        // Check for modifier key releases (Ctrl, Alt, Shift)
        if (keyName && (keyName === "LEFT CTRL" || keyName === "RIGHT CTRL" || keyName === "LEFT ALT" || keyName === "RIGHT ALT" || keyName === "LEFT SHIFT" || keyName === "RIGHT SHIFT") && isShowing) {
          console.log(`${keyName} released - stopping recording and hiding active window`);
          // Stop recording first
          if (activeWindow && !activeWindow.isDestroyed()) {
            activeWindow.webContents.send('stop-recording');
          }
          isShowing = false;
          if (activeWindow && !activeWindow.isDestroyed() && isActiveWindowVisible) {
            activeWindow.hide();
            isActiveWindowVisible = false;
          }
        }
      }
    });
    
    console.log('Global keyboard listener setup complete');
    console.log('Hold Ctrl+Shift+M, Alt+Shift+M, or F12 to show voice widget');
    console.log('Release the key to hide the voice widget');
  }, 1000);
});

// Handle deep link when app is already running
app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  
  // Check for deep link in command line arguments
  const deepLinkUrl = commandLine.find(arg => arg.startsWith(`${PROTOCOL_NAME}://`));
  if (deepLinkUrl) {
    handleDeepLinkAuth(deepLinkUrl);
  }
});

// Handle deep link when app is launched with a deep link
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLinkAuth(url);
});

// Prevent app from quitting when all windows are closed (tray behavior)
app.on('window-all-closed', () => {
  // App stays running in tray - no need to quit
  // This prevents the default behavior of quitting when all windows are closed
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Unregister all shortcuts and stop keyboard listener when the app is about to quit
app.on('will-quit', () => {
  console.log('App will quit - cleaning up...');
  globalShortcut.unregisterAll();
  if (keyListener) {
    keyListener.kill();
  }
  
  // Destroy all windows
  BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) {
      win.destroy();
    }
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
}
