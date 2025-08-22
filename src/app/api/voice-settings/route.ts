import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface VoiceSettings {
  voiceEnabled: boolean
  voiceType: string
  voiceSpeed: number
  voicePitch: number
  dailyReminderTime: string
  reminderDays: number[]
  voiceLanguage: string
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
        voiceSettings: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Return voice settings or default values
    const settings = user.voiceSettings || {
      voiceEnabled: true,
      voiceType: "female",
      voiceSpeed: 1.0,
      voicePitch: 1.0,
      dailyReminderTime: "09:00",
      reminderDays: "1,2,3,4,5",
      voiceLanguage: "fr-FR"
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres vocaux:', error)
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
    const { voiceEnabled, voiceType, voiceSpeed, voicePitch, dailyReminderTime, reminderDays, voiceLanguage } = body

    // Convert reminderDays array to string
    const reminderDaysString = Array.isArray(reminderDays) ? reminderDays.join(',') : reminderDays

    // Upsert voice settings
    const settings = await db.voiceSettings.upsert({
      where: { userId: user.id },
      update: {
        voiceEnabled,
        voiceType,
        voiceSpeed,
        voicePitch,
        dailyReminderTime,
        reminderDays: reminderDaysString,
        voiceLanguage,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        voiceEnabled,
        voiceType,
        voiceSpeed,
        voicePitch,
        dailyReminderTime,
        reminderDays: reminderDaysString,
        voiceLanguage
      }
    })

    return NextResponse.json({ message: 'Paramètres vocaux mis à jour avec succès', settings })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres vocaux:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}