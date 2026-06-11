import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { usuario } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, signToken, setSession } from "@/lib/auth";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const loginSchema = z.object({
  correo:   z.string().min(1, "Correo o CI requerido"),
  password: z.string().min(1, "Contraseña requerida"),
  turnstileToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.errors[0].message);

    const { correo: identificador, password, turnstileToken } = parsed.data;

    // Verificar Turnstile
    const bypass = process.env.TURNSTILE_BYPASS === "true";
    if (!bypass) {
      if (!turnstileToken) {
        return err("Captcha no completado o inválido", 400);
      }
      
      const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET || "",
          response: turnstileToken,
        }),
      });

      const turnstileData = await turnstileRes.json();
      if (!turnstileData.success) {
        return err("Validación de seguridad fallida", 400);
      }
    }

    // Buscar por correo primero, luego por CI
    let u = null;

    const [porCorreo] = await db
      .select()
      .from(usuario)
      .where(eq(usuario.correo, identificador))
      .limit(1);

    if (porCorreo) {
      u = porCorreo;
    } else {
      const [porCi] = await db
        .select()
        .from(usuario)
        .where(eq(usuario.ci, identificador))
        .limit(1);
      u = porCi ?? null;
    }

    if (!u)                    return err("Credenciales incorrectas", 401);
    if (u.estado !== "activo") return err(`Tu cuenta está ${u.estado}.`, 403);

    const valid = await verifyPassword(password, u.passwordHash);
    if (!valid) return err("Credenciales incorrectas", 401);

    if (u.primerLogin) {
      return ok({ primerLogin: true, idUsuario: u.id });
    }

    const token = await signToken({
      idUsuario:         u.id,
      correo:            u.correo,
      rol:               u.rol as "admin" | "egresado",
      idEgresado:        u.idEgresado ?? null,
      ci:                u.ci ?? null,
      correoVerificado:  u.correoVerificado,
      celularVerificado: u.celularVerificado,
    });
    setSession(token);

    return ok({ rol: u.rol, idEgresado: u.idEgresado, primerLogin: false });
  } catch (e) {
    console.error("[login]", e);
    return err("Error interno del servidor", 500);
  }
}