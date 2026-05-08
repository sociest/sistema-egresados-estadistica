import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { postgrado } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const postgradoFormSchema = z.object({
  idEgresado:  z.number().int().positive(),
  tipo:        z.enum(["Diplomado", "Especialidad", "Maestria", "Doctorado", "Postdoctorado", "Otro"]),
  institucion: z.string().min(2).max(200),
  pais:        z.string().min(2).max(100).default("Bolivia"),
  anioInicio:  z.number().int().min(1990).max(new Date().getFullYear() + 1),
  anioFin:     z.number().int().min(1990).optional().nullable(),
  estado:      z.enum(["En curso", "Finalizado", "Abandonado"]).default("En curso"),
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
      id:                  postgrado.id,
      idEgresado:          postgrado.idEgresado,
      tipo:                postgrado.tipo,
      institucion:         postgrado.institucion,
      pais:                postgrado.pais,
      anioInicio:          postgrado.anioInicio,
      anioFin:             postgrado.anioFin,
      estado:              postgrado.estado,
      ultimaActualizacion: postgrado.ultimaActualizacion,
      creadoEn:            postgrado.creadoEn,
    })
    .from(postgrado)
    .where(eq(postgrado.idEgresado, idEgresado))
    .orderBy(desc(postgrado.anioInicio));

    return ok(rows);
  } catch (e) { console.error(e); return err("Error", 500); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return err("No autorizado", 401);

    const body = await req.json();

    const parsed = postgradoFormSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message);

    const d = parsed.data;

    if (session.rol === "egresado" && session.idEgresado !== d.idEgresado)
      return err("No autorizado", 403);

    const [row] = await db.insert(postgrado).values({
      idEgresado:  d.idEgresado,
      tipo:        d.tipo,
      institucion: d.institucion,
      pais:        d.pais,
      anioInicio:  d.anioInicio,
      anioFin:     d.anioFin ?? null,
      estado:      d.estado,
    }).returning();

    return ok(row, 201);
  } catch (e) { console.error(e); return err("Error al crear postgrado", 500); }
}