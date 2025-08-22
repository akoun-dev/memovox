export interface VoiceCommandService {
  processCommand(command: string, context: any): Promise<VoiceCommandResult>
  getAvailableCommands(): VoiceCommand[]
}

export interface VoiceCommandResult {
  success: boolean
  action?: string
  data?: any
  message?: string
}

export interface VoiceCommand {
  command: string
  description: string
  action: string
  parameters?: string[]
}

export class VoiceCommandManager implements VoiceCommandService {
  private commands: VoiceCommand[] = [
    {
      command: "qu'ai-je à faire aujourd'hui",
      description: "Afficher les tâches du jour",
      action: "showTodayTasks"
    },
    {
      command: "résume-moi ma journée",
      description: "Résumer les activités de la journée",
      action: "summarizeDay"
    },
    {
      command: "rappelle-moi",
      description: "Créer un rappel",
      action: "createReminder",
      parameters: ["task", "time"]
    },
    {
      command: "ajoute une tâche",
      description: "Ajouter une nouvelle tâche",
      action: "createTask",
      parameters: ["title", "priority?", "dueDate?"]
    },
    {
      command: "quelles sont mes tâches en retard",
      description: "Afficher les tâches en retard",
      action: "showOverdueTasks"
    },
    {
      command: "annule le rappel",
      description: "Annuler un rappel",
      action: "cancelReminder",
      parameters: ["task"]
    },
    {
      command: "définis un rappel",
      description: "Définir un rappel pour une tâche",
      action: "setReminder",
      parameters: ["task", "time"]
    }
  ]

  async processCommand(command: string, context: any): Promise<VoiceCommandResult> {
    const normalizedCommand = command.toLowerCase().trim()
    
    // Try to match the command
    const matchedCommand = this.commands.find(cmd => 
      normalizedCommand.includes(cmd.command) || 
      cmd.command.includes(normalizedCommand)
    )
    
    if (!matchedCommand) {
      return {
        success: false,
        message: "Désolé, je n'ai pas compris cette commande. Essayez 'qu'ai-je à faire aujourd'hui ?' ou 'résume-moi ma journée'."
      }
    }
    
    try {
      switch (matchedCommand.action) {
        case "showTodayTasks":
          return this.handleShowTodayTasks(context)
        case "summarizeDay":
          return this.handleSummarizeDay(context)
        case "createReminder":
          return this.handleCreateReminder(normalizedCommand, context)
        case "createTask":
          return this.handleCreateTask(normalizedCommand, context)
        case "showOverdueTasks":
          return this.handleShowOverdueTasks(context)
        case "cancelReminder":
          return this.handleCancelReminder(normalizedCommand, context)
        case "setReminder":
          return this.handleSetReminder(normalizedCommand, context)
        default:
          return {
            success: false,
            message: "Cette commande n'est pas encore implémentée."
          }
      }
    } catch (error) {
      return {
        success: false,
        message: "Une erreur est survenue lors du traitement de la commande."
      }
    }
  }
  
  private handleShowTodayTasks(context: any): VoiceCommandResult {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayTasks = context.tasks?.filter((task: any) => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return dueDate >= today && dueDate < tomorrow && !task.completed
    }) || []
    
    const todayAppointments = context.appointments?.filter((apt: any) => {
      const aptDate = new Date(apt.date)
      return aptDate >= today && aptDate < tomorrow
    }) || []
    
