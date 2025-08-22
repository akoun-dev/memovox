"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Volume2, VolumeX, CheckCircle, AlertCircle } from "lucide-react"

interface VoiceTaskInputProps {
  onTaskCreated?: (task: { 
    title: string; 
    description?: string; 
    priority?: string;
    date?: string;
    time?: string;
    duration?: number;
    type?: string;
  }) => void
}

export function VoiceTaskInput({ onTaskCreated }: VoiceTaskInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [extractedTask, setExtractedTask] = useState<{
    title: string
    description?: string
    priority?: string
    date?: string
    time?: string
    duration?: number
    type?: string
    confidence?: number
  } | null>(null)

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in (window as any) || 'SpeechRecognition' in (window as any)) {
      setIsSupported(true)
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'fr-FR'
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }
        
        setTranscript(finalTranscript + interimTranscript)
      }
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
      
      recognitionInstance.onend = () => {
        if (isListening) {
          recognitionInstance.start()
        }
      }
      
      setRecognition(recognitionInstance)
      recognitionRef.current = recognitionInstance
    }
  }, [])

  const startListening = () => {
    if (recognition && !isListening) {
      setTranscript("")
      setExtractedTask(null)
      recognition.start()
      setIsListening(true)
    }
  }

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop()
      setIsListening(false)
      processTranscript(transcript)
    }
  }

  const processTranscript = async (text: string) => {
    if (!text.trim()) return
    
    setIsProcessing(true)
    
    try {
      // Use NLP API for intelligent task extraction
      const response = await fetch('/api/parse-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse NLP')
      }
      
      const parsedData = await response.json()
      
      // Convert API response to our format
      const extractedData = {
        title: parsedData.title,
        description: parsedData.description || undefined,
        priority: parsedData.priority?.toUpperCase() || 'MEDIUM',
        date: parsedData.date,
        time: parsedData.time,
        duration: parsedData.duration,
        type: parsedData.type,
        confidence: 0.9 // High confidence when using AI
      }
      
      setExtractedTask(extractedData)
    } catch (error) {
      console.error('Error processing transcript:', error)
      // Fallback to simple extraction
      const words = text.toLowerCase().split(' ')
      let priority = 'MEDIUM'
      let description = undefined
      
      if (words.some(w => w.includes('urgent') || w.includes('important') || w.includes('immédiat'))) {
        priority = 'HIGH'
      } else if (words.some(w => w.includes('plus tard') || w.includes('quand possible') || w.includes('si temps'))) {
        priority = 'LOW'
      }
      
      const extractedData = {
        title: text.charAt(0).toUpperCase() + text.slice(1),
        description,
        priority,
        confidence: 0.5,
        date: undefined,
        time: undefined,
        duration: undefined,
        type: 'task'
      }
      
      setExtractedTask(extractedData)
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmTask = () => {
    if (extractedTask) {
      onTaskCreated?.(extractedTask)
      setDialogOpen(false)
      setTranscript("")
      setExtractedTask(null)
    }
  }

  const resetRecording = () => {
    setTranscript("")
    setExtractedTask(null)
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }
    setIsListening(false)
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "bg-gray-100 text-gray-800 border-gray-200"
    if (confidence >= 0.8) return "bg-green-100 text-green-800 border-green-200"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  const getConfidenceText = (confidence?: number) => {
    if (!confidence) return "Inconnue"
    if (confidence >= 0.8) return "Élevée"
    if (confidence >= 0.6) return "Moyenne"
    return "Faible"
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Mic className="h-4 w-4" />
          Ajouter une tâche vocale
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Ajout de tâche par voix
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!isSupported ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span>
                    La reconnaissance vocale n'est pas supportée par votre navigateur. 
                    Veuillez utiliser Chrome, Edge ou Safari.
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Recording Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Enregistrement vocal</CardTitle>
                  <CardDescription>
                    Cliquez sur le microphone et parlez pour décrire votre tâche
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      className={`rounded-full w-20 h-20 ${
                        isListening 
                          ? "bg-red-600 hover:bg-red-700" 
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                      onClick={isListening ? stopListening : startListening}
                      disabled={isProcessing}
                    >
                      {isListening ? (
                        <MicOff className="h-8 w-8" />
                      ) : (
                        <Mic className="h-8 w-8" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {isListening ? "Écoute en cours..." : "Appuyez pour parler"}
                    </p>
                    {isListening && (
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse delay-150"></div>
                      </div>
                    )}
                  </div>
                  
                  {transcript && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Volume2 className="h-4 w-4" />
                          Transcription
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{transcript}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {isProcessing && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-blue-800">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Analyse de votre demande en cours...</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
              
              {/* Extracted Task */}
              {extractedTask && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Tâche extraite
                    </CardTitle>
                    <CardDescription>
                      Voici la tâche que nous avons comprise
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Titre</label>
                      <p className="text-sm mt-1 p-2 bg-white rounded border">
                        {extractedTask.title}
                      </p>
                    </div>
                    
                    {extractedTask.description && (
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <p className="text-sm mt-1 p-2 bg-white rounded border">
                          {extractedTask.description}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      {extractedTask.date && (
                        <div>
                          <label className="text-sm font-medium">Date</label>
                          <p className="text-sm mt-1 p-2 bg-white rounded border">
                            {new Date(extractedTask.date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      )}
                      
                      {extractedTask.time && (
                        <div>
                          <label className="text-sm font-medium">Heure</label>
                          <p className="text-sm mt-1 p-2 bg-white rounded border">
                            {extractedTask.time}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {extractedTask.duration && (
                        <div>
                          <label className="text-sm font-medium">Durée</label>
                          <p className="text-sm mt-1 p-2 bg-white rounded border">
                            {extractedTask.duration} minutes
                          </p>
                        </div>
                      )}
                      
                      {extractedTask.type && (
                        <div>
                          <label className="text-sm font-medium">Type</label>
                          <Badge 
                            variant="outline" 
                            className={`ml-2 mt-1 ${
                              extractedTask.type === "appointment" 
                                ? "bg-purple-100 text-purple-800 border-purple-200" 
                                : "bg-blue-100 text-blue-800 border-blue-200"
                            }`}
                          >
                            {extractedTask.type === "appointment" ? "Rendez-vous" : "Tâche"}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="text-sm font-medium">Priorité</label>
                        <Badge 
                          variant="outline" 
                          className={`ml-2 ${
                            extractedTask.priority === "HIGH" || extractedTask.priority === "CRITICAL" 
                              ? "bg-red-100 text-red-800 border-red-200" :
                            extractedTask.priority === "MEDIUM" 
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                            "bg-green-100 text-green-800 border-green-200"
                          }`}
                        >
                          {extractedTask.priority === "HIGH" || extractedTask.priority === "CRITICAL" ? "Haute" :
                           extractedTask.priority === "MEDIUM" ? "Moyenne" : "Basse"}
                        </Badge>
                      </div>
                      
                      {extractedTask.confidence && (
                        <div>
                          <label className="text-sm font-medium">Confiance</label>
                          <Badge 
                            variant="outline" 
                            className={`ml-2 ${getConfidenceColor(extractedTask.confidence)}`}
                          >
                            {getConfidenceText(extractedTask.confidence)}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button onClick={confirmTask} className="flex-1">
                        Confirmer la tâche
                      </Button>
                      <Button variant="outline" onClick={resetRecording}>
                        Réenregistrer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conseils pour une meilleure reconnaissance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Parlez clairement et à un rythme normal</li>
                    <li>• Utilisez des phrases complètes</li>
                    <li>• Mentionnez la priorité si nécessaire (ex: "urgent", "important")</li>
                    <li>• Soyez dans un environnement calme</li>
                    <li>• Exemple: "Ajouter une tâche urgente: préparer la réunion de demain"</li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}