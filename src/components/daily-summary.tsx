"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle, Clock, MapPin, AlertTriangle, TrendingUp, Sun, Moon, RefreshCw, Volume2 } from "lucide-react"
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay } from "date-fns"
import { fr } from "date-fns/locale"

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate?: Date
  createdAt: Date
}

interface Appointment {
  id: string
  title: string
  description?: string
  location?: string
  date: Date
  duration: number
  createdAt: Date
}

export function DailySummary() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiTips, setAiTips] = useState<string[]>([])
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Préparer la réunion d'équipe",
      description: "Préparer l'agenda et les documents pour la réunion de lundi",
      completed: false,
      priority: "HIGH",
      dueDate: new Date(),
      createdAt: new Date()
    },
    {
      id: "2",
      title: "Répondre aux emails",
      description: "Traiter les emails en attente dans la boîte de réception",
      completed: true,
      priority: "MEDIUM",
      dueDate: new Date(),
      createdAt: new Date()
    },
    {
      id: "3",
      title: "Appeler le fournisseur",
      description: "Discuter des nouvelles conditions de paiement",
      completed: false,
      priority: "MEDIUM",
      dueDate: new Date(),
      createdAt: new Date()
    },
    {
      id: "4",
      title: "Mettre à jour le portfolio",
      description: "Ajouter les projets récents",
      completed: false,
      priority: "LOW",
      dueDate: addDays(new Date(), 2),
      createdAt: new Date()
    }
  ])

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: "1",
      title: "Réunion d'équipe",
      description: "Point hebdomadaire sur l'avancement des projets",
      location: "Salle de conférence A",
      date: new Date(new Date().setHours(10, 0, 0, 0)),
      duration: 60,
      createdAt: new Date()
    },
    {
      id: "2",
      title: "Déjeuner client",
      description: "Restaurant Le Bernardin",
      location: "12 Rue de la Paix",
      date: new Date(new Date().setHours(12, 30, 0, 0)),
      duration: 90,
      createdAt: new Date()
    },
    {
      id: "3",
      title: "Rendez-vous médical",
      description: "Contrôle annuel",
      location: "Cabinet médique",
      date: new Date(new Date().setHours(16, 0, 0, 0)),
      duration: 30,
      createdAt: new Date()
    }
  ])

  const getTasksForDate = (date: Date) => {
    const start = startOfDay(date)
    const end = endOfDay(date)
    return tasks.filter(task => 
      task.dueDate && task.dueDate >= start && task.dueDate <= end
    )
  }

  const getAppointmentsForDate = (date: Date) => {
    const start = startOfDay(date)
    const end = endOfDay(date)
    return appointments.filter(apt => 
      apt.date >= start && apt.date <= end
    ).sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  const todayTasks = getTasksForDate(selectedDate)
  const todayAppointments = getAppointmentsForDate(selectedDate)

  const completedTasks = todayTasks.filter(task => task.completed).length
  const totalTasks = todayTasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Generate AI summary
  const generateAISummary = async () => {
    if (!isToday(selectedDate)) return // Only generate for today
    
    setIsGeneratingSummary(true)
    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: todayTasks.map(task => ({
            id: task.id,
            title: task.title,
            priority: task.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
            date: task.dueDate ? task.dueDate.toISOString().split('T')[0] : undefined,
            time: task.dueDate ? task.dueDate.toTimeString().slice(0, 5) : undefined,
            duration: 30, // Default duration for tasks
            completed: task.completed,
            description: task.description
          })),
          appointments: todayAppointments.map(appt => ({
            id: appt.id,
            title: appt.title,
            date: appt.date.toISOString().split('T')[0],
            time: appt.date.toTimeString().slice(0, 5),
            duration: appt.duration,
            location: appt.location,
            description: appt.description
          })),
          userName: 'Bernard', // Could be made configurable
          includeTips: true
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAiSummary(data.summary)
        setAiTips(data.tips || [])
      }
    } catch (error) {
      console.error('Error generating AI summary:', error)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  // Text-to-speech function
  const speakSummary = () => {
    if (!aiSummary || isSpeaking) return
    
    setIsSpeaking(true)
    const utterance = new SpeechSynthesisUtterance(aiSummary)
    utterance.lang = 'fr-FR'
    utterance.rate = 0.9
    utterance.pitch = 1
    
    utterance.onend = () => {
      setIsSpeaking(false)
    }
    
    utterance.onerror = () => {
      setIsSpeaking(false)
    }
    
    speechSynthesis.speak(utterance)
  }

  // Generate summary on component mount and when data changes
  useEffect(() => {
    if (isToday(selectedDate)) {
      generateAISummary()
    }
  }, [selectedDate, todayTasks, todayAppointments])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-100 text-red-800 border-red-200"
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "LOW": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return "Aujourd'hui"
    } else if (isTomorrow(date)) {
      return "Demain"
    } else {
      return format(date, "EEEE dd MMMM yyyy", { locale: fr })
    }
  }

  const navigateDate = (days: number) => {
    const newDate = addDays(selectedDate, days)
    setSelectedDate(newDate)
  }

  const getTimeUntilAppointment = (appointmentDate: Date) => {
    const now = new Date()
    const diffMs = appointmentDate.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `Dans ${diffHours}h ${diffMinutes}min`
    } else if (diffMinutes > 0) {
      return `Dans ${diffMinutes}min`
    } else {
      return "Maintenant"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Résumé quotidien</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble de votre journée
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigateDate(-1)}>
            Hier
          </Button>
          <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
            Aujourd'hui
          </Button>
          <Button variant="outline" onClick={() => navigateDate(1)}>
            Demain
          </Button>
        </div>
      </div>

      {/* Date Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {formatDate(selectedDate)}
          </CardTitle>
          <CardDescription>
            {isToday(selectedDate) ? "Votre journée en cours" : "Vue de cette journée"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-sm text-muted-foreground">Taux de complétion</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalTasks}</p>
                <p className="text-sm text-muted-foreground">Tâches prévues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{todayAppointments.length}</p>
                <p className="text-sm text-muted-foreground">Rendez-vous</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Tâches du jour
            </CardTitle>
            <CardDescription>
              {completedTasks} sur {totalTasks} tâches terminées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune tâche prévue pour ce jour</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 border rounded-lg ${
                      task.completed ? 'bg-green-50 border-green-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority === "HIGH" ? "Haute" : 
                         task.priority === "MEDIUM" ? "Moyenne" : "Basse"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Rendez-vous du jour
            </CardTitle>
            <CardDescription>
              {todayAppointments.length} rendez-vous prévus
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun rendez-vous prévu pour ce jour</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-3 border rounded-lg bg-white"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{appointment.title}</h4>
                        {appointment.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {appointment.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(appointment.date, "HH:mm", { locale: fr })} - 
                              {format(new Date(appointment.date.getTime() + appointment.duration * 60000), "HH:mm", { locale: fr })}
                            </span>
                          </div>
                          {appointment.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{appointment.location}</span>
                            </div>
                          )}
                        </div>
                        {isToday(selectedDate) && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {getTimeUntilAppointment(appointment.date)}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Summary */}
      {isToday(selectedDate) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              Résumé intelligent
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={generateAISummary}
                disabled={isGeneratingSummary}
                className="ml-auto"
              >
                <RefreshCw className={`h-4 w-4 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
            <CardDescription>
              Analyse de votre journée par IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isGeneratingSummary ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Génération du résumé en cours...</span>
                </div>
              ) : aiSummary ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{aiSummary}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={speakSummary}
                      disabled={isSpeaking || !aiSummary}
                      className="flex-shrink-0"
                    >
                      <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-blue-600' : ''}`} />
                    </Button>
                  </div>
                  
                  {aiTips.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Conseils du jour :</h4>
                      <ul className="space-y-1">
                        {aiTips.map((tip, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {todayTasks.some(task => task.priority === "HIGH" && !task.completed) && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-800">
                        Attention : Des tâches prioritaires ne sont pas encore terminées
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Sun className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Cliquez sur le bouton de rafraîchissement pour générer un résumé intelligent</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}