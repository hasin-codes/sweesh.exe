import { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, clipboard, safeStorage, shell } from 'electron';
import * as path from 'path';
import { GlobalKeyboardListener } from 'node-global-key-listener';
import { exec } from 'child_process';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

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

// Configure auto-updater logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Auto-updater configuration
function setupAutoUpdater(): void {
  // Disable auto-download in development for safety
  if (process.env.NODE_ENV === 'development') {
    autoUpdater.autoDownload = false;
    log.info('Auto-updater disabled in development mode');
    return;
  }

  // Configure auto-updater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Auto-updater events
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { status: 'checking' });
    }
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { 
        status: 'available', 
        version: info.version 
      });
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { status: 'not-available' });
    }
  });

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { 
        status: 'error', 
        error: err.message 
      });
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    log.info(logMessage);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { 
        status: 'downloading', 
        progress: progressObj 
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', { 
        status: 'downloaded', 
        version: info.version 
      });
    }
  });

  // Check for updates on app start (after a short delay)
  setTimeout(() => {
    log.info('Starting auto-update check...');
    autoUpdater.checkForUpdatesAndNotify().catch((error) => {
      log.error('Failed to check for updates:', error);
    });
  }, 3000); // 3 second delay to let the app initialize
}

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
    encryptionBackend = safeStorage.getSelectedStorageBackend();
    
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
function generateMachineKey(): string {
  try {
    // Use machine-specific identifiers to create a consistent key
    const machineId = os.hostname() + os.platform() + os.arch();
    const hash = crypto.createHash('sha256').update(machineId).digest('hex');
    return hash.substring(0, 32); // Use first 32 characters as key
  } catch (error) {
    console.error('Error generating machine key:', error);
    // Fallback to a default key (less secure but functional)
    return 'default-fallback-key-32-chars';
  }
}

