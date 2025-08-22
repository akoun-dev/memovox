'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, Calendar, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface DailySummary {
  summary: string;
  voiceReminder: {
    id: string;
    title: string;
    content: string;
    audioUrl: string;
    scheduledFor: string;
  };
  tasksCount: number;
  appointmentsCount: number;
}

export default function DailySummaryGenerator() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/daily-summary', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
        toast.success('Résumé quotidien généré avec succès');
      } else {
        toast.error('Erreur lors de la génération du résumé');
      }
    } catch (error) {
      toast.error('Erreur lors de la génération du résumé');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (!summary) return;

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
    }

    const audio = new Audio(summary.voiceReminder.audioUrl);
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      toast.error('Erreur lors de la lecture du résumé vocal');
      setIsPlaying(false);
    };

    audio.play();
    setCurrentAudio(audio);
  };

  const pauseAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Résumé quotidien vocal
        </CardTitle>
        <CardDescription>
          Générez un résumé vocal de vos tâches et rendez-vous du jour
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={generateSummary} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer le résumé du jour
            </>
          )}
        </Button>

        {summary && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {summary.tasksCount} tâche{summary.tasksCount > 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {summary.appointmentsCount} rendez-vous
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {isPlaying ? (
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
                    onClick={playAudio}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Écouter
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Résumé textuel :</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {summary.summary}
              </p>
            </div>

            <div className="text-xs text-muted-foreground">
              Généré le {new Date(summary.voiceReminder.scheduledFor).toLocaleString('fr-FR')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}