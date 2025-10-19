export interface ElectronAPI {
  minimizeWindow: () => Promise<void>;
  toggleMaximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  openActiveWindow: () => Promise<void>;
  // Active window controls
  minimizeActiveWindow: () => Promise<void>;
  toggleMaximizeActiveWindow: () => Promise<void>;
  closeActiveWindow: () => Promise<void>;
  toggleActiveWindow: () => Promise<void>;
  // Transcription methods
  transcribeAudio: (audioBuffer: ArrayBuffer) => Promise<{success: boolean, text?: string, error?: string}>;
  sendTranscriptionToMain: (transcriptionData: any) => Promise<void>;
  // Event listeners
  onNewTranscription: (callback: (data: any) => void) => void;
  removeNewTranscriptionListener: () => void;
  // Recording control listeners
  onStartRecording: (callback: () => void) => void;
  onStopRecording: (callback: () => void) => void;
  removeRecordingListeners: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
