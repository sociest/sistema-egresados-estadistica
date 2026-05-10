import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getSession } from "@/lib/auth";
import { ok, err } from "@/lib/utils";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "noticias");

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);

    const formData = await req.formData();
    const archivo  = formData.get("archivo") as File | null;

    if (!archivo) return err("No se recibió ningún archivo");
    if (!ALLOWED_TYPES.includes(archivo.type)) {
      return err("Solo se aceptan imágenes JPG, PNG o WEBP");
    }
    if (archivo.size > MAX_SIZE_BYTES) {
      return err("La imagen no puede superar los 5MB");
    }

    // Generar nombre único con timestamp
    const ext        = archivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const nombreBase = archivo.name
      .replace(/\.[^/.]+$/, "")          // quitar extensión
      .replace(/[^a-zA-Z0-9_-]/g, "_")   // caracteres seguros
      .slice(0, 40);
    const nombreArchivo = `noticia_${Date.now()}_${nombreBase}.${ext}`;
    const rutaCompleta  = join(UPLOAD_DIR, nombreArchivo);

    // Asegurar que el directorio existe
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Guardar archivo
    const buffer = Buffer.from(await archivo.arrayBuffer());
    await writeFile(rutaCompleta, buffer);

    const urlPublica = `/uploads/noticias/${nombreArchivo}`;
    return ok({ url: urlPublica });
  } catch (e) {
    console.error("[upload]", e);
    return err("Error al guardar la imagen", 500);
  }
}