import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { egresado, usuario } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";
import { ok, err } from "@/lib/utils";
import * as XLSX from "xlsx";
import { z } from "zod";

// ── Schema de validación por fila ─────────────────────────────────────────────
const filaSchema = z.object({
  nombres:             z.string().min(2).max(100),
  apellidoPaterno:     z.string().max(100).optional().nullable(),
  apellidoMaterno:     z.string().max(100).optional().nullable(),
  ci:                  z.string().min(4).max(20),
  genero:              z.enum(["Masculino", "Femenino", "Otro", "Prefiero no decir"]).optional().nullable(),
  semestreIngreso:     z.string().optional().nullable(),
  semestreEgreso:      z.string().optional().nullable(),
  anioIngreso:         z.number().int().optional().nullable(),
  anioEgreso:          z.number().int().optional().nullable(),
  esTitulado:          z.boolean(),
  anioTitulacion:      z.number().int().min(1990).max(2030).optional().nullable(),
  modalidadTitulacion: z.enum(["Tesis", "Proyecto de grado", "Trabajo dirigido", "Examen de grado", "Otro"]).optional().nullable(),
  areaEspecializacion: z.string().max(150).optional().nullable(),
  correoElectronico:   z.string().email().max(150).optional().nullable(),
  celular:             z.string().max(20).optional().nullable(),
  lugarResidencia:     z.string().max(200).optional().nullable(),
  observaciones:       z.string().optional().nullable(),
}).refine(d => {
  if (d.esTitulado && !d.anioTitulacion) return false;
  return true;
}, { message: "Un titulado debe tener año de titulación", path: ["anioTitulacion"] });

// ── Helpers ───────────────────────────────────────────────────────────────────
function celda(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

// Parsea semestre "I/2020" o "II/2020" → { semestre: "I", anio: 2020 }
function parseSemestre(val: any): { semestre: string; anio: number } | null {
  const s = celda(val);
  if (!s) return null;
  const match = s.match(/^(I{1,2})\/(\d{4})$/);
  if (!match) return null;
  return { semestre: match[1], anio: parseInt(match[2]) };
}

function parseBooleano(val: any): boolean | null {
  if (val === null || val === undefined || val === "") return null;
  const s = celda(val).toLowerCase();
  if (["si", "sí", "yes", "1", "true"].includes(s)) return true;
  if (["no", "0", "false"].includes(s)) return false;
  return null;
}

function parseEntero(val: any): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = parseInt(String(val).trim());
  return isNaN(n) ? null : n;
}

function normalizarHeader(h: string): string {
  return h.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/\s+/g, " ");
}

// Mapeo flexible de encabezados
const HEADER_MAP: Record<string, string> = {
  "nombres":                  "nombres",
  "nombre":                   "nombres",
  "apellido paterno":         "apellidoPaterno",
  "apellidopaterno":          "apellidoPaterno",
  "ap. paterno":              "apellidoPaterno",
  "apellido materno":         "apellidoMaterno",
  "apellidomaterno":          "apellidoMaterno",
  "ap. materno":              "apellidoMaterno",
  "ci":                       "ci",
  "carnet":                   "ci",
  "carnet de identidad":      "ci",
  "genero":                   "genero",
  "sexo":                     "genero",
  "semestre de ingreso":      "semestreIngreso",
  "semestreingreso":          "semestreIngreso",
  "semestre ingreso":         "semestreIngreso",
  "semestre de egreso":       "semestreEgreso",
  "semestreegreso":           "semestreEgreso",
  "semestre egreso":          "semestreEgreso",
  "es titulado":              "esTitulado",
  "estitulado":               "esTitulado",
  "titulado":                 "esTitulado",
  "ano de titulacion":        "anioTitulacion",
  "anio titulacion":          "anioTitulacion",
  "ano titulacion":           "anioTitulacion",
  "modalidad":                "modalidadTitulacion",
  "modalidad titulacion":     "modalidadTitulacion",
  "modalidad de titulacion":  "modalidadTitulacion",
  "area de especializacion":  "areaEspecializacion",
  "area especializacion":     "areaEspecializacion",
  "especializacion":          "areaEspecializacion",
  "correo":                   "correoElectronico",
  "correo electronico":       "correoElectronico",
  "email":                    "correoElectronico",
  "celular":                  "celular",
  "telefono":                 "celular",
  "lugar de residencia":      "lugarResidencia",
  "lugar residencia":         "lugarResidencia",
  "residencia":               "lugarResidencia",
  "observaciones":            "observaciones",
};

