import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MobileService } from '@/lib/mobile-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { platform, token } = await request.json()

    if (!platform || !token) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    const mobileService = MobileService.getInstance()
    
    const device = await mobileService.registerDevice({
      platform,
      token,
      userId: session.user.id,
      isActive: true
    })

    return NextResponse.json({ success: true, device })
  } catch (error) {
    console.error('Error registering device:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { deviceId } = await request.json()

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID manquant' }, { status: 400 })
    }

    const mobileService = MobileService.getInstance()
    const success = await mobileService.unregisterDevice(deviceId)

    if (!success) {
      return NextResponse.json({ error: 'Appareil non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unregistering device:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}