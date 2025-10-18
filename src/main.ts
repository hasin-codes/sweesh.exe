import { app, BrowserWindow, ipcMain, Tray, Menu } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow;
let activeWindow: BrowserWindow;
let tray: Tray;

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

  // Handle window close event
  mainWindow.on('close', (event) => {
    // Prevent default close behavior
    event.preventDefault();
    // Hide to tray instead
    mainWindow.hide();
  });
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
      label: 'Quit',
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
