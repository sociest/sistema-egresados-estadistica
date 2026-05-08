import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { egresado, historialLaboral, postgrado } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Phone, MapPin, Calendar,
  Briefcase, Building2, GraduationCap, BookOpen, Clock, TrendingUp,
} from "lucide-react";
import AdminLayout from "@/components/shared/AdminLayout";
import { cn, fmtDate } from "@/lib/utils";

// ── RF-07: tiempo hasta primer empleo expresado en tramos de año ──────────────
function calcularTiempoPrimerEmpleo(
  anioReferencia: number | null | undefined,  // anioTitulacion o anioEgreso
  primerFechaEmpleo: string | null | undefined,
): { texto: string; anios: number } | null {
  if (!anioReferencia || !primerFechaEmpleo) return null;
  const anioEmpleo = new Date(primerFechaEmpleo).getFullYear();
  const diff = anioEmpleo - anioReferencia;
  if (diff < 0) return null; // empleo antes de referencía — dato inconsistente

  let texto: string;
  if (diff === 0)      texto = "Menos de 1 año";
  else if (diff === 1) texto = "1 año";
  else                 texto = `${diff} años`;

  return { texto, anios: diff };
}

const ESTADO_BADGE: Record<string, string> = {
  "En curso":   "badge-blue",
  "Finalizado": "badge-green",
  "Abandonado": "badge-slate",
};

