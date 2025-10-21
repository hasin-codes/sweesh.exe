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
  // Transcription methods
  transcribeAudio: (audioBuffer: ArrayBuffer) => ipcRenderer.invoke('transcribe-audio', audioBuffer),
  sendTranscriptionToMain: (transcriptionData: any) => ipcRenderer.invoke('send-transcription-to-main', transcriptionData),
  // Event listeners
  onNewTranscription: (callback: (data: any) => void) => {
    ipcRenderer.on('new-transcription', (event, data) => callback(data));
  },
  removeNewTranscriptionListener: () => {
    ipcRenderer.removeAllListeners('new-transcription');
  },
  // Recording control listeners
  onStartRecording: (callback: () => void) => {
    ipcRenderer.on('start-recording', callback);
  },
  onStopRecording: (callback: () => void) => {
    ipcRenderer.on('stop-recording', callback);
  },
  removeRecordingListeners: () => {
    ipcRenderer.removeAllListeners('start-recording');
    ipcRenderer.removeAllListeners('stop-recording');
  },
  // API Key Management
  saveApiKey: (apiKey: string) => ipcRenderer.invoke('save-api-key', apiKey),
  getApiKeyStatus: () => ipcRenderer.invoke('get-api-key-status'),
  updateApiKey: (apiKey: string) => ipcRenderer.invoke('update-api-key', apiKey),
  deleteApiKey: () => ipcRenderer.invoke('delete-api-key'),
  getEncryptionStatus: () => ipcRenderer.invoke('get-encryption-status'),
  // Toast notifications
  onToastNotification: (callback: (data: {message: string, type: string}) => void) => {
    ipcRenderer.on('toast-notification', (event, data) => callback(data));
  },
  removeToastListener: () => {
    ipcRenderer.removeAllListeners('toast-notification');
  },
  // Persistence
  loadTranscriptions: () => ipcRenderer.invoke('load-transcriptions'),
  saveTranscriptions: (transcriptions: any[]) => ipcRenderer.invoke('save-transcriptions', transcriptions),
  // Onboarding management
  checkOnboardingStatus: () => ipcRenderer.invoke('check-onboarding-status'),
  completeOnboarding: () => ipcRenderer.invoke('complete-onboarding'),
  skipOnboarding: () => ipcRenderer.invoke('skip-onboarding'),
  clearAllData: () => ipcRenderer.invoke('clear-all-data'),
  // Authentication methods
  getAuthStatus: () => ipcRenderer.invoke('get-auth-status'),
  startAuthFlow: () => ipcRenderer.invoke('start-auth-flow'),
  logout: () => ipcRenderer.invoke('logout'),
  // Authentication event listeners
  onAuthSuccess: (callback: (userData: any) => void) => {
    ipcRenderer.on('auth-success', (event, userData) => callback(userData));
  },
  onAuthError: (callback: (error: string) => void) => {
    ipcRenderer.on('auth-error', (event, error) => callback(error));
  },
  removeAuthListeners: () => {
    ipcRenderer.removeAllListeners('auth-success');
    ipcRenderer.removeAllListeners('auth-error');
  },
  // Auto-Update methods
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  quitAndInstallUpdate: () => ipcRenderer.invoke('quit-and-install-update'),
  onUpdateStatus: (callback: (data: any) => void) => {
    ipcRenderer.on('update-status', (event, data) => callback(data));
  },
  removeUpdateListener: () => {
    ipcRenderer.removeAllListeners('update-status');
  }
});
