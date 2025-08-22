interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate?: Date
  createdAt: Date
}

interface Appointment {
  id: string
  title: string
  description?: string
  location?: string
  date: Date
  duration: number
  createdAt: Date
}

interface VoiceReminderSettings {
  enabled: boolean
  reminderTime: string // HH:mm format
  voice: string
  rate: number
  pitch: number
  volume: number
}

class VoiceReminderService {
  private settings: VoiceReminderSettings = {
    enabled: true,
    reminderTime: "08:00",
    voice: "default",
    rate: 1,
    pitch: 1,
    volume: 1
  }

  private schedulerInterval: NodeJS.Timeout | null = null
  private isSpeaking = false

  constructor() {
    this.loadSettings()
    this.startScheduler()
  }

  private loadSettings() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voiceReminderSettings')
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) }
      }
    }
  }

  private saveSettings() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('voiceReminderSettings', JSON.stringify(this.settings))
    }
  }

  updateSettings(newSettings: Partial<VoiceReminderSettings>) {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
  }

  getSettings(): VoiceReminderSettings {
    return { ...this.settings }
  }

  private startScheduler() {
    if (typeof window === 'undefined') return

    // Check every minute
    this.schedulerInterval = setInterval(() => {
      this.checkAndTriggerReminder()
    }, 60000) // Check every minute

    // Also check immediately
    this.checkAndTriggerReminder()
  }

  private stopScheduler() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval)
      this.schedulerInterval = null
    }
  }

  private checkAndTriggerReminder() {
    if (!this.settings.enabled) return

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    // Check if it's time for the reminder (within the same minute)
    if (currentTime === this.settings.reminderTime) {
      // Check if we haven't already triggered today
      const lastTriggered = localStorage.getItem('lastVoiceReminderDate')
      const today = now.toDateString()
      
      if (lastTriggered !== today) {
        this.triggerDailyReminder()
        localStorage.setItem('lastVoiceReminderDate', today)
      }
    }
  }

  private async triggerDailyReminder() {
    if (this.isSpeaking) return

    try {
      // Get today's data (in a real app, this would come from the database)
      const todayData = this.getTodayData()
      
      if (todayData.tasks.length === 0 && todayData.appointments.length === 0 && todayData.overdueTasks.length === 0) {
        return // No need to speak if there's nothing to report
      }

      const message = this.generateReminderMessage(todayData)
      await this.speak(message)
    } catch (error) {
      console.error('Error triggering voice reminder:', error)
    }
  }

  private getTodayData() {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    // In a real app, this would fetch from the database
    // For now, we'll use mock data based on the current state
    const mockTasks: Task[] = [
      {
        id: "1",
        title: "Réunion d'équipe",
        description: "Préparer l'agenda",
        completed: false,
        priority: "HIGH",
        dueDate: new Date(),
        createdAt: new Date()
      },
      {
        id: "2",
        title: "Appeler client",
        description: "Discuter du nouveau projet",
        completed: false,
        priority: "MEDIUM",
        dueDate: new Date(),
        createdAt: new Date()
      }
    ]

    const mockAppointments: Appointment[] = [
      {
        id: "1",
        title: "Réunion avec le directeur",
        description: "Point sur les objectifs trimestriels",
        location: "Bureau du directeur",
        date: new Date(now.setHours(10, 0, 0, 0)),
        duration: 60,
        createdAt: new Date()
      }
    ]

    const mockOverdueTasks: Task[] = [
      {
        id: "3",
        title: "Rapport mensuel",
        description: "Terminer le rapport pour la direction",
        completed: false,
        priority: "HIGH",
        dueDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
        createdAt: new Date()
      }
    ]

    return {
      tasks: mockTasks,
      appointments: mockAppointments,
      overdueTasks: mockOverdueTasks
    }
  }

  private generateReminderMessage(data: { tasks: Task[]; appointments: Appointment[]; overdueTasks: Task[] }): string {
    const messages: string[] = []
    const hour = new Date().getHours()
    const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir"
    
    messages.push(`${greeting}. Voici votre résumé quotidien.`)

    if (data.overdueTasks.length > 0) {
      messages.push(`Vous avez ${data.overdueTasks.length} tâche${data.overdueTasks.length > 1 ? 's' : ''} en retard.`)
      data.overdueTasks.forEach(task => {
        messages.push(`La tâche "${task.title}" est en retard.`)
      })
    }

    if (data.tasks.length > 0) {
      messages.push(`Aujourd'hui, vous avez ${data.tasks.length} tâche${data.tasks.length > 1 ? 's' : ''} à accomplir.`)
      data.tasks.slice(0, 3).forEach(task => {
        messages.push(`"${task.title}".`)
      })
      if (data.tasks.length > 3) {
        messages.push(`Et ${data.tasks.length - 3} autres tâches.`)
      }
    }

    if (data.appointments.length > 0) {
      messages.push(`Vous avez ${data.appointments.length} rendez-vous aujourd'hui.`)
      data.appointments.forEach(appointment => {
        const time = appointment.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        messages.push(`À ${time}, ${appointment.title}.`)
      })
    }

    if (data.tasks.length === 0 && data.appointments.length === 0 && data.overdueTasks.length === 0) {
      messages.push("Vous n'avez aucune tâche ni rendez-vous prévu pour aujourd'hui. Profitez de votre journée !")
    }

    messages.push("Bonne journée !")

    return messages.join(" ")
  }

  private async speak(text: string): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported')
      return
    }

    return new Promise((resolve, reject) => {
      if (this.isSpeaking) {
        reject(new Error('Already speaking'))
        return
      }

      // Check if speech synthesis is ready
      const voices = speechSynthesis.getVoices()
      if (voices.length === 0) {
        // Wait for voices to be loaded
        console.log('Waiting for voices to be loaded...')
        speechSynthesis.onvoiceschanged = () => {
          setTimeout(() => {
            this.speakWithVoices(text, resolve, reject)
          }, 100) // Small delay to ensure voices are loaded
        }
        
        // Fallback: if voices don't load after 2 seconds, proceed anyway
        setTimeout(() => {
          if (speechSynthesis.getVoices().length === 0) {
            console.warn('No voices loaded after timeout, proceeding anyway')
            this.speakWithVoices(text, resolve, reject)
          }
        }, 2000)
      } else {
        this.speakWithVoices(text, resolve, reject)
      }
    })
  }

  private speakWithVoices(text: string, resolve: () => void, reject: (error: Error) => void) {
    this.isSpeaking = true

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    utterance.rate = this.settings.rate
    utterance.pitch = this.settings.pitch
    utterance.volume = this.settings.volume

    // Get available voices
    const voices = speechSynthesis.getVoices()
    console.log(`Available voices: ${voices.length}`)
    
    // Try to find a French voice
    let selectedVoice = voices.find(voice => 
      voice.lang.startsWith('fr') || 
      voice.name.includes('French') ||
      voice.name.includes('français') ||
      voice.name.includes('fr-')
    )
    
    // If no French voice found, try to find any voice
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0] // Use the first available voice
      console.warn('No French voice found, using default voice:', selectedVoice.name)
    }
    
    // Use specific voice if set in settings (and not "default")
    if (this.settings.voice && this.settings.voice !== "default") {
      const specificVoice = voices.find(voice => voice.name === this.settings.voice)
      if (specificVoice) {
        selectedVoice = specificVoice
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice
      console.log('Using voice:', selectedVoice.name, selectedVoice.lang)
    } else {
      console.warn('No voices available for speech synthesis')
      this.isSpeaking = false
      // Resolve instead of reject to avoid breaking the application flow
      resolve()
      return
    }

    utterance.onend = () => {
      this.isSpeaking = false
      resolve()
    }

    utterance.onerror = (event) => {
      this.isSpeaking = false
      console.error('Speech synthesis error:', event.error)
      // Resolve instead of reject to avoid breaking the application flow
      resolve()
    }

    try {
      // Cancel any ongoing speech
      speechSynthesis.cancel()
      
      // Small delay before speaking
      setTimeout(() => {
        speechSynthesis.speak(utterance)
      }, 100)
    } catch (error) {
      this.isSpeaking = false
      console.error('Failed to speak:', error)
      // Resolve instead of reject to avoid breaking the application flow
      resolve()
    }
  }

  async testVoice(): Promise<void> {
    const testMessage = "Bonjour. Ceci est un test du rappel vocal quotidien."
    await this.speak(testMessage)
  }

  stop() {
    this.stopScheduler()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
  }
}

// Singleton instance
export const voiceReminderService = new VoiceReminderService()

// React hook for using the voice reminder
export function useVoiceReminder() {
  const testVoice = async () => {
    await voiceReminderService.testVoice()
  }

  const updateSettings = (settings: Partial<VoiceReminderSettings>) => {
    voiceReminderService.updateSettings(settings)
  }

  const getSettings = () => {
    return voiceReminderService.getSettings()
  }

  return {
    testVoice,
    updateSettings,
    getSettings
  }
}