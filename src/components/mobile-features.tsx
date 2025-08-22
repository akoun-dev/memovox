"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Smartphone, 
  Bell, 
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Trash2,
  Plus
} from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

interface Device {
  id: string
  platform: 'ios' | 'android' | 'web'
  token: string
  isActive: boolean
  createdAt: string
}

interface NotificationSettings {
  pushEnabled: boolean
  quietHours: boolean
  quietHoursStart: string
  quietHoursEnd: string
  widgetEnabled: boolean
  offlineMode: boolean
}

export function MobileFeatures() {
  const { data: session } = useSession()
  const [devices, setDevices] = useState<Device[]>([])
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    quietHours: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    widgetEnabled: true,
    offlineMode: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    if (session) {
      loadDevices()
    }
  }, [session])

  const loadDevices = async () => {
    try {
      // Simuler le chargement des appareils
      setDevices([
        {
          id: "1",
          platform: "web",
          token: "web_token",
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ])
    } catch (error) {
      console.error('Error loading devices:', error)
    }
  }

  const registerDevice = async () => {
    if (!session) return

    setIsRegistering(true)
    try {
      // Simuler l'enregistrement d'un appareil mobile
      const newDevice: Device = {
        id: `mobile_${Date.now()}`,
        platform: 'android',
        token: `token_${Date.now()}`,
        isActive: true,
        createdAt: new Date().toISOString()
      }

      setDevices(prev => [...prev, newDevice])
      toast.success("Appareil mobile enregistré avec succès")
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement de l'appareil")
    } finally {
      setIsRegistering(false)
    }
  }

  const unregisterDevice = async (deviceId: string) => {
    try {
      setDevices(prev => prev.filter(d => d.id !== deviceId))
      toast.success("Appareil désenregistré")
    } catch (error) {
      toast.error("Erreur lors du désenregistrement")
    }
  }

  const sendTestNotification = async () => {
    try {
      toast.success("Notification de test envoyée")
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la notification")
    }
  }

  const updateNotificationSettings = async (key: keyof NotificationSettings, value: any) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }))
    toast.success("Paramètres mis à jour")
  }

  const syncOfflineData = async () => {
    setIsLoading(true)
    try {
      // Simuler la synchronisation
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success("Données synchronisées avec succès")
    } catch (error) {
      toast.error("Erreur lors de la synchronisation")
    } finally {
      setIsLoading(false)
    }
  }

  const clearOfflineData = async () => {
    try {
      toast.success("Données hors ligne effacées")
    } catch (error) {
      toast.error("Erreur lors de l'effacement des données")
    }
  }

  return (
    <div className="space-y-6">
      {/* Appareils enregistrés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Appareils Enregistrés
          </CardTitle>
          <CardDescription>
            Gérez les appareils connectés à votre compte MemoVox
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun appareil mobile enregistré</p>
              <p className="text-sm">Installez l'application mobile et connectez-vous pour commencer</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map(device => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      device.platform === 'ios' ? 'bg-gray-100' : 
                      device.platform === 'android' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {device.platform === 'ios' ? 'iPhone/iPad' : 
                         device.platform === 'android' ? 'Android' : 'Web'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Connecté le {new Date(device.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={device.isActive ? "default" : "secondary"}>
                      {device.isActive ? "Actif" : "Inactif"}
                    </Badge>
                    {device.platform !== 'web' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unregisterDevice(device.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Button 
            onClick={registerDevice} 
            disabled={isRegistering}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            {isRegistering ? "Enregistrement..." : "Ajouter un appareil mobile"}
          </Button>
        </CardContent>
      </Card>

      {/* Paramètres de notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications Push
          </CardTitle>
          <CardDescription>
            Configurez les notifications pour vos appareils mobiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Activer les notifications push</Label>
              <p className="text-sm text-muted-foreground">
                Recevez des notifications sur vos appareils mobiles
              </p>
            </div>
            <Switch
              checked={notificationSettings.pushEnabled}
              onCheckedChange={(checked) => updateNotificationSettings('pushEnabled', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Heures tranquilles</Label>
              <p className="text-sm text-muted-foreground">
                Désactiver les notifications pendant certaines heures
              </p>
            </div>
            <Switch
              checked={notificationSettings.quietHours}
              onCheckedChange={(checked) => updateNotificationSettings('quietHours', checked)}
            />
          </div>

          {notificationSettings.quietHours && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Début</Label>
                <Input
                  type="time"
                  value={notificationSettings.quietHoursStart}
                  onChange={(e) => updateNotificationSettings('quietHoursStart', e.target.value)}
                />
              </div>
              <div>
                <Label>Fin</Label>
                <Input
                  type="time"
                  value={notificationSettings.quietHoursEnd}
                  onChange={(e) => updateNotificationSettings('quietHoursEnd', e.target.value)}
                />
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Widget d'accueil</Label>
              <p className="text-sm text-muted-foreground">
                Afficher vos tâches du jour sur l'écran d'accueil
              </p>
            </div>
            <Switch
              checked={notificationSettings.widgetEnabled}
              onCheckedChange={(checked) => updateNotificationSettings('widgetEnabled', checked)}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={sendTestNotification}
              className="flex-1"
            >
              <Bell className="h-4 w-4 mr-2" />
              Tester les notifications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mode hors ligne */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {notificationSettings.offlineMode ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            Mode Hors Ligne
          </CardTitle>
          <CardDescription>
            Travaillez sans connexion internet et synchronisez vos données plus tard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Activer le mode hors ligne</Label>
              <p className="text-sm text-muted-foreground">
                Permet de continuer à utiliser l'application sans internet
              </p>
            </div>
            <Switch
              checked={notificationSettings.offlineMode}
              onCheckedChange={(checked) => updateNotificationSettings('offlineMode', checked)}
            />
          </div>

          {notificationSettings.offlineMode && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <div className="text-sm text-muted-foreground">Tâches hors ligne</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">3</div>
                  <div className="text-sm text-muted-foreground">À synchroniser</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={syncOfflineData}
                  disabled={isLoading}
                  className="flex-1 gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Synchroniser
                </Button>
                <Button 
                  variant="outline"
                  onClick={clearOfflineData}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Effacer
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques mobiles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Statistiques d'Utilisation Mobile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">247</div>
              <div className="text-sm text-muted-foreground">Notifications reçues</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">89%</div>
              <div className="text-sm text-muted-foreground">Taux d'ouverture</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">45</div>
              <div className="text-sm text-muted-foreground">Sessions hors ligne</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">12</div>
              <div className="text-sm text-muted-foreground">Synchronisations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}