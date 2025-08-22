import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MobileService } from '@/lib/mobile-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const mobileService = MobileService.getInstance()
    const widgetData = await mobileService.getWidgetData(session.user.id)

    return NextResponse.json(widgetData)
  } catch (error) {
    console.error('Error fetching widget data:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}