import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
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

    // Fetch all user data
    const [tasks, appointments, voiceReminders] = await Promise.all([
      db.task.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      }),
      db.appointment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      }),
      db.voiceReminder.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
    ])

    // Prepare export data
    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        exportedAt: new Date().toISOString()
      },
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        priority: task.priority,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      })),
      appointments: appointments.map(appointment => ({
        id: appointment.id,
        title: appointment.title,
        description: appointment.description,
        location: appointment.location,
        date: appointment.date,
        duration: appointment.duration,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      })),
      voiceReminders: voiceReminders.map(reminder => ({
        id: reminder.id,
        title: reminder.title,
        content: reminder.content,
        type: reminder.type,
        scheduledFor: reminder.scheduledFor,
        sentAt: reminder.sentAt,
        createdAt: reminder.createdAt
      }))
    }

    // Create JSON file
    const jsonData = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="memovox-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error) {
    console.error('Erreur lors de l\'export des données:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}