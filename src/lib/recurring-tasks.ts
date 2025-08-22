export interface RecurringTaskService {
  generateRecurringTasks(tasks: any[]): any[]
  getNextOccurrence(task: any, baseDate?: Date): Date | null
  shouldGenerateTask(task: any, currentDate: Date): boolean
}

export class RecurringTaskManager implements RecurringTaskService {
  generateRecurringTasks(tasks: any[]): any[] {
    const generatedTasks: any[] = []
    const currentDate = new Date()
    
    for (const task of tasks) {
      if (!task.isRecurring) continue
      
      if (this.shouldGenerateTask(task, currentDate)) {
        const nextOccurrence = this.getNextOccurrence(task, currentDate)
        if (nextOccurrence) {
          const newTask = {
            ...task,
            id: `${task.id}_${nextOccurrence.getTime()}`,
            dueDate: nextOccurrence,
            completed: false,
            completedAt: undefined,
            createdAt: new Date()
          }
          generatedTasks.push(newTask)
        }
      }
    }
    
    return generatedTasks
  }
  
  getNextOccurrence(task: any, baseDate: Date = new Date()): Date | null {
    if (!task.isRecurring || !task.recurringType) return null
    
    const lastDate = task.dueDate ? new Date(task.dueDate) : new Date()
    let nextDate = new Date(lastDate)
    
    switch (task.recurringType) {
      case 'DAILY':
        nextDate.setDate(lastDate.getDate() + (task.recurringInterval || 1))
        break
      case 'WEEKLY':
        nextDate.setDate(lastDate.getDate() + (task.recurringInterval || 1) * 7)
        break
      case 'MONTHLY':
        nextDate.setMonth(lastDate.getMonth() + (task.recurringInterval || 1))
        break
      default:
        return null
    }
    
    // Check if we've passed the end date
    if (task.recurringEndDate && nextDate > new Date(task.recurringEndDate)) {
      return null
    }
    
    return nextDate
  }
  
  shouldGenerateTask(task: any, currentDate: Date): boolean {
    if (!task.isRecurring || !task.dueDate) return false
    
    const taskDate = new Date(task.dueDate)
    const nextOccurrence = this.getNextOccurrence(task, taskDate)
    
    if (!nextOccurrence) return false
    
    // Check if the next occurrence is within a reasonable timeframe (e.g., next 30 days)
    const thirtyDaysFromNow = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    return nextOccurrence <= thirtyDaysFromNow
  }
  
  getRecurringTasks(tasks: any[]): any[] {
    return tasks.filter(task => task.isRecurring)
  }
  
  getUpcomingRecurringTasks(tasks: any[], daysAhead: number = 7): any[] {
    const upcomingTasks: any[] = []
    const now = new Date()
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
    
    for (const task of tasks) {
      if (!task.isRecurring) continue
      
      let nextDate = this.getNextOccurrence(task)
      while (nextDate && nextDate <= futureDate) {
        if (nextDate >= now) {
          upcomingTasks.push({
            ...task,
            id: `${task.id}_${nextDate.getTime()}`,
            dueDate: nextDate,
            completed: false
          })
        }
        nextDate = this.getNextOccurrence(task, nextDate)
      }
    }
    
    return upcomingTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }
}

export const recurringTaskManager = new RecurringTaskManager()