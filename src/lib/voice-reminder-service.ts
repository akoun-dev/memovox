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

interface ReminderSettings {
  enabled: boolean
  reminderTime: string // Format "HH:mm"
  voiceEnabled: boolean
  voiceRate: number // 0.1 to 2.0
  voicePitch: number // 0 to 2
  voiceVolume: number // 0 to 1
}

export class VoiceReminderService {
  private static instance: VoiceReminderService
  private intervalId: NodeJS.Timeout | null = null
  private settings: ReminderSettings = {
    enabled: true,
    reminderTime: "08:00",
    voiceEnabled: true,
    voiceRate: 1.0,
    voicePitch: 1.0,
    voiceVolume: 1.0
  }
  private lastReminderDate: string = ""
  private synth: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []

  private constructor() {
    this.loadSettings()
    this.initializeSpeechSynthesis()
  }

  static getInstance(): VoiceReminderService {
    if (!VoiceReminderService.instance) {
      VoiceReminderService.instance = new VoiceReminderService()
    }
    return VoiceReminderService.instance
  }

  private initializeSpeechSynthesis() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis
      this.voices = this.synth.getVoices()
      
      // Load voices when they become available
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth!.getVoices()
      }
    }
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

  updateSettings(newSettings: Partial<ReminderSettings>) {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
    
    // Restart the scheduler if needed
    if (this.settings.enabled) {
      this.startScheduler()
    } else {
      this.stopScheduler()
    }
  }

  getSettings(): ReminderSettings {
    return { ...this.settings }
  }

  startScheduler() {
    if (!this.settings.enabled) return

    this.stopScheduler() // Clear any existing interval
    
    // Check every minute
    this.intervalId = setInterval(() => {
      this.checkAndTriggerReminder()
    }, 60000) // Check every minute

    // Check immediately on start
    this.checkAndTriggerReminder()
  }

  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private checkAndTriggerReminder() {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:mm format
    const currentDate = now.toDateString()

    // Check if it's the right time and we haven't triggered today
    if (currentTime === this.settings.reminderTime && currentDate !== this.lastReminderDate) {
      this.lastReminderDate = currentDate
      this.triggerDailyReminder()
    }
  }

  private async triggerDailyReminder() {
    try {
      // Get today's data (mock data for now, would fetch from database in production)
      const todayData = await this.getTodayData()
      
      if (this.settings.voiceEnabled && this.synth) {
        await this.speakDailySummary(todayData)
      }
      
      // Show notification
      this.showNotification(todayData)
    } catch (error) {
      console.error('Error triggering daily reminder:', error)
    }
  }

  private async getTodayData(): Promise<{
    tasks: Task[]
    appointments: Appointment[]
    overdueTasks: Task[]
  }> {
    try {
      // Try to fetch data from localStorage (simulating database)
      const savedTasks = localStorage.getItem('memoVoxTasks')
      const savedAppointments = localStorage.getItem('memoVoxAppointments')
      
      let tasks: Task[] = []
      let appointments: Appointment[] = []
      
      if (savedTasks) {
        tasks = JSON.parse(savedTasks).map((task: any) => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          createdAt: new Date(task.createdAt)
        }))
      }
      
      if (savedAppointments) {
        appointments = JSON.parse(savedAppointments).map((apt: any) => ({
          ...apt,
          date: new Date(apt.date),
          createdAt: new Date(apt.createdAt)
        }))
      }
      
      // Filter for today's data
      const today = new Date()
      const startToday = new Date(today.setHours(0, 0, 0, 0))
      const endToday = new Date(today.setHours(23, 59, 59, 999))
      
      const todayTasks = tasks.filter(task => 
        task.dueDate && task.dueDate >= startToday && task.dueDate <= endToday
      )
      
      const todayAppointments = appointments.filter(apt => 
        apt.date >= startToday && apt.date <= endToday
      )
      
      const overdueTasks = tasks.filter(task => 
        !task.completed && task.dueDate && task.dueDate < startToday
      )
      
      return {
        tasks: todayTasks,
        appointments: todayAppointments,
        overdueTasks
      }
    } catch (error) {
      console.error('Error fetching today data:', error)
      
      // Fallback to mock data
      const today = new Date()
      const startToday = new Date(today.setHours(0, 0, 0, 0))
      const endToday = new Date(today.setHours(23, 59, 59, 999))

      const mockTasks: Task[] = [
        {
          id: "1",
          title: "Préparer la réunion d'équipe",
          description: "Préparer l'agenda et les documents",
          completed: false,
          priority: "HIGH",
          dueDate: new Date(),
          createdAt: new Date()
        },
        {
          id: "2",
          title: "Répondre aux emails",
          description: "Traiter les emails en attente",
          completed: true,
          priority: "MEDIUM",
          dueDate: new Date(),
          createdAt: new Date()
        },
        {
          id: "3",
          title: "Appeler le fournisseur",
          description: "Discuter des nouvelles conditions",
          completed: false,
          priority: "MEDIUM",
          dueDate: new Date(),
          createdAt: new Date()
        }
      ]

      const mockAppointments: Appointment[] = [
        {
          id: "1",
          title: "Réunion d'équipe",
          description: "Point hebdomadaire",
          location: "Salle de conférence A",
          date: new Date(new Date().setHours(10, 0, 0, 0)),
          duration: 60,
          createdAt: new Date()
        },
        {
          id: "2",
          title: "Déjeuner client",
          description: "Restaurant Le Bernardin",
          location: "12 Rue de la Paix",
          date: new Date(new Date().setHours(12, 30, 0, 0)),
          duration: 90,
          createdAt: new Date()
        }
      ]

      const overdueTasks = mockTasks.filter(task => 
        !task.completed && task.dueDate && task.dueDate < new Date()
      )

      return {
        tasks: mockTasks,
        appointments: mockAppointments,
        overdueTasks
      }
    }
  }

  private async speakDailySummary(data: {
    tasks: Task[]
    appointments: Appointment[]
    overdueTasks: Task[]
  }) {
    if (!this.synth) return

    // Stop any ongoing speech
    this.synth.cancel()

    const { tasks, appointments, overdueTasks } = data

    // Build the speech text
    let speechText = "Bonjour ! Voici votre résumé quotidien. "
    
    // Tasks summary
    const completedTasks = tasks.filter(t => t.completed).length
    const totalTasks = tasks.length
    
    if (totalTasks > 0) {
      speechText += `Vous avez ${totalTasks} tâches prévues aujourd'hui. `
      speechText += `${completedTasks} ont été terminées. `
      
      if (completedTasks < totalTasks) {
        speechText += `Il vous reste ${totalTasks - completedTasks} tâches à accomplir. `
      }
    } else {
      speechText += "Vous n'avez aucune tâche prévue aujourd'hui. "
    }

    // Overdue tasks
    if (overdueTasks.length > 0) {
      speechText += `Attention, vous avez ${overdueTasks.length} tâches en retard. `
    }

    // Appointments summary
    if (appointments.length > 0) {
      speechText += `Vous avez ${appointments.length} rendez-vous aujourd'hui. `
      
      appointments.forEach((appointment, index) => {
        const time = appointment.date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        speechText += `À ${time}, ${appointment.title}. `
        
        if (appointment.location) {
          speechText += `Lieu : ${appointment.location}. `
        }
      })
    } else {
      speechText += "Vous n'avez aucun rendez-vous prévu aujourd'hui. "
    }

    // Closing message
    speechText += "Passez une excellente journée !"

    // Create and configure utterance
    const utterance = new SpeechSynthesisUtterance(speechText)
    
    // Try to find a French voice
    const frenchVoice = this.voices.find(voice => 
      voice.lang.startsWith('fr') || voice.name.includes('French')
    )
    
    if (frenchVoice) {
      utterance.voice = frenchVoice
    }

    utterance.rate = this.settings.voiceRate
    utterance.pitch = this.settings.voicePitch
    utterance.volume = this.settings.voiceVolume
    utterance.lang = 'fr-FR'

    // Speak
    return new Promise<void>((resolve, reject) => {
      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(event.error)
      
      try {
        this.synth!.speak(utterance)
      } catch (error) {
        reject(error)
      }
    })
  }

  private showNotification(data: {
    tasks: Task[]
    appointments: Appointment[]
    overdueTasks: Task[]
  }) {
    const { tasks, appointments, overdueTasks } = data
    const completedTasks = tasks.filter(t => t.completed).length

    let title = "Résumé quotidien"
    let message = `${completedTasks}/${tasks.length} tâches terminées, ${appointments.length} rendez-vous`
    
    if (overdueTasks.length > 0) {
      message += `, ${overdueTasks.length} tâches en retard`
    }

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "daily-reminder"
      })
    }

    // Custom event for app notification
    window.dispatchEvent(new CustomEvent('dailyReminder', {
      detail: { title, message, data }
    }))
  }

  // Test the voice reminder
  async testReminder() {
    try {
      const testData = await this.getTodayData()
      if (this.settings.voiceEnabled && this.synth) {
        await this.speakDailySummary(testData)
      }
      this.showNotification(testData)
    } catch (error) {
      console.error('Error testing reminder:', error)
      throw error
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }

    return false
  }

  // Get available voices
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith('fr'))
  }

  // Cleanup
  destroy() {
    this.stopScheduler()
    if (this.synth) {
      this.synth.cancel()
    }
  }
}