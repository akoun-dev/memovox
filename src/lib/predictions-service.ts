import ZAI from 'z-ai-web-dev-sdk'

export interface TaskPrediction {
  taskId: string
  predictedDuration: number
  confidence: number
  factors: string[]
  similarTasks: Array<{
    id: string
    title: string
    actualDuration: number
    similarity: number
  }>
}

export interface ProductivityPrediction {
  date: string
  predictedCompletionRate: number
  predictedTasksCompleted: number
  confidence: number
  factors: {
    dayOfWeek: string
    historicalAverage: number
    currentWorkload: number
    externalFactors: string[]
  }
}

export interface TimeSlotPrediction {
  startTime: string
  endTime: string
  suitability: number
  confidence: number
  factors: {
    energyLevel: number
    contextSwitching: number
    priorityAlignment: number
  }
  recommendedTasks: string[]
}

export class PredictionsService {
  private static instance: PredictionsService
  private zai: any = null
  private historicalData: Map<string, any[]> = new Map()

  static getInstance(): PredictionsService {
    if (!PredictionsService.instance) {
      PredictionsService.instance = new PredictionsService()
    }
    return PredictionsService.instance
  }

  private constructor() {
    this.initializeAI()
  }

  private async initializeAI() {
    try {
      this.zai = await ZAI.create()
    } catch (error) {
      console.error('Failed to initialize AI for predictions:', error)
    }
  }

  // Prédire la durée d'une tâche
  async predictTaskDuration(task: {
    title: string
    description?: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    category?: string
    userId: string
  }, historicalTasks: any[]): Promise<TaskPrediction> {
    if (!this.zai) {
      // Fallback to simple prediction
      return this.simpleDurationPrediction(task, historicalTasks)
    }

    try {
      // Analyser les tâches similaires
      const similarTasks = this.findSimilarTasks(task, historicalTasks)
      
      // Préparer le contexte pour l'IA
      const context = {
        task,
        similarTasks: similarTasks.slice(0, 5),
        userPatterns: this.analyzeUserPatterns(historicalTasks)
      }

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en estimation de temps pour les tâches. Analyse la tâche suivante et prédis sa durée en minutes.

Considère:
- Les tâches similaires et leur durée réelle
- Les patterns de l'utilisateur
- La complexité apparente de la tâche
- La priorité (les tâches haute priorité prennent souvent plus de temps)

Retourne ta réponse au format JSON:
{
  "predictedDuration": nombre,
  "confidence": nombre entre 0 et 1,
  "factors": ["facteur1", "facteur2", ...],
  "reasoning": "explication de la prédiction"
}`
          },
          {
            role: 'user',
            content: JSON.stringify(context)
          }
        ],
        temperature: 0.3
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        const prediction = JSON.parse(response)
        
        return {
          taskId: task.title, // Utiliser le titre comme ID temporaire
          predictedDuration: prediction.predictedDuration,
          confidence: prediction.confidence,
          factors: prediction.factors,
          similarTasks: similarTasks.slice(0, 3).map(t => ({
            id: t.id,
            title: t.title,
            actualDuration: t.actualDuration || t.estimatedDuration || 60,
            similarity: t.similarity || 0.8
          }))
        }
      }
    } catch (error) {
      console.error('Error predicting task duration:', error)
    }

    return this.simpleDurationPrediction(task, historicalTasks)
  }

  // Prédire la productivité pour une période future
  async predictProductivity(
    userId: string,
    startDate: Date,
    endDate: Date,
    historicalData: any[]
  ): Promise<ProductivityPrediction[]> {
    const predictions: ProductivityPrediction[] = []
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      const dayOfWeek = currentDate.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      
      // Analyser les patterns historiques pour ce jour de la semaine
      const historicalForDay = historicalData.filter(data => {
        const dataDate = new Date(data.date)
        return dataDate.getDay() === dayOfWeek
      })

      const avgCompletionRate = historicalForDay.length > 0
        ? historicalForDay.reduce((sum, data) => sum + data.completionRate, 0) / historicalForDay.length
        : 0.7

      const avgTasksCompleted = historicalForDay.length > 0
        ? historicalForDay.reduce((sum, data) => sum + data.tasksCompleted, 0) / historicalForDay.length
        : 5

      // Facteurs externes
      const externalFactors: string[] = []
      if (isWeekend) externalFactors.push('weekend')
      if (this.isHoliday(currentDate)) externalFactors.push('jour férié')
      
      const season = this.getSeason(currentDate)
      if (season === 'été') externalFactors.push('période estivale')
      if (season === 'hiver') externalFactors.push('période hivernale')

      predictions.push({
        date: currentDate.toISOString().split('T')[0],
        predictedCompletionRate: avgCompletionRate,
        predictedTasksCompleted: avgTasksCompleted,
        confidence: Math.min(0.9, 0.5 + (historicalForDay.length * 0.1)),
        factors: {
          dayOfWeek: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][dayOfWeek],
          historicalAverage: avgCompletionRate,
          currentWorkload: this.calculateCurrentWorkload(userId, currentDate),
          externalFactors
        }
      })
    }

    return predictions
  }

  // Prédire les meilleurs créneaux horaires
  async predictOptimalTimeSlots(
    userId: string,
    tasks: any[],
    appointments: any[],
    date: Date
  ): Promise<TimeSlotPrediction[]> {
    const slots: TimeSlotPrediction[] = []
    const workingHours = { start: 9, end: 18 } // 9h à 18h
    
    // Générer des créneaux d'une heure
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`
      
      // Calculer la pertinence du créneau
      const suitability = this.calculateSlotSuitability(hour, tasks, appointments, date)
      
      slots.push({
        startTime,
        endTime,
        suitability: suitability.score,
        confidence: suitability.confidence,
        factors: {
          energyLevel: this.calculateEnergyLevel(hour),
          contextSwitching: this.calculateContextSwitchingCost(hour, appointments),
          priorityAlignment: suitability.priorityAlignment
        },
        recommendedTasks: suitability.recommendedTasks
      })
    }

    return slots.sort((a, b) => b.suitability - a.suitability)
  }

