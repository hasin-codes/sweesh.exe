"use client"

import { Plus, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TopbarProps {
  onSettings: () => void
  onAddRecording: () => void
}

export function Topbar({ onSettings, onAddRecording }: TopbarProps) {
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
        
        <Button variant="ghost" size="icon" className="hover:bg-gray-700 w-10 h-10 text-white">
          <User className="w-5 h-5" />
        </Button>
      </div>
    </aside>
  )
}
