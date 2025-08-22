'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, Calendar, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceReminder {
  id: string;
  title: string;
  content: string;
  audioUrl: string;
  scheduledFor: string;
  sentAt: string | null;
  type: 'TASK' | 'APPOINTMENT' | 'DAILY_SUMMARY';
  createdAt: string;
}

export default function VoiceReminderList() {
  const [reminders, setReminders] = useState<VoiceReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReminders();
  }, []);

  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  const fetchReminders = async () => {
    try {
      const response = await fetch('/api/voice-reminders?limit=20');
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      } else {
        toast.error('Erreur lors du chargement des rappels vocaux');
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des rappels vocaux');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (audioUrl: string, reminderId: string) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
    }

    const audio = new Audio(audioUrl);
    audio.onplay = () => setPlayingId(reminderId);
    audio.onpause = () => setPlayingId(null);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => {
      toast.error('Erreur lors de la lecture du rappel vocal');
      setPlayingId(null);
    };

    audio.play();
    setCurrentAudio(audio);
  };

  const pauseAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setPlayingId(null);
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/voice-reminders/${reminderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReminders(prev => prev.filter(r => r.id !== reminderId));
        toast.success('Rappel vocal supprimé avec succès');
      } else {
        toast.error('Erreur lors de la suppression du rappel vocal');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression du rappel vocal');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'TASK': return 'Tâche';
      case 'APPOINTMENT': return 'Rendez-vous';
      case 'DAILY_SUMMARY': return 'Résumé quotidien';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TASK': return 'bg-blue-100 text-blue-800';
      case 'APPOINTMENT': return 'bg-green-100 text-green-800';
      case 'DAILY_SUMMARY': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Rappels vocaux
        </CardTitle>
        <CardDescription>
          Écoutez vos rappels vocaux générés
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-8">
            <Volume2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucun rappel vocal disponible
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{reminder.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(reminder.scheduledFor)}</span>
                    </div>
                  </div>
                  <Badge className={getTypeColor(reminder.type)}>
                    {getTypeLabel(reminder.type)}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {reminder.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {playingId === reminder.id ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={pauseAudio}
                        className="flex items-center gap-2"
                      >
                        <Pause className="h-4 w-4" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playAudio(reminder.audioUrl, reminder.id)}
                        className="flex items-center gap-2"
                      >
                        <Play className="h-4 w-4" />
                        Écouter
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReminder(reminder.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}