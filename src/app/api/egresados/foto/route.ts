// src/app/api/egresados/foto/route.ts
import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";
import { egresado } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ok, err } from "@/lib/utils";
import { registrarAudit, getIpFromRequest } from "@/lib/audit";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "perfiles");

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return err("No autorizado", 401);

    const formData = await req.formData();
    const archivo  = formData.get("archivo") as File | null;
    // Si viene idEgresado en el form, lo usa (admin); si no, usa el del token
    const idParam  = formData.get("idEgresado");
    let idEgresado: number | null = null;

    if (session.rol === "admin" && idParam) {
      idEgresado = parseInt(String(idParam));
      if (isNaN(idEgresado)) return err("ID de egresado inválido");
    } else if (session.rol === "egresado") {
      if (!session.idEgresado) return err("No tienes un perfil de egresado vinculado", 403);
      idEgresado = session.idEgresado;
    } else {
      return err("No autorizado", 403);
    }

    if (!archivo) return err("No se recibió ningún archivo");
    if (!ALLOWED_TYPES.includes(archivo.type)) {
      return err("Solo se aceptan imágenes JPG, PNG o WEBP");
    }
    if (archivo.size > MAX_SIZE_BYTES) {
      return err("La imagen no puede superar los 5MB");
    }

    // Obtener el CI del egresado para el nombre del archivo
    const [eg] = await db
      .select({ ci: egresado.ci })
      .from(egresado)
      .where(eq(egresado.id, idEgresado))
      .limit(1);

    if (!eg) return err("Egresado no encontrado", 404);

    const ext           = archivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const nombreArchivo = `perfil_${eg.ci}_${Date.now()}.${ext}`;
    const rutaCompleta  = join(UPLOAD_DIR, nombreArchivo);

    await mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await archivo.arrayBuffer());
    await writeFile(rutaCompleta, buffer);

    const urlPublica = `/uploads/perfiles/${nombreArchivo}`;

    await db
      .update(egresado)
      .set({ fotoUrl: urlPublica })
      .where(eq(egresado.id, idEgresado));

    registrarAudit({
      idUsuario: session.rol === "admin" ? session.idUsuario : session.idUsuario,
      accion:    "editar",
      entidad:   "egresado",
      entidadId: idEgresado,
      datosNuevos: { fotoUrl: urlPublica, ci: eg.ci },
      ip: getIpFromRequest(req),
    });

    return ok({ url: urlPublica });
  } catch (e) {
    console.error("[foto perfil]", e);
    return err("Error al guardar la foto", 500);
  }
}