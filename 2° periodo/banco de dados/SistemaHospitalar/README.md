# 🏥 Sistema Hospitalar - Banco de Dados

## 1. Descrição do domínio

O projeto representa um sistema hospitalar para controlar pacientes, médicos, especialidades, convênios, unidades hospitalares, quartos, leitos, consultas, diagnósticos, receitas, medicamentos, internações e pagamentos.

O banco permite acompanhar o atendimento desde o cadastro do paciente e do médico até a consulta, diagnóstico, prescrição, internação e pagamento.

**SGBD utilizado:** PostgreSQL.

## 2. Modelo lógico

O modelo foi ampliado a partir das entidades originais, preservando **PACIENTE, MEDICO, CONSULTA, DIAGNOSTICO e RECEITA** e adicionando entidades necessárias para representar melhor o domínio.

### Tabelas e principais relacionamentos

- **PACIENTE**: PK `cpf`.
- **MEDICO**: PK `crm`.
- **ESPECIALIDADE**: PK `id_especialidade`.
- **CONVENIO**: PK `id_convenio`.
- **UNIDADE**: PK `id_unidade`.
- **QUARTO**: PK `id_quarto`, FK `id_unidade`.
- **LEITO**: PK `id_leito`, FK `id_quarto`.
- **MEDICAMENTO**: PK `id_medicamento`.
- **CONSULTA**: PK `id_consulta`, FKs `cpf_paciente`, `crm_medico` e `id_convenio`.
- **DIAGNOSTICO**: PK `id_diagnostico`, FK `id_consulta`.
- **RECEITA**: PK `id_receita`, FKs `id_consulta` e `id_medicamento`.
- **INTERNACAO**: PK `id_internacao`, FKs `cpf_paciente`, `id_leito` e `crm_medico_responsavel`.
- **PAGAMENTO**: PK `id_pagamento`, FK `id_consulta`.

### Cardinalidades principais

- PACIENTE 1:N CONSULTA
- MEDICO 1:N CONSULTA
- CONVENIO 1:N CONSULTA
- CONSULTA 1:N DIAGNOSTICO
- CONSULTA 1:N RECEITA
- MEDICAMENTO 1:N RECEITA
- UNIDADE 1:N QUARTO
- QUARTO 1:N LEITO
- PACIENTE 1:N INTERNACAO
- LEITO 1:N INTERNACAO
- MEDICO 1:N INTERNACAO
- CONSULTA 1:1 PAGAMENTO

## 3. Modelo físico e restrições

O arquivo `01_ddl.sql` possui **14 tabelas**, superando o mínimo de 10.

Foram utilizados:

- **PK:** identificação única de cada registro.
- **FK:** integridade referencial entre as entidades.
- **NOT NULL:** campos obrigatórios.
- **UNIQUE:** usuários, nomes de entidades e combinações que não podem se repetir.
- **CHECK:** validação de preços, estoque, percentuais, status, sexo e datas.
- **DEFAULT:** valores automáticos para campos como ativo, status e datas.
- **Colunas geradas:** `imposto` e `total` da consulta são calculados automaticamente a partir do preço.

O arquivo `02_inserts.sql` contém **15 registros em cada uma das 14 tabelas**, totalizando 210 registros.

## 4. Justificativa das escolhas

A separação das entidades evita concentrar informações diferentes em uma única tabela e reduz redundância.

- **Paciente e médico** mantêm dados cadastrais.
- **Consulta** registra o atendimento e relaciona paciente, médico e convênio.
- **Diagnóstico e receita** ficam separados porque uma consulta pode gerar mais de um registro clínico ou prescrição.
- **Medicamento** permite reutilização do cadastro de medicamentos em várias receitas.
- **Unidade, quarto e leito** representam a estrutura física hospitalar.
- **Internação** registra o uso dos leitos e o médico responsável.
- **Pagamento** separa o controle financeiro do atendimento.
- **Índices** foram criados principalmente em FKs e colunas usadas em filtros, JOINs e consultas de agrupamento.

## 5. Índices criados

Arquivo: `03_indices.sql`.

1. `idx_consulta_paciente`: acelera consultas e JOINs por paciente.
2. `idx_consulta_medico_data`: auxilia filtros por médico e ordenação por data.
3. `idx_consulta_status`: auxilia filtros por situação da consulta.
4. `idx_diagnostico_consulta`: acelera busca de diagnósticos por consulta.
5. `idx_receita_consulta`: acelera busca de receitas por consulta.
6. `idx_internacao_paciente_status`: auxilia busca de internações ativas de pacientes.
7. `idx_internacao_leito`: auxilia consultas sobre ocupação de leitos.
8. `idx_pagamento_data_status`: auxilia filtros financeiros por data e situação.
9. `idx_medicamento_principio`: auxilia pesquisas pelo princípio ativo.
10. `idx_quarto_unidade`: acelera a relação entre quartos e unidades.

