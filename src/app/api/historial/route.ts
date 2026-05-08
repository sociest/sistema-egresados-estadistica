// src/app/api/historial/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { historialLaboral } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

// ingresoAproximado eliminado del schema interno
const historialFormSchema = z.object({
  idEgresado:         z.number().int().positive(),
  empresa:            z.string().min(2).max(150),
  cargo:              z.string().min(2).max(100),
  area:               z.string().max(100).optional().nullable(),
  tipoContrato:       z.enum(["Indefinido","Fijo","Por obra","Consultor","Pasante","Otro"]).optional().nullable(),
  ciudadRegionTrabajo: z.string().max(150).optional().nullable(),
  sectorTrabajo:       z.enum(["Publico","Privado","Independiente","ONG","Otro"]).optional().nullable(),
  fechaInicio:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fechaFin:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  actualmenteTrabaja: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return err("No autorizado", 401);

    const idEgresado = parseInt(new URL(req.url).searchParams.get("idEgresado") ?? "");
    if (isNaN(idEgresado)) return err("idEgresado requerido");

    if (session.rol === "egresado" && session.idEgresado !== idEgresado)
      return err("No autorizado", 403);

const rows = await db.select({
  id:                  historialLaboral.id,
  idEgresado:          historialLaboral.idEgresado,
  empresa:             historialLaboral.empresa,
  cargo:               historialLaboral.cargo,
  area:                historialLaboral.area,
  fechaInicio:         historialLaboral.fechaInicio,
  fechaFin:            historialLaboral.fechaFin,
  tipoContrato:        historialLaboral.tipoContrato,
  ciudadRegionTrabajo: historialLaboral.ciudadRegionTrabajo,
  sectorTrabajo:       historialLaboral.sectorTrabajo,
  ultimaActualizacion: historialLaboral.ultimaActualizacion,
  creadoEn:            historialLaboral.creadoEn,
})
    .from(historialLaboral)
    .where(eq(historialLaboral.idEgresado, idEgresado))
    .orderBy(desc(historialLaboral.fechaInicio));

    return ok(rows);
  } catch (e) { console.error(e); return err("Error", 500); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return err("No autorizado", 401);

    const formData = await req.formData();

    const raw = {
      idEgresado:         parseInt(formData.get("idEgresado") as string),
      empresa:            formData.get("empresa") as string,
      cargo:              formData.get("cargo") as string,
      area:               formData.get("area") as string || null,
      tipoContrato:       formData.get("tipoContrato") as string || null,
      ciudadRegionTrabajo: formData.get("ciudadRegionTrabajo") as string || null,
      sectorTrabajo:       formData.get("sectorTrabajo")       as string || null,
      fechaInicio:        formData.get("fechaInicio") as string,
      fechaFin:           formData.get("fechaFin") as string || null,
      actualmenteTrabaja: formData.get("actualmenteTrabaja") === "true",
    };

    const parsed = historialFormSchema.safeParse(raw);
    if (!parsed.success) return err(parsed.error.errors[0].message);

    const d = parsed.data;
    if (session.rol === "egresado" && session.idEgresado !== d.idEgresado)
      return err("No autorizado", 403);

    const fechaFin = d.actualmenteTrabaja ? null : (d.fechaFin ?? null);

    const [row] = await db.insert(historialLaboral).values({
      idEgresado:   d.idEgresado,
      empresa:      d.empresa,
      cargo:        d.cargo,
      area:         d.area ?? null,
      tipoContrato: (d.tipoContrato as any) ?? null,
      ciudadRegionTrabajo: d.ciudadRegionTrabajo ?? null,
      sectorTrabajo:       (d.sectorTrabajo as any) ?? null,
      fechaInicio:  d.fechaInicio,
      fechaFin,
    }).returning({
      id:      historialLaboral.id,
      empresa: historialLaboral.empresa,
      cargo:   historialLaboral.cargo,
    });

    return ok(row, 201);
  } catch (e) { console.error(e); return err("Error al crear historial", 500); }
}