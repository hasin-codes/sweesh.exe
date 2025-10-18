import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  toggleMaximizeWindow: () => ipcRenderer.invoke('window-toggle-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  openActiveWindow: () => ipcRenderer.invoke('open-active-window'),
  closeActiveWindow: () => ipcRenderer.invoke('close-active-window'),
  toggleActiveWindow: () => ipcRenderer.invoke('toggle-active-window'),
  // Active window controls
  minimizeActiveWindow: () => ipcRenderer.invoke('active-window-minimize'),
  toggleMaximizeActiveWindow: () => ipcRenderer.invoke('active-window-toggle-maximize'),
});
