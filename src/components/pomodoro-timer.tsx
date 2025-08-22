"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, Coffee, Brain, CheckCircle } from "lucide-react"

interface PomodoroTimerProps {
  onSessionComplete?: (type: 'work' | 'break', duration: number) => void
}

export function PomodoroTimer({ onSessionComplete }: PomodoroTimerProps) {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentSession, setCurrentSession] = useState<'work' | 'break'>('work')
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [completedSessions, setCompletedSessions] = useState(0)
  const [totalFocusTime, setTotalFocusTime] = useState(0)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const workDuration = 25 * 60 // 25 minutes
  const shortBreakDuration = 5 * 60 // 5 minutes
  const longBreakDuration = 15 * 60 // 15 minutes
  
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 0) {
            handleSessionComplete()
            return 0
          }
          return time - 1
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
  }, [isActive, isPaused])
  
  const handleSessionComplete = () => {
    const sessionDuration = currentSession === 'work' ? workDuration : 
                           (completedSessions + 1) % 4 === 0 ? longBreakDuration : shortBreakDuration
    
    if (currentSession === 'work') {
      setCompletedSessions(prev => prev + 1)
      setTotalFocusTime(prev => prev + workDuration)
    }
    
    onSessionComplete?.(currentSession, sessionDuration)
    
    // Switch to next session
    if (currentSession === 'work') {
      setCurrentSession('break')
      setTimeLeft((completedSessions + 1) % 4 === 0 ? longBreakDuration : shortBreakDuration)
    } else {
      setCurrentSession('work')
      setTimeLeft(workDuration)
    }
    
    setIsActive(false)
    setIsPaused(false)
  }
  
  const startTimer = () => {
    setIsActive(true)
    setIsPaused(false)
  }
  
  const pauseTimer = () => {
    setIsPaused(true)
  }
  
  const resumeTimer = () => {
    setIsPaused(false)
  }
  
  const resetTimer = () => {
    setIsActive(false)
    setIsPaused(false)
    setCurrentSession('work')
    setTimeLeft(workDuration)
  }
  
  const skipSession = () => {
    handleSessionComplete()
  }
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  const getProgress = () => {
    const totalDuration = currentSession === 'work' ? workDuration : 
                         (completedSessions + 1) % 4 === 0 ? longBreakDuration : shortBreakDuration
    return ((totalDuration - timeLeft) / totalDuration) * 100
  }
  
  const getSessionTitle = () => {
    if (currentSession === 'work') {
      return "Session de travail"
    } else {
      return (completedSessions + 1) % 4 === 0 ? "Pause longue" : "Pause courte"
    }
  }
  
  const getSessionIcon = () => {
    if (currentSession === 'work') {
      return <Brain className="h-5 w-5" />
    } else {
      return <Coffee className="h-5 w-5" />
    }
  }
  
  const getSessionColor = () => {
    if (currentSession === 'work') {
      return "text-blue-600"
    } else {
      return "text-green-600"
    }
  }
  
  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Pomodoro Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            {getSessionIcon()}
            <h3 className={`text-lg font-medium ${getSessionColor()}`}>
              {getSessionTitle()}
            </h3>
          </div>
          
          <div className="text-6xl font-mono font-bold">
            {formatTime(timeLeft)}
          </div>
          
          <Progress value={getProgress()} className="w-full max-w-xs mx-auto" />
          
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline">
              {completedSessions} sessions terminées
            </Badge>
            <Badge variant="outline">
              {formatTotalTime(totalFocusTime)} de focus
            </Badge>
          </div>
        </div>
        
        <div className="flex justify-center gap-2">
          {!isActive ? (
            <Button onClick={startTimer} className="gap-2">
              <Play className="h-4 w-4" />
              Commencer
            </Button>
          ) : isPaused ? (
            <Button onClick={resumeTimer} className="gap-2">
              <Play className="h-4 w-4" />
              Reprendre
            </Button>
          ) : (
            <Button onClick={pauseTimer} variant="outline" className="gap-2">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          
          <Button onClick={resetTimer} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
          
          <Button onClick={skipSession} variant="outline" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Passer
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="font-medium text-blue-600">Travail</div>
            <div className="text-blue-800">25 min</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="font-medium text-green-600">Pause courte</div>
            <div className="text-green-800">5 min</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="font-medium text-purple-600">Pause longue</div>
            <div className="text-purple-800">15 min</div>
          </div>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>Après 4 sessions de travail, vous aurez droit à une pause longue de 15 minutes.</p>
        </div>
      </CardContent>
    </Card>
  )
}