"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Clock, 
  Brain,
  Save,
  RotateCcw
} from "lucide-react"

interface UserPreferences {
  name: string
  language: 'fr' | 'en'
  theme: 'light' | 'dark' | 'auto'
  workingHours: {
    start: string
    end: string
  }
  notifications: {
    email: boolean
    push: boolean
    sound: boolean
    dailySummary: boolean
    taskReminders: boolean
  }
  aiFeatures: {
    enabled: boolean
    autoSuggestions: boolean
    voiceRecognition: boolean
    smartRescheduling: boolean
    learningMode: boolean
  }
  privacy: {
    dataCollection: boolean
    analytics: boolean
    personalizedAds: boolean
  }
}

const defaultPreferences: UserPreferences = {
  name: 'Utilisateur',
  language: 'fr',
  theme: 'auto',
  workingHours: {
    start: '09:00',
    end: '18:00'
  },
  notifications: {
    email: true,
    push: true,
    sound: true,
    dailySummary: true,
    taskReminders: true
  },
  aiFeatures: {
    enabled: true,
    autoSuggestions: true,
    voiceRecognition: true,
    smartRescheduling: true,
    learningMode: true
  },
  privacy: {
    dataCollection: true,
    analytics: false,
    personalizedAds: false
  }
}

interface UserPreferencesProps {
  onPreferencesChange?: (preferences: UserPreferences) => void
}