## 6. Consultas SQL

Arquivo: `04_consultas.sql`.

Foram implementadas **15 consultas**, incluindo:

1. JOIN entre consultas, pacientes e médicos.
2. JOIN entre diagnósticos, consultas, pacientes e médicos.
3. GROUP BY para quantidade de consultas por médico.
4. GROUP BY para faturamento por forma de pagamento.
5. GROUP BY + HAVING para médicos com consultas.
6. Subconsulta para pacientes que possuem consultas.
7. Subconsulta para médicos acima do preço médio.
8. Subconsulta para medicamentos prescritos.
9. GROUP BY para quantidade de receitas por medicamento.
10. GROUP BY para situação dos leitos.
11. JOIN múltiplo para internações.
12. Funções de agregação para valores de consultas.
13. Subconsulta para consultas acima da média.
14. JOIN com filtro para receitas.
15. GROUP BY para status das consultas.

Assim, o requisito de 10 ou mais consultas é atendido, com uso de **JOIN, GROUP BY, HAVING, subconsultas e agregações**.

## 7. Transações

Arquivo: `05_transacoes.sql`.

### Transação 1 - COMMIT

Registra o pagamento da consulta e reduz uma unidade do estoque do medicamento. Ao executar `COMMIT`, as alterações são confirmadas.

### Transação 2 - ROLLBACK

Altera temporariamente o status de uma consulta para `Cancelada`. Em seguida, `ROLLBACK` desfaz a alteração. A consulta final verifica que o valor anterior foi preservado.

O projeto demonstra os comandos `BEGIN`, `COMMIT` e `ROLLBACK`.

## 8. Usuários, GRANT, REVOKE e segurança

Arquivo: `06_permissoes.sql`.

A segurança foi organizada em quatro papéis: 

- **hospital_superuser:** administrador real do PostgreSQL, com `SUPERUSER`, `CREATEDB` e `CREATEROLE`. Deve ser usado somente para administração e não pela aplicação.
- **hospital_manager:** gerente do sistema, sem `SUPERUSER` e sem `CREATEDB`, com permissões para consultar, inserir, alterar e excluir dados.
- **medico_user:** pode acessar, inserir, alterar e excluir os dados do sistema, conforme a regra de negócio definida.
- **paciente_user:** pode visualizar informações do atendimento, enviar exames e realizar pagamentos. Não pode alterar ou excluir dados existentes nem administrar cadastros hospitalares.

O paciente tem `INSERT` somente em `exame` e `pagamento`, além de `SELECT` nas informações necessárias. O médico possui `SELECT, INSERT, UPDATE, DELETE` nas tabelas do sistema.

O arquivo também usa `REVOKE` para retirar permissões de escrita e exclusão do paciente.

### Observação de segurança

O `hospital_superuser` é deliberadamente um superusuário real do PostgreSQL porque o requisito solicita essa categoria. Em um ambiente real, a aplicação nunca deveria usar essa conta. As senhas presentes no arquivo são apenas credenciais de demonstração e devem ser substituídas antes de qualquer uso real.

Arquivo: `06_permissoes.sql`.

Foram definidos dois usuários:

- **medico_user:** possui permissões de leitura e, nas tabelas operacionais, inserção e atualização.
- **paciente_user:** possui permissões de leitura apenas sobre informações permitidas.

Também são utilizados `REVOKE` para retirar permissões de exclusão e impedir operações de escrita do usuário de paciente.

## 9. EXPLAIN (ANALYZE)

Arquivo: `07_explain.sql`.

Foram preparadas três análises com `EXPLAIN (ANALYZE)`.

A análise deve observar:

- `Index Scan` ou `Bitmap Index Scan`, quando o otimizador considerar o índice vantajoso;
- `Seq Scan`, que pode ser escolhido quando a tabela possui poucos registros;
- `actual time`, `rows` e `loops`;
- diferença entre o custo estimado e o tempo real.

Como o projeto possui apenas 15 registros por tabela, é possível que o PostgreSQL prefira `Seq Scan` em algumas consultas. Isso não significa que o índice esteja incorreto. Com volume maior de dados, os índices tendem a se tornar mais relevantes para os filtros e JOINs definidos.

## 10. Organização dos arquivos

```text
01_ddl.sql          -> criação das 14 tabelas e restrições
02_inserts.sql      -> 15 registros por tabela (210 registros)
03_indices.sql      -> índices e justificativas
04_consultas.sql    -> 15 consultas SQL
05_transacoes.sql   -> transações COMMIT e ROLLBACK
06_permissoes.sql   -> usuários, GRANT e REVOKE
07_explain.sql      -> EXPLAIN (ANALYZE)
README.md           -> documentação do projeto
```

