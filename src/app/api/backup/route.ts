// src/app/api/backup/route.ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { egresado, historialLaboral, postgrado, usuario, auditLog } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { err } from "@/lib/utils";
import * as XLSX from "xlsx";
import { registrarAudit, getIpFromRequest } from "@/lib/audit";

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "admin") return err("No autorizado", 403);

    // ── Cargar todos los datos en paralelo ─────────────────────────────────
    const [egresados, historial, postgrados, usuarios, auditLogs] = await Promise.all([
      db.select().from(egresado).orderBy(egresado.apellidoPaterno),
      db.select().from(historialLaboral).orderBy(historialLaboral.idEgresado),
      db.select().from(postgrado).orderBy(postgrado.idEgresado),
      db.select({
        id:          usuario.id,
        ci:          usuario.ci,
        correo:      usuario.correo,
        rol:         usuario.rol,
        estado:      usuario.estado,
        idEgresado:  usuario.idEgresado,
        primerLogin: usuario.primerLogin,
        correoVerificado:  usuario.correoVerificado,
        celularVerificado: usuario.celularVerificado,
        creadoEn:    usuario.creadoEn,
        // passwordHash EXCLUIDO intencionalmente
      }).from(usuario).orderBy(usuario.creadoEn),
      db.select().from(auditLog).orderBy(desc(auditLog.creadoEn)).limit(1000),
    ]);

    const fechaGen = new Date().toLocaleDateString("es-BO", {
      day: "2-digit", month: "long", year: "numeric",
    });
    const fechaArchivo = new Date().toISOString().split("T")[0];

    const wb = XLSX.utils.book_new();

    // ── Hoja 1: Egresados ──────────────────────────────────────────────────
    const rowsEgresados = egresados.map(e => ({
      "ID":                     e.id,
      "Tipo":                   e.tipo ?? "",
      "Apellido Paterno":       e.apellidoPaterno ?? "",
      "Apellido Materno":       e.apellidoMaterno ?? "",
      "Nombres":                e.nombres,
      "CI":                     e.ci,
      "Género":                 e.genero ?? "",
      "Fecha Nacimiento":       e.fechaNacimiento ?? "",
      "Nacionalidad":           e.nacionalidad ?? "",
      "Celular":                e.celular ?? e.telefono ?? "",
      "Correo":                 e.correoElectronico ?? "",
      "Lugar Residencia":       e.lugarResidencia ?? "",
      "Año Ingreso":            e.anioIngreso ?? "",
      "Semestre Ingreso":       e.semestreIngreso ?? "",
      "Año Egreso":             e.anioEgreso ?? "",
      "Semestre Egreso":        e.semestreEgreso ?? "",
      "Año Titulación":         e.anioTitulacion ?? "",
      "Modalidad Titulación":   e.modalidadTitulacion ?? "",
      "Promedio":               e.promedio ?? "",
      "Área Especialización":   e.areaEspecializacion ?? "",
      "Planea Titularse":       e.planeaTitularse ?? "",
      "Motivo No Titulación":   e.motivoNoTitulacion ?? "",
      "Facebook":               e.facebook ?? "",
      "LinkedIn":               e.linkedin ?? "",
      "Observaciones":          e.observaciones ?? "",
      "Fallecido":              e.fallecido ? "Sí" : "No",
      "Visible Directorio":     e.mostrarEnDirectorio ? "Sí" : "No",
      "Fecha Registro":         e.fechaRegistro
        ? new Date(e.fechaRegistro).toLocaleDateString("es-BO")
        : "",
    }));

    const metaEg = [
      ["BACKUP — SISTEMA DE SEGUIMIENTO DE EGRESADOS · CARRERA DE ESTADÍSTICA UMSA"],
      [`Fecha de generación: ${fechaGen}`],
      [`Total egresados: ${egresados.length}`],
      [],
    ];
    const wsEg = XLSX.utils.aoa_to_sheet(metaEg);
    XLSX.utils.sheet_add_json(wsEg, rowsEgresados, { origin: 4 });
    wsEg["!cols"] = [
      {wch:6},{wch:12},{wch:18},{wch:18},{wch:20},{wch:12},{wch:12},{wch:16},
      {wch:14},{wch:12},{wch:26},{wch:20},{wch:12},{wch:16},{wch:12},{wch:16},
      {wch:16},{wch:20},{wch:10},{wch:22},{wch:16},{wch:25},{wch:20},{wch:20},
      {wch:25},{wch:10},{wch:18},{wch:16},
    ];
    XLSX.utils.book_append_sheet(wb, wsEg, "Egresados");

    // ── Hoja 2: Historial Laboral ──────────────────────────────────────────
    const rowsHistorial = historial.map(h => ({
      "ID":                    h.id,
      "ID Egresado":           h.idEgresado,
      "Empresa":               h.empresa,
      "Cargo":                 h.cargo,
      "Área":                  h.area ?? "",
      "Tipo Contrato":         h.tipoContrato ?? "",
      "Ciudad/Región Trabajo": h.ciudadRegionTrabajo ?? "",
      "Sector Trabajo":        h.sectorTrabajo ?? "",
      "Fecha Inicio":          h.fechaInicio ?? "",
      "Fecha Fin":             h.fechaFin ?? "",
      "¿Trabajo Actual?":      h.fechaFin === null ? "Sí" : "No",
    }));
    const wsHist = XLSX.utils.json_to_sheet(rowsHistorial);
    wsHist["!cols"] = [
      {wch:6},{wch:12},{wch:20},{wch:22},{wch:16},{wch:16},{wch:22},{wch:16},{wch:14},{wch:14},{wch:14},
    ];
    XLSX.utils.book_append_sheet(wb, wsHist, "Historial Laboral");

    // ── Hoja 3: Postgrados ────────────────────────────────────────────────
    const rowsPostgrados = postgrados.map(p => ({
      "ID":          p.id,
      "ID Egresado": p.idEgresado,
      "Tipo":        p.tipo,
      "Institución": p.institucion,
      "País":        p.pais,
      "Año Inicio":  p.anioInicio,
      "Año Fin":     p.anioFin ?? "",
      "Estado":      p.estado,
    }));
    const wsPg = XLSX.utils.json_to_sheet(rowsPostgrados);
    wsPg["!cols"] = [{wch:6},{wch:12},{wch:14},{wch:26},{wch:12},{wch:12},{wch:10},{wch:12}];
    XLSX.utils.book_append_sheet(wb, wsPg, "Postgrados");

    // ── Hoja 4: Usuarios (sin passwordHash) ───────────────────────────────
    const rowsUsuarios = usuarios.map(u => ({
      "ID":                 u.id,
      "CI":                 u.ci ?? "",
      "Correo":             u.correo,
      "Rol":                u.rol,
      "Estado":             u.estado,
      "ID Egresado":        u.idEgresado ?? "",
      "Primer Login":       u.primerLogin ? "Sí" : "No",
      "Correo Verificado":  u.correoVerificado ? "Sí" : "No",
      "Celular Verificado": u.celularVerificado ? "Sí" : "No",
      "Creado En":          u.creadoEn
        ? new Date(u.creadoEn).toLocaleDateString("es-BO")
        : "",
    }));
    const wsUs = XLSX.utils.json_to_sheet(rowsUsuarios);
    wsUs["!cols"] = [{wch:6},{wch:12},{wch:26},{wch:12},{wch:12},{wch:12},{wch:12},{wch:18},{wch:18},{wch:14}];
    XLSX.utils.book_append_sheet(wb, wsUs, "Usuarios");

    // ── Hoja 5: Audit Log (últimos 1000) ──────────────────────────────────
    const rowsAudit = auditLogs.map(a => ({
      "ID":               a.id,
      "ID Usuario":       a.idUsuario ?? "",
      "Acción":           a.accion,
      "Entidad":          a.entidad,
      "ID Entidad":       a.entidadId ?? "",
      "Datos Anteriores": a.datosAnteriores ?? "",
      "Datos Nuevos":     a.datosNuevos ?? "",
      "IP":               a.ip ?? "",
      "Fecha":            a.creadoEn
        ? new Date(a.creadoEn).toLocaleString("es-BO")
        : "",
    }));
    const wsAudit = XLSX.utils.json_to_sheet(rowsAudit);
    wsAudit["!cols"] = [{wch:6},{wch:12},{wch:12},{wch:12},{wch:12},{wch:40},{wch:40},{wch:16},{wch:20}];
    XLSX.utils.book_append_sheet(wb, wsAudit, "Audit Log");

    // ── Hoja 6: Resumen ───────────────────────────────────────────────────
    const resumen = [
      ["BACKUP COMPLETO — SISTEMA DE SEGUIMIENTO DE EGRESADOS"],
      [`Fecha: ${fechaGen}`],
      [],
      ["Hoja",               "Registros"],
      ["Egresados",          egresados.length],
      ["Historial Laboral",  historial.length],
      ["Postgrados",         postgrados.length],
      ["Usuarios",           usuarios.length],
      ["Audit Log (últimos 1000)", auditLogs.length],
    ];
    const wsRes = XLSX.utils.aoa_to_sheet(resumen);
    wsRes["!cols"] = [{wch:30},{wch:16}];
    XLSX.utils.book_append_sheet(wb, wsRes, "Resumen");

     const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    registrarAudit({
      idUsuario: session.idUsuario,
      accion:    "crear",
      entidad:   "egresado",
      entidadId: null,
      datosNuevos: {
        tipo:    "backup_completo_excel",
        fecha:   new Date().toISOString(),
        registros: {
          egresados: egresados.length,
          historial: historial.length,
          postgrados: postgrados.length,
          usuarios:  usuarios.length,
          auditLogs: auditLogs.length,
        },
      },
      ip: getIpFromRequest(_req),
    });

    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="backup_egresados_${fechaArchivo}.xlsx"`,
      },
    });
  } catch (e) {
    console.error("[backup]", e);
    return err("Error al generar el backup", 500);
  }
}