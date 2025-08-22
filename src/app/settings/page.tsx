"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Settings, 
  Bell, 
  User, 
  Palette, 
  Shield, 
  Brain, 
  Volume2, 
  Moon, 
  Sun,
  Globe,
  Clock,
  Mic,
  MessageSquare,
  Calendar,
  Target,
  Zap,
  Database,
  Trash2,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { toast } from "sonner"

interface UserSettings {
  theme: "light" | "dark" | "auto"
  language: string
  timezone: string
  dateFormat: string
  timeFormat: "12h" | "24h"
  weekStart: "monday" | "sunday"
}

interface AISettings {
  voiceRecognition: boolean
  smartSuggestions: boolean
  autoCategorization: boolean
  priorityPrediction: boolean
  timeEstimation: boolean
  rewriteAssistance: boolean
  creativityLevel: number
  responseSpeed: "fast" | "balanced" | "thorough"
}

interface VoiceSettings {
  voiceEnabled: boolean
  voiceType: string
  voiceSpeed: number
  voicePitch: number
  dailyReminderTime: string
  reminderDays: number[]
  voiceLanguage: string
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  taskReminders: boolean
  appointmentReminders: boolean
  dailySummary: boolean
  weeklySummary: boolean
  reminderTime: string
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

interface AccountSettings {
  name: string
  email: string
  profilePicture: string
  dataRetention: number
  exportData: boolean
  deleteAccount: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState("general")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Settings states
  const [userSettings, setUserSettings] = useState<UserSettings>({
    theme: "light",
    language: "fr",
    timezone: "Europe/Paris",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    weekStart: "monday"
  })

