"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertCircle } from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

interface Task {
  id: string
  title: string
  completed: boolean
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate?: Date
  emoji?: string
}

interface Appointment {
  id: string
  title: string
  date: Date
  duration: number
  emoji?: string
}

interface CalendarViewProps {
  tasks: Task[]
  appointments: Appointment[]
  onDateClick?: (date: Date) => void
}

export function CalendarView({ tasks, appointments, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getEventsForDate = (date: Date) => {
    const dayTasks = tasks.filter(task => 
      task.dueDate && isSameDay(new Date(task.dueDate), date)
    )
    
    const dayAppointments = appointments.filter(apt => 
      isSameDay(new Date(apt.date), date)
    )

    return { tasks: dayTasks, appointments: dayAppointments }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-100 text-red-800 border-red-200"
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "LOW": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getEventCount = (date: Date) => {
    const events = getEventsForDate(date)
    return events.tasks.length + events.appointments.length
  }

  const hasOverdueTasks = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return tasks.some(task => 
      task.dueDate && 
      isSameDay(new Date(task.dueDate), date) && 
      !task.completed &&
      new Date(task.dueDate) < today
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
  }

  const getDayName = (date: Date) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    return days[date.getDay()]
  }

  const getWeeks = () => {
    const weeks: Date[][] = []
    let currentWeek: Date[] = []
    
    // Add empty cells for days before the first day of the month
    const firstDay = monthStart.getDay()
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(new Date(monthStart.getTime() - (firstDay - i) * 24 * 60 * 60 * 1000))
    }
    
    // Add all days of the month
    for (const day of daysInMonth) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
      currentWeek.push(day)
    }
    
    // Add empty cells for days after the last day of the month
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        const lastDay = currentWeek[currentWeek.length - 1]
        currentWeek.push(new Date(lastDay.getTime() + 24 * 60 * 60 * 1000))
      }
      weeks.push(currentWeek)
    }
    
    return weeks
  }

  const weeks = getWeeks()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Vue calendrier
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[150px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: fr })}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((date, index) => {
            const isCurrentMonth = isSameMonth(date, currentDate)
            const isToday = isSameDay(date, new Date())
            const events = getEventsForDate(date)
            const eventCount = getEventCount(date)
            const hasOverdue = hasOverdueTasks(date)
            
            return (
              <div
                key={index}
                className={`
                  min-h-[80px] p-1 border rounded cursor-pointer transition-colors
                  ${isCurrentMonth ? 'bg-background' : 'bg-muted/50'}
                  ${isToday ? 'border-primary' : 'border-border'}
                  hover:bg-muted/50
                `}
                onClick={() => onDateClick?.(date)}
              >
                <div className="flex flex-col h-full">
                  <div className={`
                    text-sm font-medium rounded w-6 h-6 flex items-center justify-center
                    ${isToday ? 'bg-primary text-primary-foreground' : ''}
                    ${!isCurrentMonth ? 'text-muted-foreground' : ''}
                  `}>
                    {date.getDate()}
                  </div>
                  
                  {eventCount > 0 && (
                    <div className="flex-1 flex flex-col gap-1 mt-1">
                      {events.tasks.slice(0, 2).map((task) => (
                        <div
                          key={task.id}
                          className={`
                            text-xs p-1 rounded truncate flex items-center gap-1
                            ${task.completed ? 'line-through opacity-60' : ''}
                            ${getPriorityColor(task.priority)}
                          `}
                        >
                          {task.emoji && <span>{task.emoji}</span>}
                          <span className="truncate">{task.title}</span>
                        </div>
                      ))}
                      
                      {events.appointments.slice(0, 1).map((apt) => (
                        <div
                          key={apt.id}
                          className="text-xs p-1 rounded truncate bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1"
                        >
                          {apt.emoji && <span>{apt.emoji}</span>}
                          <Clock className="h-3 w-3" />
                          <span className="truncate">{apt.title}</span>
                        </div>
                      ))}
                      
                      {eventCount > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{eventCount - 3} plus
                        </div>
                      )}
                    </div>
                  )}
                  
                  {hasOverdue && (
                    <div className="flex items-center justify-center mt-1">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>Tâche haute priorité</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>Tâche moyenne priorité</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Tâche basse priorité</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Rendez-vous</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}