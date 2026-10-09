-- 06_criacao_usuarios_postgresql.sql
-- EXECUTAR SOMENTE EM POSTGRESQL, conectado como administrador.
-- Este arquivo cria os usuários exigidos pelo projeto.

DROP ROLE IF EXISTS paciente_user;
DROP ROLE IF EXISTS medico_user;
DROP ROLE IF EXISTS hospital_manager;
DROP ROLE IF EXISTS hospital_superuser;

CREATE USER hospital_superuser;
ALTER USER hospital_superuser WITH SUPERUSER CREATEDB CREATEROLE INHERIT;

CREATE USER hospital_manager;
ALTER USER hospital_manager WITH NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT;

CREATE USER medico_user;
ALTER USER medico_user WITH NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT;

CREATE USER paciente_user;
ALTER USER paciente_user WITH NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT;

-- Defina as senhas de forma interativa após executar este arquivo no psql:
-- \password hospital_superuser
-- \password hospital_manager
-- \password medico_user
-- \password paciente_user
-- Não armazene senhas reais em arquivos versionados.
