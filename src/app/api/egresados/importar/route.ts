import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { egresado, usuario } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";
import { ok, err } from "@/lib/utils";
import * as XLSX from "xlsx";
import { z } from "zod";

// Schema de validación para cada fila
const filaSchema = z.object({
  tipo:                z.enum(["Titulado", "Egresado"]).default("Titulado"),
  nombres:             z.string().min(2).max(100),
  apellidoPaterno:     z.string().max(100).optional().nullable(),
  apellidoMaterno:     z.string().max(100).optional().nullable(),
  ci:                  z.string().min(4).max(20),
  fechaNacimiento:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  genero:              z.enum(["Masculino", "Femenino", "Otro", "Prefiero no decir"]).optional().nullable(),
  correoElectronico:   z.string().email().max(150).optional().nullable(),
  celular:             z.string().max(20).optional().nullable(),
  anioIngreso:         z.number().int().min(1990).max(2030).optional().nullable(),
  anioEgreso:          z.number().int().min(1990).max(2030).optional().nullable(),
  anioTitulacion:      z.number().int().min(1990).max(2030).optional().nullable(),
  modalidadTitulacion: z.enum(["Tesis", "Proyecto de grado", "Trabajo dirigido", "Excelencia"]).optional().nullable(),
  areaEspecializacion: z.string().max(150).optional().nullable(),
  lugarResidencia:     z.string().max(200).optional().nullable(),
  facebook:            z.string().max(200).optional().nullable(),
  linkedin:            z.string().max(200).optional().nullable(),
  observaciones:       z.string().optional().nullable(),
  inicioProceso:       z.boolean().optional().nullable(),
  motivoNoTitulacion:  z.string().max(500).optional().nullable(),
  planeaTitularse:     z.boolean().optional().nullable(),
}).refine(d => {
  if (d.tipo === "Titulado" && !d.anioTitulacion) return false;
  return true;
}, { message: "Un Titulado debe tener año de titulación", path: ["anioTitulacion"] });

// Normaliza el valor de una celda a string limpio
function celda(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

// Convierte fechas de Excel (número serial) o strings a YYYY-MM-DD
function parseFecha(val: any): string | null {
  if (!val) return null;
  // Si es número (serial de Excel)
  if (typeof val === "number") {
    const date = XLSX.SSF.parse_date_code(val);
    if (!date) return null;
    const m = String(date.m).padStart(2, "0");
    const d = String(date.d).padStart(2, "0");
    return `${date.y}-${m}-${d}`;
  }
  const s = String(val).trim();
  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/");
    return `${y}-${m}-${d}`;
  }
  // Formato DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split("-");
    return `${y}-${m}-${d}`;
  }
  return null;
}

function parseBooleano(val: any): boolean | null {
  if (val === null || val === undefined || val === "") return null;
  const s = String(val).trim().toLowerCase();
  if (["si", "sí", "yes", "1", "true", "verdadero"].includes(s)) return true;
  if (["no", "0", "false", "falso"].includes(s)) return false;
  return null;
}

function parseEntero(val: any): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = parseInt(String(val).trim());
  return isNaN(n) ? null : n;
}

