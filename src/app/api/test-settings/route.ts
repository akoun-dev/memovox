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
      include: { 
        reminderSettings: true,
        tasks: { take: 3 },
        appointments: { take: 3 }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      reminderSettings: user.reminderSettings,
      tasksCount: user.tasks.length,
      appointmentsCount: user.appointments.length,
      hasReminderSettings: !!user.reminderSettings
    });
  } catch (error) {
    console.error('Erreur lors de la vérification des données:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

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

    const { dailyReminderTime, isEnabled, voiceEnabled, reminderDays } = await request.json();

    // Test creating or updating reminder settings
    let settings;
    if (user.reminderSettings) {
      settings = await db.reminderSettings.update({
        where: { userId: user.id },
        data: {
          dailyReminderTime: dailyReminderTime || "09:00",
          isEnabled: isEnabled ?? true,
          voiceEnabled: voiceEnabled ?? true,
          reminderDays: reminderDays || "1,2,3,4,5"
        }
      });
    } else {
      settings = await db.reminderSettings.create({
        data: {
          userId: user.id,
          dailyReminderTime: dailyReminderTime || "09:00",
          isEnabled: isEnabled ?? true,
          voiceEnabled: voiceEnabled ?? true,
          reminderDays: reminderDays || "1,2,3,4,5"
        }
      });
    }

    return NextResponse.json({
      success: true,
      settings,
      message: "Paramètres de rappel enregistrés avec succès"
    });
  } catch (error) {
    console.error('Erreur lors du test des paramètres:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}