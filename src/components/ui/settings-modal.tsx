"use client"

import { useState, useEffect } from "react"

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("")
  const [autoSave, setAutoSave] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [saveLocation, setSaveLocation] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock loading settings from localStorage or other storage
    const loadSettings = () => {
      try {
        const savedApiKey = localStorage.getItem('sweesh-api-key') || ""
        const savedAutoSave = localStorage.getItem('sweesh-auto-save') === 'true'
        const savedDarkMode = localStorage.getItem('sweesh-dark-mode') === 'true'
        const savedSaveLocation = localStorage.getItem('sweesh-save-location') || ""
        
        setApiKey(savedApiKey)
        setAutoSave(savedAutoSave)
        setDarkMode(savedDarkMode)
        setSaveLocation(savedSaveLocation)
      } catch (error) {
        console.log("Failed to load settings:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
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

  const handleSave = async () => {
    try {
      // Mock saving settings to localStorage
      localStorage.setItem('sweesh-api-key', apiKey)
      localStorage.setItem('sweesh-auto-save', autoSave.toString())
      localStorage.setItem('sweesh-dark-mode', darkMode.toString())
      localStorage.setItem('sweesh-save-location', saveLocation)
      
      console.log("Settings saved successfully")
      onClose()
    } catch (error) {
      console.log("Failed to save settings:", error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 settings-modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="relative rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-6" style={{ backgroundColor: '#171717' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button 
            onClick={onClose} 
            className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium text-white">
              Whisper API Key
            </label>
            <input 
              id="api-key" 
              type="password" 
              placeholder="Enter your Whisper API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="save-location" className="text-sm font-medium text-white">
              File Save Location
            </label>
            <input 
              id="save-location" 
              type="text" 
              placeholder="Choose local directory"
              value={saveLocation}
              onChange={(e) => setSaveLocation(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <label htmlFor="auto-save" className="text-sm font-medium text-white">
                Auto Save Audio Files
              </label>
              <p className="text-xs text-gray-400">Automatically save recordings locally</p>
            </div>
            <button
              id="auto-save"
              onClick={() => setAutoSave(!autoSave)}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                autoSave ? 'bg-orange-500' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSave ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <label htmlFor="dark-mode" className="text-sm font-medium text-white">
                Dark Mode
              </label>
              <p className="text-xs text-gray-400">Toggle dark theme</p>
            </div>
            <button
              id="dark-mode"
              onClick={() => setDarkMode(!darkMode)}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode ? 'bg-orange-500' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid gap-2 pt-2">
            <button 
              onClick={requestMicPermission}
              className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600 transition-colors"
            >
              Request microphone permission
            </button>
            <button 
              onClick={openOsMicSettings}
              className="px-4 py-2 bg-gray-700 text-white rounded-md font-medium hover:bg-gray-600 transition-colors border border-gray-600"
            >
              Open OS microphone settings
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-md font-medium hover:bg-gray-600 transition-colors border border-gray-600"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
