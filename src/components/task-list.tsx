"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Calendar, CheckCircle, Clock, AlertCircle, Edit, Trash2, Plus, Repeat, Sparkles, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useSession } from "next-auth/react"

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate?: string
  createdAt: string
  emoji?: string
  estimatedDuration?: number
  isRecurring?: boolean
  recurringType?: "DAILY" | "WEEKLY" | "MONTHLY"
  recurringInterval?: number
  recurringEndDate?: string
  completedAt?: string
}

interface TaskListProps {
  limit?: number
}

export function TaskList({ limit }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as const,
    dueDate: "",
    emoji: "",
    estimatedDuration: "",
    isRecurring: false,
    recurringType: "DAILY" as "DAILY" | "WEEKLY" | "MONTHLY",
    recurringInterval: 1,
    recurringEndDate: ""
  })
  const [isRewriting, setIsRewriting] = useState(false)
  const [rewriteSuggestions, setRewriteSuggestions] = useState<string[]>([])
  const [showRewriteSuggestions, setShowRewriteSuggestions] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated") {
      fetchTasks()
    } else if (status === "unauthenticated") {
      setLoading(false)
    }
  }, [status])

  const fetchTasks = async () => {
    if (status !== "authenticated") {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      } else if (response.status === 401) {
        console.error('Non autorisé - session expirée')
        // La session sera gérée par AuthWrapper
      } else {
        console.error('Failed to fetch tasks:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const displayTasks = limit ? tasks.slice(0, limit) : tasks

  const toggleTaskCompletion = async (taskId: string) => {
    if (status !== "authenticated") return

    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !task.completed,
          completedAt: !task.completed ? new Date().toISOString() : null
        })
      })

      if (response.ok) {
        await fetchTasks() // Refresh the list
      } else {
        console.error('Failed to update task:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (status !== "authenticated") return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchTasks() // Refresh the list
      } else {
        console.error('Failed to delete task:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleCreateTask = async () => {
    if (status !== "authenticated") return

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          dueDate: newTask.dueDate || null,
          emoji: newTask.emoji || null,
          estimatedDuration: newTask.estimatedDuration ? parseInt(newTask.estimatedDuration) : null,
          isRecurring: newTask.isRecurring,
          recurringType: newTask.isRecurring ? newTask.recurringType : null,
          recurringInterval: newTask.isRecurring ? newTask.recurringInterval : null,
          recurringEndDate: newTask.isRecurring && newTask.recurringEndDate ? newTask.recurringEndDate : null
        })
      })

      if (response.ok) {
        await fetchTasks() // Refresh the list
        
        setNewTask({ 
          title: "", 
          description: "", 
          priority: "MEDIUM", 
          dueDate: "",
          emoji: "",
          estimatedDuration: "",
          isRecurring: false,
          recurringType: "DAILY",
          recurringInterval: 1,
          recurringEndDate: ""
        })
        setIsDialogOpen(false)
      } else {
        console.error('Failed to create task:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleEditTask = async () => {
    if (!editingTask || status !== "authenticated") return
    
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          dueDate: editingTask.dueDate || null,
          emoji: editingTask.emoji || null,
          estimatedDuration: editingTask.estimatedDuration,
          isRecurring: editingTask.isRecurring,
          recurringType: editingTask.isRecurring ? editingTask.recurringType : null,
          recurringInterval: editingTask.isRecurring ? editingTask.recurringInterval : null,
          recurringEndDate: editingTask.isRecurring && editingTask.recurringEndDate ? editingTask.recurringEndDate : null,
          completed: editingTask.completed,
          completedAt: editingTask.completedAt
        })
      })

      if (response.ok) {
        await fetchTasks() // Refresh the list
        setEditingTask(null)
        setIsDialogOpen(false)
      } else {
        console.error('Failed to update task:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const openEditDialog = (task: Task) => {
    setEditingTask(task)
    setIsDialogOpen(true)
    setShowRewriteSuggestions(false)
    setRewriteSuggestions([])
  }

  const rewriteTaskText = async (text: string, mode: 'complete' | 'improve' = 'improve') => {
    if (!text.trim() || status !== "authenticated") return
    
    setIsRewriting(true)
    try {
      const response = await fetch('/api/rewrite-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          mode,
          context: {
            type: 'task',
            priority: editingTask?.priority.toLowerCase() || newTask.priority.toLowerCase(),
            existingTasks: tasks.map(t => t.title)
          }
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRewriteSuggestions([data.rewrittenText, ...data.suggestions])
        setShowRewriteSuggestions(true)
      } else {
        console.error('Failed to rewrite task:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error rewriting task:', error)
    } finally {
      setIsRewriting(false)
    }
  }

  const applyRewriteSuggestion = (suggestion: string) => {
    if (editingTask) {
      setEditingTask({ ...editingTask, title: suggestion })
    } else {
      setNewTask({ ...newTask, title: suggestion })
    }
    setShowRewriteSuggestions(false)
    setRewriteSuggestions([])
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-100 text-red-800 border-red-200"
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "LOW": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "HIGH": return <AlertCircle className="h-4 w-4" />
      case "MEDIUM": return <Clock className="h-4 w-4" />
      case "LOW": return <CheckCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && !tasks.find(t => t.dueDate === dueDate)?.completed
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {status === "loading" ? (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 animate-spin" />
          <p className="text-sm sm:text-base">Chargement...</p>
        </div>
      ) : status === "unauthenticated" ? (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-sm sm:text-base">Veuillez vous connecter pour voir vos tâches</p>
        </div>
      ) : loading ? (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 animate-spin" />
          <p className="text-sm sm:text-base">Chargement des tâches...</p>
        </div>
      ) : displayTasks.length === 0 ? (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-sm sm:text-base">Aucune tâche pour le moment</p>
        </div>
      ) : (
        displayTasks.map((task) => (
          <Card key={task.id} className={`p-3 sm:p-4 ${task.completed ? 'opacity-60' : ''}`}>
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex items-start gap-3 w-full">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {task.emoji && <span className="text-lg">{task.emoji}</span>}
                        <h3 className={`font-medium text-sm sm:text-base ${task.completed ? 'line-through text-muted-foreground' : ''} truncate`}>
                          {task.title}
                        </h3>
                        {task.isRecurring && (
                          <Repeat className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Badge variant="outline" className={`${getPriorityColor(task.priority)} text-xs`}>
                          {getPriorityIcon(task.priority)}
                          <span className="ml-1">
                            {task.priority === "HIGH" ? "Haute" : 
                             task.priority === "MEDIUM" ? "Moyenne" : "Basse"}
                          </span>
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEditDialog(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className={`text-xs sm:text-sm ${task.completed ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className={isOverdue(task.dueDate) ? "text-red-600 font-medium" : "text-muted-foreground"}>
                            {format(new Date(task.dueDate), "dd MMM yyyy", { locale: fr })}
                            {isOverdue(task.dueDate) && " (En retard)"}
                          </span>
                        </div>
                      )}
                      
                      {task.estimatedDuration && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>~{task.estimatedDuration} min</span>
                        </div>
                      )}
                      
                      {task.isRecurring && task.recurringType && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Repeat className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>
                            {task.recurringType === "DAILY" ? "Quotidien" :
                             task.recurringType === "WEEKLY" ? "Hebdomadaire" : "Mensuel"}
                            {task.recurringInterval && task.recurringInterval > 1 && ` (tous les ${task.recurringInterval})`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      
      {!limit && status === "authenticated" && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] w-[95%] sm:w-full mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingTask ? "Modifier la tâche" : "Nouvelle tâche"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium">Titre</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={editingTask ? editingTask.title : newTask.title}
                      onChange={(e) => {
                        if (editingTask) {
                          setEditingTask({ ...editingTask, title: e.target.value })
                        } else {
                          setNewTask({ ...newTask, title: e.target.value })
                        }
                      }}
                      placeholder="Titre de la tâche"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rewriteTaskText(editingTask ? editingTask.title : newTask.title)}
                      disabled={isRewriting || !(editingTask ? editingTask.title : newTask.title).trim()}
                      className="px-3 h-10 w-10 sm:w-auto"
                    >
                      {isRewriting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingTask ? editingTask.description || "" : newTask.description}
                  onChange={(e) => {
                    if (editingTask) {
                      setEditingTask({ ...editingTask, description: e.target.value })
                    } else {
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                  }}
                  placeholder="Description de la tâche"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Priorité</label>
                <Select
                  value={editingTask ? editingTask.priority : newTask.priority}
                  onValueChange={(value) => {
                    if (editingTask) {
                      setEditingTask({ ...editingTask, priority: value as any })
                    } else {
                      setNewTask({ ...newTask, priority: value as any })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Basse</SelectItem>
                    <SelectItem value="MEDIUM">Moyenne</SelectItem>
                    <SelectItem value="HIGH">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Date d'échéance</label>
                <Input
                  type="date"
                  value={editingTask ? 
                    editingTask.dueDate ? editingTask.dueDate.split('T')[0] : "" : 
                    newTask.dueDate
                  }
                  onChange={(e) => {
                    if (editingTask) {
                      setEditingTask({ 
                        ...editingTask, 
                        dueDate: e.target.value ? new Date(e.target.value) : undefined 
                      })
                    } else {
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                  }}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Emoji (optionnel)</label>
                <Input
                  value={editingTask ? editingTask.emoji || "" : newTask.emoji}
                  onChange={(e) => {
                    if (editingTask) {
                      setEditingTask({ ...editingTask, emoji: e.target.value })
                    } else {
                      setNewTask({ ...newTask, emoji: e.target.value })
                    }
                  }}
                  placeholder="📝"
                  maxLength={2}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Durée estimée (minutes)</label>
                <Input
                  type="number"
                  value={editingTask ? editingTask.estimatedDuration?.toString() || "" : newTask.estimatedDuration}
                  onChange={(e) => {
                    if (editingTask) {
                      setEditingTask({ ...editingTask, estimatedDuration: e.target.value ? parseInt(e.target.value) : undefined })
                    } else {
                      setNewTask({ ...newTask, estimatedDuration: e.target.value })
                    }
                  }}
                  placeholder="30"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingTask ? editingTask.isRecurring || false : newTask.isRecurring}
                    onCheckedChange={(checked) => {
                      if (editingTask) {
                        setEditingTask({ ...editingTask, isRecurring: checked })
                      } else {
                        setNewTask({ ...newTask, isRecurring: checked })
                      }
                    }}
                  />
                  <Label>Tâche récurrente</Label>
                </div>
                
                {(editingTask?.isRecurring || newTask.isRecurring) && (
                  <div className="space-y-3 ml-6 border-l-2 border-gray-200 pl-4">
                    <div>
                      <label className="text-sm font-medium">Type de récurrence</label>
                      <Select
                        value={editingTask ? editingTask.recurringType || "DAILY" : newTask.recurringType}
                        onValueChange={(value) => {
                          if (editingTask) {
                            setEditingTask({ ...editingTask, recurringType: value as any })
                          } else {
                            setNewTask({ ...newTask, recurringType: value as any })
                          }
                        }}
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
                      <label className="text-sm font-medium">Intervalle</label>
                      <Input
                        type="number"
                        min="1"
                        value={editingTask ? editingTask.recurringInterval?.toString() || "1" : newTask.recurringInterval.toString()}
                        onChange={(e) => {
                          if (editingTask) {
                            setEditingTask({ ...editingTask, recurringInterval: parseInt(e.target.value) || 1 })
                          } else {
                            setNewTask({ ...newTask, recurringInterval: parseInt(e.target.value) || 1 })
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Date de fin (optionnel)</label>
                      <Input
                        type="date"
                        value={editingTask ? 
                          editingTask.recurringEndDate ? editingTask.recurringEndDate.split('T')[0] : "" : 
                          newTask.recurringEndDate
                        }
                        onChange={(e) => {
                          if (editingTask) {
                            setEditingTask({ 
                              ...editingTask, 
                              recurringEndDate: e.target.value ? new Date(e.target.value) : undefined 
                            })
                          } else {
                            setNewTask({ ...newTask, recurringEndDate: e.target.value })
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {showRewriteSuggestions && rewriteSuggestions.length > 0 && (
                <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Suggestions d'amélioration
                  </h4>
                  <div className="space-y-1">
                    {rewriteSuggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        onClick={() => applyRewriteSuggestion(suggestion)}
                        className="w-full justify-start text-left h-auto p-2"
                      >
                        <span className="text-sm">{suggestion}</span>
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRewriteSuggestions(false)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Masquer les suggestions
                  </Button>
                </div>
              )}
              
              <Button 
                onClick={editingTask ? handleEditTask : handleCreateTask}
                className="w-full"
              >
                {editingTask ? "Modifier la tâche" : "Créer la tâche"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}