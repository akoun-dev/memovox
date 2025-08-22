import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const task = await db.task.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Erreur lors de la récupération de la tâche:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { title, description, priority, dueDate, emoji, estimatedDuration, isRecurring, recurringType, recurringInterval, recurringEndDate, completed, completedAt } = body

    // Check if task exists and belongs to user
    const existingTask = await db.task.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 })
    }

    const updatedTask = await db.task.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? (description?.trim() || null) : undefined,
        priority: priority !== undefined ? priority : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        emoji: emoji !== undefined ? (emoji?.trim() || null) : undefined,
        estimatedDuration: estimatedDuration !== undefined ? (estimatedDuration ? parseInt(estimatedDuration) : null) : undefined,
        isRecurring: isRecurring !== undefined ? isRecurring : undefined,
        recurringType: isRecurring !== undefined ? recurringType : undefined,
        recurringInterval: isRecurring !== undefined ? recurringInterval : undefined,
        recurringEndDate: recurringEndDate !== undefined ? (recurringEndDate ? new Date(recurringEndDate) : null) : undefined,
        completed: completed !== undefined ? completed : undefined,
        completedAt: completed !== undefined ? (completed ? new Date() : null) : undefined
      }
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Check if task exists and belongs to user
    const existingTask = await db.task.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 })
    }

    await db.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Tâche supprimée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}