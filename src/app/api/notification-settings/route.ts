import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  taskReminders: boolean
  appointmentReminders: boolean
  dailySummary: boolean
  weeklySummary: boolean
  reminderTime: string
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        notificationSettings: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Return notification settings or default values
    const settings = user.notificationSettings || {
      emailNotifications: true,
      pushNotifications: true,
      taskReminders: true,
      appointmentReminders: true,
      dailySummary: true,
      weeklySummary: true,
      reminderTime: "09:00",
      quietHoursEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00"
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres de notification:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const body = await request.json()
    const { emailNotifications, pushNotifications, taskReminders, appointmentReminders, dailySummary, weeklySummary, reminderTime, quietHours } = body

    // Upsert notification settings
    const settings = await db.notificationSettings.upsert({
      where: { userId: user.id },
      update: {
        emailNotifications,
        pushNotifications,
        taskReminders,
        appointmentReminders,
        dailySummary,
        weeklySummary,
        reminderTime,
        quietHoursEnabled: quietHours.enabled,
        quietHoursStart: quietHours.start,
        quietHoursEnd: quietHours.end,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        emailNotifications,
        pushNotifications,
        taskReminders,
        appointmentReminders,
        dailySummary,
        weeklySummary,
        reminderTime,
        quietHoursEnabled: quietHours.enabled,
        quietHoursStart: quietHours.start,
        quietHoursEnd: quietHours.end
      }
    })

    return NextResponse.json({ message: 'Paramètres de notification mis à jour avec succès', settings })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres de notification:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}