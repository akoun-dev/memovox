import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(request: NextRequest) {
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

    // Delete all user data in correct order to handle foreign key constraints
    await Promise.all([
      db.task.deleteMany({
        where: { userId: user.id }
      }),
      db.appointment.deleteMany({
        where: { userId: user.id }
      }),
      db.voiceReminder.deleteMany({
        where: { userId: user.id }
      }),
      db.reminderSettings.deleteMany({
        where: { userId: user.id }
      })
    ])

    // Finally delete the user
    await db.user.delete({
      where: { id: user.id }
    })

    return NextResponse.json({ message: 'Compte et données supprimés avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}