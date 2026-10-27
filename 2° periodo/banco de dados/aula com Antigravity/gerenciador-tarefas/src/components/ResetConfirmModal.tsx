import React, { useState } from 'react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isCheckedFirst, setIsCheckedFirst] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleReset = async () => {
    if (!isCheckedFirst || isResetting) return;

    try {
      setIsResetting(true);
      await onConfirm();
      setIsCheckedFirst(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    if (isResetting) return;
    setIsCheckedFirst(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Ícone de Alerta Destrutivo */}
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-black text-slate-900 text-center mb-2">
            Resetar Progresso de Trabalho?
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 text-center leading-relaxed mb-4">
            Tem certeza de que deseja resetar o progresso? Todas as execuções voltarão para pendente, o
            valor acumulado será zerado e todos os arquivos anexados serão apagados.
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 text-xs text-emerald-900">
            <span className="font-bold flex items-center gap-1">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Garantia fundamental:
            </span>
            As tarefas cadastradas serão 100% preservadas com seus títulos, descrições e valores.
          </div>

          {/* Confirmação Explícita Obrigatória */}
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3.5 mb-5">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCheckedFirst}
                onChange={(e) => setIsCheckedFirst(e.target.checked)}
                disabled={isResetting}
                className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-xs text-rose-950 font-medium">
                Confirmo que desejo resetar todas as execuções para pendente e apagar todos os arquivos anexados. Esta ação não poderá ser desfeita.
              </span>
            </label>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isResetting}
              className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={!isCheckedFirst || isResetting}
              className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-md shadow-rose-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isResetting ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Resetando...</span>
                </>
              ) : (
                <span>Confirmar Reset</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
