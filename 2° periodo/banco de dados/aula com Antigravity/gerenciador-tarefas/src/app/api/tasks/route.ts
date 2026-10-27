import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { TaskDocument, ITask, TaskStatus } from '@/types/task';
import { centsToBRL, parseBRLToCents } from '@/lib/currency';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tasks
 * Retorna todas as tarefas com valor monetário, contadores de execuções e anexos agregados.
 */
export async function GET() {
  try {
    const db = await getDatabase();

    // 1. Busca todas as tarefas
    const rawTasks = await db
      .collection<TaskDocument>('tasks')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // 2. Busca todas as execuções para agregação eficiente em memória
    const rawExecutions = await db
      .collection('task_executions')
      .find({})
      .toArray();

    // 3. Busca contagem de anexos por tarefa
    const rawAttachments = await db
      .collection('task_attachments')
      .find({})
      .toArray();

    // Indexa execuções por taskId
    const executionStatsByTask: Record<
      string,
      { total: number; completed: number; pending: number; accumulatedCents: number }
    > = {};

    for (const exec of rawExecutions) {
      const taskIdStr = exec.taskId.toString();
      if (!executionStatsByTask[taskIdStr]) {
        executionStatsByTask[taskIdStr] = {
          total: 0,
          completed: 0,
          pending: 0,
          accumulatedCents: 0,
        };
      }
      executionStatsByTask[taskIdStr].total++;
      if (exec.status === 'completed') {
        executionStatsByTask[taskIdStr].completed++;
        executionStatsByTask[taskIdStr].accumulatedCents += exec.valueCents || 0;
      } else {
        executionStatsByTask[taskIdStr].pending++;
      }
    }

    // Indexa anexos por taskId
    const attachmentCountByTask: Record<string, number> = {};
    for (const att of rawAttachments) {
      const taskIdStr = att.taskId.toString();
      attachmentCountByTask[taskIdStr] = (attachmentCountByTask[taskIdStr] || 0) + 1;
    }

    // Mapeia para o formato ITask para envio ao frontend
    const tasks: ITask[] = rawTasks.map((t) => {
      const idStr = t._id!.toString();
      const valueCents = typeof t.valueCents === 'number' && !isNaN(t.valueCents) ? t.valueCents : 0;
      const execStats = executionStatsByTask[idStr] || {
        total: 0,
        completed: 0,
        pending: 0,
        accumulatedCents: 0,
      };

      return {
        _id: idStr,
        title: t.title,
        description: t.description,
        status: t.status,
        valueCents,
        valueBRL: centsToBRL(valueCents),
        createdAt:
          t.createdAt instanceof Date
            ? t.createdAt.toISOString()
            : new Date(t.createdAt).toISOString(),
        updatedAt:
          t.updatedAt instanceof Date
            ? t.updatedAt.toISOString()
            : new Date(t.updatedAt).toISOString(),
        executionCount: execStats.total,
        completedExecutionCount: execStats.completed,
        pendingExecutionCount: execStats.pending,
        accumulatedValueCents: execStats.accumulatedCents,
        accumulatedValueBRL: centsToBRL(execStats.accumulatedCents),
        attachmentCount: attachmentCountByTask[idStr] || 0,
      };
    });

    return NextResponse.json(tasks, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[API Tasks] Erro ao listar tarefas:', error);
    return NextResponse.json(
      { error: 'Não foi possível carregar as tarefas. Verifique a conexão com o banco de dados.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Valida e cadastra uma nova tarefa no banco de dados MongoDB, incluindo valor monetário em centavos.
 */
export async function POST(request: Request) {
  try {
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

    // 1. Validação do Título
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'O título da tarefa é obrigatório e não pode conter apenas espaços.' },
        { status: 400 }
      );
    }

    // 2. Validação da Descrição
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'A descrição da tarefa é obrigatória e não pode conter apenas espaços.' },
        { status: 400 }
      );
    }

    // 3. Validação e cálculo do Valor Monetário (em centavos inteiros não-negativos)
    let finalCents = 0;
    if (typeof rawCents === 'number') {
      if (rawCents < 0 || !Number.isInteger(rawCents)) {
        return NextResponse.json(
          { error: 'O valor da tarefa não pode ser negativo e deve ser um número inteiro de centavos.' },
          { status: 400 }
        );
      }
      finalCents = rawCents;
    } else if (value !== undefined && value !== null) {
      finalCents = parseBRLToCents(value);
      if (finalCents < 0) {
        return NextResponse.json(
          { error: 'O valor da tarefa não pode ser negativo.' },
          { status: 400 }
        );
      }
    }

    // 4. Validação do Status
    const allowedStatuses: TaskStatus[] = ['pending', 'in_progress', 'completed'];
    const taskStatus: TaskStatus =
      status && allowedStatuses.includes(status) ? status : 'pending';

    const now = new Date();
    const newTask: TaskDocument = {
      title: title.trim(),
      description: description.trim(),
      status: taskStatus,
      valueCents: finalCents,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDatabase();
    const result = await db.collection<TaskDocument>('tasks').insertOne(newTask);

    const createdTask: ITask = {
      _id: result.insertedId.toString(),
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      valueCents: newTask.valueCents,
      valueBRL: centsToBRL(newTask.valueCents),
      createdAt: newTask.createdAt.toISOString(),
      updatedAt: newTask.updatedAt.toISOString(),
      executionCount: 0,
      completedExecutionCount: 0,
      pendingExecutionCount: 0,
      accumulatedValueCents: 0,
      accumulatedValueBRL: centsToBRL(0),
      attachmentCount: 0,
    };

    return NextResponse.json(createdTask, { status: 201 });
  } catch (error) {
    console.error('[API Tasks] Erro ao cadastrar tarefa:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor ao tentar salvar a tarefa.' },
      { status: 500 }
    );
  }
}
