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
  metodo:    z.enum(["correo"]).optional(),
  tipo:      z.enum(["verificar_correo"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.errors[0].message);

    const { idUsuario: idUsuarioBody, codigo } = parsed.data;

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

    // El tipo de token a validar depende del flujo:
    // - activar-cuenta usa tipo "primer_login"
    // - ContactoVerificacionModal usa "verificar_correo"
    // Detectamos cuál usar según si es primerLogin o no
    const tipoToken = u.primerLogin ? "primer_login" : "verificar_correo";

    const { valido, error } = await validarToken({
      idUsuario,
      codigo,
      tipo: tipoToken as any,
    });
    if (!valido) return err(error ?? "Código inválido");

    // Marcar correo como verificado
    await db.update(usuario)
      .set({ correoVerificado: true })
      .where(eq(usuario.id, idUsuario));

    // Sincronizar correoElectronico en la tabla egresado
    if (u.idEgresado && u.correo && !u.correo.endsWith("@pendiente.local")) {
      await db.update(egresado)
        .set({ correoElectronico: u.correo })
        .where(eq(egresado.id, u.idEgresado));
    }

    await consumirToken({ idUsuario, codigo, tipo: tipoToken as any });

    return ok({ verificado: true, metodo: "correo" });
  } catch (e) {
    console.error("[verificar-contacto]", e);
    return err("Error interno", 500);
  }
}