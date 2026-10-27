import React from 'react';
import { ITask, TaskStatus, STATUS_LABELS } from '@/types/task';
import { StatusBadge } from './StatusBadge';

interface TaskCardProps {
  task: ITask;
  onView: (task: ITask) => void;
  onEdit: (task: ITask) => void;
  onDelete: (task: ITask) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onExecute: (task: ITask) => void;
  onOpenExecutions: (task: ITask) => void;
  onOpenAttachments: (task: ITask) => void;
  isExecuting?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onExecute,
  onOpenExecutions,
  onOpenAttachments,
  isExecuting = false,
}) => {
  // Formatação de data amigável em pt-BR
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const isUpdated = task.updatedAt && task.updatedAt !== task.createdAt;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Cabeçalho do Card com Status, Valor Base e Ações Rápidas */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            {/* Valor da Tarefa */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {task.valueBRL || 'R$ 0,00'}
            </span>
          </div>

          <div className="flex items-center space-x-1 opacity-90 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onView(task)}
              title="Visualizar detalhes"
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>

            <button
              onClick={() => onEdit(task)}
              title="Editar tarefa"
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            <button
              onClick={() => onDelete(task)}
              title="Excluir tarefa"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Título da Tarefa */}
        <h3 className="text-base font-semibold text-slate-900 mb-1.5 line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {task.title}
        </h3>

        {/* Descrição */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {task.description}
        </p>

        {/* Painel de Métricas de Execução da Tarefa */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Execuções da tarefa:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800" title="Total de execuções">
                {task.executionCount || 0} total
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-emerald-600" title="Execuções concluídas">
                {task.completedExecutionCount || 0} concl.
              </span>
              {(task.pendingExecutionCount || 0) > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-amber-600" title="Execuções pendentes">
                    {task.pendingExecutionCount} pend.
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
            <span className="text-slate-500 font-medium">Acumulado desta tarefa:</span>
            <span className="text-sm font-extrabold text-emerald-700">
              {task.accumulatedValueBRL || 'R$ 0,00'}
            </span>
          </div>
        </div>
      </div>

      {/* Ações Específicas: Executar + Checagem + Anexos */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {/* Botão Executar Tarefa */}
          <button
            onClick={() => onExecute(task)}
            disabled={isExecuting}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {isExecuting ? (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>Executar Tarefa</span>
          </button>

          {/* Botão Checagem / Histórico */}
          <button
            onClick={() => onOpenExecutions(task)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Checagem ({task.executionCount || 0})</span>
          </button>
        </div>

        {/* Botão Anexos */}
        <button
          onClick={() => onOpenAttachments(task)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 text-xs text-slate-600 hover:text-indigo-700 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span>Anexos da Tarefa</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold">
            {task.attachmentCount || 0}
          </span>
        </button>

        {/* Rodapé do Card com Data e Seletor de Status Rápido */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 text-[11px]">
            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(task.createdAt)}</span>
          </div>

          {/* Mudar Status Rápido */}
          <div className="flex items-center gap-1">
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task._id, e.target.value as TaskStatus)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-2 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors"
            >
              <option value="pending">{STATUS_LABELS.pending}</option>
              <option value="in_progress">{STATUS_LABELS.in_progress}</option>
              <option value="completed">{STATUS_LABELS.completed}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
