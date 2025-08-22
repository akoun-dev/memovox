"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, X, Clock, Target, CheckCircle } from "lucide-react"

interface Task {
  id: string
  title: string
  description?: string
  estimatedDuration?: number
  emoji?: string
}

interface FocusModeProps {
  task: Task
  onComplete?: (taskId: string, actualDuration: number) => void
  onExit?: () => void
}

export function FocusMode({ task, onComplete, onExit }: FocusModeProps) {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [targetTime, setTargetTime] = useState(task.estimatedDuration ? task.estimatedDuration * 60 : 25 * 60)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed((time) => {
          if (time >= targetTime) {
            handleComplete()
            return targetTime
          }
          return time + 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, isPaused, targetTime])
  
  const handleComplete = () => {
    setIsActive(false)
    setIsPaused(false)
    onComplete?.(task.id, timeElapsed)
  }
  
  const startFocus = () => {
    setIsActive(true)
    setIsPaused(false)
  }
  
  const pauseFocus = () => {
    setIsPaused(true)
  }
  
  const resumeFocus = () => {
    setIsPaused(false)
  }
  
  const resetFocus = () => {
    setIsActive(false)
    setIsPaused(false)
    setTimeElapsed(0)
  }
  
  const exitFocus = () => {
    setIsActive(false)
    setIsPaused(false)
    onExit?.()
  }
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  const getProgress = () => {
    return (timeElapsed / targetTime) * 100
  }
  
  const getTimeRemaining = () => {
    return targetTime - timeElapsed
  }
  
  const getFocusStatus = () => {
    if (!isActive) return "Prêt à commencer"
    if (isPaused) return "En pause"
    if (timeElapsed >= targetTime) return "Terminé"
    return "En session"
  }
  
  const getFocusColor = () => {
    if (!isActive) return "text-gray-600"
    if (isPaused) return "text-yellow-600"
    if (timeElapsed >= targetTime) return "text-green-600"
    return "text-blue-600"
  }
  
  const updateTargetTime = (minutes: number) => {
    setTargetTime(minutes * 60)
    if (timeElapsed > minutes * 60) {
      setTimeElapsed(minutes * 60)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Mode Focus
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={exitFocus}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              {task.emoji && <span className="text-2xl">{task.emoji}</span>}
              <h2 className="text-2xl font-bold">{task.title}</h2>
            </div>
            
            {task.description && (
              <p className="text-muted-foreground">{task.description}</p>
            )}
            
            <div className="space-y-2">
              <div className={`text-lg font-medium ${getFocusColor()}`}>
                {getFocusStatus()}
              </div>
              
              <div className="text-6xl font-mono font-bold">
                {formatTime(timeElapsed)}
              </div>
              
              <div className="text-lg text-muted-foreground">
                Restant: {formatTime(getTimeRemaining())}
              </div>
              
              <Progress value={getProgress()} className="w-full max-w-xs mx-auto" />
              
              <div className="text-sm text-muted-foreground">
                {Math.round(getProgress())}% complété
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-2">
            {!isActive ? (
              <Button onClick={startFocus} className="gap-2" size="lg">
                <Play className="h-4 w-4" />
                Commencer la session
              </Button>
            ) : isPaused ? (
              <Button onClick={resumeFocus} className="gap-2" size="lg">
                <Play className="h-4 w-4" />
                Reprendre
              </Button>
            ) : (
              <Button onClick={pauseFocus} variant="outline" className="gap-2" size="lg">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}
            
            <Button onClick={resetFocus} variant="outline" className="gap-2" size="lg">
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
            
            {isActive && (
              <Button onClick={handleComplete} className="gap-2" size="lg">
                <CheckCircle className="h-4 w-4" />
                Terminer
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-center">Durée cible</h4>
            <div className="flex justify-center gap-2">
              {[15, 25, 30, 45, 60].map((minutes) => (
                <Button
                  key={minutes}
                  variant={targetTime === minutes * 60 ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateTargetTime(minutes)}
                >
                  {minutes} min
                </Button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-blue-600">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Temps écoulé</span>
              </div>
              <div className="text-blue-800 font-mono">{formatTime(timeElapsed)}</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-green-600">
                <Target className="h-4 w-4" />
                <span className="font-medium">Temps restant</span>
              </div>
              <div className="text-green-800 font-mono">{formatTime(getTimeRemaining())}</div>
            </div>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Concentrez-vous sur une seule tâche à la fois pour une productivité maximale.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}