// src/app/egresados/page.tsx
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { egresado, historialLaboral } from "@/lib/schema";
import { ilike, and, or, sql, eq } from "drizzle-orm";
import Link from "next/link";
import { Plus, Search, Eye, Pencil } from "lucide-react";
import AdminLayout from "@/components/shared/AdminLayout";
import BuscadorEgresados from "@/components/egresados/BuscadorEgresados";
import EliminarEgresadoBtn from "@/components/egresados/EliminarEgresadoBtn";
import ImportarEgresadosBtn from "@/components/egresados/ImportarEgresadosBtn";
import { cn, fmtDate } from "@/lib/utils";

interface SP {
  busqueda?:       string;
  anioEgreso?:     string;
  anioTitulacion?: string;
  conEmpleo?:      string;
  genero?:         string;
  sector?:         string;
  ciudad?:         string;
  modalidad?:      string;
  tienePostgrado?: string;
  page?:           string;
  tipo?:           string;
}

async function getData(sp: SP) {
  const conds: any[] = [];

 if (sp.busqueda) conds.push(or(
  ilike(egresado.nombres,         `%${sp.busqueda}%`),
  ilike(egresado.apellidoPaterno, `%${sp.busqueda}%`),
  ilike(egresado.apellidoMaterno, `%${sp.busqueda}%`),
  ilike(egresado.ci,              `%${sp.busqueda}%`),
));
  if (sp.anioEgreso)     conds.push(sql`${egresado.anioEgreso} = ${parseInt(sp.anioEgreso)}`);
  if (sp.anioTitulacion) conds.push(sql`${egresado.anioTitulacion} = ${parseInt(sp.anioTitulacion)}`);
  if (sp.genero)         conds.push(sql`${egresado.genero} = ${sp.genero}`);
  if (sp.modalidad)      conds.push(sql`${egresado.modalidadTitulacion} = ${sp.modalidad}`);
  if (sp.tipo) conds.push(sql`${egresado.tipo}::text = ${sp.tipo}`);

  // Filtro por empleo
  if (sp.conEmpleo === "true")
    conds.push(sql`EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado=${egresado.id} AND h.fecha_fin IS NULL)`);
  if (sp.conEmpleo === "false")
    conds.push(sql`NOT EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado=${egresado.id} AND h.fecha_fin IS NULL)`);

  // Filtro por sector laboral (en algún empleo actual o pasado)
  if (sp.sector)
    conds.push(sql`EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado=${egresado.id} AND h.sector_trabajo::text = ${sp.sector})`);

  // Filtro por ciudad (en algún empleo)
  if (sp.ciudad)
    conds.push(sql`EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado=${egresado.id} AND LOWER(h.ciudad_region_trabajo) = LOWER(${sp.ciudad}))`);

  // Filtro por postgrado
  if (sp.tienePostgrado === "true")
    conds.push(sql`EXISTS(SELECT 1 FROM postgrado p WHERE p.id_egresado=${egresado.id})`);
  if (sp.tienePostgrado === "false")
    conds.push(sql`NOT EXISTS(SELECT 1 FROM postgrado p WHERE p.id_egresado=${egresado.id})`);

  const where    = conds.length > 0 ? and(...conds) : undefined;
  const page     = Math.max(1, parseInt(sp.page ?? "1"));
  const pageSize = 15;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(egresado).where(where);

  const rows = await db.select({
    id:                  egresado.id,
    nombres:             egresado.nombres,
    apellidoPaterno:     egresado.apellidoPaterno,
    apellidoMaterno:     egresado.apellidoMaterno,
    ci:                  egresado.ci,
    anioTitulacion:      egresado.anioTitulacion,
    anioEgreso:          egresado.anioEgreso,
    modalidadTitulacion: egresado.modalidadTitulacion,
    genero:              egresado.genero,
    correoElectronico:   egresado.correoElectronico,
    celular:             egresado.celular,
    tipo:                egresado.tipo,
    tieneEmpleo: sql<boolean>`EXISTS(
      SELECT 1 FROM historial_laboral h
      WHERE h.id_egresado=${egresado.id} AND h.fecha_fin IS NULL
    )`,
    tienePostgrado: sql<boolean>`EXISTS(
      SELECT 1 FROM postgrado p WHERE p.id_egresado=${egresado.id}
    )`,
  })
  .from(egresado).where(where)
  .orderBy(egresado.apellidoPaterno, egresado.apellidoMaterno, egresado.nombres)
  .limit(pageSize).offset((page - 1) * pageSize);

  return { rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// Ciudades registradas para el filtro dinámico
async function getCiudades(): Promise<string[]> {
  const result = await db.execute(sql`
    SELECT DISTINCT ciudad
    FROM historial_laboral
    WHERE ciudad IS NOT NULL AND ciudad != ''
    ORDER BY ciudad
  `);
  return (result as any).rows?.map((r: any) => r.ciudad) ?? [];
}

export default async function EgresadosPage({ searchParams }: { searchParams: SP }) {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/login");

  const [{ rows, total, page, totalPages }, ciudades] = await Promise.all([
    getData(searchParams),
    getCiudades(),
  ]);

  const SECTOR_COLOR: Record<string, { bg: string; color: string }> = {
    Publico:       { bg: "rgba(59,130,246,0.10)", color: "#3b82f6" },
    Privado:       { bg: "rgba(139,92,246,0.10)", color: "#8b5cf6" },
    Independiente: { bg: "rgba(245,158,11,0.10)", color: "#d97706" },
    ONG:           { bg: "rgba(16,185,129,0.10)", color: "#059669" },
    Otro:          { bg: "var(--humo)",            color: "var(--gris-grafito)" },
  };

  return (
    <AdminLayout correo={session.correo}>
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Egresados</h1>
            <p className="page-sub">{total} egresado(s) encontrado(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <ImportarEgresadosBtn />
            <Link href="/egresados/nuevo" className="btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" /> Nuevo Egresado
            </Link>
          </div>
        </div>

        <BuscadorEgresados
          searchParams={searchParams}
          ciudades={ciudades}
        />
                {rows.length === 0 ? (
          <div className="card text-center py-16" style={{ background: "var(--blanco)" }}>
            <Search className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--borde)" }} />
            <p className="font-semibold" style={{ color: "var(--gris-grafito)" }}>Sin resultados</p>
            <p className="text-sm mt-1" style={{ color: "var(--placeholder)" }}>Prueba con otros filtros</p>
          </div>
        ) : (
          <>
            {/* Vista tabla — desktop */}
            <div className="hidden md:block tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Apellidos, Nombres</th>
                    <th>CI</th>
                    <th>Plan · Modalidad</th>
                    <th>Titulación</th>
                    <th>Tipo</th>
                    <th>Empleo</th>
                    <th>Postgrado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td>
                        <p className="font-semibold text-sm" style={{ color: "var(--azul-pizarra)" }}>
                          {[r.apellidoPaterno, r.apellidoMaterno].filter(Boolean).join(" ") || r.nombres}, {r.nombres}
                        </p>
                        {r.genero && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--placeholder)" }}>{r.genero}</p>
                        )}
                      </td>
                      <td>
                        <span className="font-mono text-sm" style={{ color: "var(--gris-grafito)" }}>
                          {r.ci}
                        </span>
                      </td>
                      <td>
                        {r.modalidadTitulacion && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--placeholder)" }}>
                            {r.modalidadTitulacion ?? "--"}
                          </p>
                        )}
                      </td>
                      <td className="text-sm" style={{ color: "var(--gris-grafito)" }}>
                        {r.anioTitulacion ?? (r.anioEgreso ? `Egreso ${r.anioEgreso}` : "—")}
                      </td>
                      <td>
                        <span className="badge" style={r.tipo === "Titulado" ? {
                          background: "var(--turquesa-light)", color: "var(--turquesa-dark)",
                          border: "1px solid #99e6e7",
                        } : {
                          background: "var(--naranja-light)", color: "var(--naranja)",
                          border: "1px solid #fed7aa",
                        }}>
                          {r.tipo}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={r.tieneEmpleo ? {
                          background: "var(--verde-light)", color: "var(--verde)",
                          border: "1px solid #86efac",
                        } : {
                          background: "var(--humo)", color: "var(--placeholder)",
                          border: "1px solid var(--borde)",
                        }}>
                          {r.tieneEmpleo ? "Empleado" : "Sin empleo"}
                        </span>
                      </td>
                      <td>
                        {r.tienePostgrado ? (
                          <span className="badge" style={{
                            background: "rgba(59,130,246,0.08)", color: "#3b82f6",
                            border: "1px solid rgba(59,130,246,0.20)",
                          }}>Con postgrado</span>
                        ) : (
                          <span style={{ color: "var(--placeholder)", fontSize: "0.875rem" }}>—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/egresados/${r.id}`} className="btn-ghost btn-xs">
                            <Eye className="w-3.5 h-3.5" /> Ver
                          </Link>
                          <Link href={`/egresados/${r.id}/editar`} className="btn-slate btn-xs">
                            <Pencil className="w-3 h-3" /> Editar
                          </Link>
                          <EliminarEgresadoBtn id={r.id} nombre={`${r.nombres} ${[r.apellidoPaterno, r.apellidoMaterno].filter(Boolean).join(" ")}`} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista cards — móvil */}
            <div className="md:hidden space-y-3">
              {rows.map(r => (
                <div key={r.id} className="card" style={{ background: "var(--blanco)" }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold text-sm" style={{ color: "var(--azul-pizarra)" }}>
                        {[r.apellidoPaterno, r.apellidoMaterno].filter(Boolean).join(" ") || r.nombres}, {r.nombres}
                      </p>
                      <p className="font-mono text-xs mt-0.5" style={{ color: "var(--gris-grafito)" }}>
                        CI: {r.ci}
                      </p>
                    </div>
                    <span className="badge shrink-0" style={r.tipo === "Titulado" ? {
                      background: "var(--turquesa-light)", color: "var(--turquesa-dark)",
                      border: "1px solid #99e6e7",
                    } : {
                      background: "var(--naranja-light)", color: "var(--naranja)",
                      border: "1px solid #fed7aa",
                    }}>
                      {r.tipo}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {r.anioTitulacion && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "var(--humo)", color: "var(--gris-grafito)", border: "1px solid var(--borde)" }}>
                        {r.anioTitulacion}
                      </span>
                    )}
                    <span className="badge" style={r.tieneEmpleo ? {
                      background: "var(--verde-light)", color: "var(--verde)", border: "1px solid #86efac",
                    } : {
                      background: "var(--humo)", color: "var(--placeholder)", border: "1px solid var(--borde)",
                    }}>
                      {r.tieneEmpleo ? "Empleado" : "Sin empleo"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/egresados/${r.id}`} className="btn-ghost btn-xs flex-1 justify-center">
                      <Eye className="w-3.5 h-3.5" /> Ver
                    </Link>
                    <Link href={`/egresados/${r.id}/editar`} className="btn-slate btn-xs flex-1 justify-center">
                      <Pencil className="w-3 h-3" /> Editar
                    </Link>
                    <EliminarEgresadoBtn id={r.id} nombre={`${r.nombres} ${[r.apellidoPaterno, r.apellidoMaterno].filter(Boolean).join(" ")}`}/>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm" style={{ color: "var(--gris-grafito)" }}>
            <p>Página {page} de {totalPages} · {total} resultado(s)</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                  className="btn-slate btn-xs"
                >
                  ← Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
                  className="btn-slate btn-xs"
                >
                  Siguiente →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
