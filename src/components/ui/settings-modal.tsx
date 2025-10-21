"use client"

import { useState, useEffect } from "react"

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("")
  const [apiKeyStatus, setApiKeyStatus] = useState<{ hasKey: boolean; maskedKey?: string }>({ hasKey: false })
  const [isUpdating, setIsUpdating] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [encryptionStatus, setEncryptionStatus] = useState<{ isEncryptionAvailable: boolean; encryptionBackend: string; platform: string; warningMessage?: string; setupInstructions?: { title: string; steps: string[] } }>({ isEncryptionAvailable: false, encryptionBackend: "", platform: "" })
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: "", type: 'success' })
  const [onboardingStatus, setOnboardingStatus] = useState<{ completed: boolean; hasApiKey: boolean; isAuthenticated: boolean }>({ completed: false, hasApiKey: false, isAuthenticated: false })
  const [autoSave, setAutoSave] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [saveLocation, setSaveLocation] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await window.electronAPI.getApiKeyStatus()
        setApiKeyStatus(status)
        
        const encryption = await window.electronAPI.getEncryptionStatus()
        setEncryptionStatus(encryption)
        
        const onboarding = await window.electronAPI.checkOnboardingStatus()
        setOnboardingStatus(onboarding)
      } catch (error) {
        console.error('Failed to load status:', error)
      }
    }
    
    loadStatus()
  }, [])

  // Listen for toast notifications
  useEffect(() => {
    const handleToast = (data: { message: string; type: string }) => {
      setToast({ show: true, message: data.message, type: data.type as 'success' | 'error' })
      setTimeout(() => setToast({ show: false, message: "", type: 'success' }), 3000)
    }

    window.electronAPI.onToastNotification(handleToast)
    return () => window.electronAPI.removeToastListener()
  }, [])

  const requestMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log("Microphone permission granted")
    } catch (e: any) {
      console.log("Microphone permission blocked:", e.message)
    }
  }

  const openOsMicSettings = async () => {
    try {
      // Try to navigate to Windows mic settings (may be blocked by browser)
      window.location.href = "ms-settings:privacy-microphone"
    } catch (err) {
      console.log("Unable to open OS settings - please open manually")
    }
  }

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setSaveMessage("Please enter an API key")
      return
    }

    if (!apiKey.startsWith('gsk_')) {
      setSaveMessage("API key must start with 'gsk_'")
      return
    }

    setIsUpdating(true)
    setSaveMessage("")

    try {
      await window.electronAPI.saveApiKey(apiKey)
      setApiKey("")
      
      // Reload status
      const status = await window.electronAPI.getApiKeyStatus()
      setApiKeyStatus(status)
      
      setSaveMessage("API key saved successfully!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error) {
      console.error('Failed to save API key:', error)
      setSaveMessage("Failed to save API key. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateApiKey = async () => {
    if (!apiKey.trim()) {
      setSaveMessage("Please enter an API key")
      return
    }

    if (!apiKey.startsWith('gsk_')) {
      setSaveMessage("API key must start with 'gsk_'")
      return
    }

    setIsUpdating(true)
    setSaveMessage("")

    try {
      await window.electronAPI.updateApiKey(apiKey)
      setApiKey("")
      
      // Reload status
      const status = await window.electronAPI.getApiKeyStatus()
      setApiKeyStatus(status)
      
      setSaveMessage("API key updated successfully!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error) {
      console.error('Failed to update API key:', error)
      setSaveMessage("Failed to update API key. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteApiKey = async () => {
    setIsUpdating(true)
    setSaveMessage("")

    try {
      await window.electronAPI.deleteApiKey()
      
      // Reload status
      const status = await window.electronAPI.getApiKeyStatus()
      setApiKeyStatus(status)
      
      setSaveMessage("API key deleted successfully!")
      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error) {
      console.error('Failed to delete API key:', error)
      setSaveMessage("Failed to delete API key. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 settings-modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="relative rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" style={{ backgroundColor: '#171717' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button 
            onClick={onClose} 
            className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-3">
            {/* API Key Status */}
            {apiKeyStatus.hasKey ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-500 font-medium text-sm">API Key Configured</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">Preview: {apiKeyStatus.maskedKey}</p>
                <button
                  onClick={handleDeleteApiKey}
                  disabled={isUpdating}
                  className="px-2.5 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-3.5 h-3.5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-yellow-500 font-medium text-sm">API Key Not Configured</span>
                </div>
                <p className="text-xs text-gray-400">Configure your Groq API key to enable voice transcription</p>
              </div>
            )}

            {/* API Key Input */}
            <div className="space-y-1.5">
            <label htmlFor="api-key" className="text-sm font-medium text-white">
                Groq API Key
            </label>
            <input 
              id="api-key" 
              type="password" 
                placeholder="Enter your API key (starts with gsk_)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
                disabled={isUpdating}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-700 rounded bg-gray-800 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {saveMessage && (
                <p className={`text-xs ${saveMessage.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>
                  {saveMessage}
                </p>
              )}
              {apiKeyStatus.hasKey ? (
                <button
                  onClick={handleUpdateApiKey}
                  disabled={isUpdating || !apiKey.trim()}
                  className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : 'Update API Key'}
                </button>
              ) : (
                <button
                  onClick={handleSaveApiKey}
                  disabled={isUpdating || !apiKey.trim()}
                  className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Saving...' : 'Save API Key'}
            </button>
              )}
          </div>

            {/* Encryption Status */}
            <div className="bg-gray-800/50 rounded-lg p-2.5">
              <div className="flex items-center gap-2 mb-1">
                {encryptionStatus.isEncryptionAvailable ? (
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                <span className={`text-xs font-medium ${encryptionStatus.isEncryptionAvailable ? 'text-green-500' : 'text-yellow-500'}`}>
                  {encryptionStatus.encryptionBackend}
                </span>
              </div>
              <p className="text-xs text-gray-400">{encryptionStatus.warningMessage || encryptionStatus.platform}</p>
            </div>

            {/* Onboarding Status */}
            {!onboardingStatus.completed && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-500 font-medium text-sm">Setup Incomplete</span>
                </div>
                <p className="text-xs text-gray-400">Complete the initial setup to get the best experience</p>
          </div>
            )}

            
            

            

            

            {/* Microphone Permissions */}
            <div className="space-y-2 pt-1">
              
            <button 
              onClick={openOsMicSettings}
                className="w-full px-3 py-1.5 bg-gray-700 text-white rounded text-sm font-medium hover:bg-gray-600 transition-colors border border-gray-600"
            >
              Open OS microphone settings
            </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-3 border-t border-gray-700">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-700 text-white rounded text-sm font-medium hover:bg-gray-600 transition-colors border border-gray-600"
          >
            Close
          </button>
        </div>

        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  )
}