import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { noticias } from "@/lib/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { noticiaSchema } from "@/lib/validations";
import { ok, err } from "@/lib/utils";
import { registrarAudit, getIpFromRequest } from "@/lib/audit";

// GET — listado público (solo publicados) o completo para admin
export async function GET(req: NextRequest) {
  try {
    const sp      = new URL(req.url).searchParams;
    const session = await getSession();
    const soloPublicados = session?.rol !== "admin";
    const tipo    = sp.get("tipo");
    const limite  = parseInt(sp.get("limite") ?? "50");

    const conds: any[] = [];
    if (soloPublicados) conds.push(eq(noticias.publicado, true));
    if (tipo)           conds.push(sql`${noticias.tipo}::text = ${tipo}`);

    const where = conds.length > 0 ? and(...conds) : undefined;

    const rows = await db.select({
      id:           noticias.id,
      titulo:       noticias.titulo,
      cuerpo:       noticias.cuerpo,
      tipo:         noticias.tipo,
      fecha:        noticias.fecha,
      imagenUrl:    noticias.imagenUrl,
      publicado:    noticias.publicado,
      creadoEn:     noticias.creadoEn,
      actualizadoEn: noticias.actualizadoEn,
    })
    .from(noticias)
    .where(where)
    .orderBy(desc(noticias.fecha))
    .limit(limite);

    return ok(rows);
  } catch (e) {
    console.error("[noticias GET]", e);
    return err("Error al obtener noticias", 500);
  }
}

// POST — crear noticia (solo admin)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);

    const parsed = noticiaSchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.errors[0].message);

    const d = parsed.data;
    const [row] = await db.insert(noticias).values({
      titulo:    d.titulo,
      cuerpo:    d.cuerpo,
      tipo:      d.tipo,
      fecha:     d.fecha,
      imagenUrl: d.imagenUrl ?? null,
      publicado: d.publicado,
    }).returning();

    registrarAudit({
      idUsuario: session.idUsuario,
      accion:    "crear",
      entidad:   "noticia",
      entidadId: row.id,
      datosNuevos: {
        titulo: row.titulo,
        tipo: row.tipo,
        fecha: row.fecha,
        publicado: row.publicado,
      },
      ip: getIpFromRequest(req),
    });

    return ok(row, 201);
  } catch (e) {
    console.error("[noticias POST]", e);
    return err("Error al crear noticia", 500);
  }
}