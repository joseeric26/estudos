import React, { useState } from 'react';
import { ITask } from '@/types/task';

interface DeleteConfirmModalProps {
  task: ITask | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  task,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !task) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirm(task._id);
      onClose();
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 mx-auto border border-rose-100">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>

          <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
            Confirmar Exclusão
          </h3>

          <p className="text-sm text-slate-600 text-center mb-4 leading-relaxed">
            Tem certeza de que deseja remover a tarefa{' '}
            <span className="font-semibold text-slate-800">
              &ldquo;{task.title}&rdquo;
            </span>
            ? Esta ação removerá o documento definitivamente do banco de dados MongoDB.
          </p>

          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors w-1/2"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm shadow-rose-200 transition-all flex items-center justify-center gap-2 w-1/2 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Excluindo...</span>
                </>
              ) : (
                <span>Sim, Excluir</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
