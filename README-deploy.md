# Guía de Despliegue en Producción
## Sistema de Seguimiento de Egresados — Carrera de Estadística UMSA

---

## Requisitos del servidor

| Recurso | Mínimo recomendado |
|---|---|
| Sistema operativo | Ubuntu 22.04 LTS |
| RAM | 2 GB (4 GB recomendado) |
| Disco | 20 GB (SSD recomendado) |
| CPU | 2 núcleos |
| Puerto 80 y 443 | Abiertos en el firewall |

---

## Cómo funciona el despliegue

El sistema usa **4 contenedores Docker**:

| Contenedor | Rol |
|---|---|
| `egresados_db` | Base de datos PostgreSQL |
| `egresados_migrate` | Crea/actualiza las tablas en la BD (se apaga solo) |
| `egresados_app` | Aplicación Next.js |
| `egresados_nginx` | Proxy inverso con HTTPS |

Al hacer `docker compose up`, los contenedores arrancan en orden: primero la BD, luego las migraciones, luego la app, luego nginx. No es necesario correr comandos manuales para crear las tablas.

---

## Paso 1 — Instalar Docker en el servidor

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y ca-certificates curl gnupg git

# Agregar repositorio oficial de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker y Docker Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Permitir usar Docker sin sudo
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalación
docker --version
docker compose version
```

---

## Paso 2 — Clonar el repositorio

```bash
sudo mkdir -p /opt/egresados
sudo chown $USER:$USER /opt/egresados
cd /opt/egresados

git clone https://github.com/tu-usuario/egresados-estadistica.git .
```

---

## Paso 3 — Configurar variables de entorno

```bash
cp .env.production.example .env.production
nano .env.production
```

Valores que **debes cambiar obligatoriamente**:

```env
DB_PASSWORD=una_contraseña_segura_aqui
DATABASE_URL=postgresql://postgres:una_contraseña_segura_aqui@db:5432/egresados_db
JWT_SECRET=genera_con_el_comando_de_abajo
NEXTAUTH_URL=https://tudominio.bo
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion_de_gmail
ADMIN_EMAIL=admin@estadistica.bo
ADMIN_PASSWORD=CambiaEstoEnProduccion123!
```

Para generar el JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Para el correo con Gmail necesitas una **contraseña de aplicación**:
1. Activa la verificación en dos pasos en tu cuenta Gmail
2. Ve a: Cuenta Google → Seguridad → Contraseñas de aplicaciones
3. Genera una contraseña para "Correo" → "Otro (nombre personalizado)"
4. Usa esa contraseña de 16 caracteres en `EMAIL_PASS`

---

## Paso 4 — Configurar SSL (HTTPS)

### Opción A — Con dominio propio (recomendado)

```bash
# Instalar Certbot
sudo apt install -y certbot

# Obtener certificado (asegúrate que el puerto 80 esté libre)
sudo certbot certonly --standalone -d tudominio.bo

