"use client"

import { useEffect } from "react"

interface UpdateRequiredModalProps {
  version: string
  onClose: () => void
}

export function UpdateRequiredModal({ version, onClose }: UpdateRequiredModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onClose])

  const handleManualDownload = () => {
    if (window.electronAPI && window.electronAPI.openExternal) {
      window.electronAPI.openExternal("https://sweesh.vercel.app")
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl bg-[#1a1a1a] rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{ fontFamily: 'EditorsNote, sans-serif' }}
        >
          {/* Header */}
          <h1 id="modal-title" className="text-center text-xl font-semibold text-white mb-8">
            The new stable update is waiting to install.
          </h1>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                {/* Image */}
                <div className="w-full aspect-square bg-gray-700 rounded-lg mb-3 overflow-hidden">
                  <img 
                    src={`Instruction/Step ${step}.png`} 
                    alt={`Step ${step}`} 
                    className="w-full h-full object-cover" 
                  />
                </div>

                {/* Step label with accent */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">Step</span>
                  <span className="text-sm font-bold text-[#ff6347]">{step}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Instruction text */}
          <p className="text-center text-sm text-gray-300 leading-relaxed mb-6">
            Just exit Sweesh from the system tray, wait a few seconds, and reopen it.
            <br />
            The app will restart with the latest improvements automatically.
          </p>

          {/* Manual download option */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">
              Or to download the latest version manually:
            </p>
            <button
              onClick={handleManualDownload}
              className="text-sm text-[#ff6347] hover:text-[#ff7a5c] transition-colors underline"
            >
              Visit sweesh.vercel.app
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

