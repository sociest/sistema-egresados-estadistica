import { z } from "zod";
import { MODALIDADES_TITULACION } from "@/lib/schema";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  ci:       z.string().min(4, "CI inválido").max(20),
  password: z.string().min(1, "Contraseña requerida"),
});

// Helper para validar formato de semestre "I/2020" o "II/2020"
const semestreRegex = /^(I|II)\/\d{4}$/;
const semestreSchema = z
  .string()
  .regex(semestreRegex, "Formato inválido. Usa I/AAAA o II/AAAA")
  .optional()
  .nullable();

// ── Egresado ──────────────────────────────────────────────────────────────────
export const egresadoSchema = z.object({
  tipo: z.enum(["Titulado", "Egresado"]).default("Titulado"),

  // Datos personales — sin apellidos general, sin dirección
  nombres:         z.string().min(2, "Requerido").max(100),
  apellidoPaterno: z.string().max(100).optional().nullable(),
  apellidoMaterno: z.string().max(100).optional().nullable(),
  ci:              z.string().min(4, "CI inválido").max(20),
  nacionalidad:    z.string().max(80).optional().nullable(),
  genero:          z.enum(["Masculino", "Femenino", "Otro", "Prefiero no decir"]).optional().nullable(),
  correoElectronico: z.string().email("Correo inválido").max(150).optional().nullable(),
  celular:         z.string().max(20).optional().nullable(),
  // tituloAcademico eliminado — es calculado
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),

  // Redes y especialización
  facebook:            z.string().max(200).optional().nullable(),
  linkedin:            z.string().max(200).optional().nullable(),
  areaEspecializacion: z.string().max(150).optional().nullable(),
  observaciones:       z.string().optional().nullable(),
  estadoLaboral:       z.enum(["Empleado", "Desempleado", "Independiente"]).optional().nullable(),

  // Residencia unificada
  lugarResidencia: z.string().max(200).optional().nullable(),

  // Fallecido (solo admin)
  fallecido: z.boolean().optional().default(false),

  // Datos académicos — sin planEstudiosNombre
  // Semestres en formato "I/2020" o "II/2020"
  semestreIngreso: semestreSchema,
  semestreEgreso:  semestreSchema,
  anioIngreso:     z.number().int().min(1998).max(new Date().getFullYear()).optional().nullable(),
  anioEgreso:      z.number().int().min(1998).max(new Date().getFullYear() + 1).optional().nullable(),
  anioTitulacion:  z.number().int().min(1998).max(new Date().getFullYear() + 1).optional().nullable(),
  promedio:        z.number().min(0).max(100).optional().nullable(),
  modalidadTitulacion: z.enum([
    "Tesis", "Proyecto de grado", "Trabajo dirigido", "Examen de grado", "Otro",
  ]).optional().nullable(),

  // Campos exclusivos de Egresado
  inicioProceso:      z.boolean().optional().nullable(),
  motivoNoTitulacion: z.string().max(500).optional().nullable(),
  // Cambiado de boolean a tres opciones
  planeaTitularse: z.enum(["Si", "No", "No sabe"]).optional().nullable(),
})
.refine(
  d => {
    if (!d.anioEgreso || !d.anioIngreso) return true;
    return d.anioEgreso >= d.anioIngreso;
  },
  { message: "El año de egreso no puede ser anterior al de ingreso", path: ["anioEgreso"] }
)
.refine(
  d => {
    if (!d.anioTitulacion || !d.anioEgreso) return true;
    return d.anioTitulacion >= d.anioEgreso;
  },
  { message: "El año de titulación no puede ser anterior al de egreso", path: ["anioTitulacion"] }
)
.refine(
  d => {
    if (d.tipo === "Titulado" && !d.anioTitulacion) return false;
    return true;
  },
  { message: "Un titulado debe tener año de titulación", path: ["anioTitulacion"] }
);

// ── Historial laboral ─────────────────────────────────────────────────────────
export const historialSchema = z.object({
  idEgresado:         z.number().int().positive(),
  empresa:            z.string().min(2, "Requerido").max(150),
  cargo:              z.string().min(2, "Requerido").max(100),
  area:               z.string().max(100).optional().nullable(),
  tipoContrato:       z.enum(["Indefinido", "Fijo", "Por obra", "Consultor", "Pasante", "Otro"]).optional().nullable(),
  // Renombrado
  ciudadRegionTrabajo: z.string().max(150).optional().nullable(),
  sectorTrabajo:       z.enum(["Publico", "Privado", "Independiente", "ONG", "Otro"]).optional().nullable(),
  fechaInicio:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  fechaFin:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida").optional().nullable(),
  actualmenteTrabaja:  z.boolean().default(false),
}).refine(
  d => {
    if (d.actualmenteTrabaja || !d.fechaFin) return true;
    return new Date(d.fechaFin) > new Date(d.fechaInicio);
  },
  { message: "La fecha fin debe ser posterior a la de inicio", path: ["fechaFin"] }
);

