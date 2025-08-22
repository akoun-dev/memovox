import ZAI from 'z-ai-web-dev-sdk'

export interface HabitPattern {
  id: string
  name: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly'
  consistency: number
  strength: 'weak' | 'moderate' | 'strong'
  impact: 'low' | 'medium' | 'high'
  trend: 'improving' | 'stable' | 'declining'
  dataPoints: Array<{
    date: string
    value: number
    context: any
  }>
}

export interface ProductivityInsight {
  id: string
  type: 'strength' | 'weakness' | 'opportunity' | 'threat'
  title: string
  description: string
  confidence: number
  actionable: boolean
  recommendations: string[]
  metrics: {
    current: number
    target: number
    improvement: number
  }
}

export interface TimePattern {
  hour: number
  productivity: number
  focus: number
  energy: number
  preferredTaskTypes: string[]
  bestFor: string[]
  avoid: string[]
}

export interface WeeklyPattern {
  dayOfWeek: number
  avgCompletionRate: number
  avgTasksCompleted: number
  avgTimeSpent: number
  mood: 'low' | 'medium' | 'high'
  optimalTaskTypes: string[]
  challenges: string[]
}

export interface HabitsAnalysis {
  userId: string
  period: {
    start: string
    end: string
  }
  patterns: {
    time: TimePattern[]
    weekly: WeeklyPattern[]
    habits: HabitPattern[]
  }
  insights: ProductivityInsight[]
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
  metrics: {
    overallProductivity: number
    consistencyScore: number
    efficiency: number
    wellbeing: number
  }
}

export class HabitsAnalyzer {
  private static instance: HabitsAnalyzer
  private zai: any = null
  private cache: Map<string, HabitsAnalysis> = new Map()

  static getInstance(): HabitsAnalyzer {
    if (!HabitsAnalyzer.instance) {
      HabitsAnalyzer.instance = new HabitsAnalyzer()
    }
    return HabitsAnalyzer.instance
  }

  private constructor() {
    this.initializeAI()
  }

  private async initializeAI() {
    try {
      this.zai = await ZAI.create()
    } catch (error) {
      console.error('Failed to initialize AI for habits analysis:', error)
    }
  }

