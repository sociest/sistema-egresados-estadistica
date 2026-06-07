import { relations } from "drizzle-orm";
import {
  pgTable, serial, varchar, text, integer,
  date, timestamp, boolean, numeric, pgEnum,
  uniqueIndex, index,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const usuarioRolEnum      = pgEnum("usuario_rol",           ["admin", "egresado"]);
export const usuarioEstEnum      = pgEnum("usuario_est",           ["activo", "inactivo", "bloqueado"]);
export const generoEnum          = pgEnum("genero_enum",           ["Masculino", "Femenino", "Otro", "Prefiero no decir"]);
export const sectorEnum          = pgEnum("sector_enum",           ["Publico", "Privado", "Independiente", "ONG", "Otro"]);
export const contratoEnum        = pgEnum("contrato_enum",         ["Indefinido", "Fijo", "Por obra", "Consultor", "Pasante", "Otro"]);
export const postgradoTipoEnum   = pgEnum("postgrado_tipo_enum",   ["Diplomado", "Especialidad", "Maestria", "Doctorado", "Postdoctorado", "Otro"]);
export const postgradoEstadoEnum = pgEnum("postgrado_estado_enum", ["En curso", "Finalizado", "Abandonado"]);
export const tokenTipoEnum       = pgEnum("token_tipo_enum", [
  "primer_login", "reset_password", "verificar_correo", "verificar_celular",
]);
export const modalidadEnum = pgEnum("modalidad_titulacion_enum", [
  "Tesis", "Proyecto de grado", "Trabajo dirigido", "Examen de grado", "Otro",
]);
export const personaTipoEnum      = pgEnum("persona_tipo_enum",      ["Titulado", "Egresado"]);
export const planeaTitularseEnum  = pgEnum("planea_titularse_enum",  ["Si", "No", "No sabe"]);
export const noticiasTipoEnum     = pgEnum("noticias_tipo_enum", [
  "noticia_institucional", "curso_evento", "noticia_social",
]);
export const auditAccionEnum  = pgEnum("audit_accion_enum",  ["crear", "editar", "eliminar"]);
export const auditEntidadEnum = pgEnum("audit_entidad_enum", ["egresado", "usuario", "noticia", "encuesta", "titulado", "backup"])

export const MODALIDADES_TITULACION = [
  "Tesis", "Proyecto de grado", "Trabajo dirigido", "Examen de grado", "Otro",
] as const;

// Helper: derivar título académico desde el postgrado más alto
// Orden: Postdoctorado > Doctorado > Maestria > Especialidad > Diplomado
// Si es Titulado sin postgrados → "Lic. en Estadística"
// Si es Egresado sin postgrados → null
export function derivarTituloAcademico(
  tipo: "Titulado" | "Egresado",
  postgrados: Array<{ tipo: string }>,
): string | null {
  const orden = ["Postdoctorado", "Doctorado", "Maestria", "Especialidad", "Diplomado"];
  for (const nivel of orden) {
    if (postgrados.some(p => p.tipo === nivel)) {
      const labels: Record<string, string> = {
        Postdoctorado: "Dr. (Postdoctorado)",
        Doctorado:     "Dr. en Estadística",
        Maestria:      "M.Sc. en Estadística",
        Especialidad:  "Esp. en Estadística",
        Diplomado:     "Lic. en Estadística (Diplomado)",
      };
      return labels[nivel] ?? nivel;
    }
  }
  if (tipo === "Titulado") return "Lic. en Estadística";
  return null;
}

// ── egresado ──────────────────────────────────────────────────────────────────
export const egresado = pgTable("egresado", {
  id:              serial("id").primaryKey(),
  // Nombres y apellidos (sin campo apellidos general)
  nombres:         varchar("nombres",          { length: 100 }).notNull(),
  apellidoPaterno: varchar("apellido_paterno", { length: 100 }),
  apellidoMaterno: varchar("apellido_materno", { length: 100 }),
  ci:              varchar("ci",               { length: 20  }).notNull().unique(),
  nacionalidad:    varchar("nacionalidad",     { length: 80  }),
  genero:          generoEnum("genero"),
  correoElectronico: varchar("correo_electronico", { length: 150 }),
  telefono:        varchar("telefono",         { length: 20  }),
  celular:         varchar("celular",          { length: 20  }),
  // tituloAcademico eliminado — se calcula con derivarTituloAcademico()
  fechaNacimiento: date("fecha_nacimiento").notNull(),
  // Plan de estudios eliminado
  anioIngreso:     integer("anio_ingreso"),
  anioEgreso:      integer("anio_egreso"),
  anioTitulacion:  integer("anio_titulacion"),
  // Semestres ahora en formato texto "I/2020" o "II/2020"
  semestreIngreso: varchar("semestre_ingreso", { length: 10 }),
  semestreEgreso:  varchar("semestre_egreso",  { length: 10 }),
  promedio:        numeric("promedio", { precision: 4, scale: 2 }),
  modalidadTitulacion: modalidadEnum("modalidad_titulacion"),
  mostrarEnDirectorio: boolean("mostrar_en_directorio").notNull().default(false),
  fechaRegistro:       timestamp("fecha_registro").notNull().defaultNow(),
  ultimaActualizacion: timestamp("ultima_actualizacion").defaultNow(),
  // Tipo Titulado/Egresado
  tipo:                personaTipoEnum("tipo").notNull().default("Titulado"),
  // Campos exclusivos Egresado
  inicioProceso:       boolean("inicio_proceso"),
  motivoNoTitulacion:  text("motivo_no_titulacion"),
  planeaTitularse:     planeaTitularseEnum("planea_titularse"),  // "Si" | "No" | "No sabe"
  // Redes y especialización
  facebook:            varchar("facebook",             { length: 200 }),
  linkedin:            varchar("linkedin",             { length: 200 }),
  areaEspecializacion: varchar("area_especializacion", { length: 150 }),
  observaciones:       text("observaciones"),
  estadoLaboral:       varchar("estado_laboral",       { length: 30  }),
  // Residencia unificada
  lugarResidencia:     varchar("lugar_residencia",     { length: 200 }),
  fallecido:           boolean("fallecido").notNull().default(false),
  fotoUrl:             varchar("foto_url", { length: 500 }),
}, (t) => ({
  ciIdx:              uniqueIndex("egresado_ci_idx").on(t.ci),
  anioEgresoIdx:      index("idx_egresado_anio_egreso").on(t.anioEgreso),
  generoIdx:          index("idx_egresado_genero").on(t.genero),
  tipoIdx:            index("idx_egresado_tipo").on(t.tipo),
  fallecidoIdx:       index("idx_egresado_fallecido").on(t.fallecido),
  lugarResidenciaIdx: index("idx_egresado_lugar_residencia").on(t.lugarResidencia),
}));

// ── historial_laboral ────────────────────────────────────────────────────────
export const historialLaboral = pgTable("historial_laboral", {
  id:                  serial("id").primaryKey(),
  idEgresado:          integer("id_egresado").notNull()
    .references(() => egresado.id, { onDelete: "cascade" }),
  empresa:             varchar("empresa",  { length: 150 }).notNull(),
  cargo:               varchar("cargo",    { length: 100 }).notNull(),
  area:                varchar("area",     { length: 100 }),
  fechaInicio:         date("fecha_inicio").notNull(),
  fechaFin:            date("fecha_fin"),
  tipoContrato:        contratoEnum("tipo_contrato"),
  // Renombrados
  ciudadRegionTrabajo: varchar("ciudad_region_trabajo", { length: 150 }),
  sectorTrabajo:       sectorEnum("sector_trabajo"),
  // Sin campos de verificación de documentos
  ultimaActualizacion: timestamp("ultima_actualizacion").defaultNow(),
  creadoEn:            timestamp("creado_en").notNull().defaultNow(),
}, (t) => ({
  ciudadIdx:  index("idx_historial_ciudad_region").on(t.ciudadRegionTrabajo),
  sectorIdx:  index("idx_historial_sector_trabajo").on(t.sectorTrabajo),
}));

// ── postgrado ─────────────────────────────────────────────────────────────────
export const postgrado = pgTable("postgrado", {
  id:          serial("id").primaryKey(),
  idEgresado:  integer("id_egresado").notNull()
    .references(() => egresado.id, { onDelete: "cascade" }),
  tipo:        postgradoTipoEnum("tipo").notNull(),
  institucion: varchar("institucion", { length: 200 }).notNull(),
  pais:        varchar("pais",        { length: 100 }).notNull().default("Bolivia"),
  anioInicio:  integer("anio_inicio").notNull(),
  anioFin:     integer("anio_fin"),
  estado:      postgradoEstadoEnum("estado").notNull().default("En curso"),
  // Sin campos de verificación de documentos
  // Sin esSolicitudCambio ni datosPropuestos
  ultimaActualizacion: timestamp("ultima_actualizacion").defaultNow(),
  creadoEn:            timestamp("creado_en").notNull().defaultNow(),
});

// ── usuario ───────────────────────────────────────────────────────────────────
export const usuario = pgTable("usuario", {
  id:                serial("id").primaryKey(),
  ci:                varchar("ci",            { length: 20  }),
  correo:            varchar("correo",        { length: 150 }).notNull().unique(),
  passwordHash:      varchar("password_hash", { length: 255 }).notNull(),
  rol:               usuarioRolEnum("rol").notNull().default("egresado"),
  estado:            usuarioEstEnum("estado").notNull().default("activo"),
  idEgresado:        integer("id_egresado")
    .references(() => egresado.id, { onDelete: "set null" }),
  primerLogin:       boolean("primer_login").notNull().default(true),
  celular:           varchar("celular",       { length: 20  }),
  correoVerificado:  boolean("correo_verificado").notNull().default(false),
  celularVerificado: boolean("celular_verificado").notNull().default(false),
  creadoEn:          timestamp("creado_en").notNull().defaultNow(),
});

// ── verificacion_tokens ───────────────────────────────────────────────────────
export const verificacionTokens = pgTable("verificacion_tokens", {
  id:        serial("id").primaryKey(),
  idUsuario: integer("id_usuario").notNull()
    .references(() => usuario.id, { onDelete: "cascade" }),
  token:     varchar("token",    { length: 8 }).notNull(),
  tipo:      tokenTipoEnum("tipo").notNull(),
  expiraEn:  timestamp("expira_en").notNull(),
  usado:     boolean("usado").notNull().default(false),
  creadoEn:  timestamp("creado_en").notNull().defaultNow(),
});

// ── noticias ──────────────────────────────────────────────────────────────────
export const noticias = pgTable("noticias", {
  id:            serial("id").primaryKey(),
  titulo:        varchar("titulo",    { length: 200 }).notNull(),
  cuerpo:        text("cuerpo").notNull(),
  tipo:          noticiasTipoEnum("tipo").notNull().default("noticia_institucional"),
  fecha:         date("fecha").notNull(),
  imagenUrl:     varchar("imagen_url",  { length: 500 }),
  publicado:     boolean("publicado").notNull().default(false),
  creadoEn:      timestamp("creado_en").notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en").defaultNow(),
}, (t) => ({
  tipoIdx:      index("idx_noticias_tipo").on(t.tipo),
  publicadoIdx: index("idx_noticias_publicado").on(t.publicado),
  fechaIdx:     index("idx_noticias_fecha").on(t.fecha),
}));

// ── sugerencias ───────────────────────────────────────────────────────────────
export const sugerencias = pgTable("sugerencias", {
  id:         serial("id").primaryKey(),
  idEgresado: integer("id_egresado")
    .references(() => egresado.id, { onDelete: "set null" }),
  tipo:       varchar("tipo",    { length: 100 }).notNull(),
  mensaje:    text("mensaje").notNull(),
  esAnonima:  boolean("es_anonima").notNull().default(false),
  leida:      boolean("leida").notNull().default(false),
  creadoEn:   timestamp("creado_en").notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id:               serial("id").primaryKey(),
  idUsuario:        integer("id_usuario")
    .references(() => usuario.id, { onDelete: "set null" }),
  accion:           auditAccionEnum("accion").notNull(),
  entidad:          auditEntidadEnum("entidad").notNull(),
  entidadId:        integer("entidad_id"),
  datosAnteriores:  text("datos_anteriores"),
  datosNuevos:      text("datos_nuevos"),
  ip:               varchar("ip", { length: 45 }),
  creadoEn:         timestamp("creado_en").notNull().defaultNow(),
}, (t) => ({
  accionIdx:   index("idx_audit_accion").on(t.accion),
  entidadIdx:  index("idx_audit_entidad").on(t.entidad),
  creadoEnIdx: index("idx_audit_creado_en").on(t.creadoEn),
}));

// ── Relations ─────────────────────────────────────────────────────────────────
export const egresadoRelations = relations(egresado, ({ many }) => ({
  historial:   many(historialLaboral),
  postgrados:  many(postgrado),
  usuarios:    many(usuario),
  sugerencias: many(sugerencias),
}));
export const historialRelations = relations(historialLaboral, ({ one }) => ({
  egresado: one(egresado, { fields: [historialLaboral.idEgresado], references: [egresado.id] }),
}));
export const postgradoRelations = relations(postgrado, ({ one }) => ({
  egresado: one(egresado, { fields: [postgrado.idEgresado], references: [egresado.id] }),
}));
export const usuarioRelations = relations(usuario, ({ one, many }) => ({
  egresado:           one(egresado, { fields: [usuario.idEgresado], references: [egresado.id] }),
  verificacionTokens: many(verificacionTokens),
}));
export const verificacionTokensRelations = relations(verificacionTokens, ({ one }) => ({
  usuario: one(usuario, { fields: [verificacionTokens.idUsuario], references: [usuario.id] }),
}));
export const sugerenciasRelations = relations(sugerencias, ({ one }) => ({
  egresado: one(egresado, { fields: [sugerencias.idEgresado], references: [egresado.id] }),
}));

// ── Tipos inferidos ───────────────────────────────────────────────────────────
export type Egresado          = typeof egresado.$inferSelect;
export type NuevoEgresado     = typeof egresado.$inferInsert;
export type HistorialLaboral  = typeof historialLaboral.$inferSelect;
export type NuevoHistorial    = typeof historialLaboral.$inferInsert;
export type Postgrado         = typeof postgrado.$inferSelect;
export type NuevoPostgrado    = typeof postgrado.$inferInsert;
export type Usuario           = typeof usuario.$inferSelect;
export type NuevoUsuario      = typeof usuario.$inferInsert;
export type VerificacionToken = typeof verificacionTokens.$inferSelect;
export type NuevoToken        = typeof verificacionTokens.$inferInsert;
export type Noticia           = typeof noticias.$inferSelect;
export type NuevaNoticia      = typeof noticias.$inferInsert;
export type Sugerencia        = typeof sugerencias.$inferSelect;
export type NuevaSugerencia   = typeof sugerencias.$inferInsert;
export type AuditLog    = typeof auditLog.$inferSelect;
export type NuevoAudit  = typeof auditLog.$inferInsert;

// ── Helpers de formato ────────────────────────────────────────────────────────
export const fmtGestion = (
  anio: number | null | undefined,
  semestre: string | null | undefined,
): string => {
  if (!anio) return "—";
  if (!semestre) return String(anio);
  return `${semestre}/${anio}`;
};