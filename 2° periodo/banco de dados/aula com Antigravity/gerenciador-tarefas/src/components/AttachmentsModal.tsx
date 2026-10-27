import React, { useState, useEffect } from 'react';
import { ITask, ITaskAttachment } from '@/types/task';

interface AttachmentsModalProps {
  isOpen: boolean;
  task: ITask | null;
  onClose: () => void;
  onAttachmentsUpdated: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AttachmentsModal: React.FC<AttachmentsModalProps> = ({
  isOpen,
  task,
  onClose,
  onAttachmentsUpdated,
  onShowToast,
}) => {
  const [attachments, setAttachments] = useState<ITaskAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Formatação de data
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

  // Carrega anexos da tarefa
  const fetchAttachments = async () => {
    if (!task) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/tasks/${task._id}/attachments`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAttachments(data);
    } catch {
      onShowToast('Erro ao carregar anexos.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && task) {
      fetchAttachments();
    }
  }, [isOpen, task?._id]);

  if (!isOpen || !task) return null;

  // Processa upload de arquivos
  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      for (let i = 0; i < fileList.length; i++) {
        formData.append('files', fileList[i]);
      }

      const res = await fetch(`/api/tasks/${task._id}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        onShowToast(errorData.error || 'Falha ao anexar arquivos.', 'error');
        return;
      }

      const newAtts: ITaskAttachment[] = await res.json();
      setAttachments((prev) => [...newAtts, ...prev]);
      onShowToast('Arquivo(s) anexado(s) com sucesso!', 'success');
      onAttachmentsUpdated();
    } catch {
      onShowToast('Erro ao realizar o upload do arquivo.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Excluir anexo individual
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/attachments/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();

      setAttachments((prev) => prev.filter((a) => a._id !== id));
      onShowToast('Arquivo excluído com sucesso.', 'info');
      onAttachmentsUpdated();
    } catch {
      onShowToast('Erro ao excluir anexo.', 'error');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Arquivos Anexados à Tarefa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
              {task.title}
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

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Área de Drag & Drop para Upload */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50'
                : 'border-slate-200 hover:border-indigo-300 bg-slate-50/50'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            <h4 className="text-sm font-bold text-slate-800 mb-1">
              Arraste e solte arquivos aqui
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Aceita arquivos de qualquer extensão (PDF, Imagens, Documentos, etc. até 15 MB)
            </p>

            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm cursor-pointer transition-all">
              <span>{isUploading ? 'Enviando arquivos...' : 'Selecionar Arquivos'}</span>
              <input
                type="file"
                multiple
                className="hidden"
                disabled={isUploading}
                onChange={(e) => handleUpload(e.target.files)}
              />
            </label>
          </div>

          {/* Listagem de Anexos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Arquivos Anexados ({attachments.length})
              </h3>
              {isLoading && <span className="text-xs text-indigo-600 animate-spin">↻</span>}
            </div>

            {attachments.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                Nenhum arquivo anexado a esta tarefa até o momento.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {attachments.map((att) => (
                  <div
                    key={att._id}
                    className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 truncate" title={att.originalName}>
                          {att.originalName}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>{att.sizeFormatted}</span>
                          <span>&bull;</span>
                          <span>{formatDate(att.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`/api/attachments/${att._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        Visualizar
                      </a>
                      <a
                        href={`/api/attachments/${att._id}?download=1`}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Baixar
                      </a>
                      <button
                        onClick={() => handleDelete(att._id)}
                        title="Excluir anexo"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
