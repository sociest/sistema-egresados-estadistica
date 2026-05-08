"use client";
// src/components/directorio/DirectorioClient.tsx
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, Briefcase, GraduationCap, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Egresado {
  id:                number;
  nombres:           string;
  apellidos:         string;
  apellidoPaterno:   string | null;
  apellidoMaterno:   string | null;
  tituloAcademico:   string | null;
  anioTitulacion:    number | null;
  correoElectronico: string | null;
  celular:           string | null;
  empleoActual:      string | null;
  ciudadActual:      string | null;
  sectorActual:      string | null;
}

interface Props {
  egresados:    Egresado[];
  total:        number;
  page:         number;
  totalPages:   number;
  searchParams: Record<string, string | undefined>;
}

const SECTOR_STYLE: Record<string, React.CSSProperties> = {
  Publico:       { background: "rgba(59,130,246,0.08)", color: "#2563eb",  border: "1px solid rgba(59,130,246,0.20)" },
  Privado:       { background: "rgba(139,92,246,0.08)", color: "#7c3aed",  border: "1px solid rgba(139,92,246,0.20)" },
  Independiente: { background: "rgba(245,158,11,0.08)", color: "#d97706",  border: "1px solid rgba(245,158,11,0.20)" },
  ONG:           { background: "rgba(16,185,129,0.08)", color: "#059669",  border: "1px solid rgba(16,185,129,0.20)" },
  Otro:          { background: "var(--humo)",            color: "var(--gris-grafito)", border: "1px solid var(--borde)" },
};

function EgresadoCard({ eg }: { eg: Egresado }) {
  const initials = `${(eg.apellidoPaterno ?? eg.apellidos)[0]}${eg.nombres[0]}`;
  const nombre   = `${eg.apellidoPaterno ?? eg.apellidos}${eg.apellidoMaterno ? ` ${eg.apellidoMaterno}` : ""}, ${eg.nombres}`;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--blanco)",
        border: "1px solid var(--borde)",
        boxShadow: "var(--shadow-sm)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--turquesa)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-turq)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--borde)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
      }}
    >
      {/* Avatar + nombre */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
          style={{
            background: "var(--turquesa-light)",
            color: "var(--turquesa-dark)",
            fontFamily: "'Source Serif 4', serif",
          }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p
            className="font-bold text-sm leading-tight truncate"
            style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}
          >
            {nombre}
          </p>
          {eg.tituloAcademico && (
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--gris-grafito)" }}>
              {eg.tituloAcademico}
            </p>
          )}
        </div>
      </div>

      {/* Empleo actual */}
      {eg.empleoActual && (
        <div className="flex items-start gap-2">
          <Briefcase className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--turquesa)" }} />
          <p className="text-xs leading-snug" style={{ color: "var(--azul-pizarra)" }}>
            {eg.empleoActual}
          </p>
        </div>
      )}

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5">
        {eg.ciudadActual && (
          <span
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
            style={{ background: "var(--humo)", color: "var(--gris-grafito)", border: "1px solid var(--borde)" }}
          >
            <MapPin className="w-3 h-3" /> {eg.ciudadActual}
          </span>
        )}
        {eg.sectorActual && SECTOR_STYLE[eg.sectorActual] && (
          <span
            className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium"
            style={SECTOR_STYLE[eg.sectorActual]}
          >
            {eg.sectorActual}
          </span>
        )}
      </div>

      {/* Contacto (solo correo, sin celular por privacidad) */}
      {eg.correoElectronico && (
        <a
          href={`mailto:${eg.correoElectronico}`}
          className="text-xs truncate transition-colors"
          style={{ color: "var(--turquesa-dark)" }}
        >
          {eg.correoElectronico}
        </a>
      )}
    </div>
  );
}

