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

interface SuggestSlotRequest {
  tasks: Task[];
  appointments: Appointment[];
  newTaskDuration?: number;
  newTaskPriority?: 'low' | 'medium' | 'high' | 'critical';
  preferredTimeRange?: {
    start: string; // HH:MM
    end: string;   // HH:MM
  };
  date?: string; // YYYY-MM-DD, defaults to today
}

interface TimeSlot {
  start: string; // HH:MM
  end: string;   // HH:MM
  duration: number; // minutes
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

interface SuggestSlotResponse {
  suggestedSlots: TimeSlot[];
  bestSlot?: TimeSlot;
  analysis: string;
  totalAvailableTime: number; // minutes
  totalBusyTime: number; // minutes
}

export async function POST(request: NextRequest) {
  try {
    const {
      tasks,
      appointments,
      newTaskDuration = 30,
      newTaskPriority = 'medium',
      preferredTimeRange,
      date
    }: SuggestSlotRequest = await request.json();

    if (!tasks && !appointments) {
      return NextResponse.json({ error: 'Données requises' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Use provided date or default to today
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Filter tasks and appointments for the target date
    const todayTasks = tasks?.filter(task => task.date === targetDate && !task.completed) || [];
    const todayAppointments = appointments?.filter(appt => appt.date === targetDate) || [];

    // Generate available time slots
    const availableSlots = generateAvailableSlots(todayAppointments, todayTasks, preferredTimeRange);
    
    // Filter slots that can accommodate the new task
    const suitableSlots = availableSlots.filter(slot => slot.duration >= newTaskDuration);
    
    // Rank slots by AI
    const rankedSlots = await rankSlotsWithAI(zai, suitableSlots, newTaskPriority, todayTasks, todayAppointments);

    // Calculate statistics
    const totalBusyTime = calculateTotalBusyTime(todayAppointments, todayTasks);
    const totalAvailableTime = 24 * 60 - totalBusyTime; // Total minutes in day minus busy time

    // Generate AI analysis
    const analysis = await generateAnalysis(zai, rankedSlots, newTaskDuration, newTaskPriority, totalAvailableTime);

    const response: SuggestSlotResponse = {
      suggestedSlots: rankedSlots,
      bestSlot: rankedSlots[0],
      analysis,
      totalAvailableTime,
      totalBusyTime
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur suggestion créneaux:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suggestion de créneaux' },
      { status: 500 }
    );
  }
}

function generateAvailableSlots(
  appointments: Appointment[],
  tasks: Task[],
  preferredTimeRange?: { start: string; end: string }
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Define working hours (default 9:00 to 18:00)
  const workStart = preferredTimeRange?.start || '09:00';
  const workEnd = preferredTimeRange?.end || '18:00';
  
  // Create busy periods (appointments + tasks with times)
  const busyPeriods: Array<{ start: number; end: number }> = [];
  
  // Add appointments
  appointments.forEach(appt => {
    const [startHour, startMin] = appt.time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = startMinutes + appt.duration;
    busyPeriods.push({ start: startMinutes, end: endMinutes });
  });
  
  // Add tasks with specific times
  tasks.forEach(task => {
    if (task.time) {
      const [startHour, startMin] = task.time.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const duration = task.duration || 30;
      const endMinutes = startMinutes + duration;
      busyPeriods.push({ start: startMinutes, end: endMinutes });
    }
  });
  
  // Sort busy periods by start time
  busyPeriods.sort((a, b) => a.start - b.start);
  
  // Convert work hours to minutes
  const [workStartHour, workStartMin] = workStart.split(':').map(Number);
  const [workEndHour, workEndMin] = workEnd.split(':').map(Number);
  const workStartMinutes = workStartHour * 60 + workStartMin;
  const workEndMinutes = workEndHour * 60 + workEndMin;
  
  // Generate available slots
  let currentTime = workStartMinutes;
  
  busyPeriods.forEach(period => {
    if (period.start > currentTime) {
      const slotDuration = period.start - currentTime;
      if (slotDuration >= 15) { // Minimum 15 minutes slot
        slots.push({
          start: minutesToTime(currentTime),
          end: minutesToTime(period.start),
          duration: slotDuration,
          confidence: 'medium',
          reason: 'Créneau libre entre deux engagements'
        });
      }
    }
    currentTime = Math.max(currentTime, period.end);
  });
  
  // Add slot after last busy period
  if (workEndMinutes > currentTime) {
    const slotDuration = workEndMinutes - currentTime;
    if (slotDuration >= 15) {
      slots.push({
        start: minutesToTime(currentTime),
        end: minutesToTime(workEndMinutes),
        duration: slotDuration,
        confidence: 'medium',
        reason: 'Créneau libre en fin de journée'
      });
    }
  }
  
  return slots;
}

async function rankSlotsWithAI(
  zai: any,
  slots: TimeSlot[],
  priority: string,
  tasks: Task[],
  appointments: Appointment[]
): Promise<TimeSlot[]> {
  if (slots.length === 0) return [];
  
  try {
    const slotsDescription = slots.map((slot, index) => 
      `${index + 1}. ${slot.start} - ${slot.end} (${slot.duration}min)`
    ).join('\n');
    
    const prompt = `Analyse ces créneaux disponibles et classe-les par ordre de préférence pour une nouvelle tâche.

Priorité de la tâche : ${priority}
Créneaux disponibles :
${slotsDescription}

Contexte de la journée :
- Tâches existantes : ${tasks.length}
- Rendez-vous : ${appointments.length}

Règles de classement :
1. Pour les tâches prioritaires (high/critical) : préférer les créneaux du matin
2. Pour les tâches moins prioritaires (low/medium) : après-midi acceptable
3. Éviter les créneaux trop proches des repas (12:00-14:00)
4. Préférer les créneaux plus longs pour plus de flexibilité
5. Éviter les créneaux en fin de journée si possible

Réponds uniquement avec les numéros des créneaux dans l'ordre de préférence, séparés par des virgules (ex: "3,1,2")`;

    const completion = await zai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 50
    });

    const response = completion.choices[0]?.message?.content || '';
    const preferredOrder = response.split(',').map(num => parseInt(num.trim()) - 1).filter(i => !isNaN(i) && i >= 0 && i < slots.length);
    
    // Create ranked array
    const rankedSlots: TimeSlot[] = [];
    const usedIndices = new Set<number>();
    
    // Add slots in preferred order
    preferredOrder.forEach(index => {
      if (!usedIndices.has(index)) {
        const slot = { ...slots[index] };
        // Update confidence based on position
        if (rankedSlots.length === 0) slot.confidence = 'high';
        else if (rankedSlots.length === 1) slot.confidence = 'medium';
        else slot.confidence = 'low';
        rankedSlots.push(slot);
        usedIndices.add(index);
      }
    });
    
    // Add remaining slots
    slots.forEach((slot, index) => {
      if (!usedIndices.has(index)) {
        rankedSlots.push({ ...slot, confidence: 'low' });
      }
    });
    
    return rankedSlots;
    
  } catch (error) {
    console.error('Erreur classement créneaux:', error);
    // Fallback: return slots in original order with adjusted confidence
    return slots.map((slot, index) => ({
      ...slot,
      confidence: index === 0 ? 'high' : index === 1 ? 'medium' : 'low'
    }));
  }
}

async function generateAnalysis(
  zai: any,
  slots: TimeSlot[],
  duration: number,
  priority: string,
  availableTime: number
): Promise<string> {
  try {
    const prompt = `Génère une brève analyse (2-3 phrases) des possibilités d'organisation pour cette nouvelle tâche.

Détails :
- Durée nécessaire : ${duration} minutes
- Priorité : ${priority}
- Temps disponible aujourd'hui : ${availableTime} minutes
- Créneaux suggérés : ${slots.length}

${slots.length > 0 ? 
  `Meilleur créneau : ${slots[0].start} - ${slots[0].end} (${slots[0].duration}min)` :
  'Aucun créneau disponible'
}

Règles :
- Sois encourageant et positif
- Donne un conseil pratique
- Sois concis (max 2-3 phrases)
- Utilise un ton conversationnel`;

    const completion = await zai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 150
    });

    return completion.choices[0]?.message?.content || 'Analyse non disponible';
    
  } catch (error) {
    console.error('Erreur génération analyse:', error);
    return slots.length > 0 ? 
      `Je vous suggère le créneau de ${slots[0].start} à ${slots[0].end} pour cette tâche.` :
      'Aucun créneau disponible aujourd\'hui pour cette tâche.';
  }
}

function calculateTotalBusyTime(appointments: Appointment[], tasks: Task[]): number {
  let totalMinutes = 0;
  
  // Add appointment durations
  appointments.forEach(appt => {
    totalMinutes += appt.duration;
  });
  
  // Add task durations (for tasks with specific times)
  tasks.forEach(task => {
    if (task.time) {
      totalMinutes += task.duration || 30;
    }
  });
  
  return totalMinutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}