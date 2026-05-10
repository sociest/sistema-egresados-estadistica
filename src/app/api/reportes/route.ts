import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { egresado } from "@/lib/schema";
import { and, sql, ilike } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ok, err } from "@/lib/utils";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);

    const sp       = new URL(req.url).searchParams;
    const anio     = sp.get("anioEgreso");
    const plan     = sp.get("plan");
    const empleo   = sp.get("conEmpleo");
    const genero   = sp.get("genero");
    const exportar = sp.get("exportar");

    // Filtros adicionales del dashboard
    const anioTitulacionDesde = sp.get("anioTitulacionDesde");
    const anioTitulacionHasta = sp.get("anioTitulacionHasta");
    const sector              = sp.get("sector");
    const modalidad           = sp.get("modalidad");
    const tipo                = sp.get("tipo");

    const ciudad         = sp.get("ciudad");
    const tienePostgrado = sp.get("tienePostgrado");

    const conds: any[] = [];
    if (anio)   conds.push(sql`${egresado.anioEgreso} = ${parseInt(anio)}`);
    if (genero) conds.push(sql`${egresado.genero} = ${genero}`);
    if (tipo)   conds.push(sql`${egresado.tipo}::text = ${tipo}`);
    if (modalidad) conds.push(sql`${egresado.modalidadTitulacion}::text = ${modalidad}`);
    if (anioTitulacionDesde) conds.push(sql`${egresado.anioTitulacion} >= ${parseInt(anioTitulacionDesde)}`);
    if (anioTitulacionHasta) conds.push(sql`${egresado.anioTitulacion} <= ${parseInt(anioTitulacionHasta)}`);
    if (sector)
      conds.push(sql`EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado=${egresado.id} AND h.sector_trabajo::text = ${sector} AND h.fecha_fin IS NULL)`);
    if (ciudad)
      conds.push(sql`EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado=${egresado.id} AND LOWER(h.ciudad_region_trabajo) = LOWER(${ciudad}))`);
    if (tienePostgrado === "true")
      conds.push(sql`EXISTS(SELECT 1 FROM postgrado p WHERE p.id_egresado=${egresado.id})`);
    if (tienePostgrado === "false")
      conds.push(sql`NOT EXISTS(SELECT 1 FROM postgrado p WHERE p.id_egresado=${egresado.id})`);
    if (empleo === "true")
      conds.push(sql`EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado=${egresado.id} AND h.fecha_fin IS NULL)`);
    if (empleo === "false")
      conds.push(sql`NOT EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado=${egresado.id} AND h.fecha_fin IS NULL)`);

    // Excluir fallecidos de estadísticas
    conds.push(sql`${egresado.fallecido} = false`);

    const where = conds.length > 0 ? and(...conds) : undefined;

    const rows = await db.select({
      id:                  egresado.id,
      nombres:             egresado.nombres,
      apellidoPaterno:     egresado.apellidoPaterno,
      apellidoMaterno:     egresado.apellidoMaterno,
      ci:                  egresado.ci,
      celular:             egresado.celular,
      correoElectronico:   egresado.correoElectronico,
      genero:              egresado.genero,
      tipo:                egresado.tipo,
      modalidadTitulacion: egresado.modalidadTitulacion,
      anioTitulacion:      egresado.anioTitulacion,
      anioEgreso:          egresado.anioEgreso,
      anioIngreso:         egresado.anioIngreso,
      semestreIngreso:     egresado.semestreIngreso,
      semestreEgreso:      egresado.semestreEgreso,
      lugarResidencia:     egresado.lugarResidencia,
      areaEspecializacion: egresado.areaEspecializacion,
      tieneEmpleo: sql<boolean>`(
        SELECT COUNT(*) > 0 FROM historial_laboral h
        WHERE h.id_egresado = egresado.id AND h.fecha_fin IS NULL
      )`,
      tienePostgrado: sql<boolean>`(
        SELECT COUNT(*) > 0 FROM postgrado p
        WHERE p.id_egresado = egresado.id
      )`,
    })

    .from(egresado)
    .where(where)
    .orderBy(egresado.apellidoPaterno, egresado.apellidoMaterno, egresado.nombres);

    // ── Exportar Excel ──────────────────────────────────────────────────────
    if (exportar === "excel") {
       const fechaGen = new Date().toLocaleDateString("es-BO", {
        day: "2-digit", month: "long", year: "numeric",
      });

      const filtrosDesc = [
        anio      && `Año egreso: ${anio}`,
        plan      && `Plan: ${plan}`,
        genero    && `Género: ${genero}`,
        tipo      && `Tipo: ${tipo}`,
        modalidad && `Modalidad: ${modalidad}`,
        anioTitulacionDesde && `Titulación desde: ${anioTitulacionDesde}`,
        anioTitulacionHasta && `Titulación hasta: ${anioTitulacionHasta}`,
        sector    && `Sector: ${sector}`,
        empleo === "true"  && "Con empleo: Sí",
        empleo === "false" && "Con empleo: No",
      ].filter(Boolean).join(", ") || "Ninguno";

      const excelRows = rows.map(r => ({
        "Tipo":                   r.tipo ?? "",
        "Apellido Paterno":       r.apellidoPaterno ?? "",
        "Apellido Materno":       r.apellidoMaterno ?? "",
        "Nombres":                r.nombres,
        "CI":                     r.ci,
        "Correo":                 r.correoElectronico ?? "",
        "Celular":                r.celular ?? "",
        "Género":                 r.genero ?? "",
        "Semestre Ingreso":       r.semestreIngreso ? `${r.semestreIngreso}/${r.anioIngreso}` : (r.anioIngreso ? String(r.anioIngreso) : ""),
        "Semestre Egreso":        r.semestreEgreso  ? `${r.semestreEgreso}/${r.anioEgreso}`  : (r.anioEgreso  ? String(r.anioEgreso)  : ""),
        "Año Titulación":         r.anioTitulacion ?? "",
        "Modalidad Titulación":   r.modalidadTitulacion ?? "",
        "Área de Especialización": r.areaEspecializacion ?? "",
        "Lugar de Residencia":    r.lugarResidencia ?? "",
        "Tiene Empleo Actual":    r.tieneEmpleo ? "Sí" : "No",
        "Tiene Postgrado":        r.tienePostgrado ? "Sí" : "No",
      }));

      const wb = XLSX.utils.book_new();

      // ── Hoja 1: Datos ─────────────────────────────────────────────────
      // Insertar filas de metadata antes de los datos
      const metaRows = [
        ["SISTEMA DE SEGUIMIENTO DE EGRESADOS — CARRERA DE ESTADÍSTICA UMSA"],
        [`Fecha de generación: ${fechaGen}`],
        [`Filtros aplicados: ${filtrosDesc}`],
        [`Total de registros: ${rows.length}`],
        [], // fila vacía separadora
      ];

      const ws = XLSX.utils.aoa_to_sheet(metaRows);

      // Añadir encabezados y datos debajo de la metadata
      XLSX.utils.sheet_add_json(ws, excelRows, { origin: 5 }); // fila 6 (0-indexed: 5)

      // Anchos de columna
      ws["!cols"] = [
        {wch:12},{wch:18},{wch:18},{wch:20},{wch:12},{wch:26},{wch:12},
        {wch:12},{wch:18},{wch:18},{wch:16},{wch:22},{wch:24},{wch:20},{wch:18},{wch:14},
      ];

      // Estilo para la celda del título (A1) — solo ancho, xlsx sin pro no soporta colores
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

      XLSX.utils.book_append_sheet(wb, ws, "Egresados");

      // ── Hoja 2: Resumen ───────────────────────────────────────────────
      const conEmpleo    = rows.filter(r => r.tieneEmpleo).length;
      const sinEmpleo    = rows.length - conEmpleo;
      const titulados    = rows.filter(r => r.tipo === "Titulado").length;
      const egresadosSin = rows.filter(r => r.tipo === "Egresado").length;
      const conPostgrado = rows.filter(r => r.tienePostgrado).length;

      const resumenRows = [
        ["RESUMEN DEL REPORTE"],
        [`Fecha: ${fechaGen}`],
        [`Filtros: ${filtrosDesc}`],
        [],
        ["Indicador", "Valor"],
        ["Total registros",      rows.length],
        ["Titulados",            titulados],
        ["Egresados sin título", egresadosSin],
        ["Con empleo actual",    conEmpleo],
        ["Sin empleo actual",    sinEmpleo],
        ["Con postgrado",        conPostgrado],
        ["Tasa de empleabilidad", rows.length > 0 ? `${Math.round((conEmpleo / rows.length) * 100)}%` : "N/A"],
      ];

      const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
      wsResumen["!cols"] = [{wch: 30}, {wch: 20}];
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

      const buf   = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      const fecha = new Date().toISOString().split("T")[0];
      return new Response(buf, {
        headers: {
          "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="egresados_${fecha}.xlsx"`,
        },
      });
    }

    // ── Estadísticas para gráficos (reportes clásicos) ─────────────────────
    const [porAnio, porPlan, porGenero, empleabilidad, porTipo] = await Promise.all([
      db.execute(sql`
        SELECT anio_titulacion AS anio, COUNT(*)::int AS cantidad
        FROM egresado WHERE anio_titulacion IS NOT NULL AND fallecido = false
        GROUP BY anio_titulacion ORDER BY anio_titulacion
      `),
      db.execute(sql`
        SELECT
          COALESCE(modalidad_titulacion::text, 'Sin especificar') AS plan,
          COUNT(*)::int AS cantidad
        FROM egresado WHERE fallecido = false
        GROUP BY modalidad_titulacion ORDER BY cantidad DESC
      `),
      db.execute(sql`
        SELECT
          COALESCE(genero::text, 'Sin especificar') AS genero,
          COUNT(*)::int AS cantidad
        FROM egresado WHERE fallecido = false
        GROUP BY genero ORDER BY cantidad DESC
      `),
      db.execute(sql`
        SELECT
          anio_egreso AS anio,
          COUNT(DISTINCT e.id)::int AS total,
          COUNT(DISTINCT CASE WHEN h.fecha_fin IS NULL THEN e.id END)::int AS "conEmpleo"
        FROM egresado e
        LEFT JOIN historial_laboral h ON h.id_egresado = e.id
        WHERE e.anio_egreso IS NOT NULL AND e.fallecido = false
        GROUP BY anio_egreso ORDER BY anio_egreso
      `),
      db.execute(sql`
        SELECT
          tipo::text AS tipo,
          COUNT(*)::int AS cantidad
        FROM egresado
        WHERE fallecido = false
        GROUP BY tipo
        ORDER BY tipo
      `),
    ]);

    const filasNormalizadas = rows.map(r => ({
      ...r,
      tieneEmpleo:    r.tieneEmpleo    === true || (r.tieneEmpleo    as any) === "true" || (r.tieneEmpleo    as any) === "t",
      tienePostgrado: r.tienePostgrado === true || (r.tienePostgrado as any) === "true" || (r.tienePostgrado as any) === "t",
    }));

    return ok({
      filas:         filasNormalizadas,
      total:         filasNormalizadas.length,
      conEmpleo:     filasNormalizadas.filter(r => r.tieneEmpleo).length,
      sinEmpleo:     filasNormalizadas.filter(r => !r.tieneEmpleo).length,
      porAnio:       porAnio.rows,
      porPlan:       porPlan.rows,
      porGenero:     porGenero.rows,
      empleabilidad: empleabilidad.rows,
      porTipo:       porTipo.rows,
    });
  } catch (e) {
    console.error("[reportes]", e);
    return err("Error en reportes", 500);
  }
}