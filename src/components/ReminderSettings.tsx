'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, Settings, Volume2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface ReminderSettings {
  id: string;
  dailyReminderTime: string;
  isEnabled: boolean;
  voiceEnabled: boolean;
  reminderDays: string;
}

const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function ReminderSettingsComponent() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings?.reminderDays) {
      const days = settings.reminderDays.split(',').map(Number);
      setSelectedDays(days);
    }
  }, [settings]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/reminder-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        toast.error('Erreur lors du chargement des paramètres');
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/reminder-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          reminderDays: selectedDays.join(',')
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        toast.success('Paramètres sauvegardés avec succès');
      } else {
        toast.error('Erreur lors de la sauvegarde des paramètres');
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(d => d !== dayIndex);
      } else {
        return [...prev, dayIndex];
      }
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Impossible de charger les paramètres de rappel
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Paramètres des rappels vocaux
        </CardTitle>
        <CardDescription>
          Configurez vos préférences pour les rappels vocaux quotidiens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={settings.isEnabled}
              onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, isEnabled: checked } : prev)}
            />
            <Label htmlFor="enabled">Activer les rappels quotidiens</Label>
          </div>
          <Badge variant={settings.isEnabled ? "default" : "secondary"}>
            {settings.isEnabled ? "Activé" : "Désactivé"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={settings.voiceEnabled}
              onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, voiceEnabled: checked } : prev)}
              disabled={!settings.isEnabled}
            />
            <Label htmlFor="voice">Activer les rappels vocaux</Label>
          </div>
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Heure du rappel quotidien
          </Label>
          <Input
            id="time"
            type="time"
            value={settings.dailyReminderTime}
            onChange={(e) => setSettings(prev => prev ? { ...prev, dailyReminderTime: e.target.value } : prev)}
            disabled={!settings.isEnabled}
            className="w-32"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Jours de rappel
          </Label>
          <div className="flex gap-2">
            {dayNames.map((day, index) => (
              <Button
                key={day}
                variant={selectedDays.includes(index + 1) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleDay(index + 1)}
                disabled={!settings.isEnabled}
                className="w-10 h-10 p-0"
              >
                {day}
              </Button>
            ))}
          </div>
        </div>

        <Button onClick={saveSettings} disabled={saving} className="w-full">
          {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
      </CardContent>
    </Card>
  );
}