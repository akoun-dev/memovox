import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface ParsedTask {
  title: string;
  date?: string;
  time?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
  type: 'task' | 'appointment';
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Texte requis' }, { status: 400 });
    }

    const zai = await ZAI.create();

    const systemPrompt = `Tu es un assistant intelligent spécialisé dans l'analyse de commandes vocales pour la création de tâches et rendez-vous. 

Ta mission est d'analyser la phrase fournie et d'extraire les informations suivantes au format JSON :

1. **title** : Le titre principal de la tâche ou rendez-vous
2. **date** : La date (format YYYY-MM-DD) ou expressions relatives comme "demain", "après-demain", "la semaine prochaine"
3. **time** : L'heure (format HH:MM) ou expressions comme "à 14h", "ce matin", "cet après-midi"
4. **priority** : La priorité (low, medium, high, critical) basée sur le contexte
5. **duration** : Durée estimée en minutes (si mentionnée ou inférée)
6. **type** : "task" pour une tâche, "appointment" pour un rendez-vous
7. **description** : Description supplémentaire si nécessaire

Règles d'analyse :
- Détecte les mots-clés comme "appeler", "réunion", "rendez-vous", "dentiste", "médecin" pour identifier le type
- Extrais les dates et heures avec flexibilité
- Détermine la priorité en fonction des mots comme "urgent", "important", "rapidement"
- Estime la durée si non spécifiée (ex: appel = 15min, réunion = 60min, rendez-vous médical = 30min)
- Pour les dates relatives, calcule la date réelle à partir d'aujourd'hui

Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte supplémentaire.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    let parsedTask: ParsedTask;
    
    try {
      const responseContent = completion.choices[0]?.message?.content || '{}';
      parsedTask = JSON.parse(responseContent);
      
      // Normalisation et validation des données
      if (!parsedTask.title) {
        parsedTask.title = text.substring(0, 50); // Fallback
      }
      
      // Conversion des dates relatives
      if (parsedTask.date) {
        parsedTask.date = normalizeDate(parsedTask.date);
      }
      
      // Conversion des heures
      if (parsedTask.time) {
        parsedTask.time = normalizeTime(parsedTask.time);
      }
      
      // Définition du type par défaut
      if (!parsedTask.type) {
        parsedTask.type = 'task';
      }
      
      // Estimation de la durée si non fournie
      if (!parsedTask.duration) {
        parsedTask.duration = estimateDuration(parsedTask.title, parsedTask.type);
      }
      
      // Détection de la priorité si non fournie
      if (!parsedTask.priority) {
        parsedTask.priority = detectPriority(text);
      }
      
    } catch (parseError) {
      console.error('Erreur parsing JSON:', parseError);
      // Fallback en cas d'erreur de parsing
      parsedTask = {
        title: text.substring(0, 50),
        type: 'task',
        priority: 'medium',
        duration: 30
      };
    }

    return NextResponse.json(parsedTask);
    
  } catch (error) {
    console.error('Erreur analyse NLP:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse de la commande' },
      { status: 500 }
    );
  }
}

// Fonctions utilitaires
function normalizeDate(dateStr: string): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  
  const lowerDate = dateStr.toLowerCase();
  
  if (lowerDate.includes('aujourd\'hui') || lowerDate.includes('today')) {
    return today.toISOString().split('T')[0];
  } else if (lowerDate.includes('demain') || lowerDate.includes('tomorrow')) {
    return tomorrow.toISOString().split('T')[0];
  } else if (lowerDate.includes('après-demain')) {
    return dayAfterTomorrow.toISOString().split('T')[0];
  }
  
  // Tenter de parser une date complète
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return today.toISOString().split('T')[0]; // Fallback
}

function normalizeTime(timeStr: string): string {
  const lowerTime = timeStr.toLowerCase();
  
  // Expressions courantes
  if (lowerTime.includes('matin') || lowerTime.includes('morning')) {
    return '09:00';
  } else if (lowerTime.includes('après-midi') || lowerTime.includes('afternoon')) {
    return '14:00';
  } else if (lowerTime.includes('soir') || lowerTime.includes('evening')) {
    return '18:00';
  }
  
  // Extraire les heures (format "14h", "14:00", etc.)
  const timeMatch = timeStr.match(/(\d{1,2})[h:](\d{0,2})?/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }
  
  return '12:00'; // Fallback
}

function estimateDuration(title: string, type: string): number {
  const lowerTitle = title.toLowerCase();
  
  if (type === 'appointment') {
    if (lowerTitle.includes('dentiste') || lowerTitle.includes('médecin')) {
      return 30;
    } else if (lowerTitle.includes('réunion') || lowerTitle.includes('meeting')) {
      return 60;
    }
    return 45;
  }
  
  // Tâches
  if (lowerTitle.includes('appeler') || lowerTitle.includes('téléphoner')) {
    return 15;
  } else if (lowerTitle.includes('email') || lowerTitle.includes('mail')) {
    return 20;
  } else if (lowerTitle.includes('préparer') || lowerTitle.includes('préparation')) {
    return 45;
  } else if (lowerTitle.includes('réunion') || lowerTitle.includes('meeting')) {
    return 60;
  }
  
  return 30; // Durée par défaut
}

function detectPriority(text: string): 'low' | 'medium' | 'high' | 'critical' {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('urgent') || lowerText.includes('immédiat') || lowerText.includes('critique')) {
    return 'critical';
  } else if (lowerText.includes('important') || lowerText.includes('prioritaire') || lowerText.includes('rapidement')) {
    return 'high';
  } else if (lowerText.includes('quand tu peux') || lowerText.includes('quand tu as le temps')) {
    return 'low';
  }
  
  return 'medium';
}