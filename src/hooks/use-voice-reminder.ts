"use client"

import { useEffect } from "react"
import { voiceReminderService } from "@/lib/voice-reminder"

export function useVoiceReminder() {
  useEffect(() => {
    // Initialize the voice reminder service when the component mounts
    // The service will automatically start the scheduler
    
    return () => {
      // Cleanup when the component unmounts
      // voiceReminderService.stop()
    }
  }, [])

  // Return any necessary functions or state if needed
  return {
    // Currently no return value needed as the service handles everything internally
  }
}