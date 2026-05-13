import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { usuario, egresado } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { validarToken, consumirToken } from "@/lib/tokens";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  idUsuario: z.number().int().positive().optional(),
  codigo:    z.string().length(6),
  metodo:    z.enum(["correo", "celular"]).optional(),
  // Para el flujo desde ContactoVerificacionModal (solicitar-codigo)
  tipo:      z.enum(["verificar_correo", "verificar_celular"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.errors[0].message);

    const { idUsuario: idUsuarioBody, codigo, metodo, tipo } = parsed.data;

    // Determinar el método real (viene como "metodo" desde activar-cuenta
    // o como "tipo" desde ContactoVerificacionModal)
    const metodoReal: "correo" | "celular" | null =
      metodo ??
      (tipo === "verificar_correo"  ? "correo"  :
       tipo === "verificar_celular" ? "celular" : null);

    if (!metodoReal) return err("Método de verificación no especificado");

    // Obtener idUsuario: viene en el body (flujo activar-cuenta)
    // o desde la sesión (flujo ContactoVerificacionModal)
    let idUsuario = idUsuarioBody;
    if (!idUsuario) {
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      if (!session) return err("No autorizado", 401);
      idUsuario = session.idUsuario;
    }

    const [u] = await db.select().from(usuario).where(eq(usuario.id, idUsuario)).limit(1);
    if (!u) return err("Usuario no encontrado", 404);

    // El tipo de token a validar depende del flujo
    // - activar-cuenta usa tipo "primer_login"
    // - ContactoVerificacionModal usa "verificar_correo" / "verificar_celular"
    const tipoToken = tipo ?? "primer_login";

    const { valido, error } = await validarToken({
      idUsuario,
      codigo,
      tipo: tipoToken as any,
    });
    if (!valido) return err(error ?? "Código inválido");

    // ── Actualizar campos según el método ────────────────────────────────
    if (metodoReal === "correo") {
      // Marcar correo como verificado en usuario
      await db.update(usuario)
        .set({ correoVerificado: true })
        .where(eq(usuario.id, idUsuario));

      // Sincronizar correoElectronico en la tabla egresado
      // (el correo ya fue guardado en usuario.correo por solicitar-codigo)
      if (u.idEgresado && u.correo && !u.correo.endsWith("@pendiente.local")) {
        await db.update(egresado)
          .set({ correoElectronico: u.correo })
          .where(eq(egresado.id, u.idEgresado));
      }
    }

    if (metodoReal === "celular") {
      await db.update(usuario)
        .set({ celularVerificado: true })
        .where(eq(usuario.id, idUsuario));
    }

    await consumirToken({ idUsuario, codigo, tipo: tipoToken as any });

    return ok({ verificado: true, metodo: metodoReal });
  } catch (e) {
    console.error("[verificar-contacto]", e);
    return err("Error interno", 500);
  }
}