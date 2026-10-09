# Teste de restauração PostgreSQL

> Execute em ambiente de teste. O processo abaixo cria um banco separado e não deve apontar para produção.

## 1. Pré-requisitos

- Cliente PostgreSQL instalado (`createdb`, `pg_restore`, `psql`).
- Um arquivo `.dump` criado por `08_backup.sh`.
- Permissão para criar banco de teste.

## 2. Restaurar o backup

```bash
createdb hospitalar_restore_teste
pg_restore --verbose --no-owner --no-acl \
  --dbname=hospitalar_restore_teste \
  ./backups/NOME_DO_ARQUIVO.dump
```

Se o banco de teste já existir, use outro nome ou remova-o somente após confirmar que não contém dados necessários. Para um dump customizado `-Fc`, use `pg_restore`; `psql` é destinado a dumps em SQL texto.

## 3. Validar integridade

Compare as contagens do banco de origem e do banco restaurado, no mesmo instante lógico. Exemplo para a tabela `paciente`:

```bash
psql -d hospitalar_restore_teste -c 'SELECT COUNT(*) AS pacientes FROM paciente;'
psql -d hospitalar_restore_teste -c 'SELECT COUNT(*) AS consultas FROM consulta;'
psql -d hospitalar_restore_teste -c 'SELECT COUNT(*) AS diagnosticos FROM diagnostico;'
psql -d hospitalar_restore_teste -c 'SELECT COUNT(*) AS receitas FROM receita;'
```

Execute as mesmas consultas na origem e registre os resultados abaixo. O teste só está comprovado quando os números forem comparados e coincidirem; não invente resultados sem executar o ambiente.

| Verificação | Origem | Restaurado | Resultado |
|---|---:|---:|---|
| `paciente` | preencher | preencher | pendente |
| `consulta` | preencher | preencher | pendente |
| `diagnostico` | preencher | preencher | pendente |
| `receita` | preencher | preencher | pendente |

Também confira erros no log do `pg_restore` e, se necessário, valide chaves estrangeiras executando as consultas do projeto. Guarde data, nome do dump, versão do PostgreSQL e evidências da execução.
