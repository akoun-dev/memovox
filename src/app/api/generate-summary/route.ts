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

interface SummaryRequest {
  tasks: Task[];
  appointments: Appointment[];
  userName?: string;
  includeTips?: boolean;
}

interface SummaryResponse {
  summary: string;
  tips?: string[];
  priorityCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  totalTasks: number;
  totalAppointments: number;
}

export async function POST(request: NextRequest) {
  try {
    const { tasks, appointments, userName = 'Utilisateur', includeTips = true }: SummaryRequest = await request.json();
    
    if (!tasks && !appointments) {
      return NextResponse.json({ error: 'Données requises' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Calculer les statistiques
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks?.filter(task => task.date === today && !task.completed) || [];
    const todayAppointments = appointments?.filter(appt => appt.date === today) || [];
    
    const priorityCount = {
      critical: todayTasks.filter(t => t.priority === 'critical').length,
      high: todayTasks.filter(t => t.priority === 'high').length,
      medium: todayTasks.filter(t => t.priority === 'medium').length,
      low: todayTasks.filter(t => t.priority === 'low').length
    };

    const systemPrompt = `Tu es un assistant personnel intelligent et bienveillant qui génère des résumés quotidiens pour aider les utilisateurs à organiser leur journée.

Ta mission est de créer un résumé naturel et motivant de la journée de l'utilisateur en te basant sur ses tâches et rendez-vous.

Règles de rédaction :
1. Commence par une salutation personnalisée et chaleureuse
2. Mentionne le nombre total de tâches et rendez-vous
3. Mets en évidence les tâches importantes/urgentes
4. Mentionne les rendez-vous importants avec leurs heures
5. Sois encourageant et positif
6. Termine par une motivation ou un bon conseil
7. Utilise un ton conversationnel et naturel
8. Adapte le niveau de formalité selon le contexte
9. Sois concis (max 3-4 phrases)

Format de sortie :
- Un texte naturel et fluide
- Pas de listes à puces
- Pas de formatage markdown
- Un paragraphe unique et cohérent

Contexte :
- Nom de l'utilisateur : ${userName}
- Date : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Heure actuelle : ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

    const userPrompt = `Voici les tâches et rendez-vous pour aujourd'hui :

Tâches (${todayTasks.length}) :
${todayTasks.map(task => 
  `- ${task.title}${task.time ? ` à ${task.time}` : ''}${task.priority === 'critical' || task.priority === 'high' ? ' (prioritaire)' : ''}`
).join('\n')}

Rendez-vous (${todayAppointments.length}) :
${todayAppointments.map(appt => 
  `- ${appt.title} à ${appt.time}${appt.location ? ` (${appt.location})` : ''}`
).join('\n')}

Génère un résumé naturel et motivant pour commencer la journée.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const summary = completion.choices[0]?.message?.content || '';

    let tips: string[] = [];
    if (includeTips && (todayTasks.length > 0 || todayAppointments.length > 0)) {
      tips = await generateTips(zai, todayTasks, todayAppointments);
    }

    const response: SummaryResponse = {
      summary,
      tips: includeTips ? tips : undefined,
      priorityCount,
      totalTasks: todayTasks.length,
      totalAppointments: todayAppointments.length
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Erreur génération résumé:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du résumé' },
      { status: 500 }
    );
  }
}

async function generateTips(zai: any, tasks: Task[], appointments: Appointment[]): Promise<string[]> {
  try {
    const tipsPrompt = `Génère 3 conseils pratiques et motivants pour aider l'utilisateur à bien organiser sa journée en fonction de ses tâches et rendez-vous.

Contexte :
- Tâches : ${tasks.length} (dont ${tasks.filter(t => t.priority === 'critical' || t.priority === 'high').length} prioritaires)
- Rendez-vous : ${appointments.length}

Règles :
- Les conseils doivent être courts, pratiques et actionnables
- Un conseil par ligne
- Maximum 3 conseils
- Sois encourageant et positif
- Adapte les conseils à la charge de travail de la journée

Réponds uniquement avec les conseils, un par ligne.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'user', content: tipsPrompt }
      ],
      temperature: 0.6,
      max_tokens: 200
    });

    const tipsText = completion.choices[0]?.message?.content || '';
    return tipsText.split('\n').filter(tip => tip.trim().length > 0).slice(0, 3);
    
  } catch (error) {
    console.error('Erreur génération conseils:', error);
    return [
      "Commence par les tâches les plus importantes pour un maximum de productivité",
      "Prévois des pauses régulières pour rester concentré toute la journée",
      "N'oublie pas de célébrer chaque tâche accomplie !"
    ];
  }
}