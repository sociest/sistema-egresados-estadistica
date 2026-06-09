# 🎓 Sistema de Seguimiento de Egresados
### Carrera de Estadística — UMSA

---

## 🛠️ Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| ORM | **Drizzle ORM** |
| BD | **PostgreSQL** |
| Estilos | Tailwind CSS |
| Auth | JWT + bcrypt + cookies HTTP-only |
| Gráficos | Recharts |
| Exportación | xlsx |

---

## 👤 Roles

| Rol | Acceso |
|-----|--------|
| `admin` | Dashboard · CRUD egresados · Reportes + exportar · CRUD usuarios |
| `egresado` | Mi perfil · Editar datos · Historial laboral (agregar / editar) |

---

## 🗺️ Rutas del sistema

```
/Titulados_y_Egresados                    → Login (ambos roles)

── ADMIN ──────────────────────────────────
/dashboard                → Panel principal con estadísticas
/egresados                → Listado con búsqueda y filtros
/egresados/nuevo          → Crear egresado
/egresados/[id]           → Ver detalle
/egresados/[id]/editar    → Editar egresado
/reportes                 → Filtros + vista tabla/gráfico + exportar Excel
/usuarios                 → Gestión de cuentas
/usuarios/nuevo           → Crear usuario
/usuarios/[id]/editar     → Editar usuario

── EGRESADO ───────────────────────────────
/mi-perfil                → Ver datos + historial laboral
/registro-inicial         → Primera vez: completar datos de egresado
/experiencia/nueva        → Agregar nueva experiencia laboral
```

---

## ⚙️ Pasos para levantar el proyecto

### PASO 1 — Requisitos previos

Instala:
- **Node.js** v18+ → https://nodejs.org
- **PostgreSQL** v14+ → https://postgresql.org

Verifica:
```bash
node --version   # v18 o superior
psql --version
```

---

### PASO 2 — Crear la base de datos

```bash
# Abrir terminal de PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE egresados_db;
\q
```

---

### PASO 3 — Instalar dependencias

```bash
cd egresados-estadistica
npm install
```

---

### PASO 4 — Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:

```env
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/egresados_db
JWT_SECRET=genera_uno_con_el_comando_de_abajo
```

Para generar un `JWT_SECRET` seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### PASO 5 — Crear las tablas en la base de datos

Este comando lee el schema de Drizzle y crea todas las tablas automáticamente:

```bash
npm run db:push
```

Verás confirmación de cada tabla creada.

> **Alternativa con migraciones** (recomendado para producción):
> ```bash
> npm run db:generate  # genera archivos SQL en drizzle/migrations/
> npm run db:migrate   # aplica las migraciones
> ```

---

### PASO 6 — Cargar datos de prueba

```bash
npm run seed
```

Crea:
- ✅ Usuario **admin**: `admin@estadistica.bo` / `Admin1234!`
- ✅ Usuario **egresado**: `maria.flores@ejemplo.com` / `Egresado1234!`
- ✅ 3 planes de estudio (1994, 2008, 2018)
- ✅ 2 egresados de ejemplo con historial laboral

---

### PASO 7 — Levantar el servidor

```bash
npm run dev
```

Abre: **http://localhost:3000**

---

## 🔑 Credenciales de prueba

| Rol | Correo | Contraseña | Redirige a |
|-----|--------|------------|-----------|
| Admin | `admin@estadistica.bo` | `Admin1234!` | `/dashboard` |
| Egresado | `maria.flores@ejemplo.com` | `Egresado1234!` | `/mi-perfil` |

---

## 🧭 Flujo del egresado (primera vez)

1. El admin crea una cuenta con rol `egresado` en `/usuarios/nuevo`
2. El egresado entra a `/Titulados_y_Egresados` con sus credenciales
3. Si no tiene datos registrados → redirige a `/registro-inicial`
4. Completa su perfil (nombres, apellidos, CI, fechas, plan)
5. Queda en `/mi-perfil` donde puede editar y agregar experiencias

---

## 📦 Comandos disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Compilar para producción
npm run start        # Servidor de producción
npm run seed         # Poblar BD con datos de ejemplo
npm run db:push      # Sincronizar schema → BD (desarrollo)
npm run db:generate  # Generar archivos de migración
npm run db:migrate   # Aplicar migraciones
npm run db:studio    # Abrir Drizzle Studio (explorador visual de BD)
```

---

## 📁 Estructura de carpetas

```
src/
├── app/
│   ├── login/                    # Pantalla 1 — Login
│   ├── dashboard/                # Pantalla 2 — Dashboard admin
│   ├── egresados/                # Pantalla 3 — CRUD egresados
│   │   ├── nuevo/
│   │   └── [id]/editar/
│   ├── reportes/                 # Pantalla 4 — Reportes + exportar
│   ├── usuarios/                 # Pantalla 5 — CRUD usuarios
│   │   ├── nuevo/
│   │   └── [id]/editar/
│   ├── mi-perfil/                # Pantalla egresado — ver perfil
│   ├── registro-inicial/         # Primera vez — completar datos
│   ├── experiencia/nueva/        # Agregar experiencia laboral
│   └── api/
│       ├── auth/Titulados_y_Egresados/
│       ├── auth/logout/
│       ├── auth/link-egresado/
│       ├── egresados/[id]/
│       ├── historial/[id]/
│       ├── planes/[id]/
│       ├── usuarios/[id]/
│       └── reportes/
├── components/
│   ├── egresados/                # BuscadorEgresados, EgresadoForm, EliminarBtn
│   ├── usuarios/                 # UsuarioForm, EliminarBtn
│   ├── reportes/                 # ReportesClient (filtros + gráficos + tabla)
│   ├── perfil/                   # HistorialForm, MiPerfilHistorial, RegistroInicialForm
│   └── shared/                   # AdminLayout (sidebar + nav)
└── lib/
    ├── schema.ts                 # Schema Drizzle (tablas + relaciones + tipos)
    ├── db.ts                     # Conexión pool PostgreSQL
    ├── auth.ts                   # JWT, bcrypt, sesión cookie
    ├── utils.ts                  # Helpers (cn, fmtDate, ok, err)
    └── validations.ts            # Schemas Zod para todos los formularios
```

---

## 📌 Notas técnicas

- **Trabajo actual**: cuando `fecha_fin IS NULL` en `historial_laboral`
- **Sesión**: cookie HTTP-only con JWT de 8 horas
- **Exportación Excel**: respeta todos los filtros aplicados en `/reportes`
- **Drizzle Studio**: ejecuta `npm run db:studio` para explorar la BD visualmente en el navegador
