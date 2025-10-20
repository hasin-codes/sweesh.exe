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

  const steps = [
    {
      title: "Create Account",
      description: "Sign up to start recording and managing your voice transcriptions.",
      icon: (
        <div className="w-16 h-16 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )
    },
    {
      title: "Setup Voice Transcription",
      description: "Add your API key to enable voice-to-text functionality.",
      icon: (
        <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
      )
    }
  ]

  // Load API key status and encryption status on mount
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await window.electronAPI.getApiKeyStatus()
        setApiKeyStatus(status)
        
        const encryption = await window.electronAPI.getEncryptionStatus()
        setEncryptionStatus(encryption)
      } catch (error) {
        console.error('Failed to load API key status:', error)
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

  const handleSkip = async () => {
    try {
      await window.electronAPI.skipOnboarding()
      console.log("Onboarding skipped")
    onComplete()
    } catch (error) {
      console.log("Failed to skip onboarding:", error)
      onComplete() // Still close modal even if skip fails
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return true
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-[#171717] rounded-xl shadow-2xl w-full max-w-lg mx-4 p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Welcome to Sweesh</h1>
          <p className="text-gray-400">
            Speak it, see it, send it — instantly.
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center space-x-4">
          {steps.map((step, index) => {
            const isActive = currentStep === index
            const isCompleted = currentStep > index
            
            return (
              <div key={index} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                  ${isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isActive 
                      ? 'bg-orange-500 border-orange-500 text-white' 
                      : 'bg-[#171717] border-gray-600 text-gray-400'
                  }
                `}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : index === 0 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-16 h-0.5 mx-2 transition-all duration-300
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-600'}
                  `} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Labels */}
        <div className="flex justify-center space-x-16">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <p className={`
                text-sm font-medium transition-colors duration-300
                ${currentStep === index ? 'text-white' : 'text-gray-400'}
              `}>
                {step.title}
              </p>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                {steps[0].icon}
            <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    {steps[0].title}
                  </h2>
                  <p className="text-gray-400">
                    {steps[0].description}
                  </p>
                </div>
            </div>

              <div className="space-y-3">
                <button 
                  onClick={handleNext}
                  className="w-full py-3 text-base font-medium bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                >
                  Create Account
                </button>
                
                <button 
                  onClick={handleNext}
                  className="w-full py-3 text-base font-medium bg-transparent text-white rounded-md border border-gray-600 hover:bg-gray-800 transition-colors"
                >
                  Sign In
                </button>

            <button
              onClick={handleSkip}
                  className="w-full py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
                  Skip for now
            </button>
          </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Already have an account? Click "Sign In" above.
                </p>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                {steps[1].icon}
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    {steps[1].title}
                  </h2>
                  <p className="text-gray-400">
                    {steps[1].description}
                  </p>
          </div>
        </div>

              <div className="space-y-4">
                {!apiKeyStatus.hasKey && (
                  <div className="bg-blue-950/20 border border-blue-800 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-100 mb-2">
                      Get Your Free API Key
            </h3>
                    <p className="text-sm text-blue-300 mb-3">
                      To enable voice transcription, you'll need a free Whisper API key from Groq.
                    </p>
                    <a 
                      href="https://console.groq.com/keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-400 hover:text-blue-200 underline"
                    >
                      Get your free API key here →
                    </a>
          </div>
                )}

                {/* API Key Status */}
                {apiKeyStatus.hasKey ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-500 font-medium">API Key Configured</span>
                    </div>
                    <p className="text-sm text-gray-400">Preview: {apiKeyStatus.maskedKey}</p>
                  </div>
                ) : (
          <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="api-key" className="block text-base font-medium text-white">
                    Whisper API Key
                  </label>
                  <input
                    id="api-key"
                    type="password"
                        placeholder="Enter your API key (starts with gsk_)"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isUpdating}
                        className="w-full text-base py-3 px-3 border border-gray-700 rounded-md bg-gray-800 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        autoFocus
                      />
                      <p className="text-xs text-gray-400">
                        Your API key is stored securely and only used for transcription
                      </p>
                      {saveMessage && (
                        <p className={`text-xs ${saveMessage.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>
                          {saveMessage}
                        </p>
                      )}
                    </div>

                    {/* Encryption Status */}
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {encryptionStatus.isEncryptionAvailable ? (
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        )}
                        <span className={`text-sm font-medium ${encryptionStatus.isEncryptionAvailable ? 'text-green-500' : 'text-yellow-500'}`}>
                          {encryptionStatus.encryptionBackend}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{encryptionStatus.warningMessage || encryptionStatus.platform}</p>
                </div>
              </div>
            )}
                </div>

              <div className="pt-4">
                {!apiKeyStatus.hasKey ? (
                  <button
                    onClick={handleSaveApiKey}
                    disabled={isUpdating || !apiKey.trim()}
                    className="w-full py-3 text-base font-medium bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Setting up...' : 'Complete Setup'}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="w-full py-3 text-base font-medium bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                  >
                    Complete Setup
                  </button>
                )}
                </div>
              </div>
            )}
          </div>
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
  )
}