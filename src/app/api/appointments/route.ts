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

    const appointments = await db.appointment.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' }
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 })
    }

    if (!date) {
      return NextResponse.json({ error: 'La date est requise' }, { status: 400 })
    }

    const appointment = await db.appointment.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        location: location?.trim() || null,
        date: new Date(date),
        duration: duration ? parseInt(duration) : 30,
        userId: user.id,
        emoji: emoji?.trim() || null,
        isRecurring: isRecurring || false,
        recurringType: isRecurring ? recurringType : null,
        recurringInterval: isRecurring ? recurringInterval : null,
        recurringEndDate: isRecurring && recurringEndDate ? new Date(recurringEndDate) : null
      }
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}