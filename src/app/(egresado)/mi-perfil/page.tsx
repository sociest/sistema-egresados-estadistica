// src/app/(egresado)/mi-perfil/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { egresado, historialLaboral, postgrado } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Pencil, Briefcase, Plus, BookOpen, GraduationCap, Clock } from "lucide-react";
import { fmtDate, fmtGestion } from "@/lib/utils";
import MiPerfilHistorial from "@/components/perfil/MiPerfilHistorial";
import MiPerfilPostgrados from "@/components/perfil/MiPerfilPostgrados";
import DirectorioToggle from "@/components/perfil/DirectorioToggle";
import SugerenciaForm from "@/components/perfil/SugerenciaForm";
import ContactoVerificacionModal from "@/components/perfil/ContactoVerificacionModal";

function calcularTiempoPrimerEmpleo(
  anioRef: number | null | undefined,
  primerFecha: string | null | undefined,
): { texto: string } | null {
  if (!anioRef || !primerFecha) return null;
  const diff = new Date(primerFecha).getFullYear() - anioRef;
  if (diff < 0) return null;
  return { texto: diff === 0 ? "Menos de 1 año" : diff === 1 ? "1 año" : `${diff} años` };
}

function calcularCompletitud(eg: any): { porcentaje: number; faltantes: string[] } {
  const campos = [
    { key: "correoElectronico",   label: "Correo electrónico" },
    { key: "celular",             label: "Celular" },
    { key: "lugarResidencia",     label: "Lugar de residencia" },
    { key: "anioEgreso",          label: "Año de egreso" },
    { key: "genero",              label: "Género" },
    { key: "areaEspecializacion", label: "Área de especialización" },
    { key: "nacionalidad",        label: "Nacionalidad" },
    { key: "promedio",            label: "Promedio de egreso" },
  ];
  const faltantes = campos.filter(c => !eg[c.key]).map(c => c.label);
  const porcentaje = Math.round(((campos.length - faltantes.length) / campos.length) * 100);
  return { porcentaje, faltantes };
}

