import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface ChatRequest {
  message: string;
  context: {
    tasks?: Array<{
      id: string;
      title: string;
      completed: boolean;
      priority: string;
      dueDate?: string;
    }>;
    appointments?: Array<{
      id: string;
      title: string;
      date: string;
      duration: number;
    }>;
    currentDateTime: string;
  };
}

interface ChatResponse {
  response: string;
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { message, context }: ChatRequest = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 });
    }

    const zai = await ZAI.create();

    // Prepare context information
    const today = new Date(context.currentDateTime);
    const todayTasks = context.tasks?.filter(task => !task.completed) || [];
    const todayAppointments = context.appointments?.filter(appt => 
      new Date(appt.date).toDateString() === today.toDateString()
    ) || [];

    const highPriorityTasks = todayTasks.filter(task => task.priority === 'HIGH');
    const completedTasks = context.tasks?.filter(task => task.completed) || [];

    // Create system prompt with context
    const systemPrompt = `Tu es un assistant personnel intelligent pour MemoVox, une application de gestion de tâches et rendez-vous. 

Ton rôle est d'aider les utilisateurs à :
- Gérer leurs tâches quotidiennes
- Planifier leur temps efficacement
- Leur fournir des résumés et analyses
- Répondre à leurs questions sur leur emploi du temps

Contexte actuel :
- Date et heure : ${today.toLocaleString('fr-FR')}
- Tâches en cours aujourd'hui : ${todayTasks.length}
- Tâches prioritaires : ${highPriorityTasks.length}
- Rendez-vous aujourd'hui : ${todayAppointments.length}
- Tâches complétées aujourd'hui : ${completedTasks.length}

Tâches en cours :
${todayTasks.map(task => `- ${task.title} (${task.priority.toLowerCase()})`).join('\n') || 'Aucune'}

Rendez-vous aujourd'hui :
${todayAppointments.map(appt => `- ${appt.title} à ${new Date(appt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`).join('\n') || 'Aucun'}

Règles de réponse :
1. Sois utile, concis et amical
2. Adapte ton ton au contexte (plus formel pour les questions professionnelles, plus décontracté pour les questions personnelles)
3. Propose des actions concrètes quand c'est pertinent
4. Sois précis dans tes références aux tâches et rendez-vous
5. Utilise les emojis avec modération pour rendre la conversation plus vivante
6. Quand l'utilisateur demande des actions spécifiques, propose des réponses avec des actions

Réponds de manière naturelle et conversationnelle, comme un assistant personnel attentionné.`;

    const userPrompt = `Message de l'utilisateur : "${message}"

Réponds à ce message en tenant compte du contexte fourni. Si l'utilisateur demande des actions spécifiques (comme créer une tâche, voir un résumé, etc.), inclut des suggestions d'actions dans ta réponse.

Format de réponse pour les actions :
Si tu proposes des actions, termine ta réponse par :
ACTIONS: [action1, action2, action3]

Où les actions possibles sont :
- show_tasks: Afficher les tâches
- show_appointments: Afficher les rendez-vous  
- daily_summary: Résumé quotidien
- create_task: Créer une tâche
- schedule_appointment: Planifier un rendez-vous

Exemple de réponse avec actions :
"Je vois que vous avez 3 tâches aujourd'hui dont 2 prioritaires. Souhaitez-vous que je vous aide à les organiser ?

ACTIONS: [show_tasks, create_task]"`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    let response = completion.choices[0]?.message?.content || "Je suis désolé, je n'ai pas pu comprendre votre demande.";
    let actions: Array<{ label: string; action: string; data?: any }> = [];

    // Parse actions from response
    const actionsMatch = response.match(/ACTIONS:\s*\[(.*?)\]/);
    if (actionsMatch) {
      const actionList = actionsMatch[1].split(',').map(a => a.trim().replace(/['"]/g, ''));
      
      const actionLabels: Record<string, string> = {
        'show_tasks': 'Voir mes tâches',
        'show_appointments': 'Voir mes rendez-vous',
        'daily_summary': 'Résumé du jour',
        'create_task': 'Créer une tâche',
        'schedule_appointment': 'Planifier un RDV'
      };

      actions = actionList
        .filter(action => actionLabels[action])
        .map(action => ({
          label: actionLabels[action],
          action: action
        }));

      // Remove ACTIONS part from response
      response = response.replace(/ACTIONS:\s*\[.*?\]/, '').trim();
    }

    // Add default actions for certain types of queries
    if (message.toLowerCase().includes('tâche') || message.toLowerCase().includes('faire')) {
      if (!actions.find(a => a.action === 'show_tasks')) {
        actions.push({ label: 'Voir mes tâches', action: 'show_tasks' });
      }
      if (!actions.find(a => a.action === 'create_task')) {
        actions.push({ label: 'Créer une tâche', action: 'create_task' });
      }
    }

    if (message.toLowerCase().includes('rendez-vous') || message.toLowerCase().includes('rdv')) {
      if (!actions.find(a => a.action === 'show_appointments')) {
        actions.push({ label: 'Voir mes rendez-vous', action: 'show_appointments' });
      }
      if (!actions.find(a => a.action === 'schedule_appointment')) {
        actions.push({ label: 'Planifier un RDV', action: 'schedule_appointment' });
      }
    }

    if (message.toLowerCase().includes('résumé') || message.toLowerCase().includes('journée')) {
      if (!actions.find(a => a.action === 'daily_summary')) {
        actions.push({ label: 'Résumé du jour', action: 'daily_summary' });
      }
    }

    const chatResponse: ChatResponse = {
      response,
      actions: actions.length > 0 ? actions : undefined
    };

    return NextResponse.json(chatResponse);
    
  } catch (error) {
    console.error('Erreur chat assistant:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la communication avec l\'assistant' },
      { status: 500 }
    );
  }
}