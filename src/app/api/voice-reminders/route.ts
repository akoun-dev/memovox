import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const { title, content, type, scheduledFor, relatedTaskId, relatedAppointmentId } = await request.json();

    if (!title || !content || !type || !scheduledFor) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    // Generate voice reminder using ZAI
    const zai = await ZAI.create();
    const audioResponse = await zai.audio.speech.create({
      input: content,
      voice: 'alloy',
      model: 'tts-1'
    });

    // Get audio data from response
    const audioData = audioResponse.audio || audioResponse.data?.[0]?.audio;
    
    if (!audioData) {
      return NextResponse.json({ error: 'Erreur lors de la génération audio' }, { status: 500 });
    }

    // Create voice reminder record
    const voiceReminder = await db.voiceReminder.create({
      data: {
        title,
        content,
        audioUrl: `data:audio/mp3;base64,${audioData}`,
        scheduledFor: new Date(scheduledFor),
        userId: user.id,
        type,
        relatedTaskId,
        relatedAppointmentId
      }
    });

    return NextResponse.json(voiceReminder);
  } catch (error) {
    console.error('Erreur lors de la création du rappel vocal:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where = type ? { userId: user.id, type: type as any } : { userId: user.id };

    const voiceReminders = await db.voiceReminder.findMany({
      where,
      orderBy: { scheduledFor: 'desc' },
      take: limit
    });

    return NextResponse.json(voiceReminders);
  } catch (error) {
    console.error('Erreur lors de la récupération des rappels vocaux:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}