import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

interface AccountSettings {
  name: string
  email: string
  profilePicture: string
  dataRetention: number
  exportData: boolean
  deleteAccount: boolean
}

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

    const settings = {
      name: user.name || "",
      email: user.email,
      profilePicture: "",
      dataRetention: 365,
      exportData: false,
      deleteAccount: false
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres du compte:', error)
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
    const { name, email, profilePicture, dataRetention, exportData } = body

    // Update user information
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(email && { email })
      }
    })

    // Here you would save other settings to the database
    console.log('Account settings updated:', { name, email, profilePicture, dataRetention, exportData })

    return NextResponse.json({ 
      message: 'Paramètres du compte mis à jour avec succès',
      user: {
        name: updatedUser.name,
        email: updatedUser.email
      }
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres du compte:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}