import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { usuario, egresado } from "@/lib/schema";
import { eq, ilike, or } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";
import { usuarioSchema } from "@/lib/validations";
import { ok, err } from "@/lib/utils";
import { registrarAudit, getIpFromRequest } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);

    const busqueda = new URL(req.url).searchParams.get("busqueda") ?? "";
    const where = busqueda
      ? or(ilike(usuario.correo, `%${busqueda}%`))
      : undefined;

    const rows = await db.select({
      id:              usuario.id,
      correo:          usuario.correo,
      rol:             usuario.rol,
      estado:          usuario.estado,
      idEgresado:      usuario.idEgresado,
      creadoEn:        usuario.creadoEn,
      nombres:         egresado.nombres,
      apellidoPaterno: egresado.apellidoPaterno,
      apellidoMaterno: egresado.apellidoMaterno,
      
    })
    .from(usuario)
    .leftJoin(egresado, eq(usuario.idEgresado, egresado.id))
    .where(where)
    .orderBy(usuario.creadoEn);

    return ok(rows);
  } catch (e) { console.error(e); return err("Error", 500); }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);

    const parsed = usuarioSchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.errors[0].message);

    const d    = parsed.data;
    const hash = await hashPassword(d.password);

    const [row] = await db.insert(usuario).values({
      correo:       d.correo,
      passwordHash: hash,
      rol:          d.rol,
      estado:       d.estado,
      idEgresado:   d.idEgresado ?? null,
    }).returning({ id: usuario.id, correo: usuario.correo, rol: usuario.rol, estado: usuario.estado });

    registrarAudit({
      idUsuario:   session.idUsuario,
      accion:      "crear",
      entidad:     "usuario",
      entidadId:   row.id,
      datosNuevos: { correo: row.correo, rol: row.rol },
      ip:          getIpFromRequest(req),
    });
    
    return ok(row, 201);
  } catch (e: any) {
    console.error(e);
    if (e.code === "23505") return err("Ya existe un usuario con ese correo");
    return err("Error al crear usuario", 500);
  }
}