## 11. Atendimento aos requisitos

| Requisito | Atendimento |
|---|---|
| Modelo lógico | Sim, documentado no README |
| Modelo físico | Sim |
| 10+ tabelas | **14 tabelas** |
| PK | Sim |
| FK | Sim |
| NOT NULL | Sim |
| UNIQUE | Sim |
| CHECK | Sim |
| DEFAULT | Sim |
| 15 registros por tabela | **Sim, 210 registros** |
| Índices justificados | **10 índices** |
| 10+ consultas | **15 consultas** |
| JOIN | Sim |
| GROUP BY | Sim |
| Subconsultas | Sim |
| 2+ transações | **2 transações** |
| BEGIN | Sim |
| COMMIT | Sim |
| ROLLBACK | Sim |
| 2+ usuários | **2 usuários** |
| GRANT | Sim |
| REVOKE | Sim |
| EXPLAIN (ANALYZE) | **3 análises** |
| README completo | Sim |


### Cadastro de CPF e CRM
O `cpf` do paciente e o `crm` do médico são informados no cadastro. Eles são chaves primárias (`PRIMARY KEY`) e não utilizam `GENERATED AS IDENTITY`. O banco apenas valida o formato e garante a unicidade.

A tabela **EXAME** permite que o paciente envie seus exames, relacionando o arquivo ao próprio CPF e, quando aplicável, à consulta. O paciente também pode registrar pagamentos, enquanto o médico pode acessar e alterar os dados do sistema.


## Comentários nos arquivos SQL
Todos os arquivos SQL possuem comentários explicando a função dos principais comandos utilizados, como CREATE TABLE, INSERT, CREATE INDEX, SELECT, JOIN, GROUP BY, HAVING, subconsultas, START TRANSACTION, COMMIT e ROLLBACK, GRANT, REVOKE e EXPLAIN (ANALYZE).


### Compatibilidade no DBeaver

Os arquivos foram preparados para PostgreSQL. No DBeaver, a conexão deve ser PostgreSQL e o dialeto SQL do editor deve estar configurado como PostgreSQL. `EXPLAIN (ANALYZE)`, `CREATE USER`, `GRANT`, `REVOKE` e transações são comandos suportados pelo PostgreSQL.

No DDL, a validação de CPF/CRM usa `CHECK` com `length()` para evitar o operador de expressão regular `~`, que alguns validadores genéricos do DBeaver não reconhecem. CPF e CRM continuam sendo informados manualmente pelo cadastro.

## Execução das permissões no PostgreSQL

O arquivo `06_permissoes.sql` contém somente GRANT/REVOKE. Antes dele, em uma conexão PostgreSQL administrativa, execute `06_criacao_usuarios_postgresql.sql` para criar os quatro usuários.

O arquivo `07_explain.sql` contém `EXPLAIN ANALYZE`, que é requisito do trabalho e é sintaxe específica do PostgreSQL.

Se o DBeaver sublinhar `CREATE USER` ou `EXPLAIN ANALYZE` como erro antes da execução, configure o SQL dialect da conexão/arquivo para PostgreSQL. Esses comandos não são comandos SQL genéricos e não podem ser tornados simultaneamente compatíveis com todos os bancos sem deixar de cumprir o requisito de PostgreSQL.

---

## 12. Backup lógico automatizado (Sprint final)

O arquivo `08_backup.sh` executa `pg_dump` no formato customizado (`-Fc`), acrescenta data/hora ao nome, grava primeiro em arquivo temporário e só publica o arquivo final após sucesso. Em caso de falha, o script retorna código diferente de zero e remove o arquivo parcial. A limpeza remove arquivos `.dump` do banco configurado com mais de 30 dias (configurável por `RETENTION_DAYS`).

### Configuração e execução

Configure `PGDATABASE`, `PGUSER` e, conforme o ambiente, `PGHOST` e `PGPORT`. Para autenticação automatizada, prefira `~/.pgpass` ou `PGPASSFILE` com permissões `0600`; não coloque senha no script nem no repositório.

```bash
chmod +x 08_backup.sh
export PGDATABASE=hospitalar
export PGUSER=usuario_backup
export BACKUP_DIR="$HOME/backups/hospitalar"
./08_backup.sh
```

### Agendamento diário às 02:00

Edite o crontab com `crontab -e`, copie a linha de `09_cron_backup.txt` e substitua o caminho de exemplo pelo caminho absoluto. Garanta que o ambiente do cron carregue as variáveis necessárias e que o usuário tenha acesso ao diretório e ao banco. O log é redirecionado para `/var/log/backup-hospitalar.log`; ajuste o destino conforme as permissões do ambiente.

### Regra 3-2-1

