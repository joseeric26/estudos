import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { TaskExecutionDocument, TaskAttachmentDocument } from '@/types/task';
import { deleteStoredFile, deleteAllUploadedFiles } from '@/lib/storage';

/**
 * POST /api/admin/reset-progress
 * Reseta o progresso de trabalho de todas as tarefas cadastradas:
 * - Redefine todas as execuções para 'pending' e limpa completedAt.
 * - PRESERVA 100% dos documentos originais da coleção 'tasks'.
 * - Exclui fisicamente todos os arquivos do disco de armazenamento.
 * - Remove todos os registros de anexos da coleção 'task_attachments'.
 * - Zera o total acumulado do sistema.
 */
export async function POST() {
  try {
    const db = await getDatabase();

    // 1. Contagem de tarefas originais (para confirmação de preservação)
    const preservedTasksCount = await db.collection('tasks').countDocuments();

    // 2. Redefine o status de todas as execuções existentes para 'pending' e limpa completedAt
    const now = new Date();
    const executionsUpdateResult = await db
      .collection<TaskExecutionDocument>('task_executions')
      .updateMany(
        {},
        {
          $set: {
            status: 'pending',
            updatedAt: now,
          },
          $unset: {
            completedAt: '',
          },
        }
      );

    // 3. Localiza todos os metadados de anexos cadastrados para exclusão física individual
    const allAttachments = await db
      .collection<TaskAttachmentDocument>('task_attachments')
      .find({})
      .toArray();

    let filesDeletedCount = 0;
    for (const att of allAttachments) {
      if (att.storedName) {
        const deleted = await deleteStoredFile(att.storedName);
        if (deleted) filesDeletedCount++;
      }
    }

    // 4. Limpeza adicional preventiva do diretório físico para evitar quaisquer arquivos órfãos
    const dirCleanup = await deleteAllUploadedFiles();
    filesDeletedCount += dirCleanup.deleted;

    // 5. Remove todos os registros de metadados da coleção task_attachments
    const attachmentsDeleteResult = await db
      .collection<TaskAttachmentDocument>('task_attachments')
      .deleteMany({});

    return NextResponse.json(
      {
        success: true,
        message: 'Progresso resetado com sucesso. Todas as tarefas originais foram mantidas.',
        preservedTasksCount,
        executionsResetCount: executionsUpdateResult.matchedCount,
        attachmentsRemovedCount: attachmentsDeleteResult.deletedCount,
        filesDeletedCount,
        accumulatedValueCents: 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API Reset Progress] Erro crítico durante reset:', error);
    return NextResponse.json(
      {
        error:
          'Falha parcial ou total durante o reset de progresso. Você pode tentar acionar a operação novamente.',
      },
      { status: 500 }
    );
  }
}
