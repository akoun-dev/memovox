import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { HabitsAnalyzer } from '@/lib/habits-analyzer'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { startDate, endDate } = await request.json()

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Dates manquantes' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Valider les dates
    if (start > end) {
      return NextResponse.json({ error: 'La date de début doit être antérieure à la date de fin' }, { status: 400 })
    }

    // Limiter la période d'analyse à 1 an
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    if (start < oneYearAgo) {
      return NextResponse.json({ error: 'La période d\'analyse ne peut pas dépasser 1 an' }, { status: 400 })
    }

    const analyzer = HabitsAnalyzer.getInstance()
    
    const analysis = await analyzer.analyzeHabits(session.user.id, start, end)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing habits:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const analyzer = HabitsAnalyzer.getInstance()

    if (action === 'stats') {
      const stats = analyzer.getAnalysisStats()
      return NextResponse.json(stats)
    }

    if (action === 'clear-cache') {
      analyzer.clearCache()
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
  } catch (error) {
    console.error('Error in habits analysis request:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}