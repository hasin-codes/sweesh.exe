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
  }
});
