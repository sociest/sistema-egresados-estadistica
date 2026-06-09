# 1. Configurar variables (una sola vez)
cp .env.production.example .env.production
nano .env.production
# → Pon tu correo real, contraseña segura, JWT_SECRET generado, etc.

# 2. Levantar la BD y aplicar migraciones (automático)
docker compose --env-file .env.production up -d db migrate

# 3. Crear SOLO el admin (sin datos ficticios)
docker compose --env-file .env.production run --rm \
  -e ADMIN_EMAIL=tucorreo@estadistica.bo \
  -e ADMIN_PASSWORD=TuContraseñaSegura123! \
  -e ADMIN_CI=admin \
  seed npx tsx scripts/seed-admin.ts

# 4. Levantar todo
docker compose --env-file .env.production up -d