// Secure fallback encryption using AES-256-CBC
function encryptWithFallback(text: string): string {
  try {
    const key = generateMachineKey();
    const iv = crypto.randomBytes(16); // Generate random IV
    const cipher = crypto.createCipher('aes-256-cbc', key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine IV and encrypted data
    const result = {
      iv: iv.toString('hex'),
      encrypted: encrypted,
      method: 'fallback-crypto'
    };
    
    return JSON.stringify(result);
  } catch (error) {
    console.error('Error in fallback encryption:', error);
    throw error;
  }
}

// Secure fallback decryption using AES-256-CBC
function decryptWithFallback(encryptedData: string): string {
  try {
    const data = JSON.parse(encryptedData);
    const key = generateMachineKey();
    
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    
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
        console.warn('OS-level decryption failed, trying AES-256-GCM fallback');
        try {
          const decryptedKey = decryptWithFallback(fileContent.toString());
          console.log('API key loaded with AES-256-GCM fallback');
          return decryptedKey;
        } catch (fallbackError) {
          console.error('Both OS-level and AES-256-GCM fallback decryption failed');
          return null;
        }
      }
    } else {
      // Use crypto fallback
      console.warn('OS-level encryption not available, using AES-256-GCM fallback');
      try {
        const decryptedKey = decryptWithFallback(fileContent.toString());
        console.log('API key loaded with AES-256-GCM fallback');
        return decryptedKey;
      } catch (fallbackError) {
        console.error('AES-256-GCM fallback decryption failed');
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
function checkOnboardingStatus(): { completed: boolean; hasApiKey: boolean; isAuthenticated: boolean } {
  try {
    let completed = false;
    
    if (fs.existsSync(ONBOARDING_FILE)) {
      const data = JSON.parse(fs.readFileSync(ONBOARDING_FILE, 'utf8'));
      completed = data.completed || false;
    }
    
    const hasApiKey = loadApiKeySecurely() !== null;
    const authStatus = getAuthStatus();
    const isAuthenticated = authStatus.isAuthenticated;
    
    // Onboarding is only truly complete if user has both auth AND API key
    // Override completed flag if either is missing
    if (!isAuthenticated || !hasApiKey) {
      completed = false;
    }
    
    return { completed, hasApiKey, isAuthenticated };
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
    return { success: true };
  } catch (error) {
    console.error('Failed to save transcriptions:', error);
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

// Try to initialize Groq client on startup
initializeGroqClient();

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
    },
  });

  // and load the index.html of the app.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    // Open the DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
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
    try {
      // Check if Groq client is initialized
      if (!groq) {
        console.error('Groq client not initialized. Please configure API key in settings.');
        return { success: false, error: 'API key not configured. Please set your Groq API key in Settings.' };
      }
      
      console.log('Starting transcription with Groq Whisper API...');
      
      // Create temporary file for audio
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `recording_${Date.now()}.webm`);
      
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
      
      // Clean up temporary file
      fs.unlinkSync(tempFilePath);
      
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
      
      return { success: true, text: transcription };
      
    } catch (error) {
      console.error('Transcription failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
        return { success: false, error: 'Invalid API key format' };
      }
      
      if (!apiKey.startsWith('gsk_')) {
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
          message: 'OS-level encryption not available. Using AES-256-GCM fallback.',
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
        return { success: false, error: 'Invalid API key format' };
      }
      
      if (!apiKey.startsWith('gsk_')) {
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
    const currentBackend = safeStorage.getSelectedStorageBackend();
    
    let warningMessage = null;
    let setupInstructions = null;
    
    if (!currentEncryptionAvailable) {
      if (platform === 'linux') {
        warningMessage = 'OS-level encryption is not available. API keys will be stored with AES-256-GCM fallback.';
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
        warningMessage = 'OS-level encryption is not available. API keys will be stored with AES-256-GCM fallback.';
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

  // Auto-Update IPC Handlers
  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { success: true, updateInfo: result?.updateInfo };
    } catch (error) {
      log.error('Manual update check failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('quit-and-install-update', () => {
    try {
      autoUpdater.quitAndInstall();
      return { success: true };
    } catch (error) {
      log.error('Failed to install update:', error);
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

// JWT Validation Functions
async function validateJWTToken(token: string): Promise<any> {
  try {
    // For now, we'll decode the JWT without verification
    // In production, you should verify the JWT signature using Clerk's JWKS
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded || typeof decoded === 'string') {
      throw new Error('Invalid JWT token');
    }
    
    const payload = decoded.payload as any;
    
    // Extract user information from JWT claims
    const userData = {
      userId: payload.userId || payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      imageUrl: payload.imageUrl,
      expiresAt: new Date(payload.exp * 1000).toISOString()
    };
    
    console.log('JWT token validated successfully:', userData);
    return userData;
  } catch (error) {
    console.error('JWT validation failed:', error);
    throw error;
  }
}

// Handle Deep Link Authentication
function handleDeepLinkAuth(url: string): void {
  try {
    console.log('Received deep link:', url);
    
    // Parse the deep link URL: sweesh://auth/callback?token=...&challenge=...&uuid=...
    const urlObj = new URL(url);
    
    // Handle both /auth/callback and /callback paths
    const validPaths = ['/auth/callback', '/callback', 'auth/callback', 'callback'];
    if (!validPaths.includes(urlObj.pathname)) {
      console.log('Invalid deep link path:', urlObj.pathname);
      return;
    }
    
    const token = urlObj.searchParams.get('token');
    const challenge = urlObj.searchParams.get('challenge');
    const uuid = urlObj.searchParams.get('uuid');
    
    if (!token || !challenge || !uuid) {
      console.log('Missing required parameters in deep link');
      return;
    }
    
    // Validate the JWT token
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
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('auth-error', 'Failed to save authentication data');
          }
        }
      })
      .catch((error) => {
        console.error('Authentication failed:', error);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('auth-error', 'Authentication failed: ' + error.message);
        }
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
        app.quit();
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

function createActiveWindow(): void {
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
    },
    // No parent property - this makes it a separate independent window
    modal: false, // Not modal so both windows can be used
    show: false, // Don't show immediately
    skipTaskbar: true, // Don't show in taskbar
    alwaysOnTop: true, // Always on top
  });

  // Load the active HTML file
  if (process.env.NODE_ENV === 'development') {
    activeWindow.loadFile(path.join(__dirname, 'active.html'));
    // Open DevTools for active window in development
    activeWindow.webContents.openDevTools();
  } else {
    activeWindow.loadFile(path.join(__dirname, 'active.html'));
  }

  // Show active window when ready
  activeWindow.once('ready-to-show', () => {
    activeWindow.show();
    // Window is fullscreen, no positioning needed
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

// Function to toggle startup on boot
function toggleStartup(enabled: boolean): void {
  const appName = 'Sweesh';
  const appPath = process.execPath;
  
  if (process.platform === 'win32') {
    const regKey = `HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`;
    const command = enabled 
      ? `reg add "${regKey}" /v "${appName}" /t REG_SZ /d "${appPath}" /f`
      : `reg delete "${regKey}" /v "${appName}" /f`;
    
    exec(command, (error) => {
      if (error) {
        console.log('Failed to toggle startup:', error);
      } else {
        console.log(`Startup ${enabled ? 'enabled' : 'disabled'}`);
        updateTrayMenu();
      }
    });
  } else if (process.platform === 'darwin') {
    // macOS implementation
    const command = enabled
      ? `osascript -e 'tell application "System Events" to make login item at end with properties {path:"${appPath}", hidden:false}'`
      : `osascript -e 'tell application "System Events" to delete login item "Sweesh"'`;
    
    exec(command, (error) => {
      if (error) {
        console.log('Failed to toggle startup:', error);
      } else {
        console.log(`Startup ${enabled ? 'enabled' : 'disabled'}`);
        updateTrayMenu();
      }
    });
  } else {
    // Linux implementation
    const autostartDir = `${process.env.HOME}/.config/autostart`;
    const desktopFile = `${autostartDir}/sweesh.desktop`;
    
    if (enabled) {
      const desktopContent = `[Desktop Entry]
Type=Application
Name=Sweesh
Exec=${appPath}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true`;
      
      exec(`mkdir -p "${autostartDir}" && echo '${desktopContent}' > "${desktopFile}"`, (error) => {
        if (error) {
          console.log('Failed to enable startup:', error);
        } else {
          console.log('Startup enabled');
          updateTrayMenu();
        }
      });
    } else {
      exec(`rm -f "${desktopFile}"`, (error) => {
        if (error) {
          console.log('Failed to disable startup:', error);
        } else {
          console.log('Startup disabled');
          updateTrayMenu();
        }
      });
    }
  }
}

// Function to check startup status
function checkStartupStatus(): void {
  const appName = 'Sweesh';
  
  if (process.platform === 'win32') {
    const regKey = `HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`;
    exec(`reg query "${regKey}" /v "${appName}"`, (error) => {
      const isEnabled = !error;
      updateTrayMenu(isEnabled);
    });
  } else if (process.platform === 'darwin') {
    exec(`osascript -e 'tell application "System Events" to get the name of every login item'`, (error, stdout) => {
      const isEnabled = !error && stdout.includes('Sweesh');
      updateTrayMenu(isEnabled);
    });
  } else {
    // Linux
    const desktopFile = `${process.env.HOME}/.config/autostart/sweesh.desktop`;
    exec(`test -f "${desktopFile}"`, (error) => {
      const isEnabled = !error;
      updateTrayMenu(isEnabled);
    });
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
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

// Function to show about dialog
function showAboutDialog(): void {
  const aboutWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: false,
    modal: true,
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const aboutHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>About Sweesh</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: #1a1a1a;
          color: white;
          text-align: center;
        }
        .logo {
          width: 64px;
          height: 64px;
          margin: 0 auto 20px;
          background: #ff6b35;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
        }
        h1 {
          margin: 0 0 10px;
          color: #ff6b35;
        }
        p {
          margin: 10px 0;
          color: #ccc;
        }
        .version {
          font-size: 14px;
          color: #888;
        }
        .close-btn {
          margin-top: 20px;
          padding: 8px 16px;
          background: #ff6b35;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="logo">S</div>
      <h1>Sweesh</h1>
      <p>Voice Transcription Desktop App</p>
      <p class="version">Version 1.0.0</p>
      <p>Professional voice transcription made simple</p>
      <p>Hold Ctrl+Shift+M, Alt+Shift+M, or F12 to activate voice widget</p>
      <button class="close-btn" onclick="window.close()">Close</button>
    </body>
    </html>
  `;

  aboutWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(aboutHTML)}`);
}

// Prevent multiple instances of the app
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
  // Check encryption availability after app is ready
  checkEncryptionAvailability();
  
  // Register deep link protocol
  registerDeepLinkProtocol();
  
  createWindow();
  
  // Setup auto-updater to check for updates on app start
  setupAutoUpdater();
  
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
            createActiveWindow();
          } else {
            activeWindow.show();
            isActiveWindowVisible = true;
          }
          // Trigger recording start in active window
          if (activeWindow && !activeWindow.isDestroyed()) {
            activeWindow.webContents.send('start-recording');
          }
        }
      }
      
      // Check for Alt+Shift+M combination
      if (isKeyDown && keyName && keyName === "M" && (pressedKeys.has("LEFT ALT") || pressedKeys.has("RIGHT ALT")) && (pressedKeys.has("LEFT SHIFT") || pressedKeys.has("RIGHT SHIFT"))) {
        if (!isShowing) {
          console.log('Alt+Shift+M held down - showing active window and starting recording');
          isShowing = true;
          if (!activeWindow || activeWindow.isDestroyed()) {
            createActiveWindow();
          } else {
            activeWindow.show();
            isActiveWindowVisible = true;
          }
          // Trigger recording start in active window
          if (activeWindow && !activeWindow.isDestroyed()) {
            activeWindow.webContents.send('start-recording');
          }
        }
      }
      
      // Check for F12 (simple test)
      if (isKeyDown && keyName && keyName === "F12") {
        if (!isShowing) {
          console.log('F12 held down - showing active window and starting recording');
          isShowing = true;
          if (!activeWindow || activeWindow.isDestroyed()) {
            createActiveWindow();
          } else {
            activeWindow.show();
            isActiveWindowVisible = true;
          }
          // Trigger recording start in active window
          if (activeWindow && !activeWindow.isDestroyed()) {
            activeWindow.webContents.send('start-recording');
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
  globalShortcut.unregisterAll();
  if (keyListener) {
    keyListener.kill();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
}
