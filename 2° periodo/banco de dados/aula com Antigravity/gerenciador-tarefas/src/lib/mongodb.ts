import { MongoClient, Db } from 'mongodb';

/**
 * Módulo de conexão com o MongoDB utilizando o MongoDB Node.js Driver oficial.
 * Implementa padrão Singleton com cache global para evitar vazamento de conexões
 * durante o recarregamento a quente (Fast Refresh) no desenvolvimento com Next.js.
 */

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'task_manager';

if (!uri) {
  throw new Error(
    'A variável de ambiente MONGODB_URI não foi definida. Verifique seu arquivo .env.'
  );
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // Permite acesso à variável de cache no escopo global do NodeJS
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoIndexesCreated: boolean | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // Em desenvolvimento, reutiliza a promessa de conexão entre compilações
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // Em produção, instancia o cliente de forma isolada e durável
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

/**
 * Cria os índices essenciais para o bom desempenho das coleções do sistema.
 * Executado de forma segura e idempotente uma única vez por ciclo de vida da aplicação.
 */
async function ensureIndexes(db: Db): Promise<void> {
  if (global._mongoIndexesCreated) return;
  try {
    // 1. Coleção tasks
    await db.collection('tasks').createIndex({ createdAt: -1 });

    // 2. Coleção task_executions
    await db.collection('task_executions').createIndex({ taskId: 1, createdAt: -1 });
    await db.collection('task_executions').createIndex({ status: 1 });

    // 3. Coleção task_attachments
    await db.collection('task_attachments').createIndex({ taskId: 1 });
    await db.collection('task_attachments').createIndex({ executionId: 1 });

    global._mongoIndexesCreated = true;
  } catch (error) {
    console.error('[MongoDB] Erro ao assegurar índices nas coleções:', error);
  }
}

/**
 * Retorna a instância do banco de dados configurado para realizar operações nas coleções.
 */
export async function getDatabase(): Promise<Db> {
  const connectedClient = await clientPromise;
  const db = connectedClient.db(dbName);
  await ensureIndexes(db);
  return db;
}

export default clientPromise;
