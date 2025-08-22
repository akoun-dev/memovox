"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, CheckCircle, Clock, AlertCircle, Edit, Trash2, Plus, Repeat, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { SearchFilter } from "@/components/search-filter"
import { Pagination } from "@/components/pagination"

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

interface FilterState {
  priority: string
  status: string
  dateRange: string
  recurring: string
}

interface TaskListEnhancedProps {
  limit?: number
}

export function TaskListEnhanced({ limit }: TaskListEnhancedProps) {
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

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>({
    priority: "all",
    status: "all",
    dateRange: "all",
    recurring: "all"
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      } else {
        console.error('Failed to fetch tasks')
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Priority filter
      if (filters.priority !== "all" && task.priority !== filters.priority) {
        return false
      }

      // Status filter
      if (filters.status !== "all") {
        if (filters.status === "completed" && !task.completed) return false
        if (filters.status === "pending" && task.completed) return false
        if (filters.status === "overdue") {
          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
          if (!isOverdue) return false
        }
      }

      // Date range filter
      if (filters.dateRange !== "all" && task.dueDate) {
        const taskDate = new Date(task.dueDate)
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        
        switch (filters.dateRange) {
          case "today":
            if (taskDate < today || taskDate >= new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
              return false
            }
            break
          case "week":
            const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000)
            const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
            if (taskDate < weekStart || taskDate >= weekEnd) return false
            break
          case "month":
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1)
            if (taskDate < monthStart || taskDate >= monthEnd) return false
            break
          case "overdue":
            if (!(taskDate < now && !task.completed)) return false
            break
        }
      }

      // Recurring filter
      if (filters.recurring !== "all") {
        if (filters.recurring === "recurring" && !task.isRecurring) return false
        if (filters.recurring === "non-recurring" && task.isRecurring) return false
      }

      return true
    })
  }, [tasks, searchQuery, filters])

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredTasks.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredTasks, currentPage, itemsPerPage])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filters])

  const displayTasks = limit ? paginatedTasks.slice(0, limit) : paginatedTasks

  const toggleTaskCompletion = async (taskId: string) => {
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
        await fetchTasks()
      } else {
        console.error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchTasks()
      } else {
        console.error('Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleCreateTask = async () => {
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
        await fetchTasks()
        
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
        console.error('Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleEditTask = async () => {
    if (!editingTask) return
    
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
        await fetchTasks()
        setEditingTask(null)
        setIsDialogOpen(false)
      } else {
        console.error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const openEditDialog = (task: Task) => {
    setEditingTask(task)
    setIsDialogOpen(true)
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

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({
      priority: "all",
      status: "all",
      dateRange: "all",
      recurring: "all"
    })
    setSearchQuery("")
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      {!limit && (
        <SearchFilter
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          activeFilters={filters}
        />
      )}

      {/* Results count */}
      {!limit && (
        <div className="text-sm text-muted-foreground">
          {filteredTasks.length} tâche{filteredTasks.length !== 1 ? 's' : ''} trouvée{filteredTasks.length !== 1 ? 's' : ''}
          {searchQuery && ` pour "${searchQuery}"`}
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 animate-spin" />
          <p className="text-sm sm:text-base">Chargement des tâches...</p>
        </div>
      ) : displayTasks.length === 0 ? (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-sm sm:text-base">
            {searchQuery || Object.values(filters).some(f => f !== "all") 
              ? "Aucune tâche ne correspond à vos critères" 
              : "Aucune tâche pour le moment"
            }
          </p>
        </div>
      ) : (
        <>
          {displayTasks.map((task) => (
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
          ))}

          {/* Pagination */}
          {!limit && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTasks.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </>
      )}
      
      {/* Add Task Button */}
      {!limit && (
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
              <div>
                <label className="text-sm font-medium">Titre</label>
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
                />
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
                      setEditingTask({ ...editingTask, priority: value as "LOW" | "MEDIUM" | "HIGH" })
                    } else {
                      setNewTask({ ...newTask, priority: value as "LOW" | "MEDIUM" | "HIGH" })
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
                  value={editingTask ? editingTask.dueDate || "" : newTask.dueDate}
                  onChange={(e) => {
                    if (editingTask) {
                      setEditingTask({ ...editingTask, dueDate: e.target.value })
                    } else {
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                  }}
                />
              </div>
              
              <Button 
                onClick={editingTask ? handleEditTask : handleCreateTask}
                className="w-full"
                disabled={!(editingTask ? editingTask.title : newTask.title).trim()}
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