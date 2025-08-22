"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Bell, Volume2, Clock, Settings } from "lucide-react"
import { VoiceReminderService } from "@/lib/voice-reminder-service"

interface VoiceReminderToggleProps {
  className?: string
}

export function VoiceReminderToggle({ className }: VoiceReminderToggleProps) {
  const [service] = useState(() => VoiceReminderService.getInstance())
  const [settings, setSettings] = useState(service.getSettings())
  const [nextReminderTime, setNextReminderTime] = useState<Date | null>(null)

  useEffect(() => {
    const updateSettings = () => {
      setSettings(service.getSettings())
      
      if (settings.enabled) {
        const now = new Date()
        const [hours, minutes] = settings.reminderTime.split(':').map(Number)
        
        const reminderTime = new Date()
        reminderTime.setHours(hours, minutes, 0, 0)
        
        if (reminderTime <= now) {
          reminderTime.setDate(reminderTime.getDate() + 1)
        }
        
        setNextReminderTime(reminderTime)
      } else {
        setNextReminderTime(null)
      }
    }

    updateSettings()
    
    const handleSettingsUpdate = () => {
      updateSettings()
    }

    window.addEventListener('voiceReminderSettingsUpdate', handleSettingsUpdate)
    return () => window.removeEventListener('voiceReminderSettingsUpdate', handleSettingsUpdate)
  }, [service, settings.enabled, settings.reminderTime])

  const handleToggle = (enabled: boolean) => {
    service.updateSettings({ ...settings, enabled })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    return `${hours}h${minutes}`
  }

  const getTimeUntilNextReminder = () => {
    if (!nextReminderTime) return ""
    
    const now = new Date()
    const diff = nextReminderTime.getTime() - now.getTime()
    
    if (diff <= 0) return "Maintenant"
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`
    } else {
      return `${minutes}min`
    }
  }

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {settings.enabled && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="font-medium">Rappel Vocal Quotidien</span>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={handleToggle}
              />
            </div>
            
            {settings.enabled && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-3 w-3" />
                  <span>Prochain rappel : {formatTime(settings.reminderTime)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Volume2 className="h-3 w-3" />
                  <span>{getTimeUntilNextReminder()}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={settings.voiceEnabled ? "default" : "secondary"}>
                    {settings.voiceEnabled ? "Voix activée" : "Voix désactivée"}
                  </Badge>
                </div>
              </div>
            )}
            
            <div className="pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2"
                onClick={() => {
                  // Open settings dialog (this would be handled by parent component)
                  window.dispatchEvent(new CustomEvent('openVoiceReminderSettings'))
                }}
              >
                <Settings className="h-3 w-3" />
                Paramètres
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}