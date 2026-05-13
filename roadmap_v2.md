# Roadmap v2 — Correcciones y Mejoras Pendientes
## Sistema de Seguimiento de Egresados · Carrera de Estadística UMSA

---

## 📋 Resumen de bloques

| Bloque | Área | Prioridad | Depende de |
|--------|------|-----------|------------|
| A | Dashboard con 3 modos (Titulados / Egresados / Ambos) | 🔴 Alta | — |
| B | Formulario de edición del egresado (vista egresado) | 🔴 Alta | — |
| C | Corrección de correo/CI y seed de usuarios | 🔴 Alta | B |
| D | Eliminar verificación por SMS / solo correo | 🔴 Alta | C |
| E | Vista de edición del admin (formulario completo) | 🟡 Media | B |
| F | Landing page + header + footer | 🟡 Media | — |
| G | Audit log + backup a Google Drive | 🟠 Baja | — |
| H | Docker y despliegue | 🔵 Infraestructura | G |

> Los bloques A, B, C, D son independientes entre sí y pueden hacerse en paralelo.
> El bloque E depende de los campos que queden definidos en B.
> El bloque H puede hacerse en cualquier momento (ver nota al final).

---

## 🔴 BLOQUE A — Dashboard con 3 modos

### Contexto
El dashboard actual tiene un switch de filtro por tipo pero todos los KPIs y gráficos están mezclados. Se necesitan tres vistas claramente diferenciadas: **Titulados**, **Egresados**, **Ambos**.

### Cambios en `src/app/api/dashboard/route.ts`

Agregar soporte para el parámetro `modo` (`titulados` | `egresados` | `ambos`).

**Modo `titulados`** — filtros disponibles:
- `anioTitulacionDesde` / `anioTitulacionHasta`
- `sector`
- `modalidad`

Todos los filtros aplican a **todos** los gráficos del modo (si sector = Público, los titulados por año solo muestran los del sector público, la distribución geográfica igual, etc.).

**Modo `egresados`** — filtros disponibles:
- `anioEgresoDesde` / `anioEgresoHasta`
- `sector`

Igual que arriba: todos los filtros aplican a todos los gráficos.

**Modo `ambos`** — filtros disponibles:
- `anioTitulacionDesde` / `anioTitulacionHasta`
- `sector`
- `modalidad`

### KPIs por modo

| KPI | Titulados | Egresados | Ambos |
|-----|-----------|-----------|-------|
| Total registrados | ✅ Titulados | ✅ Egresados | ✅ Ambos |
| Tasa de empleabilidad | ✅ de titulados | ✅ de egresados | ✅ global |
| Tiempo promedio egreso → titulación | ✅ | ❌ | ✅ |
| Tiempo promedio de inserción laboral | ✅ (desde titulación) | ✅ (desde egreso) | ✅ |
| Con empleo activo | ✅ titulados | ✅ egresados | ✅ |

### Gráficos por modo

**Modo Titulados:**
1. Titulados por año (barras)
2. Sector laboral de titulados (torta)
3. Modalidad de titulación (barras horizontales)
4. Distribución geográfica (tabla de ciudades + departamentos)
5. Comparativo por cohorte de ingreso

**Modo Egresados:**
1. Egresados por año (barras)
2. Sector laboral de egresados (torta)
3. Distribución geográfica (tabla)
4. Comparativo por cohorte de ingreso

**Modo Ambos:**
1. Titulados vs Egresados por año (barras apiladas o agrupadas)
2. Sector laboral (combinado)
3. Modalidad de titulación
4. Distribución geográfica (combinada)
5. Comparativo por cohorte de ingreso

### Cambios en `src/components/dashboard/DashboardClient.tsx`

1. Agregar un **selector de modo** con tres opciones tipo tab o botón segmentado arriba de todo:
   - `🎓 Titulados` | `📋 Egresados` | `📊 Ambos`
2. Al cambiar el modo:
   - Cambiar los KPIs mostrados
   - Cambiar los filtros disponibles (ocultar los que no aplican)
   - Cambiar los gráficos renderizados
   - Disparar un nuevo fetch a la API con el parámetro `modo`
