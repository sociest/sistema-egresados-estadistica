"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { egresadoSchema, type EgresadoInput } from "@/lib/validations";
import { MODALIDADES_TITULACION } from "@/lib/schema";
import { Save, X, GraduationCap, UserX, Globe, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  egresado?:    any;
  redirectTo?:  string;
  esAdmin?:     boolean;
  camposVacios?: string[];
}

// ── Sección de formulario con encabezado ──────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
        <span className="inline-block w-4 h-px bg-slate-600" />
        {title}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </section>
  );
}

export default function EgresadoForm({ egresado: eg, redirectTo, esAdmin = false, camposVacios = [] }: Props) {
  const router    = useRouter();
  const isEditing = !!eg;
  const [serverError, setServerError] = useState<string | null>(null);

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
        // Campos exclusivos Egresado
        inicioProceso:       eg.inicioProceso       ?? undefined,
        motivoNoTitulacion:  eg.motivoNoTitulacion  ?? "",
        planeaTitularse:     eg.planeaTitularse      ?? undefined,
        lugarResidencia:     eg.lugarResidencia      ?? "",
        fallecido:           eg.fallecido            ?? false,
      } : {
        tipo: "Titulado",
        fallecido: false,
      },
    });

  // Observar tipo para mostrar/ocultar secciones condicionalmente
  const tipoWatch           = watch("tipo");
  const anioTitulacionWatch = watch("anioTitulacion");
  const inicioProceso       = watch("inicioProceso");

  const esTitulado  = tipoWatch === "Titulado";
  const esEgresado  = tipoWatch === "Egresado";
  const tieneTitulacion = !!anioTitulacionWatch;

  const onSubmit = async (d: EgresadoInput) => {
    setServerError(null);
    const apellidos = [d.apellidoPaterno, d.apellidoMaterno].filter(Boolean).join(" ") || d.apellidos;
    const payload   = { ...d, apellidos };

    const url    = isEditing ? `/api/egresados/${eg.id}` : "/api/egresados";
    const method = isEditing ? "PUT" : "POST";
    const res    = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) { setServerError(json.error); return; }
    const dest = redirectTo ?? (isEditing ? `/egresados/${eg.id}` : `/egresados/${json.data?.id}`);
    router.push(dest);
    router.refresh();
  };

  const f = (hasErr?: boolean) => cn("field", hasErr && "field-err");
  const FieldLabel = ({ children, campo, required }: {
    children: React.ReactNode;
    campo?: string;
    required?: boolean;
  }) => (
    <label className="label flex items-center gap-2">
      <span>{children}{required && <span className="text-red-400 ml-1">*</span>}</span>
      {campo && camposVacios.includes(campo) && (
        <span
          className="text-xs px-1.5 py-0.5 rounded font-semibold ml-auto"
          style={{ background: "var(--naranja-light)", color: "var(--naranja)", border: "1px solid #fed7aa" }}
        >
          Completar
        </span>
      )}
    </label>
  );

  const fieldStyle = (campo?: string, hasErr?: boolean) =>
    cn("field", hasErr && "field-err", campo && camposVacios.includes(campo) && "border-orange-300");
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
      {serverError && <p className="error-box">{serverError}</p>}

      {/* ── SELECTOR DE TIPO — Bloque 0 ── */}
      <div>
        <label className="label">
          Tipo de persona <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(["Titulado", "Egresado"] as const).map(t => {
            const active = tipoWatch === t;
            return (
              <label
                key={t}
                className="relative flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-all"
                style={{
                  background: active ? (t === "Titulado" ? "rgba(0,165,168,0.10)" : "rgba(245,158,11,0.10)") : "var(--humo)",
                  border: `1.5px solid ${active ? (t === "Titulado" ? "var(--turquesa)" : "#f59e0b") : "var(--borde)"}`,
                }}
              >
                <input
                  type="radio"
                  value={t}
                  {...register("tipo")}
                  className="sr-only"
                />
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: active
                      ? (t === "Titulado" ? "rgba(0,165,168,0.20)" : "rgba(245,158,11,0.20)")
                      : "var(--borde)",
                  }}
                >
                  {t === "Titulado"
                    ? <GraduationCap className="w-4 h-4" style={{ color: active ? "var(--turquesa)" : "var(--placeholder)" }} />
                    : <UserX className="w-4 h-4" style={{ color: active ? "#f59e0b" : "var(--placeholder)" }} />
                  }
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
                  <div
                    className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: t === "Titulado" ? "var(--turquesa)" : "#f59e0b" }}
                  >
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </label>
            );
          })}
        </div>
        {errors.tipo && <p className="hint">{errors.tipo.message}</p>}
      </div>

      {/* ── Datos Personales ── */}
      <Section title="Datos Personales">
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

        <div>
          <label className="label">Fecha de Nacimiento <span className="text-red-400">*</span></label>
          <input {...register("fechaNacimiento")} type="date" className={f(!!errors.fechaNacimiento)} />
          {errors.fechaNacimiento && <p className="hint">{errors.fechaNacimiento.message}</p>}
        </div>

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
           <FieldLabel campo="celular">Celular</FieldLabel>
              <input {...register("celular")} type="tel" placeholder="7XXXXXXX" className={fieldStyle("celular")} />
        </div>

        <div>
          <FieldLabel campo="correo">Correo Electrónico</FieldLabel>
              <input {...register("correoElectronico")} type="email" className={fieldStyle("correo", !!errors.correoElectronico)} />
              {errors.correoElectronico && <p className="hint">{errors.correoElectronico.message}</p>}
        </div>

        <div>
          <label className="label">Nacionalidad</label>
          <input {...register("nacionalidad")} className="field" placeholder="Boliviana" />
        </div>

        <div>
          <label className="label">Estado Laboral</label>
          <div className="flex gap-2">
            {(["Empleado", "Desempleado", "Independiente"] as const).map(est => {
              const active = watch("estadoLaboral") === est;
              const colors: Record<string, string> = {
                Empleado:      "var(--verde)",
                Desempleado:   "#dc2626",
                Independiente: "#f59e0b",
              };
              return (
                <label
                  key={est}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all flex-1"
                  style={{
                    background: active ? `${colors[est]}18` : "var(--humo)",
                    border: `1.5px solid ${active ? colors[est] : "var(--borde)"}`,
                  }}
                >
                  <input
                    type="radio"
                    value={est}
                    {...register("estadoLaboral")}
                    className="sr-only"
                  />
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: active ? colors[est] : "var(--borde)" }}
                  />
                  <span className="text-xs font-medium" style={{ color: active ? colors[est] : "var(--gris-grafito)" }}>
                    {est}
                  </span>
                </label>
              );
            })}
          </div>
        </div>


      </Section>

      {/* ── Redes y Área — Bloque 0 (compartido) ── */}
      <Section title="Redes Sociales y Especialización">
        <div>
          <label className="label">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Facebook
            </span>
          </label>
          <input
            {...register("facebook")}
            className="field"
            placeholder="https://facebook.com/usuario"
          />
        </div>

        <div>
          <label className="label">
            <span className="flex items-center gap-1.5">
              <Linkedin className="w-3.5 h-3.5" />
              LinkedIn
            </span>
          </label>
          <input
            {...register("linkedin")}
            className="field"
            placeholder="https://linkedin.com/in/usuario"
          />
        </div>

        <div>
          <label className="label">Área de Especialización</label>
          <input
            {...register("areaEspecializacion")}
            className="field"
            placeholder="Ej: Estadística aplicada, Análisis de datos..."
          />
        </div>

        <div>
          <label className="label">Observaciones</label>
          <input
            {...register("observaciones")}
            className="field"
            placeholder="Notas adicionales (opcional)"
          />
        </div>

        <div className="md:col-span-2">
          <label className="label">Lugar de Residencia</label>
          <input
            {...register("lugarResidencia")}
            className="field"
            placeholder="Ej: La Paz, Cochabamba, Santa Cruz..."
          />
        </div>
      </Section>

      {/* ── Datos Académicos ── */}
      <section className="border-t border-slate-800 pt-6">
        <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
          <span className="inline-block w-4 h-px bg-slate-600" />
          Datos Académicos
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className="label">Año de Ingreso</label>
            <select
              {...register("anioIngreso", { setValueAs: v => v === "" ? null : Number(v) })}
              className="field"
            >
              <option value="">— Sin especificar —</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {errors.anioIngreso && <p className="hint">{errors.anioIngreso.message}</p>}
          </div>

          <div>
            <FieldLabel campo="anioEgreso">Año de Egreso</FieldLabel>
            <select
              {...register("anioEgreso", { setValueAs: v => v === "" ? null : Number(v) })}
              className={f(!!errors.anioEgreso)}
            >
              <option value="">— Sin especificar —</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {errors.anioEgreso && <p className="hint">{errors.anioEgreso.message}</p>}
          </div>

          <div>
            <label className="label">Promedio de Egreso</label>
            <input
              {...register("promedio", { setValueAs: v => v === "" ? null : Number(v) })}
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="Ej: 65.50"
              className={f(!!errors.promedio)}
            />
            {errors.promedio && <p className="hint">{errors.promedio.message}</p>}
          </div>

          {/* Año de titulación — obligatorio para Titulado, opcional para Egresado */}
          <div>
            <label className="label">
              Año de Titulación
              {esTitulado && <span className="text-red-400 ml-1">*</span>}
              {esEgresado && (
                <span className="text-slate-500 text-xs ml-1 font-normal">(si ya se tituló)</span>
              )}
            </label>
            <select
              {...register("anioTitulacion", { setValueAs: v => v === "" ? null : Number(v) })}
              className={f(!!errors.anioTitulacion)}
            >
              <option value="">
                {esTitulado ? "— Seleccionar año —" : "— No titulado / Sin especificar —"}
              </option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {errors.anioTitulacion && <p className="hint">{errors.anioTitulacion.message}</p>}
          </div>

          {/* Modalidad — aparece solo cuando hay año de titulación */}
          {tieneTitulacion && (
            <div>
              <label className="label">Modalidad de Titulación</label>
              <select {...register("modalidadTitulacion")} className="field">
                <option value="">— Seleccionar —</option>
                {MODALIDADES_TITULACION.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* ── Sección exclusiva para EGRESADOS (Bloque 0) ── */}
      {esEgresado && (
        <section
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1.5px solid rgba(245,158,11,0.25)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <UserX className="w-4 h-4" style={{ color: "#f59e0b" }} />
            <p
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: "#d97706" }}
            >
              Información adicional — Egresado sin título
            </p>
          </div>

          {/* ¿Inició proceso de titulación? */}
          <div>
            <label className="label">¿Inició proceso de titulación?</label>
            <div className="flex gap-3">
              {[
                { label: "Sí, está en proceso", value: "true" },
                { label: "No ha iniciado", value: "false" },
              ].map(opt => {
                const currentVal = inicioProceso;
                const isActive = (opt.value === "true" && currentVal === true) ||
                                 (opt.value === "false" && currentVal === false);
                return (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all flex-1"
                    style={{
                      background: isActive ? "rgba(245,158,11,0.15)" : "var(--humo)",
                      border: `1.5px solid ${isActive ? "#f59e0b" : "var(--borde)"}`,
                    }}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      {...register("inicioProceso", {
                        setValueAs: v => v === "" ? null : v === "true",
                      })}
                      className="sr-only"
                    />
                    <div
                      className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: isActive ? "#f59e0b" : "var(--placeholder)" }}
                    >
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#f59e0b" }} />
                      )}
                    </div>
                    <span className="text-sm" style={{ color: "var(--azul-pizarra)" }}>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ¿Planea titularse? */}
          <div>
            <label className="label">¿Planea titularse en el futuro?</label>
            <div className="flex gap-3">
              {[
                { label: "Sí",      value: "Si"      },
                { label: "No",      value: "No"      },
                { label: "No sabe", value: "No sabe" },
              ].map(opt => {
                const currentVal = watch("planeaTitularse");
                const isActive = currentVal === opt.value;
                return (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all flex-1"
                    style={{
                      background: isActive ? "rgba(245,158,11,0.15)" : "var(--humo)",
                      border: `1.5px solid ${isActive ? "#f59e0b" : "var(--borde)"}`,
                    }}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      {...register("planeaTitularse")}
                      className="sr-only"
                    />
                    <div
                      className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: isActive ? "#f59e0b" : "var(--placeholder)" }}
                    >
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#f59e0b" }} />
                      )}
                    </div>
                    <span className="text-sm" style={{ color: "var(--azul-pizarra)" }}>{opt.value}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Motivo de no titulación */}
          <div>
            <label className="label">Motivo de no titulación</label>
            <textarea
              {...register("motivoNoTitulacion")}
              rows={3}
              placeholder="Describe brevemente por qué no se ha titulado aún..."
              className="field resize-none"
            />
            <p className="text-xs mt-1" style={{ color: "var(--placeholder)" }}>
              Esta información es confidencial y solo visible para el administrador.
            </p>
          </div>
        </section>
      )}

      {/* ── Marcar como fallecido — solo admin ── */}
      {esAdmin && (
        <section
          className="rounded-2xl p-4"
          style={{
            background: "rgba(220,38,38,0.04)",
            border: "1px solid rgba(220,38,38,0.15)",
          }}
        >
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register("fallecido")}
              className="w-4 h-4 rounded"
              style={{ accentColor: "#dc2626" }}
            />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>
                Marcar como fallecido
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--placeholder)" }}>
                Este registro no aparecerá en el directorio ni en estadísticas de empleabilidad.
              </p>
            </div>
          </label>
        </section>
      )}

      {/* ── Acciones ── */}
      <div className="flex gap-3 pt-4 border-t border-slate-800">
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