export default async function MiPerfilPage() {
 const session = await getSession();
 if (!session || session.rol !== "egresado") redirect("/login");
 const { usuario: usuarioTable } = await import("@/lib/schema");
 const [usuarioData] = await db.select({
    correoVerificado:  usuarioTable.correoVerificado,
    celularVerificado: usuarioTable.celularVerificado,
  }).from(usuarioTable).where(eq(usuarioTable.id, session.idUsuario)).limit(1);
  
  // Si no tiene idEgresado en sesión, ir a registro-inicial
  // pero solo si realmente no existe en BD
  if (!session.idEgresado) redirect("/registro-inicial");

  const [eg] = await db.select().from(egresado)
    .where(eq(egresado.id, session.idEgresado)).limit(1);
  const { porcentaje: completitud, faltantes: camposFaltantes } = calcularCompletitud(eg);
  // Si el egresado no existe en BD, ir a registro-inicial
  if (!eg) redirect("/registro-inicial");
  const [historial, postgrados] = await Promise.all([
    db.select().from(historialLaboral)
      .where(eq(historialLaboral.idEgresado, eg.id))
      .orderBy(historialLaboral.fechaInicio),
    db.select().from(postgrado)
      .where(eq(postgrado.idEgresado, eg.id))
      .orderBy(postgrado.anioInicio),
  ]);
  const { derivarTituloAcademico } = await import("@/lib/schema");
  const tituloCalculado = derivarTituloAcademico(
    (eg.tipo as "Titulado" | "Egresado") ?? "Titulado",
    postgrados,
  );
  const primerEmpleo = historial.length > 0
    ? historial.reduce((a, b) => new Date(a.fechaInicio) < new Date(b.fechaInicio) ? a : b)
    : null;
  const tiempoPrimerEmpleo = calcularTiempoPrimerEmpleo(
    eg.anioTitulacion ?? eg.anioEgreso,
    primerEmpleo?.fechaInicio,
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-up">

      {/* ── Encabezado de perfil ── */}
       <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: "var(--turquesa-light)", color: "var(--turquesa-dark)", fontFamily: "'Source Serif 4', serif" }}
          >
            {(eg.apellidoPaterno ?? eg.nombres)[0]}{eg.nombres[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
              {[eg.apellidoPaterno, eg.apellidoMaterno].filter(Boolean).join(" ") || eg.nombres}, {eg.nombres}
            </h1>
            {tituloCalculado && (
              <p className="text-sm mt-0.5" style={{ color: "var(--gris-grafito)" }}>{tituloCalculado}</p>
            )}
          </div>
        </div>
         <Link href="/editar-perfil" className="btn-slate btn-sm shrink-0">
          <Pencil className="w-3.5 h-3.5" /> Editar perfil
        </Link>
      </div>
      <DirectorioToggle inicial={eg.mostrarEnDirectorio ?? false} />
       {/* ── Indicador de completitud ── */}
      {completitud < 100 && (
        <div className="card" style={{ background: "var(--blanco)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{ color: "var(--azul-pizarra)" }}>
              Completitud del perfil
            </p>
            <span
              className="text-sm font-bold"
              style={{ color: completitud >= 75 ? "var(--verde)" : completitud >= 50 ? "var(--turquesa)" : "var(--naranja)" }}
            >
              {completitud}%
            </span>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: "8px", background: "var(--borde)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${completitud}%`,
                background: completitud >= 75 ? "var(--verde)" : completitud >= 50 ? "var(--turquesa)" : "var(--naranja)",
              }}
            />
          </div>
          {camposFaltantes.length > 0 && (
            <p className="text-xs mt-2" style={{ color: "var(--gris-grafito)" }}>
              Faltan: {camposFaltantes.join(", ")}.{" "}
              <Link href="/editar-perfil" style={{ color: "var(--turquesa-dark)", fontWeight: 600 }}>
                Completar ahora →
              </Link>
            </p>
          )}
        </div>
      )}

      <ContactoVerificacionModal
        correo={eg.correoElectronico}
        celular={eg.celular ?? eg.telefono}
        correoVerificado={usuarioData?.correoVerificado ?? false}
        celularVerificado={usuarioData?.celularVerificado ?? false}
      />
      {/* ── Grid: datos personales + académicos ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Datos personales */}
        <div className="card">
          <h2 className="text-base font-bold mb-4" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
            Datos Personales
          </h2>
          <div className="space-y-3">
            {[
              { label: "CI", value: eg.ci, mono: true },
              { label: "Celular", value: eg.celular ?? eg.telefono },
              { label: "Correo", value: eg.correoElectronico },
              { label: "Género", value: eg.genero },
              { label: "Nacimiento", value: fmtDate(eg.fechaNacimiento) },
            ].map(({ label, value, mono }) => value ? (
              <div key={label} className="flex items-start justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide shrink-0" style={{ color: "var(--placeholder)" }}>
                  {label}
                </p>
                <p className={`text-sm text-right ${mono ? "font-mono" : ""}`} style={{ color: "var(--azul-pizarra)" }}>
                  {value}
                </p>
              </div>
            ) : null)}
          </div>
        </div>

        {/* Datos académicos */}
        <div className="card">
          <h2 className="text-base font-bold mb-4" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
            Datos Académicos
          </h2>
          <div className="space-y-3">
            {[
              { label: "Ingreso", value: eg.anioIngreso ? String(eg.anioIngreso) : null },
              { label: "Egreso", value: eg.anioEgreso ? String(eg.anioEgreso) : null },
              { label: "Titulación", value: eg.anioTitulacion ? String(eg.anioTitulacion) : null },
              { label: "Modalidad", value: eg.modalidadTitulacion },
              { label: "Promedio", value: eg.promedio ? String(eg.promedio) : null },
            ].map(({ label, value }) => value ? (
              <div key={label} className="flex items-start justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide shrink-0" style={{ color: "var(--placeholder)" }}>
                  {label}
                </p>
                <p className="text-sm text-right" style={{ color: "var(--azul-pizarra)" }}>{value}</p>
              </div>
            ) : null)}

            {/* RF-07 */}
            
          </div>
        </div>
      </div>

      {/* ── Historial laboral ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
              Historial Laboral
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--gris-grafito)" }}>
              {historial.length} experiencia(s) registrada(s)
            </p>
          </div>
          <Link href="/experiencia/nueva" className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" /> Agregar
          </Link>
        </div>

        {historial.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl border-2 border-dashed"
            style={{ borderColor: "var(--borde)", background: "var(--humo)" }}
          >
            <Briefcase className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--borde)" }} />
            <p className="font-semibold" style={{ color: "var(--gris-grafito)" }}>Sin experiencias registradas</p>
            <p className="text-sm mt-1" style={{ color: "var(--placeholder)" }}>Agrega tu primera experiencia laboral</p>
            <Link href="/experiencia/nueva" className="btn-primary btn-sm mt-4 inline-flex">
              <Plus className="w-3.5 h-3.5" /> Agregar ahora
            </Link>
          </div>
        ) : (
          <MiPerfilHistorial historial={historial} idEgresado={eg.id} />
        )}
      </div>

      {/* ── Estudios de Postgrado ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}>
              Estudios de Postgrado
            </h2>
            <p className="text-sm mt-0.5" style={{ color: "var(--gris-grafito)" }}>
              {postgrados.length} estudio(s) registrado(s)
            </p>
          </div>
        </div>

        {postgrados.length === 0 && (
          <div
            className="mb-4 text-center py-8 rounded-xl border-2 border-dashed"
            style={{ borderColor: "var(--borde)", background: "var(--humo)" }}
          >
            <BookOpen className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--borde)" }} />
            <p className="text-sm" style={{ color: "var(--placeholder)" }}>Sin estudios de postgrado registrados</p>
          </div>
        )}

        <MiPerfilPostgrados postgrados={postgrados} idEgresado={eg.id} />
        </div>
      

    </div>
  );
}
