import ZAI from 'z-ai-web-dev-sdk'

export interface OptimizedTask {
  id: string
  title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  estimatedDuration: number
  recommendedTimeSlot: {
    start: string
    end: string
    confidence: number
  }
  optimalOrder: number
  grouping: string
  energyRequired: 'low' | 'medium' | 'high'
  contextSwitchingCost: number
}

export interface OptimizationResult {
  optimizedTasks: OptimizedTask[]
  totalEstimatedTime: number
  productivityGain: number
  recommendations: string[]
  warnings: string[]
  schedule: Array<{
    time: string
    tasks: string[]
    focusLevel: 'low' | 'medium' | 'high'
  }>
}

export interface ProductivityPattern {
  bestPerformanceHours: number[]
  preferredTaskTypes: { [key: string]: number }
  averageFocusDuration: number
  optimalBreakInterval: number
  contextSwitchingTolerance: number
}

export class TaskOptimizer {
  private static instance: TaskOptimizer
  private zai: any = null
  private userPatterns: Map<string, ProductivityPattern> = new Map()

  static getInstance(): TaskOptimizer {
    if (!TaskOptimizer.instance) {
      TaskOptimizer.instance = new TaskOptimizer()
    }
    return TaskOptimizer.instance
  }

  private constructor() {
    this.initializeAI()
  }

  private async initializeAI() {
    try {
      this.zai = await ZAI.create()
    } catch (error) {
      console.error('Failed to initialize AI for task optimization:', error)
    }
  }

  // Optimiser automatiquement les tâches
  async optimizeTasks(
    userId: string,
    tasks: any[],
    appointments: any[],
    date: Date,
    userPreferences?: any
  ): Promise<OptimizationResult> {
    // Analyser les patterns de l'utilisateur
    const userPattern = await this.analyzeUserPatterns(userId, tasks, appointments)
    this.userPatterns.set(userId, userPattern)

    // Calculer les créneaux disponibles
    const availableSlots = this.calculateAvailableSlots(appointments, date, userPreferences)

    // Optimiser les tâches
    const optimizedTasks = await this.optimizeTaskOrder(
      tasks,
      availableSlots,
      userPattern
    )

    // Générer le planning
    const schedule = this.generateSchedule(optimizedTasks, availableSlots)

    // Calculer les gains de productivité
    const productivityGain = this.calculateProductivityGain(tasks, optimizedTasks)

    // Générer des recommandations
    const recommendations = await this.generateRecommendations(
      optimizedTasks,
      userPattern,
      productivityGain
    )

    // Identifier les avertissements
    const warnings = this.identifyWarnings(optimizedTasks, availableSlots)

    return {
      optimizedTasks,
      totalEstimatedTime: optimizedTasks.reduce((sum, task) => sum + task.estimatedDuration, 0),
      productivityGain,
      recommendations,
      warnings,
      schedule
    }
  }

  // Analyser les patterns de productivité de l'utilisateur
  private async analyzeUserPatterns(
    userId: string,
    tasks: any[],
    appointments: any[]
  ): Promise<ProductivityPattern> {
    // Regrouper les tâches par heure de complétion
    const completionByHour: { [hour: number]: number } = {}
    const taskTypes: { [key: string]: number } = {}

    tasks.forEach(task => {
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours()
        completionByHour[hour] = (completionByHour[hour] || 0) + 1

        // Catégoriser les tâches
        const category = this.categorizeTask(task.title)
        taskTypes[category] = (taskTypes[category] || 0) + 1
      }
    })

