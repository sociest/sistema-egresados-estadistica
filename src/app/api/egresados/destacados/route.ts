// src/app/api/egresados/destacados/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { egresado, historialLaboral } from "@/lib/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { ok, err } from "@/lib/utils";

export async function GET(_: NextRequest) {
  try {
    // Traer egresados visibles en directorio
    const egresados = await db.select({
      id:                  egresado.id,
      nombres:             egresado.nombres,
      apellidos:           egresado.apellidos,
      apellidoPaterno:     egresado.apellidoPaterno,
      apellidoMaterno:     egresado.apellidoMaterno,
      ultimaActualizacion: egresado.ultimaActualizacion,
    })
    .from(egresado)
    .where(and(eq(egresado.mostrarEnDirectorio, true), eq(egresado.fallecido, false)))
    .orderBy(sql`${egresado.ultimaActualizacion} DESC NULLS LAST`)
    .limit(6);

    if (egresados.length === 0) return ok([]);

    // Traer empleos actuales
    const ids = egresados.map(e => e.id);
    const empleos = await db.select({
      idEgresado: historialLaboral.idEgresado,
      cargo:      historialLaboral.cargo,
      empresa:    historialLaboral.empresa,
      ciudad:     historialLaboral.ciudadRegionTrabajo,
    })
    .from(historialLaboral)
    .where(
      and(
        sql`${historialLaboral.idEgresado} = ANY(${sql.raw(`ARRAY[${ids.join(",")}]`)})`,
        sql`${historialLaboral.fechaFin} IS NULL`
      )
    )
    .orderBy(desc(historialLaboral.fechaInicio));

    // El más reciente por egresado
    const empleoMap = new Map<number, typeof empleos[0]>();
    for (const e of empleos) {
      if (!empleoMap.has(e.idEgresado)) {
        empleoMap.set(e.idEgresado, e);
      }
    }

    const rows = egresados.map(eg => {
      const empleo = empleoMap.get(eg.id);
      return {
        ...eg,
        empleoActual: empleo ? `${empleo.cargo} — ${empleo.empresa}` : null,
        ciudadActual: empleo?.ciudad ?? null,
      };
    });

    return ok(rows);
  } catch (e) {
    console.error("[destacados]", e);
    return err("Error", 500);
  }
}