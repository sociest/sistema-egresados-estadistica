import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { ok, err } from "@/lib/utils";

export async function GET() {
  try {
    const resultado = await db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM egresado WHERE tipo = 'Titulado' AND fallecido = false)
          AS "totalTitulados",
        (SELECT COUNT(*)::int FROM egresado WHERE tipo = 'Egresado' AND fallecido = false)
          AS "totalEgresados",
        (SELECT COUNT(*)::int FROM egresado WHERE tipo = 'Titulado' AND fallecido = false
          AND EXISTS(
            SELECT 1 FROM historial_laboral h
            WHERE h.id_egresado = egresado.id AND h.fecha_fin IS NULL
          )
        ) AS "tituladosConEmpleo",
        (SELECT ROUND(AVG((anio_titulacion - anio_egreso) * 12)::numeric, 1)
          FROM egresado
          WHERE anio_titulacion IS NOT NULL AND anio_egreso IS NOT NULL
            AND anio_titulacion >= anio_egreso AND fallecido = false
        ) AS "tiempoPromedioTitulacion",
        (SELECT ROUND(AVG(
            EXTRACT(YEAR FROM h.fecha_inicio::date) * 12 +
            EXTRACT(MONTH FROM h.fecha_inicio::date) -
            (e.anio_egreso * 12)
          )::numeric, 1)
          FROM egresado e
          INNER JOIN LATERAL (
            SELECT fecha_inicio FROM historial_laboral
            WHERE id_egresado = e.id ORDER BY fecha_inicio ASC LIMIT 1
          ) h ON true
          WHERE e.anio_egreso IS NOT NULL AND e.fallecido = false
            AND (
              EXTRACT(YEAR FROM h.fecha_inicio::date) * 12 +
              EXTRACT(MONTH FROM h.fecha_inicio::date)
            ) >= e.anio_egreso * 12
        ) AS "tiempoPromedioInsercion"
    `);

    const k = (resultado as any).rows?.[0] ?? {};

    const totalTitulados   = parseInt(k.totalTitulados   ?? 0);
    const tituladosConEmpleo = parseInt(k.tituladosConEmpleo ?? 0);
    const tasaEmpleabilidad = totalTitulados > 0
      ? Math.round((tituladosConEmpleo / totalTitulados) * 100)
      : 0;

    return ok({
      totalTitulados,
      totalEgresados:          parseInt(k.totalEgresados ?? 0),
      tasaEmpleabilidad,
      tiempoPromedioTitulacion: parseFloat(k.tiempoPromedioTitulacion ?? 0) || 0,
      tiempoPromedioInsercion:  parseFloat(k.tiempoPromedioInsercion  ?? 0) || 0,
    });
  } catch (e) {
    console.error("[stats/publicos]", e);
    return err("Error al obtener estadísticas", 500);
  }
}