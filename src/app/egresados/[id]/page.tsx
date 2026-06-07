import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { egresado, historialLaboral, postgrado } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Phone, MapPin, Calendar,
  Briefcase, Building2, GraduationCap, BookOpen, Clock,
} from "lucide-react";
import AdminLayout from "@/components/shared/AdminLayout";
import { fmtDate } from "@/lib/utils";
import HistorialExpandible from "@/components/egresados/HistorialExpandible";
import PostgradoExpandible from "@/components/egresados/PostgradoExpandible";
import Avatar from "@/components/shared/Avatar";

function calcularTiempoPrimerEmpleo(
  anioReferencia:    number | null | undefined,
  primerFechaEmpleo: string | null | undefined,
): { texto: string } | null {
  if (!anioReferencia || !primerFechaEmpleo) return null;
  const diff = new Date(primerFechaEmpleo).getFullYear() - anioReferencia;
  if (diff < 0) return null;
  const texto = diff === 0 ? "Menos de 1 año" : diff === 1 ? "1 año" : `${diff} años`;
  return { texto };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs shrink-0" style={{ color: "var(--placeholder)" }}>{label}</p>
      <p className="text-xs text-right font-medium" style={{ color: "var(--azul-pizarra)" }}>
        {children}
      </p>
    </div>
  );
}

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

  const { derivarTituloAcademico } = await import("@/lib/schema");
  const tituloCalculado = derivarTituloAcademico(
    (eg.tipo as "Titulado" | "Egresado") ?? "Titulado",
    postgrados,
  );

  const empleoActual = historial.find(h => h.fechaFin === null) ?? null;

  const primerEmpleo = historial.length > 0
    ? historial.reduce((a, b) =>
        new Date(a.fechaInicio) < new Date(b.fechaInicio) ? a : b)
    : null;

  const anioReferencia  = eg.anioTitulacion ?? eg.anioEgreso;
  const tiempoPrimerEmpleo = calcularTiempoPrimerEmpleo(anioReferencia, primerEmpleo?.fechaInicio);
  const etiquetaReferencia = eg.anioTitulacion ? "titulación" : "egreso";

  return (
    <AdminLayout correo={session.correo}>
      <div className="space-y-6 animate-fade-up">

        {/* ── Barra superior ── */}
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

            {/* Avatar + badges */}
            <div className="card text-center">
              <Avatar
                fotoUrl={eg.fotoUrl}
                nombres={eg.nombres}
                apellidoPaterno={eg.apellidoPaterno}
                size="xl"
                className="mx-auto mb-4"
              />
              <h2 className="font-bold text-lg"
                style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
                {[eg.apellidoPaterno, eg.apellidoMaterno].filter(Boolean).join(" ") || eg.nombres},{" "}
                {eg.nombres}
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--gris-grafito)" }}>CI: {eg.ci}</p>
              {eg.genero && (
                <p className="text-xs mt-0.5" style={{ color: "var(--placeholder)" }}>{eg.genero}</p>
              )}
              {tituloCalculado && (
                <p className="text-xs mt-1 italic" style={{ color: "var(--gris-grafito)" }}>
                  {tituloCalculado}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                <span className="badge" style={eg.tipo === "Titulado" ? {
                  background: "var(--turquesa-light)", color: "var(--turquesa-dark)", border: "1px solid #99e6e7",
                } : {
                  background: "var(--naranja-light)", color: "var(--naranja)", border: "1px solid #fed7aa",
                }}>
                  {eg.tipo}
                </span>
                <span className="badge" style={empleoActual ? {
                  background: "var(--verde-light)", color: "var(--verde)", border: "1px solid #86efac",
                } : {
                  background: "var(--humo)", color: "var(--placeholder)", border: "1px solid var(--borde)",
                }}>
                  {empleoActual ? "Empleado" : "Sin empleo actual"}
                </span>
                {eg.fallecido && (
                  <span className="badge" style={{ background: "#FEF2F2", color: "#dc2626", border: "1px solid #FECACA" }}>
                    Fallecido
                  </span>
                )}
              </div>
            </div>

            {/* Contacto */}
            <div className="card space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--placeholder)" }}>
                Contacto
              </p>
              {(eg.celular ?? eg.telefono) && (
                <div className="flex gap-3 text-sm">
                  <Phone className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--turquesa)" }} />
                  <span style={{ color: "var(--azul-pizarra)" }}>{eg.celular ?? eg.telefono}</span>
                </div>
              )}
              {eg.correoElectronico && (
                <div className="flex gap-3 text-sm">
                  <span className="mt-0.5" style={{ color: "var(--turquesa)" }}>✉</span>
                  <span className="break-all" style={{ color: "var(--azul-pizarra)" }}>
                    {eg.correoElectronico}
                  </span>
                </div>
              )}
              {eg.fechaNacimiento && (
                <div className="flex gap-3 text-sm">
                  <Calendar className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--turquesa)" }} />
                  <span style={{ color: "var(--azul-pizarra)" }}>{fmtDate(eg.fechaNacimiento)}</span>
                </div>
              )}
              {eg.lugarResidencia && (
                <div className="flex gap-3 text-sm">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--turquesa)" }} />
                  <span style={{ color: "var(--azul-pizarra)" }}>{eg.lugarResidencia}</span>
                </div>
              )}
              {eg.facebook && (
                <div className="flex gap-3 text-sm">
                  <span style={{ color: "var(--turquesa)" }}>f</span>
                  <a href={eg.facebook} target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--turquesa-dark)" }}>Facebook</a>
                </div>
              )}
              {eg.linkedin && (
                <div className="flex gap-3 text-sm">
                  <span style={{ color: "var(--turquesa)" }}>in</span>
                  <a href={eg.linkedin} target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--turquesa-dark)" }}>LinkedIn</a>
                </div>
              )}
            </div>

            {/* Académico */}
            <div className="card space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--placeholder)" }}>
                Académico
              </p>
              {eg.anioIngreso && <Row label="Ingreso">{eg.anioIngreso}</Row>}
              {eg.semestreIngreso && eg.anioIngreso && (
                <Row label="Semestre ingreso">{eg.semestreIngreso}</Row>
              )}
              {eg.anioEgreso  && <Row label="Egreso">{eg.anioEgreso}</Row>}
              {eg.semestreEgreso && eg.anioEgreso && (
                <Row label="Semestre egreso">{eg.semestreEgreso}</Row>
              )}
              {eg.anioTitulacion    && <Row label="Titulación">{eg.anioTitulacion}</Row>}
              {eg.modalidadTitulacion && <Row label="Modalidad">{eg.modalidadTitulacion}</Row>}
              {eg.promedio          && <Row label="Promedio">{eg.promedio}</Row>}
              {eg.areaEspecializacion && <Row label="Área">{eg.areaEspecializacion}</Row>}
              {eg.anioIngreso && eg.anioEgreso && (
                <Row label="Permanencia">{eg.anioEgreso - eg.anioIngreso} año(s)</Row>
              )}

              {tiempoPrimerEmpleo && (
                <div className="mt-2 pt-2.5 flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: "var(--naranja-light)", border: "1px solid #fed7aa" }}>
                  <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--naranja)" }} />
                  <p className="text-xs" style={{ color: "var(--naranja)" }}>
                    <span className="font-semibold">{tiempoPrimerEmpleo.texto}</span>{" "}
                    hasta primer empleo (desde {etiquetaReferencia})
                  </p>
                </div>
              )}

              {/* Campos exclusivos Egresado */}
              {eg.tipo === "Egresado" && (
                <div className="mt-2 pt-2.5 space-y-2" style={{ borderTop: "1px solid var(--borde)" }}>
                  {eg.inicioProceso !== null && eg.inicioProceso !== undefined && (
                    <Row label="Inició proceso">{eg.inicioProceso ? "Sí" : "No"}</Row>
                  )}
                  {eg.planeaTitularse && (
                    <Row label="Planea titularse">{eg.planeaTitularse}</Row>
                  )}
                  {eg.motivoNoTitulacion && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                        style={{ color: "var(--placeholder)" }}>
                        Motivo no titulación
                      </p>
                      <p className="text-xs" style={{ color: "var(--gris-grafito)" }}>
                        {eg.motivoNoTitulacion}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {eg.observaciones && (
                <div style={{ borderTop: "1px solid var(--borde)", paddingTop: "0.625rem", marginTop: "0.5rem" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                    style={{ color: "var(--placeholder)" }}>
                    Observaciones
                  </p>
                  <p className="text-xs" style={{ color: "var(--gris-grafito)" }}>
                    {eg.observaciones}
                  </p>
                </div>
              )}

              <p className="text-xs pt-2"
                style={{ color: "var(--placeholder)", borderTop: "1px solid var(--borde-suave)" }}>
                Registrado: {fmtDate(eg.fechaRegistro?.toISOString())}
              </p>
            </div>

            {/* Postgrados */}
            {postgrados.length > 0 && (
              <div className="card space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--placeholder)" }}>
                  Estudios de Postgrado
                </p>
                <PostgradoExpandible postgrados={postgrados} />
              </div>
            )}
          </div>

          {/* ── Columna derecha ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Estado laboral actual ── */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
                    Estado laboral actual
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--gris-grafito)" }}>
                    Derivado del historial laboral
                  </p>
                </div>
              </div>

              {empleoActual ? (
                <div className="rounded-xl p-4"
                  style={{ background: "rgba(26,107,26,0.05)", border: "1px solid #86efac" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "var(--verde-light)", color: "var(--verde)", border: "1px solid #86efac" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" /> Empleado actualmente
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--turquesa)" }} />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--placeholder)" }}>Cargo</p>
                        <p className="text-sm font-medium" style={{ color: "var(--azul-pizarra)" }}>
                          {empleoActual.cargo}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Building2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--turquesa)" }} />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--placeholder)" }}>Empresa</p>
                        <p className="text-sm font-medium" style={{ color: "var(--azul-pizarra)" }}>
                          {empleoActual.empresa}
                        </p>
                      </div>
                    </div>
                    {empleoActual.sectorTrabajo && (
                      <div className="flex items-start gap-2">
                        <span className="w-3.5 text-xs mt-0.5 shrink-0 text-center"
                          style={{ color: "var(--turquesa)" }}>◆</span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide"
                            style={{ color: "var(--placeholder)" }}>Sector</p>
                          <p className="text-sm" style={{ color: "var(--azul-pizarra)" }}>
                            {empleoActual.sectorTrabajo}
                          </p>
                        </div>
                      </div>
                    )}
                    {empleoActual.ciudadRegionTrabajo && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--turquesa)" }} />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide"
                            style={{ color: "var(--placeholder)" }}>Ciudad / Región</p>
                          <p className="text-sm" style={{ color: "var(--azul-pizarra)" }}>
                            {empleoActual.ciudadRegionTrabajo}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: "var(--humo)", border: "1px solid var(--borde)" }}>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "var(--humo)", color: "var(--placeholder)", border: "1px solid var(--borde)" }}>
                    Sin empleo actual
                  </span>
                  <p className="text-xs" style={{ color: "var(--placeholder)" }}>
                    No hay empleo activo registrado en el historial
                  </p>
                </div>
              )}
            </div>

            {/* ── Historial laboral ── */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold"
                    style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
                    Historial Laboral
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--gris-grafito)" }}>
                    {historial.length} registro(s)
                  </p>
                </div>
              </div>

              {historial.length === 0 ? (
                <div className="text-center py-10 rounded-xl border-2 border-dashed"
                  style={{ borderColor: "var(--borde)" }}>
                  <Briefcase className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--borde)" }} />
                  <p className="text-sm" style={{ color: "var(--placeholder)" }}>
                    Sin historial laboral registrado
                  </p>
                </div>
              ) : (
                <HistorialExpandible historial={historial} />
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}