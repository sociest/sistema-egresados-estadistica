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

    const sp   = new URL(req.url).searchParams;
    const modo = (sp.get("modo") ?? "ambos") as "titulados" | "egresados" | "ambos";

    const anioTitulacionDesde = sp.get("anioTitulacionDesde");
    const anioTitulacionHasta = sp.get("anioTitulacionHasta");
    const anioEgresoDesde     = sp.get("anioEgresoDesde");
    const anioEgresoHasta     = sp.get("anioEgresoHasta");
    const sector              = sp.get("sector");
    const modalidad           = sp.get("modalidad");

    // ── Cláusulas de filtro reutilizables ────────────────────────────────
    const filtroTitulacion = sql`
      ${anioTitulacionDesde ? sql`AND anio_titulacion >= ${parseInt(anioTitulacionDesde)}` : sql``}
      ${anioTitulacionHasta ? sql`AND anio_titulacion <= ${parseInt(anioTitulacionHasta)}` : sql``}
    `;
    const filtroEgreso = sql`
      ${anioEgresoDesde ? sql`AND anio_egreso >= ${parseInt(anioEgresoDesde)}` : sql``}
      ${anioEgresoHasta ? sql`AND anio_egreso <= ${parseInt(anioEgresoHasta)}` : sql``}
    `;
    const filtroSectorEmpleo = sector
      ? sql`AND EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado = egresado.id AND h.fecha_fin IS NULL AND h.sector_trabajo::text = ${sector})`
      : sql``;
    const filtroModalidad = modalidad
      ? sql`AND modalidad_titulacion::text = ${modalidad}`
      : sql``;

    // ── KPIs ─────────────────────────────────────────────────────────────
    let kpisResult: any;

    if (modo === "titulados") {
      kpisResult = await db.execute(sql`
        SELECT
          (SELECT COUNT(*)::int FROM egresado WHERE tipo = 'Titulado' AND fallecido = false
            ${filtroTitulacion} ${filtroSectorEmpleo} ${filtroModalidad}
          ) AS "totalRegistrados",
          (SELECT COUNT(*)::int FROM egresado WHERE tipo = 'Titulado' AND fallecido = false
            ${filtroTitulacion} ${filtroSectorEmpleo} ${filtroModalidad}
            AND EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado = egresado.id AND h.fecha_fin IS NULL)
          ) AS "conEmpleo",
          (SELECT ROUND(AVG((anio_titulacion - anio_egreso) * 12)::numeric, 1)
            FROM egresado WHERE tipo = 'Titulado' AND fallecido = false
            AND anio_titulacion IS NOT NULL AND anio_egreso IS NOT NULL AND anio_titulacion >= anio_egreso
            ${filtroTitulacion} ${filtroModalidad}
          ) AS "tiempoPromedioTitulacion",
          (SELECT ROUND(AVG(
              EXTRACT(YEAR FROM h.fecha_inicio::date) * 12 + EXTRACT(MONTH FROM h.fecha_inicio::date)
              - (e.anio_titulacion * 12)
            )::numeric, 1)
            FROM egresado e
            INNER JOIN LATERAL (
              SELECT fecha_inicio FROM historial_laboral
              WHERE id_egresado = e.id ORDER BY fecha_inicio ASC LIMIT 1
            ) h ON true
            WHERE e.tipo = 'Titulado' AND e.fallecido = false AND e.anio_titulacion IS NOT NULL
            AND (EXTRACT(YEAR FROM h.fecha_inicio::date) * 12 + EXTRACT(MONTH FROM h.fecha_inicio::date)) >= e.anio_titulacion * 12
            ${filtroTitulacion} ${filtroModalidad}
          ) AS "tiempoPromedioInsercion"
      `);
    } else if (modo === "egresados") {
      kpisResult = await db.execute(sql`
        SELECT
          (SELECT COUNT(*)::int FROM egresado WHERE tipo = 'Egresado' AND fallecido = false
            ${filtroEgreso} ${filtroSectorEmpleo}
          ) AS "totalRegistrados",
          (SELECT COUNT(*)::int FROM egresado WHERE tipo = 'Egresado' AND fallecido = false
            ${filtroEgreso} ${filtroSectorEmpleo}
            AND EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado = egresado.id AND h.fecha_fin IS NULL)
          ) AS "conEmpleo",
          NULL::numeric AS "tiempoPromedioTitulacion",
          (SELECT ROUND(AVG(
              EXTRACT(YEAR FROM h.fecha_inicio::date) * 12 + EXTRACT(MONTH FROM h.fecha_inicio::date)
              - (e.anio_egreso * 12)
            )::numeric, 1)
            FROM egresado e
            INNER JOIN LATERAL (
              SELECT fecha_inicio FROM historial_laboral
              WHERE id_egresado = e.id ORDER BY fecha_inicio ASC LIMIT 1
            ) h ON true
            WHERE e.tipo = 'Egresado' AND e.fallecido = false AND e.anio_egreso IS NOT NULL
            AND (EXTRACT(YEAR FROM h.fecha_inicio::date) * 12 + EXTRACT(MONTH FROM h.fecha_inicio::date)) >= e.anio_egreso * 12
            ${filtroEgreso}
          ) AS "tiempoPromedioInsercion"
      `);
    } else {
      // ambos
      kpisResult = await db.execute(sql`
        SELECT
          (SELECT COUNT(*)::int FROM egresado WHERE fallecido = false
            ${filtroTitulacion} ${filtroSectorEmpleo} ${filtroModalidad}
          ) AS "totalRegistrados",
          (SELECT COUNT(*)::int FROM egresado WHERE fallecido = false
            ${filtroTitulacion} ${filtroSectorEmpleo} ${filtroModalidad}
            AND EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado = egresado.id AND h.fecha_fin IS NULL)
          ) AS "conEmpleo",
          (SELECT ROUND(AVG((anio_titulacion - anio_egreso) * 12)::numeric, 1)
            FROM egresado WHERE fallecido = false
            AND anio_titulacion IS NOT NULL AND anio_egreso IS NOT NULL AND anio_titulacion >= anio_egreso
            ${filtroTitulacion} ${filtroModalidad}
          ) AS "tiempoPromedioTitulacion",
          (SELECT ROUND(AVG(
              EXTRACT(YEAR FROM h.fecha_inicio::date) * 12 + EXTRACT(MONTH FROM h.fecha_inicio::date)
              - (COALESCE(e.anio_titulacion, e.anio_egreso) * 12)
            )::numeric, 1)
            FROM egresado e
            INNER JOIN LATERAL (
              SELECT fecha_inicio FROM historial_laboral
              WHERE id_egresado = e.id ORDER BY fecha_inicio ASC LIMIT 1
            ) h ON true
            WHERE e.fallecido = false AND COALESCE(e.anio_titulacion, e.anio_egreso) IS NOT NULL
            AND (EXTRACT(YEAR FROM h.fecha_inicio::date) * 12 + EXTRACT(MONTH FROM h.fecha_inicio::date)) >= COALESCE(e.anio_titulacion, e.anio_egreso) * 12
            ${filtroTitulacion} ${filtroModalidad}
          ) AS "tiempoPromedioInsercion"
      `);
    }

    const k = (kpisResult as any).rows?.[0] ?? {};
    const totalRegistrados = parseInt(k.totalRegistrados ?? 0);
    const conEmpleo        = parseInt(k.conEmpleo ?? 0);
    const tasaEmpleabilidad = totalRegistrados > 0
      ? Math.round((conEmpleo / totalRegistrados) * 100) : 0;

    // ── Gráfico 1: Por año ────────────────────────────────────────────────
    let porAnio: any[];
    if (modo === "titulados") {
      const r = await db.execute(sql`
        SELECT anio_titulacion AS anio, COUNT(*)::int AS total
        FROM egresado
        WHERE tipo = 'Titulado' AND fallecido = false AND anio_titulacion IS NOT NULL
        ${filtroTitulacion} ${filtroSectorEmpleo} ${filtroModalidad}
        GROUP BY anio_titulacion ORDER BY anio_titulacion
      `);
      porAnio = (r as any).rows ?? [];
    } else if (modo === "egresados") {
      const r = await db.execute(sql`
        SELECT anio_egreso AS anio, COUNT(*)::int AS total
        FROM egresado
        WHERE tipo = 'Egresado' AND fallecido = false AND anio_egreso IS NOT NULL
        ${filtroEgreso} ${filtroSectorEmpleo}
        GROUP BY anio_egreso ORDER BY anio_egreso
      `);
      porAnio = (r as any).rows ?? [];
    } else {
      const r = await db.execute(sql`
        SELECT
          COALESCE(anio_titulacion, anio_egreso) AS anio,
          COUNT(*)::int AS total,
          COUNT(CASE WHEN tipo = 'Titulado' THEN 1 END)::int AS titulados,
          COUNT(CASE WHEN tipo = 'Egresado' THEN 1 END)::int AS egresados
        FROM egresado
        WHERE fallecido = false AND COALESCE(anio_titulacion, anio_egreso) IS NOT NULL
        ${filtroTitulacion} ${filtroSectorEmpleo} ${filtroModalidad}
        GROUP BY COALESCE(anio_titulacion, anio_egreso)
        ORDER BY 1
      `);
      porAnio = (r as any).rows ?? [];
    }

    // ── Gráfico 2: Sector laboral ─────────────────────────────────────────
    const tipoFiltroSector = modo === "titulados" ? sql`AND e.tipo = 'Titulado'`
      : modo === "egresados" ? sql`AND e.tipo = 'Egresado'` : sql``;

    const filtroFechasSector = modo === "egresados"
      ? sql`${anioEgresoDesde ? sql`AND e.anio_egreso >= ${parseInt(anioEgresoDesde)}` : sql``} ${anioEgresoHasta ? sql`AND e.anio_egreso <= ${parseInt(anioEgresoHasta)}` : sql``}`
      : sql`${anioTitulacionDesde ? sql`AND e.anio_titulacion >= ${parseInt(anioTitulacionDesde)}` : sql``} ${anioTitulacionHasta ? sql`AND e.anio_titulacion <= ${parseInt(anioTitulacionHasta)}` : sql``}`;

    const porSectorResult = await db.execute(sql`
      SELECT
        COALESCE(h.sector_trabajo::text, 'Sin especificar') AS sector,
        COUNT(DISTINCT e.id)::int AS cantidad
      FROM egresado e
      INNER JOIN historial_laboral h ON h.id_egresado = e.id AND h.fecha_fin IS NULL
      WHERE e.fallecido = false
      ${tipoFiltroSector} ${filtroFechasSector}
      ${modalidad && modo !== "egresados" ? sql`AND e.modalidad_titulacion::text = ${modalidad}` : sql``}
      GROUP BY h.sector_trabajo ORDER BY cantidad DESC
    `);
    const porSector = (porSectorResult as any).rows ?? [];

    // ── Gráfico 3: Modalidad (solo titulados y ambos) ─────────────────────
    let porModalidad: any[] = [];
    if (modo !== "egresados") {
      const tipoFiltroModal = modo === "titulados" ? sql`AND tipo = 'Titulado'` : sql``;
      const filtroFechasModal = sql`
        ${anioTitulacionDesde ? sql`AND anio_titulacion >= ${parseInt(anioTitulacionDesde)}` : sql``}
        ${anioTitulacionHasta ? sql`AND anio_titulacion <= ${parseInt(anioTitulacionHasta)}` : sql``}
      `;
      const r = await db.execute(sql`
        SELECT
          COALESCE(modalidad_titulacion::text, 'Sin especificar') AS modalidad,
          COUNT(*)::int AS cantidad
        FROM egresado
        WHERE fallecido = false ${tipoFiltroModal} ${filtroFechasModal}
        ${sector ? sql`AND EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado = egresado.id AND h.fecha_fin IS NULL AND h.sector_trabajo::text = ${sector})` : sql``}
        GROUP BY modalidad_titulacion ORDER BY cantidad DESC
      `);
      porModalidad = (r as any).rows ?? [];
    }

    // ── Gráfico 4a: Distribución geográfica — ciudad de trabajo ───────────
    const tipoFiltroGeo = modo === "titulados" ? sql`AND e.tipo = 'Titulado'`
      : modo === "egresados" ? sql`AND e.tipo = 'Egresado'` : sql``;

    const geoCiudadResult = await db.execute(sql`
      SELECT
        COALESCE(h.ciudad_region_trabajo, 'Sin especificar') AS ciudad,
        COUNT(DISTINCT e.id)::int AS cantidad
      FROM egresado e
      INNER JOIN historial_laboral h ON h.id_egresado = e.id AND h.fecha_fin IS NULL
      WHERE e.fallecido = false AND h.ciudad_region_trabajo IS NOT NULL AND h.ciudad_region_trabajo != ''
      ${tipoFiltroGeo}
      ${sector ? sql`AND h.sector_trabajo::text = ${sector}` : sql``}
      GROUP BY h.ciudad_region_trabajo ORDER BY cantidad DESC LIMIT 15
    `);
    const geoCiudad = (geoCiudadResult as any).rows ?? [];

    // ── Gráfico 4b: Distribución geográfica — residencia ─────────────────
    const geoRegionResult = await db.execute(sql`
      SELECT
        COALESCE(e.lugar_residencia, 'Sin especificar') AS region,
        COUNT(DISTINCT e.id)::int AS cantidad
      FROM egresado e
      WHERE e.fallecido = false ${tipoFiltroGeo}
      GROUP BY e.lugar_residencia ORDER BY cantidad DESC LIMIT 10
    `);
    const geoRegion = (geoRegionResult as any).rows ?? [];

    // ── Gráfico 5: Comparativo cohorte ────────────────────────────────────
    const tipoFiltroCohorte = modo === "titulados" ? sql`AND tipo = 'Titulado'`
      : modo === "egresados" ? sql`AND tipo = 'Egresado'` : sql``;

    const filtroFechasCohorte = modo === "egresados"
      ? sql`${anioEgresoDesde ? sql`AND anio_egreso >= ${parseInt(anioEgresoDesde)}` : sql``} ${anioEgresoHasta ? sql`AND anio_egreso <= ${parseInt(anioEgresoHasta)}` : sql``}`
      : sql`${anioTitulacionDesde ? sql`AND anio_titulacion >= ${parseInt(anioTitulacionDesde)}` : sql``} ${anioTitulacionHasta ? sql`AND anio_titulacion <= ${parseInt(anioTitulacionHasta)}` : sql``}`;

    const cohorteResult = await db.execute(sql`
      SELECT
        anio_ingreso AS cohorte,
        COUNT(*)::int AS total,
        COUNT(CASE WHEN tipo = 'Titulado' THEN 1 END)::int AS titulados,
        COUNT(CASE WHEN tipo = 'Egresado' THEN 1 END)::int AS egresados,
        COUNT(CASE WHEN EXISTS(
          SELECT 1 FROM historial_laboral h WHERE h.id_egresado = egresado.id AND h.fecha_fin IS NULL
        ) THEN 1 END)::int AS "conEmpleo",
        ROUND(100.0 * COUNT(CASE WHEN tipo = 'Titulado' THEN 1 END) / NULLIF(COUNT(*), 0), 1)::float AS "pctTitulados"
      FROM egresado
      WHERE anio_ingreso IS NOT NULL AND fallecido = false
      ${tipoFiltroCohorte} ${filtroFechasCohorte}
      ${sector ? sql`AND EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado = egresado.id AND h.fecha_fin IS NULL AND h.sector_trabajo::text = ${sector})` : sql``}
      GROUP BY anio_ingreso ORDER BY anio_ingreso DESC LIMIT 20
    `);
    const cohorteComparativo = (cohorteResult as any).rows ?? [];

    return ok({
      modo,
      kpis: {
        totalRegistrados,
        conEmpleo,
        tasaEmpleabilidad,
        tiempoPromedioTitulacion: parseFloat(k.tiempoPromedioTitulacion ?? 0) || 0,
        tiempoPromedioInsercion:  parseFloat(k.tiempoPromedioInsercion ?? 0) || 0,
      },
      graficos: {
        porAnio,
        porSector,
        porModalidad,
        geoCiudad,
        geoRegion,
        cohorteComparativo,
      },
    });
  } catch (e) {
    console.error("[dashboard]", e);
    return err("Error al obtener datos del dashboard", 500);
  }
}