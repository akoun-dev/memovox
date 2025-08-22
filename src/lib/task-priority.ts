export interface TaskPriorityService {
  prioritizeTasks(tasks: any[]): any[]
  getTaskScore(task: any): number
  getUrgencyLevel(task: any): 'low' | 'medium' | 'high' | 'critical'
}

export class TaskPriorityManager implements TaskPriorityService {
  prioritizeTasks(tasks: any[]): any[] {
    return tasks
      .filter(task => !task.completed)
      .map(task => ({
        ...task,
        priorityScore: this.getTaskScore(task),
        urgencyLevel: this.getUrgencyLevel(task)
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore)
  }

  getTaskScore(task: any): number {
    let score = 0
    
    // Base priority score
    const priorityScores = {
      'HIGH': 100,
      'MEDIUM': 50,
      'LOW': 10
    }
    score += priorityScores[task.priority] || 50
    
    // Urgency based on due date
    if (task.dueDate) {
      const now = new Date()
      const dueDate = new Date(task.dueDate)
      const timeUntilDue = dueDate.getTime() - now.getTime()
      const daysUntilDue = timeUntilDue / (1000 * 60 * 60 * 24)
      
      if (daysUntilDue < 0) {
        score += 200 // Overdue tasks get highest priority
      } else if (daysUntilDue <= 1) {
        score += 150 // Due today or tomorrow
      } else if (daysUntilDue <= 3) {
        score += 100 // Due within 3 days
      } else if (daysUntilDue <= 7) {
        score += 50 // Due within a week
      }
    }
    
    // Estimated duration (shorter tasks might be prioritized for quick wins)
    if (task.estimatedDuration) {
      if (task.estimatedDuration <= 15) {
        score += 25 // Quick tasks
      } else if (task.estimatedDuration <= 30) {
        score += 15 // Medium tasks
      }
    }
    
    // Recurring tasks might get slight priority to maintain habits
    if (task.isRecurring) {
      score += 10
    }
    
    // Age of task (older tasks might need attention)
    if (task.createdAt) {
      const now = new Date()
      const createdDate = new Date(task.createdAt)
      const ageInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (ageInDays > 7) {
        score += 20 // Tasks older than a week
      } else if (ageInDays > 3) {
        score += 10 // Tasks older than 3 days
      }
    }
    
    return score
  }

  getUrgencyLevel(task: any): 'low' | 'medium' | 'high' | 'critical' {
    const score = this.getTaskScore(task)
    
    if (score >= 200) return 'critical'
    if (score >= 150) return 'high'
    if (score >= 75) return 'medium'
    return 'low'
  }

  getTaskRecommendations(tasks: any[]): {
    quickWins: any[]
    urgentTasks: any[]
    importantTasks: any[]
    scheduleSuggestions: any[]
  } {
    const prioritizedTasks = this.prioritizeTasks(tasks)
    
    const quickWins = prioritizedTasks.filter(task => 
      task.estimatedDuration && task.estimatedDuration <= 15
    ).slice(0, 3)
    
    const urgentTasks = prioritizedTasks.filter(task => 
      this.getUrgencyLevel(task) === 'critical' || this.getUrgencyLevel(task) === 'high'
    ).slice(0, 5)
    
    const importantTasks = prioritizedTasks.filter(task => 
      task.priority === 'HIGH' && !urgentTasks.includes(task)
    ).slice(0, 3)
    
    const scheduleSuggestions = this.generateScheduleSuggestions(prioritizedTasks)
    
    return {
      quickWins,
      urgentTasks,
      importantTasks,
      scheduleSuggestions
    }
  }

  private generateScheduleSuggestions(tasks: any[]): Array<{
    type: string;
    title: string;
    description: string;
    tasks: any[];
    estimatedDuration: any;
  }> {
    const suggestions: Array<{
      type: string;
      title: string;
      description: string;
      tasks: any[];
      estimatedDuration: any;
    }> = []
    const now = new Date()
    
    // Group tasks by estimated duration
    const shortTasks = tasks.filter(task => task.estimatedDuration && task.estimatedDuration <= 15)
    const mediumTasks = tasks.filter(task => task.estimatedDuration && task.estimatedDuration > 15 && task.estimatedDuration <= 30)
    const longTasks = tasks.filter(task => task.estimatedDuration && task.estimatedDuration > 30)
    
    // Suggest time blocks
    if (shortTasks.length > 0) {
      suggestions.push({
        type: 'time_block',
        title: 'Bloc de tâches rapides',
        description: `Effectuez ${shortTasks.length} tâches rapides en 30-45 minutes`,
        tasks: shortTasks.slice(0, 3),
        estimatedDuration: shortTasks.slice(0, 3).reduce((sum, task) => sum + (task.estimatedDuration || 0), 0)
      })
    }
    
    if (mediumTasks.length > 0) {
      suggestions.push({
        type: 'focused_session',
        title: 'Session de travail concentrée',
        description: `Consacrez 1-2 heures aux tâches moyennes`,
        tasks: mediumTasks.slice(0, 2),
        estimatedDuration: mediumTasks.slice(0, 2).reduce((sum, task) => sum + (task.estimatedDuration || 0), 0)
      })
    }
    
    if (longTasks.length > 0) {
      suggestions.push({
        type: 'deep_work',
        title: 'Travail en profondeur',
        description: `Bloquez 2-3 heures pour les tâches complexes`,
        tasks: longTasks.slice(0, 1),
        estimatedDuration: longTasks[0]?.estimatedDuration || 0
      })
    }
    
    return suggestions
  }

  getOptimalTaskOrder(tasks: any[], availableTime: number): any[] {
    const prioritizedTasks = this.prioritizeTasks(tasks)
    const orderedTasks: any[] = []
    let remainingTime = availableTime
    
    // First, add critical tasks
    const criticalTasks = prioritizedTasks.filter(task => this.getUrgencyLevel(task) === 'critical')
    for (const task of criticalTasks) {
      if ((task.estimatedDuration || 30) <= remainingTime) {
        orderedTasks.push(task)
        remainingTime -= task.estimatedDuration || 30
      }
    }
    
    // Then add quick wins
    const quickTasks = prioritizedTasks.filter(task => task.estimatedDuration && task.estimatedDuration <= 15)
    for (const task of quickTasks) {
      if ((task.estimatedDuration || 15) <= remainingTime) {
        orderedTasks.push(task)
        remainingTime -= task.estimatedDuration || 15
      }
    }
    
    // Finally, add remaining tasks by priority
    for (const task of prioritizedTasks) {
      if (!orderedTasks.includes(task) && (task.estimatedDuration || 30) <= remainingTime) {
        orderedTasks.push(task)
        remainingTime -= task.estimatedDuration || 30
      }
    }
    
    return orderedTasks
  }
}

export const taskPriorityManager = new TaskPriorityManager()