3. Cada modo tiene su propia sección de filtros con solo los filtros que le corresponden
4. **Los filtros deben afectar a TODOS los gráficos del modo activo** — incluyendo el comparativo por cohorte (para el cohorte solo aplica el filtro de rango de años)

### Exportación de PDF

- El botón "Exportar como PDF" exporta el modo actualmente visible
- El nombre del archivo incluye el modo: `dashboard_titulados_YYYY-MM-DD.pdf`
- El encabezado del PDF indica el modo: "Dashboard — Titulados" / "Dashboard — Egresados" / etc.

### Archivos a modificar
- `src/app/api/dashboard/route.ts`
- `src/components/dashboard/DashboardClient.tsx`

---

## 🔴 BLOQUE B — Formulario de edición del egresado (vista egresado)

### Contexto
El formulario de `editar-perfil` tiene problemas: muestra campos que el egresado no debería poder cambiar, incluye campos que ya no van en esa vista, y la estructura no es clara.

### Restricciones — campos NO editables por el egresado

Los siguientes campos deben mostrarse como texto informativo (no como inputs), con un ícono de candado o estilo apagado:
- **CI** (nunca cambia)
- **Nombres** (nunca cambia)
- **Apellido Paterno** (nunca cambia)
- **Apellido Materno** (nunca cambia)
- **Tipo** (Titulado/Egresado — solo el admin puede cambiarlo)

### Campos que se eliminan del formulario del egresado

- `estadoLaboral` — se deriva automáticamente del historial laboral (si tiene un empleo con `fechaFin = null` → Empleado)
- `anioIngreso` — solo editable por admin
- `anioEgreso` — solo editable por admin
- `anioTitulacion` — solo editable por admin
- `modalidadTitulacion` — solo editable por admin
- `observaciones` — solo visible/editable por admin

### Correo — no editable en este formulario

El correo electrónico **no debe estar en el formulario de editar perfil**. Solo se puede cambiar/verificar desde el componente `ContactoVerificacionModal`. Revisar que el modal actualice correctamente el correo en la tabla `usuario` (no en `egresado`).

### Nueva estructura de secciones del formulario del egresado

**Sección 1 — Datos personales (campos de solo lectura)**
- CI (solo lectura)
- Nombres (solo lectura)
- Apellido Paterno (solo lectura)
- Apellido Materno (solo lectura)
- Tipo (solo lectura, badge)

**Sección 2 — Datos de contacto**
- Celular (editable)
- Nota: "Para cambiar tu correo, usa el panel de verificación de cuenta"

**Sección 3 — Información personal**
- Género
- Fecha de nacimiento
- Nacionalidad
- Lugar de residencia

**Sección 4 — Redes sociales**
- Facebook
- LinkedIn

**Sección 5 — Área de especialización**
- Área de especialización

**Sección extra para Egresados sin título (si `tipo === "Egresado"`)**
- ¿Inició proceso de titulación?
- ¿Planea titularse?
- Motivo de no titulación

**No aparece en el formulario del egresado:**
- promedio (sí se queda para el egresado)
- observaciones (solo admin)
- año de ingreso/egreso/titulación (solo admin)
- modalidad (solo admin)
- fallecido (solo admin)

### Completitud del perfil — campos a contar

Actualizar `calcularCompletitud` en `mi-perfil/page.tsx` para incluir:
- `celular`
- `correoElectronico` (verificado)
- `lugarResidencia`
- `anioEgreso` (si está en BD, aunque no sea editable)
- `genero`
- `areaEspecializacion`
- `nacionalidad`
- `promedio`

### Archivos a modificar
- `src/app/(egresado)/editar-perfil/page.tsx`
- `src/components/egresados/EgresadoForm.tsx` — agregar prop `modo: "egresado" | "admin"` para controlar qué campos se muestran
- `src/app/(egresado)/mi-perfil/page.tsx` — actualizar cálculo de completitud

---

## 🔴 BLOQUE C — Corrección de correo/CI en usuarios y seed

### Problema actual

