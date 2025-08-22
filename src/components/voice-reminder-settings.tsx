"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Volume2, Play, Settings, Clock, Bell } from "lucide-react"
import { useVoiceReminder } from "@/lib/voice-reminder"

interface VoiceReminderSettingsProps {
  onClose?: () => void
}

export function VoiceReminderSettings({ onClose }: VoiceReminderSettingsProps) {
  const { testVoice, updateSettings, getSettings } = useVoiceReminder()
  const [settings, setSettings] = useState(getSettings())
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices()
      const frenchVoices = voices.filter(voice => 
        voice.lang.startsWith('fr') || voice.name.includes('French')
      )
      setAvailableVoices(frenchVoices)
    }

    loadVoices()
    
    // Chrome loads voices asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const handleTestVoice = async () => {
    setIsTesting(true)
    try {
      await testVoice()
    } catch (error) {
      console.error('Error testing voice:', error)
    } finally {
      setIsTesting(false)
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    updateSettings(newSettings)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Rappel vocal quotidien
          </CardTitle>
          <CardDescription>
            Configurez les paramètres du rappel vocal quotidien pour recevoir un résumé de votre journée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminder-enabled">Activer le rappel vocal</Label>
              <p className="text-sm text-muted-foreground">
                Recevez un résumé vocal quotidien de vos tâches et rendez-vous
              </p>
            </div>
            <Switch
              id="reminder-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
            />
          </div>

          {settings.enabled && (
            <>
              {/* Reminder Time */}
              <div className="space-y-2">
                <Label htmlFor="reminder-time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Heure de rappel
                </Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Le rappel sera déclenché tous les jours à cette heure
                </p>
              </div>

              {/* Voice Selection */}
              <div className="space-y-2">
                <Label htmlFor="voice-selection" className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Voix
                </Label>
                <Select value={settings.voice} onValueChange={(value) => handleSettingChange('voice', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une voix" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Voix par défaut</SelectItem>
                    {availableVoices.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choisissez une voix pour le rappel vocal
                </p>
              </div>

              {/* Voice Settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Vitesse</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[settings.rate]}
                      onValueChange={([value]) => handleSettingChange('rate', value)}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="w-12 text-center">
                      {settings.rate}x
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ajustez la vitesse de lecture
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Hauteur</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[settings.pitch]}
                      onValueChange={([value]) => handleSettingChange('pitch', value)}
                      min={0}
                      max={2}
                      step={0.1}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="w-12 text-center">
                      {settings.pitch}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ajustez la hauteur de la voix
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Volume</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[settings.volume]}
                      onValueChange={([value]) => handleSettingChange('volume', value)}
                      min={0}
                      max={1}
                      step={0.1}
                      className="flex-1"
                    />
                    <Badge variant="outline" className="w-12 text-center">
                      {Math.round(settings.volume * 100)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ajustez le volume du rappel
                  </p>
                </div>
              </div>

              {/* Test Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={handleTestVoice}
                  disabled={isTesting}
                  className="w-full gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isTesting ? "Test en cours..." : "Tester la voix"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Comment ça marche ?</strong> Le rappel vocal s'exécute automatiquement tous les jours à l'heure spécifiée. 
          Il récupère vos tâches du jour, vos rendez-vous et vos tâches en retard pour générer un résumé vocal personnalisé. 
          Le rappel fonctionne même si l'application est fermée, tant que le navigateur est ouvert.
        </AlertDescription>
      </Alert>

      {/* Current Settings Summary */}
      {settings.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Résumé des paramètres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Heure de rappel :</span>
              <span className="font-medium">{formatTime(settings.reminderTime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Voix :</span>
              <span className="font-medium">
                {settings.voice === "default" || !settings.voice ? "Voix par défaut" : settings.voice}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vitesse :</span>
              <span className="font-medium">{settings.rate}x</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Volume :</span>
              <span className="font-medium">{Math.round(settings.volume * 100)}%</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}