# Copiar certificados al proyecto
mkdir -p ssl
sudo cp /etc/letsencrypt/live/tudominio.bo/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/tudominio.bo/privkey.pem ssl/
sudo chown $USER:$USER ssl/*.pem
```

### Opción B — Sin dominio (solo HTTP, para pruebas internas)

Si no tienes dominio aún, elimina el servicio `nginx` del `docker-compose.yml` antes de continuar. La app quedará accesible directamente en el puerto 3000.

---

## Paso 5 — Crear carpetas necesarias

```bash
mkdir data\postgres public\uploads\noticias backups ssl
```

---

## Paso 6 — Primer despliegue

```bash
cd /opt/egresados
docker compose --env-file .env.production up -d --build
```

Este comando hace todo automáticamente:
1. Construye las imágenes de la app
2. Levanta la base de datos
3. **Crea todas las tablas automáticamente** (contenedor `migrate`)
4. Inicia la aplicación
5. Inicia nginx

Espera 2-3 minutos mientras se construye. Luego verifica:

```bash
docker compose ps
```

Deberías ver:
NAME                 STATUS
egresados_db         Up (healthy)
egresados_migrate    Exited (0)      ← normal, se apaga solo al terminar
egresados_app        Up (healthy)
egresados_nginx      Up

El estado `Exited (0)` del contenedor `migrate` es **correcto** — significa que las migraciones se ejecutaron exitosamente y el contenedor se apagó.

Si `migrate` muestra `Exited (1)`, hubo un error. Revisa los logs:
```bash
docker logs egresados_migrate
```

---

## Paso 7 — Cargar datos iniciales (solo la primera vez)

```bash
docker compose --env-file .env.production run --rm seed
```

Esto crea:
- Usuario admin con las credenciales configuradas en `ADMIN_EMAIL` y `ADMIN_PASSWORD`
- Datos de ejemplo para probar el sistema

**Solo ejecutar una vez.** Si lo ejecutas de nuevo borrará y recreará todos los datos.

---

## Paso 8 — Verificar que funciona

```bash
# Ver logs de la app
docker logs egresados_app --tail=50

# Probar que la API responde
curl http://localhost:3000/api/stats/publicos

# Si tienes dominio con HTTPS
curl https://tudominio.bo/api/stats/publicos
```

La respuesta debería ser algo como:
```json
{"data":{"totalTitulados":7,"totalEgresados":3,"tasaEmpleabilidad":82}}
```

---

## Cómo actualizar la app

Cada vez que haya cambios en el código:

```bash
cd /opt/egresados
bash scripts/deploy.sh
```

El script hace automáticamente:
1. `git pull` — descarga los últimos cambios
2. Reconstruye solo la imagen de la app
3. Reinicia el contenedor sin tocar la BD ni nginx
4. Verifica que la app esté respondiendo
5. Limpia imágenes Docker antiguas

Si hubo cambios en el schema de la BD, las migraciones se aplican automáticamente al reiniciar gracias al contenedor `migrate`.

---

## Cómo restaurar un backup

```bash
# Listar backups disponibles
ls -lh backups/

# Restaurar un backup específico
bash scripts/restore-backup.sh backups/backup_20240115_020000.sql.gz

# Reiniciar la app después de restaurar
docker compose --env-file .env.production up -d app
```

---

## Ver logs

```bash
# Logs de la app en tiempo real
docker logs egresados_app -f

# Logs de la BD
docker logs egresados_db -f

# Logs de nginx
docker logs egresados_nginx -f

# Logs de las migraciones
docker logs egresados_migrate

# Logs del backup automático
tail -f /var/log/backup-egresados.log
```

---

## Comandos útiles

```bash
# Ver estado de los contenedores
docker compose ps

# Reiniciar un servicio específico
docker compose --env-file .env.production restart app

# Entrar al contenedor de la app
docker exec -it egresados_app sh

# Entrar a la BD
docker exec -it egresados_db psql -U postgres -d egresados_db

# Ver uso de disco
docker system df
du -sh data/postgres/
du -sh backups/

# Detener todo (sin borrar datos)
docker compose down

# Detener y borrar volúmenes (BORRA LA BD — usar con cuidado)
docker compose down -v
```

---

## Configurar backup automático a Google Drive

```bash
# Seguir las instrucciones interactivas
bash scripts/setup-rclone.sh

# Dar permisos de ejecución al script
chmod +x scripts/backup.sh

# Probar el backup manualmente
bash scripts/backup.sh

# Agregar al crontab (backup diario a las 2am)
crontab -e
```

Agrega esta línea al crontab:
0 2 * * * /opt/egresados/scripts/backup.sh >> /var/log/backup-egresados.log 2>&1
---

## Solución de problemas comunes

**La app no inicia:**
```bash
docker logs egresados_app --tail=100
# Verifica que DATABASE_URL y JWT_SECRET estén bien en .env.production
```

**Las migraciones fallan (migrate Exited 1):**
```bash
docker logs egresados_migrate
# Verifica que DATABASE_URL apunte a @db:5432 (no localhost)
```

**La BD no conecta:**
```bash
docker logs egresados_db --tail=50
# Verifica que DB_PASSWORD sea el mismo en DATABASE_URL
```

**nginx da error 502:**
```bash
# La app no está corriendo o tardó en iniciar
docker compose --env-file .env.production up -d app
sleep 10
docker logs egresados_nginx --tail=20
```

**Error de permisos en uploads:**
```bash
sudo chown -R 1001:1001 public/uploads/
```

**Sin espacio en disco:**
```bash
docker system prune -f
docker image prune -a -f
```