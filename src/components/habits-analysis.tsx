"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Target, 
  Brain, 
  RefreshCw, 
  BarChart3,
  PieChart,
  Activity,
  Lightbulb,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { format, subDays, subWeeks, subMonths } from "date-fns"
import { fr } from "date-fns/locale"

interface HabitsAnalysis {
  userId: string
  period: {
    start: string
    end: string
  }
  patterns: {
    time: Array<{
      hour: number
      productivity: number
      focus: number
      energy: number
      preferredTaskTypes: string[]
      bestFor: string[]
      avoid: string[]
    }>
    weekly: Array<{
      dayOfWeek: number
      avgCompletionRate: number
      avgTasksCompleted: number
      avgTimeSpent: number
      mood: 'low' | 'medium' | 'high'
      optimalTaskTypes: string[]
      challenges: string[]
    }>
    habits: Array<{
      id: string
      name: string
      description: string
      frequency: 'daily' | 'weekly' | 'monthly'
      consistency: number
      strength: 'weak' | 'moderate' | 'strong'
      impact: 'low' | 'medium' | 'high'
      trend: 'improving' | 'stable' | 'declining'
    }>
  }
  insights: Array<{
    id: string
    type: 'strength' | 'weakness' | 'opportunity' | 'threat'
    title: string
    description: string
    confidence: number
    actionable: boolean
    recommendations: string[]
  }>
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
  metrics: {
    overallProductivity: number
    consistencyScore: number
    efficiency: number
    wellbeing: number
  }
}

