"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  MessageSquare, 
  Send, 
  Minimize2, 
  Maximize2, 
  X, 
  Bot, 
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Sparkles,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: Array<{
    label: string
    action: string
    data?: any
  }>
}

interface AssistantWidgetProps {
  tasks?: Array<{
    id: string
    title: string
    completed: boolean
    priority: string
    dueDate?: Date
  }>
  appointments?: Array<{
    id: string
    title: string
    date: Date
    duration: number
  }>
}

export function AssistantWidget({ tasks = [], appointments = [] }: AssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "1",
        type: "assistant",
        content: "Bonjour ! Je suis votre assistant personnel MemoVox. Comment puis-je vous aider aujourd'hui ?",
        timestamp: new Date(),
        actions: [
          { label: "Voir mes tâches", action: "show_tasks" },
          { label: "Voir mes rendez-vous", action: "show_appointments" },
          { label: "Résumé du jour", action: "daily_summary" }
        ]
      }])
    }
  }, [messages.length])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: {
            tasks: tasks.map(task => ({
              id: task.id,
              title: task.title,
              completed: task.completed,
              priority: task.priority,
              dueDate: task.dueDate
            })),
            appointments: appointments.map(appt => ({
              id: appt.id,
              title: appt.title,
              date: appt.date,
              duration: appt.duration
            })),
            currentDateTime: new Date().toISOString()
          }
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: data.response,
          timestamp: new Date(),
          actions: data.actions || []
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error("Failed to get response")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Désolé, je rencontre des difficultés pour répondre. Veuillez réessayer plus tard.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (action: string, data?: any) => {
    switch (action) {
      case "show_tasks":
        const incompleteTasks = tasks.filter(task => !task.completed)
        const taskList = incompleteTasks.length > 0 
          ? incompleteTasks.map(task => `• ${task.title}${task.priority === 'HIGH' ? ' (prioritaire)' : ''}`).join('\n')
          : "Aucune tâche en cours"
        
        const taskMessage: ChatMessage = {
          id: Date.now().toString(),
          type: "assistant",
          content: `Voici vos tâches en cours (${incompleteTasks.length}):\n\n${taskList}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, taskMessage])
        break

      case "show_appointments":
        const todayAppointments = appointments.filter(appt => {
          const today = new Date().toDateString()
          return new Date(appt.date).toDateString() === today
        })
        
        const appointmentList = todayAppointments.length > 0
          ? todayAppointments.map(appt => `• ${appt.title} à ${format(new Date(appt.date), 'HH:mm')}`).join('\n')
          : "Aucun rendez-vous aujourd'hui"
        
        const appointmentMessage: ChatMessage = {
          id: Date.now().toString(),
          type: "assistant",
          content: `Voici vos rendez-vous aujourd'hui (${todayAppointments.length}):\n\n${appointmentList}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, appointmentMessage])
        break

      case "daily_summary":
        handleSendMessage("Donne-moi un résumé de ma journée")
        break

      case "create_task":
        setInputMessage("Créer une nouvelle tâche: ")
        break

      case "schedule_appointment":
        setInputMessage("Planifier un rendez-vous: ")
        break
    }
  }

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: fr })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-100 text-red-800 border-red-200"
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "LOW": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 p-0 shadow-lg"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80' : 'w-96'
    }`}>
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Assistant MemoVox
              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        {!isMinimized && (
          <>
            <CardContent className="p-0">
              <ScrollArea className="h-96 px-4 pb-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        message.type === 'user' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="h-3 w-3 text-blue-600" />
                        ) : (
                          <Bot className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {message.type === 'user' ? 'Vous' : 'Assistant'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <div className="text-sm leading-relaxed">
                          {message.content.split('\n').map((line, index) => (
                            <p key={index} className={index > 0 ? 'mt-1' : ''}>
                              {line}
                            </p>
                          ))}
                        </div>
                        {message.actions && message.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {message.actions.map((action, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleAction(action.action, action.data)}
                                className="text-xs h-7"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-green-100">
                        <Bot className="h-3 w-3 text-green-600" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>L'assistant réfléchit...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <Separator />
              
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Posez-moi une question..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isLoading) {
                        handleSendMessage(inputMessage)
                      }
                    }}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleSendMessage(inputMessage)}
                    disabled={!inputMessage.trim() || isLoading}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSendMessage("Que dois-je faire aujourd'hui ?")}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    Mon journée
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSendMessage("Aide-moi à planifier une tâche")}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    Planifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSendMessage("Quels sont mes créneaux libres ?")}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    Créneaux
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}