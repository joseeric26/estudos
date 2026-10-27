import { ObjectId } from 'mongodb';

/**
 * Formata centavos para string BRL (ex: 5000 -> 'R$ 50,00').
 * Duplicada aqui para não importar módulos Node.js-only em arquivos de tipos compartilhados.
 */
export function formatBRL(cents: number | undefined | null): string {
  const value = (typeof cents === 'number' && !isNaN(cents) ? cents : 0) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata bytes para leitura humana (ex: 2048 -> '2 KB').
 */
export function formatFileSize(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Possíveis status de uma tarefa ou de uma execução no sistema
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type ExecutionStatus = 'pending' | 'in_progress' | 'completed';

/**
 * Estrutura do documento de Tarefa persistido no MongoDB (coleção 'tasks')
 */
export interface TaskDocument {
  _id?: ObjectId;
  title: string;
  description: string;
  status: TaskStatus;
  valueCents: number; // Valor monetário padrão em centavos (ex: 5000 = R$ 50,00)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Representação da Tarefa serializada em JSON para comunicação com a interface
 */
export interface ITask {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  valueCents: number;
  valueBRL?: string;
  createdAt: string;
  updatedAt: string;
  // Métricas dinâmicas agregadas
  executionCount?: number;
  executionsCount?: number;
  completedExecutionCount?: number;
  completedExecutionsCount?: number;
  pendingExecutionCount?: number;
  pendingExecutionsCount?: number;
  accumulatedValueCents?: number;
  accumulatedValueBRL?: string;
  totalEarnedCents?: number;
  attachmentCount?: number;
  attachmentsCount?: number;
}

/**
 * Estrutura de Execução de Tarefa no MongoDB (coleção 'task_executions')
 */
export interface TaskExecutionDocument {
  _id?: ObjectId;
  taskId: ObjectId;
  executionNumber?: number;
  status: ExecutionStatus;
  valueCents: number; // Snapshot do valor vigente no momento da execução
  startedAt?: Date | null;
  completedAt?: Date | null;
  verifiedAt?: Date | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Representação da Execução serializada para o cliente
 */
export interface ITaskExecution {
  _id: string;
  taskId: string;
  executionNumber?: number;
  status: ExecutionStatus;
  valueCents: number;
  valueBRL?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  verifiedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  attachmentCount?: number;
  attachmentsCount?: number;
}

/**
 * Estrutura do Anexo de Arquivo no MongoDB (coleção 'task_attachments')
 */
export interface TaskAttachmentDocument {
  _id?: ObjectId;
  taskId: ObjectId;
  executionId?: ObjectId | null;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  uploadedAt: Date;
}

/**
 * Representação do Anexo serializado para o cliente
 */
export interface ITaskAttachment {
  _id: string;
  taskId: string;
  executionId?: string | null;
  originalName: string;
  storedName?: string;
  mimeType: string;
  size: number;
  sizeFormatted?: string;
  storageKey?: string;
  uploadedAt: string;
}

/**
 * Resumo estatístico do sistema para o Dashboard
 */
export interface DashboardStats {
  totalTasks: number;
  totalExecutions: number;
  pendingExecutions: number;
  inProgressExecutions: number;
  completedExecutions: number;
  accumulatedValueCents: number; // Soma de valueCents das execuções concluídas
  accumulatedValueBRL: string;
}

export type IAppStats = DashboardStats;

/**
 * Payload para criação de nova tarefa
 */
export interface CreateTaskDTO {
  title: string;
  description: string;
  status?: TaskStatus;
  valueCents?: number;
  value?: number | string;
}

/**
 * Payload para atualização de tarefa existente
 */
export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  status?: TaskStatus;
  valueCents?: number;
  value?: number | string;
}

/**
 * Rótulos humanizados em Português do Brasil para cada status
 */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluída',
};

/**
 * Configurações visuais (cores Tailwind) para os badges de status
 */
export const STATUS_STYLES: Record<
  TaskStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  in_progress: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  completed: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
};
