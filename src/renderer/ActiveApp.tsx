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

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-[9999]"
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 0.5 : 0 }}
      transition={{ 
        duration: active ? 0.3 : 1.2, 
        ease: active ? "easeOut" : "easeInOut" 
      }}
    >
       {/* Aurora Border - Top */}
       <motion.div
         className="absolute top-0 left-0 right-0"
         style={{
           height: `${24 + (audioLevel * 8)}px`, // 2x thickness
           background: "linear-gradient(90deg, #a855f7, #3b82f6, #ec4899, #a855f7, #3b82f6, #ec4899, #a855f7)",
           filter: `blur(${28 + (audioLevel * 4)}px)`, // 2x blur spread
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

       {/* Aurora Border - Bottom */}
       <motion.div
         className="absolute bottom-0 left-0 right-0"
         style={{
           height: `${24 + (audioLevel * 8)}px`, // 2x thickness
           background: "linear-gradient(90deg, #ec4899, #a855f7, #3b82f6, #ec4899, #a855f7, #3b82f6, #ec4899)",
           filter: `blur(${28 + (audioLevel * 4)}px)`, // 2x blur spread
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

       {/* Aurora Border - Left */}
       <motion.div
         className="absolute top-0 bottom-0 left-0"
         style={{
           width: `${24 + (audioLevel * 8)}px`, // 2x thickness
           background: "linear-gradient(180deg, #3b82f6, #a855f7, #ec4899, #3b82f6, #a855f7, #ec4899, #3b82f6)",
           filter: `blur(${28 + (audioLevel * 4)}px)`, // 2x blur spread
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

       {/* Aurora Border - Right */}
       <motion.div
         className="absolute top-0 bottom-0 right-0"
         style={{
           width: `${24 + (audioLevel * 8)}px`, // 2x thickness
           background: "linear-gradient(180deg, #ec4899, #3b82f6, #a855f7, #ec4899, #3b82f6, #a855f7, #ec4899)",
           filter: `blur(${28 + (audioLevel * 4)}px)`, // 2x blur spread
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