# Gerenciador de Tarefas — Next.js, MongoDB e Docker

Sistema completo de gerenciamento de tarefas (CRUD) desenvolvido como projeto acadêmico de **Engenharia da Computação** para a disciplina de **Banco de Dados**. O projeto implementa persistência de dados em banco NoSQL (**MongoDB**), interface moderna e responsiva (**Next.js com App Router e Tailwind CSS**) e orquestração de microsserviços conteinerizados (**Docker & Docker Compose**).

---

## 1. Tecnologias Utilizadas

- **Framework Web:** [Next.js](https://nextjs.org/) (versão 14 com App Router e Server/Client Components)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (tipagem estática em toda a aplicação)
- **Banco de Dados NoSQL:** [MongoDB](https://www.mongodb.com/) (versão 7.0 oficial)
- **Driver de Conexão:** [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/) nativo (sem ORM/ODM, conexão direta via pool singleton)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Conteinerização:** [Docker](https://www.docker.com/) com multi-stage build e imagem standalone
- **Orquestração:** [Docker Compose](https://docs.docker.com/compose/) com healthcheck, redes isoladas e volumes nomeados

---

## 2. Pré-requisitos para Execução no Windows

Para executar o projeto, você precisa apenas de:

1. **Docker Desktop para Windows** (com suporte a WSL2 ou Hyper-V ativado e em execução).
2. **Navegador Web** (Google Chrome, Edge, Firefox ou similar).
3. *(Opcional)* **Node.js** (v18 ou superior) caso queira executar comandos fora do Docker.
4. *(Opcional)* **Visual Studio Code** para navegação e edição do código.

---

## 3. Estrutura de Diretórios

```text
gerenciador-tarefas/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── tasks/
│   │   │       ├── route.ts          # Endpoints: GET (listar) e POST (criar)
│   │   │       └── [id]/
│   │   │           └── route.ts      # Endpoints: GET (detalhes), PUT (editar) e DELETE (excluir)
│   │   ├── layout.tsx                # Layout principal e metadados HTML
│   │   ├── page.tsx                  # Interface do painel de tarefas e integração CRUD
│   │   └── globals.css               # Estilos globais e diretivas Tailwind
│   ├── components/
│   │   ├── Navbar.tsx                # Barra superior de navegação e indicadores
│   │   ├── StatusBadge.tsx           # Badge visual com cor para o status da tarefa
│   │   ├── TaskCard.tsx              # Card individual com resumo e ações rápidas
│   │   ├── TaskFormModal.tsx         # Modal de formulário para criar e editar tarefas
│   │   ├── TaskDetailsModal.tsx      # Modal de visualização completa dos dados e metadados
│   │   ├── DeleteConfirmModal.tsx    # Diálogo de confirmação segura antes de excluir
│   │   └── Toast.tsx                 # Notificação flutuante de sucesso/erro
│   ├── lib/
│   │   └── mongodb.ts                # Módulo singleton de conexão segura com o MongoDB
│   └── types/
│       └── task.ts                   # Interfaces TypeScript, DTOs e constantes de status
├── public/
│   └── robots.txt                    # Arquivos estáticos servidos pelo Next.js
├── Dockerfile                        # Multi-stage build otimizado para produção
├── compose.yaml                      # Definição dos serviços (App + MongoDB), volumes e rede
├── .env.example                      # Modelo documentado de variáveis de ambiente
├── .env                              # Variáveis de ambiente locais (não versionadas)
├── .gitignore                        # Regras de exclusão do controle de versão Git
├── package.json                      # Manifesto de dependências e scripts npm
├── tsconfig.json                     # Configurações do compilador TypeScript
├── next.config.mjs                   # Configuração com saída 'standalone'
├── tailwind.config.ts                # Configurações de tema e escopo do Tailwind
├── postcss.config.mjs                # Processamento de CSS
└── README.md                         # Documentação completa do projeto
```

---

## 4. Configuração das Variáveis de Ambiente

O projeto utiliza variáveis de ambiente para garantir que nenhuma credencial ou URI de banco fique exposta no código-fonte.

Copie o arquivo `.env.example` para `.env`:

```powershell
Copy-Item .env.example .env
```

Conteúdo padrão do arquivo `.env`:

```env
# Credenciais do Administrador no MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=adminpassword123

# Nome do Banco de Dados da aplicação
MONGODB_DB=task_manager

# URI de Conexão utilizada pelo container da aplicação Next.js
MONGODB_URI=mongodb://admin:adminpassword123@mongodb:27017/task_manager?authSource=admin
```

> **Atenção:** Dentro da rede interna do Docker Compose, o endereço de host é `mongodb` (o nome do serviço), e não `localhost`. O `localhost:27017` é utilizado apenas caso você acesse o banco a partir do Windows (como no MongoDB Compass).

---

## 5. Como Executar no Windows (Passo a Passo)

### Passo 1: Abrir o terminal na pasta do projeto

Abra o **PowerShell** ou o **Terminal do Windows** e navegue até a pasta:

```powershell
cd "c:\Users\Josee\OneDrive\Desktop\estudo\estudos\2° periodo\banco de dados\aula com Antigravity\gerenciador-tarefas"
```

### Passo 2: Iniciar os containers

Execute o comando para construir as imagens e subir os serviços:

```powershell
docker compose up --build
```

- Na primeira vez, o Docker baixará a imagem do MongoDB e construirá o container do Next.js.
- O terminal mostrará os logs de inicialização. Quando aparecer algo como:
  ```text
  task_manager_mongodb | [initandlisten] Waiting for connections on port 27017
  task_manager_app     | Listening on port 3000
  ```
  o sistema estará 100% operacional!

*(Dica: Se quiser liberar o terminal para outros comandos, execute `docker compose up --build -d` para rodar em segundo plano).*

---

## 6. Acesso à Aplicação

Abra o navegador de sua preferência e acesse:

👉 **[http://localhost:3000](http://localhost:3000)**

---

## 7. Documentação da API REST

Todas as rotas da API retornam respostas no formato **JSON** e adotam os códigos de status HTTP semânticos.

| Método | Endpoint | Descrição | Status de Sucesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | Lista todas as tarefas em ordem decrescente de criação | `200 OK` |
| `GET` | `/api/tasks/[id]` | Busca uma tarefa específica pelo seu `ObjectId` | `200 OK` |
| `POST` | `/api/tasks` | Cadastra uma nova tarefa validando título e descrição | `201 Created` |
| `PUT` | `/api/tasks/[id]` | Atualiza os campos de uma tarefa existente | `200 OK` |
| `DELETE` | `/api/tasks/[id]` | Exclui permanentemente uma tarefa do MongoDB | `200 OK` |

### Exemplos de Requisições:

#### 1. Criar tarefa (`POST /api/tasks`)
```json
// Envio:
{
  "title": "Estudar modelagem relacional e NoSQL",
  "description": "Comparar as diferenças entre esquemas relacionais do PostgreSQL e coleções BSON do MongoDB.",
  "status": "pending"
}

// Resposta (201 Created):
{
  "_id": "671df42b947c94d2ab3450a1",
  "title": "Estudar modelagem relacional e NoSQL",
  "description": "Comparar as diferenças entre esquemas relacionais do PostgreSQL e coleções BSON do MongoDB.",
  "status": "pending",
  "createdAt": "2026-10-26T13:15:00.000Z",
  "updatedAt": "2026-10-26T13:15:00.000Z"
}
```

#### 2. Atualizar tarefa (`PUT /api/tasks/[id]`)
```json
// Envio:
{
  "status": "in_progress"
}

// Resposta (200 OK):
{
  "_id": "671df42b947c94d2ab3450a1",
  "title": "Estudar modelagem relacional e NoSQL",
  "description": "Comparar as diferenças entre esquemas relacionais do PostgreSQL e coleções BSON do MongoDB.",
  "status": "in_progress",
  "createdAt": "2026-10-26T13:15:00.000Z",
  "updatedAt": "2026-10-26T13:20:00.000Z"
}
```

---

## 8. Verificação do MongoDB e Consulta aos Dados

Você pode interagir diretamente com o banco de dados dentro do container usando o utilitário oficial `mongosh`:

```powershell
docker exec -it task_manager_mongodb mongosh -u admin -p adminpassword123 --authenticationDatabase admin
```

Dentro do shell do MongoDB, execute:

```javascript
// 1. Alternar para o banco de dados da aplicação
use task_manager;

// 2. Listar as coleções
show collections;

// 3. Consultar todos os documentos cadastrados
db.tasks.find().pretty();

// 4. Contar quantas tarefas existem
db.tasks.countDocuments();

// 5. Sair do shell
exit
```

---

## 9. Teste de Persistência dos Dados

Para comprovar que os dados estão salvos de forma durável no volume Docker:

1. Acesse `http://localhost:3000` e crie 2 ou 3 tarefas.
2. No terminal do PowerShell, pare os containers com:
   ```powershell
   docker compose down
   ```
3. Suba os containers novamente:
   ```powershell
   docker compose up -d
   ```
4. Atualize a página no navegador (`F5`).
5. **Resultado esperado:** Todas as tarefas cadastradas continuam intactas, comprovando que o volume nomeado `mongodb_data` persistiu os dados entre reinicializações.

> ⚠️ **Importante:**
> - `docker compose down`: Para e remove os containers e as redes, mas **mantém intactos os volumes e os dados persistidos**.
> - `docker compose down -v`: O modificador `-v` (volumes) **remove os volumes nomeados e apaga definitivamente os dados do banco**. Utilize somente quando desejar resetar o banco do zero.

---

## 10. Resolução de Problemas Comuns

| Sintoma | Causa Provável | Solução |
| :--- | :--- | :--- |
| `docker: command not found` | Docker Desktop não instalado ou não adicionado ao PATH | Abra o Docker Desktop e aguarde a mensagem "Engine running". Feche e reabra o terminal. |
| `Ports are not available: 0.0.0.0:3000` | Outro processo está usando a porta 3000 | Descubra o PID com `netstat -ano \| findstr :3000` e finalize-o no Gerenciador de Tarefas, ou altere a porta no `compose.yaml`. |
| `Authentication failed` no MongoDB | Senhas divergentes entre o `.env` e o volume existente | Se você alterou a senha no `.env` após o volume já ter sido inicializado, o MongoDB mantém a senha antiga. Para resetar: `docker compose down -v` e depois `docker compose up --build`. |
| Erro de conexão entre Next.js e MongoDB | Uso de `localhost` na variável `MONGODB_URI` dentro do container | No `.env`, certifique-se de que a URI usa `mongodb` como host: `mongodb://admin:adminpassword123@mongodb:27017/...`. |
| Arquivos não encontrados no build | Nome de arquivo com extensão oculta (ex: `compose.yaml.txt`) | No Windows Explorer, marque a opção "Extensões de nomes de arquivos" para verificar se a extensão está correta. |

---

## 11. Licença

Este projeto é de uso acadêmico livre sob a licença MIT. Desenvolvido para estudos em Banco de Dados e Engenharia de Software.