    // Trouver les heures de meilleure performance
    const sortedHours = Object.entries(completionByHour)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))

    // Calculer la durée moyenne de concentration
    const focusSessions = this.calculateFocusSessions(tasks)
    const averageFocusDuration = focusSessions.length > 0
      ? focusSessions.reduce((sum, session) => sum + session.duration, 0) / focusSessions.length
      : 45 // 45 minutes par défaut

    return {
      bestPerformanceHours: sortedHours,
      preferredTaskTypes: taskTypes,
      averageFocusDuration,
      optimalBreakInterval: Math.max(15, Math.round(averageFocusDuration * 0.3)),
      contextSwitchingTolerance: this.calculateContextSwitchingTolerance(tasks)
    }
  }

  // Calculer les créneaux horaires disponibles
  private calculateAvailableSlots(
    appointments: any[],
    date: Date,
    userPreferences?: any
  ): Array<{ start: number; end: number; energyLevel: number }> {
    const workingHours = userPreferences?.workingHours || { start: 9, end: 18 }
    const slots: Array<{ start: number; end: number; energyLevel: number }> = []

    // Convertir les rendez-vous en plages occupées
    const busySlots = appointments.map(apt => {
      const aptDate = new Date(apt.date)
      const start = aptDate.getHours() + aptDate.getMinutes() / 60
      const duration = apt.duration / 60
      return { start, end: start + duration }
    })

    // Générer les créneaux disponibles
    for (let hour = workingHours.start; hour < workingHours.end; hour += 0.5) {
      const isBusy = busySlots.some(slot => 
        hour >= slot.start && hour < slot.end
      )

      if (!isBusy) {
        slots.push({
          start: hour,
          end: hour + 0.5,
          energyLevel: this.calculateEnergyLevel(hour)
        })
      }
    }

    return slots
  }

  // Optimiser l'ordre des tâches
  private async optimizeTaskOrder(
    tasks: any[],
    availableSlots: any[],
    userPattern: ProductivityPattern
  ): Promise<OptimizedTask[]> {
    const optimizedTasks: OptimizedTask[] = []
    const remainingSlots = [...availableSlots]
    const remainingTasks = [...tasks]

    // Trier les tâches par priorité et durée estimée
    remainingTasks.sort((a, b) => {
      const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 }
      const aPriority = priorityWeight[a.priority] || 1
      const bPriority = priorityWeight[b.priority] || 1
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      return (a.estimatedDuration || 60) - (b.estimatedDuration || 60)
    })

    // Assigner les tâches aux créneaux
    for (const task of remainingTasks) {
      const bestSlot = this.findBestSlot(task, remainingSlots, userPattern)
      
      if (bestSlot) {
        const optimizedTask: OptimizedTask = {
          id: task.id,
          title: task.title,
          priority: task.priority,
          estimatedDuration: task.estimatedDuration || 60,
          recommendedTimeSlot: {
            start: this.formatTime(bestSlot.start),
            end: this.formatTime(bestSlot.start + (task.estimatedDuration || 60) / 60),
            confidence: bestSlot.confidence
          },
          optimalOrder: optimizedTasks.length + 1,
          grouping: this.categorizeTask(task.title),
          energyRequired: this.calculateEnergyRequired(task),
          contextSwitchingCost: this.calculateTaskContextSwitching(task, optimizedTasks)
        }

        optimizedTasks.push(optimizedTask)

        // Réserver le créneau
        this.reserveSlot(remainingSlots, bestSlot.start, (task.estimatedDuration || 60) / 60)
      }
    }

    return optimizedTasks
  }

  // Trouver le meilleur créneau pour une tâche
  private findBestSlot(
    task: any,
    availableSlots: any[],
    userPattern: ProductivityPattern
  ): any {
    const taskDuration = (task.estimatedDuration || 60) / 60 // Convertir en heures
    const taskEnergy = this.calculateEnergyRequired(task)
    const taskCategory = this.categorizeTask(task.title)

    let bestSlot = null
    let bestScore = -1

    for (let i = 0; i < availableSlots.length - Math.ceil(taskDuration * 2); i++) {
      const slot = availableSlots[i]
      const canFit = this.canFitTask(slot.start, taskDuration, availableSlots)
      
      if (canFit) {
        let score = 0

        // Alignement avec les heures de performance
        const slotHour = Math.floor(slot.start)
        if (userPattern.bestPerformanceHours.includes(slotHour)) {
          score += 0.3
        }

        // Alignement avec le niveau d'énergie
        const energyMatch = this.calculateEnergyMatch(slot.energyLevel, taskEnergy)
        score += energyMatch * 0.3

        // Préférence pour le type de tâche
        if (userPattern.preferredTaskTypes[taskCategory]) {
          score += 0.2
        }

        // Minimiser le changement de contexte
        const contextCost = this.calculateContextSwitchingCostForSlot(slot.start, availableSlots)
        score -= contextCost * 0.2

        if (score > bestScore) {
          bestScore = score
          bestSlot = {
            start: slot.start,
            confidence: Math.min(0.95, 0.5 + score)
          }
        }
      }
    }

    return bestSlot
  }

  // Générer le planning
  private generateSchedule(
    optimizedTasks: OptimizedTask[],
    availableSlots: any[]
  ): Array<{
    time: string
    tasks: string[]
    focusLevel: 'low' | 'medium' | 'high'
  }> {
    const schedule: Array<{
      time: string
      tasks: string[]
      focusLevel: 'low' | 'medium' | 'high'
    }> = []

    // Regrouper les tâches par heure
    const tasksByHour: { [hour: string]: OptimizedTask[] } = {}

    optimizedTasks.forEach(task => {
      const hour = task.recommendedTimeSlot.start.split(':')[0]
      if (!tasksByHour[hour]) {
        tasksByHour[hour] = []
      }
      tasksByHour[hour].push(task)
    })

    // Créer les entrées du planning
    Object.keys(tasksByHour).sort().forEach(hour => {
      const tasks = tasksByHour[hour]
      const totalEnergy = tasks.reduce((sum, task) => {
        const energyWeight = { low: 1, medium: 2, high: 3 }
        return sum + energyWeight[task.energyRequired]
      }, 0)
      
      const avgEnergy = totalEnergy / tasks.length
      const focusLevel = avgEnergy > 2.5 ? 'high' : avgEnergy > 1.5 ? 'medium' : 'low'

      schedule.push({
        time: `${hour}:00`,
        tasks: tasks.map(t => t.title),
        focusLevel
      })
    })

    return schedule
  }

  // Calculer le gain de productivité
  private calculateProductivityGain(originalTasks: any[], optimizedTasks: OptimizedTask[]): number {
    // Facteurs de gain
    const priorityAlignmentGain = this.calculatePriorityAlignmentGain(originalTasks, optimizedTasks)
    const energyOptimizationGain = this.calculateEnergyOptimizationGain(optimizedTasks)
    const contextSwitchingGain = this.calculateContextSwitchingGain(optimizedTasks)

    // Gain total (pondéré)
    const totalGain = (
      priorityAlignmentGain * 0.4 +
      energyOptimizationGain * 0.3 +
      contextSwitchingGain * 0.3
    )

    return Math.min(0.5, Math.max(0, totalGain)) // Max 50% de gain
  }

  // Générer des recommandations
  private async generateRecommendations(
    optimizedTasks: OptimizedTask[],
    userPattern: ProductivityPattern,
    productivityGain: number
  ): Promise<string[]> {
    const recommendations: string[] = []

    // Recommandations basées sur les patterns
    if (userPattern.bestPerformanceHours.length > 0) {
      const bestHour = userPattern.bestPerformanceHours[0]
      recommendations.push(
        `Planifiez vos tâches les plus importantes autour de ${bestHour}h, votre heure de performance optimale.`
      )
    }

    // Recommandations basées sur la durée de concentration
    if (userPattern.averageFocusDuration < 30) {
      recommendations.push(
        'Essayez de travailler par sessions plus courtes de 25 minutes avec des pauses fréquentes.'
      )
    } else if (userPattern.averageFocusDuration > 90) {
      recommendations.push(
        'Pensez à faire des pauses régulières pour maintenir votre concentration sur le long terme.'
      )
    }

    // Recommandations basées sur le gain de productivité
    if (productivityGain > 0.3) {
      recommendations.push(
        'L\'optimisation proposée pourrait améliorer votre productivité de ' + 
        Math.round(productivityGain * 100) + '%. Suivez ce planning pour de meilleurs résultats.'
      )
    }

    // Recommandations basées sur le regroupement des tâches
    const taskGroups = this.groupTasksByCategory(optimizedTasks)
    Object.keys(taskGroups).forEach(category => {
      if (taskGroups[category].length > 2) {
        recommendations.push(
          `Regroupez les tâches de "${category}" pour minimiser les changements de contexte.`
        )
      }
    })

    return recommendations
  }

  // Identifier les avertissements
  private identifyWarnings(
    optimizedTasks: OptimizedTask[],
    availableSlots: any[]
  ): string[] {
    const warnings: string[] = []

    // Vérifier la charge de travail
    const totalEstimatedTime = optimizedTasks.reduce((sum, task) => sum + task.estimatedDuration, 0)
    const totalAvailableTime = availableSlots.reduce((sum, slot) => sum + (slot.end - slot.start) * 60, 0)

    if (totalEstimatedTime > totalAvailableTime * 0.8) {
      warnings.push(
        'Votre charge de travail est très élevée. Envisagez de déléguer ou de reporter certaines tâches.'
      )
    }

    // Vérifier les tâches non assignées
    if (optimizedTasks.length === 0) {
      warnings.push(
        'Aucun créneau disponible trouvé pour vos tâches. Vérifiez votre emploi du temps.'
      )
    }

    // Vérifier les tâches à haute énergie en fin de journée
    const highEnergyTasks = optimizedTasks.filter(task => 
      task.energyRequired === 'high' && 
      parseInt(task.recommendedTimeSlot.start.split(':')[0]) >= 16
    )

    if (highEnergyTasks.length > 0) {
      warnings.push(
        'Certaines tâches exigeantes sont planifiées en fin de journée quand votre énergie est plus faible.'
      )
    }

    return warnings
  }

  // Méthodes utilitaires

  private categorizeTask(title: string): string {
    const lowerTitle = title.toLowerCase()
    
    if (lowerTitle.includes('réunion') || lowerTitle.includes('meeting')) return 'réunion'
    if (lowerTitle.includes('email') || lowerTitle.includes('mail')) return 'communication'
    if (lowerTitle.includes('créatif') || lowerTitle.includes('design')) return 'créatif'
    if (lowerTitle.includes('analyse') || lowerTitle.includes('rapport')) return 'analytique'
    if (lowerTitle.includes('appel') || lowerTitle.includes('phone')) return 'communication'
    if (lowerTitle.includes('admin') || lowerTitle.includes('papier')) return 'administratif'
    
    return 'autre'
  }

  private calculateEnergyLevel(hour: number): number {
    if (hour >= 9 && hour <= 11) return 0.9
    if (hour >= 14 && hour <= 16) return 0.7
    if (hour >= 16 && hour <= 18) return 0.5
    return 0.6
  }

  private calculateEnergyRequired(task: any): 'low' | 'medium' | 'high' {
    const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 }
    const durationScore = Math.min(3, (task.estimatedDuration || 60) / 30)
    const priorityScore = priorityWeight[task.priority] || 1
    
    const totalScore = (priorityScore + durationScore) / 2
    
    if (totalScore >= 2.5) return 'high'
    if (totalScore >= 1.5) return 'medium'
    return 'low'
  }

  private calculateEnergyMatch(slotEnergy: number, taskEnergy: string): number {
    const taskEnergyValue = taskEnergy === 'high' ? 0.9 : taskEnergy === 'medium' ? 0.6 : 0.3
    return 1 - Math.abs(slotEnergy - taskEnergyValue)
  }

  private calculateFocusSessions(tasks: any[]): Array<{ start: Date; end: Date; duration: number }> {
    // Simplifié - dans une vraie implémentation, on analyserait les patterns de complétion
    return []
  }

  private calculateContextSwitchingTolerance(tasks: any[]): number {
    // Basé sur la diversité des types de tâches
    const categories = new Set(tasks.map(t => this.categorizeTask(t.title)))
    return Math.max(0.1, 1 - (categories.size / 10))
  }

  private calculateTaskContextSwitching(task: any, existingTasks: OptimizedTask[]): number {
    const taskCategory = this.categorizeTask(task.title)
    const similarTasks = existingTasks.filter(t => 
      this.categorizeTask(t.title) === taskCategory
    )
    
    // Moins de changement de contexte si les tâches similaires sont regroupées
    return similarTasks.length > 0 ? 0.1 : 0.5
  }

  private calculateContextSwitchingCostForSlot(startHour: number, availableSlots: any[]): number {
    // Coût basé sur la fragmentation des créneaux
    const slotIndex = availableSlots.findIndex(slot => slot.start === startHour)
    if (slotIndex === 0 || slotIndex === availableSlots.length - 1) return 0.1
    
    const prevSlot = availableSlots[slotIndex - 1]
    const nextSlot = availableSlots[slotIndex + 1]
    
    const gapBefore = startHour - prevSlot.end
    const gapAfter = nextSlot.start - (startHour + 0.5)
    
    return Math.max(0.1, (gapBefore + gapAfter) / 4)
  }

  private canFitTask(startHour: number, duration: number, availableSlots: any[]): boolean {
    const requiredSlots = Math.ceil(duration * 2) // Slots de 30 minutes
    
    for (let i = 0; i < requiredSlots; i++) {
      const slotTime = startHour + (i * 0.5)
      const slotExists = availableSlots.some(slot => 
        Math.abs(slot.start - slotTime) < 0.1
      )
      
      if (!slotExists) return false
    }
    
    return true
  }

  private reserveSlot(availableSlots: any[], startHour: number, duration: number): void {
    const requiredSlots = Math.ceil(duration * 2)
    
    for (let i = 0; i < requiredSlots; i++) {
      const slotTime = startHour + (i * 0.5)
      const index = availableSlots.findIndex(slot => 
        Math.abs(slot.start - slotTime) < 0.1
      )
      
      if (index !== -1) {
        availableSlots.splice(index, 1)
      }
    }
  }

  private formatTime(hour: number): string {
    const h = Math.floor(hour)
    const m = Math.round((hour - h) * 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  private calculatePriorityAlignmentGain(originalTasks: any[], optimizedTasks: OptimizedTask[]): number {
    // Calculer combien de tâches haute priorité sont placées aux meilleurs créneaux
    const highPriorityTasks = optimizedTasks.filter(t => t.priority === 'HIGH')
    const morningSlots = highPriorityTasks.filter(t => 
      parseInt(t.recommendedTimeSlot.start.split(':')[0]) <= 12
    )
    
    return highPriorityTasks.length > 0 ? morningSlots.length / highPriorityTasks.length : 0
  }

  private calculateEnergyOptimizationGain(optimizedTasks: OptimizedTask[]): number {
    // Calculer l'alignement entre l'énergie requise et les créneaux
    let totalAlignment = 0
    let count = 0
    
    optimizedTasks.forEach(task => {
      const hour = parseInt(task.recommendedTimeSlot.start.split(':')[0])
      const slotEnergy = this.calculateEnergyLevel(hour)
      const taskEnergyValue = task.energyRequired === 'high' ? 0.9 : 
                           task.energyRequired === 'medium' ? 0.6 : 0.3
      
      totalAlignment += 1 - Math.abs(slotEnergy - taskEnergyValue)
      count++
    })
    
    return count > 0 ? totalAlignment / count : 0
  }

  private calculateContextSwitchingGain(optimizedTasks: OptimizedTask[]): number {
    // Calculer le regroupement des tâches similaires
    const categories = new Map<string, number>()
    
    optimizedTasks.forEach((task, index) => {
      const category = this.grouping
      if (!categories.has(category)) {
        categories.set(category, 0)
      }
      categories.set(category, categories.get(category)! + 1)
    })
    
    // Plus le regroupement est élevé, moins il y a de changement de contexte
    const maxGroupSize = Math.max(...categories.values())
    return Math.min(1, maxGroupSize / optimizedTasks.length)
  }

  private groupTasksByCategory(optimizedTasks: OptimizedTask[]): { [key: string]: OptimizedTask[] } {
    const groups: { [key: string]: OptimizedTask[] } = {}
    
    optimizedTasks.forEach(task => {
      if (!groups[task.grouping]) {
        groups[task.grouping] = []
      }
      groups[task.grouping].push(task)
    })
    
    return groups
  }
}