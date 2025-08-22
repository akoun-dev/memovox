"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Clock, Calendar, Settings, Plus, Trash2, CheckCircle, AlertTriangle } from "lucide-react"
import { format, addMinutes, isBefore, isAfter, isToday } from "date-fns"
import { fr } from "date-fns/locale"

interface Notification {
  id: string
  title: string
  message: string
  type: "TASK_REMINDER" | "APPOINTMENT_REMINDER" | "CUSTOM"
  scheduledFor: Date
  isRead: boolean
  createdAt: Date
  recurring?: {
    frequency: "DAILY" | "WEEKLY" | "MONTHLY"
    interval: number
  }
}

interface NotificationSettings {
  enableNotifications: boolean
  enableSound: boolean
  enableDesktop: boolean
  reminderTime: number // minutes before
  taskReminders: boolean
  appointmentReminders: boolean
}

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Rappel: Réunion d'équipe",
      message: "Votre réunion d'équipe commence dans 15 minutes",
      type: "APPOINTMENT_REMINDER",
      scheduledFor: addMinutes(new Date(), 15),
      isRead: false,
      createdAt: new Date()
    },
    {
      id: "2",
      title: "Tâche en retard",
      message: "La tâche 'Préparer la réunion d'équipe' est en retard",
      type: "TASK_REMINDER",
      scheduledFor: new Date(),
      isRead: false,
      createdAt: new Date()
    },
    {
      id: "3",
      title: "Rappel: Appeler le fournisseur",
      message: "N'oubliez pas d'appeler le fournisseur aujourd'hui",
      type: "TASK_REMINDER",
      scheduledFor: addMinutes(new Date(), 60),
      isRead: true,
      createdAt: new Date()
    }
  ])

  const [settings, setSettings] = useState<NotificationSettings>({
    enableNotifications: true,
    enableSound: true,
    enableDesktop: true,
    reminderTime: 15,
    taskReminders: true,
    appointmentReminders: true
  })

  const [unreadCount, setUnreadCount] = useState(0)
  const [showDialog, setShowDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "CUSTOM" as const,
    scheduledFor: "",
    recurring: false,
    frequency: "DAILY" as const,
    interval: 1
  })

  useEffect(() => {
    // Calculate unread notifications
    const unread = notifications.filter(n => !n.isRead).length
    setUnreadCount(unread)

    // Check for due notifications
    const checkNotifications = setInterval(() => {
      const now = new Date()
      const dueNotifications = notifications.filter(n => 
        !n.isRead && isBefore(n.scheduledFor, now)
      )

      if (dueNotifications.length > 0) {
        dueNotifications.forEach(notification => {
          if (settings.enableNotifications) {
            showNotification(notification)
          }
        })
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(checkNotifications)
  }, [notifications, settings])

  const showNotification = (notification: Notification) => {
    if (settings.enableDesktop && "Notification" in window) {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico"
      })
    }

    if (settings.enableSound) {
      // Play a simple beep sound
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE")
      audio.play().catch(() => {})
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(n => n.id !== notificationId))
  }

  const createCustomNotification = () => {
    const notification: Notification = {
      id: Date.now().toString(),
      title: newNotification.title,
      message: newNotification.message,
      type: newNotification.type,
      scheduledFor: new Date(newNotification.scheduledFor),
      isRead: false,
      createdAt: new Date(),
      recurring: newNotification.recurring ? {
        frequency: newNotification.frequency,
        interval: newNotification.interval
      } : undefined
    }

    setNotifications([...notifications, notification])
    setNewNotification({
      title: "",
      message: "",
      type: "CUSTOM",
      scheduledFor: "",
      recurring: false,
      frequency: "DAILY",
      interval: 1
    })
    setShowDialog(false)
  }

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings({ ...settings, ...newSettings })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "TASK_REMINDER":
        return <CheckCircle className="h-4 w-4" />
      case "APPOINTMENT_REMINDER":
        return <Calendar className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "TASK_REMINDER":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "APPOINTMENT_REMINDER":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const isOverdue = (scheduledFor: Date) => {
    return isBefore(scheduledFor, new Date()) && !notifications.find(n => n.scheduledFor === scheduledFor)?.isRead
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </DialogTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Tout marquer comme lu
                  </Button>
                )}
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications
                .sort((a, b) => b.scheduledFor.getTime() - a.scheduledFor.getTime())
                .map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`p-3 ${notification.isRead ? 'opacity-60' : ''} ${
                      isOverdue(notification.scheduledFor) ? 'border-red-200 bg-red-50' : ''
                    }`}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {getNotificationIcon(notification.type)}
                            <h4 className={`font-medium ${notification.isRead ? 'text-muted-foreground' : ''}`}>
                              {notification.title}
                            </h4>
                            <Badge variant="outline" className={getNotificationColor(notification.type)}>
                              {notification.type === "TASK_REMINDER" ? "Tâche" :
                               notification.type === "APPOINTMENT_REMINDER" ? "Rendez-vous" : "Personnalisé"}
                            </Badge>
                            {isOverdue(notification.scheduledFor) && (
                              <Badge variant="destructive" className="text-xs">
                                En retard
                              </Badge>
                            )}
                          </div>
                          
                          <p className={`text-sm ${notification.isRead ? 'text-muted-foreground' : ''}`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {isToday(notification.scheduledFor) 
                                ? format(notification.scheduledFor, "HH:mm", { locale: fr })
                                : format(notification.scheduledFor, "dd/MM HH:mm", { locale: fr })
                              }
                            </span>
                            {notification.recurring && (
                              <Badge variant="outline" className="text-xs">
                                {notification.recurring.frequency === "DAILY" ? "Quotidien" :
                                 notification.recurring.frequency === "WEEKLY" ? "Hebdomadaire" : "Mensuel"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
          
          <div className="pt-4 border-t">
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Créer une notification
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paramètres de notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-notifications">Activer les notifications</Label>
                <Switch
                  id="enable-notifications"
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => updateSettings({ enableNotifications: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-sound">Activer le son</Label>
                <Switch
                  id="enable-sound"
                  checked={settings.enableSound}
                  onCheckedChange={(checked) => updateSettings({ enableSound: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-desktop">Notifications desktop</Label>
                <Switch
                  id="enable-desktop"
                  checked={settings.enableDesktop}
                  onCheckedChange={(checked) => updateSettings({ enableDesktop: checked })}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Rappels</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="task-reminders">Rappels de tâches</Label>
                <Switch
                  id="task-reminders"
                  checked={settings.taskReminders}
                  onCheckedChange={(checked) => updateSettings({ taskReminders: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="appointment-reminders">Rappels de rendez-vous</Label>
                <Switch
                  id="appointment-reminders"
                  checked={settings.appointmentReminders}
                  onCheckedChange={(checked) => updateSettings({ appointmentReminders: checked })}
                />
              </div>
              
              <div>
                <Label htmlFor="reminder-time">Temps de rappel (minutes avant)</Label>
                <Input
                  id="reminder-time"
                  type="number"
                  value={settings.reminderTime}
                  onChange={(e) => updateSettings({ reminderTime: parseInt(e.target.value) || 15 })}
                  min="5"
                  max="120"
                  step="5"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Notification Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notification-title">Titre</Label>
              <Input
                id="notification-title"
                value={newNotification.title}
                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                placeholder="Titre de la notification"
              />
            </div>
            
            <div>
              <Label htmlFor="notification-message">Message</Label>
              <Textarea
                id="notification-message"
                value={newNotification.message}
                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                placeholder="Message de la notification"
              />
            </div>
            
            <div>
              <Label htmlFor="notification-type">Type</Label>
              <Select
                value={newNotification.type}
                onValueChange={(value) => setNewNotification({ ...newNotification, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOM">Personnalisé</SelectItem>
                  <SelectItem value="TASK_REMINDER">Rappel de tâche</SelectItem>
                  <SelectItem value="APPOINTMENT_REMINDER">Rappel de rendez-vous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notification-schedule">Planifier pour</Label>
              <Input
                id="notification-schedule"
                type="datetime-local"
                value={newNotification.scheduledFor}
                onChange={(e) => setNewNotification({ ...newNotification, scheduledFor: e.target.value })}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={newNotification.recurring}
                onCheckedChange={(checked) => setNewNotification({ ...newNotification, recurring: checked })}
              />
              <Label htmlFor="recurring">Récurrent</Label>
            </div>
            
            {newNotification.recurring && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequency">Fréquence</Label>
                  <Select
                    value={newNotification.frequency}
                    onValueChange={(value) => setNewNotification({ ...newNotification, frequency: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Quotidien</SelectItem>
                      <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                      <SelectItem value="MONTHLY">Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="interval">Intervalle</Label>
                  <Input
                    id="interval"
                    type="number"
                    value={newNotification.interval}
                    onChange={(e) => setNewNotification({ ...newNotification, interval: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
              </div>
            )}
            
            <Button onClick={createCustomNotification} className="w-full">
              Créer la notification
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}