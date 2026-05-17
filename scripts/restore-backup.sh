#!/bin/bash
# scripts/restore-backup.sh
# Restaura la base de datos desde un archivo .sql.gz

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

CONTAINER_NAME="egresados_db"
DB_NAME="egresados_db"
DB_USER="postgres"

# ── Verificar argumento ───────────────────────────────────────────────────────
if [ -z "${1:-}" ]; then
  echo ""
  echo "Uso: bash scripts/restore-backup.sh <archivo.sql.gz>"
  echo ""
  echo "Ejemplos:"
  echo "  bash scripts/restore-backup.sh backups/backup_20240115_020000.sql.gz"
  echo "  bash scripts/restore-backup.sh /ruta/absoluta/backup.sql.gz"
  echo ""
  exit 1
fi

BACKUP_FILE="$1"

# ── Verificar que el archivo existe ──────────────────────────────────────────
if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ ERROR: No se encontró el archivo: $BACKUP_FILE"
  exit 1
fi

echo ""
echo "========================================"
echo "  Restaurar backup de la BD"
echo "  Archivo: $BACKUP_FILE"
echo "  Tamaño:  $(du -sh "$BACKUP_FILE" | cut -f1)"
echo "  Fecha:   $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# ── Confirmación del usuario ──────────────────────────────────────────────────
echo "⚠️  ADVERTENCIA: Esta operación BORRARÁ todos los datos actuales"
echo "   de la base de datos '$DB_NAME' y los reemplazará con el backup."
echo ""
read -p "¿Confirmas que deseas continuar? (escribe 'SI' para confirmar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
  echo "Operación cancelada."
  exit 0
fi

echo ""

# ── Verificar que el contenedor está corriendo ────────────────────────────────
echo "[1/4] Verificando contenedor de la base de datos..."
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
  echo "❌ ERROR: El contenedor '$CONTAINER_NAME' no está corriendo."
  echo "   Inicia los servicios con: docker-compose up -d db"
  exit 1
fi
echo "      ✅ Contenedor activo."
echo ""

# ── Hacer backup previo por seguridad ────────────────────────────────────────
echo "[2/4] Creando backup de seguridad antes de restaurar..."
SAFETY_BACKUP="backups/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
mkdir -p backups
docker exec "$CONTAINER_NAME" \
  pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$SAFETY_BACKUP"
echo "      ✅ Backup de seguridad guardado en: $SAFETY_BACKUP"
echo ""

# ── Restaurar ────────────────────────────────────────────────────────────────
echo "[3/4] Restaurando base de datos..."

# Descomprimir y pasar al contenedor
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" \
  psql -U "$DB_USER" -d "$DB_NAME" \
  --quiet \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" \
  -f -

echo "      ✅ Restauración completada."
echo ""

# ── Verificar ────────────────────────────────────────────────────────────────
echo "[4/4] Verificando tablas restauradas..."
TABLE_COUNT=$(docker exec "$CONTAINER_NAME" \
  psql -U "$DB_USER" -d "$DB_NAME" -t \
  -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "      Tablas encontradas: $TABLE_COUNT"
echo ""

echo "========================================"
echo "  ✅ Restauración completada"
echo "  Puedes reiniciar la app si estaba corriendo:"
echo "  docker-compose up -d app"
echo "========================================"
echo ""