  // Analyser les habitudes d'un utilisateur
  async analyzeHabits(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<HabitsAnalysis> {
    const cacheKey = `${userId}_${startDate.toISOString()}_${endDate.toISOString()}`
    
    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    try {
      // Récupérer les données nécessaires
      const [tasks, appointments, userSettings] = await this.getUserData(userId, startDate, endDate)

      // Analyser les patterns temporels
      const timePatterns = this.analyzeTimePatterns(tasks, appointments)
      
      // Analyser les patterns hebdomadaires
      const weeklyPatterns = this.analyzeWeeklyPatterns(tasks, appointments)
      
      // Identifier les habitudes
      const habitPatterns = await this.identifyHabits(tasks, appointments)
      
      // Générer des insights
      const insights = await this.generateInsights(tasks, appointments, timePatterns, weeklyPatterns)
      
      // Générer des recommandations
      const recommendations = await this.generateRecommendations(insights, habitPatterns)
      
      // Calculer les métriques globales
      const metrics = this.calculateGlobalMetrics(tasks, appointments, habitPatterns)

      const analysis: HabitsAnalysis = {
        userId,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        patterns: {
          time: timePatterns,
          weekly: weeklyPatterns,
          habits: habitPatterns
        },
        insights,
        recommendations,
        metrics
      }

      // Mettre en cache
      this.cache.set(cacheKey, analysis)
      
      return analysis
    } catch (error) {
      console.error('Error analyzing habits:', error)
      throw error
    }
  }

  // Récupérer les données utilisateur
  private async getUserData(userId: string, startDate: Date, endDate: Date) {
    // Simuler la récupération des données depuis la base de données
    // Dans une vraie implémentation, on utiliserait Prisma
    
    return [
      [], // tasks
      [], // appointments
      null // userSettings
    ]
  }

  // Analyser les patterns temporels
  private analyzeTimePatterns(tasks: any[], appointments: any[]): TimePattern[] {
    const patterns: TimePattern[] = []

    for (let hour = 0; hour < 24; hour++) {
      const hourTasks = tasks.filter(task => {
        if (task.completedAt) {
          return new Date(task.completedAt).getHours() === hour
        }
        return false
      })

      const hourAppointments = appointments.filter(apt => 
        new Date(apt.date).getHours() === hour
      )

      // Calculer la productivité
      const completedTasks = hourTasks.filter(t => t.completed).length
      const totalTasks = hourTasks.length
      const productivity = totalTasks > 0 ? completedTasks / totalTasks : 0

      // Calculer le focus (basé sur la durée des tâches)
      const avgTaskDuration = hourTasks.length > 0
        ? hourTasks.reduce((sum, task) => {
            const duration = task.completedAt && task.createdAt
              ? (new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60)
              : 30
            return sum + duration
          }, 0) / hourTasks.length
        : 0

      const focus = Math.min(1, avgTaskDuration / 60) // Normalisé sur 60 minutes

      // Calculer l'énergie (basé sur l'heure de la journée)
      const energy = this.calculateNaturalEnergy(hour)

      // Identifier les types de tâches préférés
      const taskTypes = hourTasks.map(task => this.categorizeTask(task.title))
      const typeFrequency: { [key: string]: number } = {}
      taskTypes.forEach(type => {
        typeFrequency[type] = (typeFrequency[type] || 0) + 1
      })

      const preferredTaskTypes = Object.entries(typeFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type)

      patterns.push({
        hour,
        productivity,
        focus,
        energy,
        preferredTaskTypes,
        bestFor: this.getBestTaskTypesForHour(hour),
        avoid: this.getTasksToAvoidForHour(hour)
      })
    }

    return patterns
  }

  // Analyser les patterns hebdomadaires
  private analyzeWeeklyPatterns(tasks: any[], appointments: any[]): WeeklyPattern[] {
    const patterns: WeeklyPattern[] = []

    for (let day = 0; day < 7; day++) {
      const dayTasks = tasks.filter(task => {
        if (task.completedAt) {
          return new Date(task.completedAt).getDay() === day
        }
        return false
      })

      const dayAppointments = appointments.filter(apt => 
        new Date(apt.date).getDay() === day
      )

      // Calculer le taux de complétion
      const completedTasks = dayTasks.filter(t => t.completed).length
      const avgCompletionRate = dayTasks.length > 0 ? completedTasks / dayTasks.length : 0

      // Calculer le nombre moyen de tâches complétées
      const avgTasksCompleted = completedTasks / Math.max(1, this.getWeeksInPeriod(tasks))

      // Calculer le temps moyen passé
      const totalTimeSpent = dayTasks.reduce((sum, task) => {
        if (task.completedAt && task.createdAt) {
          return sum + (new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime())
        }
        return sum
      }, 0)
      
      const avgTimeSpent = dayTasks.length > 0 
        ? totalTimeSpent / dayTasks.length / (1000 * 60) 
        : 0

      // Déterminer l'humeur (basé sur la productivité et la charge de travail)
      const mood = this.calculateDayMood(avgCompletionRate, dayAppointments.length)

      // Types de tâches optimaux
      const taskTypes = dayTasks.map(task => this.categorizeTask(task.title))
      const optimalTaskTypes = this.getOptimalTaskTypesForDay(day, taskTypes)

      // Défis fréquents
      const challenges = this.identifyDayChallenges(day, dayTasks, dayAppointments)

      patterns.push({
        dayOfWeek: day,
        avgCompletionRate,
        avgTasksCompleted,
        avgTimeSpent,
        mood,
        optimalTaskTypes,
        challenges
      })
    }

    return patterns
  }

  // Identifier les habitudes
  private async identifyHabits(tasks: any[], appointments: any[]): Promise<HabitPattern[]> {
    const habits: HabitPattern[] = []

    // Habitude: Tâches matinales
    const morningTasks = tasks.filter(task => {
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours()
        return hour >= 6 && hour <= 10
      }
      return false
    })

    if (morningTasks.length > 5) {
      habits.push({
        id: 'morning_routine',
        name: 'Routine matinale productive',
        description: 'Vous êtes plus productif le matin',
        frequency: 'daily',
        consistency: this.calculateConsistency(morningTasks),
        strength: this.calculateHabitStrength(morningTasks.length, tasks.length),
        impact: 'high',
        trend: this.calculateTrend(morningTasks),
        dataPoints: this.generateDataPoints(morningTasks)
      })
    }

    // Habitude: Tâches créatives en après-midi
    const creativeTasks = tasks.filter(task => 
      task.title.toLowerCase().includes('créatif') || 
      task.title.toLowerCase().includes('design') ||
      task.title.toLowerCase().includes('idée')
    )

    const afternoonCreativeTasks = creativeTasks.filter(task => {
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours()
        return hour >= 14 && hour <= 17
      }
      return false
    })

