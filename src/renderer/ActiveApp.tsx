"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface AuroraBorderProps {
  active: boolean
  audioLevel?: number
}

export function AuroraBorder({ active, audioLevel = 0 }: AuroraBorderProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (active) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 800)
      return () => clearTimeout(timer)
    }
  }, [active])

  if (!isVisible) return null

  const borderSize = 24 + (audioLevel * 8)
  const blurAmount = 28 + (audioLevel * 4)

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-[9999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ 
        duration: active ? 0.3 : 1.2, 
        ease: active ? "easeOut" : "easeInOut" 
      }}
    >
       {/* Aurora Border - Top */}
       <div className="absolute top-0 left-0 right-0" style={{ height: `${borderSize}px` }}>
         {/* Backdrop blur layer */}
         <div 
           className="absolute inset-0"
           style={{
             backdropFilter: `blur(${blurAmount * 0.3}px)`,
             WebkitBackdropFilter: `blur(${blurAmount * 0.3}px)`,
             maskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)`,
             WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)`,
           }}
         />
         {/* Aurora gradient */}
         <motion.div
           className="absolute inset-0"
           style={{
             background: "linear-gradient(90deg, #a855f7, #3b82f6, #ec4899, #a855f7, #3b82f6, #ec4899, #a855f7)",
             filter: `blur(${blurAmount}px)`,
             opacity: 0.94,
           }}
           animate={{
             background: [
               "linear-gradient(90deg, #a855f7, #3b82f6, #ec4899, #a855f7, #3b82f6, #ec4899, #a855f7)",
               "linear-gradient(90deg, #ec4899, #a855f7, #3b82f6, #ec4899, #a855f7, #3b82f6, #ec4899)",
               "linear-gradient(90deg, #3b82f6, #ec4899, #a855f7, #3b82f6, #ec4899, #a855f7, #3b82f6)",
               "linear-gradient(90deg, #a855f7, #3b82f6, #ec4899, #a855f7, #3b82f6, #ec4899, #a855f7)",
             ],
           }}
           transition={{
             background: {
               duration: 6,
               repeat: Infinity,
               ease: "linear",
             },
           }}
         />
       </div>

       {/* Aurora Border - Bottom */}
       <div className="absolute bottom-0 left-0 right-0" style={{ height: `${borderSize}px` }}>
         {/* Backdrop blur layer */}
         <div 
           className="absolute inset-0"
           style={{
             backdropFilter: `blur(${blurAmount * 0.3}px)`,
             WebkitBackdropFilter: `blur(${blurAmount * 0.3}px)`,
             maskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)`,
             WebkitMaskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)`,
           }}
         />
         {/* Aurora gradient */}
         <motion.div
           className="absolute inset-0"
           style={{
             background: "linear-gradient(90deg, #ec4899, #a855f7, #3b82f6, #ec4899, #a855f7, #3b82f6, #ec4899)",
             filter: `blur(${blurAmount}px)`,
             opacity: 0.94,
           }}
           animate={{
             background: [
               "linear-gradient(90deg, #ec4899, #a855f7, #3b82f6, #ec4899, #a855f7, #3b82f6, #ec4899)",
               "linear-gradient(90deg, #3b82f6, #ec4899, #a855f7, #3b82f6, #ec4899, #a855f7, #3b82f6)",
               "linear-gradient(90deg, #a855f7, #3b82f6, #ec4899, #a855f7, #3b82f6, #ec4899, #a855f7)",
               "linear-gradient(90deg, #ec4899, #a855f7, #3b82f6, #ec4899, #a855f7, #3b82f6, #ec4899)",
             ],
           }}
           transition={{
             background: {
               duration: 6,
               repeat: Infinity,
               ease: "linear",
             },
           }}
         />
       </div>

       {/* Aurora Border - Left */}
       <div className="absolute top-0 bottom-0 left-0" style={{ width: `${borderSize}px` }}>
         {/* Backdrop blur layer */}
         <div 
           className="absolute inset-0"
           style={{
             backdropFilter: `blur(${blurAmount * 0.3}px)`,
             WebkitBackdropFilter: `blur(${blurAmount * 0.3}px)`,
             maskImage: `linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)`,
             WebkitMaskImage: `linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)`,
           }}
         />
         {/* Aurora gradient */}
         <motion.div
           className="absolute inset-0"
           style={{
             background: "linear-gradient(180deg, #3b82f6, #a855f7, #ec4899, #3b82f6, #a855f7, #ec4899, #3b82f6)",
             filter: `blur(${blurAmount}px)`,
             opacity: 0.94,
           }}
           animate={{
             background: [
               "linear-gradient(180deg, #3b82f6, #a855f7, #ec4899, #3b82f6, #a855f7, #ec4899, #3b82f6)",
               "linear-gradient(180deg, #ec4899, #3b82f6, #a855f7, #ec4899, #3b82f6, #a855f7, #ec4899)",
               "linear-gradient(180deg, #a855f7, #ec4899, #3b82f6, #a855f7, #ec4899, #3b82f6, #a855f7)",
               "linear-gradient(180deg, #3b82f6, #a855f7, #ec4899, #3b82f6, #a855f7, #ec4899, #3b82f6)",
             ],
           }}
           transition={{
             background: {
               duration: 6,
               repeat: Infinity,
               ease: "linear",
             },
           }}
         />
       </div>

       {/* Aurora Border - Right */}
       <div className="absolute top-0 bottom-0 right-0" style={{ width: `${borderSize}px` }}>
         {/* Backdrop blur layer */}
         <div 
           className="absolute inset-0"
           style={{
             backdropFilter: `blur(${blurAmount * 0.3}px)`,
             WebkitBackdropFilter: `blur(${blurAmount * 0.3}px)`,
             maskImage: `linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)`,
             WebkitMaskImage: `linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)`,
           }}
         />
         {/* Aurora gradient */}
         <motion.div
           className="absolute inset-0"
           style={{
             background: "linear-gradient(180deg, #ec4899, #3b82f6, #a855f7, #ec4899, #3b82f6, #a855f7, #ec4899)",
             filter: `blur(${blurAmount}px)`,
             opacity: 0.98,
           }}
           animate={{
             background: [
               "linear-gradient(180deg, #ec4899, #3b82f6, #a855f7, #ec4899, #3b82f6, #a855f7, #ec4899)",
               "linear-gradient(180deg, #a855f7, #ec4899, #3b82f6, #a855f7, #ec4899, #3b82f6, #a855f7)",
               "linear-gradient(180deg, #3b82f6, #a855f7, #ec4899, #3b82f6, #a855f7, #ec4899, #3b82f6)",
               "linear-gradient(180deg, #ec4899, #3b82f6, #a855f7, #ec4899, #3b82f6, #a855f7, #ec4899)",
             ],
           }}
           transition={{
             background: {
               duration: 6,
               repeat: Infinity,
               ease: "linear",
             },
           }}
         />
       </div>

    </motion.div>
  )
}

export default function ActiveApp() {
  return (
    <div className="fixed inset-0 bg-transparent pointer-events-none">
      <AuroraBorder active={true} audioLevel={0.5} />
    </div>
  )
}