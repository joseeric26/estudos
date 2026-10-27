import React from 'react';
import { ITask } from '@/types/task';
import { StatusBadge } from './StatusBadge';

interface TaskDetailsModalProps {
  task: ITask | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: ITask) => void;
  onOpenExecutions?: (task: ITask) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onOpenExecutions,
}) => {
  if (!isOpen || !task) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <StatusBadge status={task.status} />
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {task.valueBRL || 'R$ 0,00'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {task.title}
            </h2>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Descrição
            </label>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
              {task.description}
            </div>
          </div>

          {/* Painel de Métricas da Tarefa */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Execuções Registradas</span>
              <span className="text-slate-800 font-bold text-sm">
                {task.executionCount || 0} total ({task.completedExecutionCount || 0} concluídas)
              </span>
            </div>
            <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
              <span className="text-emerald-700 block font-medium">Total Acumulado</span>
              <span className="text-emerald-800 font-black text-sm">
                {task.accumulatedValueBRL || 'R$ 0,00'}
              </span>
            </div>
          </div>

          {/* Metadados Técnicos (MongoDB e Datas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Data de Criação</span>
              <span className="text-slate-700 font-semibold">{formatDate(task.createdAt)}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-slate-400 block font-medium">Última Modificação</span>
              <span className="text-slate-700 font-semibold">{formatDate(task.updatedAt)}</span>
            </div>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">MongoDB ObjectId:</span>
            <code className="text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {task._id}
            </code>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          {onOpenExecutions && (
            <button
              onClick={() => {
                onClose();
                onOpenExecutions(task);
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Verificar Execuções</span>
              <span>→</span>
            </button>
          )}

          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>Editar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