export function UserPreferences({ onPreferencesChange }: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Load preferences from localStorage
    const savedPreferences = localStorage.getItem('memoVoxPreferences')
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences)
        setPreferences({ ...defaultPreferences, ...parsed })
      } catch (error) {
        console.error('Error loading preferences:', error)
      }
    }
  }, [])

  const updatePreference = (path: string[], value: any) => {
    setPreferences(prev => {
      const newPref = { ...prev }
      let current: any = newPref
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]]
      }
      
      current[path[path.length - 1]] = value
      setHasChanges(true)
      return newPref
    })
  }

  const savePreferences = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem('memoVoxPreferences', JSON.stringify(preferences))
      onPreferencesChange?.(preferences)
      setHasChanges(false)
      
      // Show success feedback
      setTimeout(() => {
        alert('Préférences sauvegardées avec succès !')
      }, 100)
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Erreur lors de la sauvegarde des préférences')
    } finally {
      setIsSaving(false)
    }
  }

  const resetPreferences = () => {
    setPreferences(defaultPreferences)
    setHasChanges(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Préférences utilisateur</h2>
          <p className="text-muted-foreground">
            Personnalisez votre expérience MemoVox
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={resetPreferences}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          )}
          <Button 
            onClick={savePreferences} 
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil
          </CardTitle>
          <CardDescription>
            Informations personnelles et de base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom d'utilisateur</Label>
              <Input
                id="name"
                value={preferences.name}
                onChange={(e) => updatePreference(['name'], e.target.value)}
                placeholder="Votre nom"
              />
            </div>
            <div>
              <Label htmlFor="language">Langue</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => updatePreference(['language'], value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="theme">Thème</Label>
            <Select
              value={preferences.theme}
              onValueChange={(value) => updatePreference(['theme'], value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Clair</SelectItem>
                <SelectItem value="dark">Sombre</SelectItem>
                <SelectItem value="auto">Automatique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Heures de travail
          </CardTitle>
          <CardDescription>
            Définissez vos heures de travail pour les suggestions intelligentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workStart">Heure de début</Label>
              <Input
                id="workStart"
                type="time"
                value={preferences.workingHours.start}
                onChange={(e) => updatePreference(['workingHours', 'start'], e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="workEnd">Heure de fin</Label>
              <Input
                id="workEnd"
                type="time"
                value={preferences.workingHours.end}
                onChange={(e) => updatePreference(['workingHours', 'end'], e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Gérez vos préférences de notification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifications email</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications par email
                </p>
              </div>
              <Switch
                checked={preferences.notifications.email}
                onCheckedChange={(checked) => updatePreference(['notifications', 'email'], checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Notifications push</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications sur votre appareil
                </p>
              </div>
              <Switch
                checked={preferences.notifications.push}
                onCheckedChange={(checked) => updatePreference(['notifications', 'push'], checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Sons des notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Jouer un son pour les notifications
                </p>
              </div>
              <Switch
                checked={preferences.notifications.sound}
                onCheckedChange={(checked) => updatePreference(['notifications', 'sound'], checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Résumé quotidien</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir un résumé quotidien par IA
                </p>
              </div>
              <Switch
                checked={preferences.notifications.dailySummary}
                onCheckedChange={(checked) => updatePreference(['notifications', 'dailySummary'], checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Rappels de tâches</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications pour les tâches à venir
                </p>
              </div>
              <Switch
                checked={preferences.notifications.taskReminders}
                onCheckedChange={(checked) => updatePreference(['notifications', 'taskReminders'], checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Fonctionnalités IA
          </CardTitle>
          <CardDescription>
            Personnalisez les fonctionnalités d'intelligence artificielle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Activer l'IA</Label>
                <p className="text-sm text-muted-foreground">
                  Activer toutes les fonctionnalités IA
                </p>
              </div>
              <Switch
                checked={preferences.aiFeatures.enabled}
                onCheckedChange={(checked) => updatePreference(['aiFeatures', 'enabled'], checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Suggestions automatiques</Label>
                <p className="text-sm text-muted-foreground">
                  Suggestions intelligentes de planification
                </p>
              </div>
              <Switch
                checked={preferences.aiFeatures.autoSuggestions}
                onCheckedChange={(checked) => updatePreference(['aiFeatures', 'autoSuggestions'], checked)}
                disabled={!preferences.aiFeatures.enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Reconnaissance vocale</Label>
                <p className="text-sm text-muted-foreground">
                Création de tâches par voix
                </p>
              </div>
              <Switch
                checked={preferences.aiFeatures.voiceRecognition}
                onCheckedChange={(checked) => updatePreference(['aiFeatures', 'voiceRecognition'], checked)}
                disabled={!preferences.aiFeatures.enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Replanification intelligente</Label>
                <p className="text-sm text-muted-foreground">
                  Replanification automatique des tâches en retard
                </p>
              </div>
              <Switch
                checked={preferences.aiFeatures.smartRescheduling}
                onCheckedChange={(checked) => updatePreference(['aiFeatures', 'smartRescheduling'], checked)}
                disabled={!preferences.aiFeatures.enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Mode d'apprentissage</Label>
                <p className="text-sm text-muted-foreground">
                  L'IA apprend de vos habitudes
                </p>
              </div>
              <Switch
                checked={preferences.aiFeatures.learningMode}
                onCheckedChange={(checked) => updatePreference(['aiFeatures', 'learningMode'], checked)}
                disabled={!preferences.aiFeatures.enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Confidentialité et sécurité
          </CardTitle>
          <CardDescription>
            Gérez vos paramètres de confidentialité
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Collecte de données</Label>
                <p className="text-sm text-muted-foreground">
                  Permettre la collecte de données pour améliorer l'IA
                </p>
              </div>
              <Switch
                checked={preferences.privacy.dataCollection}
                onCheckedChange={(checked) => updatePreference(['privacy', 'dataCollection'], checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Analytiques</Label>
                <p className="text-sm text-muted-foreground">
                  Données d'utilisation anonymes
                </p>
              </div>
              <Switch
                checked={preferences.privacy.analytics}
                onCheckedChange={(checked) => updatePreference(['privacy', 'analytics'], checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Publicités personnalisées</Label>
                <p className="text-sm text-muted-foreground">
                  Publicités basées sur votre utilisation
                </p>
              </div>
              <Switch
                checked={preferences.privacy.personalizedAds}
                onCheckedChange={(checked) => updatePreference(['privacy', 'personalizedAds'], checked)}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Vos données</h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Exporter mes données
              </Button>
              <Button variant="outline" size="sm">
                Supprimer mon compte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      {hasChanges && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
          <span className="text-sm text-yellow-800">
            Des modifications n'ont pas été sauvegardées
          </span>
        </div>
      )}
    </div>
  )
}