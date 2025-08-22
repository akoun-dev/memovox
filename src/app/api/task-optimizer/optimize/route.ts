import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TaskOptimizer } from '@/lib/task-optimizer'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { date } = await request.json()

    if (!date) {
      return NextResponse.json({ error: 'Date manquante' }, { status: 400 })
    }

    const targetDate = new Date(date)

    // Récupérer les tâches et rendez-vous de l'utilisateur
    const [tasks, appointments, userSettings] = await Promise.all([
      db.task.findMany({
        where: { 
          userId: session.user.id,
          completed: false,
          OR: [
            { dueDate: null },
            { dueDate: { gte: targetDate } }
          ]
        },
        orderBy: { priority: 'desc' }
      }),
      db.appointment.findMany({
        where: { 
          userId: session.user.id,
          date: {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lt: new Date(targetDate.setHours(23, 59, 59, 999))
          }
        },
        orderBy: { date: 'asc' }
      }),
      db.userSettings.findUnique({
        where: { userId: session.user.id }
      })
    ])

    const optimizer = TaskOptimizer.getInstance()
    
    const optimizationResult = await optimizer.optimizeTasks(
      session.user.id,
      tasks,
      appointments,
      targetDate,
      userSettings
    )

    return NextResponse.json(optimizationResult)
  } catch (error) {
    console.error('Error optimizing tasks:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}