#!/bin/bash
# scripts/deploy.sh
# Actualiza la aplicación en producción sin bajar la base de datos

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo ""
echo "========================================"
echo "  Deploy — Sistema de Egresados UMSA"
echo "  Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# ── Verificar que existe el archivo de entorno ────────────────────────────────
if [ ! -f ".env.production" ]; then
  echo "❌ ERROR: No existe .env.production"
  echo "   Copia .env.production.example y completa los valores."
  exit 1
fi

# ── Cargar variables de entorno ───────────────────────────────────────────────
export $(grep -v '^#' .env.production | xargs)

echo "[1/5] Obteniendo últimos cambios del repositorio..."
git pull origin main
echo "      ✅ Código actualizado."
echo ""

echo "[2/5] Construyendo la nueva imagen de la app..."
docker-compose --env-file .env.production build app
echo "      ✅ Imagen construida."
echo ""

echo "[3/5] Reiniciando solo el contenedor de la app..."
# Solo reinicia "app", nunca toca "db" ni "nginx"
docker-compose --env-file .env.production up -d app
echo "      ✅ App reiniciada."
echo ""

echo "[4/5] Esperando que la app esté disponible..."
sleep 5
MAX_RETRIES=12
RETRIES=0
until docker exec egresados_app wget -qO- http://localhost:3000/api/stats/publicos > /dev/null 2>&1; do
  RETRIES=$((RETRIES + 1))
  if [ $RETRIES -ge $MAX_RETRIES ]; then
    echo "      ⚠️  La app tardó demasiado en responder. Revisa los logs:"
    echo "         docker logs egresados_app --tail=50"
    exit 1
  fi
  echo "      Esperando... ($RETRIES/$MAX_RETRIES)"
  sleep 5
done
echo "      ✅ App respondiendo correctamente."
echo ""

echo "[5/5] Limpiando imágenes Docker antiguas..."
docker image prune -f
echo "      ✅ Limpieza completada."
echo ""

echo "========================================"
echo "  ✅ Deploy completado exitosamente"
echo "========================================"
echo ""