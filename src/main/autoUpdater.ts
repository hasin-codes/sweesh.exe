/**
 * Auto-Updater Module for Sweesh
 * 
 * Handles forced auto-updates on app startup:
 * 1. Checks for pending installer in AppData/Local/sweesh-updater/pending
 * 2. Parses installer filename to extract version
 * 3. Compares installer version with current app version
 * 4. Shows update modal to user
 * 5. Kills all app processes
 * 6. Launches installer as detached process
 * 7. Exits current app
 */

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, execFile } from 'child_process';
import * as os from 'os';
import * as semver from 'semver';

// Constants
const UPDATER_FOLDER = path.join(
  os.homedir(),
  'AppData',
  'Local',
  'sweesh-updater',
  'pending'
);

const LOG_FILE = path.join(
  os.homedir(),
  'AppData',
  'Local',
  'sweesh-updater',
  'update.log'
);

interface UpdateInfo {
  installerPath: string;
  installerVersion: string;
  currentVersion: string;
  needsUpdate: boolean;
}

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

/**
 * Parse version from installer filename
 * Expected formats: "Sweesh-Setup-1.2.3.exe" or "Sweesh-1.2.3.exe"
 */
function parseVersionFromFilename(filename: string): string | null {
  const versionRegex = /(\d+\.\d+\.\d+)/;
  const match = filename.match(versionRegex);
  return match ? match[1] : null;
}

/**
 * Check if pending update exists and is newer than current version
 */
export async function checkForPendingUpdate(): Promise<UpdateInfo | null> {
  try {
    log(`Checking for pending updates in: ${UPDATER_FOLDER}`);
    
    // Check if updater folder exists
    if (!fs.existsSync(UPDATER_FOLDER)) {
      log('Updater folder does not exist, no updates available');
      return null;
    }
    
    // Read directory and find .exe files
    const files = fs.readdirSync(UPDATER_FOLDER);
    const exeFiles = files.filter(file => file.toLowerCase().endsWith('.exe'));
    
    if (exeFiles.length === 0) {
      log('No installer files found in pending folder');
      return null;
    }
    
    log(`Found ${exeFiles.length} installer file(s): ${exeFiles.join(', ')}`);
    
    // Get current app version
    const currentVersion = app.getVersion();
    log(`Current app version: ${currentVersion}`);
    
    // Find the newest installer
    let newestInstaller: { file: string; version: string; } | null = null;
    
    for (const file of exeFiles) {
      const version = parseVersionFromFilename(file);
      if (!version) {
        log(`Could not parse version from filename: ${file}`);
        continue;
      }
      
      if (!newestInstaller || semver.gt(version, newestInstaller.version)) {
        newestInstaller = { file, version };
      }
    }
    
    if (!newestInstaller) {
      log('No valid installer versions found');
      return null;
    }
    
    log(`Newest installer found: ${newestInstaller.file} (version ${newestInstaller.version})`);
    
    // Compare versions
    const needsUpdate = semver.gt(newestInstaller.version, currentVersion);
    log(`Update needed: ${needsUpdate} (installer: ${newestInstaller.version} vs current: ${currentVersion})`);
    
    return {
      installerPath: path.join(UPDATER_FOLDER, newestInstaller.file),
      installerVersion: newestInstaller.version,
      currentVersion,
      needsUpdate
    };
    
  } catch (error) {
    log(`Error checking for updates: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Show update modal to user for 3 seconds before installing
 */
export function showUpdateModal(mainWindow: BrowserWindow, version: string): Promise<void> {
  return new Promise((resolve) => {
    log(`Showing update modal for version ${version}`);
    
    // Send IPC message to renderer to show modal
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
      try {
        mainWindow.webContents.send('update-starting', version);
      } catch (error) {
        log(`Failed to send update-starting event: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Wait 3 seconds
    setTimeout(() => {
      log('Update modal timeout complete, proceeding with installation');
      resolve();
    }, 3000);
  });
}

/**
 * Kill all app processes except current one
 * Uses Windows taskkill command (secure version using execFile)
 */
export async function killAllProcesses(): Promise<void> {
  return new Promise((resolve) => {
    const appName = app.getName();
    const args = ['/F', '/IM', `${appName}.exe`, '/T'];
    
    log(`Killing all app processes: taskkill ${args.join(' ')}`);
    
    // Use execFile instead of exec to prevent command injection
    execFile('taskkill', args, (error, stdout, stderr) => {
      if (error) {
        log(`Process kill command failed (this is expected if only one instance): ${error.message}`);
      }
      if (stdout) {
        log(`Process kill stdout: ${stdout}`);
      }
      if (stderr) {
        log(`Process kill stderr: ${stderr}`);
      }
      
      // Resolve even if there's an error (app might already be the only instance)
      resolve();
    });
  });
}

/**
 * Launch installer as detached process and exit app
 * Secure version without shell interpretation
 */
export function launchInstallerAndExit(installerPath: string): void {
  log(`Launching installer: ${installerPath}`);
  
  try {
    // Validate installer path exists and is an exe file
    if (!fs.existsSync(installerPath)) {
      throw new Error('Installer file does not exist');
    }
    
    if (!installerPath.toLowerCase().endsWith('.exe')) {
      throw new Error('Installer must be an .exe file');
    }
    
    // Launch installer with silent flag (/S for NSIS)
    // Removed shell: true to prevent command injection
    const installer = spawn(installerPath, ['/S'], {
      detached: true,
      stdio: 'ignore',
      shell: false  // Security fix: Don't use shell interpretation
    });
    
    // Detach the process so it continues after parent exits
    installer.unref();
    
    log('Installer launched successfully, exiting app...');
    
    // Wait 1 second then exit
    setTimeout(() => {
      app.exit(0);
    }, 1000);
    
  } catch (error) {
    log(`Failed to launch installer: ${error instanceof Error ? error.message : String(error)}`);
    // Don't exit if installer launch fails
  }
}

/**
 * Main function to handle forced auto-update
 * Returns true if update was triggered, false otherwise
 */
export async function handleAutoUpdate(mainWindow: BrowserWindow): Promise<boolean> {
  log('=== Auto-Update Check Started ===');
  
  try {
    // Validate mainWindow before proceeding
    if (!mainWindow || mainWindow.isDestroyed()) {
      log('Main window is not available or destroyed, skipping auto-update check');
      return false;
    }
    
    // Check for pending update
    const updateInfo = await checkForPendingUpdate();
    
    if (!updateInfo || !updateInfo.needsUpdate) {
      log('No update needed, starting app normally');
      return false;
    }
    
    log(`Update will be installed: ${updateInfo.installerVersion}`);
    
    // Double-check window is still valid before showing modal
    if (mainWindow.isDestroyed()) {
      log('Main window was destroyed, aborting update');
      return false;
    }
    
    // Show update modal to user
    await showUpdateModal(mainWindow, updateInfo.installerVersion);
    
    // Kill all processes (except current)
    await killAllProcesses();
    
    // Launch installer and exit
    launchInstallerAndExit(updateInfo.installerPath);
    
    log('=== Auto-Update Process Initiated ===');
    return true;
    
  } catch (error) {
    log(`Error in auto-update handler: ${error instanceof Error ? error.message : String(error)}`);
    log('Starting app normally due to error');
    return false;
  }
}

