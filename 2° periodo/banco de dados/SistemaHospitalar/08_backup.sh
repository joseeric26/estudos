#!/usr/bin/env bash
# Backup lógico PostgreSQL em formato customizado, com retenção de 30 dias.
# Configure PGHOST, PGPORT, PGDATABASE, PGUSER e PGPASSFILE no ambiente.
set -Eeuo pipefail
umask 077

: "${PGDATABASE:?Defina PGDATABASE com o nome do banco}"
: "${PGUSER:?Defina PGUSER com o usuário de backup}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date +'%Y%m%d_%H%M%S')"
FILE="${BACKUP_DIR}/${PGDATABASE}_${STAMP}.dump"
TMP_FILE="${FILE}.partial"

mkdir -p "$BACKUP_DIR"
cleanup() { rm -f "$TMP_FILE"; }
trap cleanup EXIT

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERRO: pg_dump não encontrado. Instale os clientes PostgreSQL." >&2
  exit 127
fi

echo "[$(date -Is)] Iniciando backup de ${PGDATABASE}..."
if pg_dump --format=custom --no-owner --no-acl --file="$TMP_FILE"; then
  mv "$TMP_FILE" "$FILE"
  echo "[$(date -Is)] Backup concluído: $FILE"
else
  echo "ERRO: pg_dump falhou; backup incompleto descartado." >&2
  exit 1
fi

# Remove apenas arquivos .dump deste banco com mais de RETENTION_DAYS dias.
find "$BACKUP_DIR" -maxdepth 1 -type f -name "${PGDATABASE}_*.dump" \
  -mtime "+${RETENTION_DAYS}" -print -delete
