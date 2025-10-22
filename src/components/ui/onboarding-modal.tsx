"use client"

import { useState, useEffect } from "react"

interface OnboardingModalProps {
  onComplete: () => void
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [apiKey, setApiKey] = useState("")
  const [apiKeyStatus, setApiKeyStatus] = useState<{ hasKey: boolean; maskedKey?: string }>({ hasKey: false })
  const [isUpdating, setIsUpdating] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [encryptionStatus, setEncryptionStatus] = useState<{ isEncryptionAvailable: boolean; encryptionBackend: string; platform: string; warningMessage?: string; setupInstructions?: { title: string; steps: string[] } }>({ isEncryptionAvailable: false, encryptionBackend: "", platform: "" })
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: "", type: 'success' })
  const [authStatus, setAuthStatus] = useState<{ isAuthenticated: boolean; user?: any }>({ isAuthenticated: false })
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  const steps = [
    {
      title: "Sign In",
      description: "Connect your account for a seamless experience.",
      icon: (
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-lg flex items-center justify-center border border-orange-500/20 backdrop-blur-sm">
          <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )
    },
    {
      title: "API Key",
      description: "Add your Groq API key to unlock voice transcription.",
      icon: (
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg flex items-center justify-center border border-gray-700 backdrop-blur-sm">
          <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
      )
    }
  ]

  // Load API key status, encryption status, and auth status on mount
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await window.electronAPI.getApiKeyStatus()
        setApiKeyStatus(status)
        
        const encryption = await window.electronAPI.getEncryptionStatus()
        setEncryptionStatus(encryption)
        
        const auth = await window.electronAPI.getAuthStatus()
        setAuthStatus(auth)
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

  // Listen for authentication events
  useEffect(() => {
    const handleAuthSuccess = (userData: any) => {
      console.log('Authentication successful:', userData)
      setAuthStatus({ isAuthenticated: true, user: userData })
      setIsAuthLoading(false)
      setToast({ show: true, message: `Welcome back, ${userData.firstName || userData.email}!`, type: 'success' })
      setTimeout(() => setToast({ show: false, message: "", type: 'success' }), 3000)
    }

    const handleAuthError = (error: string) => {
      console.error('Authentication error:', error)
      setIsAuthLoading(false)
      setToast({ show: true, message: `Authentication failed: ${error}`, type: 'error' })
      setTimeout(() => setToast({ show: false, message: "", type: 'success' }), 5000)
    }

    window.electronAPI.onAuthSuccess(handleAuthSuccess)
    window.electronAPI.onAuthError(handleAuthError)
    
    return () => {
      window.electronAPI.removeAuthListeners()
    }
  }, [])

  const handleStartAuth = async () => {
    setIsAuthLoading(true)
    try {
      const result = await window.electronAPI.startAuthFlow()
      if (result.success) {
        console.log('Auth flow started, waiting for browser authentication...')
        // The auth success/error will be handled by the event listeners
      } else {
        setIsAuthLoading(false)
        setToast({ show: true, message: `Failed to start authentication: ${result.error}`, type: 'error' })
        setTimeout(() => setToast({ show: false, message: "", type: 'success' }), 5000)
      }
    } catch (error) {
      console.error('Failed to start auth flow:', error)
      setIsAuthLoading(false)
      setToast({ show: true, message: 'Failed to start authentication. Please try again.', type: 'error' })
      setTimeout(() => setToast({ show: false, message: "", type: 'success' }), 5000)
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      completeOnboarding()
    }
  }

  const completeOnboarding = async () => {
    try {
      await window.electronAPI.completeOnboarding()
        console.log("Onboarding completed successfully")
        onComplete()
      } catch (error) {
      console.log("Failed to complete onboarding:", error)
      onComplete() // Still close modal even if completion fails
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }


  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return authStatus.isAuthenticated
      case 1:
        return apiKeyStatus.hasKey
      default:
        return false
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isUpdating) {
      handleSaveApiKey()
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 settings-modal-backdrop" />

      {/* Modal */}
      <div className="relative rounded-lg shadow-2xl w-full max-w-lg max-h-[600px] overflow-hidden flex flex-col" style={{ backgroundColor: '#171717' }}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="text-center space-y-3">
            <div className="inline-block">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Welcome to Sweesh
              </h1>
              <div className="h-1 w-20 mx-auto mt-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" />
            </div>
            <p className="text-gray-200 text-lg">
              Speak it, see it, send it — instantly.
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Step Progress Indicator */}
          <div className="relative flex items-center justify-center mb-4">
          <div className="flex items-center space-x-3">
            {steps.map((step, index) => {
              const isActive = currentStep === index
              const isCompleted = currentStep > index
              
              return (
                <div key={index} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-500 transform
                      ${isCompleted 
                        ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30 scale-105' 
                        : isActive 
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 scale-110' 
                          : 'bg-gray-800 border border-gray-700'
                      }
                    `}>
                      {isCompleted ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                          {index + 1}
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute inset-0 rounded-lg bg-orange-500 animate-ping opacity-20" />
                      )}
                    </div>
                    <p className={`
                      mt-2 text-xs font-medium transition-all duration-300
                      ${isActive ? 'text-white' : isCompleted ? 'text-white' : 'text-gray-300'}
                    `}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-16 h-1 mx-3 mb-6 rounded-full transition-all duration-500
                      ${isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gray-800'}
                    `} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

          {/* Step Content */}
          <div className="h-[400px]">
          {currentStep === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-2">
                {steps[0].icon}
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {steps[0].title}
                  </h2>
                  <p className="text-gray-200 text-sm">
                    {steps[0].description}
                  </p>
                </div>
              </div>

              {authStatus.isAuthenticated ? (
                <div className="space-y-4">
                  <div className="relative bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg p-4 backdrop-blur-sm">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-3xl" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-base font-semibold text-white">Successfully Authenticated</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Welcome back, <span className="font-medium text-white">{authStatus.user?.firstName || authStatus.user?.email || 'User'}</span>!
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleNext}
                    className="w-full py-3 text-sm font-semibold bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Continue to API Setup →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-700 rounded-lg p-4 backdrop-blur-sm">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-gray-800/30 rounded-full blur-3xl" />
                    <div className="relative space-y-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h3 className="font-semibold text-white text-base">
                          Secure Browser Sign-In
                        </h3>
                      </div>
                      <p className="text-xs text-gray-200 leading-relaxed">
                        We'll open your browser where you can securely sign in. Your credentials are never stored in the app.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleStartAuth}
                    disabled={isAuthLoading}
                    className="group relative w-full py-3 text-sm font-semibold bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                  >
                    {isAuthLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Opening browser...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <span>Sign In with Browser</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center space-y-2">
                {steps[1].icon}
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {steps[1].title}
                  </h2>
                  <p className="text-gray-200 text-sm">
                    {steps[1].description}
                  </p>
                </div>
              </div>

              {/* API Key Status */}
              {apiKeyStatus.hasKey ? (
                <div className="relative bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-lg p-4 backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-base font-semibold text-white">API Key Configured</span>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2 font-mono text-sm text-gray-200">
                      {apiKeyStatus.maskedKey}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-700 rounded-lg p-4 space-y-4">
                  {/* Info section */}
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div className="space-y-1 flex-1">
                      <h3 className="text-white font-medium text-sm">Get Your Free API Key</h3>
                      <p className="text-gray-200 text-xs leading-relaxed">
                        Powered by Groq's Whisper API. Add your API key below to enable voice transcription.
                      </p>
                      <button 
                        onClick={() => window.electronAPI.openExternal('https://console.groq.com/keys')}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors group mt-1"
                      >
                        <span>Open Groq Console</span>
                        <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Input field */}
                  <div className="space-y-2">
                    <label htmlFor="api-key" className="block text-sm font-medium text-white">
                        Groq API Key
                      </label>
                      <div className="relative">
                        <input
                          id="api-key"
                          type="password"
                          placeholder="gsk_..."
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          onKeyPress={handleKeyPress}
                          disabled={isUpdating}
                        className="w-full text-sm py-2.5 px-3 border border-gray-700 rounded-lg bg-gray-900/50 text-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                          autoFocus
                        />
                        {apiKey && apiKey.startsWith('gsk_') && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    
                    {/* Encryption status inline */}
                    <p className="flex items-center gap-1.5 text-gray-300 text-xs">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      <span>
                        {encryptionStatus.isEncryptionAvailable 
                          ? `Encryption available on ${encryptionStatus.platform}` 
                          : encryptionStatus.warningMessage || 'Stored securely on your device'}
                      </span>
                    </p>

                      {saveMessage && (
                      <div className={`flex items-center gap-1.5 text-xs p-2 rounded-lg ${
                          saveMessage.includes('successfully') 
                          ? 'bg-green-500/10 text-white border border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {saveMessage.includes('successfully') ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            )}
                          </svg>
                          <span>{saveMessage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              <div className="pt-1">
                {!apiKeyStatus.hasKey ? (
                  <button
                    onClick={handleSaveApiKey}
                    disabled={isUpdating || !apiKey.trim()}
                    className="group relative w-full py-3 text-sm font-semibold bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                  >
                    {isUpdating ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>Complete Setup</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="group relative w-full py-3 text-sm font-semibold bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Complete Setup</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-16 right-6 px-5 py-4 rounded-lg shadow-2xl z-[60] backdrop-blur-lg border animate-in slide-in-from-top-2 fade-in duration-300 ${
            toast.type === 'success' 
              ? 'bg-green-500/90 text-white border-green-400/20' 
              : 'bg-red-500/90 text-white border-red-400/20'
          }`}>
            <div className="flex items-center gap-3">
              {toast.type === 'success' ? (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}