1. El seed genera usuarios con `correo: eg.correoElectronico` (el correo del egresado), pero el login usa el CI como identificador. Cuando el admin ve la tabla de usuarios, aparece un correo que puede no coincidir con lo que el egresado verifica después.
2. Al crear un egresado desde el admin, se crea el usuario con `correo: correoElectronico ?? \`${ci}@sin-correo.local\`` — ese correo fantasma llena la columna de correo en la tabla de usuarios aunque no sea real.
3. En `ContactoVerificacionModal`, cuando el egresado verifica un correo nuevo, se actualiza en la tabla `usuario` (campo `correo`), pero el campo `correoElectronico` de la tabla `egresado` puede no estar sincronizado.

### Solución

**En el seed (`scripts/seed.ts`):**
- Al crear usuarios de egresados, dejar `correo` vacío o con un placeholder claro como `pendiente_${ci}` (sin intentar simular un correo real)
- O simplemente dejar el campo `correo` con el CI como valor base: `${ci}@pendiente.local`

**En `POST /api/egresados` (creación desde admin):**
- Crear el usuario con `correo: \`${d.ci}@pendiente.local\``, `correoVerificado: false`
- Queda pendiente hasta que el egresado complete el flujo de activación

**En `ContactoVerificacionModal` y `api/auth/solicitar-codigo`:**
- Al verificar un correo nuevo, actualizar **ambas** tablas: `usuario.correo` y `egresado.correoElectronico`
- Revisar `src/app/api/auth/solicitar-codigo/route.ts` y `src/app/api/auth/verificar-contacto/route.ts` para que hagan el update en las dos tablas

**En la tabla de usuarios del admin:**
- La columna "Correo / CI" debe mostrar el CI como identificador principal
- Si `correoVerificado = true`, mostrar el correo verificado debajo del CI
- Si no está verificado, mostrar "Sin correo verificado"

### Archivos a modificar
- `scripts/seed.ts`
- `src/app/api/egresados/route.ts` (POST)
- `src/app/api/auth/verificar-contacto/route.ts`
- `src/app/usuarios/page.tsx`

---

## 🔴 BLOQUE D — Eliminar verificación por SMS / solo correo

### Contexto

El cliente no quiere pagar el servicio de SMS. Toda verificación de cuenta debe hacerse solo por correo electrónico.

### Cambios a realizar

**Eliminar de la UI:**
- En `activar-cuenta/page.tsx`: quitar la opción de agregar celular como método de verificación. Solo mostrar el campo de correo electrónico. Quitar el paso "Opción teléfono" y la opción de verificar celular durante la activación.
- En `completar-contacto/page.tsx`: quitar la opción de celular. Solo correo.
- En `recuperar-password/page.tsx`: quitar la opción "Celular" cuando el usuario tiene ambos métodos. Siempre enviar al correo.
- En `ContactoVerificacionModal.tsx`: quitar el panel de "Cambiar celular" y la opción de verificar celular. Mantener solo el correo.
- En `mi-perfil/page.tsx`: el campo celular sigue siendo editable (es un dato de contacto), pero no hay verificación ligada a él.

**Limpiar APIs:**
- `src/app/api/auth/agregar-contacto/route.ts`: quitar la lógica de celular, solo procesar correo
- `src/app/api/auth/solicitar-codigo/route.ts`: eliminar los casos `verificar_celular` y el envío de SMS a consola; para `reset_password` siempre usar correo
- `src/app/api/auth/verificar-contacto/route.ts`: quitar el caso `metodo === "celular"`
- `src/app/api/auth/enviar-reset-canal/route.ts`: simplificar, siempre usar correo (puede eliminarse como endpoint separado y fusionarse con `solicitar-codigo`)

**En el schema y BD:**
- Mantener el campo `celular` en las tablas (es un dato de contacto, no de autenticación)
- Mantener `celularVerificado` como campo (podría borrarse, pero es mejor dejarlo como `false` por defecto para no requerir migración)

**Limpiar el enum de tokens:**
- Quitar `verificar_celular` del enum `token_tipo_enum` en `schema.ts` (requiere migración)
- O simplemente no usarlo más (más seguro, evita migración)

