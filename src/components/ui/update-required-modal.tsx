"use client"

import { useEffect, useState } from "react"
import { FolderOpen } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface UpdateRequiredModalProps {
  version: string
  onClose: () => void
}

export function UpdateRequiredModal({ version, onClose }: UpdateRequiredModalProps) {
  const [shouldShow, setShouldShow] = useState(true)
  const [installerVersion, setInstallerVersion] = useState(version)

  useEffect(() => {
    // Set the installer version from props
    setInstallerVersion(version)
    setShouldShow(true)
    console.log('🔔 Update Modal: Showing for version', version)
  }, [version])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [onClose])

  const handleOpenDirectory = async () => {
    if (window.electronAPI && window.electronAPI.openPendingDirectory) {
      try {
        const result = await window.electronAPI.openPendingDirectory()
        if (result.success) {
          console.log('📂 Opened directory:', result.path)
        }
      } catch (error) {
        console.error('Failed to open directory:', error)
      }
    }
  }

  const handleManualDownload = () => {
    if (window.electronAPI && window.electronAPI.openExternal) {
      window.electronAPI.openExternal("https://sweesh.vercel.app")
    }
  }

  // Modal animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.3
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -20,
      transition: { 
        duration: 0.2
      }
    }
  }

  // Don't render if shouldn't show
  if (!shouldShow) {
    return null
  }

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-2xl rounded-2xl shadow-2xl p-6"
          style={{ backgroundColor: '#171717', fontFamily: 'EditorsNote, sans-serif' }}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <h1 id="modal-title" className="text-center text-xl font-semibold text-white mb-6">
            The new stable update is waiting to install.
          </h1>

          {/* Step 1: Open Directory */}
          <div className="mb-6">
            <button
              onClick={handleOpenDirectory}
              className="w-full text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
              style={{ backgroundColor: '#ff8c42' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff6f1a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff8c42'}
            >
              <FolderOpen className="w-6 h-6" />
              <div className="text-left">
                <div className="text-sm font-bold">Step 1: Open Update Directory</div>
                <div className="text-xs font-normal opacity-90">Click to open the pending updates folder</div>
              </div>
            </button>
          </div>

          {/* Steps 2, 3, 4 */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((imageNum) => (
              <div key={imageNum} className="flex flex-col items-center">
                {/* Image */}
                <div className="w-full aspect-square bg-gray-700 rounded-lg mb-3 overflow-hidden">
                  <img 
                    src={`Instruction/Step ${imageNum}.png`} 
                    alt={`Step ${imageNum + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                </div>

                {/* Step label with light orange accent */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">Step</span>
                  <span className="text-sm font-bold" style={{ color: '#ff8c42' }}>{imageNum + 1}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Instruction text */}
          <p className="text-center text-sm text-white leading-relaxed mb-6">
            After exiting Sweesh from the system tray <span className="font-semibold" style={{ color: '#ff8c42' }}>(Step 2)</span>, go to the opened directory
            <br />
            and run the latest <span className="font-semibold" style={{ color: '#ff8c42' }}>Sweesh-Setup</span> to install the update.
          </p>

          {/* Manual download option */}
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">
              Or to download the latest version manually:
            </p>
            <button 
              onClick={handleManualDownload}
              className="text-sm transition-colors underline font-medium"
              style={{ color: '#ff8c42' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffa05c'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#ff8c42'}
            >
              Visit sweesh
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}