// ── Postgrado ─────────────────────────────────────────────────────────────────
export const postgradoSchema = z.object({
  idEgresado:  z.number().int().positive(),
  tipo:        z.enum(["Diplomado", "Especialidad", "Maestria", "Doctorado", "Postdoctorado", "Otro"]),
  institucion: z.string().min(2, "Requerido").max(200),
  pais:        z.string().min(2, "Requerido").max(100).default("Bolivia"),
  anioInicio:  z.number().int().min(1990).max(new Date().getFullYear() + 1),
  anioFin:     z.number().int().min(1990).max(new Date().getFullYear() + 5).optional().nullable(),
  estado:      z.enum(["En curso", "Finalizado", "Abandonado"]).default("En curso"),
}).refine(
  d => {
    if (!d.anioFin) return true;
    return d.anioFin >= d.anioInicio;
  },
  { message: "El año de finalización no puede ser anterior al de inicio", path: ["anioFin"] }
);

// ── Usuario ───────────────────────────────────────────────────────────────────
export const usuarioSchema = z.object({
  correo:   z.string().email("Correo inválido").max(150),
  password: z.string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  confirmarPassword: z.string(),
  rol:               z.enum(["admin", "egresado"]),
  estado:            z.enum(["activo", "inactivo", "bloqueado"]),
  idEgresado:        z.number().int().positive().optional().nullable(),
}).refine(d => d.password === d.confirmarPassword, {
  message: "Las contraseñas no coinciden", path: ["confirmarPassword"],
});

export const usuarioEditSchema = z.object({
  rol:           z.enum(["admin", "egresado"]),
  estado:        z.enum(["activo", "inactivo", "bloqueado"]),
  idEgresado:    z.number().int().positive().optional().nullable(),
  nuevaPassword: z.string().min(8).optional().or(z.literal("")),
});

export const nuevaPasswordSchema = z.object({
  correo:            z.string().email(),
  codigo:            z.string().length(6, "El código debe tener 6 dígitos"),
  nuevaPassword:     z.string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  confirmarPassword: z.string(),
  tipo:              z.enum(["primer_login", "reset_password"]),
}).refine(d => d.nuevaPassword === d.confirmarPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmarPassword"],
});

export const contactoSchema = z.object({
  tipo:  z.enum(["correo", "celular"]),
  valor: z.string().min(1, "Requerido"),
}).refine(d => {
  if (d.tipo === "correo")  return z.string().email().safeParse(d.valor).success;
  if (d.tipo === "celular") return /^[0-9]{7,15}$/.test(d.valor);
  return false;
}, { message: "Valor inválido para el tipo seleccionado", path: ["valor"] });

export const noticiaSchema = z.object({
  titulo:    z.string().min(3, "Mínimo 3 caracteres").max(200),
  cuerpo:    z.string().min(10, "Mínimo 10 caracteres"),
  tipo:      z.enum(["noticia_institucional", "curso_evento", "noticia_social"]),
  fecha:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  imagenUrl: z.string().url("URL inválida").max(500).optional().nullable(),
  publicado: z.boolean().default(false),
});

export const sugerenciaSchema = z.object({
  tipo:      z.string().min(1).max(100),
  mensaje:   z.string().min(10, "Mínimo 10 caracteres").max(2000),
  esAnonima: z.boolean().default(false),
});

// ── Tipos exportados ──────────────────────────────────────────────────────────
export type LoginInput         = z.infer<typeof loginSchema>;
export type EgresadoInput      = z.infer<typeof egresadoSchema>;
export type HistorialInput     = z.infer<typeof historialSchema>;
export type PostgradoInput     = z.infer<typeof postgradoSchema>;
export type UsuarioInput       = z.infer<typeof usuarioSchema>;
export type UsuarioEditInput   = z.infer<typeof usuarioEditSchema>;
export type NuevaPasswordInput = z.infer<typeof nuevaPasswordSchema>;
export type ContactoInput      = z.infer<typeof contactoSchema>;
export type NoticiaInput       = z.infer<typeof noticiaSchema>;
export type SugerenciaInput    = z.infer<typeof sugerenciaSchema>;