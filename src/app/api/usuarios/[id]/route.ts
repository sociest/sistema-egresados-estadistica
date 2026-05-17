import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { usuario } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";
import { usuarioEditSchema } from "@/lib/validations";
import { ok, err } from "@/lib/utils";
import { registrarAudit, getIpFromRequest } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);
    const id = parseInt(params.id);
    if (isNaN(id)) return err("ID inválido");
    const parsed = usuarioEditSchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.errors[0].message);
    const d = parsed.data;
    const sets: any = {
      rol: d.rol, estado: d.estado,
      idEgresado: d.idEgresado ?? null,
    };
    if (d.nuevaPassword) sets.passwordHash = await hashPassword(d.nuevaPassword);
    const [r] = await db.update(usuario).set(sets).where(eq(usuario.id, id)).returning({
      id: usuario.id, correo: usuario.correo, rol: usuario.rol, estado: usuario.estado,
    });
    if (!r) return err("Usuario no encontrado", 404);
    registrarAudit({
      idUsuario:   session.idUsuario,
      accion:      "editar",
      entidad:     "usuario",
      entidadId:   id,
      datosNuevos: { rol: d.rol, estado: d.estado },
      ip:          getIpFromRequest(req),
    });
    return ok(r);
  } catch (e) { console.error(e); return err("Error", 500); }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);
    const id = parseInt(params.id);
    if (isNaN(id)) return err("ID inválido");
    if (session.idUsuario === id) return err("No puedes eliminarte a ti mismo");
    const [r] = await db.delete(usuario).where(eq(usuario.id, id)).returning();
    if (!r) return err("Usuario no encontrado", 404);
    registrarAudit({
      idUsuario:       session.idUsuario,
      accion:          "eliminar",
      entidad:         "usuario",
      entidadId:       id,
      datosAnteriores: { id: r.id },
      ip:              getIpFromRequest(req),
    });
    return ok({ message: "Eliminado" });
  } catch (e) { console.error(e); return err("Error", 500); }
}