export function HabitsAnalysis() {
  const { data: session } = useSession()
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month')
  const [analysis, setAnalysis] = useState<HabitsAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session) {
      loadAnalysis()
    }
  }, [session, selectedPeriod])

  const loadAnalysis = async () => {
    if (!session) return

    setIsLoading(true)
    try {
      const endDate = new Date()
      let startDate: Date

      switch (selectedPeriod) {
        case 'week':
          startDate = subWeeks(endDate, 1)
          break
        case 'month':
          startDate = subMonths(endDate, 1)
          break
        case 'quarter':
          startDate = subMonths(endDate, 3)
          break
      }

      const response = await fetch('/api/habits/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      })

      if (response.ok) {
        const result = await response.json()
        setAnalysis(result)
      } else {
        toast.error("Erreur lors de l'analyse des habitudes")
      }
    } catch (error) {
      toast.error("Erreur lors de l'analyse des habitudes")
    } finally {
      setIsLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <CheckCircle className="h-4 w-4" />
      case 'weakness': return <AlertTriangle className="h-4 w-4" />
      case 'opportunity': return <Lightbulb className="h-4 w-4" />
      case 'threat': return <AlertTriangle className="h-4 w-4" />
      default: return <Brain className="h-4 w-4" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength': return "bg-green-100 text-green-800 border-green-200"
      case 'weakness': return "bg-red-100 text-red-800 border-red-200"
      case 'opportunity': return "bg-blue-100 text-blue-800 border-blue-200"
      case 'threat': return "bg-orange-100 text-orange-800 border-orange-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDayName = (dayIndex: number) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    return days[dayIndex]
  }

  const getHabitStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return "bg-green-100 text-green-800"
      case 'moderate': return "bg-yellow-100 text-yellow-800"
      case 'weak': return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'declining': return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
      default: return <Activity className="h-3 w-3 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Contrôles d'analyse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analyse des Habitudes de Productivité
          </CardTitle>
          <CardDescription>
            Découvrez vos patterns et améliorez votre efficacité grâce à l'IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Période d'analyse</Label>
              <div className="flex gap-2 mt-1">
                {[
                  { value: 'week', label: 'Dernière semaine' },
                  { value: 'month', label: 'Dernier mois' },
                  { value: 'quarter', label: 'Dernier trimestre' }
                ].map(period => (
                  <Button
                    key={period.value}
                    variant={selectedPeriod === period.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod(period.value as any)}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={loadAnalysis}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                Analyser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <>
          {/* Métriques globales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Vue d'ensemble de votre Productivité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(analysis.metrics.overallProductivity * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Productivité globale</div>
                  <Progress value={analysis.metrics.overallProductivity * 100} className="mt-2 h-2" />
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(analysis.metrics.consistencyScore * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Score de consistance</div>
                  <Progress value={analysis.metrics.consistencyScore * 100} className="mt-2 h-2" />
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(analysis.metrics.efficiency * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Efficacité</div>
                  <Progress value={analysis.metrics.efficiency * 100} className="mt-2 h-2" />
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(analysis.metrics.wellbeing * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Bien-être</div>
                  <Progress value={analysis.metrics.wellbeing * 100} className="mt-2 h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patterns temporels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Patterns Temporels
              </CardTitle>
              <CardDescription>
                Vos heures de productivité et les types de tâches préférés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.patterns.time
                  .filter(slot => slot.productivity > 0.5)
                  .slice(0, 6)
                  .map((slot, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{slot.hour}h - {slot.hour + 1}h</span>
                        <Badge variant="outline">
                          {Math.round(slot.productivity * 100)}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Focus</span>
                          <span>{Math.round(slot.focus * 100)}%</span>
                        </div>
                        <Progress value={slot.focus * 100} className="h-1" />
                        <div className="flex justify-between text-sm">
                          <span>Énergie</span>
                          <span>{Math.round(slot.energy * 100)}%</span>
                        </div>
                        <Progress value={slot.energy * 100} className="h-1" />
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">Idéal pour:</p>
                        <div className="flex flex-wrap gap-1">
                          {slot.bestFor.slice(0, 2).map((type, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Patterns hebdomadaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Patterns Hebdomadaires
              </CardTitle>
              <CardDescription>
                Votre productivité selon les jours de la semaine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.patterns.weekly.map((day, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{getDayName(day.dayOfWeek)}</span>
                      <Badge variant="outline" className={
                        day.mood === 'high' ? 'bg-green-100 text-green-800' :
                        day.mood === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {day.mood === 'high' ? 'Bon' : day.mood === 'medium' ? 'Moyen' : 'Faible'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Taux de complétion</span>
                        <span>{Math.round(day.avgCompletionRate * 100)}%</span>
                      </div>
                      <Progress value={day.avgCompletionRate * 100} className="h-1" />
                      <div className="text-xs text-muted-foreground">
                        {day.avgTasksCompleted.toFixed(1)} tâches/jour
                      </div>
                    </div>
                    {day.optimalTaskTypes.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">Optimal pour:</p>
                        <div className="flex flex-wrap gap-1">
                          {day.optimalTaskTypes.slice(0, 2).map((type, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Habitudes identifiées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Habitudes Identifiées
              </CardTitle>
              <CardDescription>
                Vos routines et comportements récurrents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.patterns.habits.map((habit, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{habit.name}</h4>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(habit.trend)}
                        <Badge variant="outline" className={getHabitStrengthColor(habit.strength)}>
                          {habit.strength === 'strong' ? 'Fort' : 
                           habit.strength === 'moderate' ? 'Modéré' : 'Faible'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{habit.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span>Consistance: {Math.round(habit.consistency * 100)}%</span>
                      <span>Impact: {habit.impact === 'high' ? 'Élevé' : 
                                 habit.impact === 'medium' ? 'Moyen' : 'Faible'}</span>
                    </div>
                    <Progress value={habit.consistency * 100} className="mt-2 h-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Insights Personnalisés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.insights.map((insight, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span>Confiance: {Math.round(insight.confidence * 100)}%</span>
                      {insight.actionable && (
                        <Badge variant="secondary">Actionnable</Badge>
                      )}
                    </div>
                    {insight.recommendations.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Recommandations:</p>
                        {insight.recommendations.slice(0, 2).map((rec, i) => (
                          <p key={i} className="text-xs text-muted-foreground">• {rec}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommandations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4" />
                  Actions Immédiates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.recommendations.immediate.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Objectifs à Court Terme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.recommendations.shortTerm.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" />
                  Vision à Long Terme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.recommendations.longTerm.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}