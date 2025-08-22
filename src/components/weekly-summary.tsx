"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Target,
  Brain,
  Award,
  BarChart3,
  Download
} from "lucide-react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameWeek, subWeeks } from "date-fns"
import { fr } from "date-fns/locale"

interface Task {
  id: string
  title: string
  completed: boolean
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate?: Date
  createdAt: Date
  completedAt?: Date
  estimatedDuration?: number
}

interface Appointment {
  id: string
  title: string
  date: Date
  duration: number
  createdAt: Date
}

interface WeeklySummaryProps {
  tasks: Task[]
  appointments: Appointment[]
  onExportPDF?: () => void
}

export function WeeklySummary({ tasks, appointments, onExportPDF }: WeeklySummaryProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    calculateWeeklySummary()
  }, [tasks, appointments, currentWeek])

  const calculateWeeklySummary = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
    
    const weekTasks = tasks.filter(task => 
      isSameWeek(task.createdAt, currentWeek, { weekStartsOn: 1 })
    )
    
    const weekAppointments = appointments.filter(apt => 
      isSameWeek(apt.date, currentWeek, { weekStartsOn: 1 })
    )
    
    const completedTasks = weekTasks.filter(task => task.completed)
    const overdueTasks = weekTasks.filter(task => 
      task.dueDate && !task.completed && new Date(task.dueDate) < new Date()
    )
    
    const completionRate = weekTasks.length > 0 
      ? Math.round((completedTasks.length / weekTasks.length) * 100) 
      : 0
    
    // Calculate daily completion
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const dailyStats = daysOfWeek.map(day => {
      const dayTasks = weekTasks.filter(task => 
        task.completedAt && isSameWeek(new Date(task.completedAt), day, { weekStartsOn: 1 })
      )
      const dayAppointments = weekAppointments.filter(apt => 
        isSameWeek(apt.date, day, { weekStartsOn: 1 })
      )
      
      return {
        date: day,
        completedTasks: dayTasks.length,
        appointments: dayAppointments.length,
        totalFocusTime: dayTasks.reduce((sum, task) => sum + (task.estimatedDuration || 0), 0)
      }
    })
    
    // Priority distribution
    const priorityDistribution = {
      HIGH: weekTasks.filter(task => task.priority === 'HIGH').length,
      MEDIUM: weekTasks.filter(task => task.priority === 'MEDIUM').length,
      LOW: weekTasks.filter(task => task.priority === 'LOW').length
    }
    
    // Calculate total focus time
    const totalFocusTime = completedTasks.reduce((sum, task) => sum + (task.estimatedDuration || 0), 0)
    
    // Calculate weekly trends (compare with previous week)
    const prevWeek = subWeeks(currentWeek, 1)
    const prevWeekTasks = tasks.filter(task => 
      isSameWeek(task.createdAt, prevWeek, { weekStartsOn: 1 })
    )
    const prevWeekCompleted = prevWeekTasks.filter(task => task.completed)
    
    const weeklyTrend = {
      taskChange: weekTasks.length - prevWeekTasks.length,
      completionChange: completedTasks.length - prevWeekCompleted.length
    }
    
    // Calculate achievements
    const achievements: Array<{
      icon: string;
      title: string;
      description: string;
    }> = []
    if (completionRate >= 80) achievements.push({ icon: '🏆', title: 'Semaine productive', description: 'Taux de complétion supérieur à 80%' })
    if (completedTasks.length >= 10) achievements.push({ icon: '⭐', title: 'Grand travailleur', description: 'Plus de 10 tâches complétées' })
    if (overdueTasks.length === 0) achievements.push({ icon: '✅', title: 'À jour', description: 'Aucune tâche en retard' })
    if (totalFocusTime >= 600) achievements.push({ icon: '🎯', title: 'Focus master', description: 'Plus de 10h de travail concentré' })
    
    setSummary({
      weekStart,
      weekEnd,
      totalTasks: weekTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      completionRate,
      totalAppointments: weekAppointments.length,
      totalFocusTime,
      priorityDistribution,
      dailyStats,
      weeklyTrend,
      achievements
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
      return newDate
    })
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}min`
    }
    return `${mins}min`
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (value < 0) return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
    return null
  }

  if (!summary) {
    return <div>Chargement du résumé hebdomadaire...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Résumé Hebdomadaire</h1>
          <p className="text-muted-foreground">
            Semaine du {format(summary.weekStart, 'dd MMMM', { locale: fr })} au {format(summary.weekEnd, 'dd MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigateWeek('prev')}>
            Semaine précédente
          </Button>
          <Button variant="outline" onClick={() => navigateWeek('next')}>
            Semaine suivante
          </Button>
          <Button variant="outline" className="gap-2" onClick={onExportPDF}>
            <Download className="h-4 w-4" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tâches créées</p>
                <p className="text-2xl font-bold">{summary.totalTasks}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(summary.weeklyTrend.taskChange)}
                  <span className={`text-sm ${summary.weeklyTrend.taskChange > 0 ? 'text-green-600' : summary.weeklyTrend.taskChange < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {summary.weeklyTrend.taskChange > 0 ? '+' : ''}{summary.weeklyTrend.taskChange} vs semaine dernière
                  </span>
                </div>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tâches complétées</p>
                <p className="text-2xl font-bold">{summary.completedTasks}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(summary.weeklyTrend.completionChange)}
                  <span className={`text-sm ${summary.weeklyTrend.completionChange > 0 ? 'text-green-600' : summary.weeklyTrend.completionChange < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {summary.weeklyTrend.completionChange > 0 ? '+' : ''}{summary.weeklyTrend.completionChange} vs semaine dernière
                  </span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux de complétion</p>
                <p className="text-2xl font-bold">{summary.completionRate}%</p>
                <Progress value={summary.completionRate} className="mt-2" />
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Temps de focus</p>
                <p className="text-2xl font-bold">{formatTime(summary.totalFocusTime)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {Math.round(summary.totalFocusTime / 60)} heures cette semaine
                </p>
              </div>
              <Brain className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progression quotidienne</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.dailyStats.map((day: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-sm font-medium">{format(day.date, 'EEE', { locale: fr })}</div>
                    <div className="text-xs text-muted-foreground">{format(day.date, 'dd/MM')}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{day.completedTasks} tâches</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{day.appointments} RDV</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">{formatTime(day.totalFocusTime)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {day.completedTasks > 0 ? Math.round((day.completedTasks / Math.max(day.completedTasks + day.appointments, 1)) * 100) : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">productivité</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution des priorités</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{summary.priorityDistribution.HIGH}</div>
              <div className="text-sm text-red-800">Haute priorité</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{summary.priorityDistribution.MEDIUM}</div>
              <div className="text-sm text-yellow-800">Moyenne priorité</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.priorityDistribution.LOW}</div>
              <div className="text-sm text-green-800">Basse priorité</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      {summary.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Réalisations cette semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.achievements.map((achievement: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <h4 className="font-medium text-yellow-800">{achievement.title}</h4>
                    <p className="text-sm text-yellow-700">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {summary.overdueTasks > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Attention</span>
            </div>
            <p className="text-red-700 mt-1">
              Vous avez {summary.overdueTasks} tâche(s) en retard qui nécessitent votre attention.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}