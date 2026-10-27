/**
 * Suíte de Testes Automatizados dos Cenários Obrigatórios (A, B, C, D, E).
 * Executa requisições HTTP contra a API do sistema na porta 3000.
 *
 * Execução:
 * node scripts/test-scenarios.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✔ ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  }
  return { status: res.status, headers: res.headers, data, res };
}

async function runAllTests() {
  console.log('======================================================================');
  console.log(`🧪 INICIANDO TESTES AUTOMATIZADOS DO GERENCIADOR DE TAREFAS`);
  console.log(`Alvo: ${BASE_URL}`);
  console.log('======================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // TESTE A: Valor da Tarefa
    // -------------------------------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('📋 TESTE A: Valor da Tarefa');
    console.log('----------------------------------------------------');

    // 1. Cadastrar uma tarefa com valor de R$ 50,00 (5000 centavos)
    const createTaskRes = await request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Tarefa Teste A - Manutenção',
        description: 'Verificação periódica de infraestrutura com valor monetário de R$ 50,00.',
        status: 'pending',
        valueCents: 5000,
      }),
    });

    assert(createTaskRes.status === 201, 'Status 201 Created ao cadastrar tarefa com valor');
    const taskA = createTaskRes.data;
    assert(taskA._id, 'Tarefa retornada possui identificador válido');
    assert(taskA.valueCents === 5000, 'Valor em centavos é exatamente 5000');
    assert(taskA.valueBRL.includes('50,00'), 'Valor formatado em BRL contém "50,00"');

    // 2. Confirmar que o total acumulado permanece em R$ 0,00 (pois não há conclusões)
    const statsRes1 = await request('/api/stats');
    assert(statsRes1.status === 200, 'Status 200 OK ao consultar métricas');
    assert(
      statsRes1.data.accumulatedValueBRL.includes('0,00'),
      'Total acumulado permanece em R$ 0,00 enquanto não houver execuções concluídas'
    );
    console.log('✅ TESTE A APROVADO COM SUCESSO!\n');

    // -------------------------------------------------------------------------
    // TESTE B: Repetição e Execuções Múltiplas
    // -------------------------------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('📋 TESTE B: Repetição de Execuções e Acúmulo de Valor');
    console.log('----------------------------------------------------');

    // 1. Executar a tarefa de R$ 50,00 pela 1ª vez
    const exec1Res = await request(`/api/tasks/${taskA._id}/executions`, {
      method: 'POST',
    });
    assert(exec1Res.status === 201, '1ª execução registrada com status 201');
    const exec1 = exec1Res.data;
    assert(exec1.status === 'pending', '1ª execução inicia como pending');
    assert(exec1.valueCents === 5000, 'Snapshot de valor da 1ª execução é 5000 centavos');

    // 2. Concluir a primeira execução
    const complete1Res = await request(`/api/executions/${exec1._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert(complete1Res.status === 200, '1ª execução concluída com sucesso (status 200)');
    assert(complete1Res.data.status === 'completed', 'Status da 1ª execução agora é "completed"');

    // 3. Confirmar o total acumulado de R$ 50,00
    const statsRes2 = await request('/api/stats');
    assert(
      statsRes2.data.accumulatedValueCents >= 5000,
      `Total acumulado computou os R$ 50,00 da 1ª execução (Atual: ${statsRes2.data.accumulatedValueBRL})`
    );

    // 4. Executar a mesma tarefa novamente (2ª vez)
    const exec2Res = await request(`/api/tasks/${taskA._id}/executions`, {
      method: 'POST',
    });
    assert(exec2Res.status === 201, '2ª execução registrada para a mesma tarefa');
    const exec2 = exec2Res.data;
    assert(exec2._id !== exec1._id, 'A 2ª execução possui ID distinto da 1ª execução');

    // 5. Concluir a 2ª execução
    const complete2Res = await request(`/api/executions/${exec2._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert(complete2Res.status === 200, '2ª execução concluída com sucesso');

    // 6. Confirmar total acumulado após 2 execuções
    const statsRes3 = await request('/api/stats');
    assert(
      statsRes3.data.accumulatedValueCents >= 10000,
      `Total acumulado computou as duas execuções da tarefa (Atual: ${statsRes3.data.accumulatedValueBRL})`
    );

    // 7. Confirmar 1 tarefa original e histórico com 2 execuções distintas
    const listExecsRes = await request(`/api/tasks/${taskA._id}/executions`);
    assert(listExecsRes.status === 200, 'Listagem de execuções da tarefa retornou 200');
    assert(listExecsRes.data.length >= 2, 'Histórico contém pelo menos 2 execuções para a mesma tarefa');
    console.log('✅ TESTE B APROVADO COM SUCESSO!\n');

    // -------------------------------------------------------------------------
    // TESTE C: Upload de Arquivos (Tarefa e Execução)
    // -------------------------------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('📋 TESTE C: Anexos de Arquivos de Qualquer Tipo');
    console.log('----------------------------------------------------');

    // 1. Anexar arquivos de diferentes tipos à tarefa (txt e json)
    const formDataTask = new FormData();
    const file1 = new Blob(['Conteudo do relatorio em texto puro.'], { type: 'text/plain' });
    formDataTask.append('files', file1, 'relatorio_tecnico.txt');

    const file2 = new Blob(['{"metadados": true, "versao": 1}'], { type: 'application/json' });
    formDataTask.append('files', file2, 'dados_config.json');

    const uploadTaskRes = await fetch(`${BASE_URL}/api/tasks/${taskA._id}/attachments`, {
      method: 'POST',
      body: formDataTask,
    });
    assert(uploadTaskRes.status === 201, 'Upload de múltiplos arquivos para a tarefa retornou 201');
    const taskAtts = await uploadTaskRes.json();
    assert(taskAtts.length === 2, 'Dois anexos foram persistidos para a tarefa');

    // 2. Anexar arquivo a uma execução específica
    const formDataExec = new FormData();
    const fileExec = new Blob(['Comprovante de conclusao da execucao.'], { type: 'text/plain' });
    formDataExec.append('files', fileExec, 'comprovante_execucao_1.pdf');

    const uploadExecRes = await fetch(`${BASE_URL}/api/executions/${exec1._id}/attachments`, {
      method: 'POST',
      body: formDataExec,
    });
    assert(uploadExecRes.status === 201, 'Upload para execução específica retornou 201');
    const execAtts = await uploadExecRes.json();
    assert(execAtts.length === 1, 'Anexo da execução persistido com sucesso');

    // 3. Confirmar abertura e download dos arquivos
    const downloadRes = await fetch(`${BASE_URL}/api/attachments/${taskAtts[0]._id}?download=1`);
    assert(downloadRes.status === 200, 'Download do anexo retornou 200 OK');
    const disposition = downloadRes.headers.get('content-disposition') || '';
    assert(disposition.includes('attachment'), 'Cabeçalho Content-Disposition contém "attachment"');

    // 4. Excluir um anexo individualmente
    const deleteAttRes = await request(`/api/attachments/${taskAtts[1]._id}`, {
      method: 'DELETE',
    });
    assert(deleteAttRes.status === 200, 'Exclusão individual de anexo retornou 200');

    // 5. Confirmar que o outro anexo continua disponível
    const checkRemainingRes = await fetch(`${BASE_URL}/api/attachments/${taskAtts[0]._id}`);
    assert(checkRemainingRes.status === 200, 'Arquivo remanescente continua disponível para acesso');
    console.log('✅ TESTE C APROVADO COM SUCESSO!\n');

    // -------------------------------------------------------------------------
    // TESTE D: Checagem da Tarefa e Idempotência
    // -------------------------------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('📋 TESTE D: Checagem da Tarefa e Prevenção de Duplicidade');
    console.log('----------------------------------------------------');

    // 1. Criar uma nova execução pendente
    const exec3Res = await request(`/api/tasks/${taskA._id}/executions`, {
      method: 'POST',
    });
    const exec3 = exec3Res.data;

    // 2. Consultar detalhes da execução para checagem
    const checkDetailsRes = await request(`/api/executions/${exec3._id}`);
    assert(checkDetailsRes.status === 200, 'Consulta de detalhes para checagem retornou 200');
    assert(checkDetailsRes.data.execution.status === 'pending', 'Status atual da checagem é "pending"');
    assert(checkDetailsRes.data.task._id === taskA._id, 'Tarefa vinculada corresponde à original');

    // 3. Confirmar a conclusão explicitamente
    const statsBeforeD = (await request('/api/stats')).data.accumulatedValueCents;
    const complete3Res = await request(`/api/executions/${exec3._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert(complete3Res.status === 200, 'Conclusão após checagem confirmada com 200');

    const statsAfterD = (await request('/api/stats')).data.accumulatedValueCents;
    assert(
      statsAfterD === statsBeforeD + 5000,
      'Valor da execução foi adicionado ao acumulado exatamente 1 vez'
    );

    // 4. Tentar concluir novamente a mesma execução (deve ser rejeitada ou idempotente)
    const duplicateRes = await request(`/api/executions/${exec3._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert(
      duplicateRes.status === 409 || duplicateRes.status === 400,
      `Tentativa duplicada impedida com status de conflito (${duplicateRes.status})`
    );

    const statsAfterDuplicate = (await request('/api/stats')).data.accumulatedValueCents;
    assert(
      statsAfterDuplicate === statsAfterD,
      'Total acumulado NÃO foi duplicado em caso de requisição repetida'
    );
    console.log('✅ TESTE D APROVADO COM SUCESSO!\n');

    // -------------------------------------------------------------------------
    // TESTE E: Reset de Progresso
    // -------------------------------------------------------------------------
    console.log('----------------------------------------------------');
    console.log('📋 TESTE E: Reset de Progresso com Preservação de Tarefas');
    console.log('----------------------------------------------------');

    // 1. Cadastrar uma 2ª tarefa para garantir pluralidade
    const taskBRes = await request('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Tarefa Teste E - Preservada',
        description: 'Esta tarefa original NÃO pode ser apagada no reset.',
        status: 'pending',
        valueCents: 8000,
      }),
    });
    const taskB = taskBRes.data;

    // Criar e concluir execução da tarefa B
    const execBRes = await request(`/api/tasks/${taskB._id}/executions`, { method: 'POST' });
    await request(`/api/executions/${execBRes.data._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });

    const statsPreReset = (await request('/api/stats')).data;
    assert(statsPreReset.accumulatedValueCents > 0, 'Valor acumulado pré-reset é maior que zero');

    // 2. Acionar o Reset de Progresso
    const resetRes = await request('/api/admin/reset-progress', {
      method: 'POST',
    });
    assert(resetRes.status === 200, 'Reset de progresso concluído com status 200');
    assert(resetRes.data.success === true, 'Resposta confirma success: true');

    // 3. Confirmar que o total acumulado voltou para R$ 0,00
    const statsPostReset = (await request('/api/stats')).data;
    assert(
      statsPostReset.accumulatedValueCents === 0,
      `Total acumulado voltou para R$ 0,00 (Atual: ${statsPostReset.accumulatedValueBRL})`
    );
    assert(
      statsPostReset.completedExecutions === 0,
      'Quantidade de execuções concluídas voltou para zero'
    );

    // 4. Confirmar que todas as tarefas originais continuam cadastradas
    const allTasksRes = await request('/api/tasks');
    const existingIds = allTasksRes.data.map((t) => t._id);
    assert(existingIds.includes(taskA._id), 'Tarefa A original foi PRESERVADA no banco de dados');
    assert(existingIds.includes(taskB._id), 'Tarefa B original foi PRESERVADA no banco de dados');

    // 5. Confirmar que todas as execuções existentes voltaram para pending
    const execsPostReset = await request(`/api/tasks/${taskA._id}/executions`);
    const allPending = execsPostReset.data.every((e) => e.status === 'pending');
    assert(allPending, 'Todas as execuções da tarefa A retornaram ao status "pending"');

    // 6. Confirmar que os anexos foram removidos
    const attsPostReset = await request(`/api/tasks/${taskA._id}/attachments`);
    assert(attsPostReset.data.length === 0, 'Anexos físicos e metadados foram limpos');

    // 7. Executar novamente uma das tarefas para confirmar ciclo contínuo
    const newCycleExecRes = await request(`/api/tasks/${taskA._id}/executions`, { method: 'POST' });
    assert(newCycleExecRes.status === 201, 'Novo ciclo de execução iniciado com sucesso após o reset');

    console.log('✅ TESTE E APROVADO COM SUCESSO!\n');

    console.log('======================================================================');
    console.log('🎉 TODOS OS TESTES (A, B, C, D, E) FORAM EXECUTADOS E APROVADOS!');
    console.log('======================================================================\n');
  } catch (error) {
    console.error('\n❌ ERRO NA SUÍTE DE TESTES:', error.message);
    process.exit(1);
  }
}

runAllTests();
