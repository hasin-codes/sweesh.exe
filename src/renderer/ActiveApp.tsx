"use client"

import { motion } from "framer-motion"
import { useEffect, useState, useRef } from "react"

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
             background: "linear-gradient(90deg, #ff4500, #ff6b35, #ff8c42, #ffa500, #ff8c42, #ff6b35, #ff4500)",
             filter: `blur(${blurAmount}px)`,
             opacity: 0.94,
           }}
           animate={{
             background: [
               "linear-gradient(90deg, #ff4500, #ff6b35, #ff8c42, #ffa500, #ff8c42, #ff6b35, #ff4500)",
               "linear-gradient(90deg, #ffa500, #ff8c42, #ff6b35, #ff4500, #ff6b35, #ff8c42, #ffa500)",
               "linear-gradient(90deg, #ff6b35, #ffa500, #ff4500, #ff8c42, #ffa500, #ff4500, #ff6b35)",
               "linear-gradient(90deg, #ff4500, #ff6b35, #ff8c42, #ffa500, #ff8c42, #ff6b35, #ff4500)",
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
             background: "linear-gradient(90deg, #ffa500, #ff8c42, #ff6b35, #ff4500, #ff6b35, #ff8c42, #ffa500)",
             filter: `blur(${blurAmount}px)`,
             opacity: 0.94,
           }}
           animate={{
             background: [
               "linear-gradient(90deg, #ffa500, #ff8c42, #ff6b35, #ff4500, #ff6b35, #ff8c42, #ffa500)",
               "linear-gradient(90deg, #ff4500, #ffa500, #ff8c42, #ff6b35, #ff8c42, #ffa500, #ff4500)",
               "linear-gradient(90deg, #ff8c42, #ff6b35, #ffa500, #ff4500, #ff6b35, #ff8c42, #ffa500)",
               "linear-gradient(90deg, #ffa500, #ff8c42, #ff6b35, #ff4500, #ff6b35, #ff8c42, #ffa500)",
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
             background: "linear-gradient(180deg, #ff6b35, #ff4500, #ff8c42, #ffa500, #ff8c42, #ff4500, #ff6b35)",
             filter: `blur(${blurAmount}px)`,
             opacity: 0.94,
           }}
           animate={{
             background: [
               "linear-gradient(180deg, #ff6b35, #ff4500, #ff8c42, #ffa500, #ff8c42, #ff4500, #ff6b35)",
               "linear-gradient(180deg, #ffa500, #ff6b35, #ff4500, #ff8c42, #ff4500, #ff6b35, #ffa500)",
               "linear-gradient(180deg, #ff4500, #ffa500, #ff6b35, #ff8c42, #ffa500, #ff6b35, #ff4500)",
               "linear-gradient(180deg, #ff6b35, #ff4500, #ff8c42, #ffa500, #ff8c42, #ff4500, #ff6b35)",
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
             background: "linear-gradient(180deg, #ffa500, #ff8c42, #ff4500, #ff6b35, #ff4500, #ff8c42, #ffa500)",
             filter: `blur(${blurAmount}px)`,
             opacity: 0.98,
           }}
           animate={{
             background: [
               "linear-gradient(180deg, #ffa500, #ff8c42, #ff4500, #ff6b35, #ff4500, #ff8c42, #ffa500)",
               "linear-gradient(180deg, #ff6b35, #ffa500, #ff8c42, #ff4500, #ff8c42, #ffa500, #ff6b35)",
               "linear-gradient(180deg, #ff4500, #ff6b35, #ffa500, #ff8c42, #ff6b35, #ffa500, #ff4500)",
               "linear-gradient(180deg, #ffa500, #ff8c42, #ff4500, #ff6b35, #ff4500, #ff8c42, #ffa500)",
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
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Play short indicator sound when mic becomes active
  const playActivationSound = () => {
    try {
      const audio = new Audio('sound/active.mp3')
      audio.volume = 1.0
      // Fire and forget; no need to await
      void audio.play().catch(() => {})
    } catch {}
  }

  // Initialize audio recording
  const initializeAudio = async () => {
    try {
      console.log('Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })
      
      streamRef.current = stream
      
      // Set up audio analysis for level monitoring
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 256
      source.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      
      console.log('Microphone access granted')
      return true
    } catch (error) {
      console.error('Microphone access denied:', error)
      return false
    }
  }

  // Start recording
  const startRecording = async () => {
    if (!streamRef.current) {
      const hasAccess = await initializeAudio()
      if (!hasAccess) return
    }

    try {
      console.log('Starting recording...')
      audioChunksRef.current = []
      
      const mediaRecorder = new MediaRecorder(streamRef.current!, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder

      // When recording actually starts, play activation tone
      mediaRecorder.onstart = () => {
        playActivationSound()
      }
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...')
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const arrayBuffer = await audioBlob.arrayBuffer()
        
        // Send to main process for transcription
        if (window.electronAPI) {
          try {
            const result = await window.electronAPI.transcribeAudio(arrayBuffer)
            if (result.success) {
              console.log('Transcription successful:', result.text)
              
              // Send transcription to main window
              const transcriptionData = {
                id: Date.now(),
                file: `recording_${Date.now()}.webm`,
                text: result.text,
                date: new Date().toISOString()
              }
              
              await window.electronAPI.sendTranscriptionToMain(transcriptionData)
            } else {
              console.error('Transcription failed:', result.error)
            }
          } catch (error) {
            console.error('Error processing transcription:', error)
          }
        }
        // Ensure resources are released after finishing processing too
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
        analyserRef.current = null
        mediaRecorderRef.current = null
      }
      
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      
      // Start audio level monitoring
      startAudioLevelMonitoring()
      
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('Stopping recording...')
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    stopAudioLevelMonitoring()
    // Fully release microphone and audio resources immediately on stop
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    mediaRecorderRef.current = null
  }

  // Monitor audio levels
  const startAudioLevelMonitoring = () => {
    if (!analyserRef.current) return
    
    const analyser = analyserRef.current
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    const updateLevel = () => {
      if (!isRecording) return
      
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      const normalizedLevel = average / 255
      
      setAudioLevel(normalizedLevel)
      animationFrameRef.current = requestAnimationFrame(updateLevel)
    }
    
    updateLevel()
  }

  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setAudioLevel(0)
  }

  // Listen for IPC messages from main process
  useEffect(() => {
    const handleStartRecording = () => {
      console.log('Received start-recording message from main process')
      startRecording()
    }

    const handleStopRecording = () => {
      console.log('Received stop-recording message from main process')
      stopRecording()
    }

    // Listen for IPC messages
    if (window.electronAPI) {
      window.electronAPI.onStartRecording(handleStartRecording)
      window.electronAPI.onStopRecording(handleStopRecording)
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeRecordingListeners()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      stopAudioLevelMonitoring()
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-transparent pointer-events-none">
      <AuroraBorder active={isRecording} audioLevel={audioLevel} />
    </div>
  )
}