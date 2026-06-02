import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { noticias } from "@/lib/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, Pencil, Eye, EyeOff } from "lucide-react";
import AdminLayout from "@/components/shared/AdminLayout";
import EliminarNoticiaBtn from "@/components/noticias/EliminarNoticiaBtn";
import { cn, fmtDate } from "@/lib/utils";

const TIPO_LABELS: Record<string, string> = {
  noticia_institucional: "Institucional",
  curso_evento:          "Curso / Evento",
  noticia_social:        "Social",
};

const TIPO_STYLE: Record<string, React.CSSProperties> = {
  noticia_institucional: {
    background: "var(--turquesa-light)", color: "var(--turquesa-dark)",
    border: "1px solid #99e6e7",
  },
  curso_evento: {
    background: "rgba(139,92,246,0.10)", color: "#7c3aed",
    border: "1px solid rgba(139,92,246,0.25)",
  },
  noticia_social: {
    background: "var(--naranja-light)", color: "var(--naranja)",
    border: "1px solid #fed7aa",
  },
};

export default async function NoticiasAdminPage() {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/login");

  const rows = await db.select().from(noticias).orderBy(desc(noticias.fecha));

  const publicadas = rows.filter(r => r.publicado).length;
  const borradores = rows.length - publicadas;

  return (
    <AdminLayout correo={session.correo}>
      <div className="page">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-[2px] w-6 rounded-full" style={{ background: "#ea580c" }} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: "#ea580c" }}>
                Publicaciones
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase leading-none tracking-tighter"
              style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
              Noticias y Cursos
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--gris-grafito)" }}>
              {rows.length} publicación(es) — {publicadas} publicadas · {borradores} borrador(es)
            </p>
          </div>
          <Link href="/noticias-admin/nueva" className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" /> Nueva publicación
          </Link>
        </div>

        {rows.length === 0 ? (
          <div
            className="card text-center py-16"
            style={{ background: "var(--blanco)" }}
          >
            <p className="text-4xl mb-4">📰</p>
            <p className="font-semibold" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
              Sin publicaciones aún
            </p>
            <p className="text-sm mt-1 mb-6" style={{ color: "var(--gris-grafito)" }}>
              Crea la primera noticia o evento para que aparezca en el sitio público
            </p>
            <Link href="/noticias-admin/nueva" className="btn-primary btn-sm inline-flex">
              <Plus className="w-3.5 h-3.5" /> Crear primera publicación
            </Link>
          </div>
        ) : (
          <>
            {/* Tabla desktop */}
            <div className="hidden md:block tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id}>
                      <td>
                        <p className="font-semibold text-sm" style={{ color: "var(--azul-pizarra)" }}>
                          {r.titulo}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{
                            color: "var(--placeholder)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "380px",
                          }}
                        >
                          {r.cuerpo.slice(0, 90)}{r.cuerpo.length > 90 ? "…" : ""}
                        </p>
                      </td>
                      <td>
                        <span className="badge" style={TIPO_STYLE[r.tipo] ?? {}}>
                          {TIPO_LABELS[r.tipo] ?? r.tipo}
                        </span>
                      </td>
                      <td className="text-sm" style={{ color: "var(--gris-grafito)" }}>
                        {fmtDate(r.fecha)}
                      </td>
                      <td>
                        {r.publicado ? (
                          <span className="badge badge-green flex items-center gap-1 w-fit">
                            <Eye className="w-3 h-3" /> Publicada
                          </span>
                        ) : (
                          <span className="badge badge-slate flex items-center gap-1 w-fit">
                            <EyeOff className="w-3 h-3" /> Borrador
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/noticias-admin/${r.id}/editar`} className="btn-slate btn-xs">
                            <Pencil className="w-3 h-3" /> Editar
                          </Link>
                          <EliminarNoticiaBtn id={r.id} titulo={r.titulo} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards móvil */}
            <div className="md:hidden space-y-3">
              {rows.map(r => (
                <div key={r.id} className="card" style={{ background: "var(--blanco)" }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--azul-pizarra)" }}>
                        {r.titulo}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--placeholder)" }}>
                        {fmtDate(r.fecha)}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <span className="badge" style={TIPO_STYLE[r.tipo] ?? {}}>
                        {TIPO_LABELS[r.tipo] ?? r.tipo}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link href={`/noticias-admin/${r.id}/editar`} className="btn-slate btn-xs flex-1 justify-center">
                      <Pencil className="w-3 h-3" /> Editar
                    </Link>
                    <EliminarNoticiaBtn id={r.id} titulo={r.titulo} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}