import React, { useState, useEffect } from 'react';
import { ITask, ITaskExecution, ITaskAttachment, STATUS_LABELS } from '@/types/task';
import { StatusBadge } from './StatusBadge';

interface ExecutionModalProps {
  isOpen: boolean;
  task: ITask | null;
  onClose: () => void;
  onExecutionCompleted: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ExecutionModal: React.FC<ExecutionModalProps> = ({
  isOpen,
  task,
  onClose,
  onExecutionCompleted,
  onShowToast,
}) => {
  const [executions, setExecutions] = useState<ITaskExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<ITaskExecution | null>(null);
  const [executionAttachments, setExecutionAttachments] = useState<ITaskAttachment[]>([]);
  const [taskAttachments, setTaskAttachments] = useState<ITaskAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckedConfirmed, setIsCheckedConfirmed] = useState(false);

  // Formatação amigável de data
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Não registrada';
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

  // Carrega histórico de execuções e anexos da tarefa
  const loadExecutionsAndData = async () => {
    if (!task) return;
    try {
      setIsLoading(true);

      // 1. Busca execuções
      const resExec = await fetch(`/api/tasks/${task._id}/executions`);
      if (resExec.ok) {
        const dataExec: ITaskExecution[] = await resExec.json();
        setExecutions(dataExec);

        // Se houver execuções, seleciona a primeira (ou a pendente mais recente)
        if (dataExec.length > 0) {
          const pending = dataExec.find((e) => e.status !== 'completed');
          setSelectedExecution(pending || dataExec[0]);
        } else {
          setSelectedExecution(null);
        }
      }

      // 2. Busca anexos gerais da tarefa
      const resTaskAtt = await fetch(`/api/tasks/${task._id}/attachments`);
      if (resTaskAtt.ok) {
        const dataTaskAtt = await resTaskAtt.json();
        setTaskAttachments(dataTaskAtt);
      }
    } catch (err) {
      console.error(err);
      onShowToast('Erro ao carregar dados de execuções.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega anexos da execução selecionada
  const loadSelectedExecutionAttachments = async (execId: string) => {
    try {
      const res = await fetch(`/api/executions/${execId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setExecutionAttachments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen && task) {
      setIsCheckedConfirmed(false);
      loadExecutionsAndData();
    }
  }, [isOpen, task?._id]);

  useEffect(() => {
    if (selectedExecution) {
      setIsCheckedConfirmed(false);
      loadSelectedExecutionAttachments(selectedExecution._id);
    } else {
      setExecutionAttachments([]);
    }
  }, [selectedExecution?._id]);

  if (!isOpen || !task) return null;

  // Registrar nova execução para esta tarefa
  const handleCreateExecution = async () => {
    try {
      setIsCreatingNew(true);
      const res = await fetch(`/api/tasks/${task._id}/executions`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Falha ao registrar execução');
      }

      const newExec: ITaskExecution = await res.json();
      setExecutions((prev) => [newExec, ...prev]);
      setSelectedExecution(newExec);
      onShowToast('Nova execução registrada com sucesso!', 'success');
      onExecutionCompleted(); // Atualiza contadores globais
    } catch {
      onShowToast('Erro ao registrar nova execução.', 'error');
    } finally {
      setIsCreatingNew(false);
    }
  };

  // Concluir execução após checagem confirmada
  const handleCompleteExecution = async () => {
    if (!selectedExecution) return;
    if (!isCheckedConfirmed) {
      onShowToast('Confirme a checagem da execução antes de concluir.', 'error');
      return;
    }

    try {
      setIsCompleting(true);
      const res = await fetch(`/api/executions/${selectedExecution._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        onShowToast(errData.error || 'Erro ao concluir execução.', 'error');
        return;
      }

      const updated: ITaskExecution = await res.json();

      // Atualiza lista local
      setExecutions((prev) =>
        prev.map((e) => (e._id === updated._id ? updated : e))
      );
      setSelectedExecution(updated);
      setIsCheckedConfirmed(false);
      onShowToast(
        `Execução concluída! ${updated.valueBRL} adicionado ao acumulado.`,
        'success'
      );
      onExecutionCompleted(); // Notifica home para recalcular stats
    } catch {
      onShowToast('Erro ao processar a conclusão da execução.', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  // Upload de arquivo específico para a execução atual
  const handleUploadExecutionFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedExecution || !e.target.files || e.target.files.length === 0) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      for (let i = 0; i < e.target.files.length; i++) {
        formData.append('files', e.target.files[i]);
      }

      const res = await fetch(`/api/executions/${selectedExecution._id}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        onShowToast(err.error || 'Erro no upload.', 'error');
        return;
      }

      const newAtts: ITaskAttachment[] = await res.json();
      setExecutionAttachments((prev) => [...newAtts, ...prev]);
      onShowToast('Arquivo(s) anexado(s) à execução com sucesso!', 'success');
      onExecutionCompleted(); // Atualiza contagens
    } catch {
      onShowToast('Erro ao realizar upload para a execução.', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Excluir anexo
  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const res = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();

      setExecutionAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
      setTaskAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
      onShowToast('Anexo removido.', 'info');
      onExecutionCompleted();
    } catch {
      onShowToast('Erro ao remover anexo.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Checagem e Execuções da Tarefa
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tarefa: <span className="font-semibold text-slate-700">{task.title}</span> &bull; Valor padrão:{' '}
              <span className="font-bold text-emerald-700">{task.valueBRL || 'R$ 0,00'}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo: Duas Colunas (Histórico na esquerda e Área de Checagem na direita) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Coluna 1: Histórico de Execuções (4 colunas) */}
          <div className="md:col-span-5 border-r border-slate-100 bg-slate-50/40 p-4 overflow-y-auto flex flex-col justify-between max-h-[40vh] md:max-h-[75vh]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Histórico ({executions.length})
                </span>
                <button
                  onClick={handleCreateExecution}
                  disabled={isCreatingNew}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingNew ? (
                    <span className="animate-spin text-xs">↻</span>
                  ) : (
                    <span>+ Nova Execução</span>
                  )}
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 bg-slate-200/60 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : executions.length === 0 ? (
                <div className="text-center py-8 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 mb-3">
                    Nenhuma execução registrada para esta tarefa ainda.
                  </p>
                  <button
                    onClick={handleCreateExecution}
                    disabled={isCreatingNew}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                  >
                    Registrar Primeira Execução
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {executions.map((exec, idx) => {
                    const isSelected = selectedExecution?._id === exec._id;
                    const execNumber = executions.length - idx;
                    return (
                      <div
                        key={exec._id}
                        onClick={() => setSelectedExecution(exec)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-xs text-slate-800">
                            Execução #{execNumber}
                          </span>
                          <StatusBadge status={exec.status} />
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                          <span className="font-bold text-emerald-700">
                            {exec.valueBRL}
                          </span>
                          <span className="text-[11px]">
                            {exec.completedAt
                              ? `Concluída: ${formatDate(exec.completedAt).split(' ')[0]}`
                              : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Coluna 2: Área de Checagem / Verificação da Execução Selecionada (7 colunas) */}
          <div className="md:col-span-7 p-6 overflow-y-auto max-h-[75vh] space-y-5">
            {selectedExecution ? (
              <>
                {/* Painel de Identificação da Execução */}
                <div className="bg-gradient-to-br from-indigo-50/60 to-slate-50 p-4 rounded-2xl border border-indigo-100/70">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
                        Checagem da Execução
                      </span>
                      <code className="text-xs font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-indigo-100">
                        ID: {selectedExecution._id}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={selectedExecution.status} />
                      <span className="text-sm font-black text-emerald-700 bg-white px-2.5 py-1 rounded-xl border border-emerald-200">
                        {selectedExecution.valueBRL}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-3 pt-3 border-t border-indigo-100/50">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Iniciada em:</span>
                      <span className="font-medium">{formatDate(selectedExecution.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Conclusão:</span>
                      <span className="font-medium">{formatDate(selectedExecution.completedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Descrição da Tarefa Original */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Instruções &amp; Escopo da Tarefa
                  </label>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {task.description}
                  </div>
                </div>

                {/* Arquivos para Checagem (Tarefa + Execução) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Arquivos para Checagem
                    </label>

                    {/* Botão para anexar arquivo à execução */}
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>{isUploading ? 'Enviando...' : 'Anexar nesta execução'}</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleUploadExecutionFile}
                        disabled={isUploading}
                      />
                    </label>
                  </div>

                  {/* Lista de Arquivos */}
                  {taskAttachments.length === 0 && executionAttachments.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      Nenhum arquivo anexado a esta tarefa ou execução. Você pode anexar comprovantes ou documentos acima.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {/* Anexos da Tarefa Geral */}
                      {taskAttachments.map((att) => (
                        <div
                          key={att._id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs hover:bg-white transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              Tarefa
                            </span>
                            <span className="font-semibold text-slate-700 truncate" title={att.originalName}>
                              {att.originalName}
                            </span>
                            <span className="text-slate-400 text-[11px] whitespace-nowrap">
                              ({att.sizeFormatted})
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <a
                              href={`/api/attachments/${att._id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg text-indigo-600 hover:bg-indigo-50 font-semibold"
                            >
                              Abrir
                            </a>
                            <a
                              href={`/api/attachments/${att._id}?download=1`}
                              className="px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                            >
                              Baixar
                            </a>
                          </div>
                        </div>
                      ))}

                      {/* Anexos Específicos da Execução */}
                      {executionAttachments.map((att) => (
                        <div
                          key={att._id}
                          className="flex items-center justify-between p-2.5 bg-emerald-50/40 rounded-xl border border-emerald-200 text-xs hover:bg-white transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Execução
                            </span>
                            <span className="font-semibold text-slate-700 truncate" title={att.originalName}>
                              {att.originalName}
                            </span>
                            <span className="text-slate-400 text-[11px] whitespace-nowrap">
                              ({att.sizeFormatted})
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <a
                              href={`/api/attachments/${att._id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg text-emerald-700 hover:bg-emerald-100 font-semibold"
                            >
                              Abrir
                            </a>
                            <a
                              href={`/api/attachments/${att._id}?download=1`}
                              className="px-2 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                            >
                              Baixar
                            </a>
                            <button
                              onClick={() => handleDeleteAttachment(att._id)}
                              className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer"
                              title="Remover arquivo"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seção de Confirmação da Checagem e Conclusão */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  {selectedExecution.status === 'completed' ? (
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                      <div className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Esta execução já está CONCLUÍDA</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        O valor de {selectedExecution.valueBRL} já está computado no total acumulado.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Checkbox de Checagem Obrigatória */}
                      <div className="flex items-start gap-2.5 bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
                        <input
                          id="confirm-check"
                          type="checkbox"
                          checked={isCheckedConfirmed}
                          onChange={(e) => setIsCheckedConfirmed(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor="confirm-check" className="text-xs text-amber-900 cursor-pointer select-none">
                          <span className="font-bold">Confirmação de checagem da tarefa:</span> Verifiquei as informações e
                          anexos desta execução e confirmo que a atividade foi devidamente realizada.
                        </label>
                      </div>

                      {/* Botão Concluir Execução */}
                      <button
                        onClick={handleCompleteExecution}
                        disabled={!isCheckedConfirmed || isCompleting}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isCompleting ? (
                          <span className="animate-spin text-sm">↻ Concluindo...</span>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Concluir Execução e Acumular {selectedExecution.valueBRL}</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-slate-400 text-sm">
                Selecione uma execução no painel lateral ou clique em &quot;+ Nova Execução&quot;.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
