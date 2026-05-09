// src/app/api/egresados/route.ts
// Actualizado — Bloque 0: soporta tipo, campos exclusivos Egresado y campos compartidos

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { egresado, usuario } from "@/lib/schema";
import { eq, ilike, and, or, sql, desc } from "drizzle-orm";
import { getSession, hashPassword } from "@/lib/auth";
import { egresadoSchema } from "@/lib/validations";
import { ok, err, generarPasswordInicial } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);

    const sp       = new URL(req.url).searchParams;
    const busqueda = sp.get("busqueda") ?? "";
    const anio     = sp.get("anioEgreso");
    const empleo   = sp.get("conEmpleo");
    const genero   = sp.get("genero");
    // Bloque 0: filtro por tipo
    const tipo     = sp.get("tipo");
    const page     = Math.max(1, parseInt(sp.get("page") ?? "1"));
    const pageSize = 12;

    const conds: any[] = [];
    if (busqueda) conds.push(or(
      ilike(egresado.nombres,         `%${busqueda}%`),
      ilike(egresado.apellidoPaterno, `%${busqueda}%`),
      ilike(egresado.apellidoMaterno, `%${busqueda}%`),
      ilike(egresado.ci,              `%${busqueda}%`),
    ));
    if (anio)   conds.push(sql`${egresado.anioEgreso} = ${parseInt(anio)}`);
    if (genero) conds.push(sql`${egresado.genero} = ${genero}`);
    if (tipo)   conds.push(sql`${egresado.tipo} = ${tipo}`);
    if (empleo === "true")
      conds.push(sql`EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado=${egresado.id} AND h.fecha_fin IS NULL)`);
    if (empleo === "false")
      conds.push(sql`NOT EXISTS(SELECT 1 FROM historial_laboral h WHERE h.id_egresado=${egresado.id} AND h.fecha_fin IS NULL)`);

    // Bloque 3: excluir fallecidos del listado admin por defecto
    const mostrarFallecidos = sp.get("incluirFallecidos") === "true";
    if (!mostrarFallecidos) conds.push(sql`${egresado.fallecido} = false`);
    const where = conds.length > 0 ? and(...conds) : undefined;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(egresado).where(where);

    const rows = await db.select({
      id:                  egresado.id,
      nombres:             egresado.nombres,
      apellidoPaterno:     egresado.apellidoPaterno,
      apellidoMaterno:     egresado.apellidoMaterno,
      ci:                  egresado.ci,
      celular:             egresado.celular,
      genero:              egresado.genero,
      tipo:                egresado.tipo,           // Bloque 0
      anioEgreso:          egresado.anioEgreso,
      anioTitulacion:      egresado.anioTitulacion,
      modalidadTitulacion: egresado.modalidadTitulacion,
      areaEspecializacion: egresado.areaEspecializacion, // Bloque 0
      tieneEmpleo: sql<boolean>`EXISTS(
        SELECT 1 FROM historial_laboral h
        WHERE h.id_egresado=${egresado.id} AND h.fecha_fin IS NULL
      )`,
    })
    .from(egresado).where(where)
    .orderBy(desc(egresado.fechaRegistro))
    .limit(pageSize).offset((page - 1) * pageSize);

    return Response.json({
      data: rows, total, page, pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error("[egresados GET]", e);
    return err("Error al obtener egresados", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);

    const parsed = egresadoSchema.safeParse(await req.json());
    if (!parsed.success) return err(parsed.error.errors[0].message);

    const d = parsed.data;

    // Verificar correo único si se proporcionó
    if (d.correoElectronico) {
      const [existe] = await db
        .select({ id: usuario.id })
        .from(usuario)
        .where(eq(usuario.correo, d.correoElectronico))
        .limit(1);
      if (existe) return err("Ya existe un usuario con ese correo electrónico.");
    }

    const resultado = await db.transaction(async (tx) => {

      const [nuevoEgresado] = await tx.insert(egresado).values({
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
        // Campos exclusivos Egresado (Bloque 0) — solo si tipo=Egresado
        inicioProceso:        d.tipo === "Egresado" ? (d.inicioProceso ?? null) : null,
        motivoNoTitulacion:   d.tipo === "Egresado" ? (d.motivoNoTitulacion ?? null) : null,
        planeaTitularse:      d.tipo === "Egresado" ? (d.planeaTitularse ?? null) : null,
        lugarResidencia:      d.lugarResidencia     ?? null,
        // fallecido solo lo puede marcar el admin desde editar, no en creación
      }).returning();

      return nuevoEgresado;
    });

    return ok(resultado, 201);
  } catch (e: any) {
    console.error("[egresados POST]", e);
    if (e.code === "23505") return err("Ya existe un egresado con ese CI");
    return err("Error al crear egresado", 500);
  }
}
