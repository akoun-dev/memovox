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

    const appointment = await db.appointment.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Rendez-vous non trouvé' }, { status: 404 })
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Erreur lors de la récupération du rendez-vous:', error)
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
    const { title, description, location, date, duration, emoji, isRecurring, recurringType, recurringInterval, recurringEndDate } = body

    // Check if appointment exists and belongs to user
    const existingAppointment = await db.appointment.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Rendez-vous non trouvé' }, { status: 404 })
    }

    const updatedAppointment = await db.appointment.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? (description?.trim() || null) : undefined,
        location: location !== undefined ? (location?.trim() || null) : undefined,
        date: date !== undefined ? new Date(date) : undefined,
        duration: duration !== undefined ? parseInt(duration) : undefined,
        emoji: emoji !== undefined ? (emoji?.trim() || null) : undefined,
        isRecurring: isRecurring !== undefined ? isRecurring : undefined,
        recurringType: isRecurring !== undefined ? recurringType : undefined,
        recurringInterval: isRecurring !== undefined ? recurringInterval : undefined,
        recurringEndDate: recurringEndDate !== undefined ? (recurringEndDate ? new Date(recurringEndDate) : null) : undefined
      }
    })

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rendez-vous:', error)
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

    // Check if appointment exists and belongs to user
    const existingAppointment = await db.appointment.findFirst({
      where: { 
        id: params.id,
        userId: user.id 
      }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Rendez-vous non trouvé' }, { status: 404 })
    }

    await db.appointment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Rendez-vous supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du rendez-vous:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}