/**
 * Auto-Updater Module for Sweesh
 * 
 * Uses electron-updater to automatically download and install updates from GitHub releases
 * Features:
 * - Automatic update checks on startup
 * - Background download of updates
 * - Automatic installation on app restart
 * - Update notifications to user
 */

import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Configure auto-updater
autoUpdater.autoDownload = true; // Automatically download updates
autoUpdater.autoInstallOnAppQuit = true; // Install on quit

// Logging setup
const LOG_FILE = path.join(
  app.getPath('userData'),
  'logs',
  'updater.log'
);

/**
 * Log message to file and console
 */
function log(message: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  try {
    // Ensure log directory exists
    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (error) {
    console.error('Failed to write log:', error);
  }
  
  console.log(logMessage.trim());
}

// Configure auto-updater logging
autoUpdater.logger = {
  info: (msg: any) => log(`[INFO] ${msg}`),
  warn: (msg: any) => log(`[WARN] ${msg}`),
  error: (msg: any) => log(`[ERROR] ${msg}`),
  debug: (msg: any) => log(`[DEBUG] ${msg}`)
} as any;

/**
 * Initialize and configure electron-updater
 */
export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  log('Setting up auto-updater...');
  
  // Event: Checking for updates
  autoUpdater.on('checking-for-update', () => {
    log('Checking for updates from GitHub...');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-checking');
    }
  });
  
  // Event: Update available
  autoUpdater.on('update-available', (info) => {
    log(`Update available: ${info.version}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes
      });
    }
  });
  
  // Event: Update not available
  autoUpdater.on('update-not-available', (info) => {
    log(`No updates available. Current version: ${info.version}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-not-available', {
        version: info.version
      });
    }
  });
  
  // Event: Download progress
  autoUpdater.on('download-progress', (progressObj) => {
    const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    log(logMessage);
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-download-progress', {
        percent: Math.round(progressObj.percent),
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond
      });
    }
  });
  
  // Event: Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    log(`Update downloaded: ${info.version}`);
    log('Update will be installed on app restart');
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-downloaded', {
        version: info.version,
        releaseNotes: info.releaseNotes
      });
    }
  });
  
  // Event: Error
  autoUpdater.on('error', (error) => {
    log(`Auto-updater error: ${error.message}`);
    console.error('Auto-updater error:', error);
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-error', {
        message: error.message
      });
    }
  });
  
  log('Auto-updater configured successfully');
}

/**
 * Check for updates (called on app startup)
 */
export async function checkForUpdates(): Promise<void> {
  try {
    log('Initiating update check...');
    
    // Only check for updates in production (packaged app)
    if (!app.isPackaged) {
      log('Skipping update check in development mode');
      return;
    }
    
    // Check for updates from GitHub releases
    await autoUpdater.checkForUpdates();
  } catch (error) {
    log(`Error checking for updates: ${error instanceof Error ? error.message : String(error)}`);
    console.error('Update check failed:', error);
  }
}

/**
 * Install update and restart app
 */
export function installUpdateAndRestart(): void {
  log('Installing update and restarting app...');
  autoUpdater.quitAndInstall(false, true);
}

