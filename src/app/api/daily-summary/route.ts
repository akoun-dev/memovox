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

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's tasks and appointments
    const [tasks, appointments] = await Promise.all([
      db.task.findMany({
        where: {
          userId: user.id,
          completed: false,
          dueDate: {
            gte: today,
            lt: tomorrow
          }
        },
        orderBy: { priority: 'desc' }
      }),
      db.appointment.findMany({
        where: {
          userId: user.id,
          date: {
            gte: today,
            lt: tomorrow
          }
        },
        orderBy: { date: 'asc' }
      })
    ]);

    // Generate summary text
    let summaryText = `Bonjour ! Voici votre résumé du jour ${today.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. `;

    if (tasks.length === 0 && appointments.length === 0) {
      summaryText += "Vous n'avez aucune tâche ou rendez-vous prévu pour aujourd'hui. Profitez de votre journée !";
    } else {
      if (tasks.length > 0) {
        summaryText += `Vous avez ${tasks.length} tâche${tasks.length > 1 ? 's' : ''} à accomplir aujourd'hui. `;
        tasks.forEach((task, index) => {
          summaryText += `${index + 1}. ${task.title}`;
          if (task.description) {
            summaryText += ` : ${task.description}`;
          }
          summaryText += '. ';
        });
      }

      if (appointments.length > 0) {
        summaryText += `Vous avez ${appointments.length} rendez-vous aujourd'hui. `;
        appointments.forEach((appointment, index) => {
          const time = appointment.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          summaryText += `${index + 1}. À ${time}, ${appointment.title}`;
          if (appointment.location) {
            summaryText += ` à ${appointment.location}`;
          }
          summaryText += '. ';
        });
      }
    }

    // Generate voice summary using ZAI
    const zai = await ZAI.create();
    const audioResponse = await zai.audio.speech.create({
      input: summaryText,
      voice: 'alloy',
      model: 'tts-1'
    });

    // Get audio data from response
    const audioData = audioResponse.audio || audioResponse.data?.[0]?.audio;
    
    if (!audioData) {
      return NextResponse.json({ error: 'Erreur lors de la génération audio' }, { status: 500 });
    }

    // Create voice reminder for daily summary
    const voiceReminder = await db.voiceReminder.create({
      data: {
        title: 'Résumé quotidien',
        content: summaryText,
        audioUrl: `data:audio/mp3;base64,${audioData}`,
        scheduledFor: new Date(),
        userId: user.id,
        type: 'DAILY_SUMMARY'
      }
    });

    return NextResponse.json({
      summary: summaryText,
      voiceReminder,
      tasksCount: tasks.length,
      appointmentsCount: appointments.length
    });
  } catch (error) {
    console.error('Erreur lors de la génération du résumé quotidien:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}