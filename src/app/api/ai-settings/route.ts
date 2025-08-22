import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface AISettings {
  voiceRecognition: boolean
  smartSuggestions: boolean
  autoCategorization: boolean
  priorityPrediction: boolean
  timeEstimation: boolean
  rewriteAssistance: boolean
  creativityLevel: number
  responseSpeed: "fast" | "balanced" | "thorough"
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
        aiSettings: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Return AI settings or default values
    const settings = user.aiSettings || {
      voiceRecognition: true,
      smartSuggestions: true,
      autoCategorization: true,
      priorityPrediction: true,
      timeEstimation: true,
      rewriteAssistance: true,
      creativityLevel: 70,
      responseSpeed: "balanced"
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres IA:', error)
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
    const { voiceRecognition, smartSuggestions, autoCategorization, priorityPrediction, timeEstimation, rewriteAssistance, creativityLevel, responseSpeed } = body

    // Upsert AI settings
    const settings = await db.aiSettings.upsert({
      where: { userId: user.id },
      update: {
        voiceRecognition,
        smartSuggestions,
        autoCategorization,
        priorityPrediction,
        timeEstimation,
        rewriteAssistance,
        creativityLevel,
        responseSpeed,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        voiceRecognition,
        smartSuggestions,
        autoCategorization,
        priorityPrediction,
        timeEstimation,
        rewriteAssistance,
        creativityLevel,
        responseSpeed
      }
    })

    return NextResponse.json({ message: 'Paramètres IA mis à jour avec succès', settings })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres IA:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}