    return {
      success: true,
      action: "showTodayTasks",
      data: {
        tasks: todayTasks,
        appointments: todayAppointments
      },
      message: `Vous avez ${todayTasks.length} tâche(s) et ${todayAppointments.length} rendez-vous aujourd'hui.`
    }
  }
  
  private handleSummarizeDay(context: any): VoiceCommandResult {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayTasks = context.tasks?.filter((task: any) => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return dueDate >= today && dueDate < tomorrow
    }) || []
    
    const completedTasks = todayTasks.filter((task: any) => task.completed)
    const pendingTasks = todayTasks.filter((task: any) => !task.completed)
    
    const overdueTasks = context.tasks?.filter((task: any) => {
      if (!task.dueDate || task.completed) return false
      return new Date(task.dueDate) < today
    }) || []
    
    const summary = {
      totalTasks: todayTasks.length,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      overdueTasks: overdueTasks.length,
      completionRate: todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0
    }
    
    return {
      success: true,
      action: "summarizeDay",
      data: summary,
      message: `Aujourd'hui, vous avez complété ${completedTasks.length} tâches sur ${todayTasks.length} (${summary.completionRate}%). ${overdueTasks.length} tâches sont en retard.`
    }
  }
  
  private handleCreateReminder(command: string, context: any): VoiceCommandResult {
    // Extract task and time from command
    const taskMatch = command.match(/rappelle-moi\s+(.+?)(?:\s+à\s+|\s+demain|\s+dans|$)/i)
    const timeMatch = command.match(/(?:à\s+|dans\s+)(.+)/i)
    
    if (!taskMatch) {
      return {
        success: false,
        message: "Je n'ai pas compris quelle tâche vous voulez que je vous rappelle."
      }
    }
    
    const taskTitle = taskMatch[1].trim()
    const timeInfo = timeMatch ? timeMatch[1].trim() : "demain"
    
    return {
      success: true,
      action: "createReminder",
      data: {
        title: taskTitle,
        time: timeInfo
      },
      message: `Je vais vous rappeler "${taskTitle}" ${timeInfo}.`
    }
  }
  
  private handleCreateTask(command: string, context: any): VoiceCommandResult {
    // Extract task details from command
    const taskMatch = command.match(/ajoute\s+(?:une\s+tâche\s+)?(.+)/i)
    
    if (!taskMatch) {
      return {
        success: false,
        message: "Je n'ai pas compris quelle tâche vous voulez ajouter."
      }
    }
    
    const taskTitle = taskMatch[1].trim()
    
    // Extract priority if mentioned
    let priority = "MEDIUM"
    if (taskTitle.toLowerCase().includes("urgent") || taskTitle.toLowerCase().includes("important")) {
      priority = "HIGH"
    } else if (taskTitle.toLowerCase().includes("optionnel") || taskTitle.toLowerCase().includes("si possible")) {
      priority = "LOW"
    }
    
    return {
      success: true,
      action: "createTask",
      data: {
        title: taskTitle,
        priority: priority
      },
      message: `J'ai ajouté la tâche "${taskTitle}" avec une priorité ${priority === "HIGH" ? "haute" : priority === "LOW" ? "basse" : "moyenne"}.`
    }
  }
  
  private handleShowOverdueTasks(context: any): VoiceCommandResult {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const overdueTasks = context.tasks?.filter((task: any) => {
      if (!task.dueDate || task.completed) return false
      return new Date(task.dueDate) < today
    }) || []
    
    return {
      success: true,
      action: "showOverdueTasks",
      data: { tasks: overdueTasks },
      message: `Vous avez ${overdueTasks.length} tâche(s) en retard.`
    }
  }
  
  private handleCancelReminder(command: string, context: any): VoiceCommandResult {
    const taskMatch = command.match(/annule\s+(?:le\s+)?rappel\s+(.+)/i)
    
    if (!taskMatch) {
      return {
        success: false,
        message: "Je n'ai pas compris quel rappel vous voulez annuler."
      }
    }
    
    const taskTitle = taskMatch[1].trim()
    
    return {
      success: true,
      action: "cancelReminder",
      data: { title: taskTitle },
      message: `J'ai annulé le rappel pour "${taskTitle}".`
    }
  }
  
  private handleSetReminder(command: string, context: any): VoiceCommandResult {
    const taskMatch = command.match(/définis\s+(?:un\s+)?rappel\s+(.+?)(?:\s+à\s+|\s+pour|$)/i)
    const timeMatch = command.match(/(?:à\s+|pour\s+)(.+)/i)
    
    if (!taskMatch || !timeMatch) {
      return {
        success: false,
        message: "Je n'ai pas compris pour quelle tâche et à quelle heure définir le rappel."
      }
    }
    
    const taskTitle = taskMatch[1].trim()
    const timeInfo = timeMatch[1].trim()
    
    return {
      success: true,
      action: "setReminder",
      data: {
        title: taskTitle,
        time: timeInfo
      },
      message: `J'ai défini un rappel pour "${taskTitle}" à ${timeInfo}.`
    }
  }
  
  getAvailableCommands(): VoiceCommand[] {
    return this.commands
  }
}

export const voiceCommandManager = new VoiceCommandManager()