  const [aiSettings, setAISettings] = useState<AISettings>({
    voiceRecognition: true,
    smartSuggestions: true,
    autoCategorization: true,
    priorityPrediction: true,
    timeEstimation: true,
    rewriteAssistance: true,
    creativityLevel: 70,
    responseSpeed: "balanced"
  })

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voiceEnabled: true,
    voiceType: "female",
    voiceSpeed: 1.0,
    voicePitch: 1.0,
    dailyReminderTime: "09:00",
    reminderDays: [1, 2, 3, 4, 5],
    voiceLanguage: "fr-FR"
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    appointmentReminders: true,
    dailySummary: true,
    weeklySummary: true,
    reminderTime: "09:00",
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00"
    }
  })

  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    profilePicture: "",
    dataRetention: 365,
    exportData: false,
    deleteAccount: false
  })

  useEffect(() => {
    if (status === "authenticated") {
      loadSettings()
    }
  }, [status])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // Load user settings
      const userResponse = await fetch('/api/user-settings')
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUserSettings(prev => ({ ...prev, ...userData }))
      }

      // Load AI settings
      const aiResponse = await fetch('/api/ai-settings')
      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        setAISettings(prev => ({ ...prev, ...aiData }))
      }

      // Load voice settings
      const voiceResponse = await fetch('/api/voice-settings')
      if (voiceResponse.ok) {
        const voiceData = await voiceResponse.json()
        setVoiceSettings(prev => ({ ...prev, ...voiceData }))
      }

      // Load notification settings
      const notificationResponse = await fetch('/api/notification-settings')
      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json()
        setNotificationSettings(prev => ({ ...prev, ...notificationData }))
      }

      // Update account settings with session data
      setAccountSettings(prev => ({
        ...prev,
        name: session?.user?.name || "",
        email: session?.user?.email || ""
      }))

    } catch (error) {
      toast.error("Erreur lors du chargement des paramètres")
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (section: string) => {
    setSaving(true)
    try {
      let endpoint = ""
      let data = {}

      switch (section) {
        case "general":
          endpoint = "/api/user-settings"
          data = userSettings
          break
        case "ai":
          endpoint = "/api/ai-settings"
          data = aiSettings
          break
        case "voice":
          endpoint = "/api/voice-settings"
          data = voiceSettings
          break
        case "notifications":
          endpoint = "/api/notification-settings"
          data = notificationSettings
          break
        case "account":
          endpoint = "/api/account-settings"
          data = accountSettings
          break
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success("Paramètres sauvegardés avec succès")
      } else {
        toast.error("Erreur lors de la sauvegarde des paramètres")
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde des paramètres")
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = (section: string) => {
    switch (section) {
      case "general":
        setUserSettings({
          theme: "light",
          language: "fr",
          timezone: "Europe/Paris",
          dateFormat: "DD/MM/YYYY",
          timeFormat: "24h",
          weekStart: "monday"
        })
        break
      case "ai":
        setAISettings({
          voiceRecognition: true,
          smartSuggestions: true,
          autoCategorization: true,
          priorityPrediction: true,
          timeEstimation: true,
          rewriteAssistance: true,
          creativityLevel: 70,
          responseSpeed: "balanced"
        })
        break
      case "voice":
        setVoiceSettings({
          voiceEnabled: true,
          voiceType: "female",
          voiceSpeed: 1.0,
          voicePitch: 1.0,
          dailyReminderTime: "09:00",
          reminderDays: [1, 2, 3, 4, 5],
          voiceLanguage: "fr-FR"
        })
        break
      case "notifications":
        setNotificationSettings({
          emailNotifications: true,
          pushNotifications: true,
          taskReminders: true,
          appointmentReminders: true,
          dailySummary: true,
          weeklySummary: true,
          reminderTime: "09:00",
          quietHours: {
            enabled: false,
            start: "22:00",
            end: "08:00"
          }
        })
        break
    }
    toast.success("Paramètres réinitialisés")
  }

  const toggleReminderDay = (dayIndex: number) => {
    setVoiceSettings(prev => ({
      ...prev,
      reminderDays: prev.reminderDays.includes(dayIndex)
        ? prev.reminderDays.filter(d => d !== dayIndex)
        : [...prev.reminderDays, dayIndex]
    }))
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/export-data')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'memovox-data-export.json'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Données exportées avec succès")
      } else {
        toast.error("Erreur lors de l'export des données")
      }
    } catch (error) {
      toast.error("Erreur lors de l'export des données")
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      return
    }

    try {
      const response = await fetch('/api/delete-account', {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Compte supprimé avec succès")
        await signOut()
        router.push("/")
      } else {
        toast.error("Erreur lors de la suppression du compte")
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression du compte")
    }
  }

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des paramètres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Paramètres</h1>
            <p className="text-muted-foreground">
              Personnalisez votre expérience MemoVox
            </p>
          </div>
        </div>

        {/* Settings Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:flex">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Général</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">IA</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Vocal</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifs</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Compte</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Appearance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Apparence
                  </CardTitle>
                  <CardDescription>
                    Personnalisez l'apparence de l'application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Thème</Label>
                    <Select value={userSettings.theme} onValueChange={(value: any) => setUserSettings(prev => ({ ...prev, theme: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Clair
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Sombre
                          </div>
                        </SelectItem>
                        <SelectItem value="auto">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Automatique
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Language & Region */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Langue et région
                  </CardTitle>
                  <CardDescription>
                    Configurez vos préférences linguistiques
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Langue</Label>
                    <Select value={userSettings.language} onValueChange={(value) => setUserSettings(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="it">Italiano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Fuseau horaire</Label>
                    <Select value={userSettings.timezone} onValueChange={(value) => setUserSettings(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                        <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Format de date</Label>
                      <Select value={userSettings.dateFormat} onValueChange={(value) => setUserSettings(prev => ({ ...prev, dateFormat: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Format d'heure</Label>
                      <Select value={userSettings.timeFormat} onValueChange={(value: any) => setUserSettings(prev => ({ ...prev, timeFormat: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12h">12h</SelectItem>
                          <SelectItem value="24h">24h</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Début de semaine</Label>
                    <Select value={userSettings.weekStart} onValueChange={(value: any) => setUserSettings(prev => ({ ...prev, weekStart: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Lundi</SelectItem>
                        <SelectItem value="sunday">Dimanche</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => resetSettings("general")}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              <Button onClick={() => saveSettings("general")} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Sauvegarder
              </Button>
            </div>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* AI Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Fonctionnalités IA
                  </CardTitle>
                  <CardDescription>
                    Activez ou désactivez les fonctionnalités d'intelligence artificielle
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reconnaissance vocale</Label>
                      <p className="text-sm text-muted-foreground">
                        Convertir la parole en texte pour les tâches
                      </p>
                    </div>
                    <Switch
                      checked={aiSettings.voiceRecognition}
                      onCheckedChange={(checked) => setAISettings(prev => ({ ...prev, voiceRecognition: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Suggestions intelligentes</Label>
                      <p className="text-sm text-muted-foreground">
                        Suggestions basées sur vos habitudes
                      </p>
                    </div>
                    <Switch
                      checked={aiSettings.smartSuggestions}
                      onCheckedChange={(checked) => setAISettings(prev => ({ ...prev, smartSuggestions: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Catégorisation automatique</Label>
                      <p className="text-sm text-muted-foreground">
                        Classer automatiquement les tâches par catégorie
                      </p>
                    </div>
                    <Switch
                      checked={aiSettings.autoCategorization}
                      onCheckedChange={(checked) => setAISettings(prev => ({ ...prev, autoCategorization: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Prédiction de priorité</Label>
                      <p className="text-sm text-muted-foreground">
                        Suggérer des priorités basées sur le contexte
                      </p>
                    </div>
                    <Switch
                      checked={aiSettings.priorityPrediction}
                      onCheckedChange={(checked) => setAISettings(prev => ({ ...prev, priorityPrediction: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Estimation de temps</Label>
                      <p className="text-sm text-muted-foreground">
                        Estimer la durée des tâches automatiquement
                      </p>
                    </div>
                    <Switch
                      checked={aiSettings.timeEstimation}
                      onCheckedChange={(checked) => setAISettings(prev => ({ ...prev, timeEstimation: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Assistance de réécriture</Label>
                      <p className="text-sm text-muted-foreground">
                        Aider à reformuler les titres de tâches
                      </p>
                    </div>
                    <Switch
                      checked={aiSettings.rewriteAssistance}
                      onCheckedChange={(checked) => setAISettings(prev => ({ ...prev, rewriteAssistance: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* AI Behavior */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Comportement de l'IA
                  </CardTitle>
                  <CardDescription>
                    Ajustez le comportement et les préférences de l'IA
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Niveau de créativité</Label>
                      <Badge variant="outline">{aiSettings.creativityLevel}%</Badge>
                    </div>
                    <Slider
                      value={[aiSettings.creativityLevel]}
                      onValueChange={(value) => setAISettings(prev => ({ ...prev, creativityLevel: value[0] }))}
                      max={100}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      Ajustez le niveau de créativité des suggestions de l'IA
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Vitesse de réponse</Label>
                    <Select value={aiSettings.responseSpeed} onValueChange={(value: any) => setAISettings(prev => ({ ...prev, responseSpeed: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">Rapide</SelectItem>
                        <SelectItem value="balanced">Équilibrée</SelectItem>
                        <SelectItem value="thorough">Approfondie</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Choisissez entre rapidité et qualité des réponses
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => resetSettings("ai")}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              <Button onClick={() => saveSettings("ai")} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Sauvegarder
              </Button>
            </div>
          </TabsContent>

          {/* Voice Settings */}
          <TabsContent value="voice" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Voice Assistant */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Assistant vocal
                  </CardTitle>
                  <CardDescription>
                    Configurez les paramètres de l'assistant vocal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Activer l'assistant vocal</Label>
                      <p className="text-sm text-muted-foreground">
                        Utiliser des commandes vocales pour les tâches
                      </p>
                    </div>
                    <Switch
                      checked={voiceSettings.voiceEnabled}
                      onCheckedChange={(checked) => setVoiceSettings(prev => ({ ...prev, voiceEnabled: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type de voix</Label>
                    <Select value={voiceSettings.voiceType} onValueChange={(value) => setVoiceSettings(prev => ({ ...prev, voiceType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Voix féminine</SelectItem>
                        <SelectItem value="male">Voix masculine</SelectItem>
                        <SelectItem value="neutral">Voix neutre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Langue vocale</Label>
                    <Select value={voiceSettings.voiceLanguage} onValueChange={(value) => setVoiceSettings(prev => ({ ...prev, voiceLanguage: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr-FR">Français (France)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español (España)</SelectItem>
                        <SelectItem value="de-DE">Deutsch (Deutschland)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Vitesse de la voix</Label>
                      <Badge variant="outline">{voiceSettings.voiceSpeed}x</Badge>
                    </div>
                    <Slider
                      value={[voiceSettings.voiceSpeed]}
                      onValueChange={(value) => setVoiceSettings(prev => ({ ...prev, voiceSpeed: value[0] }))}
                      max={2}
                      min={0.5}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Hauteur de la voix</Label>
                      <Badge variant="outline">{voiceSettings.voicePitch}x</Badge>
                    </div>
                    <Slider
                      value={[voiceSettings.voicePitch]}
                      onValueChange={(value) => setVoiceSettings(prev => ({ ...prev, voicePitch: value[0] }))}
                      max={2}
                      min={0.5}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Voice Reminders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Rappels vocaux
                  </CardTitle>
                  <CardDescription>
                    Configurez les rappels vocaux quotidiens
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Heure du rappel quotidien</Label>
                    <Input
                      type="time"
                      value={voiceSettings.dailyReminderTime}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, dailyReminderTime: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Jours de rappel</Label>
                    <div className="flex gap-2">
                      {dayNames.map((day, index) => (
                        <Button
                          key={day}
                          variant={voiceSettings.reminderDays.includes(index + 1) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleReminderDay(index + 1)}
                          className="w-10 h-10 p-0"
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Exemple de rappel</h4>
                    <p className="text-sm text-muted-foreground">
                      "Bonjour ! Voici votre résumé quotidien. Vous avez 3 tâches en attente et 2 rendez-vous aujourd'hui. N'oubliez pas votre réunion à 14h."
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => resetSettings("voice")}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              <Button onClick={() => saveSettings("voice")} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Sauvegarder
              </Button>
            </div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Notification Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Types de notifications
                  </CardTitle>
                  <CardDescription>
                    Choisissez les types de notifications que vous souhaitez recevoir
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications par email</Label>
                      <p className="text-sm text-muted-foreground">
                        Recevoir des notifications par email
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications push</Label>
                      <p className="text-sm text-muted-foreground">
                        Notifications push dans le navigateur
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Rappels de tâches</Label>
                      <p className="text-sm text-muted-foreground">
                        Notifications pour les échéances des tâches
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.taskReminders}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, taskReminders: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Rappels de rendez-vous</Label>
                      <p className="text-sm text-muted-foreground">
                        Notifications pour les rendez-vous à venir
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.appointmentReminders}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, appointmentReminders: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Résumé quotidien</Label>
                      <p className="text-sm text-muted-foreground">
                        Résumé quotidien de vos activités
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.dailySummary}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, dailySummary: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Résumé hebdomadaire</Label>
                      <p className="text-sm text-muted-foreground">
                        Résumé hebdomadaire de votre productivité
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklySummary}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, weeklySummary: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Planning des notifications
                  </CardTitle>
                  <CardDescription>
                    Configurez quand et comment vous recevez les notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Heure de rappel par défaut</Label>
                    <Input
                      type="time"
                      value={notificationSettings.reminderTime}
                      onChange={(e) => setNotificationSettings(prev => ({ ...prev, reminderTime: e.target.value }))}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Heures tranquilles</Label>
                        <p className="text-sm text-muted-foreground">
                          Désactiver les notifications pendant certaines heures
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.quietHours.enabled}
                        onCheckedChange={(checked) => setNotificationSettings(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, enabled: checked }
                        }))}
                      />
                    </div>

                    {notificationSettings.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Début</Label>
                          <Input
                            type="time"
                            value={notificationSettings.quietHours.start}
                            onChange={(e) => setNotificationSettings(prev => ({
                              ...prev,
                              quietHours: { ...prev.quietHours, start: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fin</Label>
                          <Input
                            type="time"
                            value={notificationSettings.quietHours.end}
                            onChange={(e) => setNotificationSettings(prev => ({
                              ...prev,
                              quietHours: { ...prev.quietHours, end: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Exemple de notification</h4>
                    <p className="text-sm text-muted-foreground">
                      "Rappel : Vous avez une tâche 'Préparer la présentation' due dans 2 heures"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => resetSettings("notifications")}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              <Button onClick={() => saveSettings("notifications")} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Sauvegarder
              </Button>
            </div>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations du profil
                  </CardTitle>
                  <CardDescription>
                    Gérez vos informations personnelles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                      value={accountSettings.name}
                      onChange={(e) => setAccountSettings(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Votre nom"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={accountSettings.email}
                      onChange={(e) => setAccountSettings(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="votre@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Photo de profil</Label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <Button variant="outline" size="sm">
                        Changer la photo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Gestion des données
                  </CardTitle>
                  <CardDescription>
                    Gérez vos données et votre confidentialité
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rétention des données</Label>
                    <Select value={accountSettings.dataRetention.toString()} onValueChange={(value) => setAccountSettings(prev => ({ ...prev, dataRetention: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 jours</SelectItem>
                        <SelectItem value="90">90 jours</SelectItem>
                        <SelectItem value="365">1 an</SelectItem>
                        <SelectItem value="1095">3 ans</SelectItem>
                        <SelectItem value="-1">Illimité</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Durée de conservation de vos données
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={handleExportData}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Exporter mes données
                    </Button>

                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setAccountSettings(prev => ({ ...prev, exportData: !prev.exportData }))}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {accountSettings.exportData ? 'Désactiver l\'export automatique' : 'Activer l\'export automatique'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Zone de danger
                </CardTitle>
                <CardDescription>
                  Actions irréversibles sur votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <h4 className="font-medium text-destructive mb-2">Supprimer le compte</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    La suppression de votre compte est irréversible. Toutes vos données seront perdues.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer mon compte
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => signOut()}
              >
                Déconnexion
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => resetSettings("account")}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
                <Button onClick={() => saveSettings("account")} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Sauvegarder
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}