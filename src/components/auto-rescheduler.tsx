"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Calendar, 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles,
  Loader2
} from "lucide-react"
import { format, isPast, isToday, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate?: Date
  createdAt: Date
  date?: string
  time?: string
  duration?: number
}

interface Appointment {
  id: string
  title: string
  date: Date
  duration: number
  location?: string
  description?: string
}

interface RescheduleSuggestion {
  taskId: string
  taskTitle: string
  suggestedDate: string
  suggestedTime: string
  confidence: 'high' | 'medium' | 'low'
  reason: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface AutoReschedulerProps {
  tasks: Task[]
  appointments: Appointment[]
  onTaskRescheduled?: (taskId: string, newDate: string, newTime: string) => void
}

export function AutoRescheduler({ tasks, appointments, onTaskRescheduled }: AutoReschedulerProps) {
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [suggestions, setSuggestions] = useState<RescheduleSuggestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [analysis, setAnalysis] = useState("")

  useEffect(() => {
    identifyOverdueTasks()
  }, [tasks])

  const identifyOverdueTasks = () => {
    const now = new Date()
    const overdue = tasks.filter(task => {
      if (task.completed) return false
      
      // Check if task is overdue (has due date in the past)
      if (task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate)) {
        return true
      }
      
      // Check if task was scheduled for today but not completed
      if (task.date && isToday(parseISO(task.date)) && !task.completed) {
        return true
      }
      
      return false
    })
    
    setOverdueTasks(overdue)
  }

  const generateReschedulingSuggestions = async () => {
    if (overdueTasks.length === 0) return
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/reschedule-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: tasks.map(task => ({
            id: task.id,
            title: task.title,
            priority: task.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
            date: task.date,
            time: task.time,
            duration: task.duration || 30,
            completed: task.completed,
            description: task.description,
            dueDate: task.dueDate?.toISOString(),
            overdue: task.dueDate ? isPast(task.dueDate) && !isToday(task.dueDate) : false
          })),
          appointments: appointments.map(appt => ({
            id: appt.id,
            title: appt.title,
            date: appt.date.toISOString().split('T')[0],
            time: appt.date.toTimeString().slice(0, 5),
            duration: appt.duration,
            location: appt.location,
            description: appt.description
          })),
          mode: 'all_overdue'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions)
        setAnalysis(data.analysis)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Error generating rescheduling suggestions:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const acceptSuggestion = (suggestion: RescheduleSuggestion) => {
    onTaskRescheduled?.(suggestion.taskId, suggestion.suggestedDate, suggestion.suggestedTime)
    
    // Remove the suggestion from the list
    setSuggestions(prev => prev.filter(s => s.taskId !== suggestion.taskId))
    
    // Remove the task from overdue tasks
    setOverdueTasks(prev => prev.filter(t => t.id !== suggestion.taskId))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": case "critical": return "bg-red-100 text-red-800 border-red-200"
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "LOW": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high": return "bg-green-100 text-green-800 border-green-200"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (overdueTasks.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Replanification intelligente
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generateReschedulingSuggestions}
            disabled={isGenerating}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {overdueTasks.length} tâche{overdueTasks.length > 1 ? 's' : ''} en retard nécessite{overdueTasks.length > 1 ? 'nt' : ''} une replanification.
            Cliquez sur le bouton de rafraîchissement pour obtenir des suggestions intelligentes.
          </AlertDescription>
        </Alert>

        {showSuggestions && analysis && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{analysis}</p>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Suggestions de replanification
            </h4>
            
            {suggestions.map((suggestion) => (
              <div key={suggestion.taskId} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{suggestion.taskTitle}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority === 'critical' || suggestion.priority === 'high' ? 'Haute' :
                         suggestion.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </Badge>
                      <Badge variant="outline" className={getConfidenceColor(suggestion.confidence)}>
                        Confiance: {suggestion.confidence === 'high' ? 'Élevée' :
                                   suggestion.confidence === 'medium' ? 'Moyenne' : 'Faible'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{format(parseISO(suggestion.suggestedDate), "EEEE dd MMMM", { locale: fr })}</span>
                    <Clock className="h-4 w-4" />
                    <span>{suggestion.suggestedTime}</span>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => acceptSuggestion(suggestion)}
                    className="text-xs"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Accepter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isGenerating && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Génération des suggestions de replanification...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}