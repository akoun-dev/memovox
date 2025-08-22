"use client"

import { useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, AlertTriangle, TrendingUp, Calendar, Target, Users } from "lucide-react"
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

export function DashboardStats() {
  const [tasks] = useState<Task[]>([
    {
      id: "1",
      title: "Préparer la réunion d'équipe",
      description: "Préparer l'agenda et les documents",
      completed: false,
      priority: "HIGH",
      dueDate: new Date(),
      createdAt: new Date()
    },
    {
      id: "2",
      title: "Répondre aux emails",
      description: "Traiter les emails en attente",
      completed: true,
      priority: "MEDIUM",
      dueDate: new Date(),
      createdAt: new Date()
    },
    {
      id: "3",
      title: "Appeler le fournisseur",
      description: "Discuter des nouvelles conditions",
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
    },
    {
      id: "5",
      title: "Préparer la présentation",
      description: "Slides pour le client",
      completed: false,
      priority: "HIGH",
      dueDate: addDays(new Date(), 1),
      createdAt: new Date()
    }
  ])

  const [appointments] = useState<Appointment[]>([
    {
      id: "1",
      title: "Réunion d'équipe",
      description: "Point hebdomadaire",
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
    },
    {
      id: "4",
      title: "Réunion projet",
      description: "Avancement développement",
      location: "Salle B",
      date: new Date(addDays(new Date(), 1).setHours(14, 0, 0, 0)),
      duration: 120,
      createdAt: new Date()
    }
  ])

  // Calculate statistics
  const today = new Date()
  const startToday = startOfDay(today)
  const endToday = endOfDay(today)
  const startTomorrow = startOfDay(addDays(today, 1))
  const endTomorrow = endOfDay(addDays(today, 1))

  const todayTasks = tasks.filter(task => 
    task.dueDate && task.dueDate >= startToday && task.dueDate <= endToday
  )
  
  const tomorrowTasks = tasks.filter(task => 
    task.dueDate && task.dueDate >= startTomorrow && task.dueDate <= endTomorrow
  )

  const overdueTasks = tasks.filter(task => 
    task.dueDate && task.dueDate < startToday && !task.completed
  )

  const upcomingTasks = tasks.filter(task => 
    task.dueDate && task.dueDate > endToday && !task.completed
  )

  const completedTasks = tasks.filter(task => task.completed)
  const totalTasks = tasks.length

  const todayAppointments = appointments.filter(apt => 
    apt.date >= startToday && apt.date <= endToday
  )

  const tomorrowAppointments = appointments.filter(apt => 
    apt.date >= startTomorrow && apt.date <= endTomorrow
  )

  const highPriorityTasks = tasks.filter(task => task.priority === "HIGH" && !task.completed)
  const mediumPriorityTasks = tasks.filter(task => task.priority === "MEDIUM" && !task.completed)
  const lowPriorityTasks = tasks.filter(task => task.priority === "LOW" && !task.completed)

  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

  const todayCompletionRate = todayTasks.length > 0 ? 
    Math.round((todayTasks.filter(t => t.completed).length / todayTasks.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-sm text-muted-foreground">Taux de complétion</p>
              </div>
            </div>
            <Progress value={completionRate} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{todayTasks.length}</p>
                <p className="text-sm text-muted-foreground">Tâches aujourd'hui</p>
              </div>
            </div>
            <div className="mt-3">
              <Progress value={todayCompletionRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {todayTasks.filter(t => t.completed).length} terminées
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{todayAppointments.length}</p>
                <p className="text-sm text-muted-foreground">Rendez-vous aujourd'hui</p>
              </div>
            </div>
            {todayAppointments.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Prochain à {format(todayAppointments[0].date, "HH:mm")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{overdueTasks.length}</p>
                <p className="text-sm text-muted-foreground">Tâches en retard</p>
              </div>
            </div>
            {overdueTasks.length > 0 && (
              <Badge variant="destructive" className="text-xs mt-2">
                Attention
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Répartition des priorités
          </CardTitle>
          <CardDescription>
            Tâches en cours par niveau de priorité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Haute priorité</span>
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                  {highPriorityTasks.length}
                </Badge>
              </div>
              <Progress 
                value={totalTasks > 0 ? (highPriorityTasks.length / totalTasks) * 100 : 0} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Priorité moyenne</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  {mediumPriorityTasks.length}
                </Badge>
              </div>
              <Progress 
                value={totalTasks > 0 ? (mediumPriorityTasks.length / totalTasks) * 100 : 0} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Basse priorité</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  {lowPriorityTasks.length}
                </Badge>
              </div>
              <Progress 
                value={totalTasks > 0 ? (lowPriorityTasks.length / totalTasks) * 100 : 0} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Aujourd'hui
            </CardTitle>
            <CardDescription>
              {format(today, "EEEE dd MMMM", { locale: fr })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tâches</span>
                <span className="text-sm font-medium">{todayTasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Terminées</span>
                <span className="text-sm font-medium text-green-600">
                  {todayTasks.filter(t => t.completed).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rendez-vous</span>
                <span className="text-sm font-medium">{todayAppointments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Temps en réunions</span>
                <span className="text-sm font-medium">
                  {todayAppointments.reduce((total, apt) => total + apt.duration, 0)} min
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Demain
            </CardTitle>
            <CardDescription>
              {format(addDays(today, 1), "EEEE dd MMMM", { locale: fr })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tâches prévues</span>
                <span className="text-sm font-medium">{tomorrowTasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Prioritaires</span>
                <span className="text-sm font-medium text-red-600">
                  {tomorrowTasks.filter(t => t.priority === "HIGH").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rendez-vous</span>
                <span className="text-sm font-medium">{tomorrowAppointments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Temps en réunions</span>
                <span className="text-sm font-medium">
                  {tomorrowAppointments.reduce((total, apt) => total + apt.duration, 0)} min
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Aperçu rapide
          </CardTitle>
          <CardDescription>
            Informations clés sur votre productivité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{upcomingTasks.length}</p>
              <p className="text-sm text-blue-800">Tâches à venir</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
              <p className="text-sm text-green-800">Tâches terminées</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {appointments.filter(apt => apt.date >= startToday).length}
              </p>
              <p className="text-sm text-purple-800">Rendez-vous à venir</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {Math.round(tasks.reduce((total, task) => {
                  return total + (task.completed ? 1 : 0)
                }, 0) / Math.max(1, tasks.length) * 100)}%
              </p>
              <p className="text-sm text-orange-800">Efficacité globale</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}