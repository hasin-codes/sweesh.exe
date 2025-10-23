"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface TranscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  transcription: {
    id: number
    file: string
    text: string
    date: string
  }
  onDelete: (id: number) => void
  onUpdate: (id: number, newText: string) => void
}

export function TranscriptionModal({
  isOpen,
  onClose,
  transcription,
  onDelete,
  onUpdate,
}: TranscriptionModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(transcription.text)

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
        duration: 0.2
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcription.text)
      console.log("Transcription copied to clipboard")
    } catch {
      console.log("Copy failed - could not copy to clipboard")
    }
  }

  const handleDelete = () => {
    onDelete(transcription.id)
    onClose()
    console.log("Transcript deleted")
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditedText(transcription.text)
  }

  const handleSave = () => {
    onUpdate(transcription.id, editedText)
    setIsEditing(false)
    console.log("Transcription updated successfully")
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedText(transcription.text)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
      >
        <motion.div 
          className="rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col"
          style={{ backgroundColor: '#171717' }}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header with gradient matching transcription card */}
        <div
          className="w-full h-24 rounded-t-lg border-b border-border"
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, rgba(255,99,71,0.75) 0%, rgba(255,140,0,0.65) 35%, rgba(220,38,38,0.6) 70%, transparent 100%), conic-gradient(from 220deg at 60% 40%, rgba(255,140,0,0.35), rgba(255,69,58,0.35), rgba(220,38,38,0.35))",
          }}
        >
          <div className="h-full flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="text-sm text-white/90 font-medium">{transcription.date}</div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                className="h-8 px-2 text-xs bg-gray-500/10 hover:bg-gray-500/20 text-white rounded font-medium flex items-center justify-center transition-colors"
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              {!isEditing ? (
                <button 
                  className="h-8 px-3 text-xs bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-md font-medium flex items-center gap-1.5 transition-colors"
                  onClick={handleEdit}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              ) : (
                <button 
                  className="h-8 px-3 text-xs bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-md font-medium flex items-center gap-1.5 transition-colors"
                  onClick={handleSave}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
              )}
              <button 
                className="h-8 px-2 text-xs bg-gray-500/10 hover:bg-gray-500/20 text-white rounded font-medium flex items-center justify-center transition-colors"
                onClick={handleDelete}
                title="Delete transcription"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Divider line */}
        <div className="border-b border-gray-700"></div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full min-h-[200px] p-4 border border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                style={{ backgroundColor: '#171717' }}
                placeholder="Edit your transcription..."
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleSave}
                  className="px-4 py-2 text-white rounded-md font-medium hover:opacity-80 transition-colors"
                  style={{ backgroundColor: '#171717' }}
                >
                  Save Changes
                </button>
                <button 
                  onClick={handleCancel}
                  className="px-4 py-2 text-white rounded-md font-medium hover:opacity-80 transition-colors border border-gray-600"
                  style={{ backgroundColor: '#171717' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <p className="text-white leading-relaxed whitespace-pre-wrap">
                {transcription.text}
              </p>
            </div>
          )}
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
