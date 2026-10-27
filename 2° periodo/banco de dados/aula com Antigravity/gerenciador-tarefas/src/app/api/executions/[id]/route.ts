import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { TaskExecutionDocument, TaskDocument, ExecutionStatus, ITaskExecution } from '@/types/task';
import { centsToBRL } from '@/lib/currency';
import { formatBytes } from '@/lib/storage';

interface RouteParams {
  params: {
    id: string;
  } | Promise<{
    id: string;
  }>;
}

/**
 * GET /api/executions/[id]
 * Retorna os detalhes de uma execução, a tarefa pai vinculada e os arquivos para checagem.
 */
export async function GET(request: Request, context: RouteParams) {
  try {
    const { id } = await Promise.resolve(context.params);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Identificador de execução inválido.' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const execObjectId = new ObjectId(id);

    const execution = await db
      .collection<TaskExecutionDocument>('task_executions')
      .findOne({ _id: execObjectId });

    if (!execution) {
      return NextResponse.json(
        { error: 'Execução não encontrada.' },
        { status: 404 }
      );
    }

    // Busca a tarefa original
    const task = await db
      .collection<TaskDocument>('tasks')
      .findOne({ _id: execution.taskId });

    // Busca anexos gerais da tarefa e específicos desta execução
    const attachments = await db
      .collection('task_attachments')
      .find({
        $or: [
          { taskId: execution.taskId, executionId: { $in: [null, undefined] } },
          { executionId: execObjectId },
        ],
      })
      .toArray();

    const formattedAttachments = attachments.map((att) => ({
      _id: att._id.toString(),
      taskId: att.taskId.toString(),
      executionId: att.executionId ? att.executionId.toString() : null,
      originalName: att.originalName,
      storedName: att.storedName,
      mimeType: att.mimeType,
      size: att.size,
      sizeFormatted: formatBytes(att.size),
      storageKey: att.storageKey,
      uploadedAt: new Date(att.uploadedAt).toISOString(),
    }));

    return NextResponse.json({
      execution: {
        _id: execution._id!.toString(),
        taskId: execution.taskId.toString(),
        status: execution.status,
        valueCents: execution.valueCents || 0,
        valueBRL: centsToBRL(execution.valueCents || 0),
        startedAt: execution.startedAt ? new Date(execution.startedAt).toISOString() : null,
        completedAt: execution.completedAt ? new Date(execution.completedAt).toISOString() : null,
        createdAt: new Date(execution.createdAt).toISOString(),
        updatedAt: new Date(execution.updatedAt).toISOString(),
      },
      task: task
        ? {
            _id: task._id!.toString(),
            title: task.title,
            description: task.description,
            status: task.status,
            valueCents: task.valueCents || 0,
            valueBRL: centsToBRL(task.valueCents || 0),
          }
        : null,
      attachments: formattedAttachments,
    });
  } catch (error) {
    console.error('[API Execution [id]] Erro ao buscar execução:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar detalhes da execução.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/executions/[id]
 * Atualiza o status da execução com garantia de atomicidade no MongoDB.
 * Impede que uma execução já concluída seja concluída novamente (evitando dupla contabilização).
 */
export async function PATCH(request: Request, context: RouteParams) {
  try {
    const { id } = await Promise.resolve(context.params);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Identificador de execução inválido.' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Formato da requisição inválido. Envie um corpo JSON válido.' },
        { status: 400 }
      );
    }

    const { status } = body;
    const allowedStatuses: ExecutionStatus[] = ['pending', 'in_progress', 'completed'];

    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Escolha entre: pending, in_progress ou completed.' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const execObjectId = new ObjectId(id);

    // Caso de Conclusão: Operação Atômica com verificação de idempotência
    if (status === 'completed') {
      const now = new Date();
      const updated = await db
        .collection<TaskExecutionDocument>('task_executions')
        .findOneAndUpdate(
          {
            _id: execObjectId,
            status: { $ne: 'completed' }, // Só conclui se NÃO estiver concluída
          },
          {
            $set: {
              status: 'completed',
              completedAt: now,
              updatedAt: now,
            },
          },
          { returnDocument: 'after' }
        );

      if (!updated) {
        // Verifica se a execução existia ou se já estava concluída
        const existing = await db
          .collection('task_executions')
          .findOne({ _id: execObjectId });

        if (!existing) {
          return NextResponse.json(
            { error: 'Execução não encontrada.' },
            { status: 404 }
          );
        }

        return NextResponse.json(
          { error: 'Esta execução já foi concluída anteriormente e não pode ser duplicada.' },
          { status: 409 }
        );
      }

      const response: ITaskExecution = {
        _id: updated._id!.toString(),
        taskId: updated.taskId.toString(),
        status: updated.status,
        valueCents: updated.valueCents,
        valueBRL: centsToBRL(updated.valueCents),
        startedAt: updated.startedAt ? new Date(updated.startedAt).toISOString() : null,
        completedAt: updated.completedAt ? new Date(updated.completedAt).toISOString() : null,
        createdAt: new Date(updated.createdAt).toISOString(),
        updatedAt: new Date(updated.updatedAt).toISOString(),
      };

      return NextResponse.json(response, { status: 200 });
    }

    // Caso de transição para pending ou in_progress
    const now = new Date();
    const updated = await db
      .collection<TaskExecutionDocument>('task_executions')
      .findOneAndUpdate(
        { _id: execObjectId },
        {
          $set: {
            status,
            completedAt: null,
            updatedAt: now,
          },
        },
        { returnDocument: 'after' }
      );

    if (!updated) {
      return NextResponse.json(
        { error: 'Execução não encontrada para atualização.' },
        { status: 404 }
      );
    }

    const response: ITaskExecution = {
      _id: updated._id!.toString(),
      taskId: updated.taskId.toString(),
      status: updated.status,
      valueCents: updated.valueCents,
      valueBRL: centsToBRL(updated.valueCents),
      startedAt: updated.startedAt ? new Date(updated.startedAt).toISOString() : null,
      completedAt: null,
      createdAt: new Date(updated.createdAt).toISOString(),
      updatedAt: new Date(updated.updatedAt).toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[API Execution [id]] Erro ao atualizar status:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar a execução.' },
      { status: 500 }
    );
  }
}