### Archivos a modificar/eliminar parcialmente
- `src/app/activar-cuenta/page.tsx`
- `src/app/completar-contacto/page.tsx`
- `src/app/recuperar-password/page.tsx`
- `src/components/perfil/ContactoVerificacionModal.tsx`
- `src/app/api/auth/agregar-contacto/route.ts`
- `src/app/api/auth/solicitar-codigo/route.ts`
- `src/app/api/auth/verificar-contacto/route.ts`
- `src/app/api/auth/enviar-reset-canal/route.ts`
- `src/lib/schema.ts` (ajuste menor al enum si se decide)

---

## 🟡 BLOQUE E — Vista de edición del admin (formulario completo)

### Contexto
El admin debe poder ver y editar todos los campos disponibles, incluyendo los que el egresado no puede tocar. Además se necesita una sección solo-admin con datos derivados del empleo actual y un campo de observaciones.

### Estructura del formulario del admin en `/egresados/[id]/editar`

**Sección 1 — Identificación**
- Nombres, Apellido Paterno, Apellido Materno (editables para admin)
- CI (editable para admin)
- Tipo: Titulado / Egresado (selector, solo admin)

**Sección 2 — Datos personales**
- Género, Fecha de nacimiento, Nacionalidad
- Celular, Correo electrónico
- Lugar de residencia

**Sección 3 — Redes y especialización**
- Facebook, LinkedIn
- Área de especialización

**Sección 4 — Datos académicos**
- Año de ingreso, Año de egreso
- Semestre ingreso, Semestre egreso
- Año de titulación, Modalidad de titulación
- Promedio de egreso

**Sección 5 — Para egresados sin título (condicional)**
- ¿Inició proceso?, ¿Planea titularse?, Motivo no titulación

**Sección 6 — Estado laboral actual (solo lectura, derivado del historial)**
> Esta sección es **informativa**, no editable — se calcula en tiempo real desde la tabla `historial_laboral`.
- Estado laboral: Empleado / Sin empleo (basado en si existe entrada con `fechaFin = null`)
- Cargo actual: `historial_laboral.cargo` del empleo activo
- Empresa actual: `historial_laboral.empresa`
- Sector: `historial_laboral.sectorTrabajo`
- Ciudad/Región: `historial_laboral.ciudadRegionTrabajo`
- Si no tiene empleo activo, mostrar "Sin empleo registrado"

**Sección 7 — Notas del administrador**
- Observaciones (textarea, solo visible/editable para admin)

**Sección 8 — Opciones sensibles (solo admin)**
- Toggle "Marcar como fallecido" (con aviso)

### Mejora en la vista de detalle `/egresados/[id]/page.tsx`

La sección de "Estado laboral actual" también debe aparecer en la vista de detalle (no solo en el formulario de edición), con los mismos datos derivados del historial.

### Archivos a modificar
- `src/app/egresados/[id]/editar/page.tsx`
- `src/components/egresados/EgresadoForm.tsx` — refactorizar para soportar `modo: "admin" | "egresado"`
- `src/app/egresados/[id]/page.tsx`

---

## 🟡 BLOQUE F — Landing page + header + footer

### Contexto
Se pidió mejorar el atractivo visual de la landing con los colores institucionales, y hay componentes del header y footer provistos por un compañero que necesitan integrarse. Los links y botones no están funcionando.

### Subtareas

**F.1 — Recibir y revisar los componentes del compañero**
- Recibir `PublicHeader.tsx` actualizado y el logo de la carrera
- Revisar qué links están hardcodeados como `#` y mapearlos a las rutas correctas:
  - "Plan de estudios", "Malla curricular", etc. → si no hay página, mantener `#` pero añadir `title="Próximamente"`
  - Botones de login/acceso → ya funciona, revisar que haga `setModalOpen(true)` en landing o redirija a `/login`
  - "Ver directorio" → `/directorio`
  - "Noticias" → `/noticias`
- Agregar el logo de la carrera en el header (ruta `/public/iconos/logo-carrera.png` o similar)

**F.2 — Mejorar la landing (`LandingLoginPage.tsx`)**

