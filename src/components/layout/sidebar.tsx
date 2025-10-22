"use client"

import { Plus, Settings, User, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

interface TopbarProps {
  onSettings: () => void
  onAddRecording: () => void
}

export function Topbar({ onSettings, onAddRecording }: TopbarProps) {
  const [hasPendingUpdate, setHasPendingUpdate] = useState(false)

  useEffect(() => {
    // Check for pending updates on mount
    checkForPendingUpdate()

    // Check periodically every 30 seconds
    const interval = setInterval(checkForPendingUpdate, 30000)

    return () => clearInterval(interval)
  }, [])

  const checkForPendingUpdate = async () => {
    try {
      if (window.electronAPI && window.electronAPI.checkPendingUpdate) {
        const hasPending = await window.electronAPI.checkPendingUpdate()
        setHasPendingUpdate(hasPending)
      }
    } catch (error) {
      console.error('Failed to check for pending updates:', error)
    }
  }

  const handleUpdateClick = async () => {
    if (hasPendingUpdate) {
      const confirmInstall = confirm('A new update is ready to install. The app will close and install the update. Continue?')
      if (confirmInstall) {
        try {
          await window.electronAPI.installPendingUpdate()
        } catch (error) {
          console.error('Failed to install update:', error)
        }
      }
    }
  }

  return (
    <aside 
      data-topbar
      className="fixed left-3 top-1/2 -translate-y-1/2 w-12 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-xl shadow-sm z-50 lg:left-4 md:left-3 sm:left-2"
    >
      <div className="py-2 flex flex-col items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onAddRecording} className="hover:bg-gray-700 w-10 h-10 text-white">
          <Plus className="w-5 h-5" />
        </Button>
        
        <Button variant="ghost" size="icon" onClick={onSettings} className="hover:bg-gray-700 w-10 h-10 text-white">
          <Settings className="w-5 h-5" />
        </Button>
        
        {/* Update Notification Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleUpdateClick}
          className={`relative hover:bg-gray-700 w-10 h-10 text-white ${hasPendingUpdate ? 'text-orange-500' : ''}`}
          title={hasPendingUpdate ? 'Update available! Click to install' : 'No updates'}
        >
          <Download className="w-5 h-5" />
          {hasPendingUpdate && (
            <>
              {/* Pulsing dot indicator */}
              <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-600"></span>
              </span>
            </>
          )}
        </Button>
        
        <Button variant="ghost" size="icon" className="hover:bg-gray-700 w-10 h-10 text-white">
          <User className="w-5 h-5" />
        </Button>
      </div>
    </aside>
  )
}
