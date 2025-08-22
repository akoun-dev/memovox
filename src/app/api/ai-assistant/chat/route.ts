import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AIAssistant } from '@/lib/ai-assistant'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { message, context } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message manquant' }, { status: 400 })
    }

    const assistant = AIAssistant.getInstance()

    // Récupérer les données utilisateur pour le contexte
    let assistantContext = context

    if (!assistantContext) {
      const [tasks, appointments, userSettings] = await Promise.all([
        db.task.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: 'desc' },
          take: 20
        }),
        db.appointment.findMany({
          where: { userId: session.user.id },
          orderBy: { date: 'asc' },
          take: 10
        }),
        db.userSettings.findUnique({
          where: { userId: session.user.id }
        })
      ])

      assistantContext = {
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          completed: task.completed,
          dueDate: task.dueDate?.toISOString(),
          estimatedDuration: task.estimatedDuration
        })),
        appointments: appointments.map(appt => ({
          id: appt.id,
          title: appt.title,
          date: appt.date.toISOString(),
          duration: appt.duration
        })),
        userPreferences: {
          workingHours: { start: '09:00', end: '18:00' },
          timezone: userSettings?.timezone || 'Europe/Paris',
          language: userSettings?.language || 'fr'
        },
        currentDate: new Date()
      }
    }

    assistant.setContext(assistantContext)

    const result = await assistant.processMessage(message)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing AI assistant request:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const assistant = AIAssistant.getInstance()
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'suggestions') {
      const suggestions = await assistant.getSmartSuggestions()
      return NextResponse.json({ suggestions })
    }

    if (action === 'history') {
      const history = assistant.getConversationHistory()
      return NextResponse.json({ history })
    }

    if (action === 'stats') {
      const stats = assistant.getAssistantStats()
      return NextResponse.json({ stats })
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
  } catch (error) {
    console.error('Error in AI assistant GET request:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const assistant = AIAssistant.getInstance()
    assistant.clearConversation()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing AI assistant conversation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}