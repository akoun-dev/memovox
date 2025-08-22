"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Volume2, Play, Settings, Clock, Bell, BellOff } from "lucide-react"
import { useVoiceReminder } from "@/hooks/use-voice-reminder"
import { VoiceReminderSettings } from "@/components/voice-reminder-settings"
import { voiceReminderService } from "@/lib/voice-reminder"

interface VoiceReminderStatusProps {
  compact?: boolean
}

export function VoiceReminderStatus({ compact = false }: VoiceReminderStatusProps) {
  const [settings, setSettings] = useState(voiceReminderService.getSettings())
  const [isTesting, setIsTesting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    // Update settings when they change
    const interval = setInterval(() => {
      setSettings(voiceReminderService.getSettings())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleTestVoice = async () => {
    setIsTesting(true)
    try {
      await voiceReminderService.testVoice()
    } catch (error) {
      console.error('Error testing voice:', error)
    } finally {
      setIsTesting(false)
    }
  }

  const toggleEnabled = (enabled: boolean) => {
    voiceReminderService.updateSettings({ enabled })
    setSettings(voiceReminderService.getSettings())
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }

  const getNextReminderTime = () => {
    const now = new Date()
    const [hours, minutes] = settings.reminderTime.split(':').map(Number)
    
    const nextReminder = new Date(now)
    nextReminder.setHours(hours, minutes, 0, 0)
    
    // If the time has already passed today, schedule for tomorrow
    if (nextReminder <= now) {
      nextReminder.setDate(nextReminder.getDate() + 1)
    }
    
    return nextReminder
  }

  const getNextReminderText = () => {
    const next = getNextReminderTime()
    const now = new Date()
    const diffMs = next.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24)
      return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`
    } else if (diffHours > 0) {
      return `Dans ${diffHours}h ${diffMinutes}min`
    } else if (diffMinutes > 0) {
      return `Dans ${diffMinutes}min`
    } else {
      return "Maintenant"
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          {settings.enabled ? (
            <Bell className="h-4 w-4 text-green-600" />
          ) : (
            <BellOff className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-sm text-muted-foreground">
            {settings.enabled ? `Rappel à ${formatTime(settings.reminderTime)}` : "Rappel désactivé"}
          </span>
        </div>
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Paramètres du rappel vocal</DialogTitle>
            </DialogHeader>
            <VoiceReminderSettings onClose={() => setShowSettings(false)} />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Rappel vocal quotidien
        </CardTitle>
        <CardDescription>
          Recevez un résumé vocal de votre journée tous les jours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.enabled ? (
              <Bell className="h-4 w-4 text-green-600" />
            ) : (
              <BellOff className="h-4 w-4 text-gray-400" />
            )}
            <span className="font-medium">
              {settings.enabled ? "Activé" : "Désactivé"}
            </span>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={toggleEnabled}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Next Reminder */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Prochain rappel</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatTime(settings.reminderTime)}</div>
                <div className="text-xs text-muted-foreground">
                  {getNextReminderText()}
                </div>
              </div>
            </div>

            {/* Voice Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <span className="text-sm">Voix</span>
              </div>
              <Badge variant="outline">
                {settings.voice || "Voix par défaut"}
              </Badge>
            </div>

            {/* Test Button */}
            <Button
              onClick={handleTestVoice}
              disabled={isTesting}
              className="w-full gap-2"
            >
              <Play className="h-4 w-4" />
              {isTesting ? "Test en cours..." : "Tester la voix"}
            </Button>
          </>
        )}

        {/* Settings Button */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Settings className="h-4 w-4" />
              Paramètres avancés
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Paramètres du rappel vocal</DialogTitle>
            </DialogHeader>
            <VoiceReminderSettings onClose={() => setShowSettings(false)} />
          </DialogContent>
        </Dialog>

        {/* Info */}
        {settings.enabled && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg">
            <strong>Comment ça marche ?</strong> Le rappel vocal s'exécute automatiquement tous les jours à {formatTime(settings.reminderTime)}. 
            Il récupère vos tâches du jour, vos rendez-vous et vos tâches en retard pour générer un résumé vocal personnalisé.
          </div>
        )}
      </CardContent>
    </Card>
  )
}