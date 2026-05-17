#!/bin/bash
# scripts/setup-rclone.sh
# Guía de instalación y configuración de rclone para Google Drive

set -euo pipefail

echo ""
echo "========================================================"
echo "  Configuración de rclone para Google Drive"
echo "  Sistema de Seguimiento de Egresados — UMSA"
echo "========================================================"
echo ""

# ── Paso 1: Instalar rclone ───────────────────────────────────────────────────
echo "PASO 1: Instalar rclone"
echo "─────────────────────────────────────────────────────"

if command -v rclone &> /dev/null; then
  echo "✅ rclone ya está instalado: $(rclone --version | head -1)"
else
  echo "Instalando rclone..."
  curl -fsSL https://rclone.org/install.sh | sudo bash
  echo "✅ rclone instalado correctamente."
fi

echo ""

# ── Paso 2: Configurar remote de Google Drive ─────────────────────────────────
echo "PASO 2: Configurar el remote de Google Drive"
echo "─────────────────────────────────────────────────────"
echo ""
echo "Ejecuta el siguiente comando y sigue las instrucciones:"
echo ""
echo "  rclone config"
echo ""
echo "Cuando te pregunte, sigue estos pasos:"
echo ""
echo "  1. Escribe 'n' para crear un nuevo remote"
echo "  2. Nombre: gdrive  (o el que prefieras, igual al RCLONE_REMOTE en backup.sh)"
echo "  3. Tipo:   drive   (busca Google Drive en la lista)"
echo "  4. client_id: deja vacío (presiona Enter)"
echo "  5. client_secret: deja vacío (presiona Enter)"
echo "  6. scope: 1  (acceso completo a Drive)"
echo "  7. root_folder_id: deja vacío (presiona Enter)"
echo "  8. service_account_file: deja vacío (presiona Enter)"
echo "  9. Edit advanced config: n"
echo " 10. Use auto config:"
echo "     - Si tienes navegador en el servidor: y"
echo "     - Si es un servidor headless (sin GUI): n"
echo "       → Copia el URL que aparece, ábrelo en tu PC,"
echo "         autoriza con tu cuenta de Google,"
echo "         copia el código y pégalo en el servidor."
echo " 11. Configure as a team drive: n"
echo " 12. Yes this is OK: y"
echo " 13. Quit config: q"
echo ""

# ── Paso 3: Crear carpeta en Google Drive ─────────────────────────────────────
echo "PASO 3: Crear carpeta de backups en Google Drive"
echo "─────────────────────────────────────────────────────"
echo ""
echo "Una vez configurado rclone, crea la carpeta:"
echo ""
echo "  rclone mkdir gdrive:backups-egresados"
echo ""
echo "Verifica que funciona:"
echo ""
echo "  rclone lsd gdrive:"
echo ""

# ── Paso 4: Probar backup ─────────────────────────────────────────────────────
echo "PASO 4: Probar el script de backup"
echo "─────────────────────────────────────────────────────"
echo ""
echo "  chmod +x scripts/backup.sh"
echo "  bash scripts/backup.sh"
echo ""

# ── Paso 5: Configurar crontab ────────────────────────────────────────────────
echo "PASO 5: Configurar ejecución automática (crontab)"
echo "─────────────────────────────────────────────────────"
echo ""
echo "Abre el crontab con:"
echo ""
echo "  crontab -e"
echo ""
echo "Agrega esta línea al final (backup todos los días a las 2:00am):"
echo ""
echo "  0 2 * * * $(pwd)/scripts/backup.sh >> /var/log/backup-egresados.log 2>&1"
echo ""
echo "Crea el archivo de log si no existe:"
echo ""
echo "  sudo touch /var/log/backup-egresados.log"
echo "  sudo chmod 666 /var/log/backup-egresados.log"
echo ""

# ── Paso 6: Verificar logs ────────────────────────────────────────────────────
echo "PASO 6: Verificar logs del backup"
echo "─────────────────────────────────────────────────────"
echo ""
echo "  tail -f /var/log/backup-egresados.log"
echo ""
echo "========================================================"
echo "  ✅ Configuración completada"
echo "========================================================"
echo ""