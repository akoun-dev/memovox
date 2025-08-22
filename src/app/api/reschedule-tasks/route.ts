import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  date?: string;
  time?: string;
  duration?: number;
  completed: boolean;
  description?: string;
  dueDate?: string;
  overdue?: boolean;
}

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  location?: string;
  description?: string;
}

interface RescheduleRequest {
  tasks: Task[];
  appointments: Appointment[];
  targetTaskId?: string; // Specific task to reschedule, or all overdue tasks
  mode?: 'single' | 'all_overdue';
  preferredTimeRange?: {
    start: string; // HH:MM
    end: string;   // HH:MM
  };
}

interface RescheduleSuggestion {
  taskId: string;
  taskTitle: string;
  suggestedDate: string;
  suggestedTime: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface RescheduleResponse {
  suggestions: RescheduleSuggestion[];
  analysis: string;
  totalTasksToReschedule: number;
  availableSlots: Array<{
    date: string;
    start: string;
    end: string;
    duration: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const {
      tasks,
      appointments,
      targetTaskId,
      mode = 'all_overdue',
      preferredTimeRange
    }: RescheduleRequest = await request.json();

    if (!tasks || !appointments) {
      return NextResponse.json({ error: 'Données requises' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Identify tasks that need rescheduling
    const today = new Date().toISOString().split('T')[0];
    let tasksToReschedule: Task[] = [];

    if (mode === 'single' && targetTaskId) {
      const targetTask = tasks.find(task => task.id === targetTaskId);
      if (targetTask) {
        tasksToReschedule = [targetTask];
      }
    } else {
      // Find overdue tasks or tasks that need rescheduling
      tasksToReschedule = tasks.filter(task => {
        if (task.completed) return false;
        
        // Check if task is overdue
        if (task.dueDate && new Date(task.dueDate) < new Date()) {
          return true;
        }
        
        // Check if task was scheduled for today but not completed
        if (task.date === today && !task.completed) {
          return true;
        }
        
        return false;
      });
    }

    if (tasksToReschedule.length === 0) {
      return NextResponse.json({
        suggestions: [],
        analysis: "Aucune tâche ne nécessite de replanification pour le moment.",
        totalTasksToReschedule: 0,
        availableSlots: []
      });
    }

    // Sort tasks by priority
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    tasksToReschedule.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    // Generate available slots for the next 7 days
    const availableSlots = await generateAvailableSlots(zai, appointments, tasks, preferredTimeRange);
    
    // Generate rescheduling suggestions
    const suggestions = await generateReschedulingSuggestions(
      zai, 
      tasksToReschedule, 
      availableSlots, 
      appointments, 
      tasks
    );

    // Generate analysis
    const analysis = await generateAnalysis(zai, suggestions, tasksToReschedule.length);

    const response: RescheduleResponse = {
      suggestions,
      analysis,
      totalTasksToReschedule: tasksToReschedule.length,
      availableSlots
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur replanification:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la replanification automatique' },
      { status: 500 }
    );
  }
}

async function generateAvailableSlots(
  zai: any,
  appointments: Appointment[],
  allTasks: Task[],
  preferredTimeRange?: { start: string; end: string }
): Promise<Array<{ date: string; start: string; end: string; duration: number }>> {
  const slots: Array<{ date: string; start: string; end: string; duration: number }> = [];
  
  // Define working hours (default 9:00 to 18:00)
  const workStart = preferredTimeRange?.start || '09:00';
  const workEnd = preferredTimeRange?.end || '18:00';
  
  // Look for slots in the next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayOffset);
    const dateStr = targetDate.toISOString().split('T')[0];
    
    // Get appointments and tasks for this day
    const dayAppointments = appointments.filter(appt => appt.date === dateStr);
    const dayTasks = allTasks.filter(task => task.date === dateStr && !task.completed && task.time);
    
    // Create busy periods
    const busyPeriods: Array<{ start: number; end: number }> = [];
    
    // Add appointments
    dayAppointments.forEach(appt => {
      const [startHour, startMin] = appt.time.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = startMinutes + appt.duration;
      busyPeriods.push({ start: startMinutes, end: endMinutes });
    });
    
    // Add tasks with specific times
    dayTasks.forEach(task => {
      if (task.time) {
        const [startHour, startMin] = task.time.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const duration = task.duration || 30;
        const endMinutes = startMinutes + duration;
        busyPeriods.push({ start: startMinutes, end: endMinutes });
      }
    });
    
    // Sort busy periods
    busyPeriods.sort((a, b) => a.start - b.start);
    
    // Convert work hours to minutes
    const [workStartHour, workStartMin] = workStart.split(':').map(Number);
    const [workEndHour, workEndMin] = workEnd.split(':').map(Number);
    const workStartMinutes = workStartHour * 60 + workStartMin;
    const workEndMinutes = workEndHour * 60 + workEndMin;
    
    // Find available slots
    let currentTime = workStartMinutes;
    
    busyPeriods.forEach(period => {
      if (period.start > currentTime) {
        const slotDuration = period.start - currentTime;
        if (slotDuration >= 30) { // Minimum 30 minutes
          slots.push({
            date: dateStr,
            start: minutesToTime(currentTime),
            end: minutesToTime(period.start),
            duration: slotDuration
          });
        }
      }
      currentTime = Math.max(currentTime, period.end);
    });
    
    // Add slot after last busy period
    if (workEndMinutes > currentTime) {
      const slotDuration = workEndMinutes - currentTime;
      if (slotDuration >= 30) {
        slots.push({
          date: dateStr,
          start: minutesToTime(currentTime),
          end: minutesToTime(workEndMinutes),
          duration: slotDuration
        });
      }
    }
  }
  
  return slots;
}

async function generateReschedulingSuggestions(
  zai: any,
  tasksToReschedule: Task[],
  availableSlots: Array<{ date: string; start: string; end: string; duration: number }>,
  appointments: Appointment[],
  allTasks: Task[]
): Promise<RescheduleSuggestion[]> {
  const suggestions: RescheduleSuggestion[] = [];
  
  for (const task of tasksToReschedule) {
    const taskDuration = task.duration || 30;
    
    // Find suitable slots for this task
    const suitableSlots = availableSlots.filter(slot => slot.duration >= taskDuration);
    
    if (suitableSlots.length === 0) continue;
    
    // Use AI to select the best slot
    const bestSlot = await selectBestSlotWithAI(zai, task, suitableSlots.slice(0, 5), appointments, allTasks);
    
    if (bestSlot) {
      suggestions.push({
        taskId: task.id,
        taskTitle: task.title,
        suggestedDate: bestSlot.date,
        suggestedTime: bestSlot.start,
        confidence: bestSlot.confidence,
        reason: bestSlot.reason,
        priority: task.priority
      });
    }
  }
  
  return suggestions;
}

async function selectBestSlotWithAI(
  zai: any,
  task: Task,
  slots: Array<{ date: string; start: string; end: string; duration: number }>,
  appointments: Appointment[],
  allTasks: Task[]
): Promise<{ date: string; start: string; confidence: 'high' | 'medium' | 'low'; reason: string } | null> {
  try {
    const slotsDescription = slots.map((slot, index) => 
      `${index + 1}. ${slot.date} ${slot.start} (${slot.duration}min)`
    ).join('\n');
    
    const prompt = `Sélectionne le meilleur créneau pour replanifier cette tâche :

Tâche : "${task.title}"
Priorité : ${task.priority}
Durée nécessaire : ${task.duration || 30} minutes

Créneaux disponibles :
${slotsDescription}

Critères de sélection :
1. Pour les tâches critiques/high : préférer les créneaux du matin ou le jour même
2. Pour les tâches moins urgentes : les prochains jours sont acceptables
3. Éviter les créneaux trop proches d'autres rendez-vous importants
4. Considérer la charge de travail globale de la journée

Réponds uniquement avec le numéro du meilleur créneau (1, 2, 3, etc.)`;

    const completion = await zai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 10
    });

    const response = completion.choices[0]?.message?.content || '';
    const selectedIndex = parseInt(response.trim()) - 1;
    
    if (selectedIndex >= 0 && selectedIndex < slots.length) {
      const selectedSlot = slots[selectedIndex];
      
      // Generate reason
      const reasonPrompt = `Explique brièvement pourquoi ce créneau (${selectedSlot.date} ${selectedSlot.start}) est le meilleur pour la tâche "${task.title}" (priorité ${task.priority}). Sois concis (1 phrase).`;
      
      const reasonCompletion = await zai.chat.completions.create({
        messages: [{ role: 'user', content: reasonPrompt }],
        temperature: 0.5,
        max_tokens: 100
      });
      
      const reason = reasonCompletion.choices[0]?.message?.content || 
        `Créneau recommandé basé sur la priorité et la disponibilité.`;
      
      return {
        date: selectedSlot.date,
        start: selectedSlot.start,
        confidence: selectedIndex === 0 ? 'high' : selectedIndex === 1 ? 'medium' : 'low',
        reason
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Erreur sélection créneau:', error);
    return slots.length > 0 ? {
      date: slots[0].date,
      start: slots[0].start,
      confidence: 'medium',
      reason: 'Créneau sélectionné par défaut'
    } : null;
  }
}

async function generateAnalysis(
  zai: any,
  suggestions: RescheduleSuggestion[],
  totalTasks: number
): Promise<string> {
  try {
    const prompt = `Génère une brève analyse (2-3 phrases) de la situation de replanification.

Contexte :
- Tâches à replanifier : ${totalTasks}
- Suggestions générées : ${suggestions.length}
- Priorités concernées : ${[...new Set(suggestions.map(s => s.priority))].join(', ')}

Règles :
- Sois encourageur et positif
- Donne un aperçu de l'impact sur l'organisation
- Sois concis et utile`;

    const completion = await zai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 150
    });

    return completion.choices[0]?.message?.content || 
      `${totalTasks} tâches ont été identifiées pour replanification avec ${suggestions.length} suggestions générées.`;
    
  } catch (error) {
    console.error('Erreur génération analyse:', error);
    return `${totalTasks} tâches nécessitent une replanification. ${suggestions.length} créneaux ont été suggérés.`;
  }
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}