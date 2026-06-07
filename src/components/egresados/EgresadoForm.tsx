"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { egresadoSchema, type EgresadoInput } from "@/lib/validations";
import { MODALIDADES_TITULACION } from "@/lib/schema";
import {
  Save, X, GraduationCap, UserX, Globe, Linkedin, Lock,
  Briefcase, Building2, MapPin, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmpleoActual {
  cargo:               string;
  empresa:             string;
  sectorTrabajo:       string | null;
  ciudadRegionTrabajo: string | null;
}

interface Props {
  egresado?:     any;
  redirectTo?:   string;
  esAdmin?:      boolean;
  modo?:         "egresado" | "admin";
  camposVacios?: string[];
  empleoActual?: EmpleoActual | null;
}

// ── Sección con título ────────────────────────────────────────────────────────
function Section({
  title,
  subtitle,
  children,
  cols = 2,
}: {
  title:     string;
  subtitle?: string;
  children:  React.ReactNode;
  cols?:     1 | 2 | 3;
}) {
  const gridCols = { 1: "grid-cols-1", 2: "grid-cols-1 md:grid-cols-2", 3: "grid-cols-1 md:grid-cols-3" }[cols];
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          style={{ color: "var(--turquesa-dark)" }}>
          <span className="inline-block w-5 h-px" style={{ background: "var(--turquesa)" }} />
          {title}
        </p>
        {subtitle && (
          <p className="text-xs mt-0.5 ml-7" style={{ color: "var(--placeholder)" }}>{subtitle}</p>
        )}
      </div>
      <div className={`grid ${gridCols} gap-4`}>
        {children}
      </div>
    </section>
  );
}

// ── Campo de solo lectura ─────────────────────────────────────────────────────
function ReadonlyField({
  label,
  value,
  badge,
  badgeStyle,
}: {
  label:       string;
  value?:      string | null;
  badge?:      boolean;
  badgeStyle?: React.CSSProperties;
}) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        <Lock className="w-3 h-3" style={{ color: "var(--placeholder)" }} />
        {label}
      </label>
      {badge ? (
        <div className="flex items-center h-[42px] px-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
            style={badgeStyle}>
            {value ?? "—"}
          </span>
        </div>
      ) : (
        <div className="field flex items-center"
          style={{ opacity: 0.65, cursor: "not-allowed", userSelect: "none" }}>
          {value || <span style={{ color: "var(--placeholder)" }}>—</span>}
        </div>
      )}
    </div>
  );
}

