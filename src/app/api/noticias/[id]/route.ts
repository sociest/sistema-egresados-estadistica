import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { noticias } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { noticiaSchema } from "@/lib/validations";
import { ok, err } from "@/lib/utils";
import { registrarAudit, getIpFromRequest } from "@/lib/audit";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return err("ID inválido");

    const [row] = await db.select().from(noticias).where(eq(noticias.id, id)).limit(1);
    if (!row) return err("Noticia no encontrada", 404);

    // Si no es admin, solo puede ver publicadas
    const session = await getSession();
    if (session?.rol !== "admin" && !row.publicado) return err("No encontrada", 404);

    return ok(row);
  } catch (e) {
    console.error("[noticia GET id]", e);
    return err("Error", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);

    const id = parseInt(params.id);
    if (isNaN(id)) return err("ID inválido");

    const parsed = noticiaSchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.errors[0].message);

    const [current] = await db.select().from(noticias).where(eq(noticias.id, id)).limit(1);
    if (!current) return err("Noticia no encontrada", 404);

    const d = parsed.data;
    const [updated] = await db.update(noticias).set({
      titulo:        d.titulo,
      cuerpo:        d.cuerpo,
      tipo:          d.tipo,
      fecha:         d.fecha,
      imagenUrl:     d.imagenUrl ?? null,
      publicado:     d.publicado,
      actualizadoEn: new Date(),
    })
    .where(eq(noticias.id, id))
    .returning();

    if (!updated) return err("Noticia no encontrada", 404);

    registrarAudit({
      idUsuario: session.idUsuario,
      accion:    "editar",
      entidad:   "noticia",
      entidadId: id,
      datosAnteriores: {
        titulo: current.titulo,
        tipo: current.tipo,
        fecha: current.fecha,
        publicado: current.publicado,
      },
      datosNuevos: {
        titulo: updated.titulo,
        tipo: updated.tipo,
        fecha: updated.fecha,
        publicado: updated.publicado,
      },
      ip: getIpFromRequest(req),
    });

    return ok(updated);
  } catch (e) {
    console.error("[noticia PUT id]", e);
    return err("Error al actualizar", 500);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);

    const id = parseInt(params.id);
    if (isNaN(id)) return err("ID inválido");

    const [deleted] = await db.delete(noticias).where(eq(noticias.id, id)).returning();
    if (!deleted) return err("Noticia no encontrada", 404);

    return ok({ message: "Eliminada correctamente" });
  } catch (e) {
    console.error("[noticia DELETE id]", e);
    return err("Error al eliminar", 500);
  }
}