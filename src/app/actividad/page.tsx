// src/app/actividad/page.tsx
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auditLog, usuario, egresado } from "@/lib/schema";
import { and, sql, desc, gte, lte, eq } from "drizzle-orm";
import AdminLayout from "@/components/shared/AdminLayout";
import { cn, fmtDate } from "@/lib/utils";
import Link from "next/link";

interface SP {
  entidad?:   string;
  accion?:    string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?:       string;
}

const ACCION_STYLE: Record<string, React.CSSProperties> = {
  crear:    { background: "var(--verde-light)",   color: "var(--verde)",    border: "1px solid #86efac" },
  editar:   { background: "var(--turquesa-light)", color: "var(--turquesa-dark)", border: "1px solid #99e6e7" },
  eliminar: { background: "#FEF2F2",               color: "#dc2626",         border: "1px solid #FECACA" },
};

const ENTIDAD_STYLE: Record<string, React.CSSProperties> = {
  egresado:  { background: "rgba(139,92,246,0.10)", color: "#7c3aed",               border: "1px solid rgba(139,92,246,0.25)" },
  usuario:   { background: "rgba(59,130,246,0.10)",  color: "#2563eb",              border: "1px solid rgba(59,130,246,0.25)" },
  noticia:   { background: "var(--naranja-light)",    color: "var(--naranja)",       border: "1px solid #fed7aa" },
  encuesta:  { background: "var(--turquesa-pale)",    color: "var(--turquesa-dark)", border: "1px solid rgba(0,165,168,0.25)" },
  titulado:  { background: "var(--turquesa-light)",   color: "var(--turquesa-dark)", border: "1px solid #99e6e7" },
};

const ACCION_LABEL: Record<string, string> = {
  crear: "Crear", editar: "Editar", eliminar: "Eliminar",
};
const ENTIDAD_LABEL: Record<string, string> = {
  egresado: "Egresado", usuario: "Usuario", noticia: "Noticia", encuesta: "Encuesta", titulado: "Titulado",
};

