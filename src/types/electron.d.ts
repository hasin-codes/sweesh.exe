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
  // API Key Management
  saveApiKey: (apiKey: string) => Promise<{success: boolean, error?: string}>;
  getApiKeyStatus: () => Promise<{hasKey: boolean, maskedKey?: string}>;
  updateApiKey: (apiKey: string) => Promise<{success: boolean, error?: string}>;
  deleteApiKey: () => Promise<{success: boolean, error?: string}>;
  getEncryptionStatus: () => Promise<{
    isEncryptionAvailable: boolean;
    encryptionBackend: string;
    platform: string;
    warningMessage?: string;
    setupInstructions?: {
      title: string;
      steps: string[];
    };
  }>;
  // Toast notifications
  onToastNotification: (callback: (data: {message: string, type: string}) => void) => void;
  removeToastListener: () => void;
  // Persistence
  loadTranscriptions: () => Promise<any[]>;
  saveTranscriptions: (transcriptions: any[]) => Promise<{success: boolean}>;
  // Onboarding management
  checkOnboardingStatus: () => Promise<{completed: boolean, hasApiKey: boolean}>;
  completeOnboarding: () => Promise<boolean>;
  skipOnboarding: () => Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
