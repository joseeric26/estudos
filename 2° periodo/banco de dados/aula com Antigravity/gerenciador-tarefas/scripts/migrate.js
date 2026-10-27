/**
 * Script de migração compatível para MongoDB.
 * Atualiza documentos legados da coleção 'tasks' que não possuam o campo 'valueCents',
 * atribuindo o valor padrão 0 (zero centavos) sem apagar ou corromper dados preexistentes.
 * Também cria os índices necessários para as novas coleções 'task_executions' e 'task_attachments'.
 *
 * Execução no Windows:
 * node scripts/migrate.js
 */

const { MongoClient } = require('mongodb');

// URI de conexão compatível com execução dentro do container ou localmente no Windows
const uri =
  process.env.MONGODB_URI ||
  'mongodb://admin:adminpassword123@localhost:27017/task_manager?authSource=admin';
const dbName = process.env.MONGODB_DB || 'task_manager';

async function runMigration() {
  console.log('----------------------------------------------------');
  console.log('🚀 Iniciando Migração do Banco de Dados MongoDB...');
  console.log(`Conectando em: ${uri.replace(/\/\/.*@/, '//***:***@')}`);
  console.log('----------------------------------------------------');

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    console.log(`✅ Conexão estabelecida com o banco: "${dbName}"`);

    // 1. Migração de Tarefas sem 'valueCents'
    const queryLegacy = {
      $or: [
        { valueCents: { $exists: false } },
        { valueCents: null },
      ],
    };

    const countLegacy = await db.collection('tasks').countDocuments(queryLegacy);
    console.log(`🔍 Tarefas legadas sem 'valueCents' encontradas: ${countLegacy}`);

    if (countLegacy > 0) {
      const updateResult = await db.collection('tasks').updateMany(queryLegacy, {
        $set: {
          valueCents: 0,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ ${updateResult.modifiedCount} tarefas foram migradas com 'valueCents: 0'.`);
    } else {
      console.log('ℹ️ Todas as tarefas já possuem o campo monetário definido.');
    }

    // 2. Criação de índices otimizados para as coleções
    console.log('🔨 Assegurando índices nas coleções...');

    await db.collection('tasks').createIndex({ createdAt: -1 });
    console.log('  ✔ Índice em tasks(createdAt: -1)');

    await db.collection('task_executions').createIndex({ taskId: 1, createdAt: -1 });
    await db.collection('task_executions').createIndex({ status: 1 });
    console.log('  ✔ Índices em task_executions(taskId, createdAt, status)');

    await db.collection('task_attachments').createIndex({ taskId: 1 });
    await db.collection('task_attachments').createIndex({ executionId: 1 });
    console.log('  ✔ Índices em task_attachments(taskId, executionId)');

    // 3. Resumo final
    const totalTasks = await db.collection('tasks').countDocuments();
    const totalExecutions = await db.collection('task_executions').countDocuments();
    const totalAttachments = await db.collection('task_attachments').countDocuments();

    console.log('----------------------------------------------------');
    console.log('🎉 Migração concluída com sucesso!');
    console.log(`📊 Total de Tarefas cadastradas: ${totalTasks}`);
    console.log(`📊 Total de Execuções registradas: ${totalExecutions}`);
    console.log(`📊 Total de Anexos no banco: ${totalAttachments}`);
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('❌ Erro durante a execução da migração:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runMigration();