export default function DirectorioClient({ egresados, total, page, totalPages, searchParams }: Props) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState(searchParams.busqueda ?? "");

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const merged = { ...searchParams, ...overrides };
    const p = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    return `/directorio?${p}`;
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ busqueda: busqueda || undefined, page: undefined }));
  };

  return (
    <>
      {/* ── Hero ── */}
      <section
        className="py-16 text-center"
        style={{ background: `linear-gradient(135deg, var(--marino) 0%, #1a3555 100%)` }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
            style={{ background: "rgba(0,165,168,0.15)", color: "var(--turquesa)", border: "1px solid rgba(0,165,168,0.25)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--turquesa)" }} />
            Directorio de Egresados
          </span>
          <h1
            className="text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "'Source Serif 4', serif", letterSpacing: "-0.02em" }}
          >
            Estadísticos de la UMSA en acción
          </h1>
          <p className="text-lg mb-8" style={{ color: "rgba(255,255,255,0.65)" }}>
            {total} egresado{total !== 1 ? "s" : ""} comparte{total !== 1 ? "n" : ""} su perfil profesional
          </p>

          {/* Búsqueda */}
          <form onSubmit={onSearch} className="flex gap-2 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "rgba(255,255,255,0.40)" }}
              />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre…"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.08)",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  borderRadius: "0.75rem",
                  padding: "0.625rem 0.875rem 0.625rem 2.25rem",
                  color: "white",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => { setBusqueda(""); router.push(buildUrl({ busqueda: undefined, page: undefined })); }}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.50)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              style={{
                background: "var(--turquesa)", color: "white",
                border: "none", borderRadius: "0.75rem",
                padding: "0.625rem 1.25rem", fontWeight: 600,
                fontSize: "0.875rem", cursor: "pointer",
              }}
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* ── Filtros rápidos ── */}
      <section style={{ background: "var(--blanco)", borderBottom: "1px solid var(--borde)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--placeholder)" }}>
            Sector:
          </span>
          {["Publico", "Privado", "Independiente", "ONG"].map(s => (
            <button
              key={s}
              onClick={() => router.push(buildUrl({ sector: searchParams.sector === s ? undefined : s, page: undefined }))}
              className="text-xs px-3 py-1 rounded-full font-medium transition-all"
              style={searchParams.sector === s ? {
                ...SECTOR_STYLE[s],
                boxShadow: "0 0 0 2px currentColor",
              } : {
                background: "var(--humo)",
                color: "var(--gris-grafito)",
                border: "1px solid var(--borde)",
              }}
            >
              {s}
            </button>
          ))}
          {(searchParams.sector || searchParams.busqueda) && (
            <button
              onClick={() => router.push("/directorio")}
              className="text-xs px-3 py-1 rounded-full flex items-center gap-1"
              style={{ color: "var(--gris-grafito)" }}
            >
              <X className="w-3 h-3" /> Limpiar filtros
            </button>
          )}
        </div>
      </section>

      {/* ── Grid de egresados ── */}
      <section style={{ background: "var(--humo)" }} className="py-10">
        <div className="max-w-7xl mx-auto px-4">
          {egresados.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg font-semibold" style={{ color: "var(--gris-grafito)" }}>
                Sin resultados para tu búsqueda
              </p>
              <p className="text-sm mt-2" style={{ color: "var(--placeholder)" }}>
                Prueba con otros términos
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {egresados.map(eg => (
                  <EgresadoCard key={eg.id} eg={eg} />
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  {page > 1 && (
                    <a
                      href={buildUrl({ page: String(page - 1) })}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: "var(--blanco)",
                        border: "1px solid var(--borde)",
                        color: "var(--azul-pizarra)",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </a>
                  )}
                  <span className="text-sm" style={{ color: "var(--gris-grafito)" }}>
                    Página {page} de {totalPages}
                  </span>
                  {page < totalPages && (
                    <a
                      href={buildUrl({ page: String(page + 1) })}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: "var(--blanco)",
                        border: "1px solid var(--borde)",
                        color: "var(--azul-pizarra)",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── CTA para egresados no registrados ── */}
      <section style={{ background: "var(--blanco)", borderTop: "1px solid var(--borde)" }} className="py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: "var(--azul-pizarra)", fontFamily: "'Source Serif 4', serif" }}
          >
            ¿Eres egresado y no apareces?
          </h2>
          <p className="mb-6 text-sm" style={{ color: "var(--gris-grafito)" }}>
            Activa tu perfil en el directorio desde tu cuenta. Los perfiles más completos
            y actualizados aparecen primero — más visibles para empleadores y colegas.
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
            style={{ background: "var(--turquesa)", boxShadow: "var(--shadow-turq)" }}
          >
            Activar mi perfil en el directorio
          </a>
        </div>
      </section>
    </>
  );
}
