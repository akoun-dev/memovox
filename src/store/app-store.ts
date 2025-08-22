import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate?: string
  createdAt: string
  emoji?: string
  estimatedDuration?: number
  isRecurring?: boolean
  recurringType?: "DAILY" | "WEEKLY" | "MONTHLY"
  recurringInterval?: number
  recurringEndDate?: string
  completedAt?: string
}

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

interface AppState {
  // Tasks
  tasks: Task[]
  loadingTasks: boolean
  tasksError: string | null
  
  // Appointments
  appointments: Appointment[]
  loadingAppointments: boolean
  appointmentsError: string | null
  
  // UI State
  activeTab: string
  sidebarOpen: boolean
  
  // Actions
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void
  setTasksLoading: (loading: boolean) => void
  setTasksError: (error: string | null) => void
  
  setAppointments: (appointments: Appointment[]) => void
  addAppointment: (appointment: Appointment) => void
  updateAppointment: (appointmentId: string, updates: Partial<Appointment>) => void
  deleteAppointment: (appointmentId: string) => void
  setAppointmentsLoading: (loading: boolean) => void
  setAppointmentsError: (error: string | null) => void
  
  setActiveTab: (tab: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  // Data fetching
  fetchTasks: () => Promise<void>
  fetchAppointments: () => Promise<void>
  
  // Clear data
  clearAllData: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      loadingTasks: false,
      tasksError: null,
      
      appointments: [],
      loadingAppointments: false,
      appointmentsError: null,
      
      activeTab: 'dashboard',
      sidebarOpen: false,
      
      // Task actions
      setTasks: (tasks) => set({ tasks }),
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (taskId, updates) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        )
      })),
      deleteTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== taskId)
      })),
      setTasksLoading: (loading) => set({ loadingTasks: loading }),
      setTasksError: (error) => set({ tasksError: error }),
      
      // Appointment actions
      setAppointments: (appointments) => set({ appointments }),
      addAppointment: (appointment) => set((state) => ({ 
        appointments: [...state.appointments, appointment] 
      })),
      updateAppointment: (appointmentId, updates) => set((state) => ({
        appointments: state.appointments.map(appointment => 
          appointment.id === appointmentId ? { ...appointment, ...updates } : appointment
        )
      })),
      deleteAppointment: (appointmentId) => set((state) => ({
        appointments: state.appointments.filter(appointment => appointment.id !== appointmentId)
      })),
      setAppointmentsLoading: (loading) => set({ loadingAppointments: loading }),
      setAppointmentsError: (error) => set({ appointmentsError: error }),
      
      // UI actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Data fetching
      fetchTasks: async () => {
        const state = get()
        if (state.loadingTasks) return
        
        set({ loadingTasks: true, tasksError: null })
        
        try {
          const response = await fetch('/api/tasks')
          if (response.ok) {
            const data = await response.json()
            set({ tasks: data, loadingTasks: false })
          } else {
            set({ 
              tasksError: 'Failed to fetch tasks', 
              loadingTasks: false 
            })
          }
        } catch (error) {
          set({ 
            tasksError: error instanceof Error ? error.message : 'Unknown error',
            loadingTasks: false 
          })
        }
      },
      
      fetchAppointments: async () => {
        const state = get()
        if (state.loadingAppointments) return
        
        set({ loadingAppointments: true, appointmentsError: null })
        
        try {
          const response = await fetch('/api/appointments')
          if (response.ok) {
            const data = await response.json()
            set({ appointments: data, loadingAppointments: false })
          } else {
            set({ 
              appointmentsError: 'Failed to fetch appointments', 
              loadingAppointments: false 
            })
          }
        } catch (error) {
          set({ 
            appointmentsError: error instanceof Error ? error.message : 'Unknown error',
            loadingAppointments: false 
          })
        }
      },
      
      // Clear data
      clearAllData: () => set({
        tasks: [],
        appointments: [],
        tasksError: null,
        appointmentsError: null,
        loadingTasks: false,
        loadingAppointments: false
      })
    }),
    {
      name: 'memovox-storage',
      partialize: (state) => ({
        tasks: state.tasks,
        appointments: state.appointments,
        activeTab: state.activeTab,
      }),
    }
  )
)