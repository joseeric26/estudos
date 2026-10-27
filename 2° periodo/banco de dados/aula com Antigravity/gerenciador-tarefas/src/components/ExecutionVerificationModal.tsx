import React, { useState, useEffect } from 'react';
import { ITask, ITaskExecution, ITaskAttachment, formatBRL, formatFileSize } from '@/types/task';
import { StatusBadge } from './StatusBadge';

interface ExecutionVerificationModalProps {
  isOpen: boolean;
  task: ITask | null;
  execution: ITaskExecution | null;
  onClose: () => void;
  onCompleteExecution: (executionId: string, verified: boolean) => Promise<void>;
  onRefreshData: () => void;
}

export const ExecutionVerificationModal: React.FC<ExecutionVerificationModalProps> = ({
  isOpen,
  task,
  execution,
  onClose,
  onCompleteExecution,
  onRefreshData,
}) => {
  const [taskAttachments, setTaskAttachments] = useState<ITaskAttachment[]>([]);
  const [executionAttachments, setExecutionAttachments] = useState<ITaskAttachment[]>([]);
  const [isConfirmedCheck, setIsConfirmedCheck] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  // Carrega anexos da tarefa e da execução
  const loadAttachments = async () => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task._id}/attachments`);
      if (res.ok) {
        const allAtts: ITaskAttachment[] = await res.json();
        // Separa arquivos gerais da tarefa dos arquivos específicos desta execução
        const general = allAtts.filter((a) => !a.executionId || a.executionId !== execution?._id);
        const specific = allAtts.filter((a) => a.executionId === execution?._id);
        setTaskAttachments(general);
        setExecutionAttachments(specific);
      }
    } catch (err) {
      console.error('Erro ao carregar anexos na verificação:', err);
    }
  };

  useEffect(() => {
    if (isOpen && execution) {
      loadAttachments();
      setIsConfirmedCheck(false);
      setFeedback(null);
    }
  }, [isOpen, execution]);

  if (!isOpen || !execution || !task) return null;

  const isAlreadyCompleted = execution.status === 'completed';

  // Upload específico para esta execução
  const handleUploadExecutionFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('executionId', execution._id);
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch(`/api/tasks/${task._id}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro no upload para a execução');
      }

      const uploaded = await res.json();
      setExecutionAttachments((prev) => [...uploaded, ...prev]);
      setFeedback({ message: 'Arquivo anexado com sucesso a esta execução!' });
      onRefreshData();
      e.target.value = '';
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erro ao enviar anexo.', isError: true });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConclude = async () => {
    if (isAlreadyCompleted) return;
    if (!isConfirmedCheck) {
      setFeedback({ message: 'Por favor, marque o termo de verificação antes de concluir.', isError: true });
      return;
    }

    try {
      setIsSubmitting(true);
      await onCompleteExecution(execution._id, true);
      onClose();
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erro ao concluir execução.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Checagem e Verificação da Execução</h2>
              <p className="text-xs text-slate-400">Valide os requisitos e anexos antes de contabilizar o valor</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Feedback visual */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
              feedback.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
              &times;
            </button>
          </div>
        )}

        {/* Conteúdo com scroll */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Card com Detalhes da Tarefa & Execução */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tarefa Original</span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">{task.title}</h3>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Identificador</span>
                <p className="font-mono text-indigo-700 font-extrabold text-xs">#{execution.executionNumber}</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed text-xs">{task.description}</p>

            <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">Status Atual:</span>
                <StatusBadge status={execution.status} size="sm" />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Valor Previsto desta Execução:</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {formatBRL(execution.valueCents)}
                </span>
              </div>
            </div>

            {execution.completedAt && (
              <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-emerald-800 text-[11px]">
                Esta execução foi concluída com sucesso em <strong>{formatDate(execution.completedAt)}</strong>. O valor de {formatBRL(execution.valueCents)} já está integrado ao total acumulado.
              </div>
            )}
          </div>

          {/* Anexos vinculados à execução específica */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700 text-xs">
                Anexos Desta Execução (#{execution.executionNumber})
              </span>
              {!isAlreadyCompleted && (
                <label className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-1">
                  <input
                    type="file"
                    multiple
                    onChange={handleUploadExecutionFile}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <span>{isUploading ? 'Enviando...' : '+ Anexar a esta execução'}</span>
                </label>
              )}
            </div>

            {executionAttachments.length === 0 ? (
              <p className="text-slate-400 italic text-[11px] bg-slate-50/60 p-2.5 rounded-xl border border-dashed border-slate-200 text-center">
                Nenhum arquivo anexado especificamente a esta execução.
              </p>
            ) : (
              <div className="space-y-1.5">
                {executionAttachments.map((att) => (
                  <div key={att._id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="truncate pr-2">
                      <p className="font-medium text-slate-800 truncate">{att.originalName}</p>
                      <span className="text-[10px] text-slate-400">{formatFileSize(att.size)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`/api/attachments/${att._id}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                        Visualizar
                      </a>
                      <a href={`/api/attachments/${att._id}?download=true`} className="text-emerald-600 hover:underline">
                        Baixar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Anexos gerais da Tarefa */}
          <div>
            <span className="font-bold text-slate-700 text-xs block mb-2">
              Anexos Gerais da Tarefa ({taskAttachments.length})
            </span>
            {taskAttachments.length === 0 ? (
              <p className="text-slate-400 italic text-[11px] bg-slate-50/60 p-2.5 rounded-xl border border-dashed border-slate-200 text-center">
                Nenhum arquivo geral vinculado à tarefa.
              </p>
            ) : (
              <div className="space-y-1.5">
                {taskAttachments.map((att) => (
                  <div key={att._id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div className="truncate pr-2">
                      <p className="font-medium text-slate-800 truncate">{att.originalName}</p>
                      <span className="text-[10px] text-slate-400">{formatFileSize(att.size)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`/api/attachments/${att._id}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                        Visualizar
                      </a>
                      <a href={`/api/attachments/${att._id}?download=true`} className="text-emerald-600 hover:underline">
                        Baixar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Termo de Checagem / Confirmação */}
          {!isAlreadyCompleted ? (
            <div className="pt-2">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfirmedCheck}
                  onChange={(e) => setIsConfirmedCheck(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-[11px] text-indigo-950 font-medium leading-relaxed">
                  Confirmo a checagem desta execução. A conclusão adicionará{' '}
                  <strong className="text-emerald-700">{formatBRL(execution.valueCents)}</strong> ao valor total acumulado.
                </span>
              </label>
            </div>
          ) : null}
        </div>

        {/* Rodapé e Ações */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>

          {!isAlreadyCompleted && (
            <button
              onClick={handleConclude}
              disabled={!isConfirmedCheck || isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting && (
                <svg className="w-3.5 h-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              <span>Concluir Execução</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
