'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { TaskCard } from '@/components/TaskCard';
import { TaskFormModal } from '@/components/TaskFormModal';
import { TaskDetailsModal } from '@/components/TaskDetailsModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { ExecutionModal } from '@/components/ExecutionModal';
import { AttachmentsModal } from '@/components/AttachmentsModal';
import { ResetConfirmModal } from '@/components/ResetConfirmModal';
import { Toast, ToastMessage } from '@/components/Toast';
import { ITask, TaskStatus, IAppStats } from '@/types/task';

export default function HomePage() {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [stats, setStats] = useState<IAppStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);

  // Modais de ação
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ITask | null>(null);
  const [viewingTask, setViewingTask] = useState<ITask | null>(null);
  const [deletingTask, setDeletingTask] = useState<ITask | null>(null);
  const [executionTask, setExecutionTask] = useState<ITask | null>(null);
  const [attachmentsTask, setAttachmentsTask] = useState<ITask | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Notificação Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ message, type });
    },
    []
  );

  // Carregar dados (Tarefas + Métricas Consolidadas do MongoDB)
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [tasksRes, statsRes] = await Promise.all([
        fetch('/api/tasks', { cache: 'no-store' }),
        fetch('/api/stats', { cache: 'no-store' }),
      ]);

      if (!tasksRes.ok || !statsRes.ok) {
        throw new Error('Falha ao obter dados do servidor');
      }

      const tasksData = await tasksRes.json();
      const statsData = await statsRes.json();

      setTasks(tasksData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
      showToast(
        'Erro ao conectar com o banco de dados. Verifique os containers.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Criar nova tarefa
  const handleCreate = async (formData: {
    title: string;
    description: string;
    status: TaskStatus;
    valueCents: number;
  }) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      showToast(errorData.error || 'Erro ao criar a tarefa.', 'error');
      throw new Error('Erro ao criar tarefa');
    }

    await fetchData();
    showToast('Tarefa criada com sucesso!', 'success');
  };

  // Atualizar tarefa existente
  const handleUpdate = async (formData: {
    title: string;
    description: string;
    status: TaskStatus;
    valueCents: number;
  }) => {
    if (!editingTask) return;

    const res = await fetch(`/api/tasks/${editingTask._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      showToast(errorData.error || 'Erro ao atualizar tarefa.', 'error');
      throw new Error('Erro ao atualizar tarefa');
    }

    await fetchData();
    setEditingTask(null);
    showToast('Tarefa atualizada com sucesso!', 'success');
  };

  // Alteração rápida de status direto pelo card
  const handleQuickStatusChange = async (id: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Falha ao mudar status');
      }

      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? { ...t, status: updated.status } : t)));
      showToast('Status da tarefa atualizado!', 'info');
    } catch {
      showToast('Erro ao atualizar o status.', 'error');
    }
  };

  // Executar tarefa rapidamente pelo botão do card
  const handleQuickExecute = async (task: ITask) => {
    try {
      setExecutingTaskId(task._id);
      const res = await fetch(`/api/tasks/${task._id}/executions`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Falha ao registrar execução');
      }

      await fetchData();
      showToast(`Execução iniciada para "${task.title}". Abra a checagem para concluir.`, 'info');
    } catch {
      showToast('Erro ao registrar execução.', 'error');
    } finally {
      setExecutingTaskId(null);
    }
  };

  // Excluir tarefa e seus anexos/execuções
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      showToast(errorData.error || 'Erro ao excluir a tarefa.', 'error');
      throw new Error('Erro ao excluir tarefa');
    }

    setDeletingTask(null);
    await fetchData();
    showToast('Tarefa e execuções excluídas com sucesso!', 'success');
  };

  // Reset do Progresso (Volta execuções para pending, apaga arquivos, mantém tarefas)
  const handleResetProgress = async () => {
    const res = await fetch('/api/admin/reset-progress', {
      method: 'POST',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || 'Falha ao resetar o progresso.', 'error');
      throw new Error('Erro no reset');
    }

    const data = await res.json();
    await fetchData();
    showToast(
      `Progresso resetado! ${data.preservedTasksCount} tarefas mantidas intactas.`,
      'success'
    );
  };

  // Lista filtrada por status e termo de pesquisa
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        statusFilter === 'all' ? true : task.status === statusFilter;
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [tasks, statusFilter, searchTerm]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========================================================================= */}
        {/* PAINEL VISUAL DE VALOR ACUMULADO EM DESTAQUE E AÇÕES GLOBAIS              */}
        {/* ========================================================================= */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 border border-indigo-900/40 relative overflow-hidden">
            {/* Elemento Decorativo de Fundo */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Bloco 1: Valor Acumulado em Destaque Máximo */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  VALOR ACUMULADO DAS EXECUÇÕES CONCLUÍDAS
                </div>
                <div className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mt-1">
                  {stats ? stats.accumulatedValueBRL : 'R$ 0,00'}
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl">
                  Soma calculada exclusivamente a partir das execuções efetivamente concluídas no MongoDB. Tarefas repetidas acumulam valor a cada nova conclusão.
                </p>
              </div>

              {/* Bloco 2: Ações Globais Principais (Nova Tarefa + Reset) */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Botão Nova Tarefa */}
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Nova Tarefa</span>
                </button>

                {/* Botão Destrutivo Separado: Resetar Progresso */}
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  title="Reinicia execuções e apaga arquivos anexados mantendo as tarefas cadastradas"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Resetar Progresso</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CARDS DE MÉTRICAS E INDICADORES DO BANCO DE DADOS                         */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tarefas Cadastradas
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {stats ? stats.totalTasks : tasks.length}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('pending')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Execuções Pendentes
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">
              {stats ? stats.pendingExecutions : 0}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('in_progress')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'in_progress'
                ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Em Andamento
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">
              {stats ? stats.inProgressExecutions : 0}
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('completed')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Execuções Concluídas
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">
              {stats ? stats.completedExecutions : 0}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BARRA DE FILTROS E PESQUISA                                               */}
        {/* ========================================================================= */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          {/* Campo de Busca */}
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por título ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Abas de Filtro de Status */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({tasks.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendentes ({tasks.filter((t) => t.status === 'pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'in_progress'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Em Andamento ({tasks.filter((t) => t.status === 'in_progress').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Concluídas ({tasks.filter((t) => t.status === 'completed').length})
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ÁREA PRINCIPAL: LISTAGEM DE TAREFAS                                       */}
        {/* ========================================================================= */}
        {isLoading && tasks.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs animate-pulse space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="w-24 h-6 bg-slate-200 rounded-full" />
                  <div className="w-16 h-6 bg-slate-200 rounded-lg" />
                </div>
                <div className="w-3/4 h-5 bg-slate-200 rounded" />
                <div className="space-y-2">
                  <div className="w-full h-3.5 bg-slate-100 rounded" />
                  <div className="w-5/6 h-3.5 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs my-8">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-xs">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            {tasks.length === 0 ? (
              <>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Nenhuma tarefa cadastrada
                </h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  Cadastre tarefas com valores em reais, execute-as repetidas vezes e anexe arquivos com persistência total em Docker.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-100 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Cadastrar Primeira Tarefa</span>
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Não foram encontradas tarefas com os filtros e termo de busca informados.
                </p>
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
                >
                  Limpar Filtros de Busca
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onView={(t) => setViewingTask(t)}
                onEdit={(t) => setEditingTask(t)}
                onDelete={(t) => setDeletingTask(t)}
                onStatusChange={handleQuickStatusChange}
                onExecute={handleQuickExecute}
                onOpenExecutions={(t) => setExecutionTask(t)}
                onOpenAttachments={(t) => setAttachmentsTask(t)}
                isExecuting={executingTaskId === task._id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Rodapé Acadêmico */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          <p>
            Projeto Prático de Engenharia da Computação &bull; Banco de Dados NoSQL &amp; Arquitetura em Containers
          </p>
          <p className="mt-1 font-mono text-slate-400">
            Next.js (App Router) + MongoDB Driver + Docker Compose
          </p>
        </div>
      </footer>

      {/* Modal de Criação de Tarefa */}
      <TaskFormModal
        isOpen={isCreateModalOpen}
        initialData={null}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Modal de Edição de Tarefa */}
      <TaskFormModal
        isOpen={!!editingTask}
        initialData={editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleUpdate}
      />

      {/* Modal de Visualização de Detalhes da Tarefa */}
      <TaskDetailsModal
        isOpen={!!viewingTask}
        task={viewingTask}
        onClose={() => setViewingTask(null)}
        onEdit={(taskToEdit) => {
          setViewingTask(null);
          setEditingTask(taskToEdit);
        }}
        onOpenExecutions={(t) => {
          setViewingTask(null);
          setExecutionTask(t);
        }}
      />

      {/* Modal de Checagem e Execuções da Tarefa */}
      <ExecutionModal
        isOpen={!!executionTask}
        task={executionTask}
        onClose={() => setExecutionTask(null)}
        onExecutionCompleted={fetchData}
        onShowToast={showToast}
      />

      {/* Modal de Gerenciamento de Anexos */}
      <AttachmentsModal
        isOpen={!!attachmentsTask}
        task={attachmentsTask}
        onClose={() => setAttachmentsTask(null)}
        onAttachmentsUpdated={fetchData}
        onShowToast={showToast}
      />

      {/* Modal de Confirmação de Exclusão de Tarefa */}
      <DeleteConfirmModal
        isOpen={!!deletingTask}
        task={deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDelete}
      />

      {/* Modal de Confirmação de Reset de Progresso */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetProgress}
      />

      {/* Feedback Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
