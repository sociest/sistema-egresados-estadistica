import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { usuario } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { crearToken } from "@/lib/tokens";
import { sendPrimerLoginEmail } from "@/lib/email";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  idUsuario: z.number().int().positive(),
  correo:    z.string().email("Correo inválido"),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.errors[0].message);

    const { idUsuario, correo } = parsed.data;

    const [u] = await db.select().from(usuario).where(eq(usuario.id, idUsuario)).limit(1);
    if (!u) return err("Usuario no encontrado", 404);
    if (!u.primerLogin) return err("Esta cuenta ya fue activada", 400);

    // Actualizar correo en el usuario
    await db.update(usuario).set({ correo }).where(eq(usuario.id, idUsuario));

    // Enviar código de verificación al correo
    const codigo = await crearToken({ idUsuario, tipo: "primer_login" });

    let nombres = correo.split("@")[0];
    if (u.idEgresado) {
      const { egresado } = await import("@/lib/schema");
      const [eg] = await db.select({ nombres: egresado.nombres })
        .from(egresado).where(eq(egresado.id, u.idEgresado)).limit(1);
      if (eg) nombres = eg.nombres;
    }

    await sendPrimerLoginEmail({ to: correo, nombres, codigo });

    return ok({ metodo: "correo", correo });
  } catch (e) {
    console.error("[agregar-contacto]", e);
    return err("Error interno", 500);
  }
}