import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PredictionsService } from '@/lib/predictions-service'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { task } = await request.json()

    if (!task || !task.title) {
      return NextResponse.json({ error: 'Données de tâche invalides' }, { status: 400 })
    }

    const predictionsService = PredictionsService.getInstance()

    // Récupérer les tâches historiques de l'utilisateur
    const historicalTasks = await db.task.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Calculer la durée réelle pour les tâches complétées
    const tasksWithActualDuration = historicalTasks.map(t => ({
      ...t,
      actualDuration: t.completedAt && t.createdAt 
        ? Math.round((new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60))
        : null
    }))

    const prediction = await predictionsService.predictTaskDuration(
      { ...task, userId: session.user.id },
      tasksWithActualDuration
    )

    return NextResponse.json({ prediction })
  } catch (error) {
    console.error('Error predicting task duration:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}