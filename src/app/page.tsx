"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, CheckCircle, Clock, Plus, Settings, User, BarChart3, Zap, TrendingUp } from "lucide-react"
import { TaskList } from "@/components/task-list"
import { AppointmentList } from "@/components/appointment-list"
import { DailySummary } from "@/components/daily-summary"
import { VoiceTaskInput } from "@/components/voice-task-input"
import { NotificationSystem } from "@/components/notification-system"
import { DashboardStats } from "@/components/dashboard-stats"

import { AuthWrapper } from "@/components/auth-wrapper"
import { useSession, signOut } from "next-auth/react"


import { useRouter } from "next/navigation"
import { CalendarView } from "@/components/calendar-view"
import { SmartSuggestions } from "@/components/smart-suggestions"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { Statistics } from "@/components/statistics"
import { AutoRescheduler } from "@/components/auto-rescheduler"
import { TaskOptimizer } from "@/components/task-optimizer"
import { HabitsAnalysis } from "@/components/habits-analysis"

function HomeContent() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createType, setCreateType] = useState<"task" | "appointment">("task")
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    dueTime: ""
  })
  const [newAppointment, setNewAppointment] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "30"
  })
  const { data: session } = useSession()
  const router = useRouter()

  const handleVoiceTaskCreated = (task: { title: string; description?: string; priority?: string }) => {
    // This would typically update the task list via state management
    console.log("Voice task created:", task)
    // For now, we'll just show an alert
    alert(`Tâche créée: "${task.title}"`)
  }


  const handleCreateNew = () => {
    setShowCreateDialog(true)
  }

  const handleCreateTask = () => {
    setCreateType("task")
    setShowCreateDialog(true)
  }

  const handleCreateAppointment = () => {
    console.log("handleCreateAppointment called")
    setCreateType("appointment")
    setShowCreateDialog(true)
  }

  const handleSubmitTask = async () => {
    if (newTask.title.trim()) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority.toUpperCase(),
            dueDate: newTask.dueDate || null
          })
        })

        if (response.ok) {
          alert(`Tâche créée: "${newTask.title}"`)
          
          // Réinitialiser le formulaire
          setNewTask({
            title: "",
            description: "",
            priority: "medium",
            dueDate: "",
            dueTime: ""
          })
          setShowCreateDialog(false)
        } else {
          alert('Erreur lors de la création de la tâche')
        }
      } catch (error) {
        console.error('Error creating task:', error)
        alert('Erreur lors de la création de la tâche')
      }
    }
  }

  const handleSubmitAppointment = async () => {
    if (newAppointment.title.trim()) {
      try {
        const response = await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: newAppointment.title,
            description: newAppointment.description,
            location: "",
            date: newAppointment.date,
            duration: parseInt(newAppointment.duration)
          })
        })

        if (response.ok) {
          alert(`Rendez-vous créé: "${newAppointment.title}"`)
          
          // Réinitialiser le formulaire
          setNewAppointment({
            title: "",
            description: "",
            date: "",
            time: "",
            duration: "30"
          })
          setShowCreateDialog(false)
        } else {
          alert('Erreur lors de la création du rendez-vous')
        }
      } catch (error) {
        console.error('Error creating appointment:', error)
        alert('Erreur lors de la création du rendez-vous')
      }
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold">MemoVox</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <NotificationSystem />
            <VoiceTaskInput onTaskCreated={handleVoiceTaskCreated} />
          </div>
        </div>
      </div>

      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:bg-card lg:border-r lg:border-border">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-6 sm:mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">M</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold">MemoVox</h1>
          </div>
          
          <nav className="space-y-1 sm:space-y-2">
            <Button 
              variant={activeTab === "dashboard" ? "default" : "ghost"} 
              className="w-full justify-start text-sm sm:text-base h-9 sm:h-10"
              onClick={() => setActiveTab("dashboard")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Tableau de bord</span>
              <span className="sm:hidden">Dashboard</span>
            </Button>
            <Button 
              variant={activeTab === "tasks" ? "default" : "ghost"} 
              className="w-full justify-start text-sm sm:text-base h-9 sm:h-10"
              onClick={() => setActiveTab("tasks")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Tâches
            </Button>
            <Button 
              variant={activeTab === "appointments" ? "default" : "ghost"} 
              className="w-full justify-start text-sm sm:text-base h-9 sm:h-10"
              onClick={() => setActiveTab("appointments")}
            >
              <Clock className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Rendez-vous</span>
              <span className="sm:hidden">RDV</span>
            </Button>
            <Button 
              variant={activeTab === "summary" ? "default" : "ghost"} 
              className="w-full justify-start text-sm sm:text-base h-9 sm:h-10"
              onClick={() => setActiveTab("summary")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Résumé quotidien</span>
              <span className="sm:hidden">Résumé</span>
            </Button>
            <Button 
              variant={activeTab === "calendar" ? "default" : "ghost"} 
              className="w-full justify-start text-sm sm:text-base h-9 sm:h-10"
              onClick={() => setActiveTab("calendar")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Calendrier
            </Button>
            <Button 
              variant={activeTab === "statistics" ? "default" : "ghost"} 
              className="w-full justify-start text-sm sm:text-base h-9 sm:h-10"
              onClick={() => setActiveTab("statistics")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Statistiques
            </Button>
            <Button
              variant={activeTab === "optimizer" ? "default" : "ghost"}
              className="w-full justify-start text-sm sm:text-base h-9 sm:h-10"
              onClick={() => setActiveTab("optimizer")}
            >
              <Zap className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Optimiseur</span>
              <span className="sm:hidden">Optim</span>
            </Button>
            <Button
              variant={activeTab === "habits" ? "default" : "ghost"}
              className="w-full justify-start text-sm sm:text-base h-9 sm:h-10"
              onClick={() => setActiveTab("habits")}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Habitudes</span>
              <span className="sm:hidden">Habits</span>
            </Button>
          </nav>
        </div>
        
        <div className="mt-auto p-4 sm:p-6 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start mb-2 text-sm sm:text-base h-9 sm:h-10"
            onClick={() => router.push("/settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Paramètres</span>
            <span className="sm:hidden">Params</span>
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm sm:text-base h-9 sm:h-10"
            onClick={() => signOut()}
          >
            <User className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Déconnexion</span>
            <span className="sm:hidden">Déco</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Desktop Header */}
        <header className="hidden lg:block border-b border-border p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">
                {activeTab === "dashboard" && "Tableau de bord"}
                {activeTab === "tasks" && "Tâches"}
                {activeTab === "appointments" && "Rendez-vous"}
                {activeTab === "summary" && "Résumé quotidien"}
                {activeTab === "calendar" && "Calendrier"}
                {activeTab === "statistics" && "Statistiques"}
                {activeTab === "optimizer" && "Optimiseur de tâches"}
                {activeTab === "habits" && "Analyse des habitudes"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {activeTab === "dashboard" && "Vue d'ensemble de vos activités"}
                {activeTab === "tasks" && "Gérez vos tâches quotidiennes"}
                {activeTab === "appointments" && "Gérez vos rendez-vous"}
                {activeTab === "summary" && "Résumé de votre journée"}
                {activeTab === "calendar" && "Vue calendrier de vos événements"}
                {activeTab === "statistics" && "Analysez votre productivité"}
                {activeTab === "optimizer" && "Optimisez automatiquement votre planning"}
                {activeTab === "habits" && "Analysez vos habitudes de productivité"}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <NotificationSystem />
              <VoiceTaskInput onTaskCreated={handleVoiceTaskCreated} />
              <Button size="sm" className="gap-2 hidden sm:flex" onClick={handleCreateNew}>
                <Plus className="h-4 w-4" />
                <span>Nouveau</span>
              </Button>
              <Button size="sm" className="gap-2 sm:hidden" onClick={handleCreateNew}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
          <nav className="flex justify-around p-1 sm:p-2 overflow-x-auto">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              size="sm"
              className="flex-col gap-1 h-auto py-2 px-2 sm:px-3 min-w-fit"
              onClick={() => setActiveTab("dashboard")}
            >
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Dashboard</span>
            </Button>
            <Button
              variant={activeTab === "tasks" ? "default" : "ghost"}
              size="sm"
              className="flex-col gap-1 h-auto py-2 px-2 sm:px-3 min-w-fit"
              onClick={() => setActiveTab("tasks")}
            >
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Tâches</span>
            </Button>
            <Button
              variant={activeTab === "appointments" ? "default" : "ghost"}
              size="sm"
              className="flex-col gap-1 h-auto py-2 px-2 sm:px-3 min-w-fit"
              onClick={() => setActiveTab("appointments")}
            >
              <Clock className="h-4 w-4" />
              <span className="text-xs">RDV</span>
            </Button>
            <Button
              variant={activeTab === "summary" ? "default" : "ghost"}
              size="sm"
              className="flex-col gap-1 h-auto py-2 px-2 sm:px-3 min-w-fit"
              onClick={() => setActiveTab("summary")}
            >
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Résumé</span>
            </Button>
            <Button
              variant={activeTab === "calendar" ? "default" : "ghost"}
              size="sm"
              className="flex-col gap-1 h-auto py-2 px-2 sm:px-3 min-w-fit"
              onClick={() => setActiveTab("calendar")}
            >
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Calendrier</span>
            </Button>
            <Button
              variant={activeTab === "statistics" ? "default" : "ghost"}
              size="sm"
              className="flex-col gap-1 h-auto py-2 px-2 sm:px-3 min-w-fit"
              onClick={() => setActiveTab("statistics")}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Stats</span>
            </Button>
            <Button
              variant={activeTab === "optimizer" ? "default" : "ghost"}
              size="sm"
              className="flex-col gap-1 h-auto py-2 px-2 sm:px-3 min-w-fit"
              onClick={() => setActiveTab("optimizer")}
            >
              <Zap className="h-4 w-4" />
              <span className="text-xs">Optim</span>
            </Button>
            <Button
              variant={activeTab === "habits" ? "default" : "ghost"}
              size="sm"
              className="flex-col gap-1 h-auto py-2 px-2 sm:px-3 min-w-fit"
              onClick={() => setActiveTab("habits")}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Habits</span>
            </Button>
          </nav>
        </div>

        {/* Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto mb-16 lg:mb-0 mt-16 lg:mt-0">
          {activeTab === "dashboard" && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              
              <DashboardStats />
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      Tâches récentes
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Vos tâches à venir</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <TaskList limit={5} />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                      Rendez-vous à venir
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Vos prochains rendez-vous</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <AppointmentList limit={5} />
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <SmartSuggestions 
                  tasks={[]} 
                  appointments={[]} 
                  onScheduleTask={(taskId, timeSlot) => console.log('Schedule task', taskId, timeSlot)} 
                />
                <PomodoroTimer onSessionComplete={(type, duration) => console.log('Session complete', type, duration)} />
              </div>
            </div>
          )}
          
          {activeTab === "tasks" && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <AutoRescheduler 
                tasks={[]} 
                appointments={[]} 
                onTaskRescheduled={(taskId, newDate, newTime) => console.log('Task rescheduled', taskId, newDate, newTime)} 
              />
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold">Toutes les tâches</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">Gérez vos tâches et priorités</p>
                </div>
                <Button className="gap-2 w-full sm:w-auto" onClick={handleCreateTask}>
                  <Plus className="h-4 w-4" />
                  Nouvelle tâche
                </Button>
              </div>
              <TaskList />
            </div>
          )}
          
          {activeTab === "appointments" && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold">Tous les rendez-vous</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">Gérez vos rendez-vous et horaires</p>
                </div>
                <Button className="gap-2 w-full sm:w-auto" onClick={handleCreateAppointment}>
                  <Plus className="h-4 w-4" />
                  Nouveau rendez-vous
                </Button>
              </div>
              
              <AppointmentList />
            </div>
          )}
          
          {activeTab === "summary" && (
            <DailySummary />
          )}
          
          {activeTab === "calendar" && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <CalendarView 
                tasks={[]} 
                appointments={[]} 
                onDateClick={(date) => console.log('Date clicked', date)} 
              />
            </div>
          )}
          
          {activeTab === "statistics" && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <Statistics tasks={[]} appointments={[]} />
            </div>
          )}
          
          
          {activeTab === "optimizer" && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Optimisation Automatique des Tâches
                  </CardTitle>
                  <CardDescription>
                    L'IA analyse et réorganise vos tâches pour maximiser votre productivité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TaskOptimizer />
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === "habits" && (
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Analyse des Habitudes de Productivité
                  </CardTitle>
                  <CardDescription>
                    Découvrez vos patterns et améliorez votre efficacité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HabitsAnalysis />
                </CardContent>
              </Card>
            </div>
          )}
          
        </main>
      </div>
      
      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px] w-[95%] sm:w-full mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Créer un nouvel élément</DialogTitle>
            <DialogDescription className="text-sm">
              Choisissez le type d'élément à créer
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            <Button 
              variant={createType === "task" ? "default" : "outline"} 
              onClick={() => setCreateType("task")}
              className="flex-1"
            >
              Tâche
            </Button>
            <Button 
              variant={createType === "appointment" ? "default" : "outline"} 
              onClick={() => setCreateType("appointment")}
              className="flex-1"
            >
              Rendez-vous
            </Button>
          </div>
          
          {createType === "task" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Titre de la tâche</Label>
                <Input
                  id="task-title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Entrez le titre de la tâche"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Entrez la description (optionnel)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priorité</Label>
                <Select value={newTask.priority} onValueChange={(value) => setNewTask({...newTask, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="task-date">Date d'échéance</Label>
                  <Input
                    id="task-date"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-time">Heure</Label>
                  <Input
                    id="task-time"
                    type="time"
                    value={newTask.dueTime}
                    onChange={(e) => setNewTask({...newTask, dueTime: e.target.value})}
                  />
                </div>
              </div>
              
              <Button onClick={handleSubmitTask} className="w-full">
                Créer la tâche
              </Button>
            </div>
          )}
          
          {createType === "appointment" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appointment-title">Titre du rendez-vous</Label>
                <Input
                  id="appointment-title"
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})}
                  placeholder="Entrez le titre du rendez-vous"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointment-description">Description</Label>
                <Textarea
                  id="appointment-description"
                  value={newAppointment.description}
                  onChange={(e) => setNewAppointment({...newAppointment, description: e.target.value})}
                  placeholder="Entrez la description (optionnel)"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="appointment-date">Date</Label>
                  <Input
                    id="appointment-date"
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment-time">Heure</Label>
                  <Input
                    id="appointment-time"
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointment-duration">Durée (minutes)</Label>
                <Select value={newAppointment.duration} onValueChange={(value) => setNewAppointment({...newAppointment, duration: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="90">1.5 heures</SelectItem>
                    <SelectItem value="120">2 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleSubmitAppointment} className="w-full">
                Créer le rendez-vous
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
    </div>
  )
}

export default function Home() {
  return (
    <AuthWrapper>
      <HomeContent />
    </AuthWrapper>
  )
}