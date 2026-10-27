import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import { getDatabase } from '@/lib/mongodb';
import { TaskAttachmentDocument } from '@/types/task';
import { getSafeFilePath, deleteStoredFile } from '@/lib/storage';

interface RouteParams {
  params: {
    id: string;
  } | Promise<{
    id: string;
  }>;
}

/**
 * GET /api/attachments/[id]
 * Permite visualizar inline ou baixar um arquivo anexado com cabeçalhos seguros.
 * Parâmetro opcional na query: ?download=1 força o download do arquivo.
 */
export async function GET(request: Request, context: RouteParams) {
  try {
    const { id } = await Promise.resolve(context.params);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Identificador de anexo inválido.' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const att = await db
      .collection<TaskAttachmentDocument>('task_attachments')
      .findOne({ _id: new ObjectId(id) });

    if (!att) {
      return NextResponse.json(
        { error: 'Anexo não encontrado.' },
        { status: 404 }
      );
    }

    const filePath = getSafeFilePath(att.storedName);
    if (!filePath) {
      return NextResponse.json(
        { error: 'Arquivo físico não encontrado no armazenamento.' },
        { status: 404 }
      );
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    const url = new URL(request.url);
    const forceDownload = url.searchParams.get('download') === '1';

    // Determina o tipo de disposição segura
    const encodedFileName = encodeURIComponent(att.originalName).replace(
      /['()]/g,
      escape
    );
    const dispositionType = forceDownload ? 'attachment' : 'inline';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': att.mimeType || 'application/octet-stream',
        'Content-Disposition': `${dispositionType}; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
        'Content-Length': fileBuffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[API Attachment [id]] Erro ao ler arquivo:', error);
    return NextResponse.json(
      { error: 'Erro interno ao servir arquivo.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/attachments/[id]
 * Remove um anexo individual: apaga o arquivo físico do disco e remove o registro no MongoDB.
 */
export async function DELETE(request: Request, context: RouteParams) {
  try {
    const { id } = await Promise.resolve(context.params);

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Identificador de anexo inválido.' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const attObjectId = new ObjectId(id);

    const att = await db
      .collection<TaskAttachmentDocument>('task_attachments')
      .findOne({ _id: attObjectId });

    if (!att) {
      return NextResponse.json(
        { error: 'Anexo não encontrado para exclusão.' },
        { status: 404 }
      );
    }

    // Remove do disco físico
    if (att.storedName) {
      await deleteStoredFile(att.storedName);
    }

    // Remove metadados do MongoDB
    await db
      .collection<TaskAttachmentDocument>('task_attachments')
      .deleteOne({ _id: attObjectId });

    return NextResponse.json(
      { message: 'Anexo excluído com sucesso.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API Attachment [id]] Erro ao excluir anexo:', error);
    return NextResponse.json(
      { error: 'Erro interno ao excluir anexo.' },
      { status: 500 }
    );
  }
}