    if (afternoonCreativeTasks.length > 3) {
      habits.push({
        id: 'afternoon_creative',
        name: 'Créativité en après-midi',
        description: 'Vous préférez les tâches créatives en après-midi',
        frequency: 'weekly',
        consistency: this.calculateConsistency(afternoonCreativeTasks),
        strength: this.calculateHabitStrength(afternoonCreativeTasks.length, creativeTasks.length),
        impact: 'medium',
        trend: this.calculateTrend(afternoonCreativeTasks),
        dataPoints: this.generateDataPoints(afternoonCreativeTasks)
      })
    }

    // Habitude: Réunions en milieu de journée
    const meetingTasks = tasks.filter(task => 
      task.title.toLowerCase().includes('réunion') || 
      task.title.toLowerCase().includes('meeting')
    )

    const middayMeetings = meetingTasks.filter(task => {
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours()
        return hour >= 11 && hour <= 15
      }
      return false
    })

    if (middayMeetings.length > 3) {
      habits.push({
        id: 'midday_meetings',
        name: 'Réunions en milieu de journée',
        description: 'Vous planifiez vos réunions entre 11h et 15h',
        frequency: 'weekly',
        consistency: this.calculateConsistency(middayMeetings),
        strength: this.calculateHabitStrength(middayMeetings.length, meetingTasks.length),
        impact: 'medium',
        trend: this.calculateTrend(middayMeetings),
        dataPoints: this.generateDataPoints(middayMeetings)
      })
    }

    return habits
  }

  // Générer des insights
  private async generateInsights(
    tasks: any[],
    appointments: any[],
    timePatterns: TimePattern[],
    weeklyPatterns: WeeklyPattern[]
  ): Promise<ProductivityInsight[]> {
    const insights: ProductivityInsight[] = []

    if (!this.zai) {
      return this.generateBasicInsights(tasks, appointments, timePatterns, weeklyPatterns)
    }

    try {
      // Préparer les données pour l'IA
      const analysisData = {
        tasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        appointments: appointments.length,
        timePatterns: timePatterns.map(p => ({
          hour: p.hour,
          productivity: p.productivity,
          focus: p.focus,
          energy: p.energy
        })),
        weeklyPatterns: weeklyPatterns.map(p => ({
          day: p.dayOfWeek,
          completionRate: p.avgCompletionRate,
          tasksCompleted: p.avgTasksCompleted,
          mood: p.mood
        }))
      }

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en analyse de productivité et de habitudes. Analyse les données suivantes et génère 3-5 insights significatifs.

Pour chaque insight, fournis:
- type: "strength", "weakness", "opportunity", ou "threat"
- title: un titre court et percutant
- description: une description détaillée
- confidence: un nombre entre 0 et 1
- actionable: true/false
- recommendations: 2-3 recommandations concrètes
- metrics: { current, target, improvement }

Retourne ta réponse au format JSON avec un tableau d'insights.`
          },
          {
            role: 'user',
            content: JSON.stringify(analysisData)
          }
        ],
        temperature: 0.7
      })

      const response = completion.choices[0]?.message?.content
      if (response) {
        const aiInsights = JSON.parse(response)
        insights.push(...aiInsights)
      }
    } catch (error) {
      console.error('Error generating AI insights:', error)
      insights.push(...this.generateBasicInsights(tasks, appointments, timePatterns, weeklyPatterns))
    }

    return insights
  }

  // Générer des recommandations
  private async generateRecommendations(
    insights: ProductivityInsight[],
    habits: HabitPattern[]
  ): Promise<{
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }> {
    const recommendations = {
      immediate: [] as string[],
      shortTerm: [] as string[],
      longTerm: [] as string[]
    }

    // Recommandations basées sur les insights
    insights.forEach(insight => {
      if (insight.actionable) {
        if (insight.type === 'threat') {
          recommendations.immediate.push(...insight.recommendations)
        } else if (insight.type === 'opportunity') {
          recommendations.shortTerm.push(...insight.recommendations)
        } else {
          recommendations.longTerm.push(...insight.recommendations)
        }
      }
    })

    // Recommandations basées sur les habitudes
    habits.forEach(habit => {
      if (habit.strength === 'weak' && habit.impact === 'high') {
        recommendations.immediate.push(
          `Renforcez votre habitude "${habit.name}" en la pratiquant quotidiennement.`
        )
      }
      
      if (habit.trend === 'declining') {
        recommendations.shortTerm.push(
          `Votre habitude "${habit.name}" est en déclin. Identifiez les obstacles et ajustez votre approche.`
        )
      }
    })

    // Recommandations par défaut
    if (recommendations.immediate.length === 0) {
      recommendations.immediate.push(
        'Commencez votre journée par vos 3 tâches les plus importantes.'
      )
    }

    if (recommendations.shortTerm.length === 0) {
      recommendations.shortTerm.push(
        'Mettez en place un système de suivi de votre temps pour mieux comprendre vos habitudes.'
      )
    }

    if (recommendations.longTerm.length === 0) {
      recommendations.longTerm.push(
        'Développez une routine matinale et soirière pour optimiser votre productivité à long terme.'
      )
    }

    return recommendations
  }

  // Calculer les métriques globales
  private calculateGlobalMetrics(
    tasks: any[],
    appointments: any[],
    habits: HabitPattern[]
  ) {
    const completedTasks = tasks.filter(t => t.completed).length
    const overallProductivity = tasks.length > 0 ? completedTasks / tasks.length : 0

    // Calculer le score de consistance
    const strongHabits = habits.filter(h => h.strength === 'strong').length
    const consistencyScore = habits.length > 0 ? strongHabits / habits.length : 0

    // Calculer l'efficacité
    const avgTaskDuration = tasks.length > 0
      ? tasks.reduce((sum, task) => {
          if (task.completedAt && task.createdAt) {
            return sum + (new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime())
          }
          return sum
        }, 0) / tasks.length / (1000 * 60)
      : 0
    
    const efficiency = Math.max(0, 1 - (avgTaskDuration / 120)) // Normalisé sur 2 heures

    // Calculer le bien-être (basé sur la charge de travail et l'équilibre)
    const workload = tasks.length + appointments.length
    const wellbeing = Math.max(0, 1 - (workload / 20)) // Normalisé sur 20 tâches/rendez-vous

    return {
      overallProductivity,
      consistencyScore,
      efficiency,
      wellbeing
    }
  }

  // Méthodes utilitaires

  private calculateNaturalEnergy(hour: number): number {
    if (hour >= 9 && hour <= 11) return 0.9
    if (hour >= 14 && hour <= 16) return 0.7
    if (hour >= 16 && hour <= 18) return 0.5
    if (hour >= 6 && hour <= 8) return 0.6
    if (hour >= 19 && hour <= 22) return 0.4
    return 0.3
  }

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

  private getBestTaskTypesForHour(hour: number): string[] {
    if (hour >= 9 && hour <= 11) return ['analytique', 'créatif', 'important']
    if (hour >= 14 && hour <= 16) return ['créatif', 'communication']
    if (hour >= 16 && hour <= 18) return ['administratif', 'communication']
    return ['autre']
  }

  private getTasksToAvoidForHour(hour: number): string[] {
    if (hour >= 9 && hour <= 11) return ['administratif']
    if (hour >= 14 && hour <= 16) return ['analytique']
    if (hour >= 16 && hour <= 18) return ['créatif', 'important']
    return []
  }

  private getWeeksInPeriod(tasks: any[]): number {
    if (tasks.length === 0) return 1
    
    const dates = tasks.map(task => new Date(task.createdAt)).filter(date => !isNaN(date.getTime()))
    if (dates.length === 0) return 1
    
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
    
    const weeks = Math.ceil((maxDate.getTime() - minDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return Math.max(1, weeks)
  }

  private calculateDayMood(completionRate: number, appointmentCount: number): 'low' | 'medium' | 'high' {
    const score = completionRate * 0.7 + Math.max(0, 1 - appointmentCount / 5) * 0.3
    
    if (score >= 0.7) return 'high'
    if (score >= 0.4) return 'medium'
    return 'low'
  }

  private getOptimalTaskTypesForDay(day: number, taskTypes: string[]): string[] {
    const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
    
    // Logique basée sur le jour de la semaine
    if (day === 1) return ['important', 'planification'] // Lundi
    if (day === 5) return ['communication', 'clôture'] // Vendredi
    if (day === 0 || day === 6) return ['créatif', 'personnel'] // Weekend
    
    // Jours de semaine normaux
    const typeFrequency: { [key: string]: number } = {}
    taskTypes.forEach(type => {
      typeFrequency[type] = (typeFrequency[type] || 0) + 1
    })
    
    return Object.entries(typeFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type)
  }

  private identifyDayChallenges(day: number, tasks: any[], appointments: any[]): string[] {
    const challenges: string[] = []
    
    if (appointments.length > 3) {
      challenges.push('trop de rendez-vous')
    }
    
    if (tasks.length > 8) {
      challenges.push('trop de tâches planifiées')
    }
    
    if (day === 1) { // Lundi
      challenges.push('reprise après le week-end')
    }
    
    if (day === 5) { // Vendredi
      challenges.push('fatigue de fin de semaine')
    }
    
    return challenges
  }

  private calculateConsistency(items: any[]): number {
    if (items.length === 0) return 0
    
    // Simplifié - dans une vraie implémentation, on calculerait la régularité
    return Math.min(1, items.length / 10)
  }

  private calculateHabitStrength(count: number, total: number): 'weak' | 'moderate' | 'strong' {
    const ratio = total > 0 ? count / total : 0
    
    if (ratio >= 0.7) return 'strong'
    if (ratio >= 0.4) return 'moderate'
    return 'weak'
  }

  private calculateTrend(items: any[]): 'improving' | 'stable' | 'declining' {
    if (items.length < 3) return 'stable'
    
    // Simplifié - trier par date et analyser la tendance
    const sortedItems = items.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    
    const recent = sortedItems.slice(-Math.ceil(items.length / 3))
    const older = sortedItems.slice(0, Math.ceil(items.length / 3))
    
    // Comparer les performances récentes avec les plus anciennes
    const recentPerformance = recent.filter(item => item.completed).length / recent.length
    const olderPerformance = older.filter(item => item.completed).length / older.length
    
    if (recentPerformance > olderPerformance + 0.1) return 'improving'
    if (recentPerformance < olderPerformance - 0.1) return 'declining'
    return 'stable'
  }

  private generateDataPoints(items: any[]): Array<{ date: string; value: number; context: any }> {
    return items.map(item => ({
      date: new Date(item.createdAt).toISOString().split('T')[0],
      value: item.completed ? 1 : 0,
      context: { taskId: item.id, title: item.title }
    }))
  }

  private generateBasicInsights(
    tasks: any[],
    appointments: any[],
    timePatterns: TimePattern[],
    weeklyPatterns: WeeklyPattern[]
  ): ProductivityInsight[] {
    const insights: ProductivityInsight[] = []
    
    // Insight sur la productivité globale
    const completedTasks = tasks.filter(t => t.completed).length
    const completionRate = tasks.length > 0 ? completedTasks / tasks.length : 0
    
    if (completionRate < 0.5) {
      insights.push({
        id: 'low_completion',
        type: 'weakness',
        title: 'Taux de complétion faible',
        description: `Votre taux de complétion des tâches est de ${Math.round(completionRate * 100)}%, ce qui est en dessous de la moyenne.`,
        confidence: 0.8,
        actionable: true,
        recommendations: [
          'Réduisez le nombre de tâches quotidiennes',
          'Priorisez les tâches les plus importantes',
          'Utilisez la technique Pomodoro pour mieux vous concentrer'
        ],
        metrics: {
          current: completionRate,
          target: 0.7,
          improvement: 0.7 - completionRate
        }
      })
    }
    
    // Insight sur les heures de productivité
    const bestHours = timePatterns
      .filter(p => p.productivity > 0.7)
      .map(p => p.hour)
      .sort((a, b) => a - b)
    
    if (bestHours.length > 0) {
      insights.push({
        id: 'peak_hours',
        type: 'strength',
        title: 'Heures de productivité identifiées',
        description: `Vous êtes plus productif entre ${bestHours[0]}h et ${bestHours[bestHours.length - 1]}h.`,
        confidence: 0.7,
        actionable: true,
        recommendations: [
          'Planifiez vos tâches importantes pendant ces heures',
          'Protégez ces créneaux des interruptions',
          'Réservez les tâches moins importantes pour d autres moments'
        ],
        metrics: {
          current: 0.8,
          target: 0.9,
          improvement: 0.1
        }
      })
    }
    
    return insights
  }

  // Vider le cache
  clearCache(): void {
    this.cache.clear()
  }

  // Obtenir les statistiques d'analyse
  getAnalysisStats(): {
    cacheSize: number
    totalAnalyses: number
    averageAnalysisTime: number
  } {
    return {
      cacheSize: this.cache.size,
      totalAnalyses: 0, // À implémenter avec un compteur
      averageAnalysisTime: 0 // À implémenter avec le suivi du temps
    }
  }
}