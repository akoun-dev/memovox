import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { reminderSettings: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // If no settings exist, create default settings
    if (!user.reminderSettings) {
      const defaultSettings = await db.reminderSettings.create({
        data: {
          userId: user.id
        }
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(user.reminderSettings);
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres de rappel:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { reminderSettings: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const { dailyReminderTime, isEnabled, voiceEnabled, reminderDays } = await request.json();

    const updateData: any = {};
    if (dailyReminderTime !== undefined) updateData.dailyReminderTime = dailyReminderTime;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (voiceEnabled !== undefined) updateData.voiceEnabled = voiceEnabled;
    if (reminderDays !== undefined) updateData.reminderDays = reminderDays;

    let settings;
    if (user.reminderSettings) {
      settings = await db.reminderSettings.update({
        where: { userId: user.id },
        data: updateData
      });
    } else {
      settings = await db.reminderSettings.create({
        data: {
          userId: user.id,
          ...updateData
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres de rappel:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}