import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Módulo de gerenciamento de armazenamento seguro de arquivos no servidor.
 * Os arquivos são gravados em um diretório persistente montado via volume Docker,
 * desacoplados dos documentos BSON do MongoDB.
 */

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
export const MAX_FILE_SIZE_BYTES =
  (parseInt(process.env.MAX_FILE_SIZE_MB || '15', 10) || 15) * 1024 * 1024;

/**
 * Garante que o diretório de uploads exista com permissões adequadas
 */
export async function ensureUploadDir(): Promise<string> {
  try {
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    console.error('Erro ao criar diretório de uploads:', err);
  }
  return UPLOAD_DIR;
}

/**
 * Gera um nome interno seguro baseado em timestamp e UUID,
 * mantendo apenas a extensão original higienizada.
 */
function generateSafeFileName(originalName: string): { storedName: string; extension: string } {
  const rawExt = path.extname(originalName || '').toLowerCase();
  const cleanExt = rawExt.replace(/[^a-z0-9.]/g, '').slice(0, 10);
  const uniqueId = crypto.randomUUID();
  const storedName = `${Date.now()}-${uniqueId}${cleanExt}`;
  return { storedName, extension: cleanExt };
}

/**
 * Salva um buffer de arquivo no disco local com segurança
 */
export async function saveUploadedFile(
  buffer: Buffer,
  originalName: string
): Promise<{ storedName: string; storageKey: string; size: number }> {
  const dir = await ensureUploadDir();
  const { storedName } = generateSafeFileName(originalName);
  const targetPath = path.join(dir, storedName);

  if (!targetPath.startsWith(dir)) {
    throw new Error('Tentativa de caminho de arquivo inválido detectada.');
  }

  await fs.promises.writeFile(targetPath, buffer);
  const stats = await fs.promises.stat(targetPath);

  return {
    storedName,
    storageKey: storedName,
    size: stats.size,
  };
}

/**
 * Retorna o caminho absoluto seguro de um arquivo armazenado
 */
export function getStoredFilePath(storageKey: string): string {
  if (!storageKey) return '';
  const safeBase = path.resolve(UPLOAD_DIR);
  const resolved = path.resolve(path.join(safeBase, path.basename(storageKey)));

  if (!resolved.startsWith(safeBase)) {
    throw new Error('Acesso a caminho de arquivo não autorizado.');
  }

  return resolved;
}

export const getSafeFilePath = getStoredFilePath;

/**
 * Remove um arquivo individual do disco
 */
export async function deleteStoredFile(storageKey: string): Promise<boolean> {
  try {
    const filePath = getStoredFilePath(storageKey);
    if (filePath && fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
  } catch (err) {
    console.warn(`Falha ao remover arquivo físico (${storageKey}):`, err);
  }
  return false;
}

/**
 * Remove todos os arquivos do diretório de uploads (usado no Reset de progresso)
 */
export async function deleteAllStoredFiles(): Promise<number> {
  let count = 0;
  try {
    const dir = await ensureUploadDir();
    const files = await fs.promises.readdir(dir);

    for (const file of files) {
      if (file.startsWith('.')) continue;

      const filePath = path.join(dir, file);
      try {
        const stat = await fs.promises.stat(filePath);
        if (stat.isFile()) {
          await fs.promises.unlink(filePath);
          count++;
        }
      } catch (e) {
        console.warn(`Erro ao excluir arquivo durante reset: ${filePath}`, e);
      }
    }
  } catch (err) {
    console.error('Erro ao limpar diretório de uploads:', err);
    throw err;
  }
  return count;
}

export async function deleteAllUploadedFiles(): Promise<{ deleted: number }> {
  const count = await deleteAllStoredFiles();
  return { deleted: count };
}

/**
 * Formata bytes em representação amigável
 */
export function formatBytes(bytes: number = 0): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
