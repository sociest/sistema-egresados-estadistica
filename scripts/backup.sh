#!/bin/bash
# scripts/backup.sh
# Backup automático de la BD a Google Drive vía rclone

set -euo pipefail

# ── Configuración ─────────────────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
CONTAINER_NAME="egresados_db"
DB_NAME="egresados_db"
DB_USER="postgres"
RCLONE_REMOTE="gdrive"                        # nombre del remote configurado en rclone
RCLONE_FOLDER="backups-egresados"             # carpeta en Google Drive
RETENTION_DAYS=7

# ── Crear carpeta local si no existe ─────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Nombre del archivo ────────────────────────────────────────────────────────
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="backup_${TIMESTAMP}.sql.gz"
FILEPATH="$BACKUP_DIR/$FILENAME"

echo "========================================"
echo "Iniciando backup: $FILENAME"
echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# ── Ejecutar pg_dump dentro del contenedor ────────────────────────────────────
echo "[1/4] Ejecutando pg_dump..."
docker exec "$CONTAINER_NAME" \
  pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILEPATH"

echo "      Backup creado: $FILEPATH ($(du -sh "$FILEPATH" | cut -f1))"

# ── Subir a Google Drive ──────────────────────────────────────────────────────
echo "[2/4] Subiendo a Google Drive..."
if command -v rclone &> /dev/null; then
  rclone copy "$FILEPATH" "${RCLONE_REMOTE}:${RCLONE_FOLDER}/"
  echo "      Subido a ${RCLONE_REMOTE}:${RCLONE_FOLDER}/$FILENAME"
else
  echo "      ADVERTENCIA: rclone no encontrado. Omitiendo subida a Drive."
  echo "      Ejecuta scripts/setup-rclone.sh para configurarlo."
fi

# ── Eliminar backups locales viejos ───────────────────────────────────────────
echo "[3/4] Limpiando backups locales de más de $RETENTION_DAYS días..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "      Limpieza completada."

# ── Verificar ────────────────────────────────────────────────────────────────
echo "[4/4] Verificando..."
BACKUPS_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" | wc -l)
echo "      Backups locales actuales: $BACKUPS_COUNT"
echo "========================================"
echo "Backup completado exitosamente: $FILENAME"
echo "========================================"