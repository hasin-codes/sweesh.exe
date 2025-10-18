"use client"

import { useState } from "react"
import { Titlebar } from '@/components/layout/titlebar'
import { Topbar } from '@/components/layout/sidebar'
import { TranscriptionCard } from '@/components/layout/transcription-card'
import { SettingsModal } from '@/components/ui/settings-modal'
import { TranscriptionModal } from '@/components/ui/transcription-modal'

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
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null)
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([
    {
      id: 1,
      file: "record_001.webm",
      text: "Hi! I was just thinking about how much easier it gets to get things done when I can just talk instead of type. This voice keyboard literally types everything I say and it's so much faster than typing. I can just speak my thoughts and they appear on screen instantly.",
      date: "2024-10-18T10:30:00Z"
    },
    {
      id: 2,
      file: "record_002.webm",
      text: "Alright, let's draft the quick summary for today's client meeting. The proposal should include the updated pricing model, delivery milestones, and a short timeline overview. We need to highlight our competitive advantages and address their main concerns about scalability.",
      date: "2024-10-18T14:20:00Z"
    },
    {
      id: 3,
      file: "record_003.webm",
      text: "Sometimes I just start speaking and let the ideas flow and this tool keeps up without missing a beat. It's almost like having an invisible assistant who never gets tired and always understands what I'm trying to say, even when I'm thinking out loud.",
      date: "2024-10-18T16:45:00Z"
    },
    {
      id: 4,
      file: "record_004.webm",
      text: "Okay, quick note for tomorrow's presentation outline. Start with the introduction slide about our core mission, then move to features section highlighting the key benefits. Don't forget to include the demo and Q&A time at the end.",
      date: "2024-10-18T09:15:00Z"
    },
    {
      id: 5,
      file: "record_005.webm",
      text: "I just wanted to remind myself to pick up groceries on the way back home. Maybe I will grab some fresh vegetables and something quick for dinner tonight. Also need to check if we have enough coffee for tomorrow morning.",
      date: "2024-10-18T17:30:00Z"
    },
    {
      id: 6,
      file: "record_006.webm",
      text: "Alright, so the plan for this week is to finalize the UI updates, fix those minor bugs in the settings page and focus on performance optimization. I also need to review the user feedback and prepare for the team meeting on Friday.",
      date: "2024-10-18T11:00:00Z"
    },
    {
      id: 7,
      file: "record_007.webm",
      text: "Hey, just letting you know, I reached the office and started setting up the new prototype. It looks even better than I expected on the big screen and I'll send you the screenshots once I'm done with the initial testing.",
      date: "2024-10-18T08:45:00Z"
    },
    {
      id: 8,
      file: "record_008.webm",
      text: "You know what, I think the whole concept could be simplified if we just merge those two steps into one. Instead of asking our user to confirm twice, we could streamline the process and make it more intuitive for first-time users.",
      date: "2024-10-18T15:20:00Z"
    }
  ])

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
    setTranscriptions(prev => prev.filter(t => t.id !== id))
  }

  const handleTranscriptionClick = (id: number) => {
    const transcription = transcriptions.find(t => t.id === id)
    if (transcription) {
      setSelectedTranscription(transcription)
      setShowTranscriptionModal(true)
    }
  }

  const handleTranscriptionUpdate = (id: number, newText: string) => {
    setTranscriptions(prev => 
      prev.map(t => t.id === id ? { ...t, text: newText } : t)
    )
  }

  const addNewTranscription = () => {
    const newTranscription: Transcription = {
      id: Date.now(),
      file: `New Recording - ${new Date().toLocaleDateString()}`,
      text: "This is a demo transcription that was just created. You can edit this text or delete this transcription as needed.",
      date: new Date().toISOString()
    }
    setTranscriptions(prev => [newTranscription, ...prev])
  }

  return (
    <div className="relative min-h-screen bg-black">
      <Titlebar />
      <Topbar onSettings={() => setShowSettings(true)} onAddRecording={addNewTranscription} />
      
      {/* Aurora Border Effect */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-300 ${
        isListening ? 'opacity-100' : 'opacity-0'
      }`}>
        <div 
          className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, ${audioLevel * 0.3}) 0%, transparent 50%)`
          }}
        />
      </div>

      <main className="pt-24 pb-8 pl-20 pr-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 font-editors">Your Transcriptions</h1>
          <p className="text-gray-300 text-base mb-4">
            <strong>Hold</strong> <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">Ctrl + Shift + M</kbd>, <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">Alt + Shift + M</kbd>, or <kbd className="px-2 py-1 bg-gray-700 rounded text-xs font-mono text-white">F12</kbd> to show the voice widget, <strong>release</strong> to hide it
          </p>
          <div className="text-sm text-gray-400 mb-4">
            💡 Hold the key combination anywhere on your system to show the voice widget, release to hide it
          </div>
          <div className="text-xs text-gray-500 mb-4">
            Note: Alt+M is reserved by Windows system, so we use alternative combinations. Try F12 for testing.
          </div>
        </div>

        {/* Transcriptions Grid */}
        {transcriptions.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
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
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center mt-32">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-primary"></div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No transcriptions yet</h3>
            <p className="text-muted-foreground mb-6">
              Start your first recording to see your transcriptions here
            </p>
            <button
              onClick={startRecording}
              disabled={isListening || isProcessing}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Record Now
            </button>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

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
