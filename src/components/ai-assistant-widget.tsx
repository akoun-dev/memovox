"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  TrendingUp,
  Calendar,
  Target,
  X,
  Minimize2,
  Maximize2
} from "lucide-react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: Array<{
    type: string
    data: any
    confidence: number
  }>
}

interface AIAssistantWidgetProps {
  onAction?: (action: { type: string; data: any }) => void
}

export function AIAssistantWidget({ onAction }: AIAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()

  // Suggestions prédéfinies
  const quickActions = [
    "Quelles sont mes tâches prioritaires aujourd'hui ?",
    "Aide-moi à organiser ma journée",
    "Crée une tâche pour préparer la réunion",
    "Analyse ma productivité cette semaine",
    "Suggère-moi des rappels intelligents"
  ]

  useEffect(() => {
    if (isOpen && session) {
      loadSuggestions()
      loadConversationHistory()
    }
  }, [isOpen, session])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadSuggestions = async () => {
    try {
      const response = await fetch('/api/ai-assistant/chat?action=suggestions')
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
    }
  }

  const loadConversationHistory = async () => {
    try {
      const response = await fetch('/api/ai-assistant/chat?action=history')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.history || [])
      }
    } catch (error) {
      console.error('Error loading conversation history:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !session) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          actions: data.actions
        }

        setMessages(prev => [...prev, assistantMessage])

        // Exécuter les actions si nécessaire
        if (data.actions && onAction) {
          data.actions.forEach((action: any) => {
            onAction(action)
          })
        }
      } else {
        throw new Error('Failed to get AI response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: "Désolé, une erreur est survenue. Veuillez réessayer.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    setInputMessage(action)
    setTimeout(() => {
      const form = document.getElementById('chat-form') as HTMLFormElement
      if (form) form.requestSubmit()
    }, 100)
  }

  const clearConversation = async () => {
    try {
      await fetch('/api/ai-assistant/chat', { method: 'DELETE' })
      setMessages([])
    } catch (error) {
      console.error('Error clearing conversation:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create_task': return <Target className="h-4 w-4" />
      case 'create_appointment': return <Calendar className="h-4 w-4" />
      case 'suggest_schedule': return <Clock className="h-4 w-4" />
      case 'analyze_productivity': return <TrendingUp className="h-4 w-4" />
      case 'set_reminder': return <AlertCircle className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'create_task': return 'Créer une tâche'
      case 'create_appointment': return 'Créer un rendez-vous'
      case 'suggest_schedule': return 'Suggérer un planning'
      case 'analyze_productivity': return 'Analyser la productivité'
      case 'set_reminder': return 'Définir un rappel'
      default: return 'Action suggérée'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50 bg-blue-600 hover:bg-blue-700"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className={`p-0 ${isMinimized ? 'max-w-md' : 'max-w-2xl max-h-[80vh]'} w-[95%]`}>
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Assistant IA MemoVox
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {!isMinimized && (
          <div className="flex flex-col h-[70vh]">
            {/* Suggestions rapides */}
            {messages.length === 0 && (
              <Card className="m-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Actions rapides
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 gap-2">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-left justify-start h-auto p-3"
                        onClick={() => handleQuickAction(action)}
                      >
                        <span className="text-sm">{action}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] ${
                      message.role === 'user' ? 'order-1' : ''
                    }`}>
                      <Card className={`${message.role === 'user' ? 'bg-blue-50 border-blue-200' : ''}`}>
                        <CardContent className="p-3">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          
                          {message.actions && message.actions.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <Separator />
                              <p className="text-xs text-muted-foreground mb-2">Actions suggérées:</p>
                              {message.actions.map((action, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start gap-2 h-auto p-2"
                                  onClick={() => onAction?.(action)}
                                >
                                  {getActionIcon(action.type)}
                                  <span className="text-xs">{getActionLabel(action.type)}</span>
                                  <Badge variant="secondary" className="ml-auto text-xs">
                                    {Math.round(action.confidence * 100)}%
                                  </Badge>
                                </Button>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      <p className="text-xs text-muted-foreground mt-1 px-2">
                        {format(message.timestamp, 'HH:mm', { locale: fr })}
                      </p>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <Card className="max-w-[80%]">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-muted-foreground">L'assistant réfléchit...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="border-t p-4">
              <form
                id="chat-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  sendMessage()
                }}
                className="space-y-3"
              >
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Posez-moi une question sur vos tâches, votre productivité..."
                  className="resize-none"
                  rows={2}
                  disabled={isLoading}
                />
                
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearConversation}
                    disabled={messages.length === 0}
                  >
                    Effacer
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Envoyer
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}