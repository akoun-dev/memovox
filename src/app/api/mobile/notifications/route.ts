import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MobileService } from '@/lib/mobile-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { title, body, data, type } = await request.json()

    if (!title || !body || !type) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const mobileService = MobileService.getInstance()
    
    const notifications = await mobileService.sendNotificationToUser(session.user.id, {
      title,
      body,
      data,
      type
    })

    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Simuler la récupération des notifications
    // Dans une vraie implémentation, on récupérerait depuis la base de données
    const notifications = [
      {
        id: '1',
        title: 'Rappel de tâche',
        body: 'Vous avez une tâche importante à compléter',
        type: 'task_reminder',
        readAt: null,
        sentAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Résumé quotidien',
        body: 'Voici votre résumé de productivité',
        type: 'daily_summary',
        readAt: new Date().toISOString(),
        sentAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]

    const filteredNotifications = unreadOnly 
      ? notifications.filter(n => !n.readAt)
      : notifications

    return NextResponse.json({ notifications: filteredNotifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}