- **3 cópias:** banco original e pelo menos duas cópias de backup.
- **2 mídias/tipos de armazenamento:** por exemplo, disco local e armazenamento independente (NAS ou mídia de backup).
- **1 cópia externa:** mantenha uma cópia criptografada em outra conta/localidade, com acesso restrito.

O script gera e retém a cópia local; replicação externa, criptografia em repouso, monitoramento e alertas devem ser configurados na infraestrutura. Um backup só é confiável após testes periódicos de restauração.

### Teste de restauração

Consulte [`docs/10_teste_restauracao.md`](docs/10_teste_restauracao.md). Como o dump usa `-Fc`, restaure com `pg_restore` em banco de teste. Compare as contagens de `paciente`, `consulta`, `diagnostico` e `receita` entre origem e restauração e registre as evidências. O documento deixa os resultados pendentes até a execução real; não há alegação de teste executado neste pacote.

## 13. Introdução ao MongoDB

A versão documental é um exercício paralelo e utiliza dados inteiramente fictícios. O script `mongodb/01_modelo_e_dados.js` cria o banco `sistema_hospitalar_nosql`, duas collections relacionadas (`pacientes` e `consultas`) e insere 11 documentos (5 pacientes e 6 consultas). Alguns documentos têm campos opcionais diferentes para demonstrar flexibilidade de esquema.

### Embedding vs. Referencing

- **Embedding:** a consulta contém `medico` e `triagem` embutidos. São dados pequenos, ligados ao evento da consulta e frequentemente lidos junto dele; a triagem também varia por consulta.
- **Referencing:** `consultas.pacienteId` referencia `pacientes._id`. Os dados cadastrais do paciente são reutilizados em várias consultas e podem ser atualizados sem replicar todo o cadastro em cada documento.
- O exemplo é didático. Em produção, avalie atualização de dados clínicos, histórico/auditoria, privacidade, tamanho dos documentos e consistência entre coleções.

### Execução, consultas, índices e explain

Com MongoDB instalado e `mongosh` disponível, execute os scripts na ordem:

```bash
mongosh "mongodb://localhost:27017" mongodb/01_modelo_e_dados.js
mongosh "mongodb://localhost:27017" mongodb/02_consultas_indices_explain.js
```

O segundo script contém consultas com `find`, filtros, `sort` e projeção, cria dois índices (`pacienteId` e o composto `status + data`) e imprime `explain("executionStats")`. Analise `winningPlan`, `IXSCAN`/`COLLSCAN`, `nReturned`, `totalKeysExamined` e `totalDocsExamined`. Com apenas 6 consultas, o otimizador pode preferir `COLLSCAN`; isso é esperado em conjuntos pequenos e não comprova falha do índice.

## 14. PostgreSQL x MongoDB neste domínio

| Necessidade hospitalar | Tecnologia mais adequada | Motivo |
|---|---|---|
| Consultas, pagamentos, convênios e internações com várias relações | PostgreSQL | Chaves estrangeiras, transações ACID e consultas relacionais facilitam integridade entre entidades. |
| Relatórios que cruzam paciente, médico, consulta e pagamento | PostgreSQL | JOINs, agregações e SQL são apropriados para relatórios relacionais. |
| Dados de triagem opcionais e variáveis, metadados de anexos ou protótipos de formulários clínicos | MongoDB pode ser vantajoso | Documentos BSON aceitam campos variáveis e subdocumentos embutidos sem exigir que todos os registros tenham o mesmo formato. |
| Eventos de consulta lidos junto de pequenos dados contextuais | MongoDB pode ser vantajoso | Embedding pode reduzir leituras adicionais quando os dados são acessados juntos. |

A escolha não é absoluta: dados clínicos exigem controles rigorosos de privacidade, auditoria, autorização, retenção e consistência em qualquer tecnologia. MongoDB também oferece transações, e PostgreSQL também suporta dados semiestruturados via JSONB; a decisão depende dos padrões de acesso e das garantias exigidas.

## 15. Estrutura final

```text
01_ddl.sql
02_inserts.sql
03_indices.sql
04_consultas.sql
05_transacoes.sql
06_criacao_usuarios_postgresql.sql
06_permissoes.sql
07_explain.sql
07_explain_postgresql.sql
08_backup.sh
09_cron_backup.txt
README.md
diagrama inicial.png
docs/10_teste_restauracao.md
mongodb/01_modelo_e_dados.js
mongodb/02_consultas_indices_explain.js
```

> **Antes de publicar:** revise os arquivos e remova qualquer dado pessoal real. O script de criação de usuários não contém senhas fixas; após executá-lo com `psql`, defina as senhas interativamente usando `\password`. Nunca use credenciais de demonstração em produção. O pacote não cria nem publica automaticamente um repositório GitHub; faça o push para um repositório público ou configure acesso de leitura.
