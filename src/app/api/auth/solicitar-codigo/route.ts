import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { usuario } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { crearToken, crearTokenContacto, getDatosUsuarioParaEmail } from "@/lib/tokens";
import {
  sendResetPasswordEmail,
  sendVerificacionContactoEmail,
} from "@/lib/email";
import { getSession } from "@/lib/auth";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const schema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("reset_password"),
    ci:   z.string().min(4),
  }),
  z.object({
    tipo:   z.literal("verificar_correo"),
    correo: z.string().email(),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message);

    const d = parsed.data;

    // ── Reset password (por CI) ────────────────────────────────────────────
    if (d.tipo === "reset_password") {
      const [u] = await db
        .select()
        .from(usuario)
        .where(eq(usuario.ci, d.ci))
        .limit(1);

      // Respuesta genérica para no revelar si el CI existe
      if (!u || u.estado !== "activo") {
        return ok({ mensaje: "Si el CI está registrado y tiene un correo verificado, recibirás un código." });
      }

      if (!u.correoVerificado || !u.correo || u.correo.endsWith("@pendiente.local")) {
        return err("No tienes un correo verificado. Contacta al administrador.", 400);
      }

      const datos   = await getDatosUsuarioParaEmail(u.id);
      const nombres = datos?.nombres ?? "Egresado";
      const codigo  = await crearToken({ idUsuario: u.id, tipo: "reset_password" });

      await sendResetPasswordEmail({ to: u.correo, nombres, codigo });

      return ok({ mensaje: "Código enviado a tu correo." });
    }

    // ── Verificar correo (requiere sesión activa) ──────────────────────────
    const session = await getSession();
    if (!session) return err("No autorizado", 401);

    if (d.tipo === "verificar_correo") {
      const datos   = await getDatosUsuarioParaEmail(session.idUsuario);
      const nombres = datos?.nombres ?? "Egresado";
      const codigo  = await crearTokenContacto({ idUsuario: session.idUsuario, tipo: "verificar_correo" });

      // Guardar el correo temporalmente en el usuario (sin verificar aún)
      await db.update(usuario)
        .set({ correo: d.correo })
        .where(eq(usuario.id, session.idUsuario));

      await sendVerificacionContactoEmail({ to: d.correo, nombres, codigo });
      return ok({ mensaje: "Código enviado al correo." });
    }

    return err("Tipo no válido");
  } catch (e) {
    console.error("[solicitar-codigo]", e);
    return err("Error al enviar el código.", 500);
  }
}