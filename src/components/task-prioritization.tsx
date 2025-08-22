"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Zap,
  Calendar,
  Brain
} from "lucide-react"
import { taskPriorityManager } from "@/lib/task-priority"

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate?: Date
  estimatedDuration?: number
  createdAt: Date
}

interface TaskPrioritizationProps {
  tasks: Task[]
  onTaskSelect?: (task: Task) => void
}

export function TaskPrioritization({ tasks, onTaskSelect }: TaskPrioritizationProps) {
  const [recommendations, setRecommendations] = useState<any>(null)
  const [prioritizedTasks, setPrioritizedTasks] = useState<any[]>([])

  useEffect(() => {
    updateRecommendations()
  }, [tasks])

  const updateRecommendations = () => {
    const recs = taskPriorityManager.getTaskRecommendations(tasks)
    const prioritized = taskPriorityManager.prioritizeTasks(tasks)
    setRecommendations(recs)
    setPrioritizedTasks(prioritizedTasks)
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getUrgencyIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      case 'high': return <Clock className="h-4 w-4" />
      case 'medium': return <Target className="h-4 w-4" />
      case 'low': return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}min`
  }

  if (!recommendations) {
    return <div>Chargement des recommandations...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Priorisation intelligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{recommendations.urgentTasks.length}</div>
              <div className="text-sm text-red-800">Tâches urgentes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{recommendations.quickWins.length}</div>
              <div className="text-sm text-green-800">Victoires rapides</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{recommendations.importantTasks.length}</div>
              <div className="text-sm text-blue-800">Tâches importantes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Urgent Tasks */}
      {recommendations.urgentTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Tâches urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.urgentTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge variant="outline" className={getUrgencyColor(task.urgencyLevel)}>
                        {getUrgencyIcon(task.urgencyLevel)}
                        <span className="ml-1 capitalize">{task.urgencyLevel}</span>
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {task.estimatedDuration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(task.estimatedDuration)}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onTaskSelect?.(task)}
                  >
                    Commencer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Wins */}
      {recommendations.quickWins.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Zap className="h-5 w-5" />
              Victoires rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendations.quickWins.map((task: any) => (
                <div key={task.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{task.title}</h4>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      {task.estimatedDuration} min
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                  )}
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => onTaskSelect?.(task)}
                  >
                    Faire maintenant
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Suggestions */}
      {recommendations.scheduleSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Suggestions de planification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.scheduleSuggestions.map((suggestion: any, index: number) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-800">{suggestion.title}</h4>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      {formatDuration(suggestion.estimatedDuration)}
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">{suggestion.description}</p>
                  <div className="space-y-2">
                    {suggestion.tasks.map((task: any, taskIndex: number) => (
                      <div key={taskIndex} className="flex items-center justify-between p-2 bg-white rounded border border-blue-100">
                        <span className="text-sm font-medium">{task.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {task.estimatedDuration} min
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" className="mt-3">
                    Planifier ce bloc
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Priority List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Liste priorisée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {prioritizedTasks.slice(0, 10).map((task: any, index: number) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{task.title}</h4>
                    <Badge variant="outline" className={getUrgencyColor(task.urgencyLevel)}>
                      {getUrgencyIcon(task.urgencyLevel)}
                      <span className="ml-1 capitalize">{task.urgencyLevel}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>Score: {Math.round(task.priorityScore)}</span>
                    {task.estimatedDuration && (
                      <span>{formatDuration(task.estimatedDuration)}</span>
                    )}
                    {task.dueDate && (
                      <span>Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}</span>
                    )}
                  </div>
                </div>
                <Progress value={(task.priorityScore / 300) * 100} className="w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}