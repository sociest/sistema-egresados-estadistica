// src/lib/audit.ts
import { db } from "@/lib/db";
import { auditLog } from "@/lib/schema";

interface AuditOpts {
  idUsuario:        number | null | undefined;
  accion:           "crear" | "editar" | "eliminar";
  entidad:          "egresado" | "usuario" | "noticia" | "encuesta" | "titulado" | "backup";
  entidadId:        number | null | undefined;
  datosAnteriores?: object | null;
  datosNuevos?:     object | null;
  ip?:              string | null;
}

export function registrarAudit(opts: AuditOpts): void {
  db.insert(auditLog).values({
    idUsuario:       opts.idUsuario ?? null,
    accion:          opts.accion,
    entidad:         opts.entidad as any,
    entidadId:       opts.entidadId ?? null,
    datosAnteriores: opts.datosAnteriores
      ? JSON.stringify(opts.datosAnteriores)
      : null,
    datosNuevos: opts.datosNuevos
      ? JSON.stringify(opts.datosNuevos)
      : null,
    ip: opts.ip ?? null,
  }).catch(e => {
    console.error("[audit] Error al registrar:", e);
  });
}

export function getIpFromRequest(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip === "::1" || ip === "127.0.0.1") return "local";
    return ip;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp === "::1" || realIp === "127.0.0.1") return "local";
  return realIp ?? null;
}