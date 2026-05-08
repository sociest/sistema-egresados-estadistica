import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { egresado } from "@/lib/schema";
import { sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ok, err } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);

    const sp                  = new URL(req.url).searchParams;
    const anioTitulacionDesde = sp.get("anioTitulacionDesde");
    const anioTitulacionHasta = sp.get("anioTitulacionHasta");
    const sector              = sp.get("sector");
    const modalidad           = sp.get("modalidad");
    const tipo                = sp.get("tipo");

    // ── KPIs — siempre globales, sin filtros ──────────────────────────────
    const kpisResult = await db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM egresado WHERE tipo = 'Titulado')  AS "totalTitulados",
        (SELECT COUNT(*)::int FROM egresado WHERE tipo = 'Egresado')  AS "totalEgresados",
        (SELECT COUNT(*)::int FROM egresado WHERE tipo = 'Titulado' AND fallecido = false) AS "tituladosActivos",
        (SELECT COUNT(*)::int FROM egresado
          WHERE tipo = 'Titulado' AND fallecido = false
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

    // ── Gráfico 1: Graduados por año ──────────────────────────────────────
    // Filtros que aplican: anioDesde, anioHasta, tipo, modalidad
    const tituladosPorAnio = await db.execute(sql`
      SELECT
        anio_titulacion AS anio,
        COUNT(*)::int AS total,
        COUNT(CASE WHEN tipo = 'Titulado' THEN 1 END)::int AS titulados,
        COUNT(CASE WHEN tipo = 'Egresado' THEN 1 END)::int AS egresados
      FROM egresado
      WHERE anio_titulacion IS NOT NULL
        AND fallecido = false
        ${anioTitulacionDesde ? sql`AND anio_titulacion >= ${parseInt(anioTitulacionDesde)}` : sql``}
        ${anioTitulacionHasta ? sql`AND anio_titulacion <= ${parseInt(anioTitulacionHasta)}` : sql``}
        ${tipo     ? sql`AND tipo::text = ${tipo}`                         : sql``}
        ${modalidad ? sql`AND modalidad_titulacion::text = ${modalidad}`   : sql``}
      GROUP BY anio_titulacion
      ORDER BY anio_titulacion
    `);

    // ── Gráfico 2: Sector laboral ─────────────────────────────────────────
    // Filtros que aplican: tipo
    // El filtro "sector" NO se aplica aquí — no tendría sentido filtrar
    // "sector = Público" y que el gráfico solo muestre Público
    const porSector = await db.execute(sql`
      SELECT
        COALESCE(h.sector_trabajo::text, 'Sin especificar') AS sector,
        COUNT(DISTINCT e.id)::int AS cantidad
      FROM egresado e
      INNER JOIN historial_laboral h
        ON h.id_egresado = e.id AND h.fecha_fin IS NULL
      WHERE e.fallecido = false
        ${tipo ? sql`AND e.tipo::text = ${tipo}` : sql``}
      GROUP BY h.sector_trabajo
      ORDER BY cantidad DESC
    `);

    // ── Gráfico 3: Modalidad de titulación ────────────────────────────────
    // Filtros que aplican: tipo, anioDesde, anioHasta
    const porModalidad = await db.execute(sql`
      SELECT
        COALESCE(modalidad_titulacion::text, 'Sin especificar') AS modalidad,
        COUNT(*)::int AS cantidad
      FROM egresado
      WHERE fallecido = false
        ${tipo ? sql`AND tipo::text = ${tipo}` : sql``}
        ${anioTitulacionDesde ? sql`AND anio_titulacion >= ${parseInt(anioTitulacionDesde)}` : sql``}
        ${anioTitulacionHasta ? sql`AND anio_titulacion <= ${parseInt(anioTitulacionHasta)}` : sql``}
      GROUP BY modalidad_titulacion
      ORDER BY cantidad DESC
    `);

    // ── Gráfico 4a: Distribución geográfica — ciudad de trabajo ───────────
    // Filtros que aplican: tipo, sector
    const geoCiudad = await db.execute(sql`
      SELECT
        COALESCE(h.ciudad_region_trabajo, 'Sin especificar') AS ciudad,
        COUNT(DISTINCT e.id)::int AS cantidad
      FROM egresado e
      INNER JOIN historial_laboral h
        ON h.id_egresado = e.id AND h.fecha_fin IS NULL
      WHERE e.fallecido = false
        AND h.ciudad_region_trabajo IS NOT NULL AND h.ciudad_region_trabajo != ''
        ${tipo   ? sql`AND e.tipo::text = ${tipo}`             : sql``}
        ${sector ? sql`AND h.sector_trabajo::text = ${sector}`         : sql``}
      GROUP BY h.ciudad_region_trabajo
      ORDER BY cantidad DESC
      LIMIT 15
    `);

    // ── Gráfico 4b: Distribución geográfica — región de residencia ────────
    // Filtros que aplican: tipo
    const geoRegion = await db.execute(sql`
      SELECT
        COALESCE(e.lugar_residencia, 'Sin especificar') AS region,
        COUNT(DISTINCT e.id)::int AS cantidad
      FROM egresado e
      ${sector ? sql`
        INNER JOIN historial_laboral h
          ON h.id_egresado = e.id AND h.fecha_fin IS NULL
          AND h.sector_trabajo::text = ${sector}
      ` : sql``}
      WHERE e.fallecido = false
        ${tipo   ? sql`AND e.tipo::text = ${tipo}` : sql``}
      GROUP BY e.lugar_residencia
      ORDER BY cantidad DESC
      LIMIT 10
    `);

    // ── Tabla 5: Comparativo cohorte ──────────────────────────────────────
    // Filtros que aplican: tipo, anioDesde, anioHasta
    const cohorteComparativo = await db.execute(sql`
      SELECT
        anio_ingreso AS cohorte,
        COUNT(*)::int AS total,
        COUNT(CASE WHEN tipo = 'Titulado' THEN 1 END)::int AS titulados,
        COUNT(CASE WHEN tipo = 'Egresado' THEN 1 END)::int AS egresados,
        COUNT(CASE WHEN tipo = 'Titulado' AND EXISTS(
          SELECT 1 FROM historial_laboral h
          WHERE h.id_egresado = egresado.id AND h.fecha_fin IS NULL
        ) THEN 1 END)::int AS "tituladosConEmpleo",
        ROUND(
          100.0 * COUNT(CASE WHEN tipo = 'Titulado' THEN 1 END) /
          NULLIF(COUNT(*), 0), 1
        )::float AS "pctTitulados"
      FROM egresado
      WHERE anio_ingreso IS NOT NULL
        AND fallecido = false
        ${tipo ? sql`AND tipo::text = ${tipo}` : sql``}
        ${anioTitulacionDesde ? sql`AND anio_titulacion >= ${parseInt(anioTitulacionDesde)}` : sql``}
        ${anioTitulacionHasta ? sql`AND anio_titulacion <= ${parseInt(anioTitulacionHasta)}` : sql``}
      GROUP BY anio_ingreso
      ORDER BY anio_ingreso DESC
      LIMIT 20
    `);

    const k = (kpisResult as any).rows?.[0] ?? {};
    const tituladosActivos   = parseInt(k.tituladosActivos ?? 0);
    const tituladosConEmpleo = parseInt(k.tituladosConEmpleo ?? 0);
    const tasaEmpleabilidad  = tituladosActivos > 0
      ? Math.round((tituladosConEmpleo / tituladosActivos) * 100)
      : 0;

    return ok({
      kpis: {
        totalTitulados:               parseInt(k.totalTitulados ?? 0),
        totalEgresados:               parseInt(k.totalEgresados ?? 0),
        tasaEmpleabilidadTitulados:   tasaEmpleabilidad,
        tiempoPromedioTitulacion:     parseFloat(k.tiempoPromedioTitulacion ?? 0) || 0,
        tiempoPromedioInsercion:      parseFloat(k.tiempoPromedioInsercion ?? 0) || 0,
        tituladosConEmpleo,
        tituladosActivos,
      },
      graficos: {
        tituladosPorAnio:   (tituladosPorAnio    as any).rows ?? [],
        porSector:          (porSector           as any).rows ?? [],
        porModalidad:       (porModalidad        as any).rows ?? [],
        geoCiudad:          (geoCiudad           as any).rows ?? [],
        geoRegion:          (geoRegion           as any).rows ?? [],
        cohorteComparativo: (cohorteComparativo  as any).rows ?? [],
      },
    });
  } catch (e) {
    console.error("[dashboard]", e);
    return err("Error al obtener datos del dashboard", 500);
  }
}