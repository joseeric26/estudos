import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { TaskDocument, ITask, TaskStatus } from '@/types/task';
import { centsToBRL, parseBRLToCents } from '@/lib/currency';
import { deleteStoredFile } from '@/lib/storage';

interface RouteParams {
  params: {
    id: string;
  } | Promise<{
    id: string;
  }>;
}

/**
 * GET /api/tasks/[id]
 * Recupera uma única tarefa pelo seu ObjectId, incluindo informações monetárias e de execuções.
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

    const task = await db
      .collection<TaskDocument>('tasks')
      .findOne({ _id: taskObjectId });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada.' },
        { status: 404 }
      );
    }

    // Busca contadores de execuções para essa tarefa
    const executions = await db
      .collection('task_executions')
      .find({ taskId: taskObjectId })
      .toArray();

    let completedCount = 0;
    let pendingCount = 0;
    let accumulatedCents = 0;

    for (const exec of executions) {
      if (exec.status === 'completed') {
        completedCount++;
        accumulatedCents += exec.valueCents || 0;
      } else {
        pendingCount++;
      }
    }

    // Busca contagem de anexos vinculados a esta tarefa
    const attachmentCount = await db
      .collection('task_attachments')
      .countDocuments({ taskId: taskObjectId });

    const valueCents =
      typeof task.valueCents === 'number' && !isNaN(task.valueCents)
        ? task.valueCents
        : 0;

    const formattedTask: ITask = {
      _id: task._id!.toString(),
      title: task.title,
      description: task.description,
      status: task.status,
      valueCents,
      valueBRL: centsToBRL(valueCents),
      createdAt:
        task.createdAt instanceof Date
          ? task.createdAt.toISOString()
          : new Date(task.createdAt).toISOString(),
      updatedAt:
        task.updatedAt instanceof Date
          ? task.updatedAt.toISOString()
          : new Date(task.updatedAt).toISOString(),
      executionCount: executions.length,
      completedExecutionCount: completedCount,
      pendingExecutionCount: pendingCount,
      accumulatedValueCents: accumulatedCents,
      accumulatedValueBRL: centsToBRL(accumulatedCents),
      attachmentCount,
    };

    return NextResponse.json(formattedTask, { status: 200 });
  } catch (error) {
    console.error('[API Tasks [id]] Erro ao consultar tarefa:', error);
    return NextResponse.json(
      { error: 'Erro interno ao consultar os dados da tarefa.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks/[id]
 * Atualiza campos de uma tarefa existente, incluindo valor monetário em centavos.
 */
export async function PUT(request: Request, context: RouteParams) {
  try {
    const { id } = await Promise.resolve(context.params);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Identificador de tarefa inválido.' },
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

    const { title, description, status, value, valueCents: rawCents } = body;

    const updateFields: Partial<TaskDocument> = {
      updatedAt: new Date(),
    };

    // Validações dos campos recebidos
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'O título não pode ser vazio.' },
          { status: 400 }
        );
      }
      updateFields.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        return NextResponse.json(
          { error: 'A descrição não pode ser vazia.' },
          { status: 400 }
        );
      }
      updateFields.description = description.trim();
    }

    if (status !== undefined) {
      const allowedStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed'];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Status inválido. Escolha entre: pending, in_progress ou completed.' },
          { status: 400 }
        );
      }
      updateFields.status = status;
    }

    if (rawCents !== undefined) {
      if (typeof rawCents !== 'number' || rawCents < 0 || !Number.isInteger(rawCents)) {
        return NextResponse.json(
          { error: 'O valor deve ser um número inteiro de centavos não-negativo.' },
          { status: 400 }
        );
      }
      updateFields.valueCents = rawCents;
    } else if (value !== undefined) {
      const parsedCents = parseBRLToCents(value);
      if (parsedCents < 0) {
        return NextResponse.json(
          { error: 'O valor da tarefa não pode ser negativo.' },
          { status: 400 }
        );
      }
      updateFields.valueCents = parsedCents;
    }

    const db = await getDatabase();
    const result = await db.collection<TaskDocument>('tasks').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada para atualização.' },
        { status: 404 }
      );
    }

    const valueCents =
      typeof result.valueCents === 'number' && !isNaN(result.valueCents)
        ? result.valueCents
        : 0;

    const updatedTask: ITask = {
      _id: result._id!.toString(),
      title: result.title,
      description: result.description,
      status: result.status,
      valueCents,
      valueBRL: centsToBRL(valueCents),
      createdAt:
        result.createdAt instanceof Date
          ? result.createdAt.toISOString()
          : new Date(result.createdAt).toISOString(),
      updatedAt:
        result.updatedAt instanceof Date
          ? result.updatedAt.toISOString()
          : new Date(result.updatedAt).toISOString(),
    };

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error('[API Tasks [id]] Erro ao atualizar tarefa:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar a tarefa.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 * Remove a tarefa do MongoDB e limpa em cascata suas execuções e arquivos físicos anexados.
 */
export async function DELETE(request: Request, context: RouteParams) {
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

    // 1. Exclui a tarefa
    const result = await db
      .collection<TaskDocument>('tasks')
      .deleteOne({ _id: taskObjectId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada para exclusão.' },
        { status: 404 }
      );
    }

    // 2. Exclui todas as execuções vinculadas à tarefa
    await db.collection('task_executions').deleteMany({ taskId: taskObjectId });

    // 3. Localiza e exclui todos os arquivos físicos e metadados de anexos da tarefa
    const attachments = await db
      .collection('task_attachments')
      .find({ taskId: taskObjectId })
      .toArray();

    for (const att of attachments) {
      if (att.storedName) {
        await deleteStoredFile(att.storedName);
      }
    }

    await db.collection('task_attachments').deleteMany({ taskId: taskObjectId });

    return NextResponse.json(
      { message: 'Tarefa, execuções e anexos excluídos com sucesso.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API Tasks [id]] Erro ao excluir tarefa:', error);
    return NextResponse.json(
      { error: 'Erro interno ao excluir a tarefa.' },
      { status: 500 }
    );
  }
}
