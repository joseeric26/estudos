import React, { useState, useEffect } from 'react';
import { ITask, ITaskExecution, ITaskAttachment, formatBRL, formatFileSize } from '@/types/task';
import { StatusBadge } from './StatusBadge';

interface TaskExecutionsModalProps {
  task: ITask | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshTasks: () => void;
  onOpenVerification: (execution: ITaskExecution, task: ITask) => void;
}

export const TaskExecutionsModal: React.FC<TaskExecutionsModalProps> = ({
  task,
  isOpen,
  onClose,
  onRefreshTasks,
  onOpenVerification,
}) => {
  const [activeTab, setActiveTab] = useState<'executions' | 'attachments'>('executions');
  const [executions, setExecutions] = useState<ITaskExecution[]>([]);
  const [attachments, setAttachments] = useState<ITaskAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingExecution, setIsCreatingExecution] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  const loadData = async () => {
    if (!task) return;
    try {
      setIsLoading(true);
      const [execRes, attRes] = await Promise.all([
        fetch(`/api/tasks/${task._id}/executions`),
        fetch(`/api/tasks/${task._id}/attachments`),
      ]);

      if (execRes.ok) {
        const execData = await execRes.json();
        setExecutions(execData);
      }
      if (attRes.ok) {
        const attData = await attRes.json();
        setAttachments(attData);
      }
    } catch (err) {
      console.error(err);
      setFeedback({ message: 'Erro ao carregar dados da tarefa.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && task) {
      loadData();
      setFeedback(null);
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  // Registrar nova execução
  const handleNewExecution = async () => {
    try {
      setIsCreatingExecution(true);
      const res = await fetch(`/api/tasks/${task._id}/executions`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Falha ao registrar execução');
      }

      const created = await res.json();
      setExecutions((prev) => [created, ...prev]);
      setFeedback({ message: `Execução #${created.executionNumber} registrada com sucesso!` });
      onRefreshTasks();
    } catch (err) {
      setFeedback({ message: 'Erro ao criar nova execução.', isError: true });
    } finally {
      setIsCreatingExecution(false);
    }
  };

  // Upload de arquivos
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch(`/api/tasks/${task._id}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro no upload de arquivos');
      }

      const uploadedList = await res.json();
      setAttachments((prev) => [...uploadedList, ...prev]);
      setFeedback({ message: `${uploadedList.length} arquivo(s) anexado(s) com sucesso!` });
      onRefreshTasks();
      // Limpa input
      e.target.value = '';
    } catch (err: any) {
      setFeedback({ message: err.message || 'Erro ao enviar arquivo.', isError: true });
    } finally {
      setIsUploading(false);
    }
  };

  // Excluir anexo
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Deseja excluir este arquivo anexo permanentemente?')) return;

    try {
      const res = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Falha ao remover arquivo');

      setAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
      setFeedback({ message: 'Arquivo anexo removido com sucesso!' });
      onRefreshTasks();
    } catch {
      setFeedback({ message: 'Erro ao excluir anexo.', isError: true });
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
        className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 line-clamp-1">{task.title}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Valor: <strong className="text-emerald-700">{formatBRL(task.valueCents || 0)}</strong></span>
                <span>&bull;</span>
                <span>{executions.length} execuções registradas</span>
              </div>
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

        {/* Abas */}
        <div className="px-6 pt-3 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('executions')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'executions'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Histórico de Execuções ({executions.length})
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                activeTab === 'attachments'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Arquivos Anexados ({attachments.length})
            </button>
          </div>

          {activeTab === 'executions' && (
            <button
              onClick={handleNewExecution}
              disabled={isCreatingExecution}
              className="mb-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{isCreatingExecution ? 'Registrando...' : 'Nova Execução'}</span>
            </button>
          )}
        </div>

        {/* Feedback visual temporário */}
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

        {/* Conteúdo rolável */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
              Carregando dados da tarefa...
            </div>
          ) : activeTab === 'executions' ? (
            /* Lista de Execuções */
            executions.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                <p className="text-sm font-semibold text-slate-700">Nenhuma execução registrada ainda.</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Clique em &ldquo;Nova Execução&rdquo; para iniciar o primeiro ciclo desta atividade.
                </p>
                <button
                  onClick={handleNewExecution}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
                >
                  Registrar Primeira Execução
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {executions.map((exec) => (
                  <div
                    key={exec._id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          #{exec.executionNumber}
                        </span>
                        <StatusBadge status={exec.status} size="sm" />
                        <span className="text-xs font-bold text-slate-700">
                          {formatBRL(exec.valueCents)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        <p>Iniciada em: {formatDate(exec.startedAt || exec.createdAt)}</p>
                        {exec.completedAt && (
                          <p className="text-emerald-700 font-medium">
                            Concluída em: {formatDate(exec.completedAt)}
                          </p>
                        )}
                        {exec.attachmentsCount ? (
                          <p className="text-indigo-600 font-medium">
                            {exec.attachmentsCount} anexo(s) específico(s)
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenVerification(exec, task)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          exec.status === 'completed'
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{exec.status === 'completed' ? 'Ver Detalhes' : 'Checar e Concluir'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Aba de Arquivos Anexados */
            <div className="space-y-4">
              {/* Área de envio de arquivos */}
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 text-center transition-colors">
                <input
                  type="file"
                  id="task-file-upload"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <label
                  htmlFor="task-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-indigo-700">
                    {isUploading ? 'Enviando arquivos...' : 'Clique para selecionar arquivos'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Aceita qualquer formato de arquivo (PDF, imagens, documentos, planilhas, etc.)
                  </span>
                </label>
              </div>

              {/* Lista de Arquivos */}
              {attachments.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">
                  Nenhum arquivo anexado a esta tarefa até o momento.
                </p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att._id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-slate-800 truncate" title={att.originalName}>
                            {att.originalName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatFileSize(att.size)} &bull; {formatDate(att.uploadedAt)}
                            {att.executionId && ' &bull; Específico de execução'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <a
                          href={`/api/attachments/${att._id}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Visualizar arquivo"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </a>

                        <a
                          href={`/api/attachments/${att._id}?download=true`}
                          title="Baixar arquivo"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>

                        <button
                          onClick={() => handleDeleteAttachment(att._id)}
                          title="Excluir arquivo anexo"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
