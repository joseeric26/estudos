import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { TaskAttachmentDocument, TaskExecutionDocument, ITaskAttachment } from '@/types/task';
import { saveUploadedFile, MAX_FILE_SIZE_BYTES, formatBytes } from '@/lib/storage';

interface RouteParams {
  params: {
    id: string;
  } | Promise<{
    id: string;
  }>;
}

/**
 * GET /api/executions/[id]/attachments
 * Lista os arquivos anexados especificamente a uma determinada execução.
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

    const rawAttachments = await db
      .collection<TaskAttachmentDocument>('task_attachments')
      .find({ executionId: execObjectId })
      .sort({ uploadedAt: -1 })
      .toArray();

    const attachments: ITaskAttachment[] = rawAttachments.map((att) => ({
      _id: att._id!.toString(),
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

    return NextResponse.json(attachments, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[API Attachments] Erro ao listar anexos da execução:', error);
    return NextResponse.json(
      { error: 'Erro interno ao consultar anexos da execução.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/executions/[id]/attachments
 * Realiza o upload de arquivos vinculados especificamente à execução informada.
 */
export async function POST(request: Request, context: RouteParams) {
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

    // Valida existência da execução
    const execution = await db
      .collection<TaskExecutionDocument>('task_executions')
      .findOne({ _id: execObjectId });

    if (!execution) {
      return NextResponse.json(
        { error: 'Execução não encontrada para upload de anexo.' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      const singleFile = formData.get('file') as File | null;
      if (singleFile) {
        files.push(singleFile);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado.' },
        { status: 400 }
      );
    }

    const savedAttachments: ITaskAttachment[] = [];

    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== 'function') continue;

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: `O arquivo ${file.name} excede o limite máximo permitido de ${formatBytes(
              MAX_FILE_SIZE_BYTES
            )}.`,
          },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const originalName = file.name || 'arquivo_execucao';
      const mimeType = file.type || 'application/octet-stream';

      const fileInfo = await saveUploadedFile(buffer, originalName);

      const attachmentDoc: TaskAttachmentDocument = {
        taskId: execution.taskId,
        executionId: execObjectId,
        originalName,
        storedName: fileInfo.storedName,
        mimeType,
        size: fileInfo.size,
        storageKey: fileInfo.storageKey,
        uploadedAt: new Date(),
      };

      const result = await db
        .collection<TaskAttachmentDocument>('task_attachments')
        .insertOne(attachmentDoc);

      savedAttachments.push({
        _id: result.insertedId.toString(),
        taskId: execution.taskId.toString(),
        executionId: execObjectId.toString(),
        originalName: attachmentDoc.originalName,
        storedName: attachmentDoc.storedName,
        mimeType: attachmentDoc.mimeType,
        size: attachmentDoc.size,
        sizeFormatted: formatBytes(attachmentDoc.size),
        storageKey: attachmentDoc.storageKey,
        uploadedAt: attachmentDoc.uploadedAt.toISOString(),
      });
    }

    return NextResponse.json(savedAttachments, { status: 201 });
  } catch (error) {
    console.error('[API Attachments] Erro no upload para execução:', error);
    return NextResponse.json(
      { error: 'Erro interno ao salvar arquivos da execução.' },
      { status: 500 }
    );
  }
}
