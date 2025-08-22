import ZAI from 'z-ai-web-dev-sdk'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  data?: any
}

export interface AssistantContext {
  tasks: Array<{
    id: string
    title: string
    description?: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    completed: boolean
    dueDate?: string
    estimatedDuration?: number
  }>
  appointments: Array<{
    id: string
    title: string
    date: string
    duration: number
  }>
  userPreferences: {
    workingHours: { start: string; end: string }
    timezone: string
    language: string
  }
  currentDate: Date
}

export interface AssistantAction {
  type: 'create_task' | 'update_task' | 'create_appointment' | 'suggest_schedule' | 'analyze_productivity' | 'set_reminder'
  data: any
  confidence: number
}

export class AIAssistant {
  private static instance: AIAssistant
  private zai: any = null
  private conversationHistory: ChatMessage[] = []
  private context: AssistantContext

  static getInstance(): AIAssistant {
    if (!AIAssistant.instance) {
      AIAssistant.instance = new AIAssistant()
    }
    return AIAssistant.instance
  }

  private constructor() {
    this.initializeAI()
  }

  private async initializeAI() {
    try {
      this.zai = await ZAI.create()
    } catch (error) {
      console.error('Failed to initialize AI:', error)
    }
  }

  // Définir le contexte de l'assistant
  setContext(context: AssistantContext): void {
    this.context = context
  }

  // Traiter un message utilisateur
  async processMessage(message: string): Promise<{ response: string; actions?: AssistantAction[] }> {
    if (!this.zai) {
      return {
        response: "Désolé, l'assistant IA n'est pas disponible actuellement. Veuillez réessayer plus tard."
      }
    }

    try {
      // Ajouter le message à l'historique
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date()
      }
      this.conversationHistory.push(userMessage)

      // Préparer le contexte pour l'IA
      const systemPrompt = this.buildSystemPrompt()
      
      // Construire l'historique de conversation
      const conversation = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ]

      // Appeler l'IA
      const completion = await this.zai.chat.completions.create({
        messages: conversation,
        temperature: 0.7,
        max_tokens: 1000
      })

      const response = completion.choices[0]?.message?.content || "Je n'ai pas compris votre demande."

      // Analyser la réponse pour détecter des actions
      const actions = await this.extractActions(response, message)