// Mapeo de encabezados flexibles a campos internos
const HEADER_MAP: Record<string, string> = {
  // tipo
  "tipo": "tipo",
  // nombres
  "nombres": "nombres",
  "nombre": "nombres",
  // apellidos
  "apellido paterno": "apellidoPaterno",
  "apellidopaterno": "apellidoPaterno",
  "ap. paterno": "apellidoPaterno",
  "apellido materno": "apellidoMaterno",
  "apellidomaterno": "apellidoMaterno",
  "ap. materno": "apellidoMaterno",
  // ci
  "ci": "ci",
  "carnet": "ci",
  "carnet de identidad": "ci",
  // fecha nacimiento
  "fecha nacimiento": "fechaNacimiento",
  "fechanacimiento": "fechaNacimiento",
  "fecha de nacimiento": "fechaNacimiento",
  "nacimiento": "fechaNacimiento",
  // genero
  "genero": "genero",
  "género": "genero",
  "sexo": "genero",
  // contacto
  "correo": "correoElectronico",
  "correo electronico": "correoElectronico",
  "correo electrónico": "correoElectronico",
  "email": "correoElectronico",
  "celular": "celular",
  "telefono": "celular",
  "teléfono": "celular",
  // académico
  "año ingreso": "anioIngreso",
  "anio ingreso": "anioIngreso",
  "aniоingreso": "anioIngreso",
  "año de ingreso": "anioIngreso",
  "año egreso": "anioEgreso",
  "anio egreso": "anioEgreso",
  "año de egreso": "anioEgreso",
  "año titulacion": "anioTitulacion",
  "año titulación": "anioTitulacion",
  "anio titulacion": "anioTitulacion",
  "año de titulacion": "anioTitulacion",
  "año de titulación": "anioTitulacion",
  "modalidad": "modalidadTitulacion",
  "modalidad titulacion": "modalidadTitulacion",
  "modalidad titulación": "modalidadTitulacion",
  // especialización
  "area especializacion": "areaEspecializacion",
  "área de especialización": "areaEspecializacion",
  "area": "areaEspecializacion",
  // residencia
  "lugar residencia": "lugarResidencia",
  "lugar de residencia": "lugarResidencia",
  "ciudad": "lugarResidencia",
  "ciudad residencia": "lugarResidencia",
  "departamento": "lugarResidencia",
  "region": "lugarResidencia",
  // redes
  "facebook": "facebook",
  "linkedin": "linkedin",
  "observaciones": "observaciones",
  // egresado sin título
  "inicio proceso": "inicioProceso",
  "inicio proceso titulacion": "inicioProceso",
  "planea titularse": "planeaTitularse",
  "motivo no titulacion": "motivoNoTitulacion",
  "motivo no titulación": "motivoNoTitulacion",
};

