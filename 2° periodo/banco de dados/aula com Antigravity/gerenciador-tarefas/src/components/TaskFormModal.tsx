import React, { useState, useEffect } from 'react';
import { ITask, TaskStatus, STATUS_LABELS } from '@/types/task';
import { centsToDecimalString, parseBRLToCents, formatCurrencyInput } from '@/lib/currency';

interface TaskFormModalProps {
  isOpen: boolean;
  initialData?: ITask | null;
  onClose: () => void;
  onSubmit: (formData: {
    title: string;
    description: string;
    status: TaskStatus;
    valueCents: number;
  }) => Promise<void>;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [valueInput, setValueInput] = useState('0,00');
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    value?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializa ou limpa os campos ao abrir o modal
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setStatus(initialData.status);
      setValueInput(centsToDecimalString(initialData.valueCents || 0));
    } else {
      setTitle('');
      setDescription('');
      setStatus('pending');
      setValueInput('0,00');
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setValueInput(formatted || '0,00');
    if (errors.value) setErrors((prev) => ({ ...prev, value: undefined }));
  };

  const validate = () => {
    const newErrors: { title?: string; description?: string; value?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Por favor, informe o título da tarefa.';
    } else if (title.trim().length > 100) {
      newErrors.title = 'O título não pode exceder 100 caracteres.';
    }

    if (!description.trim()) {
      newErrors.description = 'Por favor, informe a descrição detalhada da tarefa.';
    } else if (description.trim().length > 1000) {
      newErrors.description = 'A descrição não pode exceder 1000 caracteres.';
    }

    const cents = parseBRLToCents(valueInput);
    if (cents < 0) {
      newErrors.value = 'O valor da tarefa não pode ser negativo.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const valueCents = parseBRLToCents(valueInput);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        status,
        valueCents,
      });
      onClose();
    } catch (err) {
      console.error('Erro no envio do formulário:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              {initialData ? '✎' : '+'}
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              {initialData ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Campo Título */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Título da Tarefa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="Ex: Realizar manutenção no servidor"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.title
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.title}</p>
            )}
          </div>

          {/* Campo Valor em Reais (BRL) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Valor por Execução <span className="text-slate-400 font-normal">(BRL)</span>
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className="text-slate-500 font-semibold text-sm">R$</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={valueInput}
                onChange={handleValueChange}
                placeholder="0,00"
                className={`w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.value
                    ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {errors.value ? (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.value}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Este valor será registrado em cada execução individual desta tarefa.
              </p>
            )}
          </div>

          {/* Campo Descrição */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Descrição Detalhada <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              placeholder="Descreva o escopo, procedimentos ou detalhes da atividade..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.description
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.description}</p>
            )}
          </div>

          {/* Campo Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Status Inicial da Tarefa
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              <option value="pending">{STATUS_LABELS.pending}</option>
              <option value="in_progress">{STATUS_LABELS.in_progress}</option>
              <option value="completed">{STATUS_LABELS.completed}</option>
            </select>
          </div>

          {/* Rodapé e Botões */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && (
                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              <span>{initialData ? 'Atualizar Tarefa' : 'Salvar Tarefa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