  // Méthodes utilitaires

  private simpleDurationPrediction(task: any, historicalTasks: any[]): TaskPrediction {
    const similarTasks = this.findSimilarTasks(task, historicalTasks)
    
    if (similarTasks.length > 0) {
      const avgDuration = similarTasks.reduce((sum, t) => 
        sum + (t.actualDuration || t.estimatedDuration || 60), 0) / similarTasks.length
      
      return {
        taskId: task.title,
        predictedDuration: Math.round(avgDuration),
        confidence: Math.min(0.8, 0.3 + (similarTasks.length * 0.1)),
        factors: ['Basé sur des tâches similaires'],
        similarTasks: similarTasks.slice(0, 3).map(t => ({
          id: t.id,
          title: t.title,
          actualDuration: t.actualDuration || t.estimatedDuration || 60,
          similarity: t.similarity || 0.8
        }))
      }
    }

    // Prédiction par défaut basée sur la priorité
    const defaultDurations = {
      'HIGH': 120,
      'MEDIUM': 60,
      'LOW': 30
    }

    return {
      taskId: task.title,
      predictedDuration: defaultDurations[task.priority] || 60,
      confidence: 0.3,
      factors: ['Estimation par défaut basée sur la priorité'],
      similarTasks: []
    }
  }

  private findSimilarTasks(task: any, historicalTasks: any[]): any[] {
    return historicalTasks
      .map(ht => ({
        ...ht,
        similarity: this.calculateSimilarity(task, ht)
      }))
      .filter(ht => ht.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
  }

  private calculateSimilarity(task1: any, task2: any): number {
    let score = 0
    
    // Similarité de titre
    const title1 = task1.title.toLowerCase()
    const title2 = task2.title.toLowerCase()
    const words1 = title1.split(' ')
    const words2 = title2.split(' ')
    
    const commonWords = words1.filter(word => words2.includes(word))
    score += (commonWords.length / Math.max(words1.length, words2.length)) * 0.4
    
    // Même priorité
    if (task1.priority === task2.priority) score += 0.3
    
    // Même catégorie
    if (task1.category === task2.category) score += 0.3
    
    return Math.min(1, score)
  }

  private analyzeUserPatterns(historicalTasks: any[]): any {
    if (historicalTasks.length === 0) return {}
    
    const patterns = {
      averageDuration: historicalTasks.reduce((sum, t) => 
        sum + (t.actualDuration || t.estimatedDuration || 60), 0) / historicalTasks.length,
      priorityDistribution: {
        HIGH: historicalTasks.filter(t => t.priority === 'HIGH').length / historicalTasks.length,
        MEDIUM: historicalTasks.filter(t => t.priority === 'MEDIUM').length / historicalTasks.length,
        LOW: historicalTasks.filter(t => t.priority === 'LOW').length / historicalTasks.length
      },
      completionRate: historicalTasks.filter(t => t.completed).length / historicalTasks.length
    }
    
    return patterns
  }

  private isHoliday(date: Date): boolean {
    // Simplifié - dans une vraie implémentation, on utiliserait une bibliothèque de jours fériés
    const holidays = [
      '01-01', '01-05', '05-08', '07-14', '08-15', '11-01', '11-11', '12-25'
    ]
    const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    return holidays.includes(dateStr)
  }

  private getSeason(date: Date): string {
    const month = date.getMonth()
    if (month >= 2 && month <= 4) return 'printemps'
    if (month >= 5 && month <= 7) return 'été'
    if (month >= 8 && month <= 10) return 'automne'
    return 'hiver'
  }

  private calculateCurrentWorkload(userId: string, date: Date): number {
    // Simplifié - dans une vraie implémentation, on calculerait la charge de travail réelle
    return Math.random() * 0.5 + 0.3 // 30-80%
  }

  private calculateSlotSuitability(hour: number, tasks: any[], appointments: any[], date: Date): any {
    let score = 0.5
    let priorityAlignment = 0.5
    const recommendedTasks: string[] = []
    
    // Niveau d'énergie naturel
    const energyLevel = this.calculateEnergyLevel(hour)
    score += (energyLevel - 0.5) * 0.3
    
    // Vérifier les conflits avec les rendez-vous
    const hasConflict = appointments.some(apt => {
      const aptHour = new Date(apt.date).getHours()
      return aptHour === hour
    })
    
    if (hasConflict) score -= 0.4
    
    // Adapter aux tâches de haute priorité
    const highPriorityTasks = tasks.filter(t => t.priority === 'HIGH')
    if (highPriorityTasks.length > 0 && (hour >= 9 && hour <= 11)) {
      score += 0.2
      priorityAlignment = 0.8
      recommendedTasks.push(...highPriorityTasks.slice(0, 2).map(t => t.title))
    }
    
    // Tâches créatives en début d'après-midi
    const creativeTasks = tasks.filter(t => t.title.toLowerCase().includes('créatif') || t.title.toLowerCase().includes('design'))
    if (creativeTasks.length > 0 && (hour >= 14 && hour <= 16)) {
      score += 0.15
      recommendedTasks.push(...creativeTasks.slice(0, 1).map(t => t.title))
    }
    
    return {
      score: Math.max(0, Math.min(1, score)),
      confidence: 0.7,
      priorityAlignment,
      recommendedTasks
    }
  }

  private calculateEnergyLevel(hour: number): number {
    // Courbe d'énergie typique
    if (hour >= 9 && hour <= 11) return 0.9 // Matin - haute énergie
    if (hour >= 14 && hour <= 16) return 0.7 // Après-midi - énergie moyenne
    if (hour >= 16 && hour <= 18) return 0.5 // Fin de journée - énergie basse
    return 0.6
  }

  private calculateContextSwitchingCost(hour: number, appointments: any[]): number {
    // Coût de changement de contexte basé sur le nombre de rendez-vous
    const appointmentsAtHour = appointments.filter(apt => {
      const aptHour = new Date(apt.date).getHours()
      return Math.abs(aptHour - hour) <= 1
    })
    
    return Math.min(1, appointmentsAtHour.length * 0.3)
  }

  // Entraîner le modèle avec de nouvelles données
  async trainWithNewData(taskData: any): Promise<void> {
    const key = `user_${taskData.userId}`
    if (!this.historicalData.has(key)) {
      this.historicalData.set(key, [])
    }
    
    this.historicalData.get(key)!.push({
      ...taskData,
      timestamp: new Date().toISOString()
    })
    
    // Garder seulement les 1000 dernières entrées
    const data = this.historicalData.get(key)!
    if (data.length > 1000) {
      this.historicalData.set(key, data.slice(-1000))
    }
  }

  // Obtenir les statistiques de précision des prédictions
  getPredictionStats(userId: string): {
    totalPredictions: number
    averageAccuracy: number
    confidenceDistribution: { high: number; medium: number; low: number }
  } {
    const key = `user_${userId}`
    const data = this.historicalData.get(key) || []
    
    // Calculer la précision moyenne (simplifié)
    const predictionsWithActual = data.filter(d => d.predictedDuration && d.actualDuration)
    const accuracySum = predictionsWithActual.reduce((sum, d) => {
      const error = Math.abs(d.predictedDuration - d.actualDuration)
      const accuracy = Math.max(0, 1 - (error / d.actualDuration))
      return sum + accuracy
    }, 0)
    
    const averageAccuracy = predictionsWithActual.length > 0 
      ? accuracySum / predictionsWithActual.length 
      : 0
    
    return {
      totalPredictions: data.length,
      averageAccuracy,
      confidenceDistribution: {
        high: data.filter(d => (d.confidence || 0) > 0.7).length,
        medium: data.filter(d => (d.confidence || 0) > 0.4 && (d.confidence || 0) <= 0.7).length,
        low: data.filter(d => (d.confidence || 0) <= 0.4).length
      }
    }
  }
}