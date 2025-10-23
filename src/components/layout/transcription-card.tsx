"use client"

import { useState } from "react"

interface TranscriptionCardProps {
  id: number
  file: string
  text: string
  date: string
  onDelete?: (id: number) => void
  onClick?: (id: number) => void
}

export function TranscriptionCard({ id, file, text, date, onDelete, onClick }: TranscriptionCardProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      console.log("Transcription copied to clipboard")
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch {
      console.log("Copy failed - could not copy to clipboard")
    }
  }

  return (
    <div
      className="relative overflow-hidden p-0 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg ring-inset ring-2 ring-gray-700 group rounded-xl border border-gray-700 m-1.5"
      style={{ backgroundColor: '#171717' }}
      onClick={() => onClick?.(id)}
    >
      {/* Gradient header (no top margin, follows rounded corners) */}
      <div
        className="w-full h-12 rounded-t-xl border-b border-gray-700"
        style={{
          backgroundImage: `
            radial-gradient(circle 60px at 10% 40%, rgba(255, 255, 255, 0.08) 0%, transparent 100%),
            radial-gradient(circle 40px at 30% 70%, rgba(255, 255, 255, 0.06) 0%, transparent 100%),
            radial-gradient(circle 50px at 50% 30%, rgba(255, 255, 255, 0.07) 0%, transparent 100%),
            radial-gradient(circle 70px at 70% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 100%),
            radial-gradient(circle 30px at 90% 60%, rgba(255, 255, 255, 0.06) 0%, transparent 100%),
            linear-gradient(to right, #c40000, #ff4500)
          `,
          backgroundSize: "cover"
        }}
      />

      {/* Bottom content area (same bg as card) */}
      <div className="px-8 py-4 space-y-3">
        <div className="min-w-0">
          <p className="font-semibold text-base text-white truncate">{file}</p>
          <p className="text-sm text-gray-400 mt-1">{date}</p>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed line-clamp-4">{text}</p>

        {/* Footer: large date label and Copy/Delete actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-white">
              {new Date(date).getDate().toString().padStart(2, "0")}
            </span>
            <span className="text-sm text-gray-400">
              {new Date(date).toLocaleString(undefined, { month: "short" })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              className={`h-8 w-8 text-xs transition-all duration-200 rounded-md font-medium flex items-center justify-center ${
                isCopied 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'text-white hover:opacity-80'
              }`}
              style={{ backgroundColor: isCopied ? undefined : '#171717' }}
              onClick={handleCopy}
              title={isCopied ? 'Copied!' : 'Copy to clipboard'}
            >
              {isCopied ? (
                <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            {onDelete && (
              <button
                className="h-8 w-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md font-medium flex items-center justify-center transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(id)
                }}
                title="Delete transcription"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
