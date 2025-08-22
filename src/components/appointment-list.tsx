"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, Edit, Trash2, Plus, Users, Loader2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useSession } from "next-auth/react"

interface Appointment {
  id: string
  title: string
  description?: string
  location?: string
  date: string
  duration: number
  createdAt: string
  emoji?: string
  reminderTime?: string
  isRecurring?: boolean
  recurringType?: "DAILY" | "WEEKLY" | "MONTHLY"
  recurringInterval?: number
  recurringEndDate?: string
}

interface AppointmentListProps {
  limit?: number
}

export function AppointmentList({ limit }: AppointmentListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [newAppointment, setNewAppointment] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    duration: 30
  })
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated") {
      fetchAppointments()
    } else if (status === "unauthenticated") {
      setLoading(false)
    }
  }, [status])

  const fetchAppointments = async () => {
    if (status !== "authenticated") {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/appointments')
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      } else if (response.status === 401) {
        console.error('Non autorisé - session expirée')
        // La session sera gérée par AuthWrapper
      } else {
        console.error('Failed to fetch appointments:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const displayAppointments = limit 
    ? appointments
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, limit)
    : appointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const deleteAppointment = async (appointmentId: string) => {
    if (status !== "authenticated") return

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchAppointments() // Refresh the list
      } else {
        console.error('Failed to delete appointment:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
    }
  }

  const handleCreateAppointment = async () => {
    if (status !== "authenticated") return

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newAppointment.title,
          description: newAppointment.description,
          location: newAppointment.location,
          date: newAppointment.date,
          duration: newAppointment.duration
        })
      })

      if (response.ok) {
        await fetchAppointments() // Refresh the list
        
        setNewAppointment({ title: "", description: "", location: "", date: "", duration: 30 })
        setIsDialogOpen(false)
      } else {
        console.error('Failed to create appointment:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
    }
  }

  const handleEditAppointment = async () => {
    if (!editingAppointment || status !== "authenticated") return
    
    try {
      const response = await fetch(`/api/appointments/${editingAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingAppointment.title,
          description: editingAppointment.description,
          location: editingAppointment.location,
          date: editingAppointment.date,
          duration: editingAppointment.duration
        })
      })

      if (response.ok) {
        await fetchAppointments() // Refresh the list
        setEditingAppointment(null)
        setIsDialogOpen(false)
      } else {
        console.error('Failed to update appointment:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
    }
  }

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setIsDialogOpen(true)
  }

  const isToday = (date: string) => {
    const today = new Date()
    return new Date(date).toDateString() === today.toDateString()
  }

  const isTomorrow = (date: string) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return new Date(date).toDateString() === tomorrow.toDateString()
  }

  const isPast = (date: string) => {
    return new Date(date) < new Date()
  }

  const formatAppointmentDate = (date: string) => {
    if (isToday(date)) {
      return "Aujourd'hui"
    } else if (isTomorrow(date)) {
      return "Demain"
    } else {
      return format(new Date(date), "dd MMMM", { locale: fr })
    }
  }

  const getAppointmentStatus = (date: string) => {
    if (isPast(date)) {
      return <Badge variant="secondary">Passé</Badge>
    } else if (isToday(date)) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Aujourd'hui</Badge>
    } else if (isTomorrow(date)) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Demain</Badge>
    } else {
      return <Badge variant="outline">À venir</Badge>
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {status === "loading" ? (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 animate-spin" />
          <p className="text-sm sm:text-base">Chargement...</p>
        </div>
      ) : status === "unauthenticated" ? (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-sm sm:text-base">Veuillez vous connecter pour voir vos rendez-vous</p>
        </div>
      ) : loading ? (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 animate-spin" />
          <p className="text-sm sm:text-base">Chargement des rendez-vous...</p>
        </div>
      ) : displayAppointments.length === 0 ? (
        <div className="text-center py-6 sm:py-8 text-muted-foreground">
          <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
          <p className="text-sm sm:text-base">Aucun rendez-vous pour le moment</p>
        </div>
      ) : (
        displayAppointments.map((appointment) => (
          <Card key={appointment.id} className={`p-3 sm:p-4 ${isPast(appointment.date) ? 'opacity-60' : ''}`}>
            <CardContent className="p-0">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base truncate">{appointment.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {getAppointmentStatus(appointment.date)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => openEditDialog(appointment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => deleteAppointment(appointment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {appointment.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {appointment.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{formatAppointmentDate(appointment.date)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{format(new Date(appointment.date), "HH:mm", { locale: fr })}</span>
                    <span>-</span>
                    <span>
                      {format(new Date(new Date(appointment.date).getTime() + appointment.duration * 60000), "HH:mm", { locale: fr })}
                    </span>
                  </div>
                  
                  {appointment.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{appointment.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      
      {!limit && status === "authenticated" && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un rendez-vous
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] w-[95%] sm:w-full mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingAppointment ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Titre</label>
                <Input
                  value={editingAppointment ? editingAppointment.title : newAppointment.title}
                  onChange={(e) => {
                    if (editingAppointment) {
                      setEditingAppointment({ ...editingAppointment, title: e.target.value })
                    } else {
                      setNewAppointment({ ...newAppointment, title: e.target.value })
                    }
                  }}
                  placeholder="Titre du rendez-vous"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingAppointment ? editingAppointment.description || "" : newAppointment.description}
                  onChange={(e) => {
                    if (editingAppointment) {
                      setEditingAppointment({ ...editingAppointment, description: e.target.value })
                    } else {
                      setNewAppointment({ ...newAppointment, description: e.target.value })
                    }
                  }}
                  placeholder="Description du rendez-vous"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Lieu</label>
                <Input
                  value={editingAppointment ? editingAppointment.location || "" : newAppointment.location}
                  onChange={(e) => {
                    if (editingAppointment) {
                      setEditingAppointment({ ...editingAppointment, location: e.target.value })
                    } else {
                      setNewAppointment({ ...newAppointment, location: e.target.value })
                    }
                  }}
                  placeholder="Lieu du rendez-vous"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="datetime-local"
                  value={editingAppointment ? 
                    new Date(editingAppointment.date).toISOString().slice(0, 16) : 
                    newAppointment.date
                  }
                  onChange={(e) => {
                    if (editingAppointment) {
                      setEditingAppointment({ ...editingAppointment, date: new Date(e.target.value).toISOString() })
                    } else {
                      setNewAppointment({ ...newAppointment, date: e.target.value })
                    }
                  }}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Durée (minutes)</label>
                <Input
                  type="number"
                  value={editingAppointment ? editingAppointment.duration : newAppointment.duration}
                  onChange={(e) => {
                    if (editingAppointment) {
                      setEditingAppointment({ ...editingAppointment, duration: parseInt(e.target.value) || 30 })
                    } else {
                      setNewAppointment({ ...newAppointment, duration: parseInt(e.target.value) || 30 })
                    }
                  }}
                  min="15"
                  max="480"
                  step="15"
                />
              </div>
              
              <Button 
                onClick={editingAppointment ? handleEditAppointment : handleCreateAppointment}
                className="w-full"
                disabled={!(editingAppointment ? editingAppointment.title : newAppointment.title).trim()}
              >
                {editingAppointment ? "Modifier le rendez-vous" : "Créer le rendez-vous"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}