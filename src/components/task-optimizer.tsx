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
  Zap, 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Lightbulb,
  BarChart3
} from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface OptimizedTask {
  id: string
  title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  estimatedDuration: number
  recommendedTimeSlot: {
    start: string
    end: string
    confidence: number
  }
  optimalOrder: number
  grouping: string
  energyRequired: 'low' | 'medium' | 'high'
  contextSwitchingCost: number
}

interface OptimizationResult {
  optimizedTasks: OptimizedTask[]
  totalEstimatedTime: number
  productivityGain: number
  recommendations: string[]
  warnings: string[]
  schedule: Array<{
    time: string
    tasks: string[]
    focusLevel: 'low' | 'medium' | 'high'
  }>
}

export function TaskOptimizer() {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  const optimizeTasks = async () => {
    if (!session) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/task-optimizer/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: selectedDate })
      })

      if (response.ok) {
        const result = await response.json()
        setOptimizationResult(result)
        toast.success("Optimisation terminée avec succès")
      } else {
        toast.error("Erreur lors de l'optimisation")
      }
    } catch (error) {
      toast.error("Erreur lors de l'optimisation")
    } finally {
      setIsLoading(false)
    }
  }

  const applyOptimization = async () => {
    if (!optimizationResult) return

    setIsApplying(true)
    try {
      // Simuler l'application de l'optimisation
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success("Optimisation appliquée avec succès")
    } catch (error) {
      toast.error("Erreur lors de l'application de l'optimisation")
    } finally {
      setIsApplying(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-100 text-red-800 border-red-200"
      case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "LOW": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case "high": return "bg-red-100 text-red-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getFocusLevelColor = (level: string) => {
    switch (level) {
      case "high": return "bg-green-100 text-green-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Contrôles d'optimisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Optimisation Intelligentes des Tâches
          </CardTitle>
          <CardDescription>
            L'IA analyse vos tâches et rendez-vous pour créer un planning optimal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Date à optimiser</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={optimizeTasks}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Optimiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {optimizationResult && (
        <>
          {/* Résumé de l'optimisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Résultats de l'Optimisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {optimizationResult.totalEstimatedTime}min
                  </div>
                  <div className="text-sm text-muted-foreground">Temps total estimé</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    +{Math.round(optimizationResult.productivityGain * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Gain de productivité</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {optimizationResult.optimizedTasks.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Tâches optimisées</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression d'optimisation</span>
                  <span>{Math.round(optimizationResult.productivityGain * 100)}%</span>
                </div>
                <Progress value={optimizationResult.productivityGain * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Planning optimisé */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Planning Optimisé
              </CardTitle>
              <CardDescription>
                Voici comment vos tâches sont réparties pour maximiser votre productivité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationResult.schedule.map((slot, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getFocusLevelColor(slot.focusLevel)}`}>
                        <Clock className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{slot.time}</span>
                        <Badge variant="outline" className={getFocusLevelColor(slot.focusLevel)}>
                          {slot.focusLevel === 'high' ? 'Haute concentration' : 
                           slot.focusLevel === 'medium' ? 'Concentration moyenne' : 'Basse concentration'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {slot.tasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="text-sm text-muted-foreground">
                            • {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tâches optimisées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Détail des Tâches Optimisées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {optimizationResult.optimizedTasks
                  .sort((a, b) => a.optimalOrder - b.optimalOrder)
                  .map((task, index) => (
                    <div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                          {task.optimalOrder}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{task.title}</h4>
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority === 'HIGH' ? 'Haute' : task.priority === 'MEDIUM' ? 'Moyenne' : 'Basse'}
                          </Badge>
                          <Badge variant="outline" className={getEnergyColor(task.energyRequired)}>
                            {task.energyRequired === 'high' ? 'Haute énergie' : 
                             task.energyRequired === 'medium' ? 'Énergie moyenne' : 'Basse énergie'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{task.estimatedDuration}min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{task.recommendedTimeSlot.start} - {task.recommendedTimeSlot.end}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>{task.grouping}</span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Confiance de l'IA</span>
                            <span>{Math.round(task.recommendedTimeSlot.confidence * 100)}%</span>
                          </div>
                          <Progress value={task.recommendedTimeSlot.confidence * 100} className="h-1" />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommandations et avertissements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {optimizationResult.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Recommandations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {optimizationResult.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {optimizationResult.warnings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Avertissements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {optimizationResult.warnings.map((warning, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{warning}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Button 
                  onClick={applyOptimization}
                  disabled={isApplying}
                  className="flex-1 gap-2"
                >
                  {isApplying ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Appliquer l'optimisation
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setOptimizationResult(null)}
                >
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}