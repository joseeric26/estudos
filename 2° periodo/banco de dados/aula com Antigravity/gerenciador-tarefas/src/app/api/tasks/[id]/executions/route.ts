import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { TaskDocument, TaskExecutionDocument, ITaskExecution } from '@/types/task';
import { centsToBRL } from '@/lib/currency';

interface RouteParams {
  params: {
    id: string;
  } | Promise<{
    id: string;
  }>;
}

/**
 * GET /api/tasks/[id]/executions
 * Lista o histórico completo de execuções de uma tarefa específica.
 */
export async function GET(request: Request, context: RouteParams) {
  try {
    const { id } = await Promise.resolve(context.params);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Identificador de tarefa inválido.' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const taskObjectId = new ObjectId(id);

    // Verifica existência da tarefa
    const task = await db.collection('tasks').findOne({ _id: taskObjectId });
    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada.' },
        { status: 404 }
      );
    }

    // Busca execuções ordenadas da mais recente para a mais antiga
    const rawExecutions = await db
      .collection<TaskExecutionDocument>('task_executions')
      .find({ taskId: taskObjectId })
      .sort({ createdAt: -1 })
      .toArray();

    // Conta anexos de cada execução
    const executionIds = rawExecutions.map((e) => e._id!);
    const rawAttachments = await db
      .collection('task_attachments')
      .find({ executionId: { $in: executionIds } })
      .toArray();

    const attachmentCountMap: Record<string, number> = {};
    for (const att of rawAttachments) {
      if (att.executionId) {
        const execIdStr = att.executionId.toString();
        attachmentCountMap[execIdStr] = (attachmentCountMap[execIdStr] || 0) + 1;
      }
    }

    const executions: ITaskExecution[] = rawExecutions.map((e) => ({
      _id: e._id!.toString(),
      taskId: e.taskId.toString(),
      status: e.status,
      valueCents: e.valueCents || 0,
      valueBRL: centsToBRL(e.valueCents || 0),
      startedAt: e.startedAt ? new Date(e.startedAt).toISOString() : null,
      completedAt: e.completedAt ? new Date(e.completedAt).toISOString() : null,
      createdAt: new Date(e.createdAt).toISOString(),
      updatedAt: new Date(e.updatedAt).toISOString(),
      attachmentCount: attachmentCountMap[e._id!.toString()] || 0,
    }));

    return NextResponse.json(executions, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[API Executions] Erro ao listar execuções:', error);
    return NextResponse.json(
      { error: 'Erro interno ao consultar o histórico de execuções.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks/[id]/executions
 * Cria e registra uma nova execução independente para a tarefa informada.
 * Realiza o snapshot do valor vigente da tarefa no momento do início da execução.
 */
export async function POST(request: Request, context: RouteParams) {
  try {
    const { id } = await Promise.resolve(context.params);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Identificador de tarefa inválido.' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const taskObjectId = new ObjectId(id);

    // 1. Busca a tarefa original para snapshot de valor
    const task = await db
      .collection<TaskDocument>('tasks')
      .findOne({ _id: taskObjectId });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada para registrar execução.' },
        { status: 404 }
      );
    }

    const valueCents =
      typeof task.valueCents === 'number' && !isNaN(task.valueCents)
        ? task.valueCents
        : 0;

    const now = new Date();
    const newExecution: TaskExecutionDocument = {
      taskId: taskObjectId,
      status: 'pending',
      valueCents,
      startedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection<TaskExecutionDocument>('task_executions')
      .insertOne(newExecution);

    const createdExecution: ITaskExecution = {
      _id: result.insertedId.toString(),
      taskId: taskObjectId.toString(),
      status: newExecution.status,
      valueCents: newExecution.valueCents,
      valueBRL: centsToBRL(newExecution.valueCents),
      startedAt: newExecution.startedAt?.toISOString() || null,
      completedAt: null,
      createdAt: newExecution.createdAt.toISOString(),
      updatedAt: newExecution.updatedAt.toISOString(),
      attachmentCount: 0,
    };

    return NextResponse.json(createdExecution, { status: 201 });
  } catch (error) {
    console.error('[API Executions] Erro ao criar execução:', error);
    return NextResponse.json(
      { error: 'Erro interno ao registrar nova execução da tarefa.' },
      { status: 500 }
    );
  }
}
