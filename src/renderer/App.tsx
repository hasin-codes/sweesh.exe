"use client"

import { useState, useEffect } from "react"
import { Titlebar } from "@/components/layout/titlebar"
import { Topbar } from "@/components/layout/sidebar"
import { TranscriptionCard } from "@/components/layout/transcription-card"
import { SettingsModal } from "@/components/ui/settings-modal"
import { TranscriptionModal } from "@/components/ui/transcription-modal"
import { OnboardingModal } from "@/components/ui/onboarding-modal"

interface Transcription {
  id: number
  file: string
  text: string
  date: string
}

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0.1)
  const [showSettings, setShowSettings] = useState(false)
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null)
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([
    
  ])

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (window.electronAPI) {
        try {
          const status = await window.electronAPI.checkOnboardingStatus()
          console.log('Onboarding status:', status)
          // Show onboarding if not completed OR if auth/API key is missing
          if (!status.completed || !status.isAuthenticated || !status.hasApiKey) {
            console.log('Showing onboarding modal')
            setShowOnboarding(true)
          } else {
            console.log('Onboarding already completed with auth and API key')
          }
        } catch (error) {
          console.error('Failed to check onboarding status:', error)
        }
      }
    }

    checkOnboardingStatus()
  }, [])

  // Load persisted transcriptions on mount
  useEffect(() => {
    const load = async () => {
      try {
        if (window.electronAPI?.loadTranscriptions) {
          const items = await window.electronAPI.loadTranscriptions()
          if (Array.isArray(items)) {
            setTranscriptions(items as Transcription[])
          }
        }
      } catch (e) {
        console.error('Failed to load transcriptions:', e)
      }
    }
    load()
  }, [])

  // Listen for new transcriptions from the active window
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onNewTranscription((transcriptionData: Transcription) => {
        console.log("Received new transcription:", transcriptionData)
        setTranscriptions((prev) => [transcriptionData, ...prev])
      })
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeNewTranscriptionListener()
      }
    }
  }, [])

  const startRecording = () => {
    setIsListening(true)

    // Mock audio level animation
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 0.8 + 0.2)
    }, 100)

    setTimeout(() => {
      clearInterval(interval)
      setIsListening(false)
      setIsProcessing(true)
      setTimeout(() => {
        setIsProcessing(false)
      }, 2000)
    }, 3000)
  }

  const stopRecording = () => {
    setIsListening(false)
    setIsProcessing(false)
  }

  const handleDeleteTranscription = (id: number) => {
    const next = transcriptions.filter((t) => t.id !== id)
    setTranscriptions(next)
    // Persist after delete
    try {
      window.electronAPI?.saveTranscriptions?.(next as any)
    } catch {}
  }

  const handleTranscriptionClick = (id: number) => {
    const transcription = transcriptions.find((t) => t.id === id)
    if (transcription) {
      setSelectedTranscription(transcription)
      setShowTranscriptionModal(true)
    }
  }

  const handleTranscriptionUpdate = (id: number, newText: string) => {
    const next = transcriptions.map((t) => (t.id === id ? { ...t, text: newText } : t))
    setTranscriptions(next)
    // Persist after edit
    try {
      window.electronAPI?.saveTranscriptions?.(next as any)
    } catch {}
  }

  const addNewTranscription = async () => {
    try {
      if (window.electronAPI?.openActiveWindow) {
        await window.electronAPI.openActiveWindow()
      }
    } catch (error) {
      console.error('Failed to open active window for recording:', error)
    }
  }

  return (
    <div className="relative min-h-screen bg-black">
      <Titlebar />
      <Topbar
        onSettings={() => setShowSettings(true)}
        onAddRecording={addNewTranscription}
      />

      {/* Aurora Border Effect */}
      <div
        className={`fixed inset-0 pointer-events-none transition-opacity duration-300 ${
          isListening ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, ${
              audioLevel * 0.3
            }) 0%, transparent 50%)`,
          }}
        />
      </div>

      <main className="pt-24 pb-8 px-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 font-editors">
            Your Transcriptions
          </h1>
          <p className="text-gray-300 text-base mb-4">
            <strong>Hold</strong>{" "}
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">
              Ctrl + Shift + M
            </kbd>
            ,{" "}
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">
              Alt + Shift + M
            </kbd>
            , or{" "}
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">
              F12
            </kbd>{" "}
            to show the voice widget, <strong>release</strong> to hide it
          </p>
          <div className="text-sm text-gray-400 mb-4">
            💡 Hold the key combination anywhere on your system to show the voice
            widget, release to hide it
          </div>
          <div className="text-xs text-gray-500 mb-4">
            Note: Alt+M is reserved by Windows system, so try F12 for testing.
          </div>
        </div>

        {/* Transcriptions Grid */}
        {transcriptions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
            {transcriptions.map((transcription) => (
              <TranscriptionCard
                key={transcription.id}
                id={transcription.id}
                file={transcription.file}
                text={transcription.text}
                date={transcription.date}
                onDelete={handleDeleteTranscription}
                onClick={handleTranscriptionClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-20">
            <p>No transcriptions yet.</p>
            <p className="text-sm mt-2">
              Start recording or add a new one to see it here.
            </p>
          </div>
        )}
      </main>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal 
          onComplete={() => setShowOnboarding(false)} 
        />
      )}

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Transcription Modal */}
      {showTranscriptionModal && selectedTranscription && (
        <TranscriptionModal
          isOpen={showTranscriptionModal}
          onClose={() => {
            setShowTranscriptionModal(false)
            setSelectedTranscription(null)
          }}
          transcription={selectedTranscription}
          onDelete={handleDeleteTranscription}
          onUpdate={handleTranscriptionUpdate}
        />
      )}
    </div>
  )
}
