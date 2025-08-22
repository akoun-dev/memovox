// Service pour les fonctionnalités mobiles
export interface MobileDevice {
  id: string
  platform: 'ios' | 'android' | 'web'
  token: string
  userId: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface PushNotification {
  id: string
  title: string
  body: string
  data?: Record<string, any>
  userId: string
  deviceId?: string
  scheduledFor?: Date
  sentAt?: Date
  readAt?: Date
  type: 'task_reminder' | 'appointment_reminder' | 'daily_summary' | 'ai_suggestion' | 'system'
}

export interface WidgetData {
  tasks: Array<{
    id: string
    title: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    dueDate?: string
    completed: boolean
  }>
  appointments: Array<{
    id: string
    title: string
    date: string
    duration: number
  }>
  stats: {
    completedToday: number
    pendingToday: number
    mentalLoad: number
  }
}

export class MobileService {
  private static instance: MobileService
  private devices: Map<string, MobileDevice> = new Map()
  private notifications: PushNotification[] = []

  static getInstance(): MobileService {
    if (!MobileService.instance) {
      MobileService.instance = new MobileService()
    }
    return MobileService.instance
  }

  // Enregistrer un appareil mobile
  async registerDevice(deviceData: Omit<MobileDevice, 'id' | 'createdAt' | 'updatedAt'>): Promise<MobileDevice> {
    const device: MobileDevice = {
      id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...deviceData
    }

    this.devices.set(device.id, device)
    
    // Simuler l'enregistrement dans la base de données
    console.log('Device registered:', device)
    
    return device
  }

  // Désenregistrer un appareil
  async unregisterDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId)
    if (device) {
      device.isActive = false
      device.updatedAt = new Date()
      this.devices.delete(deviceId)
      console.log('Device unregistered:', deviceId)
      return true
    }
    return false
  }

  // Envoyer une notification push
  async sendNotification(notification: Omit<PushNotification, 'id' | 'sentAt'>): Promise<PushNotification> {
    const pushNotification: PushNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sentAt: new Date(),
      ...notification
    }

    this.notifications.push(pushNotification)

    // Simuler l'envoi de la notification
    console.log('Push notification sent:', pushNotification)

    // Dans une vraie implémentation, on utiliserait des services comme:
    // - Firebase Cloud Messaging (FCM) pour Android
    // - Apple Push Notification Service (APNS) pour iOS
    
    return pushNotification
  }

  // Envoyer une notification à tous les appareils d'un utilisateur
  async sendNotificationToUser(userId: string, notification: Omit<PushNotification, 'id' | 'sentAt' | 'userId'>): Promise<PushNotification[]> {
    const userDevices = Array.from(this.devices.values()).filter(device => 
      device.userId === userId && device.isActive
    )

    const sentNotifications: PushNotification[] = []
    
    for (const device of userDevices) {
      const notif = await this.sendNotification({
        ...notification,
        userId,
        deviceId: device.id
      })
      sentNotifications.push(notif)
    }

    return sentNotifications
  }

  // Obtenir les données pour le widget
  async getWidgetData(userId: string): Promise<WidgetData> {
    // Simuler la récupération des données depuis la base de données
    // Dans une vraie implémentation, on ferait un appel API
    
    return {
      tasks: [
        {
          id: '1',
          title: 'Réunion équipe',
          priority: 'HIGH',
          dueDate: new Date().toISOString(),
          completed: false
        },
        {
          id: '2',
          title: 'Préparer présentation',
          priority: 'MEDIUM',
          completed: false
        }
      ],
      appointments: [
        {
          id: '1',
          title: 'Appel client',
          date: new Date().toISOString(),
          duration: 30
        }
      ],
      stats: {
        completedToday: 3,
        pendingToday: 5,
        mentalLoad: 65
      }
    }
  }

  // Vérifier si un appareil est supporté pour les notifications
  isDeviceSupported(platform: string): boolean {
    return ['ios', 'android'].includes(platform)
  }

  // Formater les données pour le widget
  formatWidgetData(data: WidgetData): string {
    return JSON.stringify(data, null, 2)
  }
}