export default async function EgresadoDetallePage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.rol !== "admin") redirect("/login");

  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const [eg] = await db.select().from(egresado).where(eq(egresado.id, id)).limit(1);
  if (!eg) notFound();

  const [historial, postgrados] = await Promise.all([
    db.select().from(historialLaboral)
      .where(eq(historialLaboral.idEgresado, id))
      .orderBy(historialLaboral.fechaInicio),
    db.select().from(postgrado)
      .where(eq(postgrado.idEgresado, id))
      .orderBy(postgrado.anioInicio),
  ]);

  // Calcular título académico desde postgrados
  const { derivarTituloAcademico } = await import("@/lib/schema");
  const tituloCalculado = derivarTituloAcademico(
    (eg.tipo as "Titulado" | "Egresado") ?? "Titulado",
    postgrados,
  );

  const empleoActual = historial.find(h => h.fechaFin === null);

  // Primer empleo cronológicamente
  const primerEmpleo = historial.length > 0
    ? historial.reduce((a, b) =>
        new Date(a.fechaInicio) < new Date(b.fechaInicio) ? a : b
      )
    : null;

  // RF-07: usar anioTitulacion si existe, si no anioEgreso
  const anioReferencia = eg.anioTitulacion ?? eg.anioEgreso;
  const tiempoPrimerEmpleo = calcularTiempoPrimerEmpleo(
    anioReferencia,
    primerEmpleo?.fechaInicio,
  );
  const etiquetaReferencia = eg.anioTitulacion ? "titulación" : "egreso";

  return (
    <AdminLayout correo={session.correo}>
      <div className="space-y-6 animate-fade-up">
        <div className="flex items-center gap-3">
          <Link href="/egresados" className="btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link href={`/egresados/${id}/editar`} className="btn-slate btn-sm ml-auto">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Columna izquierda ── */}
          <div className="space-y-4">

            {/* Avatar + estado */}
            <div className="card text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary-600/20 border-2 border-primary-500/30
                              flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-300 text-2xl font-bold">
                  {(eg.apellidoPaterno ?? eg.apellidos)[0]}{eg.nombres[0]}
                </span>
              </div>
              <h2 className="text-white font-bold text-lg">
                {eg.apellidoPaterno ?? eg.apellidos}
                {eg.apellidoMaterno ? ` ${eg.apellidoMaterno}` : ""}, {eg.nombres}
              </h2>
              <p className="text-slate-500 text-sm mt-1">CI: {eg.ci}</p>
              {eg.genero && <p className="text-slate-600 text-xs mt-0.5">{eg.genero}</p>}
              {tituloCalculado && (
                <p className="text-slate-400 text-xs mt-1 italic">{tituloCalculado}</p>
              )}
              <div className="mt-3">
                <span className={cn("badge", empleoActual ? "badge-green" : "badge-slate")}>
                  {empleoActual ? "Empleado actualmente" : "Sin empleo actual"}
                </span>
              </div>
            </div>

            {/* Contacto */}
            <div className="card space-y-3">
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Contacto</p>
              {(eg.celular ?? eg.telefono) && (
                <div className="flex gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <span className="text-slate-300">{eg.celular ?? eg.telefono}</span>
                </div>
              )}
              {eg.correoElectronico && (
                <div className="flex gap-3 text-sm">
                  <span className="text-slate-500 text-xs mt-0.5">✉</span>
                  <span className="text-slate-300 break-all">{eg.correoElectronico}</span>
                </div>
              )}
              {eg.direccion && (
                <div className="flex gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <span className="text-slate-300">{eg.direccion}</span>
                </div>
              )}
              <div className="flex gap-3 text-sm">
                <Calendar className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <span className="text-slate-300">{fmtDate(eg.fechaNacimiento)}</span>
              </div>
            </div>

            {/* Académico */}
            <div className="card space-y-2.5">
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Académico</p>

              {eg.modalidadTitulacion && (
                <Row label="Modalidad">{eg.modalidadTitulacion}</Row>
              )}
              {eg.anioIngreso && (
                <Row label="Ingreso">{eg.anioIngreso}</Row>
              )}
              {eg.anioEgreso && (
                <Row label="Egreso">{eg.anioEgreso}</Row>
              )}
              {eg.anioTitulacion && (
                <Row label="Titulación">{eg.anioTitulacion}</Row>
              )}
              {eg.promedio && (
                <Row label="Promedio">{eg.promedio}</Row>
              )}
              {/* RF-03: tiempo de permanencia */}
              {eg.anioIngreso && eg.anioEgreso && (
                <Row label="Permanencia">{eg.anioEgreso - eg.anioIngreso} año(s)</Row>
              )}

              {/* RF-07: tiempo hasta primer empleo */}
              {tiempoPrimerEmpleo !== null && (
                <div className="mt-2 pt-2.5 border-t border-slate-800">
                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-500 text-xs">
                        1er empleo desde {etiquetaReferencia}
                      </p>
                      <p className="text-amber-400 font-semibold text-sm">
                        {tiempoPrimerEmpleo.texto}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-slate-700 text-xs pt-2 border-t border-slate-800/50">
                Registrado: {fmtDate(eg.fechaRegistro?.toISOString())}
              </p>
            </div>

            {/* Postgrados */}
            {postgrados.length > 0 && (
              <div className="card space-y-3">
                <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">
                  Estudios de Postgrado
                </p>
                {postgrados.map(p => (
                  <div key={p.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{p.tipo}</p>
                      <p className="text-slate-400 text-xs">{p.institucion}</p>
                      <p className="text-slate-600 text-xs">
                        {p.pais} · {p.anioInicio}{p.anioFin ? `–${p.anioFin}` : ""}
                      </p>
                      <span className={cn("badge mt-1", ESTADO_BADGE[p.estado] ?? "badge-slate")}>
                        {p.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* ── Historial laboral ── */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-bold">Historial Laboral</h3>
                  <p className="text-slate-500 text-xs mt-0.5">{historial.length} registro(s)</p>
                </div>
              </div>

              {historial.length === 0 ? (
                <div className="text-center py-10">
                  <Briefcase className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-600 text-sm">Sin historial laboral registrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historial.map(h => (
                    <div key={h.id} className={cn("rounded-xl p-4 border",
                      h.fechaFin === null
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-slate-800/40 border-slate-700/50")}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-semibold text-sm">{h.cargo}</p>
                            <p className="text-slate-400 text-sm">{h.empresa}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                              {h.area && (
                                <span className="text-slate-500 text-xs">{h.area}</span>
                              )}
                              {h.ciudadRegionTrabajo && (
                                <span className="text-slate-500 text-xs flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3" />{h.ciudadRegionTrabajo}
                                </span>
                              )}
                              {h.sectorTrabajo && (
                                <span className={cn(
                                  "text-xs px-1.5 py-0.5 rounded-md font-medium",
                                  h.sectorTrabajo === "Publico"  ? "bg-blue-500/10 text-blue-400" :
                                  h.sectorTrabajo === "Privado"  ? "bg-purple-500/10 text-purple-400" :
                                  "bg-slate-700 text-slate-400"
                                )}>
                                  {h.sectorTrabajo}
                                </span>
                              )}
                              {h.tipoContrato && (
                                <span className="text-slate-600 text-xs">{h.tipoContrato}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {h.fechaFin === null
                            ? <span className="badge badge-green">Actual</span>
                            : <span className="badge badge-slate">Finalizado</span>}
                          <p className="text-slate-600 text-xs mt-1.5">
                            {fmtDate(h.fechaInicio)} — {h.fechaFin ? fmtDate(h.fechaFin) : "presente"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Helper inline para filas del card académico
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-slate-300 text-sm">
      <span className="text-slate-500">{label}: </span>{children}
    </p>
  );
}