async function getData(sp: SP) {
  const page     = Math.max(1, parseInt(sp.page ?? "1"));
  const pageSize = 20;

  const conds: any[] = [];
  if (sp.entidad)    conds.push(sql`${auditLog.entidad}::text = ${sp.entidad}`);
  if (sp.accion)     conds.push(sql`${auditLog.accion}::text  = ${sp.accion}`);
  if (sp.fechaDesde) conds.push(gte(auditLog.creadoEn, new Date(sp.fechaDesde)));
  if (sp.fechaHasta) {
    const hasta = new Date(sp.fechaHasta);
    hasta.setHours(23, 59, 59, 999);
    conds.push(lte(auditLog.creadoEn, hasta));
  }

  const where = conds.length > 0 ? and(...conds) : undefined;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(auditLog).where(where);

  const rows = await db
    .select({
      id:              auditLog.id,
      accion:          auditLog.accion,
      entidad:         auditLog.entidad,
      entidadId:       auditLog.entidadId,
      datosAnteriores: auditLog.datosAnteriores,
      datosNuevos:     auditLog.datosNuevos,
      ip:              auditLog.ip,
      creadoEn:        auditLog.creadoEn,
      usuarioCi:       usuario.ci,
      usuarioCorreo:   usuario.correo,
      usuarioRol:      usuario.rol,
    })
    .from(auditLog)
    .leftJoin(usuario, eq(auditLog.idUsuario, usuario.id))
    .where(where)
    .orderBy(desc(auditLog.creadoEn))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export default async function ActividadPage({ searchParams }: { searchParams: SP }) {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/login");

  const { rows, total, page, totalPages } = await getData(searchParams);

  const buildUrl = (overrides: Partial<SP>) => {
    const merged = { ...searchParams, ...overrides };
    const p = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    return `/actividad?${p}`;
  };

  const fieldCss: React.CSSProperties = {
    background: "var(--humo)", border: "1.5px solid var(--borde)",
    borderRadius: "0.75rem", padding: "0.5rem 0.875rem",
    fontSize: "0.8rem", color: "var(--azul-pizarra)", outline: "none",
  };

  return (
    <AdminLayout correo={session.correo}>
      <div className="page">
        <div className="mb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-[2px] w-6 rounded-full" style={{ background: "#ea580c" }} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: "#ea580c" }}>
              Auditoría del sistema
            </span>
          </div>
          <h1 className="text-2xl font-black uppercase leading-none tracking-tighter"
            style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
            Registro de Actividad
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--gris-grafito)" }}>
            {total} evento(s) registrado(s)
          </p>
        </div>

        {/* Filtros */}
        <form method="GET" action="/actividad">
          <div className="card flex flex-wrap gap-3 items-end" style={{ background: "var(--blanco)" }}>
            <div>
              <label style={{ display:"block", fontSize:"0.7rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", color:"var(--gris-grafito)", marginBottom:"0.375rem" }}>
                Entidad
              </label>
              <select name="entidad" defaultValue={searchParams.entidad ?? ""} style={fieldCss}>
                <option value="">Todas</option>
                <option value="egresado">Egresado</option>
                <option value="titulado">Titulado</option>
                <option value="usuario">Usuario</option>
                <option value="noticia">Noticia</option>
                <option value="encuesta">Encuesta</option>
              </select>
            </div>
            <div>
              <label style={{ display:"block", fontSize:"0.7rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", color:"var(--gris-grafito)", marginBottom:"0.375rem" }}>
                Acción
              </label>
              <select name="accion" defaultValue={searchParams.accion ?? ""} style={fieldCss}>
                <option value="">Todas</option>
                <option value="crear">Crear</option>
                <option value="editar">Editar</option>
                <option value="eliminar">Eliminar</option>
              </select>
            </div>
            <div>
              <label style={{ display:"block", fontSize:"0.7rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", color:"var(--gris-grafito)", marginBottom:"0.375rem" }}>
                Desde
              </label>
              <input type="date" name="fechaDesde" defaultValue={searchParams.fechaDesde ?? ""} style={fieldCss} />
            </div>
            <div>
              <label style={{ display:"block", fontSize:"0.7rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", color:"var(--gris-grafito)", marginBottom:"0.375rem" }}>
                Hasta
              </label>
              <input type="date" name="fechaHasta" defaultValue={searchParams.fechaHasta ?? ""} style={fieldCss} />
            </div>
            <button type="submit" className="btn-primary btn-sm">Filtrar</button>
            {(searchParams.entidad || searchParams.accion || searchParams.fechaDesde || searchParams.fechaHasta) && (
              <Link href="/actividad" className="btn-ghost btn-sm">Limpiar</Link>
            )}
          </div>
        </form>

        {/* Tabla */}
        {rows.length === 0 ? (
          <div className="card text-center py-16" style={{ background: "var(--blanco)" }}>
            <p className="font-semibold" style={{ color: "var(--gris-grafito)" }}>Sin registros de actividad</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Fecha y hora</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Entidad</th>
                    <th>ID</th>
                    <th>Datos</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td>
                        <p className="text-sm font-mono" style={{ color: "var(--azul-pizarra)" }}>
                          {r.creadoEn
                            ? new Date(r.creadoEn).toLocaleDateString("es-BO", {
                                day: "2-digit", month: "2-digit", year: "numeric",
                                timeZone: "America/La_Paz",
                              })
                            : "—"}
                        </p>
                        <p className="text-xs font-mono" style={{ color: "var(--placeholder)" }}>
                          {r.creadoEn
                            ? new Date(r.creadoEn).toLocaleTimeString("es-BO", {
                                hour: "2-digit", minute: "2-digit", second: "2-digit",
                                timeZone: "America/La_Paz",
                              })
                            : ""}
                        </p>
                      </td>
                      <td>
                        <p className="text-sm font-mono" style={{ color: "var(--azul-pizarra)" }}>
                          {r.usuarioCi ?? "—"}
                        </p>
                        {r.usuarioRol && (
                          <p className="text-xs" style={{ color: "var(--placeholder)" }}>
                            {r.usuarioRol}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className="badge" style={ACCION_STYLE[r.accion] ?? {}}>
                          {ACCION_LABEL[r.accion] ?? r.accion}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={ENTIDAD_STYLE[r.entidad] ?? {}}>
                          {ENTIDAD_LABEL[r.entidad] ?? r.entidad}
                        </span>
                      </td>
                      <td className="text-sm font-mono" style={{ color: "var(--gris-grafito)" }}>
                        {r.entidadId ?? "—"}
                      </td>
                      <td style={{ maxWidth: "220px" }}>
                        {r.datosNuevos && (
                          <details className="text-xs">
                            <summary
                              className="cursor-pointer font-medium"
                              style={{ color: "var(--turquesa-dark)" }}
                            >
                              Ver datos
                            </summary>
                            <pre
                              className="mt-1 p-2 rounded-lg overflow-auto text-xs"
                              style={{
                                background: "var(--humo)", color: "var(--azul-pizarra)",
                                border: "1px solid var(--borde)", maxHeight: "120px",
                                fontSize: "0.65rem",
                              }}
                            >
                              {JSON.stringify(JSON.parse(r.datosNuevos), null, 2)}
                            </pre>
                          </details>
                        )}
                        {!r.datosNuevos && r.datosAnteriores && (
                          <details className="text-xs">
                            <summary
                              className="cursor-pointer font-medium"
                              style={{ color: "#dc2626" }}
                            >
                              Datos eliminados
                            </summary>
                            <pre
                              className="mt-1 p-2 rounded-lg overflow-auto text-xs"
                              style={{
                                background: "#FEF2F2", color: "#dc2626",
                                border: "1px solid #FECACA", maxHeight: "120px",
                                fontSize: "0.65rem",
                              }}
                            >
                              {JSON.stringify(JSON.parse(r.datosAnteriores), null, 2)}
                            </pre>
                          </details>
                        )}
                        {!r.datosNuevos && !r.datosAnteriores && (
                          <span style={{ color: "var(--placeholder)", fontSize: "0.875rem" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className="text-xs font-mono" style={{ color: "var(--placeholder)" }}>
                          {r.ip ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-3">
              {rows.map(r => (
                <div key={r.id} className="card" style={{ background: "var(--blanco)" }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-mono" style={{ color: "var(--gris-grafito)" }}>
                        {r.creadoEn ? new Date(r.creadoEn).toLocaleString("es-BO") : "—"}
                      </p>
                      <p className="text-xs mt-0.5 font-mono font-semibold" style={{ color: "var(--azul-pizarra)" }}>
                        {r.usuarioCi ?? "—"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="badge" style={ACCION_STYLE[r.accion] ?? {}}>
                        {ACCION_LABEL[r.accion] ?? r.accion}
                      </span>
                      <span className="badge" style={ENTIDAD_STYLE[r.entidad] ?? {}}>
                        {ENTIDAD_LABEL[r.entidad] ?? r.entidad}
                      </span>
                    </div>
                  </div>
                  {r.entidadId && (
                    <p className="text-xs" style={{ color: "var(--placeholder)" }}>
                      ID: {r.entidadId}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm" style={{ color: "var(--gris-grafito)" }}>
                <p>Página {page} de {totalPages} · {total} evento(s)</p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link href={buildUrl({ page: String(page - 1) })} className="btn-slate btn-xs">
                      ← Anterior
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link href={buildUrl({ page: String(page + 1) })} className="btn-slate btn-xs">
                      Siguiente →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}