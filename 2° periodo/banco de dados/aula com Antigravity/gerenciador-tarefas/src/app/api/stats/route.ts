import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { IAppStats } from '@/types/task';
import { centsToBRL } from '@/lib/currency';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stats
 * Retorna métricas consolidadas em tempo real a partir dos dados persistidos no MongoDB.
 * Calcula o valor acumulado considerando APENAS execuções concluídas.
 */
export async function GET() {
  try {
    const db = await getDatabase();

    // 1. Total de tarefas cadastradas
    const totalTasks = await db.collection('tasks').countDocuments();

    // 2. Total de execuções
    const totalExecutions = await db.collection('task_executions').countDocuments();

    // 3. Execuções pendentes e em andamento
    const pendingExecutions = await db
      .collection('task_executions')
      .countDocuments({ status: 'pending' });

    const inProgressExecutions = await db
      .collection('task_executions')
      .countDocuments({ status: 'in_progress' });

    // 4. Execuções concluídas
    const completedExecutions = await db
      .collection('task_executions')
      .countDocuments({ status: 'completed' });

    // 5. Agregação do valor acumulado das execuções CONCLUÍDAS
    const accumulatedAggregate = await db
      .collection('task_executions')
      .aggregate<{ totalCents: number }>([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalCents: { $sum: '$valueCents' },
          },
        },
      ])
      .toArray();

    const accumulatedValueCents =
      accumulatedAggregate.length > 0 && accumulatedAggregate[0].totalCents
        ? Math.max(0, accumulatedAggregate[0].totalCents)
        : 0;

    const stats: IAppStats = {
      totalTasks,
      totalExecutions,
      pendingExecutions,
      inProgressExecutions,
      completedExecutions,
      accumulatedValueCents,
      accumulatedValueBRL: centsToBRL(accumulatedValueCents),
    };

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[API Stats] Erro ao consolidar métricas:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular métricas consolidadas do sistema.' },
      { status: 500 }
    );
  }
}