Mejoras de atractivo visual manteniendo la paleta turquesa/marino:
- La sección Hero puede ganar más profundidad: agregar una decoración SVG de fondo (patrón de puntos o líneas de cuadrícula con `opacity: 0.04`)
- Los 4 KPIs del hero deben tener un efecto de entrada escalonado (`animation-delay`)
- La sección "¿Por qué actualizar tu perfil?" puede tener íconos SVG más grandes y un hover más pronunciado
- El modal de login puede tener una animación de entrada más suave (`scale(0.97) → scale(1)` + `opacity`)
- Revisar que el CTA principal "Soy egresado — Acceder" esté siempre visible en el viewport inicial (above the fold) en móvil

**F.3 — Footer**
- Verificar que todos los links del footer tengan destinos correctos o `#` con `title`
- Los links de "Moodle", "SIA", "Webmail UMSA" abrir en `_blank`
- El mapa de Google Maps puede fallar en embed — testear; si falla, reemplazar con un enlace a Google Maps con las coordenadas
- Verificar que el footer sea responsive en móvil (columnas apiladas)

### Archivos a modificar
- `src/components/shared/PublicHeader.tsx`
- `src/components/shared/PublicFooter.tsx`
- `src/app/login/LandingLoginPage.tsx`
- `public/iconos/` — agregar logo

---

## 🟠 BLOQUE G — Audit log + backup a Google Drive

> Sin cambios respecto al roadmap anterior. Implementar según lo especificado en el Bloque 9 del roadmap v1.

**Resumen:**
- Tabla `audit_log` + helper `registrarAudit()` (fire-and-forget)
- Registrar en: create/update/delete de egresados y usuarios
- Vista `/actividad` paginada con filtros
- Script `backup.sh` con `pg_dump` + gzip + upload a Google Drive via `rclone`
- Script `setup-rclone.sh` con instrucciones
- Endpoint `GET /api/backup` para descarga inmediata de Excel completo

**Archivos:**
- `src/lib/schema.ts` (nueva tabla)
- `src/lib/audit.ts` (nuevo)
- `src/app/actividad/page.tsx` (nuevo)
- `src/app/api/backup/route.ts` (nuevo)
- `scripts/backup.sh` (nuevo)
- `scripts/setup-rclone.sh` (nuevo)
- `src/components/shared/AdminLayout.tsx` (agregar link "Actividad")

---

## 🔵 BLOQUE H — Docker y despliegue

> Sin cambios respecto al roadmap anterior. Puede implementarse en cualquier momento.
> **Recomendación: hacerlo después del Bloque F** para que el contenedor de producción tenga el sistema visualmente completo.

**Archivos a crear:**
- `Dockerfile` (multi-stage)
- `docker-compose.yml` (ya parcialmente implementado — revisar y completar)
- `nginx.conf` (ya parcialmente implementado — revisar HTTPS redirect)
- `.env.production.example`
- `scripts/deploy.sh`
- `scripts/restore-backup.sh`
- `README-deploy.md`

---

## 📋 Orden recomendado de implementación

```
SEMANA 1
├── B — Formulario egresado (base para C y E)
├── C — Fix correo/CI/seed (depende de saber los campos de B)
└── D — Eliminar SMS (independiente, puede ir en paralelo con B y C)

SEMANA 2
├── A — Dashboard 3 modos (independiente, puede ir en paralelo)
└── E — Formulario admin completo (depende de los campos de B)

SEMANA 3
├── F — Landing + header + footer (esperar a recibir los componentes)
└── G — Audit log + backup (puede ir cuando quiera)

SEMANA 4
└── H — Docker + despliegue (último paso antes de producción)
```

---

## 🗒️ Nota sobre Docker y actualizaciones

Se puede dockerizar antes de terminar todos los bloques. El flujo de actualización es:

```bash
git add . && git commit -m "fix: descripción del cambio"
git push

# En el servidor:
bash scripts/deploy.sh
# Internamente hace:
# git pull
# docker-compose build app   ← solo reconstruye la app, no toca la BD
# docker-compose up -d app   ← reemplaza el contenedor sin downtime en la BD
```

Esto significa que puedes dockerizar después del Bloque F y seguir haciendo cambios en los bloques G y siguientes — cada cambio se despliega con un solo comando. El contenedor de PostgreSQL (`db`) nunca se toca durante los despliegues de la app.
