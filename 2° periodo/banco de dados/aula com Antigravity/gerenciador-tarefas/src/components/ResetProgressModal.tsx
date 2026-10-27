import React, { useState } from 'react';

interface ResetProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
}

export const ResetProgressModal: React.FC<ResetProgressModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const [doubleConfirm, setDoubleConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async () => {
    if (!doubleConfirm) return;

    try {
      setIsResetting(true);
      setErrorMessage(null);
      await onConfirmReset();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao realizar o reset de progresso.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-rose-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Ícone de Alerta Destrutivo */}
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 mx-auto border border-rose-100 shadow-xs">
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
            Resetar Progresso das Tarefas?
          </h3>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs mb-4 leading-relaxed">
            <p className="font-bold mb-1">⚠️ ATENÇÃO: Regra de Preservação</p>
            <p>
              As <strong>tarefas cadastradas NÃO serão excluídas</strong>. Títulos, descrições, valores monetários e cadastros originais permanecerão intactos no banco de dados.
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed text-center mb-4">
            Ao confirmar o reset:
          </p>

          <ul className="text-xs text-slate-600 space-y-1.5 mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Todas as execuções de tarefas voltarão para o status <strong>Pendente</strong>.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>O total acumulado de valores será <strong>zerado (R$ 0,00)</strong>.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Todos os <strong>arquivos anexados</strong> e seus metadados serão apagados.</span>
            </li>
          </ul>

          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Segunda confirmação explícita */}
          <div className="mb-6 p-3 bg-rose-50/50 rounded-xl border border-rose-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={doubleConfirm}
                onChange={(e) => setDoubleConfirm(e.target.checked)}
                disabled={isResetting}
                className="mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs text-rose-900 font-semibold leading-relaxed">
                Estou ciente de que as execuções serão reiniciadas para pendente e os arquivos serão apagados. Desejo continuar.
              </span>
            </label>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isResetting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors w-1/2 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={!doubleConfirm || isResetting}
              className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm shadow-rose-200 transition-all flex items-center justify-center gap-2 w-1/2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