// ── POST — importar archivo ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);

    const formData = await req.formData();
    const archivo  = formData.get("archivo") as File | null;
    if (!archivo) return err("No se recibió ningún archivo");

    const ext = archivo.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
      return err("Solo se aceptan archivos .xlsx, .xls o .csv");
    }
    if (archivo.size > 10 * 1024 * 1024) {
      return err("El archivo no puede superar los 10MB");
    }

    const buffer    = await archivo.arrayBuffer();
    const workbook  = XLSX.read(buffer, { type: "array", cellDates: false });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    if (rawRows.length < 2) return err("El archivo está vacío o solo tiene encabezados");

    // Mapear encabezados
    const headers: string[] = (rawRows[0] as any[]).map(h => normalizarHeader(String(h)));
    const camposPorIndex: Record<number, string> = {};
    headers.forEach((h, i) => {
      const campo = HEADER_MAP[h];
      if (campo) camposPorIndex[i] = campo;
    });

    const dataRows = rawRows.slice(1).filter(row =>
      (row as any[]).some(cell => cell !== "" && cell !== null && cell !== undefined)
    );

    if (dataRows.length === 0) return err("El archivo no tiene filas de datos");
    if (dataRows.length > 500) return err("Máximo 500 filas por importación");

    const importados: number[] = [];
    const errores: { fila: number; ci?: string; errores: string[] }[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row  = dataRows[i] as any[];
      const fila = i + 2;
      const obj: Record<string, any> = {};

      row.forEach((val, idx) => {
        const campo = camposPorIndex[idx];
        if (!campo) return;

        if (campo === "semestreIngreso" || campo === "semestreEgreso") {
          // Guardar el string completo para parsearlo después
          obj[campo] = celda(val) || null;
        } else if (campo === "esTitulado") {
          obj[campo] = parseBooleano(val);
        } else if (campo === "anioTitulacion") {
          obj[campo] = parseEntero(val);
        } else {
          const s = celda(val);
          obj[campo] = s === "" ? null : s;
        }
      });

      // Parsear semestres y extraer años
      if (obj.semestreIngreso) {
        const parsed = parseSemestre(obj.semestreIngreso);
        if (parsed) {
          obj.anioIngreso     = parsed.anio;
          obj.semestreIngreso = parsed.semestre;
        } else {
          errores.push({ fila, ci: obj.ci, errores: [`Semestre de ingreso inválido: "${obj.semestreIngreso}". Usa formato I/2020 o II/2020`] });
          continue;
        }
      }

      if (obj.semestreEgreso) {
        const parsed = parseSemestre(obj.semestreEgreso);
        if (parsed) {
          obj.anioEgreso     = parsed.anio;
          obj.semestreEgreso = parsed.semestre;
        } else {
          errores.push({ fila, ci: obj.ci, errores: [`Semestre de egreso inválido: "${obj.semestreEgreso}". Usa formato I/2020 o II/2020`] });
          continue;
        }
      }

      // Valores por defecto
      if (!obj.nombres) {
        errores.push({ fila, ci: obj.ci, errores: ["El campo 'Nombres' es obligatorio"] });
        continue;
      }
      if (!obj.ci) {
        errores.push({ fila, errores: ["El campo 'CI' es obligatorio"] });
        continue;
      }
      if (obj.esTitulado === null || obj.esTitulado === undefined) {
        errores.push({ fila, ci: obj.ci, errores: ["El campo '¿Es titulado?' es obligatorio (Si / No)"] });
        continue;
      }

      // Validar con Zod
      const parsed = filaSchema.safeParse(obj);
      if (!parsed.success) {
        errores.push({
          fila,
          ci: obj.ci,
          errores: parsed.error.errors.map(e => `${e.path.join(".")}: ${e.message}`),
        });
        continue;
      }

      const d = parsed.data;

      try {
        const [existeCi] = await db.select({ id: egresado.id })
          .from(egresado).where(eq(egresado.ci, d.ci)).limit(1);

        if (existeCi) {
          errores.push({ fila, ci: d.ci, errores: [`Ya existe un egresado con CI ${d.ci}`] });
          continue;
        }

        const tipo = d.esTitulado ? "Titulado" : "Egresado";

        const [nuevoEgresado] = await db.insert(egresado).values({
          tipo:                tipo as any,
          nombres:             d.nombres,
          apellidoPaterno:     d.apellidoPaterno     ?? null,
          apellidoMaterno:     d.apellidoMaterno     ?? null,
          ci:                  d.ci,
          genero:              (d.genero as any)      ?? null,
          correoElectronico:   d.correoElectronico   ?? null,
          celular:             d.celular             ?? null,
          telefono:            d.celular             ?? null,
          fechaNacimiento:     "1900-01-01", // campo requerido, se puede actualizar después
          anioIngreso:         d.anioIngreso         ?? null,
          anioEgreso:          d.anioEgreso          ?? null,
          semestreIngreso:     d.semestreIngreso      ?? null,
          semestreEgreso:      d.semestreEgreso       ?? null,
          anioTitulacion:      d.esTitulado ? (d.anioTitulacion ?? null) : null,
          modalidadTitulacion: d.esTitulado ? ((d.modalidadTitulacion as any) ?? null) : null,
          areaEspecializacion: d.areaEspecializacion ?? null,
          lugarResidencia:     d.lugarResidencia     ?? null,
          observaciones:       d.observaciones       ?? null,
        }).returning({ id: egresado.id });

        if (nuevoEgresado) {
          const passwordHash = await hashPassword(d.ci);
          await db.insert(usuario).values({
            ci:                d.ci,
            correo:            d.correoElectronico ?? `${d.ci}@sin-correo.local`,
            passwordHash,
            rol:               "egresado",
            estado:            "activo",
            idEgresado:        nuevoEgresado.id,
            primerLogin:       true,
            correoVerificado:  false,
            celularVerificado: false,
          }).onConflictDoNothing();

          importados.push(nuevoEgresado.id);
        }
      } catch (e: any) {
        if (e.code === "23505") {
          errores.push({ fila, ci: obj.ci, errores: [`CI duplicado: ${obj.ci}`] });
        } else {
          errores.push({ fila, ci: obj.ci, errores: [`Error al insertar: ${e.message}`] });
        }
      }
    }

    return ok({
      importados:      importados.length,
      errores:         errores.length,
      totalProcesadas: dataRows.length,
      detalleErrores:  errores,
    });
  } catch (e: any) {
    console.error("[importar egresados]", e);
    return err("Error al procesar el archivo: " + e.message, 500);
  }
}

