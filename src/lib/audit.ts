// src/lib/audit.ts
import { db } from "@/lib/db";
import { auditLog } from "@/lib/schema";

interface AuditOpts {
  idUsuario:       number | null | undefined;
  accion:          "crear" | "editar" | "eliminar";
  entidad:         "egresado" | "usuario" | "noticia" | "encuesta";
  entidadId:       number | null | undefined;
  datosAnteriores?: object | null;
  datosNuevos?:     object | null;
  ip?:             string | null;
}

/**
 * Registra una entrada en el audit log de forma no bloqueante (fire-and-forget).
 * NO usar await — se llama y se olvida para no enlentecer las respuestas.
 */
export function registrarAudit(opts: AuditOpts): void {
  db.insert(auditLog).values({
    idUsuario:       opts.idUsuario ?? null,
    accion:          opts.accion,
    entidad:         opts.entidad,
    entidadId:       opts.entidadId ?? null,
    datosAnteriores: opts.datosAnteriores
      ? JSON.stringify(opts.datosAnteriores)
      : null,
    datosNuevos: opts.datosNuevos
      ? JSON.stringify(opts.datosNuevos)
      : null,
    ip: opts.ip ?? null,
  }).catch(e => {
    // Silencioso: el audit nunca debe romper el flujo principal
    console.error("[audit] Error al registrar:", e);
  });
}

/** Extrae la IP de los headers de Next.js */
export function getIpFromRequest(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? null;
}