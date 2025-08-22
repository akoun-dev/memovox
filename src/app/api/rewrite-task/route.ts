import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface RewriteTaskRequest {
  text: string;
  context?: {
    type?: 'task' | 'appointment';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    category?: string;
    existingTasks?: string[];
  };
  mode?: 'complete' | 'improve' | 'classify';
}

interface RewriteTaskResponse {
  rewrittenText: string;
  suggestions: string[];
  classification?: {
    type: 'task' | 'appointment';
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    confidence: number;
  };
  improvements: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { text, context = {}, mode = 'complete' }: RewriteTaskRequest = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Texte requis' }, { status: 400 });
    }

    const zai = await ZAI.create();

    let response: RewriteTaskResponse;

    switch (mode) {
      case 'complete':
        response = await completeText(zai, text, context);
        break;
      case 'improve':
        response = await improveText(zai, text, context);
        break;
      case 'classify':
        response = await classifyText(zai, text, context);
        break;
      default:
        response = await completeText(zai, text, context);
    }

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Erreur réécriture tâche:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réécriture de la tâche' },
      { status: 500 }
    );
  }
}

async function completeText(zai: any, text: string, context: any): Promise<RewriteTaskResponse> {
  const prompt = `Complète ou reformule cette phrase de manière claire et concise pour créer une tâche ou un rendez-vous.

Texte original : "${text}"

Contexte :
${context.type ? `Type : ${context.type}` : ''}
${context.priority ? `Priorité : ${context.priority}` : ''}
${context.category ? `Catégorie : ${context.category}` : ''}

Règles :
1. Si le texte est incomplet (ex: "Préparer", "Appeler", "Réunion"), complète-le logiquement
2. Sois spécifique et précis
3. Utilise un langage clair et professionnel
4. Garde le même sens général mais améliore la formulation
5. Propose 2-3 alternatives de formulation

Réponds au format JSON :
{
  "rewrittenText": "texte réécrit",
  "suggestions": ["alternative 1", "alternative 2"],
  "improvements": ["amélioration 1", "amélioration 2"]
}`;

  const completion = await zai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 300
  });

  try {
    const responseContent = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseContent);
    
    return {
      rewrittenText: parsed.rewrittenText || text,
      suggestions: parsed.suggestions || [],
      improvements: parsed.improvements || []
    };
  } catch (error) {
    return {
      rewrittenText: text,
      suggestions: [],
      improvements: []
    };
  }
}

async function improveText(zai: any, text: string, context: any): Promise<RewriteTaskResponse> {
  const prompt = `Améliore cette description de tâche pour la rendre plus claire, plus précise et plus actionnable.

Texte original : "${text}"

Contexte :
${context.type ? `Type : ${context.type}` : ''}
${context.priority ? `Priorité : ${context.priority}` : ''}
${context.category ? `Catégorie : ${context.category}` : ''}

Règles d'amélioration :
1. Utilise des verbes d'action forts et précis
2. Sois spécifique sur les résultats attendus
3. Ajoute des détails pertinents si nécessaire
4. Rends la tâche mesurable et réalisable
5. Évite le jargon inutile
6. Propose 2-3 versions améliorées

Réponds au format JSON :
{
  "rewrittenText": "texte amélioré",
  "suggestions": ["version 1", "version 2"],
  "improvements": ["amélioration 1", "amélioration 2"]
}`;

  const completion = await zai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    max_tokens: 300
  });

  try {
    const responseContent = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseContent);
    
    return {
      rewrittenText: parsed.rewrittenText || text,
      suggestions: parsed.suggestions || [],
      improvements: parsed.improvements || []
    };
  } catch (error) {
    return {
      rewrittenText: text,
      suggestions: [],
      improvements: []
    };
  }
}

async function classifyText(zai: any, text: string, context: any): Promise<RewriteTaskResponse> {
  const prompt = `Analyse et classe cette description de tâche pour déterminer son type, sa priorité et sa catégorie.

Texte à analyser : "${text}"

Contexte existant :
${context.existingTasks ? `Tâches existantes : ${context.existingTasks.join(', ')}` : ''}

Instructions de classification :
1. **Type** : Détermine si c'est une "task" (tâche à faire) ou "appointment" (rendez-vous)
2. **Priorité** : Évalue le niveau d'urgence (low, medium, high, critical)
3. **Catégorie** : Identifie la catégorie (travail, personnel, santé, administratif, etc.)
4. **Confiance** : Évalue ta confiance dans cette classification (0-1)

Critères de priorité :
- Critical : Urgence immédiate, impact majeur, deadline aujourd'hui
- High : Important, deadline proche, impact significatif
- Medium : Important mais pas urgent, impact modéré
- Low : Peut attendre, impact mineur

Réponds au format JSON :
{
  "rewrittenText": "${text}",
  "suggestions": [],
  "classification": {
    "type": "task|appointment",
    "priority": "low|medium|high|critical",
    "category": "nom de la catégorie",
    "confidence": 0.8
  },
  "improvements": ["suggestion 1", "suggestion 2"]
}`;

  const completion = await zai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 250
  });

  try {
    const responseContent = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseContent);
    
    return {
      rewrittenText: parsed.rewrittenText || text,
      suggestions: parsed.suggestions || [],
      classification: parsed.classification || {
        type: 'task',
        priority: 'medium',
        category: 'général',
        confidence: 0.5
      },
      improvements: parsed.improvements || []
    };
  } catch (error) {
    return {
      rewrittenText: text,
      suggestions: [],
      classification: {
        type: 'task',
        priority: 'medium',
        category: 'général',
        confidence: 0.5
      },
      improvements: []
    };
  }
}