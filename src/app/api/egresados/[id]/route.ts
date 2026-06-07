// src/app/api/egresados/[id]/route.ts
// Actualizado — Bloque 0: soporta tipo, campos exclusivos Egresado y campos compartidos

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { egresado, historialLaboral } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { egresadoSchema } from "@/lib/validations";
import { ok, err } from "@/lib/utils";
import { registrarAudit, getIpFromRequest } from "@/lib/audit";


export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return err("No autorizado", 401);

    const id = parseInt(params.id);
    if (isNaN(id)) return err("ID inválido");

    if (session.rol === "egresado" && session.idEgresado !== id)
      return err("No autorizado", 403);

    const [eg] = await db.select().from(egresado).where(eq(egresado.id, id)).limit(1);
    if (!eg) return err("Egresado no encontrado", 404);

    const historial = await db.select()
      .from(historialLaboral)
      .where(eq(historialLaboral.idEgresado, id))
      .orderBy(historialLaboral.fechaInicio);

    return ok({ ...eg, historial });
  } catch (e) {
    console.error("[egresado GET id]", e);
    return err("Error", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return err("No autorizado", 401);

    const id = parseInt(params.id);
    if (isNaN(id)) return err("ID inválido");

    if (session.rol === "egresado" && session.idEgresado !== id)
      return err("No autorizado", 403);

    const parsed = egresadoSchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.errors[0].message);

    const d = parsed.data;

    const [updated] = await db.update(egresado).set({
      // Bloque 0
      tipo:                 d.tipo,
      // Datos personales
      nombres:              d.nombres,
      apellidoPaterno:      d.apellidoPaterno     ?? null,
      apellidoMaterno:      d.apellidoMaterno     ?? null,
      ci:                   d.ci,
      nacionalidad:         d.nacionalidad        ?? null,
      genero:               d.genero              ?? null,
      correoElectronico:    d.correoElectronico   ?? null,
      celular:              d.celular             ?? null,
      telefono:             d.celular             ?? null,
      fechaNacimiento:      d.fechaNacimiento,
      // Redes y área (Bloque 0 compartidos)
      facebook:             d.facebook            ?? null,
      linkedin:             d.linkedin            ?? null,
      areaEspecializacion:  d.areaEspecializacion ?? null,
      observaciones:        d.observaciones       ?? null,
      estadoLaboral:        d.estadoLaboral       ?? null,
      // Legacy
      anioIngreso:          d.anioIngreso         ?? null,
      anioEgreso:           d.anioEgreso          ?? null,
      anioTitulacion:       d.anioTitulacion      ?? null,
      promedio:             d.promedio != null ? String(d.promedio) : null,
      modalidadTitulacion:  d.modalidadTitulacion ?? null,
      // Campos exclusivos Egresado (Bloque 0)
      inicioProceso:        d.tipo === "Egresado" ? (d.inicioProceso ?? null) : null,
      motivoNoTitulacion:   d.tipo === "Egresado" ? (d.motivoNoTitulacion ?? null) : null,
      planeaTitularse:      d.tipo === "Egresado" ? (d.planeaTitularse ?? null) : null,
      lugarResidencia:      d.lugarResidencia     ?? null,
      fallecido:            d.fallecido           ?? false,
    })
    .where(eq(egresado.id, id))
    .returning();

    if (!updated) return err("Egresado no encontrado", 404);
    registrarAudit({
      idUsuario: session.idUsuario,
      accion:    "editar",
      entidad:   d.tipo === "Titulado" ? "titulado" : "egresado",
      entidadId: id,
      datosNuevos: {
        ci:                  d.ci,
        nombres:             d.nombres,
        apellidoPaterno:     d.apellidoPaterno ?? null,
        apellidoMaterno:     d.apellidoMaterno ?? null,
        tipo:                d.tipo,
        genero:              d.genero ?? null,
        correoElectronico:   d.correoElectronico ?? null,
        celular:             d.celular ?? null,
        anioIngreso:         d.anioIngreso ?? null,
        anioEgreso:          d.anioEgreso ?? null,
        anioTitulacion:      d.anioTitulacion ?? null,
        modalidadTitulacion: d.modalidadTitulacion ?? null,
        lugarResidencia:     d.lugarResidencia ?? null,
        areaEspecializacion: d.areaEspecializacion ?? null,
        observaciones:       d.observaciones ?? null,
        fallecido:           d.fallecido ?? false,
      },
      ip: getIpFromRequest(req),
    });

    return ok(updated);
  } catch (e: any) {
    console.error("[egresado PUT id]", e);
    if (e.code === "23505") return err("Ya existe un egresado con ese CI");
    return err("Error al actualizar", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);

    const id = parseInt(params.id);
    if (isNaN(id)) return err("ID inválido");

    const [deleted] = await db.delete(egresado).where(eq(egresado.id, id)).returning();
    if (!deleted) return err("Egresado no encontrado", 404);

    registrarAudit({
      idUsuario: session.idUsuario,
      accion:    "eliminar",
      entidad:   deleted.tipo === "Titulado" ? "titulado" : "egresado",
      entidadId: id,
      datosAnteriores: {
        id:      deleted.id,
        ci:      deleted.ci,
        nombres: deleted.nombres,
        tipo:    deleted.tipo,
      },
      ip: getIpFromRequest(req),
    });
    
    return ok({ message: "Eliminado correctamente" });

    
  } catch (e) {
    console.error("[egresado DELETE id]", e);
    return err("Error al eliminar", 500);
  }
}
