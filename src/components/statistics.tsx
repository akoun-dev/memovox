"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar,
  Target,
  Brain,
  Download
} from "lucide-react"
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
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

interface StatisticsProps {
  tasks: Task[]
  appointments: Appointment[]
}

export function Statistics({ tasks, appointments }: StatisticsProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    calculateStatistics()
  }, [tasks, appointments, timeRange])

  const calculateStatistics = () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (timeRange) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 })
        endDate = endOfWeek(now, { weekStartsOn: 1 })
        break
      case 'month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0)
        break
    }

    const filteredTasks = tasks.filter(task => 
      isWithinInterval(task.createdAt, { start: startDate, end: endDate })
    )

    const filteredAppointments = appointments.filter(apt => 
      isWithinInterval(apt.createdAt, { start: startDate, end: endDate })
    )

    const completedTasks = filteredTasks.filter(task => task.completed)
    const overdueTasks = filteredTasks.filter(task => 
      task.dueDate && !task.completed && new Date(task.dueDate) < now
    )

    const completionRate = filteredTasks.length > 0 
      ? Math.round((completedTasks.length / filteredTasks.length) * 100) 
      : 0

    const totalEstimatedTime = filteredTasks.reduce((sum, task) => 
      sum + (task.estimatedDuration || 0), 0
    )

    const priorityDistribution = {
      HIGH: filteredTasks.filter(task => task.priority === 'HIGH').length,
      MEDIUM: filteredTasks.filter(task => task.priority === 'MEDIUM').length,
      LOW: filteredTasks.filter(task => task.priority === 'LOW').length
    }

    // Daily completion data for chart
    const dailyData: Array<{
      date: string;
      completed: number;
      total: number;
      completionRate: number;
    }> = []
    for (let i = 0; i < (timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90); i++) {
      const date = subDays(now, i)
      const dayTasks = tasks.filter(task => 
        isWithinInterval(task.createdAt, { 
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate()), 
          end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1) 
        })
      )
      
      const dayCompleted = dayTasks.filter(task => task.completed)
      
      dailyData.unshift({
        date: format(date, 'dd/MM'),
        completed: dayCompleted.length,
        total: dayTasks.length,
        completionRate: dayTasks.length > 0 ? Math.round((dayCompleted.length / dayTasks.length) * 100) : 0
      })
    }

    // Mental load calculation
    const pendingTasks = tasks.filter(task => !task.completed)
    const urgentTasks = pendingTasks.filter(task => 
      task.priority === 'HIGH' || (task.dueDate && new Date(task.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000))
    )
    
    const mentalLoadScore = Math.min(100, 
      (pendingTasks.length * 5) + 
      (urgentTasks.length * 15) + 
      (overdueTasks.length * 20)
    )

    const mentalLoadLevel = mentalLoadScore < 30 ? 'Faible' : 
                           mentalLoadScore < 60 ? 'Modérée' : 
                           mentalLoadScore < 80 ? 'Élevée' : 'Très élevée'

    setStats({
      totalTasks: filteredTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      completionRate,
      totalAppointments: filteredAppointments.length,
      totalEstimatedTime,
      priorityDistribution,
      dailyData,
      mentalLoadScore,
      mentalLoadLevel,
      timeRange
    })
  }

  const getMentalLoadColor = (score: number) => {
    if (score < 30) return 'text-green-600'
    if (score < 60) return 'text-yellow-600'
    if (score < 80) return 'text-orange-600'
    return 'text-red-600'
  }

  const getMentalLoadBgColor = (score: number) => {
    if (score < 30) return 'bg-green-100'
    if (score < 60) return 'bg-yellow-100'
    if (score < 80) return 'bg-orange-100'
    return 'bg-red-100'
  }

  const COLORS = ['#ef4444', '#f59e0b', '#10b981']

  const priorityData = stats ? [
    { name: 'Haute', value: stats.priorityDistribution.HIGH, color: COLORS[0] },
    { name: 'Moyenne', value: stats.priorityDistribution.MEDIUM, color: COLORS[1] },
    { name: 'Basse', value: stats.priorityDistribution.LOW, color: COLORS[2] }
  ] : []

  if (!stats) {
    return <div>Chargement des statistiques...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mes Statistiques</h1>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
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
                <p className="text-sm font-medium text-muted-foreground">Tâches totales</p>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
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
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
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
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rendez-vous</p>
                <p className="text-2xl font-bold">{stats.totalAppointments}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mental Load Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Indice de charge mentale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Charge mentale</span>
              <Badge variant="outline" className={getMentalLoadColor(stats.mentalLoadScore)}>
                {stats.mentalLoadLevel}
              </Badge>
            </div>
            <Progress value={stats.mentalLoadScore} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0</span>
              <span>Score: {stats.mentalLoadScore}/100</span>
              <span>100</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {stats.mentalLoadScore < 30 && "Votre charge mentale est faible. Continuez comme ça !"}
              {stats.mentalLoadScore >= 30 && stats.mentalLoadScore < 60 && "Votre charge mentale est modérée. Pensez à faire des pauses."}
              {stats.mentalLoadScore >= 60 && stats.mentalLoadScore < 80 && "Votre charge mentale est élevée. Envisagez de déléguer ou de reporter des tâches."}
              {stats.mentalLoadScore >= 80 && "Votre charge mentale est très élevée. Il est temps de prendre du recul et de réorganiser vos priorités."}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Completion Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution de la productivité</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="completionRate" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Taux de complétion (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des priorités</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Task Count */}
        <Card>
          <CardHeader>
            <CardTitle>Tâches par jour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#8884d8" name="Total des tâches" />
                <Bar dataKey="completed" fill="#82ca9d" name="Tâches complétées" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>Temps estimé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{Math.round(stats.totalEstimatedTime / 60)}h</div>
                <div className="text-muted-foreground">Temps total estimé</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Haute priorité</span>
                  <span>{Math.round((stats.priorityDistribution.HIGH / stats.totalTasks) * stats.totalEstimatedTime)} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Moyenne priorité</span>
                  <span>{Math.round((stats.priorityDistribution.MEDIUM / stats.totalTasks) * stats.totalEstimatedTime)} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Basse priorité</span>
                  <span>{Math.round((stats.priorityDistribution.LOW / stats.totalTasks) * stats.totalEstimatedTime)} min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.overdueTasks > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Attention</span>
            </div>
            <p className="text-red-700 mt-1">
              Vous avez {stats.overdueTasks} tâche(s) en retard qui nécessitent votre attention.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}