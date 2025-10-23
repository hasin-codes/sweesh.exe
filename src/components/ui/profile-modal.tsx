"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, X, LogOut, Shield } from "lucide-react"

interface ProfileModalProps {
  onClose: () => void
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      if (window.electronAPI) {
        const onboardingStatus = await window.electronAPI.checkOnboardingStatus()
        setIsAuthenticated(onboardingStatus.isAuthenticated)
        
        // Get user info from Clerk (stored after deeplink auth)
        if (onboardingStatus.isAuthenticated && onboardingStatus.userInfo) {
          const user = onboardingStatus.userInfo
          
          // Build full name from firstName and lastName
          const fullName = [user.firstName, user.lastName]
            .filter(Boolean)
            .join(' ') || user.email?.split('@')[0] || 'User'
          
          setUserName(fullName)
          setUserEmail(user.email || '')
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    const confirmSignOut = confirm('Are you sure you want to sign out?')
    if (confirmSignOut) {
      try {
        // Implement sign out logic here
        // This would need to be added to the electronAPI
        console.log('Sign out requested')
        setIsAuthenticated(false)
        setUserName("")
        setUserEmail("")
      } catch (error) {
        console.error('Failed to sign out:', error)
      }
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

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          className="absolute inset-0 bg-black/20"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div 
          className="relative rounded-lg shadow-2xl w-full max-w-md max-h-[45vh] flex flex-col" 
          style={{ backgroundColor: '#171717' }}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Profile</h2>
            </div>
            <button 
              onClick={onClose} 
              className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Profile Avatar Section */}
                <div className="flex flex-col items-center py-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mb-2">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  {isAuthenticated ? (
                    <>
                      <h3 className="text-base font-semibold text-white">{userName}</h3>
                      <p className="text-xs text-gray-400">{userEmail}</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Not signed in</p>
                  )}
                </div>

                {/* Profile Information */}
                {isAuthenticated ? (
                  <div className="space-y-2">
                    {/* Authentication Status */}
                    <div className="bg-gray-800/50 rounded-lg p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-medium text-white">Account Status</span>
                      </div>
                      <span className="text-xs text-green-500">Authenticated</span>
                    </div>

                    {/* Sign Out Button */}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors mt-3"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-500">Not Authenticated</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      Sign in to access all features
                    </p>
                    <button
                      onClick={() => {
                        // This would trigger the onboarding flow
                        console.log('Sign in requested')
                      }}
                      className="w-full px-4 py-1.5 bg-orange-500 text-white rounded text-sm font-medium hover:bg-orange-600 transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end px-4 py-3 border-t border-gray-700">
            <button 
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-700 text-white rounded text-sm font-medium hover:bg-gray-600 transition-colors border border-gray-600"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

