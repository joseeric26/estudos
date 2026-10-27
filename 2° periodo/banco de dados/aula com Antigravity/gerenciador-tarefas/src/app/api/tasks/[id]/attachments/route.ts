import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { TaskAttachmentDocument, ITaskAttachment } from '@/types/task';
import { saveUploadedFile, MAX_FILE_SIZE_BYTES, formatBytes } from '@/lib/storage';

interface RouteParams {
  params: {
    id: string;
  } | Promise<{
    id: string;
  }>;
}

/**
 * GET /api/tasks/[id]/attachments
 * Lista os arquivos anexados à tarefa informada.
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

    // Busca anexos gerais da tarefa (sem executionId)
    const rawAttachments = await db
      .collection<TaskAttachmentDocument>('task_attachments')
      .find({
        taskId: taskObjectId,
        executionId: { $in: [null, undefined] },
      })
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
    console.error('[API Attachments] Erro ao listar anexos da tarefa:', error);
    return NextResponse.json(
      { error: 'Erro interno ao consultar anexos da tarefa.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks/[id]/attachments
 * Realiza o upload de um ou mais arquivos associados diretamente à tarefa.
 * Aceita arquivos de qualquer extensão, gravando fisicamente no volume persistente
 * e salvando os metadados no MongoDB.
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

    // Valida existência da tarefa
    const task = await db.collection('tasks').findOne({ _id: taskObjectId });
    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada para upload.' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      // Suporte para campo singular 'file'
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
      const originalName = file.name || 'arquivo_sem_nome';
      const mimeType = file.type || 'application/octet-stream';

      const fileInfo = await saveUploadedFile(buffer, originalName);

      const attachmentDoc: TaskAttachmentDocument = {
        taskId: taskObjectId,
        executionId: null,
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
        taskId: taskObjectId.toString(),
        executionId: null,
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
    console.error('[API Attachments] Erro no upload para tarefa:', error);
    return NextResponse.json(
      { error: 'Erro interno ao salvar arquivos anexados.' },
      { status: 500 }
    );
  }
}
