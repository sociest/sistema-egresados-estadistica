import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { usuario, egresado } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import AdminLayout from "@/components/shared/AdminLayout";
import EliminarUsuarioBtn from "@/components/usuarios/EliminarUsuarioBtn";
import { cn, fmtDate } from "@/lib/utils";

const ROL_B:    Record<string, string> = { admin:"badge-blue",  egresado:"badge-green" };
const ESTADO_B: Record<string, string> = { activo:"badge-green", inactivo:"badge-slate", bloqueado:"badge-red" };

export default async function UsuariosPage() {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/login");

  const rows = await db.select({
    id: usuario.id, correo: usuario.correo, rol: usuario.rol,
    estado: usuario.estado, creadoEn: usuario.creadoEn,
    idEgresado: usuario.idEgresado,
    nombres: egresado.nombres, apellidoPaterno: egresado.apellidoPaterno, apellidoMaterno: egresado.apellidoMaterno,
  })
  .from(usuario)
  .leftJoin(egresado, eq(usuario.idEgresado, egresado.id))
  .orderBy(usuario.creadoEn);

  return (
    <AdminLayout correo={session.correo}>
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Usuarios</h1>
            <p className="page-sub">{rows.length} usuario(s) registrado(s)</p>
          </div>
          <Link href="/usuarios/nuevo" className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" /> Nuevo Usuario
          </Link>
        </div>

        {/* Tabla desktop */}
        <div className="hidden md:block tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Correo / CI</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Egresado vinculado</th>
                <th>Creado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="font-medium" style={{ color: "var(--azul-pizarra)" }}>{r.correo}</td>
                  <td><span className={cn("badge", ROL_B[r.rol] ?? "badge-slate")}>{r.rol}</span></td>
                  <td><span className={cn("badge", ESTADO_B[r.estado] ?? "badge-slate")}>{r.estado}</span></td>
                  <td className="text-sm" style={{ color: "var(--gris-grafito)" }}>
                    {r.nombres ? `${[r.apellidoPaterno, r.apellidoMaterno].filter(Boolean).join(" ") || r.nombres}, ${r.nombres}` : <span style={{ color: "var(--placeholder)" }}>—</span>}
                  </td>
                  <td className="text-sm" style={{ color: "var(--gris-grafito)" }}>{fmtDate(r.creadoEn?.toISOString())}</td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <Link href={`/usuarios/${r.id}/editar`} className="btn-slate btn-xs">
                        <Pencil className="w-3 h-3" /> Editar
                      </Link>
                      <EliminarUsuarioBtn id={r.id} correo={r.correo} />
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
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--azul-pizarra)" }}>{r.correo}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--placeholder)" }}>{fmtDate(r.creadoEn?.toISOString())}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <span className={cn("badge", ROL_B[r.rol] ?? "badge-slate")}>{r.rol}</span>
                  <span className={cn("badge", ESTADO_B[r.estado] ?? "badge-slate")}>{r.estado}</span>
                </div>
              </div>
              {r.nombres && (
                <p className="text-xs mb-2" style={{ color: "var(--gris-grafito)" }}>
                  Egresado: {[r.apellidoPaterno, r.apellidoMaterno].filter(Boolean).join(" ") || r.nombres}, {r.nombres}
                </p>
              )}
              <div className="flex gap-2">
                <Link href={`/usuarios/${r.id}/editar`} className="btn-slate btn-xs flex-1 justify-center">
                  <Pencil className="w-3 h-3" /> Editar
                </Link>
                <EliminarUsuarioBtn id={r.id} correo={r.correo} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