      // Ajouter la réponse à l'historique
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        data: { actions }
      }
      this.conversationHistory.push(assistantMessage)

      return { response, actions }
    } catch (error) {
      console.error('Error processing message:', error)
      return {
        response: "Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer."
      }
    }
  }

  // Construire le prompt système
  private buildSystemPrompt(): string {
    const { tasks, appointments, userPreferences, currentDate } = this.context

    const taskSummary = tasks.map(t => 
      `- ${t.title} (${t.priority})${t.completed ? ' ✓' : ''}${t.dueDate ? ` échéance: ${new Date(t.dueDate).toLocaleDateString()}` : ''}`
    ).join('\n')

    const appointmentSummary = appointments.map(a => 
      `- ${a.title} le ${new Date(a.date).toLocaleDateString()} (${a.duration}min)`
    ).join('\n')

    return `Tu es un assistant IA intelligent pour MemoVox, une application de gestion de tâches et de productivité.

Contexte actuel:
- Date: ${currentDate.toLocaleDateString('fr-FR')}
- Fuseau horaire: ${userPreferences.timezone}
- Heures de travail: ${userPreferences.workingHours.start} - ${userPreferences.workingHours.end}
- Langue: ${userPreferences.language}

Tâches actuelles (${tasks.length}):
${taskSummary || 'Aucune tâche'}

Rendez-vous actuels (${appointments.length}):
${appointmentSummary || 'Aucun rendez-vous'}

Tes capacités:
1. Aider à organiser et prioriser les tâches
2. Créer de nouvelles tâches ou rendez-vous
3. Suggérer des plages horaires pour les tâches
4. Analyser la productivité et donner des conseils
5. Définir des rappels intelligents
6. Répondre aux questions sur la gestion du temps

Réponds toujours en français de manière utile et précise. Lorsque tu suggères des actions, structure ta réponse de manière claire et propose des options concrètes.

Si l'utilisateur demande de créer une tâche ou un rendez-vous, fournis les détails nécessaires dans un format structuré.`
  }

  // Extraire les actions de la réponse
  private async extractActions(response: string, originalMessage: string): Promise<AssistantAction[]> {
    const actions: AssistantAction[] = []

    // Analyser le message pour détecter des intentions
    const lowerMessage = originalMessage.toLowerCase()

    // Création de tâche
    if (lowerMessage.includes('créer') || lowerMessage.includes('ajouter') || lowerMessage.includes('nouvelle tâche')) {
      const taskData = await this.parseTaskCreation(originalMessage)
      if (taskData) {
        actions.push({
          type: 'create_task',
          data: taskData,
          confidence: 0.8
        })
      }
    }

    // Création de rendez-vous
    if (lowerMessage.includes('rendez-vous') || lowerMessage.includes('meeting') || lowerMessage.includes('appointment')) {
      const appointmentData = await this.parseAppointmentCreation(originalMessage)
      if (appointmentData) {
        actions.push({
          type: 'create_appointment',
          data: appointmentData,
          confidence: 0.8
        })
      }
    }

    // Suggestion de planning
    if (lowerMessage.includes('quand') || lowerMessage.includes('planning') || lowerMessage.includes('schedule')) {
      actions.push({
        type: 'suggest_schedule',
        data: { query: originalMessage },
        confidence: 0.7
      })
    }

    // Analyse de productivité
    if (lowerMessage.includes('productivité') || lowerMessage.includes('analyse') || lowerMessage.includes('performance')) {
      actions.push({
        type: 'analyze_productivity',
        data: { timeframe: this.extractTimeframe(originalMessage) },
        confidence: 0.9
      })
    }

    // Définition de rappel
    if (lowerMessage.includes('rappel') || lowerMessage.includes('reminder') || lowerMessage.includes('notifie')) {
      actions.push({
        type: 'set_reminder',
        data: await this.parseReminderRequest(originalMessage),
        confidence: 0.8
      })
    }

    return actions
  }

  // Parser la création de tâche
  private async parseTaskCreation(message: string): Promise<any> {
    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Extrais les informations de création de tâche du message suivant et retourne-les au format JSON avec les champs: title, description, priority (LOW/MEDIUM/HIGH), dueDate (YYYY-MM-DD), estimatedDuration (minutes). Retourne null si les informations sont insuffisantes.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        return JSON.parse(response)
      }
    } catch (error) {
      console.error('Error parsing task creation:', error)
    }
    return null
  }

  // Parser la création de rendez-vous
  private async parseAppointmentCreation(message: string): Promise<any> {
    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Extrais les informations de création de rendez-vous du message suivant et retourne-les au format JSON avec les champs: title, description, location, date (YYYY-MM-DDTHH:mm), duration (minutes). Retourne null si les informations sont insuffisantes.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        return JSON.parse(response)
      }
    } catch (error) {
      console.error('Error parsing appointment creation:', error)
    }
    return null
  }

  // Extraire la timeframe
  private extractTimeframe(message: string): string {
    const lowerMessage = message.toLowerCase()
    if (lowerMessage.includes('aujourd\'hui')) return 'today'
    if (lowerMessage.includes('semaine')) return 'week'
    if (lowerMessage.includes('mois')) return 'month'
    if (lowerMessage.includes('année')) return 'year'
    return 'week'
  }

  // Parser la demande de rappel
  private async parseReminderRequest(message: string): Promise<any> {
    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'Extrais les informations de rappel du message suivant et retourne-les au format JSON avec les champs: title, message, reminderTime (YYYY-MM-DDTHH:mm), type (task/appointment/custom). Retourne null si les informations sont insuffisantes.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        return JSON.parse(response)
      }
    } catch (error) {
      console.error('Error parsing reminder request:', error)
    }
    return null
  }

  // Obtenir des suggestions intelligentes
  async getSmartSuggestions(): Promise<string[]> {
    if (!this.zai || !this.context) {
      return []
    }

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `En tant qu'assistant de productivité, analyse les tâches et rendez-vous actuels et propose 3-5 suggestions concrètes pour améliorer la productivité. Base tes suggestions sur:
            - La charge de travail actuelle
            - Les échéances imminentes
            - Les priorités
            - Les habitudes de travail
            
            Contexte:
            - Tâches: ${this.context.tasks.length} (${this.context.tasks.filter(t => !t.completed).length} en attente)
            - Rendez-vous: ${this.context.appointments.length}
            - Tâches haute priorité: ${this.context.tasks.filter(t => t.priority === 'HIGH').length}
            
            Retourne uniquement les suggestions, une par ligne.`
          }
        ],
        temperature: 0.7
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        return response.split('\n').filter(s => s.trim()).slice(0, 5)
      }
    } catch (error) {
      console.error('Error getting smart suggestions:', error)
    }
    return []
  }

  // Obtenir l'historique de conversation
  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory]
  }

  // Effacer l'historique de conversation
  clearConversation(): void {
    this.conversationHistory = []
  }

  // Obtenir des statistiques sur l'assistant
  getAssistantStats(): {
    totalMessages: number
    userMessages: number
    assistantMessages: number
    actionsSuggested: number
  } {
    const userMessages = this.conversationHistory.filter(msg => msg.role === 'user').length
    const assistantMessages = this.conversationHistory.filter(msg => msg.role === 'assistant').length
    const actionsSuggested = this.conversationHistory
      .filter(msg => msg.role === 'assistant' && msg.data?.actions)
      .reduce((sum, msg) => sum + (msg.data.actions?.length || 0), 0)

    return {
      totalMessages: this.conversationHistory.length,
      userMessages,
      assistantMessages,
      actionsSuggested
    }
  }
}