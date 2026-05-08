// src/app/directorio/page.tsx
import { db } from "@/lib/db";
import { egresado, historialLaboral } from "@/lib/schema";
import { eq, sql, ilike, and, or, desc } from "drizzle-orm";
import PublicLayout from "@/components/shared/PublicLayout";
import DirectorioClient from "@/components/directorio/DirectorioClient";

interface SP extends Record<string, string | undefined> {
  busqueda?: string;
  plan?:     string;
  sector?:   string;
  ciudad?:   string;
  page?:     string;
}

async function getEgresados(sp: SP) {
  const pageSize = 18;
  const page     = Math.max(1, parseInt(sp.page ?? "1"));

  const conds: any[] = [
    eq(egresado.mostrarEnDirectorio, true),
    eq(egresado.fallecido, false),
  ];

  if (sp.busqueda) conds.push(or(
    ilike(egresado.nombres,   `%${sp.busqueda}%`),
    ilike(egresado.apellidoPaterno, `%${sp.busqueda}%`),
    ilike(egresado.apellidoMaterno, `%${sp.busqueda}%`),
  ));
  if (sp.sector)
    conds.push(sql`EXISTS(
      SELECT 1 FROM historial_laboral h
      WHERE h.id_egresado = ${egresado.id}
        AND h.sector_trabajo::text = ${sp.sector}
        AND h.fecha_fin IS NULL
    )`);
  if (sp.ciudad)
    conds.push(sql`EXISTS(
      SELECT 1 FROM historial_laboral h
      WHERE h.id_egresado = ${egresado.id}
        AND LOWER(h.ciudad_region_trabajo) = LOWER(${sp.ciudad})
        AND h.fecha_fin IS NULL
    )`);

  const where = and(...conds);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(egresado).where(where);

  // Traer egresados base
  const egresados = await db.select({
    id:                  egresado.id,
    nombres:             egresado.nombres,
    apellidoPaterno:     egresado.apellidoPaterno,
    apellidoMaterno:     egresado.apellidoMaterno,
    anioTitulacion:      egresado.anioTitulacion,
    correoElectronico:   egresado.correoElectronico,
    celular:             egresado.celular,
    ultimaActualizacion: egresado.ultimaActualizacion,
  })
  .from(egresado).where(where)
  .orderBy(sql`${egresado.ultimaActualizacion} DESC NULLS LAST`)
  .limit(pageSize).offset((page - 1) * pageSize);

  if (egresados.length === 0) {
    return { rows: [], total, page, totalPages: Math.ceil(total / pageSize) };
  }

  // Traer empleo actual de cada egresado
  const ids = egresados.map(e => e.id);
  const empleos = await db.select({
    idEgresado: historialLaboral.idEgresado,
    cargo:      historialLaboral.cargo,
    empresa:    historialLaboral.empresa,
    ciudad:     historialLaboral.ciudadRegionTrabajo,
    sector:     historialLaboral.sectorTrabajo,
  })
  .from(historialLaboral)
  .where(
    and(
      sql`${historialLaboral.idEgresado} = ANY(${sql.raw(`ARRAY[${ids.join(",")}]`)})`,
      sql`${historialLaboral.fechaFin} IS NULL`
    )
  )
  .orderBy(desc(historialLaboral.fechaInicio));

  // Mapear empleo actual por egresado (el más reciente)
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
      sectorActual: empleo?.sector ?? null,
    };
  });

  return { rows, total, page, totalPages: Math.ceil(total / pageSize) };
}

export default async function DirectorioPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const { rows, total, page, totalPages } = await getEgresados(searchParams);

  return (
    <PublicLayout>
      <DirectorioClient
        egresados={rows}
        total={total}
        page={page}
        totalPages={totalPages}
        searchParams={searchParams}
      />
    </PublicLayout>
  );
}