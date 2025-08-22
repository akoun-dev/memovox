// Service pour le mode hors ligne
export interface OfflineTask {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
  createdAt: string
  updatedAt: string
  syncStatus: 'pending' | 'synced' | 'error'
  localId: string
}

export interface OfflineAppointment {
  id: string
  title: string
  description?: string
  location?: string
  date: string
  duration: number
  createdAt: string
  updatedAt: string
  syncStatus: 'pending' | 'synced' | 'error'
  localId: string
}

export interface SyncOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  entityType: 'task' | 'appointment'
  entityId: string
  data: any
  timestamp: string
  retryCount: number
  lastError?: string
}

export class OfflineService {
  private static instance: OfflineService
  private storageKey = 'memovox_offline_data'
  private syncQueue: SyncOperation[] = []
  private isOnline = true

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService()
      OfflineService.instance.loadFromStorage()
      OfflineService.instance.setupNetworkListener()
    }
    return OfflineService.instance
  }

  // Vérifier si on est en ligne
  isOnlineStatus(): boolean {
    return this.isOnline
  }

  // Sauvegarder une tâche en mode hors ligne
  async saveTaskOffline(task: Omit<OfflineTask, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<OfflineTask> {
    const offlineTask: OfflineTask = {
      id: `offline_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
      localId: `local_${Date.now()}`,
      ...task
    }

    const tasks = this.getOfflineTasks()
    tasks.push(offlineTask)
    this.saveTasks(tasks)

    // Ajouter à la file de synchronisation
    this.addToSyncQueue({
      id: `sync_${Date.now()}`,
      type: 'create',
      entityType: 'task',
      entityId: offlineTask.id,
      data: offlineTask,
      timestamp: new Date().toISOString(),
      retryCount: 0
    })

    return offlineTask
  }

  // Sauvegarder un rendez-vous en mode hors ligne
  async saveAppointmentOffline(appointment: Omit<OfflineAppointment, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<OfflineAppointment> {
    const offlineAppointment: OfflineAppointment = {
      id: `offline_appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending',
      localId: `local_${Date.now()}`,
      ...appointment
    }

    const appointments = this.getOfflineAppointments()
    appointments.push(offlineAppointment)
    this.saveAppointments(appointments)

    // Ajouter à la file de synchronisation
    this.addToSyncQueue({
      id: `sync_${Date.now()}`,
      type: 'create',
      entityType: 'appointment',
      entityId: offlineAppointment.id,
      data: offlineAppointment,
      timestamp: new Date().toISOString(),
      retryCount: 0
    })

    return offlineAppointment
  }

  // Récupérer les tâches hors ligne
  getOfflineTasks(): OfflineTask[] {
    try {
      const data = localStorage.getItem(`${this.storageKey}_tasks`)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading offline tasks:', error)
      return []
    }
  }

  // Récupérer les rendez-vous hors ligne
  getOfflineAppointments(): OfflineAppointment[] {
    try {
      const data = localStorage.getItem(`${this.storageKey}_appointments`)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading offline appointments:', error)
      return []
    }
  }

  // Synchroniser les données avec le serveur
  async syncWithServer(): Promise<{ success: number; errors: number }> {
    if (!this.isOnline) {
      return { success: 0, errors: 0 }
    }

    let successCount = 0
    let errorCount = 0

    const pendingOperations = this.syncQueue.filter(op => op.retryCount < 3)

    for (const operation of pendingOperations) {
      try {
        await this.executeSyncOperation(operation)
        operation.retryCount = 0
        successCount++
        
        // Supprimer l'opération de la file
        this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id)
      } catch (error) {
        operation.retryCount++
        operation.lastError = error instanceof Error ? error.message : 'Unknown error'
        errorCount++
      }
    }

    this.saveSyncQueue()
    return { success: successCount, errors: errorCount }
  }

  // Exécuter une opération de synchronisation
  private async executeSyncOperation(operation: SyncOperation): Promise<void> {
    const token = this.getAuthToken()
    
    if (!token) {
      throw new Error('No auth token available')
    }

    let url = ''
    let options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }

    switch (operation.entityType) {
      case 'task':
        url = '/api/tasks'
        break
      case 'appointment':
        url = '/api/appointments'
        break
    }

    if (operation.type === 'update') {
      url += `/${operation.entityId}`
      options.method = 'PUT'
    } else if (operation.type === 'delete') {
      url += `/${operation.entityId}`
      options.method = 'DELETE'
    }

    if (operation.type !== 'delete') {
      options.body = JSON.stringify(operation.data)
    }

    const response = await fetch(url, options)
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`)
    }

    // Mettre à jour le statut de synchronisation
    if (operation.entityType === 'task') {
      const tasks = this.getOfflineTasks()
      const task = tasks.find(t => t.id === operation.entityId)
      if (task) {
        task.syncStatus = 'synced'
        this.saveTasks(tasks)
      }
    } else if (operation.entityType === 'appointment') {
      const appointments = this.getOfflineAppointments()
      const appointment = appointments.find(a => a.id === operation.entityId)
      if (appointment) {
        appointment.syncStatus = 'synced'
        this.saveAppointments(appointments)
      }
    }
  }

  // Ajouter une opération à la file de synchronisation
  private addToSyncQueue(operation: SyncOperation): void {
    this.syncQueue.push(operation)
    this.saveSyncQueue()
  }

  // Sauvegarder les tâches dans localStorage
  private saveTasks(tasks: OfflineTask[]): void {
    try {
      localStorage.setItem(`${this.storageKey}_tasks`, JSON.stringify(tasks))
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error)
    }
  }

  // Sauvegarder les rendez-vous dans localStorage
  private saveAppointments(appointments: OfflineAppointment[]): void {
    try {
      localStorage.setItem(`${this.storageKey}_appointments`, JSON.stringify(appointments))
    } catch (error) {
      console.error('Error saving appointments to localStorage:', error)
    }
  }

  // Sauvegarder la file de synchronisation
  private saveSyncQueue(): void {
    try {
      localStorage.setItem(`${this.storageKey}_sync_queue`, JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('Error saving sync queue to localStorage:', error)
    }
  }

  // Charger depuis localStorage
  private loadFromStorage(): void {
    try {
      const syncQueueData = localStorage.getItem(`${this.storageKey}_sync_queue`)
      if (syncQueueData) {
        this.syncQueue = JSON.parse(syncQueueData)
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
  }

  // Configurer l'écouteur de réseau
  private setupNetworkListener(): void {
    if (typeof window !== 'undefined') {
      // Écouter les changements de connexion
      window.addEventListener('online', () => {
        this.isOnline = true
        this.syncWithServer()
      })

      window.addEventListener('offline', () => {
        this.isOnline = false
      })

      // Vérifier l'état initial
      this.isOnline = navigator.onLine
    }
  }

  // Obtenir le token d'authentification
  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('next-auth.session-token') || 
             localStorage.getItem('auth-token')
    } catch (error) {
      return null
    }
  }

  // Obtenir les statistiques de synchronisation
  getSyncStats(): { pending: number; synced: number; errors: number } {
    const tasks = this.getOfflineTasks()
    const appointments = this.getOfflineAppointments()
    
    const pending = tasks.filter(t => t.syncStatus === 'pending').length + 
                   appointments.filter(a => a.syncStatus === 'pending').length
    
    const synced = tasks.filter(t => t.syncStatus === 'synced').length + 
                  appointments.filter(a => a.syncStatus === 'synced').length
    
    const errors = tasks.filter(t => t.syncStatus === 'error').length + 
                  appointments.filter(a => a.syncStatus === 'error').length

    return { pending, synced, errors }
  }

  // Effacer les données hors ligne
  clearOfflineData(): void {
    try {
      localStorage.removeItem(`${this.storageKey}_tasks`)
      localStorage.removeItem(`${this.storageKey}_appointments`)
      localStorage.removeItem(`${this.storageKey}_sync_queue`)
      this.syncQueue = []
    } catch (error) {
      console.error('Error clearing offline data:', error)
    }
  }
}