"use client"

import { Bell, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface TopbarProps {
  onSettings: () => void
  onNotifications: () => void
  onProfile: () => void
}

export function Topbar({ onSettings, onNotifications, onProfile }: TopbarProps) {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)

  useEffect(() => {
    // Check for unread notifications on mount
    checkForUnreadNotifications()

    // Check periodically every 30 seconds
    const interval = setInterval(checkForUnreadNotifications, 30000)

    return () => clearInterval(interval)
  }, [])

  const checkForUnreadNotifications = async () => {
    try {
      if (window.electronAPI && window.electronAPI.checkPendingUpdate) {
        const hasPending = await window.electronAPI.checkPendingUpdate()
        setHasUnreadNotifications(hasPending)
      }
    } catch (error) {
      console.error('Failed to check for unread notifications:', error)
    }
  }

  return (
    <aside 
      data-topbar
      className="fixed left-3 top-1/2 -translate-y-1/2 w-12 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-xl shadow-sm z-50 lg:left-4 md:left-3 sm:left-2"
    >
      <div className="py-2 flex flex-col items-center gap-2">
        {/* Notification Icon (Bell) */}
        <button
          onClick={onNotifications}
          className={`relative w-10 h-10 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 flex items-center justify-center transition-colors duration-200 ${hasUnreadNotifications ? 'text-orange-500' : 'text-white'}`}
          title={hasUnreadNotifications ? 'You have unread notifications' : 'Notifications'}
        >
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
            animate={hasUnreadNotifications ? { rotate: [0, -10, 10, -10, 0] } : {}}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 17,
              rotate: { duration: 0.5, repeat: hasUnreadNotifications ? Infinity : 0, repeatDelay: 3 }
            }}
          >
            <Bell className="w-5 h-5" />
          </motion.div>
          {hasUnreadNotifications && (
            <>
              {/* Pulsing dot indicator for unread notifications */}
              <span className="absolute top-1 right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-600"></span>
              </span>
            </>
          )}
        </button>
        
        {/* Settings Icon (Cog) */}
        <button
          onClick={onSettings}
          className="relative w-10 h-10 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 flex items-center justify-center text-white transition-colors duration-200"
          title="Settings"
        >
          <motion.div
            whileHover={{ scale: 1.2, rotate: 90 }}
            whileTap={{ scale: 0.8, rotate: -90 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Settings className="w-5 h-5" />
          </motion.div>
        </button>
        
        {/* Profile Icon (User) */}
        <button
          onClick={onProfile}
          className="relative w-10 h-10 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 flex items-center justify-center text-white transition-colors duration-200"
          title="Profile"
        >
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <User className="w-5 h-5" />
          </motion.div>
        </button>
      </div>
    </aside>
  )
}
