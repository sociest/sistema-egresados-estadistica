"use client";
// src/components/egresados/BuscadorEgresados.tsx
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { MODALIDADES_TITULACION } from "@/lib/schema";

interface SP {
  busqueda?:       string;
  anioEgreso?:     string;
  anioTitulacion?: string;
  conEmpleo?:      string;
  genero?:         string;
  sector?:         string;
  ciudad?:         string;
  modalidad?:      string;
  tienePostgrado?: string;
  page?:           string;
  tipo?:           string;
}

interface Props {
  searchParams: SP;
  ciudades?:    string[];
}

const LABEL_MAP: Record<string, string> = {
  busqueda: "Búsqueda", anioEgreso: "Año egreso",
  anioTitulacion: "Año titulación", conEmpleo: "Empleo",
  genero: "Género", sector: "Sector", ciudad: "Ciudad",
  modalidad: "Modalidad", tienePostgrado: "Postgrado",
  tipo: "Tipo",
};
const BOOL_LABEL: Record<string, string> = { "true": "Sí", "false": "No" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "var(--gris-grafito)", marginBottom: "0.375rem" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function BuscadorEgresados({ searchParams, ciudades = [] }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const years = Array.from(
    { length: new Date().getFullYear() - 1997 }, (_, i) => 1998 + i
  ).reverse();

  const [form, setForm] = useState<SP>({
    busqueda:       searchParams.busqueda       ?? "",
    anioEgreso:     searchParams.anioEgreso     ?? "",
    anioTitulacion: searchParams.anioTitulacion ?? "",
    conEmpleo:      searchParams.conEmpleo      ?? "",
    genero:         searchParams.genero         ?? "",
    sector:         searchParams.sector         ?? "",
    ciudad:         searchParams.ciudad         ?? "",
    modalidad:      searchParams.modalidad      ?? "",
    tienePostgrado: searchParams.tienePostgrado ?? "",
    tipo:           searchParams.tipo ?? "",
  });

  const set = (k: keyof SP, v: string) => setForm(f => ({ ...f, [k]: v }));

  const buildParams = (override?: Partial<SP>) => {
    const merged = { ...form, ...override };
    const p = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v && k !== "page") p.set(k, v); });
    return p;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`${pathname}?${buildParams()}`);
  };

  const removeFilter = (k: keyof SP) => {
    set(k, "");
    const p = new URLSearchParams();
    Object.entries({ ...form, [k]: "" }).forEach(([fk, fv]) => {
      if (fv && fk !== "page") p.set(fk, fv);
    });
    router.push(`${pathname}?${p}`);
  };

  const onClear = () => {
    const empty: SP = {
      busqueda: "", anioEgreso: "", anioTitulacion: "",
      conEmpleo: "", genero: "", sector: "", ciudad: "", modalidad: "", tienePostgrado: "",
    };
    setForm(empty);
    router.push(pathname);
  };

  const activeFilters = Object.entries(form).filter(([k, v]) => k !== "page" && v);
  const activeCount   = activeFilters.length;

  // Estilos inline para no depender de clases Tailwind de variables CSS
  const fieldCss: React.CSSProperties = {
    width: "100%",
    background: "var(--humo)",
    border: "1.5px solid var(--borde)",
    borderRadius: "0.75rem",
    padding: "0.5rem 0.875rem",
    fontSize: "0.875rem",
    color: "var(--azul-pizarra)",
    outline: "none",
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="card" style={{ background: "var(--blanco)" }}>

        {/* ── Fila básica ── */}
        <div className="flex flex-wrap gap-3 items-end">

          {/* Texto libre */}
          <div style={{ flex: "1 1 220px", minWidth: "180px" }}>
            <Field label="Buscar">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--placeholder)" }} />
                <input
                  value={form.busqueda ?? ""}
                  onChange={e => set("busqueda", e.target.value)}
                  placeholder="Nombre, apellido o CI…"
                  style={{ ...fieldCss, paddingLeft: "2.25rem" }}
                />
              </div>
            </Field>
          </div>

          {/* Empleo */}
          <div style={{ minWidth: "140px" }}>
            <Field label="Estado Laboral">
              <select value={form.conEmpleo} onChange={e => set("conEmpleo", e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                <option value="true">Con empleo</option>
                <option value="false">Sin empleo</option>
              </select>
            </Field>
          </div>

          {/* Toggle filtros avanzados */}
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 0.875rem", borderRadius: "0.5rem",
              fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
              background: open ? "var(--turquesa-pale)" : "var(--humo)",
              border: `1.5px solid ${open ? "var(--turquesa)" : "var(--borde)"}`,
              color: open ? "var(--turquesa-dark)" : "var(--gris-grafito)",
              position: "relative",
              transition: "all 0.15s",
            }}
          >
            <SlidersHorizontal style={{ width: "0.875rem", height: "0.875rem" }} />
            Filtros
            {activeCount > 0 && (
              <span style={{
                position: "absolute", top: "-6px", right: "-6px",
                width: "18px", height: "18px", borderRadius: "9999px",
                background: "var(--turquesa)", color: "white",
                fontSize: "0.65rem", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {activeCount}
              </span>
            )}
            <ChevronDown style={{ width: "0.875rem", height: "0.875rem", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          {/* Acciones */}
          <button type="submit" className="btn-primary btn-sm">
            <Search className="w-3.5 h-3.5" /> Buscar
          </button>
          {activeCount > 0 && (
            <button type="button" onClick={onClear} className="btn-ghost btn-sm">
              <X className="w-3.5 h-3.5" /> Limpiar todo
            </button>
          )}
        </div>

        {/* ── Filtros avanzados ── */}
        {open && (
          <div
            className="mt-4 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            style={{ borderTop: "1px solid var(--borde)" }}
          >
            <Field label="Tipo">
              <select value={form.tipo ?? ""} onChange={e => set("tipo", e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                <option value="Titulado">Titulado</option>
                <option value="Egresado">Egresado (sin título)</option>
              </select>
            </Field>
            <Field label="Género">
              <select value={form.genero} onChange={e => set("genero", e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </Field>

            <Field label="Sector Laboral">
              <select value={form.sector} onChange={e => set("sector", e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                <option value="Publico">Público</option>
                <option value="Privado">Privado</option>
                <option value="Independiente">Independiente</option>
                <option value="ONG">ONG</option>
                <option value="Otro">Otro</option>
              </select>
            </Field>

            <Field label="Ciudad">
              {ciudades.length > 0 ? (
                <select value={form.ciudad} onChange={e => set("ciudad", e.target.value)} style={fieldCss}>
                  <option value="">Todas</option>
                  {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input
                  value={form.ciudad ?? ""}
                  onChange={e => set("ciudad", e.target.value)}
                  placeholder="Ej: La Paz"
                  style={fieldCss}
                />
              )}
            </Field>

            <Field label="Año de Egreso">
              <select value={form.anioEgreso} onChange={e => set("anioEgreso", e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>

            <Field label="Año de Titulación">
              <select value={form.anioTitulacion} onChange={e => set("anioTitulacion", e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>

            <Field label="Modalidad">
              <select value={form.modalidad} onChange={e => set("modalidad", e.target.value)} style={fieldCss}>
                <option value="">Todas</option>
                {MODALIDADES_TITULACION.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>

            <Field label="Postgrado">
              <select value={form.tienePostgrado} onChange={e => set("tienePostgrado", e.target.value)} style={fieldCss}>
                <option value="">Todos</option>
                <option value="true">Con postgrado</option>
                <option value="false">Sin postgrado</option>
              </select>
            </Field>
          </div>
        )}

        {/* ── Chips activos ── */}
        {activeCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map(([k, v]) => (
              <span
                key={k}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  background: "var(--turquesa-pale)",
                  color: "var(--turquesa-dark)",
                  border: "1px solid rgba(0,165,168,0.20)",
                }}
              >
                <span style={{ color: "var(--placeholder)", fontWeight: 400 }}>
                  {LABEL_MAP[k] ?? k}:
                </span>
                {BOOL_LABEL[v ?? ""] ?? v}
                <button
                  type="button"
                  onClick={() => removeFilter(k as keyof SP)}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <X style={{ width: "0.75rem", height: "0.75rem" }} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}