function normalizarHeader(h: string): string {
  return h.toLowerCase().trim().replace(/\s+/g, " ");
}

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

    // Leer el archivo
    const buffer     = await archivo.arrayBuffer();
    const workbook   = XLSX.read(buffer, { type: "array", cellDates: false });
    const sheetName  = workbook.SheetNames[0];
    const worksheet  = workbook.Sheets[sheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    if (rawRows.length < 2) {
      return err("El archivo está vacío o solo tiene encabezados");
    }

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

    if (dataRows.length === 0) {
      return err("El archivo no tiene filas de datos");
    }
    if (dataRows.length > 500) {
      return err("Máximo 500 filas por importación");
    }

    const importados: number[] = [];
    const errores: { fila: number; ci?: string; errores: string[] }[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row    = dataRows[i] as any[];
      const fila   = i + 2; // +2 porque fila 1 = encabezados, +1 por 1-indexed
      const objeto: Record<string, any> = {};

      // Mapear cada celda al campo correspondiente
      row.forEach((val, idx) => {
        const campo = camposPorIndex[idx];
        if (!campo) return;

        if (["anioIngreso", "anioEgreso", "anioTitulacion"].includes(campo)) {
          objeto[campo] = parseEntero(val);
        } else if (["inicioProceso", "planeaTitularse"].includes(campo)) {
          objeto[campo] = parseBooleano(val);
        } else if (campo === "fechaNacimiento") {
          objeto[campo] = parseFecha(val) ?? celda(val);
        } else {
          const s = celda(val);
          objeto[campo] = s === "" ? null : s;
        }
      });

      // Valores por defecto
      if (!objeto.tipo) objeto.tipo = "Titulado";
      if (!objeto.nombres) {
        errores.push({ fila, ci: objeto.ci, errores: ["El campo 'Nombres' es obligatorio"] });
        continue;
      }
      if (!objeto.ci) {
        errores.push({ fila, errores: ["El campo 'CI' es obligatorio"] });
        continue;
      }
      if (!objeto.fechaNacimiento) {
        errores.push({ fila, ci: objeto.ci, errores: ["El campo 'Fecha Nacimiento' es obligatorio (YYYY-MM-DD)"] });
        continue;
      }

      // Validar con Zod
      const parsed = filaSchema.safeParse(objeto);
      if (!parsed.success) {
        errores.push({
          fila,
          ci: objeto.ci,
          errores: parsed.error.errors.map(e => `${e.path.join(".")}: ${e.message}`),
        });
        continue;
      }

      const d = parsed.data;

      // Verificar CI duplicado en BD
      try {
        const [existeCi] = await db.select({ id: egresado.id })
          .from(egresado).where(eq(egresado.ci, d.ci)).limit(1);

        if (existeCi) {
          errores.push({ fila, ci: d.ci, errores: [`Ya existe un egresado con CI ${d.ci}`] });
          continue;
        }

        const apellidos = [d.apellidoPaterno, d.apellidoMaterno]
          .filter(Boolean).join(" ") || d.nombres;

        const [nuevoEgresado] = await db.insert(egresado).values({
          tipo:                d.tipo,
          nombres:             d.nombres,
          apellidos,
          apellidoPaterno:     d.apellidoPaterno ?? null,
          apellidoMaterno:     d.apellidoMaterno ?? null,
          ci:                  d.ci,
          genero:              (d.genero as any) ?? null,
          correoElectronico:   d.correoElectronico ?? null,
          celular:             d.celular ?? null,
          telefono:            d.celular ?? null,
          fechaNacimiento:     d.fechaNacimiento,
          fechaGraduacion:     d.anioTitulacion
            ? `${d.anioTitulacion}-01-01`
            : d.fechaNacimiento,
          anioIngreso:         d.anioIngreso ?? null,
          anioEgreso:          d.anioEgreso ?? null,
          anioTitulacion:      d.anioTitulacion ?? null,
          modalidadTitulacion: (d.modalidadTitulacion as any) ?? null,
          facebook:            d.facebook ?? null,
          linkedin:            d.linkedin ?? null,
          areaEspecializacion: d.areaEspecializacion ?? null,
          observaciones:       d.observaciones ?? null,
          lugarResidencia:     d.lugarResidencia ?? null,
          inicioProceso:       d.tipo === "Egresado" ? (d.inicioProceso ?? null) : null,
          motivoNoTitulacion:  d.tipo === "Egresado" ? (d.motivoNoTitulacion ?? null) : null,
          planeaTitularse:     d.tipo === "Egresado" ? (d.planeaTitularse ?? null) : null,
        }).returning({ id: egresado.id });

        // Crear usuario asociado con CI como contraseña inicial
        if (nuevoEgresado) {
          const passwordHash = await hashPassword(d.ci);
          await db.insert(usuario).values({
            ci:           d.ci,
            correo:       d.correoElectronico ?? `${d.ci}@sin-correo.local`,
            passwordHash,
            rol:          "egresado",
            estado:       "activo",
            idEgresado:   nuevoEgresado.id,
            primerLogin:  true,
            correoVerificado:  false,
            celularVerificado: false,
          }).onConflictDoNothing();

          importados.push(nuevoEgresado.id);
        }
      } catch (e: any) {
        if (e.code === "23505") {
          errores.push({ fila, ci: objeto.ci, errores: [`CI duplicado: ${objeto.ci}`] });
        } else {
          errores.push({ fila, ci: objeto.ci, errores: [`Error interno al insertar: ${e.message}`] });
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

// GET — descargar plantilla Excel
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "admin") return err("No autorizado", 403);

  const wb = XLSX.utils.book_new();

  // ── Hoja de datos ─────────────────────────────────────────────────────────
  const encabezados = [
    "Tipo",
    "Nombres",
    "Apellido Paterno",
    "Apellido Materno",
    "CI",
    "Fecha Nacimiento",
    "Genero",
    "Correo Electronico",
    "Celular",
    "Plan de Estudios",
    "Año Ingreso",
    "Año Egreso",
    "Año Titulacion",
    "Modalidad Titulacion",
    "Titulo Academico",
    "Area Especializacion",
    "Ciudad Residencia",
    "Region Residencia",
    "Facebook",
    "LinkedIn",
    "Observaciones",
    "Inicio Proceso",
    "Planea Titularse",
    "Motivo No Titulacion",
  ];

  const ejemploTitulado = [
    "Titulado",
    "Carlos Alberto",
    "Mamani",
    "Quispe",
    "12345678",
    "1990-03-15",
    "Masculino",
    "carlos@ejemplo.com",
    "71234567",
    "Av. Arce 123, La Paz",
    "2008",
    "2008",
    "2014",
    "2016",
    "Tesis",
    "Lic. en Estadística",
    "Estadística oficial",
    "La Paz",
    "La Paz",
    "",
    "https://linkedin.com/in/carlos",
    "",
    "",
    "",
    "",
  ];

  const ejemploEgresado = [
    "Egresado",
    "María Elena",
    "Flores",
    "Condori",
    "87654321",
    "1994-07-22",
    "Femenino",
    "maria@ejemplo.com",
    "78765432",
    "Calle Potosí 456, La Paz",
    "2020",
    "2015",
    "2021",
    "",
    "",
    "",
    "Análisis de datos",
    "La Paz",
    "La Paz",
    "",
    "",
    "Trabajando a tiempo completo",
    "Sí",
    "Sí",
    "Dificultades económicas",
  ];

  const wsData = XLSX.utils.aoa_to_sheet([encabezados, ejemploTitulado, ejemploEgresado]);

  // Ancho de columnas
  wsData["!cols"] = [
    {wch:12},{wch:20},{wch:18},{wch:18},{wch:14},{wch:16},{wch:12},{wch:26},
    {wch:13},{wch:22},{wch:14},{wch:12},{wch:12},{wch:14},{wch:20},{wch:22},
    {wch:22},{wch:16},{wch:16},{wch:24},{wch:28},{wch:24},{wch:14},{wch:14},{wch:26},
  ];

  XLSX.utils.book_append_sheet(wb, wsData, "Datos");

  // ── Hoja de instrucciones ─────────────────────────────────────────────────
  const instrucciones = [
    ["INSTRUCCIONES DE IMPORTACIÓN"],
    [""],
    ["CAMPO", "REQUERIDO", "VALORES VÁLIDOS / FORMATO"],
    ["Tipo", "Sí", "Titulado | Egresado"],
    ["Nombres", "Sí", "Texto libre"],
    ["Apellido Paterno", "No", "Texto libre"],
    ["Apellido Materno", "No", "Texto libre"],
    ["CI", "Sí", "Texto, mínimo 4 caracteres, único en el sistema"],
    ["Fecha Nacimiento", "Sí", "YYYY-MM-DD (ej: 1990-03-15) o DD/MM/YYYY"],
    ["Genero", "No", "Masculino | Femenino | Otro | Prefiero no decir"],
    ["Correo Electronico", "No", "Formato email válido"],
    ["Celular", "No", "Texto (ej: 71234567)"],
    ["Plan de Estudios", "No", "1994 | 2008 | 2020"],
    ["Año Ingreso", "No", "Número (ej: 2010)"],
    ["Año Egreso", "No", "Número (ej: 2015)"],
    ["Año Titulacion", "Si para Titulado", "Número (ej: 2016)"],
    ["Modalidad Titulacion", "No", "Tesis | Proyecto de grado | Trabajo dirigido | Excelencia"],
    ["Titulo Academico", "No", "Texto (ej: Lic. en Estadística)"],
    ["Area Especializacion", "No", "Texto libre"],
    ["Ciudad Residencia", "No", "Texto (ej: La Paz)"],
    ["Region Residencia", "No", "Texto (ej: La Paz, Cochabamba...)"],
    ["Facebook", "No", "URL o nombre de usuario"],
    ["LinkedIn", "No", "URL del perfil"],
    ["Observaciones", "No", "Texto libre"],
    ["Inicio Proceso", "Solo Egresado", "Sí | No"],
    ["Planea Titularse", "Solo Egresado", "Sí | No"],
    ["Motivo No Titulacion", "Solo Egresado", "Texto libre"],
    [""],
    ["NOTAS IMPORTANTES:"],
    ["- La primera fila debe contener los encabezados exactamente como se muestran arriba (o similares)"],
    ["- Los campos marcados como 'Sí' para Titulado son obligatorios si Tipo = Titulado"],
    ["- Se creará un usuario automáticamente con el CI como contraseña inicial"],
    ["- Si un CI ya existe en el sistema, esa fila se omitirá y se reportará como error"],
    ["- Máximo 500 filas por importación"],
    ["- Formatos de fecha aceptados: YYYY-MM-DD o DD/MM/YYYY"],
  ];

  const wsInstr = XLSX.utils.aoa_to_sheet(instrucciones);
  wsInstr["!cols"] = [{wch:26}, {wch:18}, {wch:55}];
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instrucciones");

  const buf  = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new Response(buf, {
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla_importacion_egresados.xlsx"',
    },
  });
}