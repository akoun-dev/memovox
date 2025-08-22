import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface UserSettings {
  theme: "light" | "dark" | "auto"
  language: string
  timezone: string
  dateFormat: string
  timeFormat: "12h" | "24h"
  weekStart: "monday" | "sunday"
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
        userSettings: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Return user settings or default values
    const settings = user.userSettings || {
      theme: "light",
      language: "fr",
      timezone: "Europe/Paris",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      weekStart: "monday"
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres utilisateur:', error)
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
    const { theme, language, timezone, dateFormat, timeFormat, weekStart } = body

    // Upsert user settings
    const settings = await db.userSettings.upsert({
      where: { userId: user.id },
      update: {
        theme,
        language,
        timezone,
        dateFormat,
        timeFormat,
        weekStart,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        theme,
        language,
        timezone,
        dateFormat,
        timeFormat,
        weekStart
      }
    })

    return NextResponse.json({ message: 'Paramètres utilisateur mis à jour avec succès', settings })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres utilisateur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}