"use client"

import { useEffect } from "react"

interface UpdateModalProps {
  version: string
  onComplete?: () => void
}

export function UpdateModal({ version, onComplete }: UpdateModalProps) {
  useEffect(() => {
    // Auto-complete after 3 seconds
    const timer = setTimeout(() => {
      onComplete?.()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 animate-fadeIn">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Loading Spinner */}
        <div className="mb-6 flex justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500"></div>
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          Installing Update
        </h2>
        
        {/* Version Info */}
        <p className="text-gray-200 mb-2 text-center">
          Version <span className="text-green-500 font-semibold">{version}</span> is being installed...
        </p>
        
        {/* Message */}
        <p className="text-sm text-gray-400 text-center mb-6">
          The app will restart automatically in a few seconds.
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full"
            style={{
              animation: 'updateProgress 3s linear forwards'
            }}
          ></div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes updateFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes updateProgress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        
        .animate-fadeIn {
          animation: updateFadeIn 0.3s ease-out;
        }
      `}} />
    </div>
  )
}