// ── GET — descargar plantilla ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "admin") return err("No autorizado", 403);

  const wb = XLSX.utils.book_new();

  // ── Hoja de datos ─────────────────────────────────────────────────────────
  const encabezados = [
    "Nombres",
    "Apellido Paterno",
    "Apellido Materno",
    "CI",
    "Género",
    "Semestre de Ingreso",
    "Semestre de Egreso",
    "¿Es titulado?",
    "Año de Titulación",
    "Modalidad",
    "Área de Especialización",
    "Correo Electrónico",
    "Celular",
    "Lugar de Residencia",
    "Observaciones",
  ];

  const ejemploTitulado = [
    "Carlos Alberto",
    "Mamani",
    "Quispe",
    "12345678",
    "Masculino",
    "I/2010",
    "II/2015",
    "Si",
    "2017",
    "Tesis",
    "Estadística oficial",
    "carlos@ejemplo.com",
    "71234567",
    "La Paz",
    "",
  ];

  const ejemploEgresado = [
    "María Elena",
    "Flores",
    "Condori",
    "87654321",
    "Femenino",
    "II/2015",
    "I/2021",
    "No",
    "",
    "",
    "Econometría",
    "maria@ejemplo.com",
    "78765432",
    "Cochabamba",
    "",
  ];

  const wsData = XLSX.utils.aoa_to_sheet([encabezados, ejemploTitulado, ejemploEgresado]);
  wsData["!cols"] = [
    {wch:20},{wch:18},{wch:18},{wch:14},{wch:14},{wch:18},{wch:16},
    {wch:14},{wch:18},{wch:20},{wch:24},{wch:26},{wch:13},{wch:18},{wch:20},
  ];
  XLSX.utils.book_append_sheet(wb, wsData, "Datos");

  // ── Hoja de instrucciones ─────────────────────────────────────────────────
  const instrucciones = [
    ["INSTRUCCIONES DE IMPORTACIÓN"],
    [""],
    ["CAMPO", "REQUERIDO", "VALORES VÁLIDOS / FORMATO"],
    ["Nombres",              "Sí",             "Texto libre"],
    ["Apellido Paterno",     "No",             "Texto libre"],
    ["Apellido Materno",     "No",             "Texto libre"],
    ["CI",                   "Sí",             "Texto único, mínimo 4 caracteres"],
    ["Género",               "No",             "Masculino | Femenino | Otro | Prefiero no decir"],
    ["Semestre de Ingreso",  "No",             "Formato I/AAAA o II/AAAA (ej: I/2010, II/2015)"],
    ["Semestre de Egreso",   "No",             "Formato I/AAAA o II/AAAA (ej: I/2020, II/2021)"],
    ["¿Es titulado?",        "Sí",             "Si | No"],
    ["Año de Titulación",    "Si es titulado", "Número (ej: 2018)"],
    ["Modalidad",            "No",             "Tesis | Proyecto de grado | Trabajo dirigido | Examen de grado | Otro"],
    ["Área de Especialización","No",           "Texto libre"],
    ["Correo Electrónico",   "No",             "Formato email válido"],
    ["Celular",              "No",             "Texto (ej: 71234567)"],
    ["Lugar de Residencia",  "No",             "Texto (ej: La Paz)"],
    ["Observaciones",        "No",             "Texto libre"],
    [""],
    ["NOTAS IMPORTANTES:"],
    ["- El semestre debe tener formato exacto: I/2020 o II/2020"],
    ["- El año de ingreso y egreso se extraen automáticamente del semestre"],
    ["- Si ¿Es titulado? = Si, debe completar el Año de Titulación"],
    ["- Se crea un usuario automáticamente con el CI como contraseña inicial"],
    ["- Si un CI ya existe en el sistema, esa fila se omitirá"],
    ["- Máximo 500 filas por importación"],
    ["- La fecha de nacimiento se puede actualizar después desde el perfil"],
  ];

  const wsInstr = XLSX.utils.aoa_to_sheet(instrucciones);
  wsInstr["!cols"] = [{wch:26}, {wch:16}, {wch:55}];
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instrucciones");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new Response(buf, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla_importacion_egresados.xlsx"',
    },
  });
}