// ── Sección de empleo actual (solo lectura) ───────────────────────────────────
function SeccionEmpleoActual({ empleo }: { empleo: EmpleoActual | null | undefined }) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          style={{ color: "var(--turquesa-dark)" }}>
          <span className="inline-block w-5 h-px" style={{ background: "var(--turquesa)" }} />
          Estado laboral actual
        </p>
        <p className="text-xs mt-0.5 ml-7" style={{ color: "var(--placeholder)" }}>
          Derivado del historial laboral — solo lectura
        </p>
      </div>

      {empleo ? (
        <div className="rounded-xl p-4 space-y-3"
          style={{ background: "rgba(26,107,26,0.06)", border: "1px solid #86efac" }}>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: "var(--verde-light)", color: "var(--verde)", border: "1px solid #86efac" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Empleado
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Briefcase className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--turquesa)" }} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--placeholder)" }}>Cargo</p>
                <p className="text-sm" style={{ color: "var(--azul-pizarra)" }}>{empleo.cargo}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--turquesa)" }} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--placeholder)" }}>Empresa</p>
                <p className="text-sm" style={{ color: "var(--azul-pizarra)" }}>{empleo.empresa}</p>
              </div>
            </div>
            {empleo.sectorTrabajo && (
              <div className="flex items-start gap-2">
                <span className="w-3.5 h-3.5 mt-0.5 shrink-0 text-xs flex items-center justify-center"
                  style={{ color: "var(--turquesa)" }}>◆</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--placeholder)" }}>Sector</p>
                  <p className="text-sm" style={{ color: "var(--azul-pizarra)" }}>{empleo.sectorTrabajo}</p>
                </div>
              </div>
            )}
            {empleo.ciudadRegionTrabajo && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--turquesa)" }} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--placeholder)" }}>Ciudad / Región</p>
                  <p className="text-sm" style={{ color: "var(--azul-pizarra)" }}>
                    {empleo.ciudadRegionTrabajo}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: "var(--humo)", border: "1px solid var(--borde)" }}>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: "var(--humo)", color: "var(--placeholder)", border: "1px solid var(--borde)" }}>
            Sin empleo actual
          </span>
          <p className="text-xs" style={{ color: "var(--placeholder)" }}>
            No hay empleo activo registrado en el historial laboral
          </p>
        </div>
      )}
    </section>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function EgresadoForm({
  egresado: eg,
  redirectTo,
  esAdmin = false,
  modo = "admin",
  camposVacios = [],
  empleoActual,
}: Props) {
  const router    = useRouter();
  const isEditing = !!eg;
  const [serverError, setServerError] = useState<string | null>(null);

  const isAdminMode = modo === "admin";

  const years = Array.from(
    { length: new Date().getFullYear() - 1997 },
    (_, i) => 1998 + i
  ).reverse();

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<EgresadoInput>({
      resolver: zodResolver(egresadoSchema),
      defaultValues: eg ? {
        tipo:                eg.tipo              ?? "Titulado",
        nombres:             eg.nombres,
        apellidoPaterno:     eg.apellidoPaterno    ?? "",
        apellidoMaterno:     eg.apellidoMaterno    ?? "",
        ci:                  eg.ci,
        nacionalidad:        eg.nacionalidad       ?? "",
        genero:              eg.genero             ?? undefined,
        correoElectronico:   eg.correoElectronico  ?? "",
        celular:             eg.celular ?? eg.telefono ?? "",
        fechaNacimiento:     eg.fechaNacimiento?.split("T")[0] ?? eg.fechaNacimiento ?? "",
        facebook:            eg.facebook           ?? "",
        linkedin:            eg.linkedin           ?? "",
        areaEspecializacion: eg.areaEspecializacion ?? "",
        observaciones:       eg.observaciones      ?? "",
        estadoLaboral:       eg.estadoLaboral      ?? undefined,
        anioIngreso:         eg.anioIngreso        ?? undefined,
        anioEgreso:          eg.anioEgreso         ?? undefined,
        anioTitulacion:      eg.anioTitulacion     ?? undefined,
        promedio:            eg.promedio ? parseFloat(eg.promedio) : undefined,
        modalidadTitulacion: eg.modalidadTitulacion ?? undefined,
        inicioProceso:       eg.inicioProceso       ?? undefined,
        motivoNoTitulacion:  eg.motivoNoTitulacion  ?? "",
        planeaTitularse:     eg.planeaTitularse      ?? undefined,
        lugarResidencia:     eg.lugarResidencia      ?? "",
        semestreIngreso:     eg.semestreIngreso      ?? "",
        semestreEgreso:      eg.semestreEgreso       ?? "",
        fallecido:           eg.fallecido            ?? false,
      } : {
        tipo:     "Titulado",
        fallecido: false,
      },
    });

  const tipoWatch     = watch("tipo");
  const esEgresado    = tipoWatch === "Egresado";
  const inicioProceso = watch("inicioProceso");

  const onSubmit = async (d: EgresadoInput) => {
    setServerError(null);
    const url    = isEditing ? `/api/egresados/${eg.id}` : "/api/egresados";
    const method = isEditing ? "PUT" : "POST";
    const res    = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error); return; }
    const dest = redirectTo ?? (isEditing ? `/egresados/${eg.id}` : `/egresados/${json.data?.id}`);
    router.push(dest);
    router.refresh();
  };

  const f = (hasErr?: boolean) => cn("field", hasErr && "field-err");

  const fieldStyle = (campo?: string, hasErr?: boolean) =>
    cn("field", hasErr && "field-err", campo && camposVacios.includes(campo) && "border-orange-300");

  const FieldLabel = ({ children, campo, required }: {
    children: React.ReactNode;
    campo?:   string;
    required?: boolean;
  }) => (
    <label className="label flex items-center gap-2">
      <span>
        {children}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
      {campo && camposVacios.includes(campo) && (
        <span className="text-xs px-1.5 py-0.5 rounded font-semibold ml-auto"
          style={{ background: "var(--naranja-light)", color: "var(--naranja)", border: "1px solid #fed7aa" }}>
          Completar
        </span>
      )}
    </label>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MODO EGRESADO — formulario restringido
  // ══════════════════════════════════════════════════════════════════════════
  if (!isAdminMode) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {serverError && <p className="error-box">{serverError}</p>}

        {/* Sección 1: Datos de solo lectura */}
        <Section title="Datos de identidad" subtitle="Estos campos solo pueden ser modificados por el administrador">
          <ReadonlyField label="CI" value={eg?.ci} />
          <ReadonlyField
            label="Tipo"
            value={eg?.tipo ?? "Titulado"}
            badge
            badgeStyle={eg?.tipo === "Titulado" ? {
              background: "var(--turquesa-light)", color: "var(--turquesa-dark)", border: "1px solid #99e6e7",
            } : {
              background: "var(--naranja-light)", color: "var(--naranja)", border: "1px solid #fed7aa",
            }}
          />
          <ReadonlyField label="Nombres" value={eg?.nombres} />
          <ReadonlyField label="Apellido Paterno" value={eg?.apellidoPaterno} />
          <ReadonlyField label="Apellido Materno" value={eg?.apellidoMaterno} />
          <div />
        </Section>

        <div style={{ borderTop: "1px solid var(--borde)" }} />

        {/* Sección 2: Contacto */}
        <Section title="Datos de contacto">
          <div>
            <FieldLabel campo="celular">Celular</FieldLabel>
            <input {...register("celular")} type="tel" placeholder="7XXXXXXX"
              className={fieldStyle("celular")} />
          </div>
        </Section>

        <div style={{ borderTop: "1px solid var(--borde)" }} />

        {/* Sección 3: Información personal */}
        <Section title="Información personal">
          <div>
            <label className="label">Género</label>
            <select {...register("genero")} className="field">
              <option value="">— Seleccionar —</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
              <option value="Prefiero no decir">Prefiero no decir</option>
            </select>
          </div>
          <div>
            <label className="label">Fecha de Nacimiento <span className="text-red-400">*</span></label>
            <input {...register("fechaNacimiento")} type="date"
              className={f(!!errors.fechaNacimiento)} />
            {errors.fechaNacimiento && <p className="hint">{errors.fechaNacimiento.message}</p>}
          </div>
          <div>
            <label className="label">Nacionalidad</label>
            <input {...register("nacionalidad")} className="field" placeholder="Boliviana" />
          </div>
          <div>
            <FieldLabel campo="lugarResidencia">Lugar de Residencia</FieldLabel>
            <input {...register("lugarResidencia")} className={fieldStyle("lugarResidencia")}
              placeholder="Ej: La Paz, Cochabamba..." />
          </div>
        </Section>

        <div style={{ borderTop: "1px solid var(--borde)" }} />

        {/* Sección 4: Redes */}
        <Section title="Redes sociales">
          <div>
            <label className="label flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Facebook
            </label>
            <input {...register("facebook")} className="field"
              placeholder="https://facebook.com/usuario" />
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <Linkedin className="w-3.5 h-3.5" /> LinkedIn
            </label>
            <input {...register("linkedin")} className="field"
              placeholder="https://linkedin.com/in/usuario" />
          </div>
        </Section>

        <div style={{ borderTop: "1px solid var(--borde)" }} />

        {/* Sección 5: Área y promedio */}
        <Section title="Información académica">
          <div className="md:col-span-2">
            <FieldLabel campo="areaEspecializacion">Área de Especialización</FieldLabel>
            <input {...register("areaEspecializacion")}
              className={fieldStyle("areaEspecializacion")}
              placeholder="Ej: Estadística aplicada, Análisis de datos..." />
          </div>
          <div>
            <FieldLabel campo="promedio">Promedio de Egreso</FieldLabel>
            <input {...register("promedio", { setValueAs: v => v === "" ? null : Number(v) })}
              type="number" min="0" max="100" step="0.01" placeholder="Ej: 65.50"
              className={fieldStyle("promedio", !!errors.promedio)} />
            {errors.promedio && <p className="hint">{errors.promedio.message}</p>}
          </div>
        </Section>

        {/* Sección extra para Egresados */}
        {esEgresado && (
          <>
            <div style={{ borderTop: "1px solid var(--borde)" }} />
            <Section title="Información adicional — Egresado sin título">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="label">¿Inició proceso de titulación?</label>
                  <div className="flex gap-3">
                    {[
                      { label: "Sí, está en proceso", value: "true" },
                      { label: "No ha iniciado",       value: "false" },
                    ].map(opt => {
                      const isActive =
                        (opt.value === "true" && inicioProceso === true) ||
                        (opt.value === "false" && inicioProceso === false);
                      return (
                        <label key={opt.value}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer flex-1"
                          style={{
                            background: isActive ? "rgba(245,158,11,0.15)" : "var(--humo)",
                            border: `1.5px solid ${isActive ? "#f59e0b" : "var(--borde)"}`,
                          }}>
                          <input type="radio" value={opt.value} className="sr-only"
                            {...register("inicioProceso", { setValueAs: v => v === "" ? null : v === "true" })} />
                          <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                            style={{ borderColor: isActive ? "#f59e0b" : "var(--placeholder)" }}>
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                          </div>
                          <span className="text-sm" style={{ color: "var(--azul-pizarra)" }}>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="label">¿Planea titularse?</label>
                  <div className="flex gap-3">
                    {[{ label: "Sí", value: "Si" }, { label: "No", value: "No" }, { label: "No sabe", value: "No sabe" }].map(opt => {
                      const isActive = watch("planeaTitularse") === opt.value;
                      return (
                        <label key={opt.value}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer flex-1"
                          style={{
                            background: isActive ? "rgba(245,158,11,0.15)" : "var(--humo)",
                            border: `1.5px solid ${isActive ? "#f59e0b" : "var(--borde)"}`,
                          }}>
                          <input type="radio" value={opt.value} {...register("planeaTitularse")} className="sr-only" />
                          <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                            style={{ borderColor: isActive ? "#f59e0b" : "var(--placeholder)" }}>
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                          </div>
                          <span className="text-sm" style={{ color: "var(--azul-pizarra)" }}>{opt.value}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="label">Motivo de no titulación</label>
                  <textarea {...register("motivoNoTitulacion")} rows={3}
                    placeholder="Describe brevemente..." className="field resize-none" />
                </div>
              </div>
            </Section>
          </>
        )}

        <div className="flex gap-3 pt-4" style={{ borderTop: "1px solid var(--borde)" }}>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? <><span className="spinner" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar cambios</>}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-ghost">
            <X className="w-4 h-4" /> Cancelar
          </button>
        </div>
      </form>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODO ADMIN — formulario completo con todas las secciones
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && <p className="error-box">{serverError}</p>}

      {/* ── Sección 1: Identificación ── */}
      <Section title="Identificación">
        {/* Selector de tipo */}
        <div className="md:col-span-2">
          <label className="label">Tipo <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            {(["Titulado", "Egresado"] as const).map(t => {
              const active = tipoWatch === t;
              return (
                <label key={t}
                  className="relative flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
                  style={{
                    background: active ? (t === "Titulado" ? "rgba(0,165,168,0.10)" : "rgba(245,158,11,0.10)") : "var(--humo)",
                    border: `1.5px solid ${active ? (t === "Titulado" ? "var(--turquesa)" : "#f59e0b") : "var(--borde)"}`,
                  }}>
                  <input type="radio" value={t} {...register("tipo")} className="sr-only" />
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: active ? (t === "Titulado" ? "rgba(0,165,168,0.20)" : "rgba(245,158,11,0.20)") : "var(--borde)" }}>
                    {t === "Titulado"
                      ? <GraduationCap className="w-4 h-4" style={{ color: active ? "var(--turquesa)" : "var(--placeholder)" }} />
                      : <UserX className="w-4 h-4" style={{ color: active ? "#f59e0b" : "var(--placeholder)" }} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: active ? "var(--azul-pizarra)" : "var(--gris-grafito)" }}>
                      {t}
                    </p>
                    <p className="text-xs" style={{ color: "var(--placeholder)" }}>
                      {t === "Titulado" ? "Obtuvo su título" : "Egresó sin titularse"}
                    </p>
                  </div>
                  {active && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: t === "Titulado" ? "var(--turquesa)" : "#f59e0b" }}>
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label">Nombres <span className="text-red-400">*</span></label>
          <input {...register("nombres")} className={f(!!errors.nombres)} />
          {errors.nombres && <p className="hint">{errors.nombres.message}</p>}
        </div>
        <div>
          <label className="label">CI <span className="text-red-400">*</span></label>
          <input {...register("ci")} className={f(!!errors.ci)} />
          {errors.ci && <p className="hint">{errors.ci.message}</p>}
        </div>
        <div>
          <label className="label">Apellido Paterno</label>
          <input {...register("apellidoPaterno")} className="field" />
        </div>
        <div>
          <label className="label">Apellido Materno</label>
          <input {...register("apellidoMaterno")} className="field" />
        </div>
      </Section>

      <div style={{ borderTop: "1px solid var(--borde)" }} />

      {/* ── Sección 2: Datos personales ── */}
      <Section title="Datos personales">
        <div>
          <label className="label">Género</label>
          <select {...register("genero")} className="field">
            <option value="">— Seleccionar —</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
            <option value="Prefiero no decir">Prefiero no decir</option>
          </select>
        </div>
        <div>
          <label className="label">Fecha de Nacimiento <span className="text-red-400">*</span></label>
          <input {...register("fechaNacimiento")} type="date" className={f(!!errors.fechaNacimiento)} />
          {errors.fechaNacimiento && <p className="hint">{errors.fechaNacimiento.message}</p>}
        </div>
        <div>
          <label className="label">Nacionalidad</label>
          <input {...register("nacionalidad")} className="field" placeholder="Boliviana" />
        </div>
        <div>
          <label className="label">Celular</label>
          <input {...register("celular")} type="tel" placeholder="7XXXXXXX" className="field" />
        </div>
        <div>
          <label className="label">Correo Electrónico</label>
          <input {...register("correoElectronico")} type="email"
            className={f(!!errors.correoElectronico)} />
          {errors.correoElectronico && <p className="hint">{errors.correoElectronico.message}</p>}
        </div>
        <div>
          <label className="label">Lugar de Residencia</label>
          <input {...register("lugarResidencia")} className="field"
            placeholder="Ej: La Paz, Cochabamba..." />
        </div>
      </Section>

      <div style={{ borderTop: "1px solid var(--borde)" }} />

      {/* ── Sección 3: Redes y especialización ── */}
      <Section title="Redes sociales y especialización">
        <div>
          <label className="label flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> Facebook
          </label>
          <input {...register("facebook")} className="field"
            placeholder="https://facebook.com/usuario" />
        </div>
        <div>
          <label className="label flex items-center gap-1.5">
            <Linkedin className="w-3.5 h-3.5" /> LinkedIn
          </label>
          <input {...register("linkedin")} className="field"
            placeholder="https://linkedin.com/in/usuario" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Área de Especialización</label>
          <input {...register("areaEspecializacion")} className="field"
            placeholder="Ej: Estadística aplicada, Machine Learning..." />
        </div>
      </Section>

      <div style={{ borderTop: "1px solid var(--borde)" }} />

      {/* ── Sección 4: Datos académicos ── */}
      <Section title="Datos académicos" cols={3}>
        <div>
          <label className="label">Año de Ingreso</label>
          <select {...register("anioIngreso", { setValueAs: v => v === "" ? null : Number(v) })}
            className="field">
            <option value="">— Sin especificar —</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Semestre Ingreso</label>
          <select {...register("semestreIngreso")} className="field">
            <option value="">— Sin especificar —</option>
            <option value="I">I</option>
            <option value="II">II</option>
          </select>
        </div>
        <div>
          <label className="label">Año de Egreso</label>
          <select {...register("anioEgreso", { setValueAs: v => v === "" ? null : Number(v) })}
            className={f(!!errors.anioEgreso)}>
            <option value="">— Sin especificar —</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {errors.anioEgreso && <p className="hint">{errors.anioEgreso.message}</p>}
        </div>
        <div>
          <label className="label">Semestre Egreso</label>
          <select {...register("semestreEgreso")} className="field">
            <option value="">— Sin especificar —</option>
            <option value="I">I</option>
            <option value="II">II</option>
          </select>
        </div>
        <div>
          <label className="label">
            Año de Titulación
            {tipoWatch === "Titulado" && <span className="text-red-400 ml-1">*</span>}
          </label>
          <select {...register("anioTitulacion", { setValueAs: v => v === "" ? null : Number(v) })}
            className={f(!!errors.anioTitulacion)}>
            <option value="">— Sin especificar —</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {errors.anioTitulacion && <p className="hint">{errors.anioTitulacion.message}</p>}
        </div>
        <div>
          <label className="label">Modalidad de Titulación</label>
          <select {...register("modalidadTitulacion")} className="field">
            <option value="">— Sin especificar —</option>
            {MODALIDADES_TITULACION.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Promedio de Egreso</label>
          <input {...register("promedio", { setValueAs: v => v === "" ? null : Number(v) })}
            type="number" min="0" max="100" step="0.01" placeholder="Ej: 65.50"
            className={f(!!errors.promedio)} />
          {errors.promedio && <p className="hint">{errors.promedio.message}</p>}
        </div>
      </Section>

      {/* ── Sección 5: Campos exclusivos Egresado ── */}
      {esEgresado && (
        <>
          <div style={{ borderTop: "1px solid var(--borde)" }} />
          <section className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
              style={{ color: "#d97706" }}>
              <UserX className="w-4 h-4" />
              Egresado sin título — información adicional
            </p>
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: "rgba(245,158,11,0.06)", border: "1.5px solid rgba(245,158,11,0.25)" }}>
              <div>
                <label className="label">¿Inició proceso de titulación?</label>
                <div className="flex gap-3">
                  {[{ label: "Sí, está en proceso", value: "true" }, { label: "No ha iniciado", value: "false" }].map(opt => {
                    const isActive =
                      (opt.value === "true" && inicioProceso === true) ||
                      (opt.value === "false" && inicioProceso === false);
                    return (
                      <label key={opt.value}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer flex-1"
                        style={{
                          background: isActive ? "rgba(245,158,11,0.15)" : "var(--humo)",
                          border: `1.5px solid ${isActive ? "#f59e0b" : "var(--borde)"}`,
                        }}>
                        <input type="radio" value={opt.value} className="sr-only"
                          {...register("inicioProceso", { setValueAs: v => v === "" ? null : v === "true" })} />
                        <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                          style={{ borderColor: isActive ? "#f59e0b" : "var(--placeholder)" }}>
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        </div>
                        <span className="text-sm" style={{ color: "var(--azul-pizarra)" }}>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="label">¿Planea titularse?</label>
                <div className="flex gap-3">
                  {[{ label: "Sí", value: "Si" }, { label: "No", value: "No" }, { label: "No sabe", value: "No sabe" }].map(opt => {
                    const isActive = watch("planeaTitularse") === opt.value;
                    return (
                      <label key={opt.value}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer flex-1"
                        style={{
                          background: isActive ? "rgba(245,158,11,0.15)" : "var(--humo)",
                          border: `1.5px solid ${isActive ? "#f59e0b" : "var(--borde)"}`,
                        }}>
                        <input type="radio" value={opt.value} {...register("planeaTitularse")} className="sr-only" />
                        <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                          style={{ borderColor: isActive ? "#f59e0b" : "var(--placeholder)" }}>
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        </div>
                        <span className="text-sm" style={{ color: "var(--azul-pizarra)" }}>{opt.value}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="label">Motivo de no titulación</label>
                <textarea {...register("motivoNoTitulacion")} rows={3}
                  placeholder="Describe brevemente por qué no se ha titulado aún..."
                  className="field resize-none" />
                <p className="text-xs mt-1" style={{ color: "var(--placeholder)" }}>
                  Esta información es confidencial.
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      <div style={{ borderTop: "1px solid var(--borde)" }} />

      {/* ── Sección 6: Estado laboral actual (solo lectura) ── */}
      <SeccionEmpleoActual empleo={empleoActual} />

      <div style={{ borderTop: "1px solid var(--borde)" }} />

      {/* ── Sección 7: Observaciones (solo admin) ── */}
      <Section title="Notas del administrador" subtitle="Solo visible para administradores">
        <div className="md:col-span-2">
          <label className="label">Observaciones</label>
          <textarea {...register("observaciones")} rows={4}
            placeholder="Notas internas sobre este egresado..."
            className="field resize-none" />
        </div>
      </Section>

      <div style={{ borderTop: "1px solid var(--borde)" }} />

      {/* ── Sección 8: Opciones sensibles ── */}
      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          style={{ color: "#dc2626" }}>
          <AlertTriangle className="w-4 h-4" />
          Opciones sensibles
        </p>
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.15)" }}>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" {...register("fallecido")}
              className="w-4 h-4 rounded" style={{ accentColor: "#dc2626" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>
                Marcar como fallecido
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--placeholder)" }}>
                Este registro no aparecerá en el directorio ni en estadísticas de empleabilidad activa.
              </p>
            </div>
          </label>
        </div>
      </section>

      {/* ── Acciones ── */}
      <div className="flex gap-3 pt-4" style={{ borderTop: "1px solid var(--borde)" }}>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting
            ? <><span className="spinner" /> Guardando...</>
            : <><Save className="w-4 h-4" /> {isEditing ? "Guardar cambios" : "Crear registro"}</>}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          <X className="w-4 h-4" /> Cancelar
        </button>
      </div>
    </form>
  );
}