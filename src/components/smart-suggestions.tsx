"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus, AlertCircle, RefreshCw, Sparkles } from "lucide-react"
import { format, addDays, isSameDay, isAfter, isBefore, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

interface TimeSlot {
  start: string
  end: string
  duration: number
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

interface Task {
  id: string
  title: string
  estimatedDuration?: number
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate?: Date
  completed?: boolean
  date?: string
  time?: string
  description?: string
}

interface Appointment {
  id: string
  title: string
  date: Date
  duration: number
  location?: string
  description?: string
}

interface SmartSuggestionProps {
  tasks: Task[]
  appointments: Appointment[]
  onScheduleTask?: (taskId: string, timeSlot: TimeSlot) => void
}

interface AISuggestion {
  taskId: string
  task: Task
  suggestedSlots: TimeSlot[]
  bestSlot?: TimeSlot
  analysis: string
  totalAvailableTime: number
  totalBusyTime: number
}

export function SmartSuggestions({ tasks, appointments, onScheduleTask }: SmartSuggestionProps) {
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)

  useEffect(() => {
    generateAISuggestions()
  }, [tasks, appointments])

  const generateAISuggestions = async () => {
    const unscheduledTasks = tasks.filter(task => !task.completed && !task.time)
    if (unscheduledTasks.length === 0) {
      setAiSuggestions([])
      return
    }

    setIsGeneratingSuggestions(true)
    try {
      const suggestions: AISuggestion[] = []

      for (const task of unscheduledTasks) {
        const response = await fetch('/api/suggest-slot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tasks: tasks.map(t => ({
              id: t.id,
              title: t.title,
              priority: t.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
              date: t.date,
              time: t.time,
              duration: t.estimatedDuration || 30,
              completed: t.completed || false,
              description: t.description
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
            newTaskDuration: task.estimatedDuration || 30,
            newTaskPriority: task.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
            date: task.dueDate ? task.dueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          }),
        })

        if (response.ok) {
          const data = await response.json()
          suggestions.push({
            taskId: task.id,
            task,
            suggestedSlots: data.suggestedSlots,
            bestSlot: data.bestSlot,
            analysis: data.analysis,
            totalAvailableTime: data.totalAvailableTime,
            totalBusyTime: data.totalBusyTime
          })
        }
      }

      setAiSuggestions(suggestions.slice(0, 5)) // Top 5 suggestions
    } catch (error) {
      console.error('Error generating AI suggestions:', error)
      setAiSuggestions([])
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-100 text-red-800 border-red-200"
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

  const formatTimeSlot = (slot: TimeSlot) => {
    return `${slot.start} - ${slot.end}`
  }

  if (aiSuggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Suggestions intelligentes avec IA
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={generateAISuggestions}
              disabled={isGeneratingSuggestions}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${isGeneratingSuggestions ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isGeneratingSuggestions ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Analyse de votre planning en cours...</span>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Aucune suggestion disponible pour le moment. Ajoutez des tâches sans horaire pour voir des suggestions intelligentes.
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Suggestions intelligentes avec IA
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generateAISuggestions}
            disabled={isGeneratingSuggestions}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isGeneratingSuggestions ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {aiSuggestions.map((suggestion) => (
          <div key={suggestion.taskId} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-medium">{suggestion.task.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getPriorityColor(suggestion.task.priority)}>
                    {suggestion.task.priority === "HIGH" ? "Haute" : 
                     suggestion.task.priority === "MEDIUM" ? "Moyenne" : "Basse"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ~{suggestion.task.estimatedDuration || 30} min
                  </span>
                  {suggestion.task.dueDate && (
                    <span className="text-sm text-muted-foreground">
                      Échéance: {format(suggestion.task.dueDate, "dd MMM", { locale: fr })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{suggestion.analysis}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h5 className="text-sm font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Créneaux suggérés par IA:
              </h5>
              <div className="grid gap-2">
                {suggestion.suggestedSlots.slice(0, 3).map((slot, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {formatTimeSlot(slot)}
                      </span>
                      <Badge variant="outline" className={`text-xs ${getConfidenceColor(slot.confidence)}`}>
                        {slot.confidence === 'high' ? 'Élevée' : 
                         slot.confidence === 'medium' ? 'Moyenne' : 'Faible'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ({slot.duration}min)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onScheduleTask?.(suggestion.taskId, slot)}
                    >
                      <Plus className="h-4 w-4" />
                      Planifier
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            {suggestion.bestSlot && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Meilleur créneau suggéré : {suggestion.bestSlot.start} - {suggestion.bestSlot.end}
                </span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}